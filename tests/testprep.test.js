// Run: node tests/testprep.test.js
// Simulates children with a known level taking the Placement Check and checks the estimate is close.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'store', 'testprep']) require(path.join(__dirname, '..', 'js', f + '.js'));
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

console.log(`OK — Placement Check estimates are within one step in at least ${(worst * 100).toFixed(0)}% of simulated runs.`);
