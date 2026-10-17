// Run: node tests/duel.test.js
// Checks creature stats (js/stats.js) and Card Duels (js/duel.js): the rules, the questions, and the balance of the
// leagues (simulated duels of a child who picks the biggest numbers).
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'stats', 'duel']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ, D = MQ.duel;

// ---------- stats: every creature has four stats 0–100 and a special power; rarer creatures are stronger
const RANGE = { common: [100, 220], rare: [160, 270], legendary: [200, 320], mythic: [190, 300], crystal: [200, 310], legend: [290, 350], dragon: [350, 400], royal: [400, 400] };
const byRarity = {};
for (const c of MQ.ALL_CREATURES) {
  const raw = MQ.STATS[c.id];
  assert.ok(raw, c.id + ' has stats');
  assert.ok(raw.slice(0, 4).every((x) => Number.isInteger(x) && x >= 0 && x <= 100), c.id + ': stats 0–100');
  assert.ok(typeof raw[4] === 'string' && raw[4].length >= 8 && raw[4].length <= 60, c.id + ': a special power');
  const s = MQ.stats(c, null, c.dragon ? 3 : undefined), [lo, hi] = RANGE[c.rarity];
  assert.strictEqual(s.power, s.list.reduce((a, b) => a + b, 0));
  assert.ok(s.power >= lo && s.power <= hi, `${c.id} (${c.rarity}): Power ${s.power} in ${lo}–${hi}`);
  (byRarity[c.rarity] = byRarity[c.rarity] || []).push(s.power);
}
assert.strictEqual(Object.keys(MQ.STATS).length, MQ.ALL_CREATURES.length, 'no stats for creatures that don’t exist');
const avg = (r) => byRarity[r].reduce((a, b) => a + b, 0) / byRarity[r].length;
assert.ok(avg('common') < avg('rare') && avg('rare') < avg('legendary') && avg('legendary') < avg('legend') && avg('crystal') < avg('legend') && avg('legend') < avg('dragon') && avg('dragon') < avg('royal'), 'rarer creatures are stronger on average');
// a few real-life checks: the cheetah-fast and the elephant-strong
const S = (id) => MQ.stats(MQ.creatureById(id));
assert.ok(S('eagle').speed > S('turtle').speed && S('elephant').strength > S('zebra').strength && S('octopus').smarts > S('hermit').smarts && S('sloth').speed < 10);
// a dragon's stats grow with its stage; a child's dragon has the stage of its growth
const grown = [0, 1, 2, 3].map((k) => MQ.stats(MQ.creatureById('dr_storm'), null, k).power);
assert.ok(grown.every((p, i) => !i || p > grown[i - 1]) && grown[3] === MQ.STATS.dr_storm.slice(0, 4).reduce((a, b) => a + b, 0));
const kid = { stats: { correct: 200 }, creatures: { dr_storm: { got: 'x' } }, dragons: { dr_storm: { at: 0 } } };
assert.strictEqual(MQ.stats(MQ.creatureById('dr_storm'), kid).power, grown[MQ.dragonStage(kid, 'dr_storm')]);

// ---------- duel rules
const st = (ids, grade = 'g2') => {
  const s = { grade, creatures: Object.fromEntries(ids.map((id) => [id, { got: 'x' }])), dragons: {}, stats: { correct: 0 } };
  ids.filter((id) => MQ.creatureById(id).dragon).forEach((id) => (s.dragons[id] = { at: 0 }));
  return s;
};
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
assert.ok(!D.canPlay(st(['hermit', 'puffer'])) && D.canPlay(st(['hermit', 'puffer', 'zebra'])), 'three creatures to play');
assert.deepStrictEqual(D.cards(st(['hermit', 'elephant', 'zebra'])).map((c) => c.id), ['elephant', 'zebra', 'hermit'], 'strongest first');
// leagues open one after another: 3 wins in the one before
const kid2 = st(['hermit', 'puffer', 'zebra']);
assert.ok(D.open(kid2, 0) && !D.open(kid2, 1) && !D.open(kid2, 2));
D.ensure(kid2).wins.meadow = 3;
assert.ok(D.open(kid2, 1) && !D.open(kid2, 2));
// the rival's decks: the Meadow League plays animals from the child's own map; the others magical creatures too
const worlds = (g) => new Set(MQ.track(g).worlds.map((w) => w.id));
for (const g of ['k', 'g2']) {
  assert.ok(D.pool(0, g).length >= 20 && D.pool(0, g).every((c) => worlds(g).has(c.world) && ['common', 'rare'].includes(c.rarity)), g + ': the Meadow League plays the child’s map animals');
  assert.ok(D.pool(1, g).some((c) => c.rarity === 'crystal') && D.pool(2, g).some((c) => c.dragon) && !D.pool(2, g).some((c) => c.rarity === 'royal'));
}
assert.ok(D.pool(0, 'k').every((c) => c.id.startsWith('k_')), 'kindergarten rivals play baby animals');
// a duel: 5 rounds; the rival picks the stat in rounds 2 and 4; round 5 is Power
assert.deepStrictEqual([1, 2, 3, 4, 5].map((r) => [D.rivalTurn(r), D.powerRound(r)]), [[false, false], [true, false], [false, false], [true, false], [false, true]]);
const many = st(MQ.trackCreatures('g2', true).slice(0, 12).map((c) => c.id));
const du = D.start(many, 0);
const hand = D.deal(many, du, rnd);
assert.ok(hand.length === 3 && new Set(hand).size === 3 && hand.every((id) => many.creatures[id]), 'three different cards from the collection');
const r1 = D.play(many, du, 'elephant' in many.creatures ? 'elephant' : hand[0], 1, 'hermit');
assert.ok(r1.a > r1.b && r1.win === 'me' && du.me === 1 && du.round === 2);
for (let k = 0; k < 4; k++) assert.ok(!D.deal(many, du, rnd).some((id) => du.used.includes(id)), 'cards already played wait while others are left');
const pick = D.rivalChoose(Object.assign(D.start(many, 1), {}), rnd), ps = D.theirs(MQ.creatureById(pick.id)).list;
assert.strictEqual(ps[pick.stat], Math.max(...ps), 'a smart rival picks its best stat');
// a tie counts for nobody; the outcome and the prize
const t = D.start(many, 0);
assert.strictEqual(D.play(many, t, 'hermit', 0, 'hermit').win, 'tie');
Object.assign(t, { me: 2, rival: 2 });
assert.deepStrictEqual(D.finish(many, t), { out: 'draw', prize: 1 });
Object.assign(t, { me: 3, rival: 1 });
const before = D.wins(many, 0);
assert.deepStrictEqual(D.finish(many, t), { out: 'win', prize: D.LEAGUES[0].prize });
assert.strictEqual(D.wins(many, 0), before + 1);

// ---------- the questions: kindergarten taps the bigger number; 2nd grade works out how much more
const me = { name: 'Ember Fox', e: '🦊', v: 82 }, them = { name: 'Zebra', e: '🦓', v: 65 };
const qk = D.question('k', me, them, 0), q2 = D.question('g2', me, them, 0), q3 = D.question('g2', them, me, -1);
assert.deepStrictEqual([qk.kind, qk.answer, qk.choices], ['choice', '🦊 82', ['🦊 82', '🦓 65']]);
assert.deepStrictEqual([q2.kind, q2.answer, D.isRight(q2, '17'), D.isRight(q2, '18')], ['num', 17, true, false]);
assert.ok(/Speed/.test(q2.text) && /Ember Fox/.test(q2.text) && q2.explain === '82 − 65 = 17');
assert.ok(/Power/.test(q3.text) && q3.answer === 17, 'the Power round');
assert.strictEqual(D.question('g2', me, Object.assign({}, them, { v: 82 }), 2), null, 'a tie has no question');

// ---------- balance: simulated duels of a child who picks the biggest numbers
const sim = (ids, li, grade, correct = 0, n = 600) => {
  const s = st(ids, grade);
  s.stats.correct = correct; // right answers since the dragons hatched: their growth
  let w = 0;
  for (let k = 0; k < n; k++) {
    const d = D.start(s, li);
    while (!D.over(d)) {
      const h = D.deal(s, d, rnd), mine = (id) => D.mine(s, MQ.creatureById(id));
      if (D.powerRound(d.round)) { const id = h.sort((a, b) => mine(b).power - mine(a).power)[0]; D.play(s, d, id, -1, D.rivalCard(d, rnd)); continue; }
      if (D.rivalTurn(d.round)) { const r = D.rivalChoose(d, rnd), id = h.sort((a, b) => mine(b).list[r.stat] - mine(a).list[r.stat])[0]; D.play(s, d, id, r.stat, r.id); continue; }
      let best = null;
      for (const id of h) mine(id).list.forEach((v, i) => { if (!best || v > best.v) best = { id, i, v }; });
      D.play(s, d, best.id, best.i, D.rivalCard(d, rnd));
    }
    if (D.outcome(d) === 'win') w++;
  }
  return w / n;
};
const ids = (f) => MQ.ALL_CREATURES.filter(f).map((c) => c.id);
const kMap = ids((c) => c.id.startsWith('k_')), g2Map = ids((c) => worlds('g2').has(c.world));
const egg = (e) => MQ.eggCreatures(e).map((c) => c.id);
const rates = {
  kBeginner: sim(ids((c) => c.id.startsWith('k_') && c.rarity === 'common').slice(0, 5), 0, 'k'),
  g2Beginner: sim(ids((c) => worlds('g2').has(c.world) && c.rarity === 'common').slice(0, 6), 0, 'g2'),
  kMap: sim(kMap, 0, 'k'),
  crystalMapOnly: sim(g2Map, 1, 'g2'),
  crystalWithCrystals: sim([...g2Map, ...egg('meadow'), ...egg('crystal')], 1, 'g2'),
  kCrystalWithCrystals: sim([...kMap, ...egg('meadow'), ...egg('crystal')], 1, 'k'),
  dragonNoLegends: sim([...g2Map, ...egg('crystal')], 2, 'g2'),
  dragonLegends: sim([...g2Map, ...egg('crystal'), ...egg('legend')], 2, 'g2'),
};
rates.dragonBabies = sim([...egg('legend'), ...egg('dragon')], 2, 'g2');
rates.dragonElders = sim([...egg('legend'), ...egg('dragon')], 2, 'g2', 1000);
const ok = (k, lo, hi) => assert.ok(rates[k] >= lo && rates[k] <= hi, `${k}: wins ${(rates[k] * 100).toFixed(0)}% (expected ${lo * 100}–${hi * 100}%)`);
ok('kBeginner', 0.45, 0.9); // a beginner wins most Meadow duels
ok('g2Beginner', 0.45, 0.9);
ok('kMap', 0.8, 1);
ok('crystalMapOnly', 0, 0.4); // the Crystal League takes magical cards…
ok('crystalWithCrystals', 0.35, 0.75); // …and with them it is a fair fight
ok('kCrystalWithCrystals', 0.3, 0.75);
ok('dragonNoLegends', 0, 0.3); // the Dragon League takes Legendary and Dragon cards
ok('dragonLegends', 0.25, 0.65);
ok('dragonElders', 0.6, 1); // grown dragons win: right answers make them stronger
assert.ok(rates.dragonElders > rates.dragonBabies + 0.1, 'dragons win more as they grow');
console.log(`OK — ${MQ.ALL_CREATURES.length} creatures with stats; duels: ${Object.entries(rates).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(', ')}`);
