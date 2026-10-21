// Run: node tests/lessons.test.js
// Checks both Learn courses: content, generated questions, error-specific hints, Build it models, progression, assessment paths.
const path = require('path');
const assert = require('assert');
const fs = require('fs');
for (const f of ['util', 'lessons', 'content']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MULDIV = ['groups', 'arrays', 'facts2', 'facts34', 'division', 'families'], ADDSUB = ['maketen', 'addtens', 'bundle', 'unbundle', 'hundreds', 'zeros'];
const L = globalThis.MQ.lessons;
const rulesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'lessons.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'lessons-ui.js'), 'utf8');

assert.deepStrictEqual(L.COURSES.map((c) => c.id), ['addsub', 'muldiv'], 'two courses, Add & Subtract first');
assert.deepStrictEqual(L.courseModules('muldiv').map((m) => m.id), MULDIV, 'six multiplication and division modules');
assert.deepStrictEqual(L.courseModules('addsub').map((m) => m.id), ADDSUB, 'six addition and subtraction modules');
assert.strictEqual(L.MODULES.length, 12);
assert.ok(L.COURSES.every((c) => c.title && c.intro && c.icon), 'every course has a title, an icon and an intro');
assert.ok(rulesSource.includes('const { rnd, pick, shuffle } = MQ.U;'), 'lesson generators use shared MQ.U helpers');
assert.ok(uiSource.includes("MQ.sfx('correct')") && !uiSource.includes("MQ.sfx('right')"), 'correct answers use the available sound');
assert.ok(!L.module('groups').see.lines.some((s) => /not equal/i.test(s)), 'equal-groups example does not describe a missing unequal picture');
for (const m of L.MODULES) {
  assert.deepStrictEqual(m.steps, ['see', 'build', 'together', 'try', 'show'], m.id + ': all five lesson steps');
  assert.ok(m.see.title && m.see.text && m.see.visual && m.build.title && m.build.text && m.together.prompt && m.alternate.visual, m.id + ': complete lesson content');
  assert.strictEqual(m.minutes, '5–8 min', m.id + ': short lesson length');
  for (const phase of ['together', 'try', 'show', 'another']) for (let i = 0; i < 500; i++) {
    const p = L.problem(m.id, phase, phase === 'another');
    assert.strictEqual(p.topic, m.topic, m.id + ': records under the module topic');
    assert.strictEqual(p.topic, m.course === 'muldiv' ? 'mult' : p.topic, m.id + ': Multiply & Divide records under mult');
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
    if (m.id === 'division' && build.shareDone && build.part === 'sharing') build = L.buildTap(build, 'startGrouping');
  }
  assert.ok(build.done, m.id + ': Build it has a working tap path');
  assert.strictEqual(build.n, m.build.goal, m.id + ': Build it ends at its goal');
}

// Add & Subtract answers by independent math, and every model in the question adds up.
const step = (v, op) => v + (op[0] === '−' ? -1 : 1) * +op.slice(1);
for (const id of ADDSUB) for (const phase of ['together', 'try', 'show', 'another']) for (let i = 0; i < 800; i++) {
  const p = L.problem(id, phase, phase === 'another');
  const [, a, op, b] = p.text.match(/^What is (\d+) ([+−]) (\d+)\?$/).map((x, k) => (k === 2 ? x : +x));
  assert.strictEqual(p.answer, op === '+' ? a + b : a - b, `${id}: right answer for ${p.text}`);
  if (['maketen', 'addtens', 'bundle'].includes(id)) assert.ok(a + b <= 99, id + ': sums stay within 100');
  if (id === 'maketen') assert.ok(a % 10 + b > 10 && b <= 9, 'make a ten: a one-digit number that crosses the next ten');
  if (id === 'addtens') assert.ok(a % 10 + b % 10 <= 9, 'add tens and ones: no new ten yet');
  if (id === 'bundle') assert.ok(a % 10 + b % 10 >= 10, 'make a new ten: the ones make 10 or more');
  if (id === 'unbundle') assert.ok(a % 10 < b % 10, 'unbundle a ten: not enough ones');
  if (id === 'hundreds') assert.ok(a + b <= 999 && (a % 10 + b % 10 >= 10 || Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 >= 10), 'add to 1,000 with at least one bundle');
  if (id === 'zeros') assert.ok(Math.floor(a / 10) % 10 === 0 && a % 10 < b % 10, 'subtract across zeros: no tens and too few ones');
  const v = p.visual;
  if (v && v.kind === 'arrows') {
    const end = v.steps.reduce((x, s) => step(x, s.op), v.start);
    v.steps.forEach((s, k) => { if (s.to !== null) assert.strictEqual(s.to, v.steps.slice(0, k + 1).reduce((x, t) => step(x, t.op), v.start), id + ': arrow stops add up'); });
    if (op === '+') assert.strictEqual(end, p.answer, id + ': the arrows reach the sum');
    else assert.ok(v.start === b && end === a && v.steps.reduce((x, s) => x + step(0, s.op), 0) === p.answer, id + ': counting up from the smaller number, the jumps make the answer');
  }
  if (v && v.kind === 'chart') assert.strictEqual(v.h * 100 + v.t * 10 + v.o, op === '+' ? a + b : a, id + ': the chart shows the numbers');
  if (v && v.kind === 'bond') assert.ok(v.a + v.b === v.whole && v.whole === b && (a + v.a) % 10 === 0, id + ': the bond makes the next ten');
  if (v && v.kind === 'column') assert.strictEqual(op === '+' ? v.nums[0] + v.nums[1] : v.nums[0] - v.nums[1], p.answer, id + ': the column gives the answer');
  if (v && v.kind === 'blocks') assert.strictEqual(v.t * 10 + v.o, p.answer, id + ': the blocks show the sum');
}
// The mistakes children make get their own hint.
const findQ = (id, text) => { for (let i = 0; i < 200000; i++) { const p = L.problem(id); if (p.text === text) return p; } throw new Error('no ' + text); };
const add = findQ('bundle', 'What is 47 + 26?');
assert.strictEqual(L.hint(add, 63), '7 + 6 = 13 ones: that is 1 new ten and 3 ones. Add the new ten to the tens.');
assert.strictEqual(L.hint(add, 613), '13 ones is too many for one place. Bundle 10 ones into a new ten.');
const sub = findQ('unbundle', 'What is 52 − 27?');
assert.strictEqual(L.hint(sub, 35), "In the ones, 2 − 7 does not work, and you can't flip it to 7 − 2. Unbundle a ten: 12 − 7 = 5. Then only 4 tens are left.");
assert.strictEqual(L.hint(sub, 79), 'This is take away: the answer is less than 52.');
const zero = findQ('zeros', 'What is 400 − 247?');
assert.strictEqual(L.hint(zero, 253), 'You unbundled a hundred, so one hundred is gone: 3 hundreds are left.');
assert.strictEqual(L.hint(zero, 163), 'You unbundled a ten too, so 9 tens are left, not 10.');
assert.strictEqual(L.hint(zero, 247), "You can't flip 0 − 4 into 4 − 0. Unbundle a hundred and a ten first.");
const ten = findQ('maketen', 'What is 38 + 7?');
assert.strictEqual(L.hint(ten, 35), 'You forgot the new ten. 38 + 2 = 40, then 40 + 5 = 45.');
assert.ok(ten.choices.includes(35) && add.choices.includes(63) && sub.choices.includes(35) && zero.choices.includes(253), 'the likely mistakes are among the choices');
// Build it guides the order: unbundle before taking away, ones before tens, a hundred before a ten.
let ub = L.buildTap(L.newBuild('unbundle'), 'one');
assert.ok(ub.msg && !ub.unb && ub.n === 0, 'taking away a one before unbundling explains why it does not work');
ub = L.buildTap(ub, 'ten');
assert.ok(ub.unb && !ub.msg && ub.n === 1, 'tapping a ten unbundles it');
for (let i = 0; i < 9; i++) ub = L.buildTap(ub, 'one');
assert.strictEqual(ub.ones, 7, 'only 7 ones are taken away');
for (let i = 0; i < 5; i++) ub = L.buildTap(ub, 'ten');
assert.ok(ub.tens === 2 && ub.done, '2 tens are taken away and 52 − 27 is done');
let b2 = L.buildTap(L.newBuild('hundreds'), 'tens');
assert.ok(b2.msg && b2.step === 0, 'bundling tens before the ones explains the order');
b2 = L.buildTap(L.buildTap(b2, 'ones'), 'tens');
assert.ok(b2.done && b2.step === 2, 'ones, then tens');
let z = L.buildTap(L.newBuild('zeros'), 'ten');
assert.ok(z.msg && z.step === 0, 'no tens to unbundle in 400');
z = L.buildTap(L.buildTap(z, 'hundred'), 'ten');
assert.ok(z.done, 'a hundred, then a ten');
let pv = L.newBuild('addtens');
for (let i = 0; i < 6; i++) pv = L.buildTap(pv, 'ten');
assert.ok(pv.t === 2 && !pv.done, 'only 2 tens can be added for 25');
for (let i = 0; i < 6; i++) pv = L.buildTap(pv, 'one');
assert.ok(pv.o === 5 && pv.done, '34 + 25 is built with 2 tens and 5 ones');

// Division Build it teaches both meanings with all 12 objects present in each model.
let divisionBuild = L.newBuild('division');
for (let i = 0; i < 12; i++) divisionBuild = L.buildTap(divisionBuild, 'shareBerry');
assert.deepStrictEqual(divisionBuild.counts, [4, 4, 4], 'sharing deals berries equally to three kids');
assert.ok(divisionBuild.shareDone && !divisionBuild.done, 'sharing alone does not skip the grouping model');
divisionBuild = L.buildTap(divisionBuild, 'startGrouping');
assert.strictEqual(divisionBuild.part, 'grouping');
for (let i = 0; i < 12; i++) divisionBuild = L.buildTap(divisionBuild, 'groupBerry');
assert.ok(divisionBuild.done && divisionBuild.groupingN === 12, 'grouping uses all 12 berries');

let arrayBuild = L.newBuild('arrays');
for (let i = 0; i < 15; i++) arrayBuild = L.buildTap(arrayBuild, `dot:${i}`);
arrayBuild = L.buildTap(arrayBuild, 'turn');
assert.ok(arrayBuild.turned && !arrayBuild.done, 'array must still be split after it is turned');
arrayBuild = L.buildTap(arrayBuild, 'cut');
assert.ok(arrayBuild.done, 'turned and split array completes Build it');

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
assert.ok(L.isOpen(st, 'maketen') && !L.isOpen(st, 'addtens'), 'each course starts at its own module 1');
for (let i = 0; i < L.MODULES.length; i++) {
  const m = L.MODULES[i];
  assert.ok(L.isOpen(st, m.id), m.id + ': opens after the previous module');
  L.markStep(st, m.id, 2);
  assert.strictEqual(L.progress(st, m.id).step, 2);
  assert.ok(L.finish(st, m.id).first, m.id + ': first finish is rewarded');
  assert.ok(!L.finish(st, m.id).first, m.id + ': replay is not a first finish');
  assert.ok(L.progress(st, m.id).done && L.progress(st, m.id).stars === 1);
}
assert.strictEqual(L.completed(st), 12);
assert.strictEqual(L.completed(st, 'addsub'), 6);
assert.strictEqual(L.completed({ lessons: { maketen: { done: true } } }, 'muldiv'), 0, 'courses count separately');
assert.ok(L.isOpen({ lessons: { groups: { done: true } } }, 'arrays') && !L.isOpen({ lessons: { groups: { done: true } } }, 'addtens'), 'finishing one course does not open the other');
assert.ok(L.MODULES.every((m) => L.isOpen({ lessons: {} }, m.id, true)), 'grown-up preview opens every module');
assert.strictEqual(L.assessmentPath([true, true]), 'done', 'two first-try answers finish directly');
assert.strictEqual(L.assessmentPath([true, false]), 'another', 'a miss opens another model');
assert.strictEqual(L.assessmentPath([false, false]), 'another', 'the remediation path also works');
assert.deepStrictEqual(MULDIV.map((id) => L.practiceDifficulty(id)), [1, 1, 2, 2, 4, 4]);
assert.deepStrictEqual(ADDSUB.map((id) => `${L.practice(id).topic}/${L.practice(id).d}`), ['add100/2', 'add100/2', 'add100/3', 'sub100/3', 'big/3', 'big/4'], 'Practice continues in the matching topic');
assert.deepStrictEqual(['mult', 'add100', 'sub100', 'big', 'time'].map(L.courseFor), ['muldiv', 'addsub', 'addsub', 'addsub', ''], 'Fix-it Lab knows which course teaches a topic');
const badge = (id) => globalThis.MQ.BADGES.find((b) => b.id === id);
assert.ok(badge('lesson1').test(st) && badge('lessonall').test(st) && badge('lessonadd').test(st), 'the Learn badges unlock');
assert.ok(!badge('lesson1').test({}) && !badge('lessonall').test({}) && !badge('lessonadd').test({}), 'old profiles do not unlock Learn badges');
assert.ok(!badge('lessonadd').test({ lessons: Object.fromEntries(MULDIV.map((id) => [id, { done: true }])) }), 'Multiply & Divide does not earn the Add & Subtract badge');

console.log('Learn: 2 courses, 12 modules, 24,000 generated questions with hints, 19,200 Add & Subtract answers checked, both assessment paths OK');
