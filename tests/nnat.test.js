// Run: node tests/nnat.test.js
// NNAT-3 style practice: every kind of puzzle at every level is well-formed (5 different answer pictures, one right
// answer, directions and explanations), no level falls back to an easier one, and the 48-question practice test
// is built and scored like the real Level C test (30 minutes, four kinds, easy to hard). Levels 7–8 are the challenge
// levels, and the two challenge tests (levels 4–7 and 6–8) are built from them.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'puzzles', 'cogat', 'nnat', 'logic', 'content', 'content-k', 'store', 'testprep']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ, U = MQ.U, P = MQ.prep;

assert.deepStrictEqual(MQ.NNAT_TOPICS, ['nn_pattern', 'nn_analogy', 'nn_serial', 'nn_spatial']);
let n = 0;
MQ.NNAT_FALLBACKS = {};
for (const t of MQ.NNAT_TOPICS) {
  const T = MQ.TOPICS[t];
  assert.ok(T.nnat && T.track === 'prep' && T.maxD === 8 && T.name && T.desc, t + ' is registered');
  for (let d = 1; d <= 8; d++) {
    const keys = new Set();
    for (let i = 0; i < 400; i++) {
      const p = MQ.makeProblem(t, d);
      n++;
      const label = `${t} level ${d}`;
      assert.strictEqual(p.kind, 'choice', label);
      assert.strictEqual(p.d, d, label + ': level kept');
      assert.strictEqual(p.choices.length, 5, label + ': 5 answers, like the real test');
      assert.ok(p.choices.includes(p.answer), label + ': the answer is a choice');
      assert.strictEqual(new Set(p.choiceHtml).size, 5, label + ': 5 different pictures');
      assert.ok(p.say && p.hint && p.explain && p.text, label + ': directions, hint and explanation');
      assert.ok(!/undefined|NaN/.test(p.text + p.choiceHtml.join('') + p.explain), label + ': nothing undefined');
      keys.add(U.qkey(p));
    }
    assert.ok(keys.size > 200, `${t} level ${d}: plenty of different puzzles (${keys.size} of 400)`);
  }
}
assert.deepStrictEqual(MQ.NNAT_FALLBACKS, {}, 'every level is made at its own level (no easier stand-ins)');

// the harder levels really are harder: bigger holes, 3×3 grids, more changing attributes, lines that cancel
const sample = (t, d) => MQ.makeProblem(t, d).text;
assert.ok(!/stroke-dasharray="5 3"[^>]*width="(5[0-9])"/.test(sample('nn_pattern', 1)));
assert.ok(/Each row changes|Look across and down/.test(sample('nn_analogy', 4)) && /Each row changes/.test(sample('nn_analogy', 6)));
assert.ok(/The first picture changes into the second/.test(sample('nn_analogy', 1)));
assert.ok(/disappear/.test(MQ.makeProblem('nn_spatial', 5).hint) && !/disappear/.test(MQ.makeProblem('nn_spatial', 2).hint));
// the challenge levels 7–8: designs with only a symmetry (a 3×3 piece at level 8), changes across and down at once,
// grids with 2 and 3 covered boxes, and line drawings where the rule has to be found
const count = (s, re) => (s.match(re) || []).length;
for (let i = 0; i < 60; i++) {
  for (const d of [7, 8]) {
    const pt = MQ.makeProblem('nn_pattern', d);
    assert.ok(/mirror|upside down|Fold/.test(pt.explain) && /does not repeat/.test(pt.hint), 'pattern ' + d + ': a symmetric design');
    assert.strictEqual(count(pt.choiceHtml[0], /<rect [^>]*stroke-width="0.6"/g), d === 7 ? 4 : 9, 'pattern ' + d + ': the size of the piece');
    assert.strictEqual(count(pt.text, /<rect [^>]*stroke-width="0.6"/g), d === 7 ? 36 - 4 : 49 - 9, 'pattern ' + d + ': the board');
    const an = MQ.makeProblem('nn_analogy', d);
    assert.ok(/change across, and they change down/.test(an.text) && /Across, .* Down, /.test(an.explain) && /two steps across and two steps down/.test(an.explain), 'analogy ' + d);
    assert.strictEqual(/ and /.test(an.explain.split('Down')[0]), d === 8, 'analogy ' + d + ': two changes at once across only at level 8');
    const se = MQ.makeProblem('nn_serial', d);
    assert.strictEqual(count(se.text, /fill="#8f9bb0"/g), d === 7 ? 2 : 3, 'serial ' + d + ': covered boxes');
    assert.ok(/covered/.test(se.text) && /covered/.test(se.say) && /together/.test(se.hint), 'serial ' + d);
  }
  assert.ok(!/covered|#8f9bb0/.test(MQ.makeProblem('nn_serial', 6).text), 'no covered boxes below level 7');
  const s7 = MQ.makeProblem('nn_spatial', 7), s8 = MQ.makeProblem('nn_spatial', 8);
  assert.ok(/Put the first two pictures together/.test(s7.text) && />\+</.test(s7.text) && /cancel/.test(s7.explain), 'spatial 7');
  assert.ok(/show the rule/.test(s8.text) && !/>\+</.test(s8.text) && /cancel|only the lines that are in both/.test(s8.explain), 'spatial 8');
}
const rules8 = new Set(U.range(1, 80).map(() => /only the lines/.test(MQ.makeProblem('nn_spatial', 8).explain)));
assert.strictEqual(rules8.size, 2, 'spatial 8 uses both rules, so the rule has to be found each time');

// the practice test: 48 questions, 30 minutes, the four kinds in about Level C proportions, easy to hard
const plan = MQ.nnatPlan();
assert.strictEqual(plan.length, 48);
const counts = {};
plan.forEach((x) => (counts[x.topic] = (counts[x.topic] || 0) + 1));
assert.deepStrictEqual(counts, MQ.NNAT_TEST.mix);
assert.ok(plan.every((x, i) => i === 0 || x.d >= plan[i - 1].d), 'levels never go down');
assert.deepStrictEqual(U.range(1, 6).map((d) => plan.filter((x) => x.d === d).length), [8, 8, 8, 8, 8, 8]);
// the two challenge tests: the same size, time and mix, but only the upper levels (4–7 and 6–8)
assert.deepStrictEqual(MQ.NNAT_TIERS.map((x) => x.levels), [[1, 6], [4, 7], [6, 8]]);
for (const [tier, want] of [[1, { 4: 12, 5: 12, 6: 12, 7: 12 }], [2, { 6: 16, 7: 16, 8: 16 }]]) {
  const pl = MQ.nnatPlan(tier), byD = {}, byT = {};
  pl.forEach((x) => { byD[x.d] = (byD[x.d] || 0) + 1; byT[x.topic] = (byT[x.topic] || 0) + 1; });
  assert.deepStrictEqual(byD, want, 'challenge test ' + tier + ': levels');
  assert.deepStrictEqual(byT, MQ.NNAT_TEST.mix);
  assert.ok(pl.every((x, i) => i === 0 || x.d >= pl[i - 1].d), 'levels never go down');
  const c = P.newContest('nnat', [], tier);
  assert.deepStrictEqual([c.tier, c.items.length, c.seconds], [tier, 48, 30 * 60]);
  assert.deepStrictEqual([...new Set(c.items.map((it) => it.p.d))], Object.keys(want).map(Number));
  assert.strictEqual(new Set(c.items.map((it) => U.qkey(it.p))).size, 48, 'no puzzle twice in a challenge test');
  c.items.forEach((it, i) => { c.answers[i] = it.p.answer; });
  const r = P.scoreContest(c);
  assert.deepStrictEqual([r.kind, r.tier, r.right, Object.keys(r.levels).map(Number)], ['nnat', tier, 48, Object.keys(want).map(Number)]);
}
const ct = P.newContest('nnat');
assert.strictEqual(ct.tier, 0);
assert.strictEqual(ct.items.length, 48);
assert.strictEqual(ct.seconds, 30 * 60);
assert.ok(ct.items.every((it) => it.sec === MQ.TOPICS[it.p.topic].name && it.p.choices.length === 5));
assert.strictEqual(new Set(ct.items.map((it) => U.qkey(it.p))).size, 48, 'no puzzle twice in one test');
// score: answer the first 30 (every 3rd one wrong), leave the rest blank, 25 minutes on the clock
ct.items.forEach((it, i) => { if (i < 30) ct.answers[i] = i % 3 === 2 ? it.p.choices.find((c) => c !== it.p.answer) : it.p.answer; });
Object.assign(ct, { timed: true, left: 300 });
const res = P.scoreContest(ct);
assert.deepStrictEqual([res.right, res.n, res.blank, res.used, res.tier], [20, 48, 18, 1500, 0]);
assert.strictEqual(U.sum(Object.values(res.levels).map((l) => l.n)), 48);
assert.deepStrictEqual(Object.keys(res.levels).map(Number), [1, 2, 3, 4, 5, 6]);
assert.strictEqual(U.sum(Object.values(res.sections).map((s) => s.n)), 48);
assert.ok(res.items.every((it) => !/<|>/.test(it.q) && !/\+ =/.test(it.q)), 'the review text has no picture leftovers');

// NNAT practice days are counted (the GATE plan) and kept from both devices
const S = MQ.store;
MQ.state = { stats: { attempts: 0, correct: 0, topics: {} }, days: {}, months: {}, mistakes: [], review: {}, nnatDays: {} };
S.record(MQ.makeProblem('nn_serial', 2), true, 'picture 1');
S.record(MQ.makeProblem('nn_pattern', 3), false, 'picture 2');
S.record(MQ.makeProblem('add20', 2), true, '5');
assert.deepStrictEqual(Object.values(MQ.state.nnatDays), [2], 'only NNAT puzzles count');
const base = () => ({ v: 1, id: 'k', grade: 'g2', rev: 0, crystals: 0, xp: 0, eggsHatched: 0, levels: {}, creatures: {}, badges: {}, days: {}, lastPlayed: '', stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {} }, daily: { last: '', streak: 0, best: 0 } });
const a = Object.assign(base(), { rev: 1, nnatDays: { '2026-10-10': 8, '2026-10-11': 2 } });
const b = Object.assign(base(), { rev: 2, nnatDays: { '2026-10-11': 5, '2026-10-12': 3 } });
assert.deepStrictEqual(S.mergeProfiles(a, b).nnatDays, { '2026-10-10': 8, '2026-10-11': 5, '2026-10-12': 3 });

console.log(`OK — NNAT-3 practice: ${n} puzzles checked (4 kinds × 8 levels), practice test and scoring.`);
