// Run: node tests/farm.test.js
// Sunny Farm rules: the economy pays off, days grow crops and animals, the shop and the stand move money right,
// and every money problem a customer brings is well-formed for both grades and every tier.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'farm', 'store']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;
const F = MQ.farm, U = MQ.U;

// ---------- the economy pays off: every crop and every grown-up animal earns more than it costs
for (const g of ['k', 'g2']) {
  for (const [id, c] of Object.entries(F.CROPS)) assert.ok(c.yield * F.price(id, g) > F.seedPrice(id, g), `${id} (${g}) earns more than its seeds`);
  for (const [id, a] of Object.entries(F.ANIMALS)) assert.ok(a.per * F.price(a.item, g) > a.eat * F.FEED.price[g === 'k' ? 0 : 1], `${id} (${g}) earns more than its feed`);
  for (const t of F.tiers(g)) for (const k of t.coins) assert.ok(F.COINV[k], `${g} tier coin ${k}`);
}
for (const k of Object.keys(F.COINV)) assert.ok(MQ.V.COIN[k], `picture for ${k}`);
for (const it of Object.values(F.ANIMALS)) assert.ok(F.ITEMS[it.item]);
for (const id of Object.keys(F.CROPS)) assert.ok(F.ITEMS[id]);

// ---------- levels: steady growth with no top level, something new at most levels up to 50
assert.deepStrictEqual(F.level(0), { level: 1, from: 0, to: 30 });
assert.strictEqual(F.level(29).level, 1);
assert.strictEqual(F.level(30).level, 2);
assert.strictEqual(F.level(1e6).level > 100, true);
for (const g of ['k', 'g2']) {
  const quiet = [];
  for (let L = 2; L <= 60; L++) if (!F.unlocksAt(L, g).length) quiet.push(L);
  assert.deepStrictEqual(quiet, [], `every level up to 60 opens something (${g}): quiet ${quiet.join(',')}`);
}
assert.strictEqual(F.title(1), 'Little farmer');
assert.strictEqual(F.title(60), 'Farm legend');
// workshops: every recipe is worth making, in both grades, and uses things the farm can have
for (const r of F.recipes()) {
  for (const g of ['k', 'g2']) assert.ok(F.worth(r, g).gain > 0, `${r.out} (${g}) is worth more than its inputs`);
  assert.ok(F.ITEMS[r.out].made, r.out + ' is marked as made');
  for (const id of Object.keys(r.in)) assert.ok(F.ITEMS[id], 'input ' + id);
  assert.ok(r.lv >= F.WORKS[r.work].lv, r.out + ' opens with or after its workshop');
}

// ---------- a new farm, a day, a harvest
const st = { grade: 'g2', days: {}, stats: { attempts: 0, correct: 0 } };
const fm = F.ensure(st);
assert.strictEqual(fm.money, F.START_MONEY[1]);
assert.strictEqual(F.ensure(st), fm, 'ensure keeps the farm');
fm.money = 100;
assert.strictEqual(F.cropStage(fm.beds[0]), 'ready', 'the first carrots are ready to pick');
assert.strictEqual(F.harvest(fm, 0), 3);
assert.strictEqual(fm.basket.carrot, 3);
assert.strictEqual(F.cropStage(fm.beds[0]), 'empty');
assert.strictEqual(F.buySeed(fm, 'g2', 0, 'strawberry'), false, 'strawberries open at level 2');
assert.strictEqual(F.buySeed(fm, 'g2', 0, 'carrot'), true);
assert.strictEqual(fm.money, 85);
assert.strictEqual(F.feed(fm, 0), 'ok');
assert.strictEqual(fm.feed, 2);
assert.strictEqual(F.feed(fm, 0), 'fed');
let news = F.nextDay(fm);
assert.deepStrictEqual(news.ripe, ['carrot']);
assert.strictEqual(F.animalStage(fm.pens[0]), 1, 'the chick is young after one fed day');
assert.strictEqual(fm.day, 2);
F.feed(fm, 0); F.nextDay(fm);
assert.strictEqual(F.animalStage(fm.pens[0]), 2, 'grown up after two fed days');
assert.strictEqual(fm.pens[0].ready, 0, 'it starts laying the day after it grows up');
news = F.nextDay(fm);
assert.deepStrictEqual(news.hungry, ['chicken'], 'not fed: nothing happens');
assert.strictEqual(fm.pens[0].ready, 0);
fm.feed = 0;
assert.strictEqual(F.feed(fm, 0), 'nofeed');
fm.feed = 5; F.feed(fm, 0); news = F.nextDay(fm);
assert.deepStrictEqual(news.made, [['egg', 2]]);
assert.strictEqual(F.collect(fm, 0), 2);
assert.strictEqual(fm.basket.egg, 2);

// ---------- the shop
fm.money = 1000;
assert.strictEqual(F.buy(fm, 'g2', 'animal:chicken'), null, 'no empty pen');
assert.strictEqual(F.buy(fm, 'g2', 'pen'), null, 'pen 2 opens at level 2');
fm.xp = F.level(0).to; // level 2
const pen = F.buy(fm, 'g2', 'pen');
assert.ok(pen && fm.pens.length === 2 && fm.money === 940);
assert.ok(F.buy(fm, 'g2', 'animal:chicken'));
assert.strictEqual(fm.pens[1].a, 'chicken');
assert.ok(F.buy(fm, 'g2', 'feed:20'));
assert.strictEqual(fm.feed, 24);
assert.ok(F.buy(fm, 'g2', 'decor:fence'));
assert.strictEqual(F.buy(fm, 'g2', 'decor:fence'), null, 'one fence is enough');
fm.goal = 'decor:tractor';
assert.strictEqual(F.goalItem(fm, 'g2').price, 4000);
fm.money = 0;
assert.strictEqual(F.buy(fm, 'g2', 'feed:5'), null, 'no money, no feed');
assert.strictEqual(fm.stats.spent, 60 + 50 + 100 + 100 + 15);

// ---------- XP pays level gifts; tiers climb and fall
const f2 = F.ensure({ grade: 'g2' });
const m0 = f2.money;
assert.deepStrictEqual(F.addXp(f2, 30 + 40, 'g2'), [2, 3]);
assert.strictEqual(f2.money, m0 + 20 + 30);
assert.strictEqual(F.tierOpen(f2, 'g2'), 2);
for (let i = 0; i < 4; i++) F.adapt(f2, 'g2', true);
assert.strictEqual(f2.tier, 2, 'four right in a row: up');
for (let i = 0; i < 8; i++) F.adapt(f2, 'g2', true);
assert.strictEqual(f2.tier, 2, 'never above the open tiers');
F.adapt(f2, 'g2', false); F.adapt(f2, 'g2', false);
assert.strictEqual(f2.tier, 1, 'two misses: down');

// ---------- serving a customer
const f3 = F.ensure({ grade: 'g2' });
f3.basket = { egg: 3 };
f3.stand = 2; // tent: 10% tips
const sale = { kind: 'num', answer: 30, sale: { egg: 2 }, total: 30, vip: false };
const r = F.serve(f3, 'g2', sale, true, true);
assert.deepStrictEqual([r.paid, r.tip], [30, 3]);
assert.strictEqual(f3.basket.egg, 1);
assert.strictEqual(f3.money, F.START_MONEY[1] + 33);
assert.strictEqual(r.xp, 5);
const r2 = F.serve(f3, 'g2', { sale: { egg: 1 }, total: 15 }, false, false);
assert.deepStrictEqual([r2.paid, r2.tip, r2.xp], [15, 0, 1]);
assert.ok(!('egg' in f3.basket), 'sold-out items leave the basket');
const job = F.serve(f3, 'g2', { jobs: true, tier: 3, sale: {}, total: 0 }, true, true);
assert.strictEqual(job.paid, 15);
const st4 = { days: {}, stats: { attempts: 0, correct: 0 } };
F.record(st4, true); F.record(st4, false);
assert.deepStrictEqual(st4.days[U.dateKey()], { a: 2, c: 1 });

// ---------- money helpers
assert.strictEqual(F.fmt(125, 'g2'), '$1.25');
assert.strictEqual(F.fmt(125, 'k'), '125¢');
assert.strictEqual(F.spoken(135, 'g2'), '1 dollar and 35 cents');
assert.deepStrictEqual(F.fewest(67, ['q', 'd', 'n', 'p']), ['q', 'q', 'd', 'n', 'p', 'p']);
assert.strictEqual(F.fewest(7, ['d', 'n']), null);
for (let i = 0; i < 300; i++) {
  const amt = U.rnd(1, 2000), kinds = U.pick([['p'], ['n', 'p'], ['d', 'n', 'p'], ['q', 'd', 'n', 'p'], ['w', 't', 'f', 'b', 'q', 'd', 'n', 'p']]);
  const c = F.coinsFor(amt, kinds);
  if (c) assert.strictEqual(F.sumCoins(c), amt);
  else assert.ok(F.fewest(amt, kinds) === null || F.fewest(amt, kinds).length > 12);
}
for (let i = 0; i < 200; i++) {
  const a = U.rnd(1, 3000), ch = F.moneyChoices(a, 'g2');
  assert.ok(ch.includes(F.fmt(a, 'g2')) && new Set(ch).size === ch.length, 'choices hold the answer once');
}

// ---------- every customer problem is well-formed
function checkProblem(p, grade, stock, label) {
  assert.ok(p, label + ': a problem');
  assert.ok(['num', 'choice', 'coins'].includes(p.kind), label + ' kind ' + p.kind);
  assert.ok(p.text && p.hint && p.explain, label + ' has text, hint and explain');
  assert.ok(!/undefined|NaN/.test(p.text + p.explain + (p.visual || '')), label + ' no undefined: ' + p.text);
  let total = 0;
  for (const [id, n] of Object.entries(p.sale)) {
    assert.ok(n >= 1 && n <= stock[id], `${label}: sells what is in stock (${id} ${n}/${stock[id]})`);
    total += n * F.price(id, grade);
  }
  if (p.type === 'deal') assert.ok(p.total < total, label + ' a deal costs less than one by one');
  else assert.strictEqual(p.total, total, label + ' total = items × prices');
  if (p.kind === 'num') {
    assert.ok(Number.isInteger(p.answer) && p.answer >= 0, label + ' answer ' + p.answer);
    assert.ok(grade === 'k' || p.answer < 100, label + ': the number pad is for cents');
    assert.ok(p.explain.includes(F.fmt(p.answer, grade)), `${label}: explain shows the answer (${p.explain} / ${p.answer})`);
  }
  if (p.kind === 'choice') assert.ok(p.choices.includes(p.answer), label + ' choices hold the answer');
  if (p.kind === 'coins') {
    assert.ok(p.target > 0 && F.fewest(p.target, p.coinKinds), label + ' coins can make the target');
    assert.ok(F.isRight(p, F.fewest(p.target, p.coinKinds)));
  }
  if (['count', 'collect', 'total', 'two', 'multiply'].includes(p.type)) {
    const ans = p.kind === 'coins' ? p.target : p.kind === 'num' ? p.answer : p.answer;
    assert.strictEqual(String(ans), String(p.kind === 'choice' ? F.fmt(p.total, grade) : p.total), `${label}: answer is the sale total`);
  }
  if (p.type === 'change' && p.kind === 'num') assert.ok(p.answer > 0);
}
const seen = {};
for (const grade of ['k', 'g2']) {
  const tiers = F.tiers(grade);
  for (let ti = 1; ti <= tiers.length; ti++) {
    for (let i = 0; i < 400; i++) {
      const f = F.ensure({ grade });
      f.tier = ti;
      f.xp = 1e6;
      const ids = U.sample(Object.keys(F.ITEMS), U.rnd(1, 6));
      const stock = {};
      ids.forEach((id) => (stock[id] = U.rnd(1, 9)));
      const vip = i % 5 === 0;
      const p = F.customer(f, grade, { stock, vip, jobs: i % 7 === 0 });
      checkProblem(p, grade, stock, `${grade} tier ${ti} ${p && p.type}`);
      seen[grade + ':' + p.type] = (seen[grade + ':' + p.type] || 0) + 1;
      if (p.type !== 'count' || ti === 1 || p.tier) assert.ok(p.tier >= ti, 'tier recorded');
    }
    // every type of the tier comes up with a full basket
    const f = F.ensure({ grade });
    f.tier = ti;
    const full = {};
    Object.keys(F.ITEMS).forEach((id) => (full[id] = 9));
    for (const type of tiers[ti - 1].types) {
      let ok = 0;
      for (let i = 0; i < 60; i++) { const p = F.problem(type, { grade, tier: tiers[ti - 1], stock: full }); if (p) { checkProblem(p, grade, full, `${grade} ${type}`); ok++; } }
      assert.ok(ok > 20, `${grade} tier ${ti}: ${type} works with a full basket (${ok}/60)`);
    }
  }
}
// kindergarten problems stay small at the first tiers
for (let i = 0; i < 300; i++) {
  const f = F.ensure({ grade: 'k' });
  const p = F.customer(f, 'k', { stock: { carrot: 9, egg: 9, strawberry: 9, tomato: 9 } });
  assert.ok(p.total <= 10 && (p.kind !== 'num' || p.answer <= 10), 'K tier 1 within 10: ' + p.text);
}
// nothing to sell: no customer
assert.strictEqual(F.customer(F.ensure({ grade: 'g2' }), 'g2', { stock: {} }), null);
assert.strictEqual(F.customer(F.ensure({ grade: 'g2' }), 'g2', { stock: { egg: 0 } }), null);
// odd jobs always have something
assert.ok(Object.keys(F.jobStock(F.ensure({ grade: 'k' }))).length >= 3);

// ---------- two devices: the farm changed last wins
const S = MQ.store;
const base = () => ({ v: 1, id: 'kid1', grade: 'g2', crystals: 0, xp: 0, rev: 0, eggsHatched: 0, levels: {}, creatures: {}, badges: {}, days: {}, lastPlayed: '', stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {} }, daily: { last: '', streak: 0, best: 0 } });
const played = Object.assign(base(), { rev: 100, farm: Object.assign(F.fresh(), { money: 500, t: 90 }) });
const opened = Object.assign(base(), { rev: 200, farm: Object.assign(F.fresh(), { money: 30, t: 50 }) });
const never = Object.assign(base(), { rev: 300 });
assert.strictEqual(S.mergeProfiles(played, opened).farm.money, 500, 'a farm opened later elsewhere does not replace one played more recently');
assert.strictEqual(S.mergeProfiles(opened, played).farm.money, 500);
assert.strictEqual(S.mergeProfiles(played, never).farm.money, 500, 'a copy without a farm keeps the farm');
const later = Object.assign(base(), { rev: 50, farm: Object.assign(F.fresh(), { money: 7, t: 999 }) });
assert.strictEqual(S.mergeProfiles(played, later).farm.money, 7, 'the farm changed last wins even in an older copy');

// ---------- workshops
{
  const f = F.ensure({ grade: 'g2' });
  f.money = 5000;
  assert.strictEqual(F.buy(f, 'g2', 'work:jamkitchen'), null, 'the jam kitchen opens at level 7');
  f.xp = F.level(1e9).from; // a big farm
  f.xp = 0; for (let L = 1; L < 12; L++) f.xp += F.need(L); // level 12
  assert.strictEqual(F.level(f.xp).level, 12);
  assert.ok(F.buy(f, 'g2', 'work:jamkitchen'));
  assert.strictEqual(F.buy(f, 'g2', 'work:jamkitchen'), null, 'one jam kitchen');
  f.basket = { strawberry: 3 };
  assert.strictEqual(F.canMake(f, 'jamkitchen', 0), false, 'jam needs 4 strawberries');
  f.basket.strawberry = 5;
  assert.ok(F.startMake(f, 'jamkitchen', 0));
  assert.strictEqual(f.basket.strawberry, 1);
  assert.strictEqual(F.canMake(f, 'jamkitchen', 1), false, 'one batch at a time');
  const news = F.nextDay(f);
  assert.deepStrictEqual(news.cooked, ['jam']);
  assert.strictEqual(F.takeMade(f, 'jamkitchen'), 1);
  assert.strictEqual(f.basket.jam, 1);
  assert.strictEqual(f.stats.made, 1);
  f.basket = { milk: 3 };
  F.buy(f, 'g2', 'work:dairy');
  assert.strictEqual(F.canMake(f, 'dairy', 0), false, 'the dairy opens at level 17');
  f.xp = 0; for (let L = 1; L < 20; L++) f.xp += F.need(L);
  assert.ok(F.buy(f, 'g2', 'work:dairy'));
  assert.ok(F.startMake(f, 'dairy', 0));
  F.nextDay(f);
  assert.strictEqual(f.works.dairy.ready, 0, 'cheese takes two nights');
  F.nextDay(f);
  assert.strictEqual(F.takeMade(f, 'dairy'), 1);
  assert.strictEqual(f.basket.cheese, 1);
  const q = F.makeQuestion(F.WORKS.jamkitchen.recipes[0], 'g2');
  assert.strictEqual(q.answer, 40, 'jam $1.20 − 4 strawberries 80¢');
  const qk = F.makeQuestion(F.WORKS.jamkitchen.recipes[0], 'k');
  assert.strictEqual(qk.answer, 2);
}
// ---------- the bank
{
  const f = F.ensure({ grade: 'g2' });
  f.money = 1000;
  assert.strictEqual(F.deposit(f, 2000, '2026-10-01'), false, 'only what is in the wallet');
  assert.ok(F.deposit(f, 435, '2026-10-01'));
  assert.deepStrictEqual([f.money, f.bank.bal, f.bank.since], [565, 435, '2026-10-01']);
  assert.strictEqual(F.interest(435, 'g2'), 40, '10¢ for each of 4 whole dollars');
  assert.strictEqual(F.interest(99, 'g2'), 0);
  assert.strictEqual(F.interest(9000, 'g2'), 500, 'at most $5 a week');
  assert.strictEqual(F.interest(37, 'k'), 3, '1¢ for each of 3 tens');
  assert.strictEqual(F.bankDue(f, '2026-10-07'), 0);
  assert.strictEqual(F.bankDue(f, '2026-10-08'), 1);
  assert.strictEqual(F.nextBankDay(f, '2026-10-05'), 3);
  assert.strictEqual(F.payInterest(f, 'g2', '2026-10-08'), 40);
  assert.deepStrictEqual([f.bank.bal, f.bank.since, f.stats.interest, f.stats.bankDays], [475, '2026-10-08', 40, 1]);
  assert.strictEqual(F.bankDue(f, '2026-10-14'), 0, 'the next bank day is a week later');
  assert.strictEqual(F.bankDue(f, '2027-01-01'), F.BANK_MISSED, 'at most 4 missed weeks are paid');
  assert.strictEqual(F.bankDue(f, '2027-01-01'), F.BANK_MISSED, 'and asking again gives the same');
  assert.ok(F.withdraw(f, 75, '2027-01-01'));
  assert.deepStrictEqual([f.bank.bal, f.money], [400, 640]);
  assert.strictEqual(F.withdraw(f, 401), false);
  assert.deepStrictEqual(F.project(400, 'g2', 3), [400, 440, 480, 520]);
  assert.strictEqual(f.bank.log[0].kind, 'out');
  const empty = F.ensure({ grade: 'k' });
  assert.strictEqual(F.bankDue(empty, '2030-01-01'), 0, 'no savings, no bank day');
  // a farm from the first version gets the workshops and the bank
  const old = { grade: 'g2', farm: F.fresh() };
  delete old.farm.works; delete old.farm.bank; delete old.farm.stats.made;
  old.farm.started = true;
  const up = F.ensure(old);
  assert.deepStrictEqual([up.works, up.bank.bal, up.stats.made], [{}, 0, 0]);
}

// ---------- version 3: 6 beds and 6 pens, upgrades, planting all at once, the farmhand
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  assert.strictEqual(F.BEDS.length, 6);
  assert.strictEqual(F.PENS.length, 6);
  const f = F.ensure({ grade: 'g2' });
  f.xp = lvXp(60);
  f.money = 1e6;
  while (F.buy(f, 'g2', 'bed')) { /* buy every bed */ }
  while (F.buy(f, 'g2', 'pen')) { /* and every pen */ }
  assert.deepStrictEqual([f.beds.length, f.pens.length], [6, 6], 'no more than 6 beds and 6 pens');
  assert.ok(!F.shop(f, 'g2').some((x) => x.id === 'bed' || x.id === 'pen'));
  // bed upgrades: +1 crop per star, a sprinkler, a greenhouse with a second harvest
  const b = f.beds[1];
  F.plant(f, 1, 'corn');
  assert.deepStrictEqual([F.cropYield(b), F.cropDays(b)], [5, 3]);
  for (let k = 0; k < F.BED_UP.length; k++) assert.ok(F.buy(f, 'g2', 'bedup:1'), 'upgrade ' + k);
  assert.ok(F.shopItem(f, 'g2', 'bedup:1').owned, 'all bed upgrades done');
  assert.strictEqual(F.buy(f, 'g2', 'bedup:1'), null);
  assert.deepStrictEqual([b.u, F.bedStars(b), F.cropYield(b), F.cropDays(b), F.bedGlass(b)], [6, 4, 9, 2, true]);
  b.g = 2;
  assert.strictEqual(F.harvest(f, 1), 9);
  assert.deepStrictEqual([b.c, b.g, b.again, b.u], ['corn', 0, true, 6], 'the greenhouse grows the same crop again');
  b.g = 2;
  F.harvest(f, 1);
  assert.deepStrictEqual([b.c, b.again, b.u], [null, false, 6], 'then the bed is empty, and keeps its upgrades');
  const fresh = F.ensure({ grade: 'g2' });
  fresh.xp = lvXp(2);
  fresh.money = 1000;
  assert.strictEqual(F.buy(fresh, 'g2', 'bedup:0'), null, 'good soil opens at level 3');
  // pen upgrades: room for more animals (costs one more animal), then a cozy barn (half of that)
  f.pens[1] = { a: 'cow', g: 9, fed: false, ready: 0 };
  assert.strictEqual(F.shopItem(f, 'g2', 'penup:1').price, 800);
  F.buy(f, 'g2', 'penup:1');
  F.buy(f, 'g2', 'penup:1');
  assert.strictEqual(F.shopItem(f, 'g2', 'penup:1').price, 400);
  F.buy(f, 'g2', 'penup:1');
  assert.deepStrictEqual([F.penCount(f.pens[1]), F.penEat(f.pens[1]), F.penMakes(f.pens[1])], [3, 12, 7]);
  assert.ok(!F.shop(f, 'g2').some((x) => x.id === 'penup:' + f.pens.findIndex((q) => !q.a)), 'empty pens have no upgrades');
  // plant all: one payment for every empty bed
  const g = F.ensure({ grade: 'k' });
  g.xp = lvXp(5);
  g.money = 100;
  g.beds = [{ c: null, g: 0 }, { c: null, g: 0, u: 2 }, { c: 'carrot', g: 0 }];
  assert.deepStrictEqual(F.emptyBeds(g), [0, 1]);
  assert.strictEqual(F.plantAll(g, 'k', 'tomato', 2), true);
  assert.deepStrictEqual([g.money, g.beds[0].c, g.beds[1].c, g.beds[1].u], [90, 'tomato', 'tomato', 2]);
  assert.strictEqual(F.plantAll(g, 'k', 'tomato', 1), false, 'no empty beds left');
  // the farmhand: hired at level 39, paid every night, feeds and collects; picks crops from level 48
  const h = F.ensure({ grade: 'g2' });
  h.money = 5000;
  h.xp = lvXp(38);
  assert.strictEqual(F.buy(h, 'g2', 'helper'), null, 'the farmhand comes at level 39');
  h.xp = lvXp(39);
  assert.ok(F.buy(h, 'g2', 'helper'));
  assert.ok(F.shopItem(h, 'g2', 'helper').owned);
  h.pens[0] = { a: 'chicken', g: 9, fed: false, ready: 0 };
  h.feed = 10;
  h.beds[0] = { c: 'carrot', g: 5 };
  const m0 = h.money;
  let news = F.nextDay(h, 'g2');
  assert.deepStrictEqual(news.helper, { wage: 25, fed: 1, short: 0, collected: 2, picked: 0 });
  assert.deepStrictEqual([h.money, h.basket.egg, h.feed, h.stats.wages], [m0 - 25, 2, 9, 25]);
  h.xp = lvXp(48);
  news = F.nextDay(h, 'g2');
  assert.strictEqual(news.helper.picked, 3, 'from level 48 the farmhand picks ripe carrots too');
  h.money = 10;
  news = F.nextDay(h, 'g2');
  assert.deepStrictEqual(news.helper, { unpaid: true, wage: 25 });
  assert.strictEqual(h.pens[0].fed, false, 'an unpaid farmhand does not feed');
  h.helper.on = false;
  h.money = 1000;
  assert.strictEqual(F.nextDay(h, 'g2').helper, null, 'a farmhand on a break is not paid');
  // a farm from version 2 with 8 beds keeps them all
  const big = F.ensure({ grade: 'g2' });
  big.beds = Array.from({ length: 8 }, () => ({ c: null, g: 0 }));
  big.xp = lvXp(60);
  big.money = 1e6;
  assert.strictEqual(F.buy(big, 'g2', 'bed'), null);
  assert.strictEqual(big.beds.length, 8);
}

// ---------- the grown-up preview shows a level-60 farm with everything open
for (const g of ['k', 'g2']) {
  const st = { grade: g, farm: F.fresh() };
  const fm = F.showcase(st);
  assert.strictEqual(F.level(fm.xp).level, 60);
  assert.strictEqual(fm.tier, F.tiers(g).length);
  assert.ok(Object.keys(F.DECOR).every((id) => fm.owned[id]) && Object.keys(F.WORKS).every((id) => fm.works[id]));
  assert.ok(fm.beds.some((b) => F.cropStage(b) === 'ready') && fm.beds.some((b) => F.cropStage(b) === 'seed'));
  assert.ok(F.bankDue(fm) > 0, 'a bank day is waiting');
  assert.ok(!F.shop(fm, g).some((x) => x.locked && !x.owned), 'nothing in the shop is locked (decorations after level 60 are already on the farm)');
  assert.ok(F.customer(fm, g, { stock: fm.basket }), 'customers come');
}

console.log('farm tests passed ·', Object.entries(seen).map(([k, v]) => k + ' ' + v).join(', '));
