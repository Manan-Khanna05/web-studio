/* ════════════════════════════════════════════════════════════
   KILN STUDIO — interactions
   ════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── PRELOADER → CURTAIN REVEAL ────────────────────────
     Counter fills, preloader fades, then five panels wipe upward. */
  const pre = $('#preloader'), preCount = $('#preCount'), preBar = $('#preBar');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(100, n + Math.random() * 14);
    preCount.textContent = Math.round(n);
    preBar.style.width = n + '%';
    if (n >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        pre.classList.add('done');
        document.body.classList.add('curtain-up');
        setTimeout(() => document.body.classList.add('loaded'), 260);
      }, 300);
    }
  }, 110);

  /* ── LIVE CLOCK ────────────────────────────────────────── */
  const clock = $('#clock');
  const setClock = () => {
    clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  };
  setClock();
  setInterval(setClock, 1000);

  $('#year').textContent = new Date().getFullYear();

  /* ── FULLSCREEN MENU ───────────────────────────────────── */
  const menuBtn = $('#menuBtn');
  const links   = $$('.menu__link');

  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    $('.menu-btn__txt').textContent = open ? 'CLOSE' : 'MENU';
    links.forEach((l, i) => { l.style.transitionDelay = open ? `${0.18 + i * 0.06}s` : '0s'; });
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  links.forEach(l => l.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ── HIDE NAV ON SCROLL DOWN ───────────────────────────── */
  const nav = $('#nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });

  /* ── SCROLL REVEAL ─────────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    io.observe(el);
  });

  /* ── COUNT-UP STATS ────────────────────────────────────── */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, dur = 1500;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ── PARALLAX ──────────────────────────────────────────
     Elements drift against the scroll at their own rate. */
  const paraEls = $$('[data-parallax]');
  if (paraEls.length && !REDUCED) {
    let ticking = false;
    const applyParallax = () => {
      try {
        const vh = innerHeight;
        paraEls.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) return;    // offscreen, skip
          const mid = r.top + r.height / 2 - vh / 2;
          /* `translate` is its own property, so this never fights the
             `transform` that .reveal uses for its entrance animation. */
          el.style.translate = `0 ${(-mid * +el.dataset.parallax).toFixed(1)}px`;
        });
      } finally {
        ticking = false;   // never let one bad frame wedge the handler
      }
    };
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyParallax);
    }, { passive: true });
    addEventListener('resize', applyParallax, { passive: true });
    applyParallax();
  }

  /* ── MAGNETIC BUTTONS ──────────────────────────────────
     Within range the element is pulled toward the cursor. */
  if (matchMedia('(hover:hover)').matches && !REDUCED) {
    $$('[data-magnetic]').forEach(el => {
      const STRENGTH = 0.32, RANGE = 90;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) > r.width / 2 + RANGE) return;
        el.classList.add('is-pulled');
        el.style.translate = `${(dx * STRENGTH).toFixed(1)}px ${(dy * STRENGTH).toFixed(1)}px`;
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('is-pulled');
        el.style.translate = '0px 0px';
      });
    });
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────────── */
  const cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  if (matchMedia('(hover:hover)').matches) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    $$('a, button, summary, .plan, .phase').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-active');
        cursorLabel.textContent = el.dataset.cursor || 'view';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-active');
        cursorLabel.textContent = '';
      });
    });
  }

  /* ── IMAGE PREVIEWS ────────────────────────────────────
     Swap these gradients for real screenshots:
     1: 'url(assets/work-1.jpg)'  etc. */
  const previews = {
    1: 'linear-gradient(135deg,#1b2a4a,#4a3f8f 50%,#d3fd50)',
    2: 'linear-gradient(135deg,#3a2416,#a3653a 55%,#f2d0a4)',
    3: 'linear-gradient(135deg,#111,#3d3d3d 45%,#d3fd50)',
    4: 'linear-gradient(135deg,#06231e,#0d6157 55%,#7ef2d0)',
    5: 'linear-gradient(135deg,#2b1b2e,#7a4a6d 55%,#f4c9df)'
  };

  /* portfolio list → preview follows the cursor */
  const prev = $('#projPreview'), prevInner = $('.proj-preview__inner');
  $$('.project').forEach(p => {
    p.addEventListener('mouseenter', () => {
      prevInner.style.backgroundImage = previews[p.dataset.img] || previews[1];
      prev.classList.add('show');
    });
    p.addEventListener('mouseleave', () => prev.classList.remove('show'));
  });
  addEventListener('mousemove', e => {
    prev.style.left = e.clientX + 'px';
    prev.style.top  = e.clientY + 'px';
  }, { passive: true });

  /* menu links → image fades in behind the type */
  const menuMedia = $('#menuMedia'), menuMediaIn = $('.menu__media-in');
  links.forEach(l => {
    l.addEventListener('mouseenter', () => {
      menuMediaIn.style.backgroundImage = previews[l.dataset.reveal] || previews[1];
      menuMedia.classList.add('show');
    });
    l.addEventListener('mouseleave', () => menuMedia.classList.remove('show'));
  });

  /* ── FAQ: only one open at a time ──────────────────────── */
  const items = $$('.faq__item');
  items.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ── CONTACT FORM → /api/contact ───────────────────────
     Posts to the serverless endpoint. If the backend has no mail
     provider configured yet (503), falls back to opening the
     visitor's mail app so no enquiry is ever lost. */
  const MAILTO = 'itsmanan.dev@gmail.com';
  const form = $('#contactForm'), note = $('#formNote'), submitBtn = $('#submitBtn');

  const say = (msg, bad) => {
    note.textContent = msg;
    note.style.color = bad ? '#ff5a52' : '';
  };

  const mailtoFallback = (d) => {
    const subject = encodeURIComponent(`New project enquiry - ${d.name}`);
    const body = encodeURIComponent(
      `Name: ${d.name}\nEmail: ${d.email}\nBudget: ${d.budget}\n\n${d.message}`
    );
    window.location.href = `mailto:${MAILTO}?subject=${subject}&body=${body}`;
    say('OPENING YOUR MAIL APP — HIT SEND AND WE WILL REPLY WITHIN 24 HOURS.');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let ok = true;

    ['name', 'email', 'message'].forEach(k => {
      const input = form.elements[k];
      const bad = !data[k].trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(data.email));
      input.classList.toggle('err', bad);
      if (bad) ok = false;
    });

    if (!ok) return say('PLEASE FILL IN THE HIGHLIGHTED FIELDS', true);

    submitBtn.disabled = true;
    say('SENDING…');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        say('THANKS — YOUR ENQUIRY IS IN. WE REPLY WITHIN 24 HOURS.');
        form.reset();
      } else if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        say(j.error || 'TOO MANY ENQUIRIES — PLEASE EMAIL US DIRECTLY.', true);
      } else {
        /* 503 = mail provider not configured, 404 = running as plain
           static files with no serverless runtime. Both → mailto. */
        mailtoFallback(data);
      }
    } catch {
      mailtoFallback(data);          // offline or network blocked
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ── BACK TO TOP ───────────────────────────────────────── */
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

})();
