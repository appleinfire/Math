// Run: node tests/hatchery.test.js
// Checks the Hatchery: eggs and their creatures, the drawn pictures, dragon growth and treasure, the buddy.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'creature-art']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;

// Every SVG is well-formed: tags open and close in order, and every url(#id) points at a gradient in the same picture.
function checkSvg(s, what) {
  assert.ok(s.startsWith('<svg') && s.endsWith('</svg>'), what + ': not an svg');
  const stack = [];
  for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    if (m[3]) continue;
    if (m[1]) assert.strictEqual(stack.pop(), m[2], `${what}: </${m[2]}> closes the wrong tag`);
    else stack.push(m[2]);
  }
  assert.deepStrictEqual(stack, [], what + ': unclosed tags');
  assert.ok(!/NaN|undefined/.test(s), what + ': NaN or undefined in the picture');
  const ids = new Set([...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of s.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(m[1]), `${what}: url(#${m[1]}) has no definition`);
  return ids;
}

// Eggs: five, in price order, each with creatures; only the first is open from the start.
assert.deepStrictEqual(MQ.EGGS.map((e) => e.id), ['meadow', 'crystal', 'legend', 'dragon', 'royal']);
for (let i = 1; i < MQ.EGGS.length; i++) assert.ok(MQ.EGGS[i].price > MQ.EGGS[i - 1].price && MQ.EGGS[i].taps > MQ.EGGS[i - 1].taps, MQ.EGGS[i].id + ' should cost more and take more taps');
assert.strictEqual(MQ.EGGS[0].need, 0);
for (const E of MQ.EGGS) {
  const list = MQ.eggCreatures(E.id);
  assert.ok(list.length, E.id + ' has no creatures');
  const prev = MQ.EGGS[MQ.EGGS.indexOf(E) - 1];
  if (prev) assert.ok(E.need <= MQ.eggCreatures(prev.id).length, E.id + ' needs more creatures than the egg before has');
  for (const c of list) {
    assert.ok(c.name && c.emoji && c.fact.length > 30, c.id + ': name, emoji and fact');
    if (E.id !== 'meadow') {
      assert.ok(MQ.hasArt(c.id), c.id + ' has no picture');
      assert.ok(/Real fact|Komodo/.test(c.fact), c.id + ': a magical creature’s fact should have a real fact in it');
    }
  }
  checkSvg(MQ.eggArt(E.id), E.id + ' egg');
  checkSvg(MQ.eggArt(E.id, { crack: 0.5, glow: '#7fd0ff' }), E.id + ' cracked egg');
}
assert.strictEqual(MQ.eggCreatures('meadow').length, 20, 'the 14 old Meadow animals and 6 new ones');
assert.ok(['unicorn', 'dodo', 'beaver', 'crowned'].every((id) => MQ.creatureById(id).egg === 'meadow'), 'old egg creatures keep their ids');
assert.strictEqual(new Set(MQ.ALL_CREATURES.map((c) => c.id)).size, MQ.ALL_CREATURES.length, 'creature ids are unique');

// Pictures: every drawn creature (and every dragon at every stage) is a valid SVG; two copies don't share gradient ids.
for (const c of MQ.EGG_CREATURES.filter((x) => MQ.hasArt(x.id))) {
  const stages = c.dragon ? [0, 1, 2, 3] : [undefined];
  for (const stage of stages) checkSvg(MQ.art(c.id, { stage }), `${c.id} stage ${stage}`);
  const a = checkSvg(MQ.art(c.id), c.id), b = checkSvg(MQ.art(c.id), c.id);
  for (const id of a) assert.ok(!b.has(id), c.id + ': gradient id repeats between two copies');
}
assert.strictEqual(MQ.art('hermit'), '', 'real animals have no picture');
const total = MQ.EGG_CREATURES.filter((c) => MQ.hasArt(c.id)).reduce((n, c) => n + MQ.art(c.id).length, 0);
assert.ok(total < 160000, 'all pictures together stay small: ' + total);

// Dragons: a look, an element and name ideas each; growth stages from right answers after hatching.
for (const c of MQ.EGG_CREATURES.filter((x) => x.egg === 'dragon' || x.egg === 'royal')) {
  assert.ok(c.dragon && MQ.DRAGON_LOOK[c.id] && c.el && c.names.length >= 3, c.id + ': dragon data');
  checkSvg(MQ.art(c.id, { stage: 0, fly: true }), c.id + ' flying');
}
const kid = (correct, dragons) => ({ stats: { correct }, creatures: Object.fromEntries(Object.keys(dragons).map((id) => [id, { got: 'x' }])), dragons });
const stageAt = (n) => MQ.dragonStage(kid(100 + n, { dr_ember: { name: 'Blaze', at: 100 } }), 'dr_ember');
assert.deepStrictEqual([0, 49, 50, 149, 150, 399, 400, 5000].map(stageAt), [0, 0, 1, 1, 2, 2, 3, 3]);
assert.strictEqual(MQ.dragonStage(kid(10, { dr_ember: { at: 30 } }), 'dr_ember'), 0, 'fewer answers than at hatching (an older copy) counts as 0');
const k3 = kid(400, { dr_ember: { at: 0 }, dr_frost: { at: 300 }, dr_moon: { at: 200 } });
assert.strictEqual(MQ.dragonTreasure(k3), 2 * MQ.DRAGON_TREASURE, 'grown-up and elder dragons guard treasure, babies and young ones not yet');
delete k3.creatures.dr_moon;
assert.strictEqual(MQ.dragonTreasure(k3), MQ.DRAGON_TREASURE, 'only hatched dragons count');

// The buddy: a creature from the collection (a dragon shows its stage and its name), or the starting companion.
const s = Object.assign(kid(200, { dr_frost: { name: 'Icy', at: 0 } }), { companion: '🦊', buddyName: 'Pip', buddy: '' });
assert.strictEqual(MQ.face(s), '🦊');
assert.strictEqual(MQ.buddyName(s), 'Pip');
s.buddy = 'dr_frost';
assert.ok(MQ.face(s).startsWith('<svg'), 'a dragon buddy is drawn');
assert.strictEqual(MQ.buddyName(s), 'Icy');
s.buddy = 'hermit';
assert.strictEqual(MQ.face(s), '🦊', 'a creature not in the collection is ignored');
s.creatures.hermit = { got: 'x' };
assert.strictEqual(MQ.face(s), '🦀');
assert.strictEqual(MQ.buddyName(s), 'Hermit Crab');

// Badges: the Living Encyclopedia counts the map and Meadow Eggs; the magical eggs have their own badges.
const badge = (id) => MQ.BADGES.find((b) => b.id === id);
const all = { grade: 'g2', creatures: {}, dragons: {}, stats: { correct: 0 } };
MQ.trackCreatures('g2', true).forEach((c) => (all.creatures[c.id] = { got: 'x' }));
assert.ok(badge('colall').test(all) && !badge('crystalall').test(all) && !badge('dragon1').test(all));
MQ.EGG_CREATURES.forEach((c) => (all.creatures[c.id] = { got: 'x' }));
assert.ok(['crystalall', 'legendall', 'dragon1', 'dragonall', 'hatchall'].every((id) => badge(id).test(all)));
assert.ok(!badge('elder').test(all));
all.dragons.dr_sun = { at: 0 };
all.stats.correct = 400;
assert.ok(badge('elder').test(all));

console.log(`OK — ${MQ.EGGS.length} eggs, ${MQ.EGG_CREATURES.length} egg creatures, ${MQ.EGG_CREATURES.filter((c) => MQ.hasArt(c.id)).length} pictures (${Math.round(total / 1024)} KB), dragons grow and guard treasure.`);
