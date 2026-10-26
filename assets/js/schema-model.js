/* Schematic — pure schema model + scoring.
 * No DOM, no side effects. Shared by the page (as window.SchemaModel, loaded as a
 * classic <script> before app.js) and by the Node test suite (module.exports).
 * This keeps the project build-free: it is plain JS that runs in both places. */
(function (glob, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // Node / tests
  if (glob) glob.SchemaModel = api;                                          // browser global
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // The 18 early maladaptive schemas (Young's model), grouped by domain, each with
  // keyword stems used by the free-text finder.
  var SCHEMAS = [
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

  var DOMAINS = [
    { rn: 'I',   name: 'Disconnection & Rejection',       ns: [1, 2, 3, 4, 5] },
    { rn: 'II',  name: 'Impaired Autonomy & Performance', ns: [6, 7, 8, 9] },
    { rn: 'III', name: 'Impaired Limits',                 ns: [10, 11] },
    { rn: 'IV',  name: 'Other-Directedness',              ns: [12, 13, 14] },
    { rn: 'V',   name: 'Overvigilance & Inhibition',      ns: [15, 16, 17, 18] },
  ];

  var STATEMENTS = {
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

  var ORDER = Object.keys(STATEMENTS).map(Number);

  // Free-text finder: rank schemas by keyword hits, anchored to word starts so stems
  // still match ("abandon"→abandoned) but mid-word false positives don't ("lie"⊄believe).
  function scoreSchemas(text) {
    var q = ' ' + String(text == null ? '' : text).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ') + ' ';
    return SCHEMAS.map(function (s) {
      var score = 0;
      s.kw.forEach(function (k) { if (q.indexOf(' ' + k.replace(/['’]/g, '')) !== -1) score += k.indexOf(' ') !== -1 ? 2 : 1; });
      return { s: s, score: score };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 3);
  }

  // Reflect self-check: from answers {schemaN: 1..4}, compute each domain's intensity
  // (0–100%, highest first) and the schemas answered 3+ (top 3).
  function scoreReflection(answers) {
    answers = answers || {};
    var domains = DOMAINS.map(function (d) {
      var vals = d.ns.map(function (n) { return answers[n]; }).filter(function (v) { return v != null; });
      var avg = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : 0;
      var out = {};
      for (var k in d) out[k] = d[k];
      out.pct = vals.length ? Math.round((avg - 1) / 3 * 100) : 0;
      return out;
    }).sort(function (a, b) { return b.pct - a.pct; });
    var strong = ORDER.map(function (n) { return { n: n, v: answers[n] || 0 }; })
      .filter(function (x) { return x.v >= 3; })
      .sort(function (a, b) { return b.v - a.v || a.n - b.n; })
      .slice(0, 3);
    return { domains: domains, strong: strong };
  }

  function nameOf(n) { var s = SCHEMAS.find(function (x) { return x.n === n; }); return s ? s.name : ''; }
  function domOf(n)  { var s = SCHEMAS.find(function (x) { return x.n === n; }); return s ? s.dom : ''; }

  return {
    SCHEMAS: SCHEMAS, DOMAINS: DOMAINS, STATEMENTS: STATEMENTS, ORDER: ORDER,
    scoreSchemas: scoreSchemas, scoreReflection: scoreReflection, nameOf: nameOf, domOf: domOf,
  };
});
