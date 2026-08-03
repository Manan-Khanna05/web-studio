# KILN — Studio Site

A dark, editorial one-page site built to win freelance clients, plus a small
serverless backend for the enquiry form.

Front end is plain HTML/CSS/JS — no build step, no dependencies, no framework.

```
index.html            all content / copy
css/style.css         all styling (design tokens at the top)
js/main.js            cursor, menu, parallax, magnetics, counters, form
api/contact.js        serverless enquiry endpoint (Vercel)
assets/bg-skyline.avif  hero background photograph (34 KB)
```

## Design system

Premium glassmorphism — the Apple VisionOS / Linear / Arc visual language.

**The building photo lives in the hero and nowhere else.** It stays sharp;
the frosted panel on top is what blurs it, so the architecture still reads
around the panel edges. Below the hero the page is clean near-black.

| Layer | What it does |
|---|---|
| `.hero__photo` | Sharp skyline, 40s slow zoom, hero-only |
| `.hero__shade` | Gradient + vignette so the panel edge has contrast |
| `.hero__panel` | `blur(28px)` frosted panel — the actual glass effect |
| `.spec__col` | 3 cards overlapping the panel's lower edge |
| `.bg-glow` | Two very soft accent washes, page-wide |
| `.bg-grid` / `.bg-noise` | Dot grid and animated film grain |

**Glass** — every panel uses the same recipe, exposed as tokens:

```css
background: rgba(255,255,255,.08);
backdrop-filter: blur(30px) saturate(180%);
border: 1px solid rgba(255,255,255,.12);
box-shadow: 0 8px 32px rgba(0,0,0,.25), inset 0 1px rgba(255,255,255,.12);
border-radius: 28px;
```

Real `backdrop-filter` is used only where there is imagery behind it —
the navbar, hero panel, hero spec cards and fullscreen menu. Everywhere
else the page is flat dark, so panels use a gradient that reads
identically at zero GPU cost. That keeps the blurred-element count at 11
instead of 40+.

**Palette** — `--bg #06070A` · `--accent #00E676` · `--accent-2 #3B82F6` ·
text white · secondary text `#C9CED6`. Change `--accent` to rebrand.

**Motion** — everything eases on `cubic-bezier(.16,1,.3,1)`.

### Swapping the background image

Drop a new photo at `assets/bg-skyline.avif` (or change the `url()` in
`.hero__photo`). The photo stays sharp, so use something reasonably crisp — but it sits
behind a dark gradient, so 1600px wide is plenty. Landscapes, skylines and
architecture read best.

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
| 6 | Accent colour | `css/style.css` → `--accent: #00E676` |

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
| Navbar slides down on load | `body.loaded .nav` |
| Hero photo slow zoom | `.hero__photo` |
| Scroll progress rail | `.progress` |
| Custom cursor with contextual labels | `#cursor`, `data-cursor="…"` |
| Magnetic buttons | `data-magnetic` attribute |
| Cursor-follow depth on hero cards | `.spec__col`, 10/13/16px |
| Radial highlight tracking cursor in buttons | `--hx` / `--hy` on `.btn` |
| Glass shine sweep on pricing hover | `.plan::after` |
| Parallax drift | `data-parallax="0.06"` attribute |
| Scroll reveals, 6 variants | `data-anim="up\|scale\|left\|right\|clip\|rise"` |
| Per-section stagger | `--d` set from sibling index |
| Count-up stats | `data-count="40"` attribute |
| Portfolio preview follows cursor | `.project[data-img]` |

Parallax and magnetics write the CSS `translate` property, and hover
lifts write `transform` — separate properties, so they compose instead of
overwriting each other.

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
