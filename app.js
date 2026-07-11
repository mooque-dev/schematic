const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = reduceMotion ? 'auto' : 'smooth';

// ===== Nav background on scroll + back-to-top =====
const nav = document.getElementById('nav');
const toTop = document.getElementById('to-top');
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  if (toTop) toTop.classList.toggle('show', window.scrollY > 700);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
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
window.addEventListener('scroll', updateActiveNav, { passive: true });
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

// ===== Guided finder =====
const SCHEMAS = [
  { n: 1,  name: 'Abandonment / Instability',        dom: 'Disconnection & Rejection',      kw: ['abandon','leave','left me','they will leave','alone','lose people','unstable','let me down','clingy','close','breakup'] },
  { n: 2,  name: 'Mistrust / Abuse',                 dom: 'Disconnection & Rejection',      kw: ['trust','betray','hurt me','abuse','taken advantage','lie','cheat','manipulate','guard','used','suspicious'] },
  { n: 3,  name: 'Emotional Deprivation',            dom: 'Disconnection & Rejection',      kw: ['no one understands','unloved','not cared','emotionally alone','needs not met','empty','nurtur','affection','no support','starved'] },
  { n: 4,  name: 'Defectiveness / Shame',            dom: 'Disconnection & Rejection',      kw: ['defective','flaw','unlovable','shame','not good enough','inferior','wrong with me','worthless','ashamed','bad'] },
  { n: 5,  name: 'Social Isolation / Alienation',    dom: 'Disconnection & Rejection',      kw: ['dont belong','do not belong','isolated','different','outsider','no group','alienated','left out','lonely','not part'] },
  { n: 6,  name: 'Dependence / Incompetence',        dom: 'Impaired Autonomy & Performance', kw: ['cant cope','cannot cope','helpless','need help','cant handle','incompetent','overwhelmed','decisions','rely on','dependent'] },
  { n: 7,  name: 'Vulnerability to Harm / Illness',  dom: 'Impaired Autonomy & Performance', kw: ['catastrophe','something bad','anxious','health','disaster','panic','danger','worry something','sick','die'] },
  { n: 8,  name: 'Enmeshment / Undeveloped Self',    dom: 'Impaired Autonomy & Performance', kw: ['no identity','smothered','fused','cant separate','live through','no self','enmesh','who i am','parents','merged'] },
  { n: 9,  name: 'Failure to Achieve',               dom: 'Impaired Autonomy & Performance', kw: ['failure','failed','not good enough at','inadequate','will fail','less successful','stupid','behind','loser','underachiev'] },
  { n: 10, name: 'Entitlement / Grandiosity',        dom: 'Impaired Limits',                kw: ['special','rules dont apply','entitled','superior','deserve more','impatient','better than','no limits','get my way'] },
  { n: 11, name: 'Insufficient Self-Control',        dom: 'Impaired Limits',                kw: ['impulsive','cant finish','avoid discomfort','no discipline','procrastinate','give up','self control','distract','quit','lazy'] },
  { n: 12, name: 'Subjugation',                      dom: 'Other-Directedness',             kw: ['give in','cant say no','others control','suppress','comply','trapped','coerced','submit','my opinion','voiceless'] },
  { n: 13, name: 'Self-Sacrifice',                   dom: 'Other-Directedness',             kw: ['put others first','put everyone','everyone else','before my own','needs before','over give','guilt','my needs dont matter','caretaker','resentful','selfless','others needs','sacrifice'] },
  { n: 14, name: 'Approval-Seeking / Recognition',   dom: 'Other-Directedness',             kw: ['need approval','validation','what others think','fit in','recognition','status','impress','liked','attention','praise'] },
  { n: 15, name: 'Negativity / Pessimism',           dom: 'Overvigilance & Inhibition',     kw: ['negative','pessimist','expect the worst','things go wrong','dread','doom','worry','glass half empty','bad outcome'] },
  { n: 16, name: 'Emotional Inhibition',             dom: 'Overvigilance & Inhibition',     kw: ['hold back','cant express','bottle up','controlled','hide feelings','stiff','suppress emotion','guarded','numb'] },
  { n: 17, name: 'Unrelenting Standards',            dom: 'Overvigilance & Inhibition',     kw: ['perfect','high standards','never enough','pressure','critical','must achieve','perfectionist','not good enough','driven'] },
  { n: 18, name: 'Punitiveness',                     dom: 'Overvigilance & Inhibition',     kw: ['punish','no excuses','unforgiving','harsh','intolerant','mistakes','self critical','blame','deserve punishment'] },
];

const cards = Array.from(document.querySelectorAll('.schema'));
const fInput = document.getElementById('finder-input');
const fResults = document.getElementById('finder-results');
const fForm = document.getElementById('finder-form');

function scoreSchemas(text) {
  const q = ' ' + text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ') + ' ';
  return SCHEMAS
    .map(s => {
      let score = 0;
      s.kw.forEach(k => { if (q.includes(k.replace(/['’]/g, ''))) score += k.includes(' ') ? 2 : 1; });
      return { s, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

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
  if (!t) return;
  const matches = scoreSchemas(t);
  if (!matches.length) {
    const p = document.createElement('p');
    p.className = 'finder-none';
    p.textContent = 'No clear match from those words — try describing a feeling or situation, or browse the domains below.';
    fResults.appendChild(p);
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
}

if (fForm) {
  fForm.addEventListener('submit', (e) => { e.preventDefault(); runFinder(fInput.value); });
  document.querySelectorAll('#finder-examples button').forEach(chip => {
    chip.addEventListener('click', () => { fInput.value = chip.dataset.q; runFinder(chip.dataset.q); fInput.focus(); });
  });
}

// ===== Lightbox =====
const tiles = Array.from(document.querySelectorAll('.tile, .schema'));
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('.lb-img');
const lbCap = lb.querySelector('.lb-cap');
const lbClose = lb.querySelector('.lb-close');
let idx = 0;
let lastFocus = null;

function show(i) {
  idx = (i + tiles.length) % tiles.length;
  const t = tiles[idx];
  lbImg.src = t.dataset.full;
  lbImg.alt = t.dataset.cap || '';
  lbCap.textContent = t.dataset.cap || '';
}
function open(i) {
  lastFocus = document.activeElement;
  show(i);
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  lbClose.focus();
}
function close() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  lbImg.src = '';
  if (lastFocus) lastFocus.focus();
}

tiles.forEach((t, i) => {
  t.setAttribute('role', 'button');
  t.setAttribute('tabindex', '0');
  t.addEventListener('click', () => open(i));
  t.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
  });
});
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

// ===== Reflect (self-check tool) =====
const STATEMENTS = {
  1:  "I worry that people I'm close to will leave, or can't be relied on.",
  2:  "I find it hard to trust that others won't hurt or take advantage of me.",
  3:  "I often feel that no one really understands or meets my emotional needs.",
  4:  "Deep down I fear something is wrong with me — that I'd be unlovable if truly seen.",
  5:  "I feel different from other people, like I don't quite belong anywhere.",
  6:  "I doubt I can handle everyday life on my own, without a lot of help.",
  7:  "I often fear that something bad or catastrophic is about to happen.",
  8:  "I struggle to know who I am apart from certain people in my life.",
  9:  "I feel I've failed, or will fail, compared to the people around me.",
  10: "I feel I deserve special treatment, and dislike being told 'no'.",
  11: "I find it hard to stay disciplined or finish things once they get uncomfortable.",
  12: "I give in to others and hide what I want, to avoid conflict.",
  13: "I put others' needs so far ahead of my own that I neglect myself.",
  14: "My sense of worth leans heavily on approval or recognition from others.",
  15: "I tend to expect the worst and focus on what could go wrong.",
  16: "I hold my feelings back and find them hard to express.",
  17: "I feel I must meet very high standards — and it's never quite good enough.",
  18: "I'm hard and unforgiving toward myself (or others) over mistakes.",
};
const DOMAINS = [
  { rn: 'I',   name: 'Disconnection & Rejection',       ns: [1, 2, 3, 4, 5] },
  { rn: 'II',  name: 'Impaired Autonomy & Performance', ns: [6, 7, 8, 9] },
  { rn: 'III', name: 'Impaired Limits',                 ns: [10, 11] },
  { rn: 'IV',  name: 'Other-Directedness',              ns: [12, 13, 14] },
  { rn: 'V',   name: 'Overvigilance & Inhibition',      ns: [15, 16, 17, 18] },
];
const ORDER = Object.keys(STATEMENTS).map(Number);

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
  const nameOf = n => (SCHEMAS.find(s => s.n === n) || {}).name || '';
  const domOf = n => (SCHEMAS.find(s => s.n === n) || {}).dom || '';

  let answers = {};
  let qi = 0;
  let rfLastFocus = null;

  function openReflect() {
    rfLastFocus = document.activeElement;
    rf.classList.add('open');
    rf.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showIntro();
  }
  function closeReflect() {
    rf.classList.remove('open');
    rf.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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
    // domain scores
    const dom = DOMAINS.map(d => {
      const vals = d.ns.map(n => answers[n]).filter(v => v != null);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { ...d, pct: vals.length ? Math.round((avg - 1) / 3 * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);

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

    // top schemas (answered 3+)
    const strong = ORDER.map(n => ({ n, v: answers[n] || 0 }))
      .filter(x => x.v >= 3).sort((a, b) => b.v - a.v || a.n - b.n).slice(0, 3);
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
  document.getElementById('reflect-back').addEventListener('click', () => { if (qi > 0) { qi--; renderQ(); } });
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
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
