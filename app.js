/* ============================================================
   Mental Health Tanzania — interactive layer
   ============================================================ */
(() => {
'use strict';
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- header + mobile nav ---------- */
const head  = $('#siteHead');
const nav   = $('#mainNav');
const burger = $('#burger');
const progBar = $('#progressBar'), topBtn = $('#toTop');
addEventListener('scroll', () => {
  head.classList.toggle('scrolled', scrollY > 30);
  if (progBar) progBar.style.width =
    (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
  if (topBtn) topBtn.classList.toggle('show', scrollY > innerHeight * .8);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('#mainNav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));
if (topBtn) topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = Math.min(i % 4 * 70, 210) + 'ms';
  io.observe(el);
});

/* ---------- journey dots + nav highlight ---------- */
const journeyLinks = $$('.journey a');
const navLinks     = $$('#mainNav a');
const tabLinks = $$('.page-tabs a');
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const id = '#' + e.target.id;
  journeyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
  tabLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
}), { rootMargin: '-45% 0px -45% 0px' });
$$('main section[id]').forEach(s => secIO.observe(s));

/* ---------- custom cursor ---------- */
if (finePointer && !reduceMotion) {
  const cur = $('#cursor');
  let cx = -100, cy = -100, tx = cx, ty = cy;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    cx += (tx - cx) * .22; cy += (ty - cy) * .22;
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(loop);
  })();
  $$('a, button, [data-flip]').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('big'));
    el.addEventListener('mouseleave', () => cur.classList.remove('big'));
  });
}

/* ---------- neural canvas ---------- */
(function neuro() {
  const cv = $('#neuro');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -9e3, y: -9e3 };
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const N = () => Math.min(90, Math.floor(W * H / 16000));

  function resize() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    pts = Array.from({ length: N() }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: 1 + Math.random() * 1.6
    }));
  }
  resize();
  addEventListener('resize', resize);
  cv.parentElement.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  cv.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9e3; });

  const LINK = 130, MLINK = 190;
  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      // gentle attraction to mouse
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < MLINK && d > 0) { p.x += dx / d * .25; p.y += dy / d * .25; }
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(47,208,127,${(1 - d / LINK) * .28})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const p = pts[i];
      const dm = Math.hypot(mouse.x - p.x, mouse.y - p.y);
      if (dm < MLINK) {
        ctx.strokeStyle = `rgba(124,231,178,${(1 - dm / MLINK) * .5})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(124,231,178,.75)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- mood check-in ---------- */
const feelMsg = $('#feelMsg'), feelBreathe = $('#feelBreathe'), feelCall = $('#feelCall');
$$('.mood').forEach(btn => btn.addEventListener('click', () => {
  $$('.mood').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  feelMsg.classList.add('flash');
  setTimeout(() => {
    feelMsg.textContent = btn.dataset.msg;
    feelMsg.classList.remove('flash');
  }, 180);
  const heavy = ['anxious', 'stressed', 'low'].includes(btn.dataset.mood);
  feelBreathe.classList.toggle('hidden', !heavy);
  feelCall.classList.toggle('hidden', btn.dataset.mood !== 'low');
}));

/* ---------- flip cards ---------- */
$$('[data-flip]').forEach(c => c.addEventListener('click', () => c.classList.toggle('flipped')));

/* ---------- stat counters ---------- */
const fmt = (n, compact) => compact
  ? (n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : n) + '+'
  : n.toLocaleString();
const statIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  statIO.unobserve(e.target);
  const el = e.target, target = +el.dataset.count;
  const suf = el.dataset.suffix || '', compact = el.dataset.compact;
  const t0 = performance.now(), dur = 1600;
  (function step(t) {
    const k = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(target * ease), compact) + suf;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}), { threshold: .6 });
$$('.stat-n').forEach(el => statIO.observe(el));

/* ---------- burnout signal checker ---------- */
const sigBtns = $$('#signals button'), gFill = $('#gaugeFill'), gOut = $('#gaugeOut');
const maxW = sigBtns.reduce((s, b) => s + +b.dataset.w, 0);
function updateGauge() {
  const score = sigBtns.filter(b => b.classList.contains('on')).reduce((s, b) => s + +b.dataset.w, 0);
  const pct = score / maxW * 100;
  gFill.style.width = pct + '%';
  gOut.classList.remove('warn', 'high');
  if (!score)        gOut.textContent = 'Select signals above to see your team’s risk level.';
  else if (pct < 34) gOut.textContent = 'Some strain visible — a wellbeing session could prevent it growing.';
  else if (pct < 67) { gOut.textContent = 'Your team is strained. A mental health retreat or training is strongly recommended.'; gOut.classList.add('warn'); }
  else               { gOut.textContent = 'High burnout risk. Book MHT’s Workplace Mental Health Training — call 0742 501 501 today.'; gOut.classList.add('high'); }
}
sigBtns.forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); updateGauge(); }));

/* ---------- VMO tabs ---------- */
$$('.vmo-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.vmo-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
  tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
  $$('.vmo-panel').forEach(p => {
    const on = p.id === 'panel-' + tab.dataset.tab;
    p.classList.toggle('active', on);
    p.hidden = !on;
  });
}));

/* ---------- Tuliza breathing tool ---------- */
(function tuliza() {
  const orb = $('#tzOrb');
  if (!orb) return;
  const phaseEl = $('#tzPhase'), countEl = $('#tzCount'),
        cyclesEl = $('#tzCycles'), toggle = $('#tzToggle'), soundBtn = $('#tzSound');
  let seq = [4, 4, 4, 4], labels = ['Inhale', 'Hold', 'Exhale', 'Hold'];
  let running = false, step = -1, remaining = 0, cycles = 0, timer = null, scale = .62, firstPass = true;

  // soft chime via WebAudio (off by default)
  let audio = null, soundOn = false;
  function chime(freq) {
    if (!soundOn) return;
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.12, audio.currentTime + .05);
    g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + 1.4);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + 1.5);
  }
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', soundOn);
    if (soundOn) chime(528);
  });

  $$('.tz-tech').forEach(b => b.addEventListener('click', () => {
    $$('.tz-tech').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    seq = b.dataset.seq.split(',').map(Number);
    labels = b.dataset.labels.split(',');
    if (running) { stop(); start(); }
    else reset();
  }));

  function setScale() {
    const label = labels[step];
    scale = label === 'Inhale' ? 1 : label === 'Exhale' ? .62 : scale;
    const dur = seq[step] * 1000;
    orb.style.transitionDuration = (label === 'Hold' ? 300 : dur) + 'ms';
    orb.style.transform = `scale(${scale})`;
    orb.classList.toggle('inhale', scale === 1);
  }
  function reset() {
    phaseEl.textContent = 'Ready?'; countEl.textContent = '—';
    toggle.textContent = 'Begin breathing';
    step = -1; remaining = 0; firstPass = true;
    orb.style.transitionDuration = '800ms';
    orb.style.transform = 'scale(.62)'; orb.classList.remove('inhale');
    scale = .62;
  }
  function enterPhase() {
    step = (step + 1) % seq.length;
    if (step === 0) {
      if (!firstPass) { cycles++; cyclesEl.textContent = `${cycles} cycle${cycles === 1 ? '' : 's'}`; }
      firstPass = false;
    }
    phaseEl.textContent = labels[step];
    remaining = seq[step];
    setScale();
    if (labels[step] === 'Inhale') chime(432); else if (labels[step] === 'Exhale') chime(384);
  }
  function next() {
    if (!running) return;
    if (remaining <= 0) enterPhase();
    countEl.textContent = remaining;
    remaining--;
    timer = setTimeout(next, 1000);
  }
  function start() {
    running = true; step = -1; remaining = 0; cycles = 0; firstPass = true;
    cyclesEl.textContent = '0 cycles';
    toggle.textContent = 'Pause';
    next();
  }
  function stop() {
    running = false; clearTimeout(timer);
    toggle.textContent = 'Resume';
    phaseEl.textContent = 'Paused';
  }
  toggle.addEventListener('click', () => {
    if (running) { stop(); return; }
    running = true; toggle.textContent = 'Pause';
    if (step >= 0) phaseEl.textContent = labels[step];
    next();
  });
})();

/* ---------- marquee duplication ---------- */
const track = $('#marqueeTrack');
if (track) track.innerHTML += track.innerHTML;

/* ---------- posts search ---------- */
const postItems = $$('#posts li');
const postSearch = $('#postSearch');
if (postSearch) postSearch.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  let shown = 0;
  postItems.forEach(li => {
    const hit = !q || li.textContent.toLowerCase().includes(q);
    li.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  $('#postsEmpty').classList.toggle('hidden', shown > 0);
});

/* ---------- tilt cards ---------- */
if (finePointer && !reduceMotion) {
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
  /* magnetic buttons */
  $$('[data-magnet]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}
})();
