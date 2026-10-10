// Run: node tests/shell.test.js
// Checks how two copies of one profile are merged, profile storage, the family key, and the offline file list.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const mem = {};
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
for (const f of ['config', 'util', 'schema', 'store', 'cloud']) require(path.join(__dirname, '..', 'js', f + '.js'));
const APP = globalThis.APP, S = APP.store;

// The same child played offline on a tablet (A) and a laptop (B).
S.init();
const kid = S.create({ name: 'Mia', kind: 'older', avatar: '🐼' });
const a = JSON.parse(JSON.stringify(kid)), b = JSON.parse(JSON.stringify(kid));
Object.assign(a, { rev: 100, xp: 300, coins: 40, levels: { l1: { stars: 3 }, l2: { stars: 1 } }, badges: { first: 'x' }, days: { '2026-10-09': { a: 10, c: 8 } } });
a.stats.correct = 30;
Object.assign(b, { rev: 200, xp: 250, coins: 25, levels: { l2: { stars: 3 }, l3: { stars: 2 } }, days: { '2026-10-09': { a: 4, c: 4 }, '2026-10-10': { a: 6, c: 5 } } });
b.stats.correct = 25;
const m = S.mergeProfiles(a, b);
assert.deepStrictEqual(m.levels, { l1: { stars: 3 }, l2: { stars: 3 }, l3: { stars: 2 } }, 'every level keeps its best stars');
assert.strictEqual(m.badges.first, 'x', 'badges from both devices are kept');
assert.strictEqual(m.xp, 300, 'counters keep the higher value');
assert.strictEqual(m.coins, 25, 'spendable things come from the newer copy');
assert.strictEqual(m.stats.correct, 30);
assert.deepStrictEqual(m.days, { '2026-10-09': { a: 10, c: 8 }, '2026-10-10': { a: 6, c: 5 } });
assert.strictEqual(m.rev, 200);
assert.deepStrictEqual(S.mergeProfiles(b, a), m, 'merge order does not matter');

// A deliberate reset is not undone by an older copy from another device.
const r = Object.assign(JSON.parse(JSON.stringify(b)), { rev: 300, resetAt: 300, xp: 0, levels: {} });
assert.deepStrictEqual(S.mergeProfiles(a, r).levels, {});

// A copy from another device updates the open profile in place.
const before = APP.state;
assert.strictEqual(S.applyRemote(Object.assign(JSON.parse(JSON.stringify(kid)), { rev: Date.now() + 1000, xp: 999 })), true);
assert.strictEqual(APP.state, before, 'same object stays on screen');
assert.strictEqual(APP.state.xp, 999);
assert.strictEqual(S.applyRemote(JSON.parse(JSON.stringify(APP.state))), false, 'nothing new: no change');

// A new profile from another device appears; a deleted one disappears.
const other = Object.assign(JSON.parse(JSON.stringify(kid)), { id: 'zz1', name: 'Leo', rev: 5 });
S.applyRemote(other);
assert.deepStrictEqual(S.profiles().map((p) => p.name).sort(), ['Leo', 'Mia']);
S.removeRemote('zz1');
assert.deepStrictEqual(S.profiles().map((p) => p.name), ['Mia']);

// Preview: nothing is saved.
const saved = mem[APP.CONFIG.id + '-p-' + kid.id];
S.startPreview();
APP.state.xp = 12345;
S.save();
assert.strictEqual(mem[APP.CONFIG.id + '-p-' + kid.id], saved);
S.endPreview();
assert.strictEqual(APP.state.xp, 999);

// Save code round trip.
const code = S.exportCode();
S.remove(kid.id);
assert.strictEqual(S.profiles().length, 0);
S.importCode(code);
assert.strictEqual(S.profiles()[0].name, 'Mia');

// Every script in index.html is in the offline cache list of sw.js.
const root = path.join(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map((x) => x[1]);
const cached = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const s of scripts.concat('css/style.css')) assert.ok(cached.includes(`'${s}'`), s + ' is missing from FILES in sw.js');

// Family key: same code + PIN → same key on every device, whatever the spacing and case.
(async () => {
  const k1 = await APP.cloud.deriveId('Smith Tigers', '1234');
  const k2 = await APP.cloud.deriveId(' smith-tigers ', ' 1234');
  assert.strictEqual(k1, k2);
  assert.match(k1, /^[a-f0-9]{64}$/, 'matches the pattern in firestore.rules');
  assert.notStrictEqual(k1, await APP.cloud.deriveId('smith-tigers', '1235'));

  // One family code + PIN for all our apps: the root is the key Math Expedition already uses,
  // and each app keeps its data under its own key derived from the root.
  const MATH_KEY = 'd359f955e02a16da5751505a2d0bc555a26c7a08f33ac7eb1a1469ded2b601e6'; // Math Expedition: smith-tigers + 1234
  const root = await APP.cloud.deriveRoot('smith-tigers', '1234');
  assert.strictEqual(root, MATH_KEY, 'same family root as Math Expedition');
  assert.strictEqual(await APP.cloud.appKey(root, 'math-expedition'), MATH_KEY, 'Math Expedition keeps its data under the root');
  assert.strictEqual(k1, await APP.cloud.appKey(root), 'this app: key from the root');
  assert.notStrictEqual(k1, root);
  assert.notStrictEqual(await APP.cloud.appKey(root, 'writing-power'), await APP.cloud.appKey(root, 'another-app'), 'apps do not share data');

  // A family another app connected on this device can be joined without the PIN.
  assert.strictEqual(APP.cloud.sibling(), null);
  localStorage.setItem('math-expedition-family', JSON.stringify({ fid: MATH_KEY, name: 'smith-tigers' })); // Math's older link: no root
  assert.deepStrictEqual(APP.cloud.sibling(), { root: MATH_KEY, name: 'smith-tigers', app: 'Math Expedition' });
  localStorage.removeItem('math-expedition-family');
  localStorage.setItem('writing-power-family', JSON.stringify({ root: MATH_KEY, fid: 'x', name: 'smith-tigers' }));
  assert.strictEqual(APP.cloud.sibling().app, 'WritingPower');
  localStorage.removeItem('writing-power-family');
  console.log('shell tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
