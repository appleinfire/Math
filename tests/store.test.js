// Run: node tests/store.test.js
// Checks how two copies of one child's progress are merged, and how the family key is derived.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'store', 'cloud']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;
const S = MQ.store;

const base = () => ({
  v: 1, id: 'kid1', grade: 'g2', name: 'Sofia', crystals: 0, xp: 0, rev: 0, eggsHatched: 0,
  levels: {}, creatures: {}, badges: {}, days: {}, lastPlayed: '',
  stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0 },
  daily: { last: '', streak: 0, best: 0 },
});

// The same kid played offline on an iPad (A) and a laptop (B).
const a = Object.assign(base(), { rev: 100, crystals: 40, xp: 300, levels: { 'tide-0': { stars: 3 }, 'tide-1': { stars: 1 } }, creatures: { hermit: { got: 'x' }, puffer: { got: 'x' } }, badges: { first: 'x' }, days: { '2026-10-09': { a: 10, c: 8 } } });
a.stats.correct = 30; a.stats.bestStreak = 9; a.stats.topics.add20 = { a: 20, c: 15, byD: {} };
const b = Object.assign(base(), { rev: 200, crystals: 25, xp: 250, levels: { 'tide-1': { stars: 3 }, 'tide-2': { stars: 2 } }, creatures: { mantis: { got: 'y' } }, days: { '2026-10-09': { a: 4, c: 4 }, '2026-10-10': { a: 6, c: 5 } } });
b.stats.correct = 25; b.stats.bestStreak = 12; b.stats.topics.add20 = { a: 5, c: 5, byD: {} }; b.daily = { last: '2026-10-10', streak: 2, best: 2 };

const m = S.mergeProfiles(a, b);
assert.deepStrictEqual(Object.keys(m.creatures).sort(), ['hermit', 'mantis', 'puffer'], 'creatures from both devices are kept');
assert.deepStrictEqual(m.levels, { 'tide-0': { stars: 3 }, 'tide-1': { stars: 3 }, 'tide-2': { stars: 2 } }, 'every level keeps its best stars');
assert.strictEqual(m.crystals, 25, 'crystals come from the most recent copy (they can be spent)');
assert.strictEqual(m.xp, 300);
assert.strictEqual(m.stats.correct, 30);
assert.strictEqual(m.stats.bestStreak, 12);
assert.strictEqual(m.stats.topics.add20.a, 20, 'topic stats keep the copy with more practice');
assert.deepStrictEqual(m.days['2026-10-09'], { a: 10, c: 8 });
assert.deepStrictEqual(m.days['2026-10-10'], { a: 6, c: 5 });
assert.strictEqual(m.daily.last, '2026-10-10');
assert.strictEqual(m.badges.first, 'x');
assert.strictEqual(m.rev, 200);
assert.deepStrictEqual(S.mergeProfiles(b, a), m, 'merge order does not matter');
assert.strictEqual(S.mergeProfiles(null, b), b);

// Placement Check results taken on two devices are all kept, oldest first.
const ta = Object.assign(base(), { rev: 10, tests: { checks: [{ id: 'm1', date: '2026-10-01', overall: 5 }] } });
const tb = Object.assign(base(), { rev: 20, tests: { checks: [{ id: 'm3', date: '2026-10-09', overall: 6 }, { id: 'm1', date: '2026-10-01', overall: 5 }] } });
const tc = Object.assign(base(), { rev: 5, tests: { checks: [{ id: 'm2', date: '2026-10-05', overall: 5.5 }] } });
assert.deepStrictEqual(S.mergeProfiles(S.mergeProfiles(ta, tb), tc).tests.checks.map((c) => c.id), ['m1', 'm2', 'm3']);

// Erasing progress on purpose is not undone by an older copy from another device.
const erased = Object.assign(base(), { rev: 300, resetAt: 300 });
// Questions already seen on either device are remembered (newer copy last, at most S.SEEN_MAX per topic).
const sa = Object.assign(base(), { rev: 10, seen: { cg_matrix: ['k1', 'k2', 'k3'], kg_bank: ['b1'] } });
const sb = Object.assign(base(), { rev: 20, seen: { cg_matrix: ['k2', 'k4'] } });
assert.deepStrictEqual(S.mergeProfiles(sa, sb).seen, { cg_matrix: ['k1', 'k3', 'k2', 'k4'], kg_bank: ['b1'] });
assert.deepStrictEqual(S.mergeProfiles(sb, sa).seen, S.mergeProfiles(sa, sb).seen, 'seen merge does not depend on order');
const many = Object.assign(base(), { rev: 5, seen: { cg_matrix: Array.from({ length: 100 }, (_, i) => 'x' + i) } });
assert.strictEqual(S.mergeProfiles(many, sb).seen.cg_matrix.length, S.SEEN_MAX);
assert.deepStrictEqual(S.mergeProfiles(many, sb).seen.cg_matrix.slice(-2), ['k2', 'k4'], 'the newest keys are kept');
assert.deepStrictEqual(S.mergeProfiles(base(), Object.assign(base(), { rev: 1 })).seen, {}, 'old copies without seen still merge');
MQ.state = { seen: {} };
for (const k of ['a', 'b', 'a', 'c']) S.markSeen('cg_folding', k);
assert.deepStrictEqual(MQ.state.seen.cg_folding, ['b', 'a', 'c'], 'markSeen moves a repeat to the end');
MQ.state = null;

// Mistakes come back: a miss puts the skill in box 0 (due today); right answers on later days move it up;
// the third right answer on a due day fixes it. A right answer before the due day changes nothing.
{
  const realKey = MQ.U.dateKey;
  let today = '2026-10-10';
  MQ.U.dateKey = (d) => (d ? realKey(d) : today);
  const prob = (topic, d) => ({ topic, d, text: 'q', answer: 1 });
  MQ.state = Object.assign(base(), { review: {}, months: {}, mistakes: [], tips: {}, goal: { perDay: 0, days: 5 } });
  MQ.state.stats.fixed = 0;
  S.record(prob('add20', 2), false, '7');
  let r = MQ.state.review['add20|2'];
  assert.deepStrictEqual([r.box, r.due, r.miss], [0, '2026-10-10', 1], 'a miss is due today');
  assert.strictEqual(S.dueReview().length, 1);
  assert.strictEqual(S.record(prob('add20', 2), true), 'up', 'right on the same day: one step');
  assert.deepStrictEqual([r.box, r.due], [1, '2026-10-11']);
  assert.strictEqual(S.record(prob('add20', 2), true), null, 'not due yet: no change');
  assert.strictEqual(S.dueReview().length, 0);
  today = '2026-10-11';
  assert.strictEqual(S.record(prob('add20', 2), true), 'up');
  assert.deepStrictEqual([r.box, r.due], [2, '2026-10-14']);
  today = '2026-10-14';
  assert.strictEqual(S.record(prob('add20', 3), true), null, 'another difficulty is another skill');
  assert.strictEqual(S.record(prob('add20', 2), true), 'fixed');
  assert.ok(!MQ.state.review['add20|2'] && MQ.state.stats.fixed === 1, 'fixed skills leave the list and are counted');
  // A new mistake on a skill in progress starts it over.
  S.record(prob('time', 3), false, '2');
  S.record(prob('time', 3), true);
  S.record(prob('time', 3), false, '4');
  assert.deepStrictEqual([MQ.state.review['time|3'].box, MQ.state.review['time|3'].miss], [0, 2]);
  // Long-term statistics: every answer counts in its month, per topic.
  assert.deepStrictEqual(MQ.state.months['2026-10'].add20, [6, 5]);
  // The list never grows without end.
  for (let i = 0; i < 120; i++) S.miss('t' + i, 1);
  assert.strictEqual(Object.keys(MQ.state.review).length, S.REVIEW_MAX);
  // Merging: each skill keeps the copy practiced most recently; months keep the copy with more answers.
  const ra = Object.assign(base(), { rev: 10, review: { 'add20|2': { topic: 'add20', d: 2, box: 2, due: '2026-10-20', miss: 1, last: '2026-10-17' }, 'time|1': { topic: 'time', d: 1, box: 0, due: '2026-10-01', miss: 1, last: '2026-10-01' } }, months: { '2026-10': { add20: [9, 7] } } });
  const rb = Object.assign(base(), { rev: 20, review: { 'add20|2': { topic: 'add20', d: 2, box: 0, due: '2026-10-12', miss: 2, last: '2026-10-12' } }, months: { '2026-10': { add20: [4, 4], time: [2, 1] }, '2026-09': { time: [3, 3] } } });
  const rm = S.mergeProfiles(ra, rb);
  assert.strictEqual(rm.review['add20|2'].box, 2, 'the more recent practice wins');
  assert.ok(rm.review['time|1'], 'skills from both devices are kept');
  assert.deepStrictEqual(rm.months, { '2026-10': { add20: [9, 7], time: [2, 1] }, '2026-09': { time: [3, 3] } });
  assert.deepStrictEqual(S.mergeProfiles(rb, ra).review, rm.review, 'review merge does not depend on order');
  MQ.U.dateKey = realKey;
  MQ.state = null;
}

// Grown-up preview: a copy with every world open; nothing is written, uploaded or merged into the copy.
{
  const mem = {};
  globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  S.init();
  const kid = S.create({ name: 'Ann', grade: 'g2', companion: '🦊', buddyName: 'Pip' });
  kid.crystals = 7;
  S.save();
  const uploads = [];
  S.onChange((type, id) => uploads.push(id));
  const before = JSON.stringify(mem);
  const pv = S.startPreview();
  assert.ok(S.preview && pv !== kid && pv.settings.unlockAll && MQ.state === pv);
  pv.crystals = 999; pv.levels['tide-0'] = { stars: 3 };
  S.record({ topic: 'add20', d: 2, text: 'q', answer: 1 }, false, '3');
  S.save(); S.setPaused('check', { x: 1 }); S.update(kid.id, { name: 'X' });
  assert.strictEqual(S.paused('check'), null);
  assert.strictEqual(JSON.stringify(mem), before, 'nothing is written during a preview');
  assert.strictEqual(uploads.length, 0, 'nothing is uploaded during a preview');
  assert.strictEqual(S.raw(kid.id).crystals, 7, 'cloud upload reads the stored profile, not the preview copy');
  assert.ok(S.applyRemote(Object.assign(JSON.parse(JSON.stringify(kid)), { rev: kid.rev + 5, crystals: 12 })));
  assert.strictEqual(pv.crystals, 999, 'remote changes go to the stored profile, not the preview copy');
  const back = S.endPreview();
  assert.ok(!S.preview && back.crystals === 12 && !back.settings.unlockAll && !back.levels['tide-0'] && !Object.keys(back.review).length, 'ending the preview brings back the real profile');
  delete globalThis.localStorage;
  MQ.state = null;
}

const merged = S.mergeProfiles(erased, a);
assert.deepStrictEqual(merged.creatures, {}, 'an erase wins over older progress');
// …but progress made after the erase on another device is kept.
const later = Object.assign(base(), { rev: 400, creatures: { owl: { got: 'z' } } });
assert.ok(S.mergeProfiles(erased, later).creatures.owl);

(async () => {
  const k1 = await MQ.cloud.deriveId('Rudyk Tigers', '1234');
  const k2 = await MQ.cloud.deriveId('  rudyk tigers ', '1234');
  const k3 = await MQ.cloud.deriveId('rudyk-tigers', '1235');
  assert.match(k1, /^[a-f0-9]{64}$/, 'family key is 64 hex characters (what firestore.rules expects)');
  assert.strictEqual(k1, k2, 'code is case- and space-insensitive');
  assert.notStrictEqual(k1, k3, 'a different PIN gives a different family');
  // This key is the family root of all our apps; the app shell template (templates/app-shell) pins the same value.
  assert.strictEqual(await MQ.cloud.deriveId('smith-tigers', '1234'), 'd359f955e02a16da5751505a2d0bc555a26c7a08f33ac7eb1a1469ded2b601e6', 'family keys never change');
  // A family another of our apps connected on this device is offered without the PIN.
  const mem = {};
  globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  assert.strictEqual(MQ.cloud.sibling(), null);
  mem['math-expedition-family'] = JSON.stringify({ fid: k1, root: k1, name: 'own' }); // our own link is not a sibling
  assert.strictEqual(MQ.cloud.sibling(), null);
  mem['writing-power-family'] = JSON.stringify({ root: k1, fid: 'other', name: 'rudyk-tigers' });
  assert.deepStrictEqual(MQ.cloud.sibling(), { root: k1, name: 'rudyk-tigers', app: 'WritingPower' });
  delete globalThis.localStorage;

  // Catch-up on start: what never reached the server goes up; what was deleted elsewhere goes away here.
  const plan = (l, srv, syn) => { const p = MQ.cloud.catchUpPlan(l, srv, syn); return [p.upload.join(), p.remove.join(), JSON.stringify(p.onServer)]; };
  assert.deepStrictEqual(plan([{ id: 'a', rev: 5 }], { a: 5 }, {}), ['', '', '{"a":5}'], 'in sync: nothing to do');
  assert.deepStrictEqual(plan([{ id: 'a', rev: 6 }], { a: 5 }, { a: 5 }), ['a', '', '{}'], 'a change that never went up is uploaded');
  assert.deepStrictEqual(plan([{ id: 'a', rev: 4 }], { a: 5 }, {}), ['', '', '{"a":5}'], 'the server is newer: the live update brings it');
  assert.deepStrictEqual(plan([{ id: 'n', rev: 3 }], {}, {}), ['n', '', '{}'], 'a new profile that never went up is uploaded');
  assert.deepStrictEqual(plan([{ id: 'd', rev: 3 }], {}, { d: 3 }), ['', 'd', '{}'], 'deleted on another device: removed here too');
  assert.deepStrictEqual(plan([{ id: 'd', rev: 4 }], {}, { d: 3 }), ['d', '', '{}'], 'changed here after it was deleted elsewhere: kept and uploaded');
  assert.deepStrictEqual(plan([{ id: 'd', rev: 3 }, { id: 'a', rev: 1 }], { a: 1 }, null), ['', '', '{"a":1}'], 'no record yet: a missing profile is left alone');
  console.log('OK — merging progress and family keys behave as expected.');
})().catch((e) => { console.error(e); process.exit(1); });
