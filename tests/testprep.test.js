// Run: node tests/testprep.test.js
// Simulates children with a known level taking the Placement Check and checks the estimate is close.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'puzzles', 'cogat', 'logic', 'content', 'content-k', 'store', 'testprep']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;
const P = MQ.prep;

// Every topic used by the check has a domain.
for (const track of Object.values(P.POOL)) for (const [dom, topics] of Object.entries(track)) for (const t of topics) assert.strictEqual(MQ.TOPICS[t].domain, dom, t);

// A simulated child: knows everything well below their level, nothing well above, and guesses on choices.
function simulate(grade, level, history = []) {
  const eng = P.newCheck(grade, history);
  while (!P.done(eng)) {
    const p = P.next(eng);
    const g = p.kind === 'choice' ? 1 / p.choices.length : 0.03;
    const know = 1 / (1 + Math.exp(-2 * (level - p.step)));
    P.answer(eng, p, Math.random() < g + (1 - g) * know);
  }
  return P.result(eng);
}

const RUNS = 60;
let worst = 1;
for (const grade of ['k', 'g2']) {
  for (const level of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    let close = 0, domClose = 0, domTotal = 0;
    for (let r = 0; r < RUNS; r++) {
      const res = simulate(grade, level);
      if (Math.abs(res.overall - level) <= 1) close++;
      for (const v of Object.values(res.domains)) { domTotal++; if (Math.abs(v - level) <= 1.5) domClose++; }
    }
    const rate = close / RUNS, drate = domClose / domTotal;
    worst = Math.min(worst, rate);
    console.log(`${grade.padEnd(2)} level ${level}: overall within ±1 in ${(rate * 100).toFixed(0)}%, domains within ±1.5 in ${(drate * 100).toFixed(0)}%`);
    assert.ok(rate >= 0.9, `overall estimate for ${grade} level ${level} is too rough (${rate})`);
    assert.ok(drate >= 0.75, `domain estimates for ${grade} level ${level} are too rough (${drate})`);
  }
}

// Check length matches the plan: about 20 questions for K, 30 for 2nd grade, domains interleaved.
const ek = P.newCheck('k'), e2 = P.newCheck('g2');
assert.strictEqual(P.total(ek), 20);
assert.strictEqual(P.total(e2), 30);
assert.deepStrictEqual(e2.plan.slice(0, 4), ['nbt', 'alg', 'md', 'geo']);
assert.strictEqual(e2.start, 3, 'first 2nd-grade check starts one grade below (Early 1st)');
assert.strictEqual(P.newCheck('g2', [{ grade: 'g2', overall: 7.2 }]).start, 6, 'a later check starts just below the last result');

// The practice plan picks the two weakest domains and topics from the child's own grade.
const plan = P.practicePlan({ domains: { nbt: 7, alg: 5.2, md: 6.1, geo: 8 } }, 'g2');
assert.deepStrictEqual(plan.domains.map((d) => d.id), ['alg', 'md']);
assert.ok(plan.topics.includes('words') && plan.topics.includes('time') && !plan.topics.includes('k_add'));
assert.strictEqual(plan.diff, 1);

// Status against the time of year.
assert.strictEqual(P.expected('g2', new Date('2026-10-09')), 5);
assert.strictEqual(P.expected('g2', new Date('2027-04-01')), 7);
assert.strictEqual(P.status(8, 6).id, 'above');
assert.strictEqual(P.status(5.5, 6).id, 'on');
assert.strictEqual(P.status(3, 6).id, 'below');

// Mock Math Kangaroo contest: 24 questions, 8 × 3 + 8 × 4 + 8 × 5 points, every question A–E, no repeats.
for (let r = 0; r < 30; r++) {
  const ct = P.newContest('kangaroo');
  assert.strictEqual(ct.items.length, 24);
  assert.deepStrictEqual(ct.items.map((i) => i.pts), [...Array(8).fill(3), ...Array(8).fill(4), ...Array(8).fill(5)]);
  assert.ok(ct.items.every((i) => i.p.choices.length === 5 && i.p.choices.includes(i.p.answer)));
  assert.strictEqual(new Set(ct.items.map((i) => i.p.text + (i.p.visual || ''))).size, 24, 'no repeated question in one contest');
  assert.strictEqual(ct.seconds, 75 * 60);
  // all right = 96; blanks and wrong answers score 0 (no penalty)
  ct.answers = ct.items.map((i) => i.p.answer);
  assert.strictEqual(P.scoreContest(ct).score, 96);
  ct.answers = ct.items.map((i, k) => (k < 8 ? i.p.answer : k < 12 ? i.p.choices.find((c) => c !== i.p.answer) : null));
  const sc = P.scoreContest(ct);
  assert.strictEqual(sc.score, 24);
  assert.strictEqual(sc.blank, 12);
  assert.deepStrictEqual(sc.sections[3], { right: 8, n: 8 });
}
const jo = P.newContest('joey');
assert.strictEqual(jo.items.length, 12);
assert.strictEqual(jo.seconds, 0);

// CogAT practice: 3 batteries × 3 question types × 5 questions, 4 choices each, no repeats, no countdown.
const key = (i) => i.p.text + (i.p.visual || '') + i.p.choices.join('|') + (i.p.choiceHtml || []).join('');
for (let r = 0; r < 30; r++) {
  const ct = P.newContest('cogat');
  assert.strictEqual(ct.items.length, 45);
  assert.strictEqual(ct.seconds, 0);
  assert.deepStrictEqual([...new Set(ct.items.map((i) => i.sec))], ['Verbal', 'Quantitative', 'Nonverbal']);
  assert.ok(ct.items.every((i) => i.p.choices.length === 4 && i.p.choices.includes(i.p.answer) && MQ.TOPICS[i.p.topic].cogat));
  assert.strictEqual(new Set(ct.items.map(key)).size, 45, 'no repeated question in one CogAT test');
  ct.answers = ct.items.map((i, k) => (k < 15 ? i.p.answer : k < 20 ? i.p.choices.find((c) => c !== i.p.answer) : null));
  const sc = P.scoreContest(ct);
  assert.deepStrictEqual(sc.sections.Verbal, { right: 15, n: 15 });
  assert.deepStrictEqual(sc.sections.Quantitative, { right: 0, n: 15 });
  assert.strictEqual(sc.right, 15);
  assert.strictEqual(Object.keys(sc.types).length, 9);
  assert.ok(Object.values(sc.types).every((t) => t.n === 5));
  const k = P.newContest('cogatk');
  assert.strictEqual(k.items.length, 18);
  assert.strictEqual(new Set(k.items.map(key)).size, 18, 'no repeated question in Brain Games');
}

// Retakes: questions shown in one attempt are not used again while new ones are left.
MQ.state = { seen: {} };
const showAll = (ct) => ct.items.forEach((i) => MQ.store.markSeen(i.p.topic, MQ.U.qkey(i.p)));
let prev = null;
for (let r = 0; r < 5; r++) {
  const ct = P.newContest('cogat');
  const keys = new Set(ct.items.map((i) => i.p.topic + MQ.U.qkey(i.p)));
  if (prev) assert.strictEqual([...keys].filter((k) => prev.has(k)).length, 0, `CogAT test ${r + 1} repeats a question from test ${r}`);
  prev = keys;
  showAll(ct);
}
const bankSeen = new Set();
for (let r = 0; r < 6; r++) {
  const ct = P.newContest('kangaroo');
  for (const it of ct.items.filter((i) => i.p.topic === 'kg_bank')) {
    assert.ok(!bankSeen.has(it.p.text), 'a hand-written puzzle came back before the bank ran out');
    bankSeen.add(it.p.text);
  }
  showAll(ct);
}
// When everything was seen, the question seen longest ago comes back first.
MQ.TOPICS.__tiny = { name: 'tiny', track: 'prep', gen: () => ({ kind: 'choice', text: MQ.U.pick(['A', 'B', 'C']), answer: '1', choices: ['1', '2'] }) };
MQ.state.seen.__tiny = ['B', 'C', 'A'].map((t) => MQ.U.qkey({ text: t }));
assert.strictEqual(P.fresh('__tiny', 1).text, 'B');
assert.strictEqual(P.fresh('__tiny', 1, new Set([MQ.U.qkey({ text: 'B' })])).text, 'C', 'never repeats inside one attempt');
delete MQ.TOPICS.__tiny;

// Mistakes come back in mock tests: a few questions become fresh ones of the missed skills, in the right section,
// and the test keeps its size and points.
{
  const review = [{ topic: 'kg_mirror', d: 5 }, { topic: 'kg_coins', d: 1 }, { topic: 'kg_age', d: 3 }, { topic: 'kg_paths', d: 2 }, { topic: 'add20', d: 2 }];
  const ct = P.newContest('kangaroo', review);
  assert.strictEqual(ct.items.length, 24);
  for (const pts of [3, 4, 5]) assert.strictEqual(ct.items.filter((i) => i.pts === pts).length, 8, `8 puzzles worth ${pts}`);
  const rv = ct.items.filter((i) => i.rv);
  assert.strictEqual(rv.length, P.REVIEW_IN_CONTEST, 'at most 3 review puzzles, school topics never');
  assert.ok(rv.some((i) => i.p.topic === 'kg_mirror' && i.p.d === 5 && i.pts === 5), 'a missed 5-point type comes back as a 5-point puzzle');
  assert.ok(rv.some((i) => i.p.topic === 'kg_coins' && i.p.d === 1 && i.pts === 3));
  assert.ok(rv.every((i) => i.p.review && i.p.choices.includes(i.p.answer)));
  assert.strictEqual(P.newContest('kangaroo', []).items.filter((i) => i.rv).length, 0, 'no review without mistakes');
  // Logic Lab challenge: every type at both levels; kindergarten keeps to levels 1–2 even for review.
  const lg = P.newContest('logic', [{ topic: 'lg_liars', d: 2 }]);
  assert.strictEqual(lg.items.length, 12);
  assert.deepStrictEqual([...new Set(lg.items.map((i) => i.p.topic))].sort(), MQ.LOGIC_TOPICS.slice().sort());
  assert.ok(lg.items.some((i) => i.rv && i.p.topic === 'lg_liars' && i.p.d === 2));
  const lk = P.newContest('logick', [{ topic: 'lg_order', d: 4 }, { topic: 'lg_count', d: 1 }]);
  assert.strictEqual(lk.items.length, 8);
  assert.ok(lk.items.every((i) => i.p.d <= 2 && MQ.LOGIC_K.includes(i.p.topic)), 'kindergarten logic stays easy and on its own types');
  const sc = P.scoreContest(Object.assign(lg, { answers: lg.items.map((i) => i.p.answer) }));
  assert.strictEqual(sc.right, 12);
  assert.deepStrictEqual(Object.keys(sc.sections).sort(), ['Round 1', 'Round 2']);
  assert.ok(sc.items.every((i) => i.d >= 1), 'results remember the difficulty of every question');
  for (const k of ['check', 'kangaroo', 'joey', 'cogat', 'cogatk', 'logic', 'logick']) assert.ok(P.INFO[k] && P.INFO[k].what && P.INFO[k].where && P.INFO[k].checks && P.INFO[k].how, 'info for ' + k);
}
MQ.state = null;

console.log(`OK — Placement Check estimates are within one step in at least ${(worst * 100).toFixed(0)}% of simulated runs.`);
