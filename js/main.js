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
  const tick = pre && setInterval(() => {
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

  /* No preloader on this page? Reveal immediately. Uses a timer, not
     requestAnimationFrame — rAF is suspended in background tabs, which
     would leave the page stuck in its hidden pre-animation state. */
  if (!pre) {
    document.body.classList.add('curtain-up');
    setTimeout(() => document.body.classList.add('loaded'), 40);
  }

  /* Failsafe: `loaded` gates the hero lines and the contact headline, so
     it must land even if the preloader stalls. */
  setTimeout(() => {
    document.body.classList.add('curtain-up', 'loaded');
    pre?.classList.add('done');
  }, 4000);

  /* ── LIVE CLOCK ────────────────────────────────────────── */
  const clock = $('#clock');
  if (clock) {
    const setClock = () => {
      clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    };
    setClock();
    setInterval(setClock, 1000);
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── FULLSCREEN MENU ───────────────────────────────────── */
  const menuBtn = $('#menuBtn');
  const links   = $$('.menu__link');

  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    const btnTxt = $('.menu-btn__txt');
    if (btnTxt) btnTxt.textContent = open ? 'CLOSE' : 'MENU';
    links.forEach((l, i) => { l.style.transitionDelay = open ? `${0.18 + i * 0.06}s` : '0s'; });
  };
  menuBtn?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  links.forEach(l => l.addEventListener('click', () => setMenu(false)));
  $('#menuClose')?.addEventListener('click', () => setMenu(false));
  $('.menu__cta')?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ── HIDE NAV ON SCROLL DOWN ───────────────────────────── */
  const nav = $('#nav');
  let lastY = 0;
  if (nav) addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });

  /* ── SCROLL REVEAL ─────────────────────────────────────
     Siblings inside a group stagger against each other rather than
     against document order, so each section animates as a unit. */
  const animated = $$('.reveal, [data-anim]');

  animated.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches('.reveal, [data-anim]'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 7) * 0.09}s`);
  });

  const show = (el) => el.classList.add('in');

  /* Geometry sweep — the source of truth. IntersectionObserver is a
     nice-to-have on top; if it never fires (background tab, odd embed)
     this still reveals everything on scroll. */
  let pending = animated.slice();
  const sweep = () => {
    if (!pending.length) return;
    const limit = innerHeight * 0.94;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top < limit) { show(el); return false; }
      return true;
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        show(e.target);
        pending = pending.filter(el => el !== e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    animated.forEach(el => io.observe(el));
  }

  addEventListener('scroll', sweep, { passive: true });
  addEventListener('resize', sweep, { passive: true });
  addEventListener('load', sweep);
  sweep();

  /* Last line of defence: nothing stays invisible, ever. */
  setTimeout(() => { animated.forEach(show); pending = []; }, 5000);

  /* ── SCROLL PROGRESS ───────────────────────────────────── */
  const progressBar = $('#progress i');
  if (progressBar) {
    let pTicking = false;
    const drawProgress = () => {
      try {
        const max = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
      } finally { pTicking = false; }
    };
    addEventListener('scroll', () => {
      if (pTicking) return;
      pTicking = true;
      requestAnimationFrame(drawProgress);
    }, { passive: true });
    addEventListener('resize', drawProgress, { passive: true });
    drawProgress();
  }

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

  /* ── BACKGROUND PARALLAX ───────────────────────────────
     The blurred skyline drifts a few pixels against the scroll so the
     glass panels feel like they're floating in front of it. */
  const bgPhoto = $('[data-bgparallax]');
  if (bgPhoto && !REDUCED) {
    let bgTicking = false;
    const moveBg = () => {
      try {
        bgPhoto.style.translate = `0 ${(scrollY * +bgPhoto.dataset.bgparallax).toFixed(1)}px`;
      } finally { bgTicking = false; }
    };
    addEventListener('scroll', () => {
      if (bgTicking) return;
      bgTicking = true;
      requestAnimationFrame(moveBg);
    }, { passive: true });
    addEventListener('resize', moveBg, { passive: true });
    moveBg();
  }

  /* ── CURSOR-FOLLOW DEPTH ───────────────────────────────
     Hero glass cards shift 8–15px with the pointer. Uses a CSS var so
     it composes with the hover lift instead of overwriting it. */
  if (matchMedia('(hover:hover)').matches && !REDUCED) {
    const depthEls = $$('.spec__col');
    const hero = $('.hero');
    if (hero && depthEls.length) {
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5;
        depthEls.forEach((el, i) => {
          const depth = 10 + i * 3;                        // 10 / 13 / 16 px
          el.style.translate = `${(nx * depth).toFixed(1)}px ${(ny * depth).toFixed(1)}px`;
        });
      });
      hero.addEventListener('mouseleave', () => {
        depthEls.forEach(el => { el.style.translate = '0px 0px'; });
      });
    }

    /* spotlight tracking the pointer across the contact card */
    const cardEl = $('.cform');
    cardEl?.addEventListener('mousemove', (e) => {
      const r = cardEl.getBoundingClientRect();
      cardEl.style.setProperty('--sx', `${e.clientX - r.left}px`);
      cardEl.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });

    /* soft radial highlight tracking the cursor inside buttons */
    $$('.btn, .plan__btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--hx', `${e.clientX - r.left}px`);
        btn.style.setProperty('--hy', `${e.clientY - r.top}px`);
      });
    });
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

  /* ── CUSTOM CURSOR ─────────────────────────────────────
     Dot tracks the pointer 1:1; ring trails with easing. Hover state is
     delegated off document so it works for anything added later. */
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  if (dot && ring && matchMedia('(hover:hover)').matches && !REDUCED) {
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform  = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px,${ry.toFixed(2)}px,0)`;
      requestAnimationFrame(loop);
    })();

    const HOT = 'a, button, summary, input, select, textarea, label';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOT)) document.body.classList.add('cursor-hot');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOT)) document.body.classList.remove('cursor-hot');
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
  if (prev && prevInner) $$('.project').forEach(p => {
    p.addEventListener('mouseenter', () => {
      prevInner.style.backgroundImage = previews[p.dataset.img] || previews[1];
      prev.classList.add('show');
    });
    p.addEventListener('mouseleave', () => prev.classList.remove('show'));
  });
  if (prev) addEventListener('mousemove', e => {
    prev.style.left = e.clientX + 'px';
    prev.style.top  = e.clientY + 'px';
  }, { passive: true });

  /* menu links → image fades in behind the type */
  const menuMedia = $('#menuMedia'), menuMediaIn = $('.menu__media-in');
  if (menuMedia && menuMediaIn) links.forEach(l => {
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

  if (form) form.addEventListener('submit', async (e) => {
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

  /* ── PAGE TRANSITION ───────────────────────────────────
     Internal page links drop the curtain before navigating, so moving
     between pages feels continuous instead of a hard reload. */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || REDUCED) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;                 // external
    if (url.pathname === location.pathname) return;             // same page anchor
    if (!/\.html?$|\/$/.test(url.pathname)) return;             // not a page

    e.preventDefault();
    document.body.classList.remove('curtain-up');               // curtain falls
    setTimeout(() => { location.href = url.href; }, 620);
  });

  /* Coming back via the browser's back button restores a cached page with
     the curtain still down — lift it. */
  addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.add('curtain-up');
  });

  /* ── BACK TO TOP ───────────────────────────────────────── */
  $('#toTop')?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

})();
