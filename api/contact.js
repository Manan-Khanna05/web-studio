/* ════════════════════════════════════════════════════════════
   POST /api/contact  —  Vercel serverless function (Node runtime)
   ────────────────────────────────────────────────────────────
   Validates an enquiry, drops obvious spam, rate-limits by IP and
   delivers the message by email via Resend.

   Required env var (Vercel → Settings → Environment Variables):
     RESEND_API_KEY   your key from resend.com  (free tier is plenty)

   Optional:
     CONTACT_TO       where enquiries land   (default below)
     CONTACT_FROM     verified sender address on your Resend domain
                      (default uses Resend's shared onboarding sender,
                       which works immediately with no DNS setup)

   Without RESEND_API_KEY this returns 503 and the front-end quietly
   falls back to opening the visitor's mail app — nothing is lost.
   ════════════════════════════════════════════════════════════ */

const TO       = process.env.CONTACT_TO   || 'itsmanan.dev@gmail.com';
const FROM     = process.env.CONTACT_FROM || 'Kiln Studio <onboarding@resend.dev>';
const MAX_PER_HOUR = 5;

/* In-memory, per-instance rate limit. Resets when the function goes
   cold, so it's a speed bump for bots, not a hard guarantee. For
   stronger limits put Vercel KV or Upstash behind this. */
const HITS = new Map();

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ── rate limit ─────────────────────────────────────── */
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (HITS.get(ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= MAX_PER_HOUR) {
    return res.status(429).json({ error: 'TOO MANY ENQUIRIES — PLEASE EMAIL US DIRECTLY.' });
  }

  /* ── parse + validate ───────────────────────────────── */
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name = '', email = '', budget = '', message = '', company = '' } = body || {};

  /* honeypot: only a bot fills a field humans never see. Return 200 so
     the bot thinks it worked and doesn't retry. */
  if (String(company).trim()) return res.status(200).json({ ok: true });

  const errors = [];
  if (!String(name).trim())                          errors.push('name');
  if (!/^\S+@\S+\.\S+$/.test(String(email).trim()))  errors.push('email');
  if (String(message).trim().length < 10)            errors.push('message');
  if (String(name).length > 120 || String(message).length > 5000) errors.push('length');
  if (errors.length) return res.status(400).json({ error: 'Invalid submission', fields: errors });

  /* ── deliver ────────────────────────────────────────── */
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Mail provider not configured' });

  const clean = {
    name: escapeHtml(name).slice(0, 120),
    email: escapeHtml(email).slice(0, 200),
    budget: escapeHtml(budget).slice(0, 60),
    message: escapeHtml(message).slice(0, 5000)
  };

  const html = `
    <h2 style="font-family:sans-serif;margin:0 0 16px">New project enquiry</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td><b>${clean.name}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><a href="mailto:${clean.email}">${clean.email}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Budget</td><td>${clean.budget || '—'}</td></tr>
    </table>
    <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;margin-top:20px;padding-top:16px;border-top:1px solid #eee">${clean.message}</p>
    <p style="font-family:sans-serif;font-size:12px;color:#999;margin-top:24px">Sent from the Kiln Studio website · ${new Date().toISOString()}</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: String(email).trim(),
        subject: `New enquiry — ${clean.name} (${clean.budget || 'budget n/a'})`,
        html
      })
    });

    if (!r.ok) {
      console.error('Resend rejected the message:', r.status, await r.text());
      return res.status(502).json({ error: 'Could not send right now' });
    }

    HITS.set(ip, [...recent, now]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact endpoint failed:', err);
    return res.status(502).json({ error: 'Could not send right now' });
  }
};
