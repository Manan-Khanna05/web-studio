# MANAN — Freelance Web Studio Site

A dark, editorial one-page site built to win freelance clients. Plain HTML/CSS/JS —
no build step, no dependencies. Open it, edit it, ship it.

```
D:\Web
├── index.html      ← all content / copy
├── css\style.css   ← all styling (brand colours at the top)
├── js\main.js      ← cursor, menu, counters, form
└── README.md
```

## Run it locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173

## Make it yours — the 6 things to change first

| # | What | Where |
|---|------|-------|
| 1 | Brand name `MANAN` | `index.html` — nav `.brand`, `<title>`, footer `.footer__big` |
| 2 | Email + WhatsApp number | `index.html` `#contact` and the menu footer, plus `js\main.js` (mailto at the bottom) |
| 3 | Social links (`href="#"`) | `index.html` — menu footer + contact side |
| 4 | Prices & packages | `index.html` `#pricing` — swap `$` for `₹` if you bill Indian clients |
| 5 | Real project names | `index.html` `#work` |
| 6 | Accent colour | `css\style.css` → `--accent: #d3fd50` |

## Adding real portfolio images

Right now each project shows a gradient placeholder on hover. To use screenshots:

1. Drop images in `assets\` (e.g. `work-1.jpg`, 1200×840 works well).
2. In `js\main.js`, change the `previews` object:

```js
const previews = {
  1: 'url(assets/work-1.jpg)',
  2: 'url(assets/work-2.jpg)',
  ...
};
```

## Making the contact form actually deliver mail

The form currently opens the visitor's mail app. For real submissions in your inbox:

1. Create a free form endpoint at [formspree.io](https://formspree.io) or [getform.io](https://getform.io).
2. In `js\main.js`, replace everything between the `/* ── replace from here ── */`
   and `/* ── to here ── */` comments with:

```js
await fetch('https://formspree.io/f/YOUR_ID', {
  method: 'POST',
  headers: { 'Accept': 'application/json' },
  body: new FormData(form)
});
```

## Putting it online (free)

**Netlify** — go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the
`D:\Web` folder onto the page. Live in ~10 seconds, free HTTPS, free subdomain.

**Vercel / GitHub Pages** work the same way — this is a static site, so any host will do.
Point your own domain at it whenever you buy one.

## Before you send this to a client

- [ ] Replace the placeholder stats (40+ clients, 75+ projects) with your real numbers
- [ ] Add 3–5 real projects, even personal ones
- [ ] Set the WhatsApp number in `wa.me/91XXXXXXXXXX` format
- [ ] Add a favicon (`<link rel="icon" href="assets/favicon.png">` in `<head>`)
- [ ] Add an OG preview image for WhatsApp/LinkedIn shares
