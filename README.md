# KILN — Studio Site

A dark, editorial one-page site built to win freelance clients, plus a small
serverless backend for the enquiry form.

Front end is plain HTML/CSS/JS — no build step, no dependencies, no framework.

```
index.html        all content / copy
css/style.css     all styling (brand tokens at the top)
js/main.js        cursor, menu, parallax, magnetics, counters, form
api/contact.js    serverless enquiry endpoint (Vercel)
```

## Run it locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173

Note: `/api/contact` does **not** run under `http.server` — it's a Vercel
function. Locally the form gets a 404 and falls back to opening your mail app,
which is the intended behaviour. To run the API locally, use `vercel dev`.

## The backend

`POST /api/contact` takes `{ name, email, budget, message }` and emails it to you.

It handles:

- **Validation** — email format, message length, field caps
- **Spam honeypot** — a hidden `company` field; if filled, the request is
  silently accepted and dropped so the bot doesn't retry
- **Rate limiting** — 5 enquiries per IP per hour
- **HTML escaping** — submitted text can't inject markup into your inbox
- **Graceful degradation** — with no mail provider configured it returns 503
  and the front end opens the visitor's mail app instead. No enquiry is lost.

### Turning on real email delivery

1. Sign up free at [resend.com](https://resend.com) and create an API key.
2. In Vercel → your project → Settings → Environment Variables, add:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your key (required) |
   | `CONTACT_TO` | where enquiries land (optional) |
   | `CONTACT_FROM` | verified sender on your domain (optional) |

3. Redeploy. That's it — enquiries now arrive in your inbox with the sender's
   address as reply-to, so you can just hit reply.

Until `RESEND_API_KEY` is set, the form still works via the mail-app fallback.

## Make it yours

| # | What | Where |
|---|------|-------|
| 1 | Brand name `KILN` | `index.html` — nav `.brand`, `<title>`, footer `.footer__big`, preloader |
| 2 | Email + WhatsApp | `index.html` `#contact` + menu footer; `MAILTO` in `js/main.js`; `CONTACT_TO` env var |
| 3 | Social links (`href="#"`) | `index.html` — menu footer + contact side |
| 4 | Prices & packages | `index.html` `#pricing` |
| 5 | Real project names | `index.html` `#work` |
| 6 | Accent colour | `css/style.css` → `--accent: #d3fd50` |

### Renaming the studio

The wordmark appears in a handful of places. To swap it:

```bash
git -C D:/Web grep -n "KILN"
```

Then replace in `index.html`, `js/main.js` (header comment) and this file.

## Adding real portfolio images

Each project shows a gradient placeholder on hover. Drop images in `assets/`
and change the `previews` object in `js/main.js`:

```js
const previews = {
  1: 'url(assets/work-1.jpg)',
  2: 'url(assets/work-2.jpg)',
};
```

The same object feeds the image reveal behind the fullscreen menu links.

## Interaction reference

| Effect | Where it lives |
|---|---|
| Preloader counter → curtain wipe | `.curtain` + `curtain-up` class |
| Dot-matrix grid + animated grain | `.bg-grid`, `.bg-noise` |
| Custom cursor with contextual labels | `#cursor`, `data-cursor="…"` |
| Magnetic buttons | `data-magnetic` attribute |
| Parallax drift | `data-parallax="0.06"` attribute |
| Scroll reveals | `.reveal` class |
| Count-up stats | `data-count="40"` attribute |
| Portfolio preview follows cursor | `.project[data-img]` |

Everything respects `prefers-reduced-motion`.

## Before sending this to a client

- [ ] Replace the placeholder stats with your real numbers
- [ ] Add 3–5 real projects, even personal ones
- [ ] Set the WhatsApp number in `wa.me/91XXXXXXXXXX` format
- [ ] Fill in the social links
- [ ] Set `RESEND_API_KEY` so enquiries reach your inbox
- [ ] Add an OG preview image for WhatsApp/LinkedIn shares
- [ ] Check the studio name is free before buying a domain

The favicon is an inline SVG data URI in `<head>`. Swap it for
`<link rel="icon" href="assets/favicon.png">` if you'd rather use an image.
