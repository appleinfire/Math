// Run: node tests/lessons.test.js
// Checks Learn course content, generated questions, error-specific hints, progression and both assessment paths.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'lessons', 'content']) require(path.join(__dirname, '..', 'js', f + '.js'));
const L = globalThis.MQ.lessons;

assert.strictEqual(L.MODULES.length, 6, 'six multiplication and division modules');
assert.deepStrictEqual(L.MODULES.map((m) => m.id), ['groups', 'arrays', 'facts2', 'facts34', 'division', 'families']);
for (const m of L.MODULES) {
  assert.deepStrictEqual(m.steps, ['see', 'build', 'together', 'try', 'show'], m.id + ': all five lesson steps');
  assert.ok(m.see.title && m.see.text && m.see.visual && m.build.title && m.build.text && m.together.prompt && m.alternate.visual, m.id + ': complete lesson content');
  assert.strictEqual(m.minutes, '5–8 min', m.id + ': short lesson length');
  for (const phase of ['together', 'try', 'show', 'another']) for (let i = 0; i < 500; i++) {
    const p = L.problem(m.id, phase, phase === 'another');
    assert.strictEqual(p.topic, 'mult', m.id + ': records under mult');
    assert.ok(Number.isFinite(p.answer) && p.text && p.explain && p.say, m.id + ': answer, text, speech and explanation');
    assert.strictEqual(p.choices.length, 4, m.id + ': four choices');
    assert.strictEqual(new Set(p.choices).size, p.choices.length, m.id + ': choices do not repeat');
    assert.ok(p.choices.includes(p.answer), m.id + ': choices include the answer');
    assert.ok(!/undefined|NaN/.test(JSON.stringify({ text: p.text, say: p.say, explain: p.explain, choices: p.choices, visual: p.visual })), m.id + ': no broken text');
    for (const wrong of p.choices.filter((x) => x !== p.answer)) {
      const hint = L.hint(p, wrong);
      assert.ok(hint && typeof hint === 'string' && !/undefined|NaN/.test(hint), `${m.id}: a concrete hint for ${wrong}`);
    }
  }
  let build = L.newBuild(m.id), guard = 0;
  while (!build.done && guard++ < 100) {
    build = L.buildTap(build, 'tap');
    if (m.id === 'arrays' && build.n === m.build.goal) { build = L.buildTap(build, 'turn'); build = L.buildTap(build, 'cut'); }
  }
  assert.ok(build.done, m.id + ': Build it has a working tap path');
}

// The examples called out in the lesson brief have exact, misconception-specific feedback.
let addInstead, subtractInstead;
for (let i = 0; i < 10000 && (!addInstead || !subtractInstead); i++) {
  const g = L.problem('groups');
  if (/3 equal groups have 4 /.test(g.text)) addInstead = L.hint(g, 7);
  const d = L.problem('division');
  if (/12 berries.+3 kids/.test(d.text)) subtractInstead = L.hint(d, 9);
}
assert.strictEqual(addInstead, 'You added 3 + 4. 3 × 4 means 3 groups of 4.');
assert.strictEqual(subtractInstead, 'You took away 3. 12 ÷ 3 means 12 shared into 3 equal groups.');

const st = { lessons: {} };
assert.ok(L.isOpen(st, 'groups') && !L.isOpen(st, 'arrays'), 'only module 1 opens first');
for (let i = 0; i < L.MODULES.length; i++) {
  const m = L.MODULES[i];
  assert.ok(L.isOpen(st, m.id), m.id + ': opens after the previous module');
  L.markStep(st, m.id, 2);
  assert.strictEqual(L.progress(st, m.id).step, 2);
  assert.ok(L.finish(st, m.id).first, m.id + ': first finish is rewarded');
  assert.ok(!L.finish(st, m.id).first, m.id + ': replay is not a first finish');
  assert.ok(L.progress(st, m.id).done && L.progress(st, m.id).stars === 1);
}
assert.strictEqual(L.completed(st), 6);
assert.ok(L.MODULES.every((m) => L.isOpen({ lessons: {} }, m.id, true)), 'grown-up preview opens every module');
assert.strictEqual(L.assessmentPath([true, true]), 'done', 'two first-try answers finish directly');
assert.strictEqual(L.assessmentPath([true, false]), 'another', 'a miss opens another model');
assert.strictEqual(L.assessmentPath([false, false]), 'another', 'the remediation path also works');
assert.deepStrictEqual(L.MODULES.map((m) => L.practiceDifficulty(m.id)), [1, 1, 2, 2, 4, 4]);
const badge = (id) => globalThis.MQ.BADGES.find((b) => b.id === id);
assert.ok(badge('lesson1').test(st) && badge('lessonall').test(st), 'both Learn badges unlock');
assert.ok(!badge('lesson1').test({}) && !badge('lessonall').test({}), 'old profiles do not unlock Learn badges');

console.log('Learn course: 6 modules, 12,000 generated questions and both assessment paths OK');
