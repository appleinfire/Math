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
  console.log('OK — merging progress and family keys behave as expected.');
})().catch((e) => { console.error(e); process.exit(1); });
