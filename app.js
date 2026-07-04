// ===== Nav background on scroll =====
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

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
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
