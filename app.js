/* ==========================================================================
   DIIA · motor de experiencia (vanilla JS, sin dependencias)
   Módulos: carga · scroll suave · hero (revelado por barras + canvas) · split
            reveals · frase que se ilumina · parallax · servicios (acordeón +
            vista previa) · cinta · proyectos (galería horizontal anclada) ·
            vista de proyecto · lente de ingeniería · proceso · FAQ · contacto
            cursor · cabecera · menú · pie · WhatsApp
   Un único bucle requestAnimationFrame lee el scroll y actualiza todo.
   Respeta prefers-reduced-motion y pausa lo que no se ve.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const WA = '525525069867';
  const GOLD = '207,181,101';

  /* Dice si un elemento está (casi) en pantalla. Los módulos ligados al scroll solo trabajan mientras se ve su sección. */
  const watch = (el, margin = 160) => {
    const s = { on: true };
    if (!el || !('IntersectionObserver' in window)) return s;
    s.on = false;
    new IntersectionObserver((es) => { s.on = es[es.length - 1].isIntersecting; }, { rootMargin: `${margin}px 0px` }).observe(el);
    return s;
  };

  let vw = innerWidth, vh = innerHeight, sy = 0, menuOpen = false, heroLive = true;
  const desktop = () => innerWidth >= 900;
  if (reduce) root.classList.add('reduce');
  try { history.scrollRestoration = 'manual'; } catch (e) { /* noop */ }

  /* ---------- 1 · Carga ---------------------------------------------------- */
  function loader() {
    const el = $('#loader');
    return new Promise((resolve) => {
      if (!el || reduce) { el && el.remove(); root.classList.remove('is-loading'); return resolve(); }
      $$('.loader__slats i', el).forEach((s, i) => s.style.setProperty('--k', i));
      const num = $('#loaderNum');
      const dur = 2800, t0 = performance.now();
      let ready = document.readyState === 'complete', p = 0;
      if (!ready) addEventListener('load', () => (ready = true), { once: true });
      setTimeout(() => (ready = true), 4500);              // nunca esperes más de 4.5 s por imágenes lentas
      const done = () => {
        el.classList.add('is-done');
        setTimeout(() => { root.classList.remove('is-loading'); resolve(); }, 700);
        setTimeout(() => el.remove(), 2800);
      };
      const tick = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        let v = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // easeInOutCubic
        if (!ready) v = Math.min(v, .94);
        p = Math.max(p, v);
        el.style.setProperty('--p', p.toFixed(4));
        if (num) num.textContent = String(Math.round(p * 100)).padStart(3, '0');
        if (p >= 1) return done();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 2 · Scroll suave (rueda) + anclas ------------------------------ */
  const smoothOn = fine && !reduce;
  let sTarget = 0, sCur = 0, sRun = false;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  function smoothInit() {
    if (!smoothOn) return;
    root.style.scrollBehavior = 'auto';
    const blocked = (e) => root.classList.contains('is-loading') || root.classList.contains('menu-open') ||
      root.classList.contains('sheet-open') || (e.target.closest && e.target.closest('.sheet'));
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || blocked(e)) return;
      e.preventDefault();
      if (!sRun) sTarget = sCur = scrollY;
      sTarget = clamp(sTarget + e.deltaY * (e.deltaMode === 1 ? 34 : 1) * .9, 0, maxScroll());
      sRun = true;
    }, { passive: false });
    const release = () => { sRun = false; sTarget = sCur = scrollY; };
    ['keydown', 'mousedown', 'touchstart'].forEach((ev) => addEventListener(ev, release, { passive: true }));
    addEventListener('scroll', () => { if (!sRun) sTarget = sCur = scrollY; }, { passive: true });
  }
  function smoothStep() {
    if (!sRun) return;
    sCur = lerp(sCur, sTarget, .085);
    if (Math.abs(sTarget - sCur) < .4) { sCur = sTarget; sRun = false; }
    scrollTo({ top: sCur, behavior: 'instant' });
  }
  function scrollToY(y) {
    y = clamp(y, 0, maxScroll());
    if (smoothOn) { sTarget = y; sCur = scrollY; sRun = true; } else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  function setService(name) {
    const sel = $('#f-servicio');
    if (sel && name) { sel.value = name; sel.classList.toggle('has-v', !!sel.value); }
  }
  function anchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const dest = document.getElementById(a.getAttribute('href').slice(1));
      if (!dest) return;
      e.preventDefault();
      if (a.dataset.service) setService(a.dataset.service);
      if (menuOpen) setMenu(false);
      if (root.classList.contains('sheet-open')) closeSheet(true);
      const y = dest.id === 'inicio' ? 0 : dest.getBoundingClientRect().top + scrollY - (dest.id === 'proyectos' ? 0 : 56);
      scrollToY(y);
      history.replaceState(null, '', '#' + dest.id);
    });
  }

  /* ---------- 3 · Texto partido por palabras ----------------------------------- */
  function split() {
    $$('[data-split]').forEach((h) => {
      let i = 0;
      const walk = (n) => Array.from(n.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) return f.appendChild(document.createTextNode(' '));
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.className = 'wi';
            s.style.setProperty('--i', i++); s.textContent = tok;
            w.appendChild(s); f.appendChild(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      });
      walk(h);
    });
  }

  /* ---------- 4 · Reveals al hacer scroll ----------------------------------------- */
  function reveals() {
    const items = $$('[data-reveal],[data-img],[data-split],.proj');
    if (reduce || !('IntersectionObserver' in window)) return items.forEach((n) => n.classList.add('in'));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: .14, rootMargin: '0px 0px -7% 0px' });
    items.forEach((n) => io.observe(n));
  }

  /* ---------- 5 · Hero: barras que revelan la foto + skyline en canvas -------------- */
  function hero() {
    const sec = $('.hero');
    if (!sec) return () => {};
    const photo = $('.hero__photo', sec), img = $('img', photo), content = $('.hero__content', sec);
    const cap = $('.hero__caption', sec), cue = $('.hero__cue', sec);
    const per = 26;
    let H = 0, total = 1, lastP = -1;
    const measure = () => { H = sec.offsetHeight; total = Math.max(1, H - vh); lastP = -1; };
    measure(); addEventListener('resize', () => setTimeout(measure, 170)); addEventListener('load', measure);
    return () => {
      heroLive = false;
      if (sy > H) return;                                             // el hero ya quedó atrás: no hay nada que mover
      const p = reduce ? 1 : clamp(sy / total, 0, 1);
      const a = smooth(0, .6, p);
      heroLive = a < .999;                                            // con la foto completa, el canvas queda tapado
      if (p === lastP) return; lastP = p;
      if (a >= .999) { photo.style.webkitMaskImage = 'none'; photo.style.maskImage = 'none'; }
      else { photo.style.webkitMaskImage = ''; photo.style.maskImage = ''; photo.style.setProperty('--bw', (per * a).toFixed(2) + 'px'); }
      img.style.setProperty('--s', (1.28 - .28 * smooth(0, 1, p)).toFixed(4));
      const f = reduce ? 1 : 1 - smooth(.4, .72, p);
      content.style.opacity = f.toFixed(3);
      content.style.transform = `translate3d(0,${(-p * 70).toFixed(1)}px,0)`;
      content.style.pointerEvents = f < .12 ? 'none' : '';
      const c = smooth(.72, .94, p);
      if (cap) { cap.style.opacity = c.toFixed(3); cap.style.transform = `translate3d(0,${((1 - c) * 24).toFixed(1)}px,0)`; }
      if (cue) cue.style.opacity = p > .04 ? 0 : '';
    };
  }

  function heroCanvas() {
    const cv = $('.hero__canvas');
    if (!cv) return () => {};
    const ctx = cv.getContext('2d');
    const per = 26;
    let w = 0, h = 0, cols = [], parts = [], mx = -9999, grad = null;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;   // semilla fija → mismo skyline siempre
      let b = .45; cols = [];
      for (let i = 0; i < Math.ceil(w / per) + 1; i++) {
        b = clamp(b + (rnd() - .5) * .55, .08, 1);
        cols.push({ b, ph: rnd() * 6.28, sp: .35 + rnd() * .7 });
      }
      parts = Array.from({ length: w < 700 ? 26 : 64 }, () => ({ x: rnd() * w, y: rnd() * h, v: .12 + rnd() * .4, r: .5 + rnd() * 1.4, k: Math.min(2, Math.floor(rnd() * 3)), dx: 0 }));      grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, `rgba(${GOLD},.95)`); grad.addColorStop(.7, `rgba(${GOLD},.25)`); grad.addColorStop(1, `rgba(${GOLD},.03)`);
    };
    resize();
    addEventListener('resize', () => setTimeout(resize, 120));
    addEventListener('pointermove', (e) => { mx = e.clientX; }, { passive: true });
    const solid = `rgb(${GOLD})`, base = `rgba(${GOLD},.28)`;
    return (t) => {
      if (!heroLive) return;                                          // foto completa o hero fuera de pantalla: no se dibuja
      const time = t / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.2; ctx.strokeStyle = grad; ctx.fillStyle = solid;
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i], x = i * per + per * .86 + .5;
        const pulse = Math.max(0, Math.sin(time * 1.1 - i * .13));
        let hh = h * (.16 + .6 * c.b) * (.9 + .1 * Math.sin(time * c.sp + c.ph));
        const dx = (x - mx) / 170;
        hh += h * .22 * Math.exp(-dx * dx);
        const al = .5 + .5 * pulse;
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x, h - hh); ctx.stroke();
        if (pulse > .55) { ctx.globalAlpha = al * pulse * .9; ctx.beginPath(); ctx.arc(x, h - hh, 1.7, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = base; ctx.beginPath(); ctx.moveTo(0, h - .5); ctx.lineTo(w, h - .5); ctx.stroke();
      for (const p of parts) {
        p.y -= p.v; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        p.dx = p.x + Math.sin(time + p.y * .01) * 6;
      }
      for (let k = 0; k < 3; k++) {                                   // 3 niveles de opacidad en vez de un trazo por partícula
        ctx.beginPath();
        for (const p of parts) if (p.k === k) { ctx.moveTo(p.dx + p.r, p.y); ctx.arc(p.dx, p.y, p.r, 0, 6.2832); }
        ctx.globalAlpha = .3 + k * .2; ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  }

  /* ---------- 6 · Frase que se ilumina palabra por palabra ----------------------------- */
  function words() {
    const el = $('[data-words]');
    if (!el) return () => {};
    const ws = [];
    const walk = (n) => Array.from(n.childNodes).forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) return f.appendChild(document.createTextNode(' '));
          const s = document.createElement('span'); s.className = 'wd'; s.textContent = tok; ws.push(s); f.appendChild(s);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(el);
    let last = -1;
    const vis = watch(el, 60);
    return () => {
      if (reduce) { if (last !== 1) ws.forEach((w) => (w.style.opacity = 1)); last = 1; return; }
      if (!vis.on) return;
      const r = el.getBoundingClientRect();
      const p = clamp((vh * .84 - r.top) / (r.height + vh * .3), 0, 1);
      const n = p * ws.length, key = Math.round(n * 20);
      if (key === last) return;
      last = key;
      ws.forEach((w, i) => (w.style.opacity = (.14 + .86 * clamp(n - i, 0, 1)).toFixed(2)));
    };
  }

  /* ---------- 7 · Parallax de imágenes -------------------------------------------------- */
  function parallax() {
    const items = $$('[data-par]').map((img) => ({ img, box: img.parentElement, f: parseFloat(img.dataset.par) || .1, vis: watch(img.parentElement, 80) }));
    return () => items.forEach(({ img, box, f, vis }) => {
      if (!vis.on) return;
      const r = box.getBoundingClientRect();
      const c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      const lim = r.height * .08;
      img.style.transform = `translate3d(0,${clamp(-c * r.height * f * .66, -lim, lim).toFixed(1)}px,0)`;
    });
  }

  /* ---------- 8 · Servicios: acordeón + vista previa que sigue al cursor ------------------ */
  function services() {
    const items = $$('.svc'), list = $('.svc-list'), prev = $('.svc-prev'), pimg = prev && $('img', prev);
    if (!list) return () => {};
    const setH = (it, open) => { $('.svc__body', it).style.height = open ? $('.svc__inner', it).offsetHeight + 'px' : '0px'; };
    const refresh = () => items.forEach((it) => it.classList.contains('is-open') && setH(it, true));
    items.forEach((it) => {
      const btn = $('.svc__row', it);
      setH(it, it.classList.contains('is-open'));
      btn.addEventListener('click', () => {
        const will = !it.classList.contains('is-open');
        items.forEach((o) => {
          if (o !== it && o.classList.contains('is-open')) { o.classList.remove('is-open'); $('.svc__row', o).setAttribute('aria-expanded', 'false'); setH(o, false); }
        });
        it.classList.toggle('is-open', will); btn.setAttribute('aria-expanded', String(will)); setH(it, will);
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(list);
    document.fonts && document.fonts.ready.then(refresh);
    if (!fine || !prev) return () => {};
    let tx = 0, ty = 0, cx = 0, cy = 0, pw = 0, ph = 0, preloaded = false;
    const size = () => { pw = prev.offsetWidth; ph = prev.offsetHeight; };
    size(); addEventListener('resize', size);
    list.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    items.forEach((it) => {
      const row = $('.svc__row', it);
      row.addEventListener('pointerenter', () => {
        if (!preloaded) { preloaded = true; items.forEach((o) => { new Image().src = o.dataset.preview; }); }
        pimg.src = it.dataset.preview; prev.classList.add('on');
      });
      row.addEventListener('pointerleave', () => prev.classList.remove('on'));
    });
    return () => {
      if (!prev.classList.contains('on')) { cx = tx; cy = ty; return; }
      cx = lerp(cx, tx, .13); cy = lerp(cy, ty, .13);
      const x = Math.min(cx + 56, vw - pw - 24), y = clamp(cy - ph / 2, 20, vh - ph - 20);
      prev.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${clamp((tx - cx) * .03, -6, 6).toFixed(2)}deg)`;
    };
  }

  /* ---------- 9 · Cinta de texto que corre con el scroll ----------------------------------- */
  function marquee() {
    const band = $('.marq');
    if (!band) return () => {};
    const rows = $$('.marq__row', band).map((r) => ({ r, g: $('.marq__g', r), dir: parseFloat(r.dataset.dir) || -1, gw: 1 }));
    const build = () => rows.forEach((d) => {
      $$('.marq__g[data-c]', d.r).forEach((n) => n.remove());
      d.gw = Math.max(1, d.g.offsetWidth);
      for (let k = 0; k < Math.ceil(vw / d.gw) + 1; k++) {
        const c = d.g.cloneNode(true); c.dataset.c = 1; c.setAttribute('aria-hidden', 'true'); d.r.appendChild(c);
      }
    });
    build();
    document.fonts && document.fonts.ready.then(build);
    addEventListener('resize', () => setTimeout(build, 150));
    const vis = watch(band, 40);
    return (t) => {
      if (!vis.on) return;
      const off = reduce ? 0 : t * .035 + sy * .42;
      rows.forEach((d) => {
        const m = off % d.gw;
        d.r.style.transform = `translate3d(${(d.dir < 0 ? -m : m - d.gw).toFixed(1)}px,0,0)`;
      });
    };
  }

  /* ---------- 10 · Proyectos: galería horizontal anclada ------------------------------------- */
  let relayoutWork = () => {};
  function work() {
    const sec = $('#proyectos'), track = $('#workTrack');
    if (!sec || !track) return () => {};
    const bar = $('.work__bar i', sec), cur = $('#workCur'), nameEl = $('#workName');
    const projs = $$('.proj', track);
    projs.forEach((li) => { const b = $('.proj__open', li), n = $('.proj__no', li); if (b && n) b.dataset.n = n.textContent; });
    const imgs = projs.map((li) => $('.proj__img img', li));
    const offs = projs.map(() => 0), wids = projs.map(() => 0), lit = projs.map(() => false), pxv = projs.map(() => '');
    let dist = 0, docTop = 0, x = 0, idx = -1, mxScroll = 0, lastP = '';
    const vis = watch(sec, 200);
    const layout = () => {
      track.style.transform = '';
      if (desktop()) {
        const last = track.lastElementChild;
        const pr = parseFloat(getComputedStyle(track).paddingRight) || 0;
        const end = last.getBoundingClientRect().right - track.getBoundingClientRect().left + pr;
        dist = Math.max(0, end - innerWidth);
        sec.style.height = (dist + vh) + 'px';
        docTop = sec.getBoundingClientRect().top + scrollY;
      } else { sec.style.height = ''; dist = 0; }
      // posición de cada proyecto dentro de la pista: así el bucle calcula dónde están sin leer el DOM en cada frame
      const sl = track.scrollLeft;
      projs.forEach((li, i) => { offs[i] = li.getBoundingClientRect().left + sl; wids[i] = li.offsetWidth; });
      mxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    };
    relayoutWork = layout; layout();
    const setIdx = (i) => {
      if (i === idx) return; idx = i;
      if (cur) cur.textContent = String(i + 1).padStart(2, '0');
      if (nameEl) nameEl.textContent = $('.proj__name', projs[i]).textContent;
    };
    const promote = (i, on) => { if (lit[i] === on || !imgs[i]) return; lit[i] = on; imgs[i].style.willChange = on ? 'transform, translate' : ''; };
    return () => {
      if (!vis.on) { for (let i = 0; i < projs.length; i++) promote(i, false); return; }
      let p, shift;
      if (desktop()) {
        p = dist ? clamp((sy - docTop) / dist, 0, 1) : 0;
        const target = -p * dist;
        x = Math.abs(target - x) < .2 ? target : lerp(x, target, .12);
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        shift = x;
      } else {
        const sl = track.scrollLeft;
        p = mxScroll ? clamp(sl / mxScroll, 0, 1) : 0;
        shift = -sl;
      }
      const ps = p.toFixed(4);
      if (bar && ps !== lastP) { lastP = ps; bar.parentElement.style.setProperty('--p', ps); }
      let best = 0, bd = 1e9;
      for (let i = 0; i < projs.length; i++) {
        const l = offs[i] + shift, w = wids[i];
        promote(i, l + w > -vw * .5 && l < vw * 1.5);                  // solo las imágenes cercanas a la pantalla tienen capa propia
        if (l + w < -200 || l > vw + 200) continue;
        const d = l + w / 2 - vw / 2, ad = Math.abs(d);
        if (ad < bd) { bd = ad; best = i; }
        const v = clamp(-d * .1, -w * .1, w * .1).toFixed(1) + 'px';
        if (imgs[i] && v !== pxv[i]) { pxv[i] = v; imgs[i].style.setProperty('--px', v); }
      }
      setIdx(best);
    };
  }

  /* ---------- 11 · Vista de proyecto (pantalla completa) ------------------------------------- */
  let setMenu = () => {}, closeSheet = () => {};
  function sheet() {
    const sh = $('#sheet'), projs = $$('.proj');
    if (!sh) return;
    let idx = 0, lastFocus = null, io = null;
    const fill = (i) => {
      idx = (i + projs.length) % projs.length;
      const li = projs[idx], q = (s) => $(s, li);
      const name = q('.proj__name').textContent;
      $('#sheetNo').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(projs.length).padStart(2, '0')}`;
      $('#sheetTag').textContent = q('.proj__tag').textContent;
      $('#sheetName').textContent = name;
      $('#sheetLoc').textContent = q('.proj__loc').textContent;
      $('#sheetText').textContent = q('.proj__text').textContent;
      const specs = $('#sheetSpecs'); specs.innerHTML = '';
      $$('.proj__specs li', li).forEach((s) => { const n = document.createElement('li'); n.textContent = s.textContent; specs.appendChild(n); });
      $('#sheetCta').dataset.service = li.dataset.service || '';
      const wrap = $('#sheetImgs'); wrap.innerHTML = ''; wrap.scrollTop = 0; sh.scrollTop = 0;
      if (io) io.disconnect();
      io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.isIntersecting) { setTimeout(() => en.target.classList.add('in'), 120); io.unobserve(en.target); }
      }), { threshold: .08 });
      const alt0 = q('.proj__img img').alt;
      (li.dataset.images || '').split('|').forEach((src, k) => {
        const f = document.createElement('figure'); f.className = 'sheet__fig';
        const im = new Image(); im.src = src; im.decoding = 'async'; im.alt = k === 0 ? alt0 : `${name} — vista ${k + 1}`;
        const w = document.createElement('div'); w.className = 'sheet__w'; w.appendChild(im); f.appendChild(w); wrap.appendChild(f); io.observe(f);
      });
    };
    const open = (i) => {
      lastFocus = document.activeElement; fill(i);
      sh.classList.add('is-open'); sh.setAttribute('aria-hidden', 'false'); root.classList.add('sheet-open');
      setTimeout(() => $('.sheet__close', sh).focus({ preventScroll: true }), 700);
    };
    closeSheet = (silent) => {
      if (!sh.classList.contains('is-open')) return;
      sh.classList.remove('is-open'); sh.setAttribute('aria-hidden', 'true'); root.classList.remove('sheet-open');
      if (!silent && lastFocus) lastFocus.focus({ preventScroll: true });
    };
    projs.forEach((li, i) => $('.proj__open', li).addEventListener('click', () => open(i)));
    $('.sheet__close', sh).addEventListener('click', () => closeSheet());
    $('#sheetPrev').addEventListener('click', () => fill(idx - 1));
    $('#sheetNext').addEventListener('click', () => fill(idx + 1));
    addEventListener('keydown', (e) => {
      if (!sh.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeSheet();
      else if (e.key === 'ArrowRight') fill(idx + 1);
      else if (e.key === 'ArrowLeft') fill(idx - 1);
      else if (e.key === 'Tab') {                                     // el foco no se escapa de la vista
        const f = $$('button,a[href]', sh).filter((n) => n.offsetParent !== null || n === document.activeElement);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
  }

  /* ---------- 12 · Lente de ingeniería ---------------------------------------------------------- */
  function lens() {
    const el = $('#lens');
    if (!el) return () => {};
    const ring = $('.lens__ring', el), tag = $('.lens__tag', el);
    let x = 0, y = 0, r = 0, tx = 0, ty = 0, hov = false, init = false, W = 0, H = 0, R = 80, base = 104, rem = 16;
    const measure = () => {
      W = el.offsetWidth; H = el.offsetHeight;                        // tamaño de layout (no cambia con el zoom de entrada)
      R = Math.max(80, Math.min(W, H) * .27); base = R * 1.3;
      rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      el.style.setProperty('--lb', base.toFixed(1) + 'px');           // el aro se dibuja al tamaño máximo y se escala
    };
    measure(); addEventListener('resize', () => setTimeout(measure, 170)); addEventListener('load', measure);
    document.fonts && document.fonts.ready.then(measure);
    const pos = (e) => { const b = el.getBoundingClientRect(); tx = e.clientX - b.left; ty = e.clientY - b.top; hov = true; };
    el.addEventListener('pointermove', pos); el.addEventListener('pointerdown', pos);
    el.addEventListener('pointerleave', () => (hov = false));
    const vis = watch(el, 200);
    const step = (t) => {
      if (!hov) {                                                     // sin puntero: la lente recorre sola la imagen
        const s = reduce ? 0 : t / 1000;
        tx = W * (.5 + .3 * Math.sin(s * .7)); ty = H * (.5 + .27 * Math.sin(s * .53 + 1.2));
      }
      if (!init) { x = tx; y = ty; init = true; }
      x = lerp(x, tx, .12); y = lerp(y, ty, .12); r = lerp(r, R * (hov ? 1.3 : 1), .1);
      el.style.setProperty('--lx', x.toFixed(1) + 'px'); el.style.setProperty('--ly', y.toFixed(1) + 'px'); el.style.setProperty('--lr', r.toFixed(1) + 'px');
      ring.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(r / base).toFixed(4)})`;
      tag.style.transform = `translate3d(${(x + r * .72).toFixed(1)}px,${(y - r * .72 - rem * 1.6).toFixed(1)}px,0)`;
    };
    step(0);
    return (t) => { if (vis.on) step(t); };
  }

  /* ---------- 13 · Proceso: línea que avanza + número gigante ------------------------------------ */
  function process() {
    const list = $('#procSteps'), holder = $('.proc__num');
    if (!list) return () => {};
    const steps = $$('.step', list);
    let cur = -1;
    const setNum = (n) => {
      if (!holder) return;
      const old = $('span:not(.out)', holder);
      const s = document.createElement('span');
      s.textContent = String(n + 1).padStart(2, '0'); s.className = 'pre'; s.setAttribute('aria-hidden', 'true');
      holder.appendChild(s);
      requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove('pre')));
      if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 1000); }
    };
    const vis = watch(list, 0);
    let lastP = '';
    return () => {
      if (!vis.on) return;
      const r = list.getBoundingClientRect();                         // primero todas las lecturas…
      let best = 0, bd = 1e9;
      steps.forEach((s, i) => { const b = s.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - vh * .5); if (d < bd) { bd = d; best = i; } });
      const ps = clamp((vh * .5 - r.top) / r.height, 0, 1).toFixed(3);   // …y después las escrituras
      if (ps !== lastP) { lastP = ps; list.style.setProperty('--p', ps); }
      if (best !== cur) {
        steps.forEach((s, i) => s.classList.toggle('on', i === best));
        if (cur !== -1) setNum(best);
        cur = best;
      }
    };
  }

  /* ---------- 14 · FAQ animado -------------------------------------------------------------------- */
  function faq() {
    $$('.q').forEach((d) => {
      const sum = $('summary', d), body = $('.q__a', d);
      sum.addEventListener('click', (e) => {
        e.preventDefault();
        if (reduce) { d.open = !d.open; return; }
        if (!d.open) {
          d.open = true;
          const h = body.offsetHeight;
          body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)' });
        } else {
          const h = body.offsetHeight;
          const an = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.76,0,.24,1)' });
          an.onfinish = () => { d.open = false; };
        }
      });
    });
  }

  /* ---------- 15 · Contadores ----------------------------------------------------------------------- */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length || reduce) return;
    els.forEach((el) => (el.textContent = '0'));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target, end = parseFloat(el.dataset.count), t0 = performance.now(), D = 2400;
      const step = (now) => {
        const t = clamp((now - t0) / D, 0, 1);
        el.textContent = Math.round(end * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .7 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- 16 · Cursor propio ----------------------------------------------------------------------- */
  function cursor() {
    if (!fine || reduce) return () => {};
    const c = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), lab = $('.cursor__label');
    if (!c) return () => {};
    root.classList.add('has-cursor');
    let x = -100, y = -100, rx = -100, ry = -100, dx = NaN, dy = NaN;
    const state = (el) => {
      const t = el && el.closest ? el.closest('[data-cursor],a,button,summary,input,select,textarea,label') : null;
      const l = t && t.dataset.cursor;
      c.classList.toggle('is-label', !!l); c.classList.toggle('is-link', !!t && !l);
      if (l) lab.textContent = l;
    };
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; state(e.target); }, { passive: true });
    let lastSy = -1, wait = 0, burst = 0;
    document.addEventListener('mouseleave', () => (c.style.opacity = 0));
    document.addEventListener('mouseenter', () => (c.style.opacity = 1));
    const kick = () => { burst = 80; };                               // un clic o tecla puede abrir una vista bajo el puntero quieto
    document.addEventListener('click', kick); addEventListener('keydown', kick);
    return () => {
      // lo que hay bajo el puntero cambia con el scroll o con una vista nueva: se revisa entonces, no en cada frame
      if (sy !== lastSy) { lastSy = sy; if (!wait) wait = 10; }
      let look = false;
      if (wait && --wait === 0) look = true;
      if (burst > 0 && --burst % 6 === 0) look = true;
      if (look && x > 0) state(document.elementFromPoint(x, y));
      if (x === dx && y === dy && Math.abs(x - rx) < .05 && Math.abs(y - ry) < .05) { rx = x; ry = y; return; }   // puntero quieto: nada que mover
      rx = lerp(rx, x, .2); ry = lerp(ry, y, .2);
      dx = x; dy = y;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    };
  }

  /* ---------- 17 · Botones magnéticos ------------------------------------------------------------------------ */
  function magnetic() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px,0)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- 18 · Cabecera, menú y navegación por secciones ---------------------------------------------------- */
  function header() {
    const h = $('#hdr');
    let last = 0;
    return () => {
      h.classList.toggle('is-solid', sy > 40);
      const d = sy - last;
      if (Math.abs(d) > 8) { h.classList.toggle('is-hidden', d > 0 && sy > 120 && !menuOpen); last = sy; }
    };
  }
  function menu() {
    const burger = $('.burger'), m = $('#menu');
    if (!burger || !m) return;
    setMenu = (open) => {
      menuOpen = open;
      burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      m.classList.toggle('is-open', open); m.setAttribute('aria-hidden', String(!open)); root.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => setMenu(!menuOpen));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
    matchMedia('(min-width: 900px)').addEventListener('change', (e) => e.matches && setMenu(false));
  }
  function sectionNav() {
    const secs = $$('[data-label]');
    secs.forEach((s) => { if (!s.id) s.id = s.dataset.label.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); });
    const dots = $('.dots');
    const all = [$('#inicio'), ...secs].filter(Boolean);
    if (dots) {
      all.forEach((s) => {
        const a = document.createElement('a');
        a.href = '#' + s.id; a.innerHTML = `<span>${s.dataset.label || 'Inicio'}</span>`; a.setAttribute('aria-label', s.dataset.label || 'Inicio');
        dots.appendChild(a);
      });
      dots.hidden = false;
    }
    const links = $$('.hdr__nav a, .dots a');
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (a.parentElement === dots) a.classList.toggle('on', on);
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    all.forEach((s) => io.observe(s));
  }

  /* ---------- 19 · Pie que se revela debajo del contenido ------------------------------------------------------------- */
  function footer() {
    const f = $('#ftr'), m = $('main');
    if (!f || !m) return;
    const apply = () => {
      f.classList.remove('ftr--fixed'); m.style.marginBottom = '';
      if (innerWidth >= 900 && f.offsetHeight < innerHeight * .96) { m.style.marginBottom = f.offsetHeight + 'px'; f.classList.add('ftr--fixed'); }
    };
    apply(); addEventListener('resize', () => setTimeout(apply, 100)); addEventListener('load', apply);
    document.fonts && document.fonts.ready.then(apply);
    window.relayoutFooter = apply;
  }

  /* ---------- 20 · Formulario → WhatsApp + botón flotante ----------------------------------------------------------------- */
  function contact() {
    const form = $('#contactForm'), sel = $('#f-servicio');
    if (sel) sel.addEventListener('change', () => sel.classList.toggle('has-v', !!sel.value));
    if (form) {
      const status = $('.form__status', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.website && form.website.value) return;                // honeypot anti-spam
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const v = (n) => ((form[n] && form[n].value) || '').trim();
        const lines = ['Hola DIIA, vi su página web y me gustaría platicarles mi proyecto.', '', '*Nombre:* ' + v('nombre')];
        if (v('telefono')) lines.push('*Teléfono:* ' + v('telefono'));
        if (v('servicio')) lines.push('*Me interesa:* ' + v('servicio'));
        if (v('mensaje')) lines.push('*Mi proyecto:* ' + v('mensaje'));
        const url = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
        if (status) status.textContent = 'Abriendo WhatsApp…';
        if (!window.open(url, '_blank', 'noopener')) location.href = url;
      });
    }
    const fl = $('.wa');
    if (fl) { setTimeout(() => fl.classList.add('show-label'), 7000); setTimeout(() => fl.classList.remove('show-label'), 13500); }
  }

  /* ---------- Arranque y bucle principal ---------------------------------------------------------------------------------------- */
  function boot() {
    scrollTo(0, 0);
    split(); reveals(); counters(); faq(); menu(); sheet(); anchors(); smoothInit(); magnetic(); contact(); footer(); sectionNav();

    const tasks = [hero(), heroCanvas(), words(), parallax(), services(), marquee(), work(), lens(), process(), cursor(), header()];
    const bar = $('.progress'), lines = $('.contact__lines'), contactSec = $('#contacto');
    const contactVis = watch(contactSec, 0);
    let barSy = -1;
    const frame = (t) => {
      smoothStep();
      sy = scrollY;
      if (bar && sy !== barSy) { barSy = sy; bar.style.setProperty('--p', (sy / Math.max(1, maxScroll())).toFixed(4)); }
      for (const fn of tasks) fn(t);
      if (lines && contactVis.on) lines.style.transform = `translate3d(${(-((sy * .08) % 64)).toFixed(1)}px,0,0)`;   // el patrón se repite cada 64 px
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { vw = innerWidth; vh = innerHeight; relayoutWork(); }, 140);
    });
    addEventListener('load', () => relayoutWork());
    document.fonts && document.fonts.ready.then(() => relayoutWork());

    loader().then(() => root.classList.add('is-ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(() => root.classList.remove('is-loading'), 10000);        // red de seguridad
})();
