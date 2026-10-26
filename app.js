// Non-fatal error breadcrumb (never blocks the page)
window.addEventListener('error', (e) => { try { console.warn('[schematic]', e.message); } catch (_) {} });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = reduceMotion ? 'auto' : 'smooth';

// Pure data + scoring, from assets/js/schema-model.js (a classic script loaded before this one).
// Falls back to empty so a load failure degrades the finder/Reflect rather than halting the page.
const { SCHEMAS, DOMAINS, STATEMENTS, ORDER, scoreSchemas, scoreReflection, nameOf, domOf } = window.SchemaModel || {};

// Make the page behind an open modal inert (removes it from tab + AT reading order).
// Queried lazily and null-guarded so it is safe regardless of DOM readiness.
function setBgInert(on) {
  [document.getElementById('nav'), document.querySelector('main'),
   document.querySelector('.footer'), document.getElementById('to-top')]
    .forEach(el => { if (el) el.toggleAttribute('inert', on); });
}

// ===== Nav background on scroll + back-to-top =====
const nav = document.getElementById('nav');
const toTop = document.getElementById('to-top');
const updateNavChrome = () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  if (toTop) toTop.classList.toggle('show', window.scrollY > 700);
};
if (toTop) toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: smooth });
  document.querySelector('.brand').focus?.();
});

// ===== Mobile nav toggle =====
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (navToggle.getAttribute('aria-expanded') === 'true'
      && !navLinks.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
  });
}

// ===== Scroll-spy active nav (aria-current) =====
const spyPairs = [];
document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
  const sec = document.getElementById(a.getAttribute('href').slice(1));
  if (sec) spyPairs.push({ a, sec });
});
let activeLink = null;
function updateActiveNav() {
  if (!spyPairs.length) return;
  const line = window.scrollY + window.innerHeight * 0.4;
  let current = null;
  for (const { a, sec } of spyPairs) {
    if (sec.offsetTop <= line) current = a;
  }
  // near the very bottom, force the last section active
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
    current = spyPairs[spyPairs.length - 1].a;
  }
  if (current !== activeLink) {
    if (activeLink) activeLink.removeAttribute('aria-current');
    if (current) current.setAttribute('aria-current', 'true');
    activeLink = current;
  }
}
// one rAF-coalesced scroll handler — both of these read layout, so batch per frame
let scrollTicking = false;
function onScrollFrame() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => { updateNavChrome(); updateActiveNav(); scrollTicking = false; });
}
window.addEventListener('scroll', onScrollFrame, { passive: true });
updateNavChrome();
updateActiveNav();

// ===== External links: announce new tab, ensure noopener =====
document.querySelectorAll('a[target="_blank"]').forEach(a => {
  a.rel = 'noopener noreferrer';
  if (!a.querySelector('.sr-only')) {
    const s = document.createElement('span');
    s.className = 'sr-only';
    s.textContent = ' (opens in a new tab)';
    a.appendChild(s);
  }
});

// ===== Reveal on scroll =====
const revealEls = document.querySelectorAll(
  '.section-head, .prose, .def, .card, .tile, .schema, .doc, .refs, .constructs-title, .finder, .domain-head, .res-group, .care, .about-note'
);
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => io.observe(el));

// ===== Accessible term tooltips (hover + focus + tap) =====
document.querySelectorAll('.term').forEach(term => {
  term.addEventListener('click', () => {
    const open = term.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.term').forEach(t => t.setAttribute('aria-expanded', 'false'));
    term.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('term')) {
    document.querySelectorAll('.term').forEach(t => t.setAttribute('aria-expanded', 'false'));
  }
});
// Esc dismisses an open tooltip (even on hover/focus); re-engaging re-enables it (WCAG 1.4.13)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.term').forEach(t => { t.setAttribute('aria-expanded', 'false'); t.classList.add('dismissed'); });
});
document.querySelectorAll('.term').forEach(t => {
  t.addEventListener('mouseenter', () => t.classList.remove('dismissed'));
  t.addEventListener('focus', () => t.classList.remove('dismissed'));
});

// ===== Guided finder =====
const cards = Array.from(document.querySelectorAll('.schema'));
const fInput = document.getElementById('finder-input');
const fResults = document.getElementById('finder-results');
const fForm = document.getElementById('finder-form');

function jumpToSchema(n) {
  const card = cards[n - 1];
  if (!card) return;
  card.scrollIntoView({ behavior: smooth, block: 'center' });
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
}

function runFinder(text) {
  fResults.innerHTML = '';
  const t = text.trim();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'finder-none';
    p.textContent = 'Type a few words about how you have been feeling, then press Find.';
    fResults.appendChild(p);
    fInput.focus();
    return;
  }
  const matches = scoreSchemas(t);
  if (!matches.length) {
    const p = document.createElement('p');
    p.className = 'finder-none';
    p.textContent = 'No clear match from those words — try describing a feeling or situation, or browse the domains below.';
    fResults.appendChild(p);
    fResults.scrollIntoView({ behavior: smooth, block: 'nearest' });
    return;
  }
  const lead = document.createElement('p');
  lead.className = 'finder-lead';
  lead.textContent = 'These schemas may resonate with what you described:';
  fResults.appendChild(lead);
  matches.forEach(({ s }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'finder-match';
    b.innerHTML = `<span class="fm-no">${String(s.n).padStart(2, '0')}</span>`
      + `<span class="fm-body"><span class="fm-name">${s.name}</span>`
      + `<p class="fm-dom">${s.dom}</p></span>`
      + `<span class="fm-arrow" aria-hidden="true">→</span>`;
    b.setAttribute('aria-label', `Go to schema ${s.n}, ${s.name}`);
    b.addEventListener('click', () => jumpToSchema(s.n));
    fResults.appendChild(b);
  });
  fResults.scrollIntoView({ behavior: smooth, block: 'nearest' });
}

if (fForm) {
  fForm.addEventListener('submit', (e) => { e.preventDefault(); runFinder(fInput.value); });
  document.querySelectorAll('#finder-examples button').forEach(chip => {
    chip.addEventListener('click', () => { fInput.value = chip.dataset.q; runFinder(chip.dataset.q); fInput.focus(); });
  });
}

// ===== Lightbox =====
const lb = document.getElementById('lightbox');
if (lb) {
// page the schema posters and the gallery tiles as two separate loops
const groups = {
  schema: Array.from(document.querySelectorAll('.schema')),
  gallery: Array.from(document.querySelectorAll('.tile')),
};
const lbImg = lb.querySelector('.lb-img');
const lbCap = lb.querySelector('.lb-cap');
const lbClose = lb.querySelector('.lb-close');
let group = 'schema';
let idx = 0;
let lastFocus = null;

function show(i) {
  const list = groups[group];
  idx = (i + list.length) % list.length;
  const t = list[idx];
  const cap = t.dataset.cap || '';
  const desc = (t.querySelector('figcaption p')?.textContent || '').trim();
  lbImg.src = t.dataset.full;
  lbImg.alt = desc ? `${cap}. ${desc}` : cap;
  // build caption as title (+ optional description) — textContent only, no innerHTML
  lbCap.textContent = '';
  const ts = document.createElement('span');
  ts.className = 'lb-title';
  ts.textContent = cap;
  lbCap.appendChild(ts);
  if (desc) {
    const ds = document.createElement('span');
    ds.className = 'lb-desc';
    ds.textContent = desc;
    lbCap.appendChild(ds);
  }
}
function open(g, i) {
  group = g;
  lastFocus = document.activeElement;
  show(i);
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  setBgInert(true);
  lbClose.focus();
}
function close() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  setBgInert(false);
  lbImg.src = '';
  if (lastFocus) lastFocus.focus();
}

Object.keys(groups).forEach(g => groups[g].forEach((t, i) => {
  t.setAttribute('role', 'button');
  t.setAttribute('tabindex', '0');
  t.addEventListener('click', () => open(g, i));
  t.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(g, i); }
  });
}));
lbClose.addEventListener('click', close);
lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowRight') show(idx + 1);
  else if (e.key === 'ArrowLeft') show(idx - 1);
  else if (e.key === 'Tab') {
    const f = lb.querySelectorAll('button');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
} // end lightbox guard

// ===== Reflect (self-check tool) — STATEMENTS, DOMAINS, ORDER come from SchemaModel =====
const rf = document.getElementById('reflect');
if (rf) {
  const openBtn = document.getElementById('reflect-open');
  const closeBtn = document.getElementById('reflect-close');
  const stepIntro = document.getElementById('step-intro');
  const stepQ = document.getElementById('step-q');
  const stepRes = document.getElementById('step-results');
  const prog = document.getElementById('reflect-progress');
  const rpFill = document.getElementById('rp-fill');
  const rpCount = document.getElementById('rp-count');
  const rpBar = document.getElementById('rp-bar');
  const live = document.getElementById('reflect-live');
  const stmtEl = document.getElementById('reflect-statement');
  const scale = document.getElementById('reflect-scale');

  let answers = {};
  let qi = 0;
  let rfLastFocus = null;

  function openReflect() {
    rfLastFocus = document.activeElement;
    rf.classList.add('open');
    rf.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setBgInert(true);
    showIntro();
  }
  function closeReflect() {
    rf.classList.remove('open');
    rf.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setBgInert(false);
    if (rfLastFocus) rfLastFocus.focus();
  }
  function only(step) {
    [stepIntro, stepQ, stepRes].forEach(s => { s.hidden = (s !== step); });
    rf.querySelector('.reflect-panel').scrollTop = 0;
  }
  function showIntro() { only(stepIntro); prog.hidden = true; document.getElementById('reflect-begin').focus(); }

  function renderQ() {
    const n = ORDER[qi];
    stmtEl.textContent = STATEMENTS[n];
    prog.hidden = false;
    rpFill.style.width = (qi / ORDER.length * 100) + '%';
    rpCount.textContent = (qi + 1) + ' / ' + ORDER.length;
    if (rpBar) { rpBar.setAttribute('aria-valuenow', qi + 1); rpBar.setAttribute('aria-valuetext', `Question ${qi + 1} of ${ORDER.length}`); }
    document.getElementById('reflect-back').disabled = qi === 0;
    scale.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', answers[n] == b.dataset.v ? 'true' : 'false'));
    if (live) live.textContent = `Question ${qi + 1} of ${ORDER.length}. ${STATEMENTS[n]}`;
  }
  function startQuiz() { qi = 0; only(stepQ); renderQ(); scale.querySelector('button').focus(); }
  function advance() {
    if (qi < ORDER.length - 1) { qi++; renderQ(); scale.querySelector('button').focus(); }
    else { showResults(); }
  }

  function showResults() {
    only(stepRes);
    prog.hidden = true;
    const { domains: dom, strong } = scoreReflection(answers);

    const top = dom[0];
    const summary = document.getElementById('results-summary');
    if (!top || top.pct <= 0) {
      summary.textContent = "Nothing stood out strongly today — and noticing that is worth something too. Browse the domains below whenever you're curious.";
    } else if (top.pct < 40) {
      summary.textContent = `Nothing was overwhelming, but what resonated most leans toward ${top.name}. Treat this as a gentle prompt, not a label.`;
    } else {
      summary.textContent = `What resonated most sits in ${top.name}. That's a starting point for reflection — not a diagnosis.`;
    }

    const bars = document.getElementById('domain-bars');
    bars.innerHTML = '';
    dom.forEach(d => {
      const el = document.createElement('div');
      el.className = 'dbar';
      el.innerHTML = `<div class="dbar-top"><span class="dbar-name"><span class="rn">${d.rn}</span>${d.name}</span>`
        + `<span class="dbar-pct">${d.pct}%</span></div>`
        + `<div class="dbar-track"><div class="dbar-fill"></div></div>`;
      bars.appendChild(el);
      requestAnimationFrame(() => { el.querySelector('.dbar-fill').style.width = d.pct + '%'; });
    });

    const wrap = document.getElementById('results-schemas');
    wrap.innerHTML = '';
    if (!strong.length) {
      const p = document.createElement('p');
      p.className = 'reflect-none';
      p.textContent = 'No single schema stood out strongly. You can still explore any of the eighteen below.';
      wrap.appendChild(p);
    } else {
      strong.forEach(({ n }) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'results-schema';
        b.innerHTML = `<span class="rs-no">${String(n).padStart(2, '0')}</span>`
          + `<span class="rs-body"><span class="rs-name">${nameOf(n)}</span>`
          + `<div class="rs-dom">${domOf(n)}</div></span><span class="rs-arrow" aria-hidden="true">→</span>`;
        b.setAttribute('aria-label', `Go to schema ${n}, ${nameOf(n)}`);
        b.addEventListener('click', () => { closeReflect(); setTimeout(() => jumpToSchema(n), 260); });
        wrap.appendChild(b);
      });
    }
    if (live) live.textContent = 'Reflection complete. ' + summary.textContent;
    document.getElementById('reflect-retake').focus();
  }

  openBtn.addEventListener('click', openReflect);
  closeBtn.addEventListener('click', closeReflect);
  document.getElementById('reflect-begin').addEventListener('click', startQuiz);
  document.getElementById('reflect-retake').addEventListener('click', () => { answers = {}; startQuiz(); });
  document.getElementById('reflect-done').addEventListener('click', closeReflect);
  document.getElementById('reflect-back').addEventListener('click', () => { if (qi > 0) { qi--; renderQ(); scale.querySelector('button').focus(); } });
  document.getElementById('reflect-skip').addEventListener('click', () => { delete answers[ORDER[qi]]; advance(); });
  scale.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => { answers[ORDER[qi]] = Number(b.dataset.v); advance(); });
  });
  rf.addEventListener('click', (e) => { if (e.target === rf) closeReflect(); });
  [document.getElementById('reflect-care-link'), ...rf.querySelectorAll('.reflect-jump')].forEach(a => {
    if (a) a.addEventListener('click', closeReflect);
  });
  document.addEventListener('keydown', (e) => {
    if (!rf.classList.contains('open')) return;
    if (e.key === 'Escape') { closeReflect(); return; }
    if (!stepQ.hidden && ['1', '2', '3', '4'].includes(e.key)) {
      const btn = scale.querySelector(`button[data-v="${e.key}"]`); if (btn) btn.click();
    } else if (e.key === 'Tab') {
      const f = [...rf.querySelectorAll('button, a[href], input')]
        .filter(el => el.offsetParent !== null && !el.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      // if focus escaped the dialog (e.g. a button disabled itself under focus), recapture it
      if (!f.includes(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
