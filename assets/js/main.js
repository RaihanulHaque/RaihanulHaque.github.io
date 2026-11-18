/* Rahi — portfolio interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  /* ---------- Page load entrance ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });
  });

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- Theme ---------- */
  var themeBtn = $('#themeToggle');
  var metaTheme = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#f4efe7' : '#0e0c0b');
    try { localStorage.setItem('theme', t); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  if (metaTheme) metaTheme.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#f4efe7' : '#0e0c0b');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn');
  var menu = $('#mobileMenu');
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('a', menu); if (first) first.focus(); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  if (menu) $all('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 820 && menu && !menu.hidden) setMenu(false); });

  /* ---------- Scroll: nav state, progress, timeline, parallax ---------- */
  var nav = $('#nav');
  var progress = $('.progress');
  var timeline = $('#timeline');
  var tlItems = $all('.tl');
  var feature = $('.feature');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var docH = document.documentElement.scrollHeight - vh;

    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
      var menuOpen = menu && !menu.hidden;
      if (!menuOpen) nav.classList.toggle('is-hidden', y > 700 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    if (progress) progress.style.setProperty('--p', docH > 0 ? (y / docH).toFixed(4) : 0);

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var mark = vh * 0.6;
      var p = clamp((mark - r.top) / r.height, 0, 1);
      timeline.style.setProperty('--tl', p.toFixed(4));
      tlItems.forEach(function (li) {
        li.classList.toggle('is-lit', li.getBoundingClientRect().top + 14 < mark);
      });
    }

    if (feature && !reduceMotion) {
      var fr = feature.getBoundingClientRect();
      if (fr.bottom > 0 && fr.top < vh) {
        var t = (fr.top + fr.height / 2 - vh / 2) / vh; // -1 .. 1 roughly
        feature.style.setProperty('--py1', (t * 40).toFixed(1) + 'px');
        feature.style.setProperty('--py2', (t * -30).toFixed(1) + 'px');
      }
    }

    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Active nav link ---------- */
  var navLinks = $all('[data-nav]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var activeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'experience', 'research', 'contact'].forEach(function (id) {
      var s = document.getElementById(id); if (s) activeIO.observe(s);
    });
    var heroIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) navLinks.forEach(function (a) { a.classList.remove('is-active'); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'about'].forEach(function (id) { var s = document.getElementById(id); if (s) heroIO.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $all('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Counters ---------- */
  var counters = $all('[data-count]');
  function renderCount(el, v) {
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = v.toFixed(dec) + (el.getAttribute('data-suffix') || '');
  }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduceMotion) { renderCount(el, target); return; }
    var start = performance.now(), dur = 1800;
    (function step(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out expo
      renderCount(el, target * e);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); countIO.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Cursor spotlight + magnetic buttons ---------- */
  if (finePointer) {
    $all('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (!reduceMotion) {
      $all('.magnetic').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
        });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      });
    }
  }

  /* ---------- Card visuals: generated cells ---------- */
  var plots = $('.plots');
  if (plots) {
    var cols = 14, rows = 5, frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = document.createElement('i');
        var d = Math.hypot(c - 2, r - 2) * 0.18; // ripple out from one corner
        i.style.setProperty('--dl', d.toFixed(2) + 's');
        frag.appendChild(i);
      }
    }
    plots.appendChild(frag);
  }
  var bars = $('.bars');
  if (bars) {
    var n = 42, bf = document.createDocumentFragment();
    for (var b = 0; b < n; b++) {
      var bar = document.createElement('i');
      var env = Math.sin((b / (n - 1)) * Math.PI); // louder in the middle
      var h = 18 + env * 62 * (0.55 + 0.45 * Math.abs(Math.sin(b * 1.7)));
      bar.style.setProperty('--h', h.toFixed(0) + '%');
      bar.style.setProperty('--dl', (-(b * 0.09) % 1.4).toFixed(2) + 's');
      bf.appendChild(bar);
    }
    bars.appendChild(bf);
  }
  function sizeScans() {
    $all('.depth').forEach(function (el) { el.style.setProperty('--scan-w', (el.clientWidth - 2) + 'px'); });
  }
  sizeScans();
  window.addEventListener('resize', sizeScans);

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copyMail');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      var done = function () {
        copyBtn.classList.add('is-done');
        toast('Email copied');
        setTimeout(function () { copyBtn.classList.remove('is-done'); }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) && done(); });
      } else if (fallbackCopy(text)) { done(); }
    });
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  /* =========================================================
     Hero: flow field of ember particles
     ========================================================= */
  (function flowField() {
    var canvas = $('#field');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], running = false, visible = true, raf = 0;
    var t = 0;
    var pointer = { x: -9999, y: -9999, active: false };
    var colEmber = '255,122,47', colText = '237,228,216', isLight = false;

    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    }
    function readColors() {
      try { colEmber = hexToRgb(cssVar('--ember')); colText = hexToRgb(cssVar('--text')); } catch (e) {}
      isLight = root.getAttribute('data-theme') === 'light';
    }

    function spawn(p, anywhere) {
      p.x = Math.random() * W;
      p.y = anywhere ? Math.random() * H : Math.random() * H;
      p.px = p.x; p.py = p.y;
      p.life = 0;
      p.max = 140 + Math.random() * 260;
      p.speed = 0.55 + Math.random() * 1.1;
      p.ember = Math.random() < 0.62;
      p.w = p.ember ? (Math.random() < 0.15 ? 1.8 : 1.1) : 0.8;
      return p;
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(clamp((W * H) / 2400, 160, 720));
      if (W < 600) target = Math.round(target * 0.6);
      parts.length = 0;
      for (var i = 0; i < target; i++) parts.push(spawn({}, true));
      ctx.clearRect(0, 0, W, H);
    }

    // Smooth pseudo-noise: a few layered sines read as a flowing field.
    function angle(x, y) {
      return (
        Math.sin(x * 0.0018 + t * 0.21) +
        Math.cos(y * 0.0023 - t * 0.17) +
        Math.sin((x - y) * 0.0011 + t * 0.09) * 0.8
      ) * 1.35;
    }

    function frame() {
      t += 0.012;
      // Fade old trails toward transparent so the page background shows through.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + (isLight ? 0.09 : 0.07) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round';

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var a = angle(p.x, p.y);
        var vx = Math.cos(a) * p.speed;
        var vy = Math.sin(a) * p.speed;

        if (pointer.active) { // gentle swirl around the cursor
          var dx = p.x - pointer.x, dy = p.y - pointer.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 22000) {
            var f = (1 - d2 / 22000) * 2.2;
            var inv = 1 / Math.sqrt(d2 + 0.01);
            vx += (dx * inv + -dy * inv * 0.9) * f;
            vy += (dy * inv + dx * inv * 0.9) * f;
          }
        }

        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy;
        p.life++;

        var lifeT = p.life / p.max;
        var alpha = Math.sin(Math.PI * clamp(lifeT, 0, 1));
        alpha *= p.ember ? (isLight ? 0.55 : 0.75) : (isLight ? 0.22 : 0.28);

        ctx.strokeStyle = 'rgba(' + (p.ember ? colEmber : colText) + ',' + alpha.toFixed(3) + ')';
        ctx.lineWidth = p.w;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        if (p.life > p.max || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) spawn(p, true);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    readColors();
    resize();

    if (reduceMotion) { // a quiet, still version
      for (var k = 0; k < 90; k++) frame(), cancelAnimationFrame(raf);
      return;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        visible ? start() : stop();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    document.addEventListener('themechange', function () { readColors(); ctx.clearRect(0, 0, W, H); });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
    });
    hero.addEventListener('pointerleave', function () { pointer.active = false; });

    start();
  })();

  /* =========================================================
     Hero: Hishab replay (input -> tokens -> ledger)
     Output format matches the v13 model: description|±amount|category
     ========================================================= */
  (function hishabDemo() {
    var inputEl = $('#demoInput'), msgEl = $('#demoMsg'), streamEl = $('#demoStream'),
        ledgerEl = $('#demoLedger'), tpsEl = $('#demoTps');
    if (!inputEl) return;

    var examples = [
      { text: 'Ajke tution fee 5k disi, riksha 80, cha 20',
        out: [['tuition fee', -5000, 'tuition'], ['rickshaw', -80, 'transport'], ['tea', -20, 'food']] },
      { text: 'ডাক্তার ৫০০, ওষুধ ৩৫০',
        out: [['doctor', -500, 'medical'], ['medicine', -350, 'medical']] },
      { text: 'basha vara dilam 12000',
        out: [['house rent', -12000, 'rent']] },
      { text: 'salary paisi 45k, bazar 1200',
        out: [['salary', 45000, 'salary'], ['groceries', -1200, 'grocery']] }
    ];

    function fmt(n) { return (n < 0 ? '−' : '+') + '৳' + Math.abs(n).toLocaleString('en-US'); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function waitVisible() {
      return new Promise(function (res) {
        if (!document.hidden) return res();
        document.addEventListener('visibilitychange', function h() {
          if (!document.hidden) { document.removeEventListener('visibilitychange', h); res(); }
        });
      });
    }

    // Split a line into small "tokens" so the stream looks like real decoding.
    function tokenize(s) {
      var out = [], m, re = /\s?[^\s|]{1,4}|\|/g;
      while ((m = re.exec(s))) out.push(m[0]);
      return out;
    }

    function renderStatic(ex) {
      inputEl.textContent = ex.text;
      msgEl.classList.add('is-done');
      streamEl.textContent = ex.out.map(function (o) { return o[0] + '|' + (o[1] > 0 ? '+' : '') + o[1] + '|' + o[2]; }).join('\n');
      ledgerEl.innerHTML = '';
      ex.out.forEach(function (o) { ledgerEl.appendChild(row(o, 0)); });
      tpsEl.textContent = '51';
    }

    function row(o, i) {
      var li = document.createElement('li');
      li.style.animationDelay = (i * 120) + 'ms';
      li.innerHTML = '<span class="desc"></span><span class="cat"></span><span class="amt"></span>';
      li.querySelector('.desc').textContent = o[0];
      li.querySelector('.cat').textContent = o[2];
      var amt = li.querySelector('.amt');
      amt.textContent = fmt(o[1]);
      if (o[1] > 0) amt.classList.add('in');
      return li;
    }

    if (reduceMotion) { renderStatic(examples[0]); return; }

    var idx = 0;
    async function loop() {
      await sleep(1400); // let the hero entrance finish
      for (;;) {
        await waitVisible();
        var ex = examples[idx % examples.length];
        idx++;

        // reset
        ledgerEl.classList.add('is-leaving');
        await sleep(ledgerEl.children.length ? 450 : 0);
        ledgerEl.classList.remove('is-leaving');
        ledgerEl.innerHTML = '';
        streamEl.innerHTML = '';
        inputEl.textContent = '';
        msgEl.classList.remove('is-done');
        tpsEl.textContent = '0';

        // type the message like a person would
        var chars = Array.from(ex.text);
        for (var c = 0; c < chars.length; c++) {
          inputEl.textContent += chars[c];
          await sleep(28 + Math.random() * 55 + (chars[c] === ',' ? 160 : 0));
        }
        msgEl.classList.add('is-done');
        await sleep(380);

        // stream the model output at ~51 tok/s
        for (var l = 0; l < ex.out.length; l++) {
          var o = ex.out[l];
          var amtStr = (o[1] > 0 ? '+' : '') + o[1];
          var parts = [
            { s: o[0], cls: '' }, { s: '|', cls: 'sep' },
            { s: amtStr, cls: o[1] > 0 ? 'pos' : 'neg' }, { s: '|', cls: 'sep' },
            { s: o[2], cls: '' }
          ];
          for (var p = 0; p < parts.length; p++) {
            var toks = parts[p].cls === 'sep' ? ['|'] : tokenize(parts[p].s);
            for (var k = 0; k < toks.length; k++) {
              var span = document.createElement('span');
              span.className = 'tok' + (parts[p].cls ? ' ' + parts[p].cls : '');
              span.textContent = toks[k];
              streamEl.appendChild(span);
              tpsEl.textContent = String(Math.round(48 + Math.random() * 6));
              await sleep(1000 / 51);
            }
          }
          if (l < ex.out.length - 1) streamEl.appendChild(document.createTextNode('\n'));
        }
        tpsEl.textContent = '51';
        await sleep(260);

        // turn lines into ledger rows
        ex.out.forEach(function (o, i) { ledgerEl.appendChild(row(o, i)); });
        await sleep(3200);
      }
    }
    loop();
  })();
})();
