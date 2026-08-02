/* ════════════════════════════════════════════════════════════
   MANAN — interactions
   ════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── PRELOADER ─────────────────────────────────────────── */
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
        document.body.classList.add('loaded');
      }, 320);
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

  /* ── PROJECT HOVER PREVIEW ─────────────────────────────
     Swap these gradients for real screenshots:
     project.dataset.img → set to 'assets/work-1.jpg' and use url(...)  */
  const previews = {
    1: 'linear-gradient(135deg,#1b2a4a,#4a3f8f 50%,#d3fd50)',
    2: 'linear-gradient(135deg,#3a2416,#a3653a 55%,#f2d0a4)',
    3: 'linear-gradient(135deg,#111,#3d3d3d 45%,#d3fd50)',
    4: 'linear-gradient(135deg,#06231e,#0d6157 55%,#7ef2d0)',
    5: 'linear-gradient(135deg,#2b1b2e,#7a4a6d 55%,#f4c9df)'
  };
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

  /* ── FAQ: only one open at a time ──────────────────────── */
  const items = $$('.faq__item');
  items.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ── CONTACT FORM ──────────────────────────────────────
     No backend yet — it opens the visitor's mail client with a
     pre-filled enquiry. To collect submissions automatically,
     sign up at formspree.io / getform.io and replace the block
     marked below with a fetch() to your endpoint.            */
  const form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let ok = true;

    ['name', 'email', 'message'].forEach(k => {
      const input = form.elements[k];
      const bad = !data[k].trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(data.email));
      input.classList.toggle('err', bad);
      if (bad) ok = false;
    });

    if (!ok) {
      note.textContent = '⚠ PLEASE FILL IN THE HIGHLIGHTED FIELDS';
      note.style.color = '#ff5a52';
      return;
    }

    /* ── replace from here for a real backend ── */
    const subject = encodeURIComponent(`New project enquiry — ${data.name}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nBudget: ${data.budget}\n\n${data.message}`
    );
    window.location.href = `mailto:itsmanan.dev@gmail.com?subject=${subject}&body=${body}`;
    /* ── to here ── */

    note.style.color = '';
    note.textContent = '✓ THANKS — OPENING YOUR MAIL APP. I REPLY WITHIN 24 HOURS.';
    form.reset();
  });

  /* ── BACK TO TOP ───────────────────────────────────────── */
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

})();
