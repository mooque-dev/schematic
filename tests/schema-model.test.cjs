'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/js/schema-model.js');

// ---------- data integrity ----------
test('18 schemas, numbered 1..18, each well-formed', () => {
  assert.equal(M.SCHEMAS.length, 18);
  M.SCHEMAS.forEach((s, i) => {
    assert.equal(s.n, i + 1, `schema at index ${i} is numbered ${s.n}`);
    assert.ok(s.name && typeof s.name === 'string');
    assert.ok(s.dom && typeof s.dom === 'string');
    assert.ok(Array.isArray(s.kw) && s.kw.length >= 1);
  });
});

test('5 domains partition all 18 schemas exactly once', () => {
  assert.equal(M.DOMAINS.length, 5);
  const ns = M.DOMAINS.flatMap(d => d.ns).sort((a, b) => a - b);
  assert.deepEqual(ns, Array.from({ length: 18 }, (_, i) => i + 1));
  // every schema's dom label matches the domain that contains its number
  M.DOMAINS.forEach(d => {
    d.ns.forEach(n => {
      assert.equal(M.SCHEMAS.find(s => s.n === n).dom, d.name,
        `schema ${n} dom should be "${d.name}"`);
    });
  });
});

test('18 statements keyed 1..18, ORDER matches', () => {
  assert.equal(Object.keys(M.STATEMENTS).length, 18);
  for (let n = 1; n <= 18; n++) {
    assert.ok(typeof M.STATEMENTS[n] === 'string' && M.STATEMENTS[n].length > 0);
  }
  assert.deepEqual(M.ORDER, Array.from({ length: 18 }, (_, i) => i + 1));
});

test('nameOf / domOf resolve, and are empty for unknown', () => {
  assert.equal(M.nameOf(1), 'Abandonment / Instability');
  assert.equal(M.domOf(1), 'Disconnection & Rejection');
  assert.equal(M.nameOf(999), '');
  assert.equal(M.domOf(999), '');
});

// ---------- finder: scoreSchemas ----------
const ids = r => r.map(x => x.s.n);

test('returns at most 3 matches, highest score first', () => {
  const r = M.scoreSchemas('abandon trust unloved defective isolated failure');
  assert.ok(r.length <= 3);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});

test('stem matching keeps inflections', () => {
  assert.ok(ids(M.scoreSchemas('I feel abandoned')).includes(1)); // abandon
  assert.ok(ids(M.scoreSchemas('he betrayed me')).includes(2));   // betray
  assert.ok(ids(M.scoreSchemas('I am underachieving')).includes(9)); // underachiev
  assert.ok(ids(M.scoreSchemas('a nurturing home')).includes(3)); // nurtur
});

test('word-start anchoring removes mid-word false positives', () => {
  // mid-word hits are gone: "lie"⊄believe, "used"⊄confused, "die"⊄studied
  assert.deepEqual(M.scoreSchemas('I believe in myself but feel confused and studied hard'), []);
  // "special" is not at a word start inside "especially"
  assert.ok(!ids(M.scoreSchemas('especially on mondays')).includes(10));
});

test('known prefix collisions are tolerated (accepted trade-off)', () => {
  // the keyword is at a WORD START here ("close"⊂"closest"), so it still matches —
  // documented as acceptable in the 2026-09 audit; eliminating it would cost recall.
  assert.ok(ids(M.scoreSchemas('my closest friends')).includes(1));
});

test('multi-word phrases score higher than single stems', () => {
  const r = M.scoreSchemas('I put others first');
  assert.equal(r[0].s.n, 13); // "put others first" (phrase, +2) wins for Self-Sacrifice
});

test('a clear description ranks the right schema first', () => {
  assert.equal(M.scoreSchemas('I worry everyone will abandon me')[0].s.n, 1);
  assert.equal(M.scoreSchemas('I must be perfect, nothing is ever good enough')[0].s.n, 17);
});

test('empty / whitespace / null input yields no matches', () => {
  assert.deepEqual(M.scoreSchemas(''), []);
  assert.deepEqual(M.scoreSchemas('   '), []);
  assert.deepEqual(M.scoreSchemas(null), []);
  assert.deepEqual(M.scoreSchemas(undefined), []);
});

test('scoreSchemas is pure (does not mutate SCHEMAS)', () => {
  const before = JSON.stringify(M.SCHEMAS);
  M.scoreSchemas('abandon trust shame');
  assert.equal(JSON.stringify(M.SCHEMAS), before);
});

// ---------- Reflect: scoreReflection ----------
test('domains sorted by pct descending; 1..4 maps to 0..100%', () => {
  const allFour = {};
  for (let n = 1; n <= 18; n++) allFour[n] = 4;
  const r = M.scoreReflection(allFour);
  assert.ok(r.domains.every(d => d.pct === 100));
  const allOne = {};
  for (let n = 1; n <= 18; n++) allOne[n] = 1;
  assert.ok(M.scoreReflection(allOne).domains.every(d => d.pct === 0));
});

test('domain pct is the mean of answered schemas, rounded', () => {
  // Domain I = [1,2,3,4,5]; answers 4,4,3,4,3 → mean 3.6 → (3.6-1)/3 = 86.7% → 87%
  const r = M.scoreReflection({ 1: 4, 2: 4, 3: 3, 4: 4, 5: 3 });
  const domI = r.domains.find(d => d.rn === 'I');
  assert.equal(domI.pct, 87);
  assert.ok(domI.name && Array.isArray(domI.ns)); // shape preserved
});

test('strong = schemas answered 3+, top 3 by value then number', () => {
  const r = M.scoreReflection({ 1: 4, 2: 4, 4: 4, 5: 2, 13: 3, 17: 3 });
  assert.deepEqual(r.strong.map(s => s.n), [1, 2, 4]); // the three 4s, lowest-number tiebreak
});

test('empty answers → all domains 0%, no strong schemas', () => {
  const r = M.scoreReflection({});
  assert.ok(r.domains.every(d => d.pct === 0));
  assert.deepEqual(r.strong, []);
  assert.equal(M.scoreReflection().strong.length, 0); // no-arg safe
});

test('scoreReflection does not mutate DOMAINS', () => {
  const before = JSON.stringify(M.DOMAINS);
  M.scoreReflection({ 1: 4 });
  assert.equal(JSON.stringify(M.DOMAINS), before);
});
