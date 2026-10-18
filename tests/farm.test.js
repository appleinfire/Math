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
assert.strictEqual(F.buy(fm, 'g2', 'feed:50'), null, 'the big feed pack opens at level 6');
assert.deepStrictEqual(F.shop(fm, 'g2').filter((x) => x.id.startsWith('feed:')).map((x) => [x.id, x.price, x.locked]), [['feed:5', 25, false], ['feed:20', 100, false], ['feed:50', 250, true], ['feed:100', 500, true]]);
assert.ok(F.buy(fm, 'g2', 'decor:fence'));
assert.strictEqual(F.buy(fm, 'g2', 'decor:fence'), null, 'one fence is enough');
fm.goal = 'decor:tractor';
assert.strictEqual(F.goalItem(fm, 'g2').price, 4000);
fm.money = 0;
assert.strictEqual(F.buy(fm, 'g2', 'feed:5'), null, 'no money, no feed');
assert.strictEqual(fm.stats.spent, 60 + 50 + 100 + 100 + 15);

// ---------- the market truck at the stand: wholesale prices, no tip, the pile is gone
{
  for (const g of ['k', 'g2']) for (const id of Object.keys(F.ITEMS)) {
    const w = F.wholesale(id, g), p = F.price(id, g);
    assert.ok(w >= 1 && (w < p || p === 1), `${id} (${g}): wholesale ${w} is less than ${p}`);
    if (g === 'g2') assert.strictEqual(w % 5, 0, `${id}: wholesale is a multiple of 5¢`);
  }
  assert.deepStrictEqual([F.wholesale('egg', 'g2'), F.wholesale('tomato', 'g2'), F.wholesale('egg', 'k')], [5, 10, 1]);
  assert.strictEqual(F.truckLoad({ egg: 9, tomato: 9 }, 'g2', F.tiers('g2')[3]), null, 'no pile of 10');
  assert.deepStrictEqual(F.truckLoad({ egg: 30, tomato: 12 }, 'g2', F.tiers('g2')[3]), { id: 'egg', q: 30, each: 5, total: 150 });
  assert.deepStrictEqual(F.truckLoad({ egg: 30 }, 'k', F.tiers('k')[0]), { id: 'egg', q: 10, each: 1, total: 10 }, 'kindergarten: as many as fit in 10¢');
  const f = F.ensure({ grade: 'g2' });
  f.xp = 1e6; f.tier = 4; f.stand = 6; f.basket = { egg: 30, milk: 3 };
  const p = F.customer(f, 'g2', { stock: f.basket, truck: true });
  const m0 = f.money, r = F.serve(f, 'g2', p, true, true);
  assert.deepStrictEqual([p.truck, r.paid, r.tip, f.money - m0, f.basket], [true, 150, 0, 150, { milk: 3 }]);
  assert.ok(!F.customer(f, 'g2', { stock: f.basket, truck: true }).truck, 'no pile left: a regular customer');
}

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
    total += n * (p.truck ? F.wholesale(id, grade) : F.price(id, grade));
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
  if (['count', 'collect', 'total', 'two', 'multiply', 'truck'].includes(p.type)) {
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
    // the market truck: a whole pile of one thing at the wholesale price, within the tier's money range
    for (let i = 0; i < 300; i++) {
      const f = F.ensure({ grade });
      f.tier = ti;
      f.xp = 1e6;
      const stock = {};
      U.sample(Object.keys(F.ITEMS), U.rnd(1, 8)).forEach((id) => (stock[id] = U.rnd(1, 60)));
      const p = F.customer(f, grade, { stock, truck: true });
      const load = F.truckLoad(stock, grade, tiers[ti - 1]);
      if (!load) { assert.ok(!p.truck, 'no pile, no truck'); continue; }
      checkProblem(p, grade, stock, `${grade} tier ${ti} truck`);
      const [[id, q]] = Object.entries(p.sale);
      assert.ok(p.truck && p.who === F.TRUCK && q >= F.TRUCK_MIN && p.total <= F.truckCap(grade, tiers[ti - 1]), `${grade} tier ${ti}: a truck load ${id} ${q} for ${p.total}`);
      assert.ok(Object.entries(stock).every(([x, n]) => Math.min(n, Math.floor(F.truckCap(grade, tiers[ti - 1]) / F.wholesale(x, grade))) <= q || n < F.TRUCK_MIN), 'the truck takes the biggest pile it can');
      seen[grade + ':truck'] = (seen[grade + ':truck'] || 0) + 1;
      assert.ok(!F.customer(f, grade, { stock, truck: true, vip: true }).truck && !F.customer(f, grade, { stock, truck: true, jobs: true }).truck, 'a challenge customer or odd job is never the truck');
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
// ---------- the bank: every 7th farm day is bank day; interest on what is saved that morning
{
  const f = F.ensure({ grade: 'g2' });
  f.money = 1000;
  f.pens = [];
  f.beds = [];
  assert.strictEqual(F.deposit(f, 2000), false, 'only what is in the wallet');
  assert.ok(F.deposit(f, 435));
  assert.deepStrictEqual([f.money, f.bank.bal], [565, 435]);
  assert.strictEqual(F.interest(435, 'g2'), 40, '10¢ for each of 4 whole dollars');
  assert.strictEqual(F.interest(99, 'g2'), 0);
  assert.strictEqual(F.interest(5000, 'g2'), 500, '10¢ for each of the first 50 dollars');
  assert.strictEqual(F.interest(9099, 'g2'), 540, 'above $50 (Piggy account) only 1¢ for each whole dollar: $5 + 40¢');
  assert.deepStrictEqual(F.interestParts(12345, 'g2', 1), { top: 10000, per: 100, add: 10, big: 100, small: 23, x: 1023 }, 'Silver account: $10 on the first $100, 23¢ on $23.45');
  assert.strictEqual(F.interest(37, 'k'), 3, '1¢ for each of 3 tens');
  assert.strictEqual(F.interest(799, 'k'), 52, 'kindergarten: 50¢ on the first 500¢, then 1¢ for each 100¢ (2 of them)');
  assert.strictEqual(F.interest(799, 'k', 1), 79, 'kindergarten Silver account: 1¢ for each ten up to 1000¢');
  // the small rate keeps big savings growing, but slowly: never as fast as the big rate
  for (const g of ['k', 'g2']) for (let a = 0; a < F.ACCOUNTS.length; a++) {
    const top = F.bankTop(a, g);
    assert.strictEqual(F.interest(top, g, a), top / 10, `${g} account ${a}: 10% up to the limit`);
    assert.strictEqual(F.interest(top * 3, g, a) - F.interest(top, g, a), Math.floor((top * 2) / 100), `${g} account ${a}: 1% above it`);
  }
  assert.deepStrictEqual(F.bankWeek(1), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepStrictEqual(F.bankWeek(7), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepStrictEqual(F.bankWeek(8), [8, 9, 10, 11, 12, 13, 14]);
  assert.deepStrictEqual([F.nightsToBankDay(1), F.nightsToBankDay(6), F.nightsToBankDay(7), F.nightsToBankDay(13)], [6, 1, 7, 1]);
  let bankDays = 0;
  for (let d = f.day; d < 7; d++) if (F.nextDay(f, 'g2').bankDay) bankDays++;
  assert.deepStrictEqual([f.day, bankDays, F.bankDue(f)], [7, 1, 1], 'farm day 7 is bank day');
  assert.ok(F.deposit(f, 100), 'money saved after the morning');
  const paid = F.payInterest(f, 'g2');
  assert.deepStrictEqual(paid, { day: 7, bal: 435, x: 40 }, 'interest on what was saved in the morning');
  assert.deepStrictEqual([f.bank.bal, F.bankDue(f), f.stats.interest, f.stats.bankDays], [575, 0, 40, 1]);
  assert.deepStrictEqual(f.bank.log[0], { day: 7, kind: 'interest', amt: 40 });
  assert.strictEqual(F.payInterest(f, 'g2'), null, 'nothing more to pay');
  // missed bank days wait (at most 4), each with interest on interest
  for (let i = 0; i < 7 * 6; i++) F.nextDay(f, 'g2');
  assert.deepStrictEqual([f.day, F.bankDue(f)], [49, F.BANK_MISSED]);
  assert.deepStrictEqual(f.bank.pend.map((x) => x.day), [14, 21, 28, 35], 'the first 4 missed bank days wait; later ones are skipped');
  const xs = [];
  while (F.bankDue(f)) xs.push(F.payInterest(f, 'g2').x);
  assert.deepStrictEqual(xs, [50, 60, 60, 70], 'interest earns interest: 575 → 625 → 685 → 745 → 815');
  assert.strictEqual(f.bank.bal, 815);
  assert.ok(F.withdraw(f, 115));
  assert.deepStrictEqual([f.bank.bal, f.bank.log[0].kind], [700, 'out']);
  assert.strictEqual(F.withdraw(f, 701), false);
  // all-time summary: saved 435 + 100, took out 115, interest 40 + 50 + 60 + 60 + 70; the rest of the bank is own money
  assert.deepStrictEqual(F.bankSummary(f), { saved: 535, tookOut: 115, interest: 280, days: 5, bal: 700, own: 420, fromInterest: 280, built: 0, dreamIn: 0, depBonus: 0, locked: 0 });
  assert.strictEqual(f.stats.saved - f.stats.tookOut + f.stats.interest, f.bank.bal, 'the totals add up to what is in the bank');
  F.withdraw(f, 600);
  assert.deepStrictEqual([F.bankSummary(f).own, F.bankSummary(f).fromInterest], [0, 100], 'taking money out uses your own money first');
  assert.deepStrictEqual(F.project(400, 'g2', 3), [400, 440, 480, 520]);
  const empty = F.ensure({ grade: 'k' });
  for (let i = 0; i < 7; i++) F.nextDay(empty, 'k');
  assert.strictEqual(F.bankDue(empty), 0, 'no savings, no bank day');
  // a bank from the calendar-week version gets bank days by farm days
  const cal = { grade: 'g2', farm: Object.assign(F.fresh(), { started: true, bank: { bal: 300, since: '2026-10-01', log: [{ d: '2026-10-01', kind: 'in', amt: 300 }] } }) };
  const up2 = F.ensure(cal);
  assert.deepStrictEqual([up2.bank.bal, up2.bank.pend, 'since' in up2.bank, up2.bank.log.length, up2.bank.acct], [300, [], false, 1, 0]);
  // a bank from before the all-time totals: what is in the bank and is not interest was saved
  const pre = { grade: 'g2', farm: Object.assign(F.fresh(), { started: true, bank: { bal: 900, acct: 0, log: [], pend: [] } }) };
  delete pre.farm.stats.saved; delete pre.farm.stats.tookOut;
  pre.farm.stats.interest = 150;
  assert.deepStrictEqual([F.ensure(pre).stats.saved, pre.farm.stats.tookOut], [750, 0]);
  // a farm from the first version gets the workshops and the bank
  const old = { grade: 'g2', farm: F.fresh() };
  delete old.farm.works; delete old.farm.bank; delete old.farm.stats.made;
  old.farm.started = true;
  const up = F.ensure(old);
  assert.deepStrictEqual([up.works, up.bank.bal, up.stats.made], [{}, 0, 0]);
}

// ---------- bank accounts: bought like an upgrade, each one raises how much earns the big interest
{
  const st2 = { grade: 'g2' }, f = F.ensure(st2);
  assert.strictEqual(F.account(f).name, 'Piggy account');
  const lvXp = (L) => { let xp = 0; for (let i = 1; i < L; i++) xp += F.need(i); return xp; };
  f.xp = lvXp(17);
  f.money = 100000;
  assert.ok(F.shopItem(f, 'g2', 'acct').locked, 'Silver account opens at level 18');
  assert.strictEqual(F.buy(f, 'g2', 'acct'), null);
  f.xp = lvXp(18);
  const before = f.money, x = F.buy(f, 'g2', 'acct');
  assert.ok(x && x.name === 'Bank: Silver account' && f.bank.acct === 1 && f.money === before - 3000);
  assert.strictEqual(F.shopItem(f, 'g2', 'acct').name, 'Bank: Gold account', 'the next account is in the shop');
  f.bank.bal = 12000;
  for (let d = f.day; !F.isBankDay(d); d++) F.nextDay(f, 'g2');
  assert.deepStrictEqual(F.payInterest(f, 'g2').x, 1000 + 20, 'Silver: $10 on the first $100 + 20¢ on $20');
  f.xp = lvXp(60);
  while (F.shopItem(f, 'g2', 'acct')) assert.ok(F.buy(f, 'g2', 'acct'));
  assert.strictEqual(F.account(f).name, 'Royal vault');
  // every account pays for itself in under 15 bank weeks when the savings fill it (2nd grade)
  for (let a = 1; a < F.ACCOUNTS.length; a++) {
    const top = F.ACCOUNTS[a].top[1], gain = F.interest(top, 'g2', a) - F.interest(top, 'g2', a - 1);
    assert.ok(F.ACCOUNTS[a].cost[1] / gain < 15, `${F.ACCOUNTS[a].name} pays for itself`);
    assert.ok(F.ACCOUNTS[a].cost[0] <= 99 && F.ACCOUNTS[a].lv > F.ACCOUNTS[a - 1].lv);
  }
  assert.ok(F.unlocksAt(18, 'g2').some((u) => /Silver account/.test(u.name)));
  // the grown-up preview shows savings above the account limit (both parts of the interest)
  const sc = F.showcase({ grade: 'g2', farm: JSON.parse(JSON.stringify(F.fresh())) });
  assert.ok(sc.bank.bal > F.bankTop(sc.bank.acct, 'g2'));
  for (const g of ['k', 'g2']) {
    const x = F.showcase({ grade: g, farm: JSON.parse(JSON.stringify(F.fresh())) });
    assert.strictEqual(x.stats.saved - x.stats.tookOut + x.stats.interest, x.bank.bal, g + ': the preview bank totals add up');
  }
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
  // selling a pen to Rosa: half of the shop price for every animal and for the barn; the pen is new again
  f.pens[1].ready = 4;
  assert.deepStrictEqual(F.resale(f.pens[1], 'g2'), { cost: 800, each: 400, n: 3, barn: 200, total: 1400 });
  const sm = f.money, milk = f.basket.milk || 0;
  assert.strictEqual(F.sellPen(f, 'g2', 1), 1400);
  assert.deepStrictEqual([f.money - sm, f.basket.milk - milk, f.pens[1]], [1400, 4, { a: null, g: 0, fed: false, ready: 0 }], 'paid, collected first, empty pen');
  assert.strictEqual(F.sellPen(f, 'g2', 1), 0, 'an empty pen sells for nothing');
  assert.strictEqual(F.shopItem(f, 'g2', 'penup:1'), null, 'its upgrades are gone');
  assert.ok(F.buy(f, 'g2', 'animal:unicorn'), 'a new kind in the empty pen');
  assert.deepStrictEqual([f.pens[1].a, f.pens[1].u, F.shopItem(f, 'g2', 'penup:1').price], ['unicorn', undefined, 12000]);
  f.pens.forEach((q, i) => { if (!q.a) f.pens[i] = { a: 'chicken', g: 0, fed: false, ready: 0 }; });
  assert.strictEqual(F.shopItem(f, 'g2', 'animal:cow').blocked, 'Sell animals to free a pen', 'all pens full: sell to make room');
  // kindergarten prices are odd: Rosa rounds up, never pays more than the shop price
  for (const g of ['k', 'g2']) for (const [id, an] of Object.entries(F.ANIMALS)) for (let u = 0; u <= 3; u++) {
    const r = F.resale({ a: id, u }, g), paid = an.cost[g === 'k' ? 0 : 1] * (1 + Math.min(u, 2)) + (u >= 3 ? F.upCost('pen', 2, g, id) : 0);
    assert.ok(r.total > 0 && r.total < paid, `${id} u${u} (${g}) sells for less than it cost`);
    assert.ok(r.total * 2 <= paid + 4, `${id} u${u} (${g}) sells for about half`);
    const q = F.sellQuestion({ a: id, u }, g);
    assert.ok(q.text && q.hint && q.explain && q.who, `${id} sell question`);
    if (q.kind === 'num') assert.strictEqual(q.answer, r.total);
    else { assert.strictEqual(q.answer, F.fmt(r.total, g)); assert.ok(q.choices.includes(q.answer) && new Set(q.choices).size === q.choices.length); }
    assert.ok(F.isRight(q, q.kind === 'num' ? String(q.answer) : q.answer));
  }
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
  assert.deepStrictEqual(news.helper, { wage: 25, fed: 1, houses: 0, short: 0, collected: 2, picked: 0 });
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

// ---------- Big Dreams: buildings paid from the bank, built overnight, earning money every bank day
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  // a good farm at level L: the best crop in every open bed (half the bed upgrades), the best animals in the open pens
  const perDay = (L, g) => {
    const gi = g === 'k' ? 0 : 1, beds = F.BEDS.filter((b) => b[0] <= L).length, pens = F.PENS.filter((p) => p[0] <= L).length;
    const bed = { u: Math.floor(F.BED_UP.filter((u) => u.lv <= L).length / 2) };
    let best = 0;
    for (const [id, c] of Object.entries(F.CROPS)) if (c.lv <= L) { bed.c = id; best = Math.max(best, (F.cropYield(bed) * F.price(id, g) - c.seed[gi]) / F.cropDays(bed)); }
    const room = 1 + F.PEN_UP.filter((x, i) => i < 2 && x.lv <= L).length;
    const animals = Object.values(F.ANIMALS).filter((a) => a.lv <= L).map((a) => (a.per * F.price(a.item, g) - a.eat * F.FEED.price[gi]) * room).sort((a, b) => b - a);
    return beds * best + U.sum(animals.slice(0, pens));
  };
  for (const g of ['k', 'g2']) {
    const gi = g === 'k' ? 0 : 1;
    let lastTotal = 0;
    F.DREAMS.forEach((d, k) => {
      const costs = d.stages.map((x) => x.cost[gi]), total = U.sum(costs);
      assert.ok(costs.every((c, i) => !i || c > costs[i - 1]), `${d.id} (${g}): each stage costs more than the one before`);
      assert.ok(total > lastTotal * 2, `${d.id} (${g}): each dream is much bigger than the one before`);
      lastTotal = total;
      for (const x of d.stages) {
        const pay = x.pay[gi], c = x.cost[gi];
        if (d.castle) { assert.strictEqual(pay, 0, 'the castle earns nothing'); continue; }
        // it earns more than the bank's big interest on the same money, and pays for itself in 7–10 bank weeks
        assert.ok(pay > F.interest(c, g, F.ACCOUNTS.length - 1), `${d.id} ${x.name} (${g}) beats the bank`);
        assert.ok(F.payback(c, pay) >= 7 && F.payback(c, pay) <= 10, `${d.id} ${x.name} (${g}) pays back in ${F.payback(c, pay)} bank weeks`);
      }
    });
    // the first stage is a few farm days of a level-13 farm; the whole orchard a few bank weeks
    const o = F.DREAMS[0].stages.map((x) => x.cost[gi]), day13 = perDay(13, g);
    assert.ok(o[0] / day13 >= 1.5 && o[0] / day13 <= 5, `${g}: the first stage takes ${(o[0] / day13).toFixed(1)} farm days at level 13`);
    assert.ok(U.sum(o) / (7 * day13) >= 1 && U.sum(o) / (7 * day13) <= 4, `${g}: the orchard takes ${(U.sum(o) / (7 * day13)).toFixed(1)} bank weeks`);
  }
  // a farm from before Big Dreams gets them
  const old = { grade: 'g2', farm: Object.assign(F.fresh(), { started: true }) };
  delete old.farm.dream; delete old.farm.stats.built; delete old.farm.stats.dreamIn;
  const up = F.ensure(old);
  assert.deepStrictEqual([up.dream, up.stats.built, up.stats.dreamIn], [{ p: 0, s: 0, b: false, seen: false }, 0, 0]);
  // they open with the bank; the builders are paid only from the bank, one stage at a time
  const f = F.ensure({ grade: 'g2' });
  f.xp = lvXp(9);
  assert.ok(!F.dreamOpen(f));
  f.xp = lvXp(13);
  f.money = 9000;
  assert.ok(F.dreamOpen(f) && !F.canBuild(f, 'g2') && F.payBuilders(f, 'g2') === null, 'money in the wallet does not pay the builders');
  F.deposit(f, 3000);
  const paid = F.payBuilders(f, 'g2');
  assert.ok(paid && paid.st.name === 'Apple trees' && f.bank.bal === 500 && f.dream.b && f.stats.built === 2500);
  assert.strictEqual(F.payBuilders(f, 'g2'), null, 'one stage a night');
  assert.deepStrictEqual(F.dreamIncome(f, 'g2'), [], 'nothing earns before it is built');
  f.day = 5;
  let news = F.nextDay(f, 'g2');
  assert.deepStrictEqual([news.built.st.name, news.built.done, f.dream.s, f.dream.b], ['Apple trees', false, 1, false], 'built overnight');
  assert.deepStrictEqual(F.dreamIncome(f, 'g2'), [['🍎', 'Fruit Orchard', 300]]);
  // bank day: interest first, then what the buildings earned, both into the bank
  news = F.nextDay(f, 'g2');
  assert.ok(news.bankDay && f.day === 7);
  assert.deepStrictEqual(f.bank.pend, [{ day: 7, bal: 500, inc: [['🍎', 'Fruit Orchard', 300]] }]);
  assert.strictEqual(F.payIncome(f), null, 'interest comes first');
  assert.strictEqual(F.payInterest(f, 'g2').x, 50);
  assert.ok(f.bank.pend[0].paid && F.bankDue(f) === 1);
  assert.deepStrictEqual(F.payIncome(f), { day: 7, x: 300, inc: [['🍎', 'Fruit Orchard', 300]] });
  assert.deepStrictEqual([f.bank.bal, F.bankDue(f), f.stats.dreamIn, f.bank.log[0].kind], [850, 0, 300, 'dream']);
  const totals = (x) => x.stats.saved - x.stats.tookOut + x.stats.interest + x.stats.dreamIn - x.stats.built;
  assert.strictEqual(totals(f), f.bank.bal, 'the bank totals add up with the builders and the buildings');
  // an empty bank still gets the buildings' money on bank day; missed bank days each bring it (with interest on it)
  F.withdraw(f, 850);
  for (let d = 0; d < 14; d++) F.nextDay(f, 'g2');
  assert.deepStrictEqual(f.bank.pend.map((x) => [x.day, x.bal, F.incomeOf(x)]), [[14, 0, 300], [21, 300, 300]]);
  while (F.bankDue(f)) { F.payInterest(f, 'g2'); F.payIncome(f); }
  assert.deepStrictEqual([f.bank.bal, totals(f)], [630, 630], '300 + 300 + 30¢ interest on the first 300');
  // finishing the last stage moves to the next dream; the castle comes last; every dream built
  f.bank.bal = 1e7;
  const names = [];
  while (!F.dreamDone(f)) { const x = F.payBuilders(f, 'g2'); assert.ok(x); const n = F.buildOvernight(f); if (n.done) names.push(n.d.id); }
  assert.deepStrictEqual(names, ['orchard', 'cottage', 'railway', 'castle']);
  assert.strictEqual(F.dreamNext(f, 'g2'), null);
  assert.strictEqual(U.sum(F.dreamIncome(f, 'g2').map((x) => x[2])), U.sum(F.DREAMS.flatMap((d) => d.stages.map((x) => x.pay[1]))));
  // the grown-up preview has two dreams built and the railway half done
  const sc = F.showcase({ grade: 'g2', farm: F.fresh() });
  assert.deepStrictEqual([sc.dream.p, sc.dream.s, F.dreamIncome(sc, 'g2').length], [2, 2, 3]);
}

// ---------- the traveling merchant: every 3rd bank week; two week charms every visit, a rare treasure every 2nd visit
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  // rare treasures stay for good, so they are expensive: 3 to 5 bank weeks of what a good farm makes at their level
  for (const [id, t] of Object.entries(F.TREASURES)) {
    assert.ok(t.cost[0] <= 99, `${id}: kindergarten pays it with coins`);
    const weeks = t.cost[1] / (7 * F.goodDay(t.lv, 'g2').total);
    assert.ok(weeks >= 3 && weeks <= 5, `${id}: ${weeks.toFixed(2)} bank weeks of saving at level ${t.lv}`);
    assert.ok(F.treasureNote(id, 'g2', (c) => F.fmt(c, 'g2')).length > 20 && F.treasureNote(id, 'k', (c) => F.fmt(c, 'k')).length > 20);
  }
  // mythic things are worth 3 to 4 times the usual thing (both grades)
  for (const [a, M] of Object.entries(F.MYTHS)) {
    const it = F.ITEMS[M.item], was = F.ITEMS[F.ANIMALS[a].item];
    assert.ok(it && it.myth && M.name && M.many, a + ': a mythic form and thing');
    for (const g of [0, 1]) assert.ok(it.price[g] >= 3 * was.price[g] && it.price[g] <= 4 * was.price[g], `${a}: ${M.item} is worth 3–4 × ${F.ANIMALS[a].item}`);
  }
  assert.ok(F.ie('fleece').includes('my-gold') && F.ie('wool') === '🧶', 'mythic things glow on the screens');
  // a charm costs about a third of what it brings in its week (kindergarten: coins, 5¢ steps, at most 99¢)
  for (const g of ['k', 'g2']) for (const L of [10, 13, 20, 30, 45, 60]) {
    const x = F.ensure({ grade: g });
    x.xp = lvXp(L);
    x.pens = [{ a: 'sheep', g: 9, u: 1 }, { a: 'pig', g: 9, u: 2 }];
    for (const [id, a] of [['clover'], ['sun'], ['piggy'], ['myth', 'sheep'], ['myth', 'pig']]) {
      const cost = F.charmCost(id, x, g, a), gain = F.charmGain(id, x, g, a);
      assert.ok(cost > 0 && gain / cost >= 2.5, `${g} L${L} ${id} ${a || ''}: brings ${gain} for ${cost}`);
      if (g === 'k') assert.ok(cost <= 99 && cost % 5 === 0, `${g} ${id}: coins`);
      else assert.ok(cost % 100 === 0 && (cost === 100 || gain / cost <= 3.5), `${g} L${L} ${id}: whole dollars, about a third (${gain} for ${cost})`);
    }
  }
  const f = F.ensure({ grade: 'g2' });
  f.xp = lvXp(13);
  f.money = 100000;
  f.feed = 1000;
  f.pens = [{ a: 'sheep', g: 9, fed: false, ready: 0, u: 1 }, { a: 'chicken', g: 9, fed: false, ready: 0 }];
  const feedAll = () => f.pens.forEach((p, i) => F.feed(f, i));
  const visits = (n) => { const out = []; for (let d = 0; d < n; d++) { feedAll(); const x = F.nextDay(f, 'g2').merchant; if (x) out.push([f.day, x[0], x[1].n, x[1].item, x[1].charms.join('+'), x[1].a]); } return out; };
  assert.deepStrictEqual(visits(30), [], 'no merchant before the first Big Dream stage is built');
  f.day = 1;
  f.dream.s = 1;
  // weeks 3, 6, 9 (farm days 15–21, 36–42, 57–63): visit 1 with the Golden Goose, visit 2 without a treasure, visit 3
  // with the goose again (not bought); Mythic Feed for the sheep (they bring the most), then for the chickens
  assert.deepStrictEqual(visits(56), [[15, 'came', 1, 'goose', 'myth+clover', 'sheep'], [21, 'last', 1, 'goose', 'myth+clover', 'sheep'], [22, 'left', 1, 'goose', 'myth+clover', 'sheep'],
    [36, 'came', 2, null, 'sun+piggy', null], [42, 'last', 2, null, 'sun+piggy', null], [43, 'left', 2, null, 'sun+piggy', null], [57, 'came', 3, 'goose', 'myth+sun', 'chicken']]);
  const m = F.merchantHere(f);
  assert.deepStrictEqual([F.merchantNow(f), F.merchantWares(f).charms, F.merchantNights(f.day), F.merchantNext(f), F.merchantNext(f, true)], ['goose', ['myth', 'sun'], 6, 78, 99], 'next visit week 12 (day 78), the next treasure visit week 15 (day 99)');
  assert.ok(m.cost.myth >= 100 && m.cost.sun >= 100 && m.cost.myth === F.charmCost('myth', f, 'g2', 'chicken'));
  // buying: not enough money, then a charm, then the treasure
  const money = f.money;
  f.money = m.cost.myth - 1;
  assert.strictEqual(F.buyCharm(f, 'g2', 'myth'), null, 'not enough in the wallet');
  assert.strictEqual(F.buyCharm(f, 'g2', 'clover'), null, 'he doesn’t have it this time');
  f.money = money;
  const myth = F.buyCharm(f, 'g2', 'myth');
  assert.deepStrictEqual([myth.id, myth.a, f.money, f.charms.myth.until, F.merchantWares(f).charms, f.stats.charms], ['myth', 'chicken', money - m.cost.myth, 64, ['sun'], 1]);
  assert.strictEqual(F.buyCharm(f, 'g2', 'myth'), null, 'one of each on a visit');
  assert.ok(F.buyTreasure(f, 'g2') && f.treasure.goose && F.merchantNow(f) === null && F.merchantHas(f), 'the treasure is bought, the Sunshine Potion is still for sale');
  // a Mythic Feed week: the chickens are Firebird Hens and lay golden eggs; the sheep still give wool
  f.pens.forEach((p, i) => F.collect(f, i));
  f.basket = {};
  f.pens[1].ready = 2; // eggs from before the week, not collected yet
  let news = F.nextDay(f, 'g2'); // a hungry night: nothing made
  assert.ok(F.mythOn(f, 'chicken') && !F.mythOn(f, 'sheep'));
  feedAll();
  news = F.nextDay(f, 'g2');
  assert.deepStrictEqual(news.made, [['wool', 2], ['goldegg', 2]]);
  assert.deepStrictEqual([f.pens[1].rare, f.pens[1].ready, F.penReady(f.pens[1]), F.penLoot(f.pens[1])], [2, 2, 4, [['goldegg', 2], ['egg', 2]]], 'eggs from before the week and golden eggs');
  assert.strictEqual(F.collect(f, 1), 4);
  assert.deepStrictEqual([f.basket.goldegg, f.basket.egg, f.charms.myth.gain], [2, 2, 2 * (50 - 15)]);
  for (let d = 0; d < 4; d++) { feedAll(); F.nextDay(f, 'g2'); }
  assert.strictEqual(f.day, 63);
  feedAll();
  news = F.nextDay(f, 'g2'); // night 7: the last mythic night, then it is over in the morning
  assert.deepStrictEqual(news.charmEnd, [{ id: 'myth', a: 'chicken', cost: m.cost.myth, got: 6 * 2 * 35 }]);
  assert.ok(!f.charms.myth && !F.mythOn(f, 'chicken') && f.stats.charmGain === 420 && f.stats.charmWins === (420 > m.cost.myth ? 1 : 0));
  assert.deepStrictEqual(news.merchant, ['left', m], 'he left with the Sunshine Potion');
  // every charm works: Lucky Clover tips, Sunshine Potion harvests, Golden Piggy interest
  const t = F.ensure({ grade: 'g2' });
  t.day = 3;
  assert.strictEqual(F.tip(t, 1000), 0, 'no tips on the wooden table');
  t.charms.clover = { cost: 100, until: 10, gain: 0 };
  assert.strictEqual(F.tip(t, 1000), 200, 'the Lucky Clover: 20% even on the wooden table');
  t.treasure.musician = true;
  t.stand = 2;
  assert.deepStrictEqual([F.tip(t, 1000), F.tip(t, 1000, false)], [400, 200], 'market tent 10% + musician 10% + clover 20%');
  t.basket = { carrot: 5 };
  const r = F.serve(t, 'g2', { sale: { carrot: 2 }, total: 1000, tier: 1 }, true, true);
  assert.deepStrictEqual([r.tip, r.clover, t.charms.clover.gain], [400, 200, 200]);
  t.charms.sun = { cost: 300, until: 10, gain: 0 };
  t.beds[0] = { c: 'carrot', g: 1 };
  assert.deepStrictEqual([F.cropYield(t.beds[0], t), F.harvest(t, 0), t.charms.sun.extra, F.charmGot(t.charms.sun, 'g2')], [6, 6, { carrot: 3 }, 30], 'twice the crops');
  t.day = 9;
  news = F.nextDay(t, 'g2');
  assert.deepStrictEqual(news.charmEnd, [{ id: 'clover', a: undefined, cost: 100, got: 200 }, { id: 'sun', a: undefined, cost: 300, got: 30 }]);
  assert.deepStrictEqual([F.tip(t, 1000), F.cropYield({ c: 'carrot', g: 1 }, t), t.stats.charmWins], [200, 3, 1], 'over: back to normal; the clover paid for itself, the potion didn’t');
  // the Golden Piggy: bought before bank day, the bank pays that bank day's interest twice
  const pg = F.ensure({ grade: 'g2' });
  pg.money = 3000;
  F.deposit(pg, 2000);
  pg.day = 4;
  pg.merchant = { week: 1, n: 2, item: null, charms: ['sun', 'piggy'], a: null, cost: { sun: 300, piggy: 200 }, got: {} };
  assert.ok(F.buyCharm(pg, 'g2', 'piggy') && F.piggyWaiting(pg) && pg.charms.piggy.cost === 200);
  while (pg.day < 7) F.nextDay(pg, 'g2');
  assert.ok(pg.bank.pend[0].piggy && !pg.charms.piggy, 'bank day: the piggy waits with the interest');
  const paid = F.payInterest(pg, 'g2');
  assert.deepStrictEqual([paid.x, paid.bonus, paid.cost, pg.bank.bal, pg.bank.log[0].kind, pg.stats.charmGain], [200, 200, 200, 2400, 'piggy', 200]);
  const ps = pg.stats;
  assert.strictEqual(ps.saved - ps.tookOut + ps.interest + ps.dreamIn - ps.built + ps.depBonus, pg.bank.bal, 'the bank totals add up with the piggy');
  // bought on bank day itself, before collecting: that day's interest doubles
  pg.day = 14;
  pg.bank.pend = [{ day: 14, bal: 2400 }];
  pg.merchant = { week: 2, n: 2, item: null, charms: ['piggy'], a: null, cost: { piggy: 200 }, got: {} };
  F.buyCharm(pg, 'g2', 'piggy');
  assert.ok(pg.bank.pend[0].piggy && !pg.charms.piggy && F.payInterest(pg, 'g2').bonus === 240);
  // the treasures: Golden Goose $2.50 every morning, the Feed Fairy feeds two pens, rainbow wool
  const tr = F.ensure({ grade: 'g2' });
  tr.pens = [{ a: 'chicken', g: 5, fed: false, ready: 0 }, { a: 'goat', g: 5, fed: false, ready: 0 }, { a: 'cow', g: 5, fed: false, ready: 0 }];
  Object.assign(tr.treasure, { goose: true, fairy: true, sheep: true });
  const feed = tr.feed, cash = tr.money;
  news = F.nextDay(tr, 'g2');
  assert.deepStrictEqual([news.fairy, tr.feed, news.hungry, tr.money - cash, news.rainbow, tr.basket.rainbow], [['chicken', 'goat'], feed, ['cow'], 250, 1, 1]);
  // the saving goal can be a rare treasure: he brings that one next, and buying it clears the goal
  const gl = F.ensure({ grade: 'g2' });
  gl.xp = lvXp(13);
  gl.goal = 'treasure:musician';
  assert.deepStrictEqual([F.goalItem(gl, 'g2').price, F.goalItem(gl, 'g2').treasure, F.nextTreasure(gl)], [20000, 'musician', 'musician']);
  gl.goal = 'treasure:sheep';
  assert.strictEqual(F.nextTreasure(gl), 'goose', 'a treasure above the farm level waits');
  // he keeps coming once every treasure is bought, with charms; Mythic Feed only for animals on the farm
  const all = F.ensure({ grade: 'g2' });
  all.xp = lvXp(20);
  all.dream.s = 1;
  Object.keys(F.TREASURES).forEach((id) => (all.treasure[id] = true));
  all.pens = [{ a: 'fishpond', g: 9 }];
  all.day = 14;
  assert.deepStrictEqual(F.nextDay(all, 'g2').merchant[1].charms, ['sun', 'clover'], 'no mythic form for fish: the Sunshine Potion instead');
  // a visit from before the week charms: it still works, and the next visit is number 2
  const old = F.ensure({ grade: 'g2' });
  old.xp = lvXp(13);
  old.dream.s = 1;
  old.merchant = { week: 3, item: 'can' };
  old.day = 20;
  assert.deepStrictEqual([F.merchantNow(old), F.merchantWares(old).charms], ['can', []]);
  old.day = 41;
  assert.strictEqual(F.nextDay(old, 'g2').merchant[1].n, 2);
  // how much to put aside each day to make it in time
  assert.deepStrictEqual([F.perDayToSave(4726, 6, 'g2'), F.perDayToSave(4726, 0, 'g2'), F.perDayToSave(45, 4, 'k')], [700, 4800, 9]);
  // a farm from before the merchant gets him (and his charms)
  const up = F.ensure({ grade: 'g2', farm: (() => { const x = Object.assign(F.fresh(), { started: true }); delete x.treasure; delete x.merchant; delete x.charms; return x; })() });
  assert.deepStrictEqual([up.treasure, up.merchant, up.charms, up.stats.charms], [{}, null, {}, 0]);
  // the grown-up preview: he is visiting, the clover and Moon Cows are working
  const sc = F.showcase({ grade: 'g2', farm: F.fresh() });
  assert.ok(F.merchantHere(sc) && F.merchantHas(sc) && F.charmOn(sc, 'clover') && F.mythOn(sc, 'cow') && sc.pens[1].rare);
}

// ---------- the locked deposit (2nd grade): every $5 comes back as $6 after 4 bank weeks
{
  const f = F.ensure({ grade: 'g2' });
  f.money = 9000;
  F.deposit(f, 4000);
  assert.ok(!F.depositCheck(f, 'g2') && !F.depositOn(f, 'g2') && !F.lockDeposit(f, 'g2', 500), 'not offered below the account limit');
  F.deposit(f, 5000);
  f.day = 10;
  const news = F.nextDay(f, 'g2');
  assert.ok(news.depNew && F.depositOn(f, 'g2'), 'offered the first morning the savings are above $50');
  assert.ok(!F.nextDay(f, 'g2').depNew, 'announced once');
  const k = F.ensure({ grade: 'k' });
  k.bank.bal = 9000;
  assert.ok(!F.depositCheck(k, 'k') && !F.depositOn(k, 'k'), 'kindergarten has no locked deposit');
  // the deposit's rate sits between the small interest and the big one
  const perWeek = (F.DEPOSIT.back - F.DEPOSIT.step) / F.DEPOSIT.step / F.DEPOSIT.weeks;
  assert.ok(perWeek > F.BANK_LOW[1] / F.BANK_LOW[0] && perWeek < F.BANK_RULE[1][1] / F.BANK_RULE[1][0], `deposit ${perWeek} a week`);
  assert.ok(!F.lockDeposit(f, 'g2', 750) && !F.lockDeposit(f, 'g2', 10000), 'in $5 steps, only what is saved');
  assert.strictEqual(f.day, 12);
  assert.ok(F.lockDeposit(f, 'g2', 4000));
  assert.deepStrictEqual([f.bank.bal, f.dep.amt, f.dep.until, F.depositBack(4000)], [5000, 4000, 35, 4800], 'locked on day 12: unlocks on the 4th bank day after (14, 21, 28, 35)');
  assert.ok(!F.lockDeposit(f, 'g2', 500), 'one deposit at a time');
  assert.strictEqual(F.collectDeposit(f), null, 'it can’t be taken out early');
  let ready = 0;
  while (f.day < 35) { const n = F.nextDay(f, 'g2'); if (n.depReady) ready = n.depReady; while (F.bankDue(f)) { F.payInterest(f, 'g2'); F.payIncome(f); } }
  assert.ok(F.depositReady(f) && ready === 4800, 'the morning card says it unlocked');
  const before = f.bank.bal;
  assert.deepStrictEqual(F.collectDeposit(f), { amt: 4000, back: 4800 });
  assert.deepStrictEqual([f.bank.bal - before, f.dep.amt, f.stats.depBonus, f.bank.log[0].kind], [4800, 0, 800, 'unlock']);
  const s = f.stats;
  assert.strictEqual(s.saved - s.tookOut + s.interest + s.dreamIn - s.built + s.depBonus, f.bank.bal, 'the bank totals add up with the deposit');
  // locked on a bank day itself: the first of the 4 bank days is the next one
  assert.strictEqual(F.depositUntil(14), 42);
}

// ---------- the order board: orders of things this farm makes, kept in the basket, delivered with a money question
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  // a farm at level L like a child's: every open bed with half the bed upgrades, the newest animals in the open pens
  // (grown up, with the room upgrades open), every open workshop
  const farmAt = (g, L) => {
    const f = F.ensure({ grade: g, days: {}, stats: { attempts: 0, correct: 0 } });
    Object.assign(f, { xp: lvXp(L), money: 1e7, feed: 1e6, day: 20 });
    const up = Math.floor(F.BED_UP.filter((u) => u.lv <= L).length / 2), room = F.PEN_UP.filter((u, i) => i < 2 && u.lv <= L).length;
    f.beds = F.BEDS.filter((b) => b[0] <= L).map(() => ({ c: null, g: 0, u: up }));
    const kinds = Object.keys(F.ANIMALS).filter((a) => F.ANIMALS[a].lv <= L).sort((a, b) => F.ANIMALS[b].lv - F.ANIMALS[a].lv);
    f.pens = F.PENS.filter((p) => p[0] <= L).map((p, i) => ({ a: kinds[i % kinds.length], g: 9, fed: false, ready: 0, u: room }));
    for (const [id, w] of Object.entries(F.WORKS)) if (w.lv <= L) f.works[id] = { r: null, g: 0, ready: 0, out: '' };
    return f;
  };
  // A child who works only for this order, from an empty basket: plants what it needs, feeds and collects every day,
  // makes the workshop things. Returns the farm day it was delivered (or null: not in time).
  const play = (f0, g, o) => {
    const f = JSON.parse(JSON.stringify(f0));
    Object.assign(f, { basket: {}, orders: { seen: true, n: o.n, list: [JSON.parse(JSON.stringify(o))] } });
    const goods = F.orderGoods(f);
    while (f.day <= o.end) {
      Object.keys(f.works).forEach((w) => F.takeMade(f, w));
      f.beds.forEach((b, i) => F.harvest(f, i));
      f.pens.forEach((p, i) => F.collect(f, i));
      if (F.deliver(f, o.n)) return f.day;
      // what is still needed: the order's own things, and what the workshop things not made yet are made from
      const want = {};
      for (const [id, n] of Object.entries(o.items)) {
        const x = goods[id];
        if (x.kind !== 'made') { want[id] = (want[id] || 0) + n; continue; }
        const w = f.works[x.work], busy = w.r !== null && w.r !== undefined && F.WORKS[x.work].recipes[w.r].out === id ? 1 : 0;
        const left = n - (f.basket[id] || 0) - busy;
        for (const [i, k] of Object.entries(x.r.in)) want[i] = (want[i] || 0) + Math.max(0, left) * k;
        const ri = F.WORKS[x.work].recipes.indexOf(x.r);
        if (left > 0 && !busy && F.canMake(f, x.work, ri)) F.startMake(f, x.work, ri);
      }
      for (const [id, n] of Object.entries(want)) {
        if (!F.CROPS[id]) continue;
        let have = (f.basket[id] || 0) + U.sum(f.beds.filter((b) => b.c === id).map((b) => F.cropYield(b, f)));
        for (const i of F.emptyBeds(f)) { if (have >= n) break; F.plant(f, i, id); have += F.cropYield(f.beds[i], f); }
      }
      f.pens.forEach((p, i) => F.feed(f, i));
      F.nextDay(f, g);
    }
    return null;
  };
  const seenOrders = { kinds: {}, nights: {} };
  for (const g of ['k', 'g2']) {
    for (const L of [5, 6, 8, 10, 12, 15, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60]) {
      const f = farmAt(g, L), cap = F.orderCap(f, g), goods = F.orderGoods(f);
      for (let n = 1; n <= 24; n++) {
        const o = F.makeOrder(f, g, n), ids = Object.keys(o.items), tag = `${g} level ${L} order ${n} ${JSON.stringify(o.items)}`;
        assert.ok(ids.length >= 1 && ids.every((id) => F.ITEMS[id] && goods[id] && Number.isInteger(o.items[id]) && o.items[id] >= 1), tag + ': things this farm makes');
        assert.strictEqual(o.big, n % F.ORDER_BIG === 0, tag);
        assert.ok(o.big ? F.VIPS.includes(o.who) : F.PEOPLE.includes(o.who), tag + ': who');
        if (g === 'k' && !o.big) assert.strictEqual(ids.length, 1, tag + ': kindergarten orders one kind of thing');
        assert.strictEqual(o.stand, F.standValue(o.items, g));
        assert.strictEqual(o.pay, F.orderPay(o.stand, o.big, g));
        assert.ok(o.pay > o.stand && o.pay >= o.stand * (o.big ? 2 : 1.5) && o.pay <= cap, tag + `: pays more than the stand, at most ${cap}`);
        if (g !== 'k') assert.strictEqual(o.pay % 5, 0, tag + ': 2nd grade orders pay in 5¢ steps');
        const nights = o.end - f.day;
        assert.ok(nights >= 3 && nights <= 10, tag + `: ${nights} nights`);
        // the real test: a child can make it all in time, from an empty basket
        assert.ok(play(f, g, o), tag + `: can't be made in ${nights} nights`);
        ids.forEach((id) => (seenOrders.kinds[goods[id].kind] = (seenOrders.kinds[goods[id].kind] || 0) + 1));
        seenOrders.nights[nights] = (seenOrders.nights[nights] || 0) + 1;
      }
    }
  }
  assert.ok(seenOrders.kinds.crop > 200 && seenOrders.kinds.animal > 200 && seenOrders.kinds.made > 50, 'orders ask for crops, the animals’ things and workshop goods: ' + JSON.stringify(seenOrders.kinds));
  // the board opens at level 5; two orders to start with, then one each morning while there is room (3 at most)
  const f = farmAt('g2', 4);
  assert.ok(!F.ordersOpen(f) && F.ordersMorning(f, 'g2') === null && !f.orders.list.length, 'no orders before level 5');
  assert.ok(F.unlocksAt(F.ORDERS_LV, 'k').some((x) => /order board/.test(x.name)));
  f.xp = lvXp(5);
  f.pens = [{ a: 'chicken', g: 9, fed: false, ready: 0, u: 0 }, { a: null, g: 0, fed: false, ready: 0 }];
  F.ordersStart(f, 'g2');
  assert.deepStrictEqual([f.orders.seen, f.orders.list.length, f.orders.n], [true, 2, 2]);
  let news = F.nextDay(f, 'g2');
  assert.ok(news.orders.added && f.orders.list.length === 3 && !news.orders.gone.length);
  news = F.nextDay(f, 'g2');
  assert.ok(!news.orders.added && f.orders.list.length === 3, 'a full board: no new order');
  assert.ok(new Set(f.orders.list.map((o) => o.who[1])).size === 3, 'three different people');
  // an order ends after its last day; the morning before, it is on its last day
  const o1 = f.orders.list[0];
  o1.end = f.day + 1;
  news = F.nextDay(f, 'g2');
  assert.ok(news.orders.last.includes(o1) && !news.orders.gone.length);
  news = F.nextDay(f, 'g2');
  assert.ok(news.orders.gone.includes(o1) && !f.orders.list.includes(o1) && news.orders.added, 'it ended, and a new one came');
  // turning one down
  const o2 = f.orders.list[0];
  assert.ok(F.dropOrder(f, o2.n) && !f.orders.list.includes(o2) && !F.dropOrder(f, o2.n));
  // what the orders keep: customers and the market truck don't get it
  f.orders.list = [{ n: 90, who: F.PEOPLE[0], why: '', items: { egg: 6, carrot: 3 }, stand: 0, pay: 0, end: f.day + 3, big: false }, { n: 91, who: F.PEOPLE[1], why: '', items: { egg: 4 }, stand: 0, pay: 0, end: f.day + 3, big: false }];
  f.orders.list.forEach((o) => { o.stand = F.standValue(o.items, 'g2'); o.pay = F.orderPay(o.stand, false, 'g2'); });
  f.basket = { egg: 18, carrot: 2, honey: 1 };
  assert.deepStrictEqual(F.kept(f), { egg: 10, carrot: 2 });
  assert.deepStrictEqual(F.forSale(f), { egg: 8, honey: 1 });
  assert.strictEqual(F.saleCount(f), 9);
  assert.deepStrictEqual(F.orderStatus(f).map((s) => s.ready), [false, true], 'the first order is short of carrots; the second has its 4 eggs');
  assert.deepStrictEqual(F.ordersReady(f).map((o) => o.n), [91]);
  for (let k = 0; k < 300; k++) { const p = F.customer(f, 'g2', { stock: F.forSale(f) }); assert.ok(Object.entries(p.sale).every(([id, q]) => q <= (F.forSale(f)[id] || 0)), 'customers buy only what is for sale'); }
  f.basket = { egg: 22 };
  f.orders.list = [f.orders.list[1]];
  const load = F.truckLoad(F.forSale(f), 'g2', F.tiers('g2')[2]);
  assert.ok(load && load.q <= 18, 'the truck leaves the 4 kept eggs');
  // delivering: the things leave the basket, the money comes, the order is done
  assert.strictEqual(F.deliver(f, 90), null, 'not on the board');
  const money = f.money, sold = f.stats.sold, d = f.orders.list[0];
  assert.strictEqual(F.deliver(f, 91), d);
  assert.deepStrictEqual([f.basket.egg, f.money - money, f.stats.sold - sold, f.stats.orders, f.stats.orderPay, f.stats.orderExtra, f.orders.list.length], [18, d.pay, 4, 1, d.pay, d.pay - d.stand, 0]);
  f.orders.list = [{ n: 92, who: F.PEOPLE[0], why: '', items: { egg: 30 }, stand: 450, pay: 675, end: f.day + 3, big: false }];
  assert.strictEqual(F.deliver(f, 92), null, 'not enough eggs yet');
  assert.ok(F.orderXp(d) >= 8 && F.orderXp({ items: { egg: 1, milk: 1 }, big: true }) > F.orderXp(d));
  // the question when delivering: count the money (first two tiers), then how much more than the stand
  for (const g of ['k', 'g2']) {
    const fa = farmAt(g, 60);
    for (let n = 1; n <= 40; n++) {
      const o = F.makeOrder(fa, g, n);
      for (let t = 1; t <= F.tiers(g).length; t++) {
        const p = F.orderQuestion(o, g, t), tag = `${g} tier ${t} ${JSON.stringify(o)}`;
        assert.ok(p.text && p.hint && p.explain && p.who === o.who && !/undefined|NaN/.test(p.text + p.explain), tag);
        const ans = t < 3 ? o.pay : o.pay - o.stand;
        if (p.kind === 'num') assert.strictEqual(p.answer, ans, tag);
        else { assert.strictEqual(p.answer, F.fmt(ans, g), tag); assert.ok(p.choices.includes(p.answer) && new Set(p.choices).size === p.choices.length && p.choices.length === 4, tag); }
        if (g === 'k') assert.strictEqual(p.kind, 'num', 'kindergarten types the answer');
        if (t < 3) assert.ok(/pays with these/.test(p.text) && /<svg/.test(p.visual), tag);
        else assert.ok(/more/.test(p.text), tag);
      }
    }
  }
  // a farm from before the order board gets it
  const old = F.ensure({ grade: 'g2', farm: (() => { const x = Object.assign(F.fresh(), { started: true }); delete x.orders; return x; })() });
  assert.deepStrictEqual([old.orders, old.stats.orders], [{ seen: false, n: 0, list: [] }, 0]);
  // the grown-up preview: three orders, one ready to deliver and one big
  for (const g of ['k', 'g2']) {
    const sc = F.showcase({ grade: g, farm: F.fresh() });
    assert.ok(sc.orders.seen && sc.orders.list.length === 3 && F.ordersReady(sc).length >= 1 && sc.orders.list.some((o) => o.big), g + ' preview orders');
  }
  console.log('order nights:', JSON.stringify(seenOrders.nights), 'kinds:', JSON.stringify(seenOrders.kinds));
}

// ---------- the barnyard: a little house for each kind of small animal, so they don't take a pen
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  assert.deepStrictEqual(Object.keys(F.HOUSES), ['chicken', 'bees', 'goat', 'sheep', 'duck', 'turkey']);
  for (const [a, h] of Object.entries(F.HOUSES)) {
    assert.ok(h.lv >= F.YARD_LV && h.lv >= F.ANIMALS[a].lv && F.unlocksAt(h.lv, 'g2').some((x) => /Barnyard/.test(x.name) && x.name.includes(h.name.toLowerCase())), a);
    for (const g of ['k', 'g2']) {
      // a full house (3 animals) pays for itself and its rooms within two bank weeks
      const gx = g === 'k' ? 0 : 1, A = F.ANIMALS[a], cost = h.cost[gx] + 2 * A.cost[gx], day = 3 * (A.per * F.price(A.item, g) - A.eat * F.FEED.price[gx]);
      assert.ok(cost / day <= 14, `${a} (${g}): a full house pays back in ${(cost / day).toFixed(1)} days`);
    }
  }
  for (const g of ['k', 'g2']) {
    const gx = g === 'k' ? 0 : 1, full = U.sum(Object.keys(F.HOUSES).map((a) => 3 * (F.ANIMALS[a].per * F.price(F.ANIMALS[a].item, g) - F.ANIMALS[a].eat * F.FEED.price[gx])));
    // the whole barnyard is a helping hand, not the farm: about half of what a good farm makes when the last house
    // opens, and less and less after that
    for (const L of [30, 40, 60]) assert.ok(full <= (L === 30 ? 0.55 : 0.5) * F.goodDay(L, g).total, `${g} level ${L}: the full barnyard makes ${full}, a good farm ${F.goodDay(L, g).total}`);
  }
  const f = F.ensure({ grade: 'g2', days: {}, stats: { attempts: 0, correct: 0 } });
  Object.assign(f, { xp: lvXp(15), money: 100000, feed: 100 });
  f.pens = [{ a: 'alpaca', g: 9, fed: false, ready: 0, u: 0 }, { a: 'chicken', g: 9, fed: false, ready: 0, u: 1 }];
  assert.ok(!F.yardOpen(f) && F.shopItem(f, 'g2', 'house:chicken').locked && F.buy(f, 'g2', 'house:chicken') === null, 'the barnyard opens at level 16');
  f.xp = lvXp(16);
  assert.ok(F.yardOpen(f) && F.shopItem(f, 'g2', 'house:bees').locked, 'the bee yard opens later');
  assert.ok(!F.shop(f, 'g2').some((x) => x.id.startsWith('houseup:')), 'no house, no house upgrades');
  let money = f.money;
  assert.ok(F.buy(f, 'g2', 'house:chicken'));
  assert.deepStrictEqual([f.yard.chicken, money - f.money], [{ a: 'chicken', g: 0, fed: false, ready: 0, u: 0 }, F.HOUSES.chicken.cost[1]], 'a house comes with its first animal');
  assert.ok(F.shopItem(f, 'g2', 'house:chicken').owned && F.buy(f, 'g2', 'house:chicken') === null);
  assert.strictEqual(f.pens.length, 2, 'it takes no pen');
  // room for 2 and 3, each the price of one more animal; no cozy barn
  money = f.money;
  assert.ok(F.buy(f, 'g2', 'houseup:chicken') && F.buy(f, 'g2', 'houseup:chicken'));
  assert.deepStrictEqual([F.penCount(f.yard.chicken), money - f.money, F.shopItem(f, 'g2', 'houseup:chicken').owned, F.buy(f, 'g2', 'houseup:chicken')], [3, 2 * F.ANIMALS.chicken.cost[1], true, null]);
  assert.strictEqual(F.penMakes(f.yard.chicken), 6);
  // nights: fed, they grow up and lay; hungry, nothing happens
  f.yard.chicken.u = 0;
  assert.strictEqual(F.feedPen(f, f.yard.chicken), 'ok');
  assert.strictEqual(f.feed, 99);
  let news = F.nextDay(f, 'g2');
  assert.ok(!news.hungry.includes('chicken') || f.pens[1].fed === false, 'the house chickens were fed');
  F.feedPen(f, f.yard.chicken); F.nextDay(f, 'g2');
  assert.strictEqual(F.animalStage(f.yard.chicken), 2);
  F.feedPen(f, f.yard.chicken); news = F.nextDay(f, 'g2');
  assert.ok(news.made.some(([it, n]) => it === 'egg' && n === 2) && f.yard.chicken.ready === 2);
  const eggs = f.basket.egg || 0;
  assert.strictEqual(F.collectPen(f, f.yard.chicken), 2);
  assert.strictEqual(f.basket.egg, eggs + 2);
  news = F.nextDay(f, 'g2');
  assert.ok(news.hungry.filter((a) => a === 'chicken').length === 2, 'hungry in the pen and in the house');
  // the farmhand and the Feed Fairy look after the houses too
  f.helper = { hired: true, on: true };
  F.allPens(f).forEach((p) => (p.fed = false));
  news = F.nextDay(f, 'g2');
  assert.deepStrictEqual([news.helper.fed, news.helper.houses], [2, 1], 'Sam feeds 2 pens and the henhouse');
  f.helper = { hired: false, on: true };
  f.treasure = { fairy: true };
  f.pens = [{ a: null, g: 0, fed: false, ready: 0 }];
  f.yard.chicken.fed = false;
  F.nextDay(f, 'g2');
  assert.ok(f.yard.chicken.ready > 0, 'the fairy fed the henhouse');
  f.treasure = {};
  // Mythic Feed turns the house chickens into Firebird Hens too, and its price counts them
  f.charms = { myth: { a: 'chicken', cost: 100, until: f.day + 7, gain: 0 } };
  assert.ok(F.charmGain('myth', f, 'g2', 'chicken') > 0);
  f.yard.chicken.ready = 0;
  F.feedPen(f, f.yard.chicken); F.nextDay(f, 'g2');
  assert.ok(f.yard.chicken.rare > 0 && f.charms.myth.gain > 0, 'golden eggs from the henhouse');
  f.charms = {};
  // orders ask for the house animals' things
  f.basket = {};
  assert.ok(F.orderGoods(f).egg && F.orderGoods(f).egg.per === F.penMakes(f.yard.chicken));
  // moving chickens from a pen into the henhouse, instead of selling them
  f.yard.chicken = { a: 'chicken', g: 1, fed: true, ready: 1, u: 0 };
  f.pens = [{ a: 'chicken', g: 9, fed: false, ready: 2, u: 1 }, { a: 'alpaca', g: 9, fed: false, ready: 0, u: 0 }, { a: 'chicken', g: 9, fed: false, ready: 0, u: 3 }];
  assert.ok(F.canMove(f, 0) && !F.canMove(f, 1) && !F.canMove(f, 2), 'two fit (1 + 2); an alpaca has no house; three don’t fit');
  const feed = f.feed, before = F.basketCount(f);
  money = f.money;
  const mv = F.moveToHouse(f, 0);
  assert.deepStrictEqual(mv, { a: 'chicken', n: 2, count: 3 });
  assert.deepStrictEqual([f.pens[0], f.yard.chicken.u, f.yard.chicken.g, f.yard.chicken.ready, f.yard.chicken.fed, F.basketCount(f) - before, f.feed - feed, f.money - money], [{ a: null, g: 0, fed: false, ready: 0 }, 2, 9, 1, false, 2, F.penEat({ a: 'chicken', u: 0 }), 0], 'their eggs to the basket; the house now has 3, fully grown; the house was fed: its feed back');
  assert.strictEqual(F.moveToHouse(f, 0), null);
  // a pen with a cozy barn has 3 animals: they never fit with the house's own (so the barn never has to move)
  f.yard.chicken = { a: 'chicken', g: 9, fed: false, ready: 0, u: 0 };
  f.pens[2] = { a: 'chicken', g: 9, fed: false, ready: 0, u: 3 };
  assert.ok(!F.canMove(f, 2), '3 + 1 is too many');
  delete f.yard.chicken;
  f.pens[2].u = 0;
  assert.ok(!F.canMove(f, 2), 'no henhouse');
  // both fed today: they stay fed, no feed comes back
  f.yard.duck = { a: 'duck', g: 0, fed: true, ready: 0, u: 0 };
  f.pens[2] = { a: 'duck', g: 3, fed: true, ready: 0, u: 1 };
  const feed2 = f.feed;
  assert.deepStrictEqual(F.moveToHouse(f, 2), { a: 'duck', n: 2, count: 3 });
  assert.deepStrictEqual([f.yard.duck.fed, f.yard.duck.g, f.feed], [true, 3, feed2]);
  // a farm from before the barnyard gets it; the preview has every house
  const old = F.ensure({ grade: 'g2', farm: (() => { const x = Object.assign(F.fresh(), { started: true }); delete x.yard; return x; })() });
  assert.deepStrictEqual(old.yard, {});
  for (const g of ['k', 'g2']) assert.strictEqual(Object.keys(F.showcase({ grade: g, farm: F.fresh() }).yard).length, 6);
}

// ---------- farm supplies: small helpers for a few farm days, and a rented field
{
  const lvXp = (L) => { let x = 0; for (let k = 1; k < L; k++) x += F.need(k); return x; };
  const farm = (g, L) => {
    const f = F.ensure({ grade: g, days: {}, stats: { attempts: 0, correct: 0 } });
    Object.assign(f, { xp: lvXp(L), money: 1e6, feed: 1000, day: 10 });
    f.beds = F.BEDS.filter((b) => b[0] <= L).map(() => ({ c: null, g: 0, u: 0 }));
    f.pens = [{ a: 'chicken', g: 9, fed: false, ready: 0, u: 0 }, { a: 'cow', g: 9, fed: false, ready: 0, u: 0 }];
    return f;
  };
  // prices: about a third of what each brings a farm like this one; kindergarten in cents (2¢ to 50¢), 2nd grade in 25¢ steps
  for (const g of ['k', 'g2']) for (const L of [8, 12, 20, 30, 45, 60]) {
    const f = farm(g, L);
    f.works = { jamkitchen: { r: null, g: 0, ready: 0, out: '' } };
    for (const id of Object.keys(F.BOOSTS)) {
      const c = F.boostCost(id, f, g), x = F.boostGain(id, f, g);
      assert.ok(c > 0 && (g === 'k' ? c <= 50 : c % 25 === 0) && x >= 2.5 * c, `${id} ${g} level ${L}: costs ${c}, brings ${x}`);
    }
  }
  const f = farm('g2', 7);
  assert.strictEqual(F.buyBoost(f, 'g2', 'grow'), null, 'supplies open at level 8');
  assert.ok(F.unlocksAt(F.BOOST_LV, 'g2').some((x) => /Farm supplies/.test(x.name)) && F.unlocksAt(F.FIELD_LV, 'k').some((x) => /Rent a field/.test(x.name)));
  f.xp = lvXp(8);
  assert.deepStrictEqual([F.boostNeeds(f, 'oven'), F.boostNeeds(f, 'treat')], ['Needs a workshop', ''], 'the oven needs a workshop');
  assert.strictEqual(F.buyBoost(f, 'g2', 'oven'), null);
  // Grow-Fast: crops grow twice as fast for 3 nights (a carrot is ready after one night anyway)
  const money = f.money, cost = F.boostCost('grow', f, 'g2');
  const x = F.buyBoost(f, 'g2', 'grow');
  assert.ok(x && f.money === money - cost && f.boosts.grow.until === 13 && f.stats.boosts === 1 && f.stats.boostCost === cost);
  assert.strictEqual(F.buyBoost(f, 'g2', 'grow'), null, 'one at a time');
  F.plant(f, 0, 'corn'); // 3 days
  F.plant(f, 1, 'carrot'); // 1 day
  let news = F.nextDay(f, 'g2');
  assert.deepStrictEqual([f.beds[0].g, f.beds[1].g, F.cropStage(f.beds[1])], [2, 1, 'ready']);
  assert.strictEqual(f.boosts.grow.gain, Math.round((F.cropYield(f.beds[0], f) * F.price('corn', 'g2')) / F.cropDays(f.beds[0])), 'a day of corn, not of carrots');
  news = F.nextDay(f, 'g2');
  assert.ok(news.ripe.includes('corn'), 'corn in 2 nights, not 3');
  assert.ok(F.boostOn(f, 'grow') && f.day === 12, 'still on: its last night is tonight');
  news = F.nextDay(f, 'g2'); // the morning of day 13
  assert.ok(!f.boosts.grow && news.boostEnd.length === 1 && news.boostEnd[0].id === 'grow' && news.boostEnd[0].cost === cost);
  assert.strictEqual(f.stats.boostGain, news.boostEnd[0].got);
  F.plant(f, 2, 'corn'); F.nextDay(f, 'g2');
  assert.strictEqual(f.beds[2].g, 1, 'back to normal');
  // Animal treats: every fed grown-up pen and house makes 1 more
  f.yard = { bees: { a: 'bees', g: 9, fed: false, ready: 0, u: 0 } };
  assert.ok(F.buyBoost(f, 'g2', 'treat'));
  F.allPens(f).forEach((p) => F.feedPen(f, p));
  F.nextDay(f, 'g2');
  assert.deepStrictEqual([f.pens[0].ready, f.pens[1].ready, f.yard.bees.ready], [3, 3, 2]);
  assert.strictEqual(f.boosts.treat.gain, F.price('egg', 'g2') + F.price('milk', 'g2') + F.price('honey', 'g2'));
  // the Big oven: every batch makes 1 more
  f.works = { jamkitchen: { r: null, g: 0, ready: 0, out: '' } };
  assert.ok(F.buyBoost(f, 'g2', 'oven'));
  f.basket.strawberry = 4;
  F.startMake(f, 'jamkitchen', 0);
  F.nextDay(f, 'g2');
  assert.deepStrictEqual([f.works.jamkitchen.ready, f.boosts.oven.gain], [2, F.price('jam', 'g2')]);
  // the rented field: needs all 6 beds and level 12; 2 more beds for 7 days; only crops ready in time; on its last
  // morning the farmer picks them and takes the beds back
  const r = farm('g2', 11);
  assert.strictEqual(F.buyBoost(r, 'g2', 'field'), null, 'level 12');
  r.xp = lvXp(12);
  const sixth = r.beds.pop();
  assert.ok(/all 6/.test(F.boostNeeds(r, 'field')) && F.buyBoost(r, 'g2', 'field') === null, 'all 6 beds first');
  r.beds.push(sixth);
  assert.strictEqual(F.ownBeds(r).length, 6);
  assert.ok(F.buyBoost(r, 'g2', 'field') && r.beds.length === 8 && r.beds[7].rent && r.boosts.field.until === 17);
  assert.ok(!F.shop(r, 'g2').some((x) => x.id === 'bedup:6' || x.id === 'bedup:7') && !F.shop(r, 'g2').some((x) => x.id === 'bed'), 'rented beds are not ours to upgrade or count');
  assert.deepStrictEqual(F.emptyBeds(r, 'pumpkin').length, 8, '4 days: fits');
  r.day = 14;
  assert.ok(!F.canPlant(r, 6, 'pumpkin') && F.canPlant(r, 6, 'tomato') && F.canPlant(r, 0, 'pumpkin'), '3 days left: a 4-day pumpkin is too slow for the rented beds');
  assert.deepStrictEqual(F.emptyBeds(r, 'pumpkin'), [0, 1, 2, 3, 4, 5]);
  assert.strictEqual(F.buySeed(r, 'g2', 6, 'pumpkin'), false);
  assert.ok(F.buySeed(r, 'g2', 6, 'tomato') && F.buySeed(r, 'g2', 7, 'carrot'));
  F.nextDay(r, 'g2');
  const before = r.basket.carrot || 0;
  assert.strictEqual(F.harvest(r, 7), 3);
  assert.strictEqual(r.boosts.field.gain, 3 * F.price('carrot', 'g2') - F.seedPrice('carrot', 'g2'), 'the crops, after the seeds');
  F.nextDay(r, 'g2');
  news = F.nextDay(r, 'g2'); // the morning of day 17: the tomatoes are ripe, the farmer picks them
  const fieldEnd = news.boostEnd.find((y) => y.id === 'field');
  assert.ok(fieldEnd && fieldEnd.picked === 4 && r.beds.length === 6 && !r.beds.some((b) => b.rent) && r.basket.tomato === 4 && r.basket.carrot === before + 3);
  assert.strictEqual(fieldEnd.got, 3 * F.price('carrot', 'g2') - F.seedPrice('carrot', 'g2') + 4 * F.price('tomato', 'g2') - F.seedPrice('tomato', 'g2'));
  // orders don't count a rented field
  F.buyBoost(r, 'g2', 'field');
  assert.strictEqual(F.orderNights(r, { corn: 5 * 6 }), F.orderNights(Object.assign({}, r, { beds: F.ownBeds(r) }), { corn: 5 * 6 }));
  // a farm from before the supplies gets them; the preview shows two at work
  const old = F.ensure({ grade: 'g2', farm: (() => { const y = Object.assign(F.fresh(), { started: true }); delete y.boosts; return y; })() });
  assert.deepStrictEqual([old.boosts, old.stats.boosts], [{}, 0]);
  for (const g of ['k', 'g2']) { const sc = F.showcase({ grade: g, farm: F.fresh() }); assert.ok(F.boostOn(sc, 'grow') && F.boostOn(sc, 'field') && sc.beds.filter((b) => b.rent).length === 2); }
}

// ---------- the grown-up preview shows a level-60 farm with everything open
for (const g of ['k', 'g2']) {
  const st = { grade: g, farm: F.fresh() };
  const fm = F.showcase(st);
  assert.strictEqual(F.level(fm.xp).level, 60);
  assert.strictEqual(fm.tier, F.tiers(g).length);
  assert.ok(Object.keys(F.DECOR).every((id) => fm.owned[id]) && Object.keys(F.WORKS).every((id) => fm.works[id]));
  assert.ok(fm.beds.some((b) => F.cropStage(b) === 'ready') && fm.beds.some((b) => F.cropStage(b) === 'seed'));
  assert.ok(F.bankDue(fm) > 0 && F.isBankDay(fm.day), 'a bank day is waiting');
  assert.ok(!F.shop(fm, g).some((x) => x.locked && !x.owned), 'nothing in the shop is locked (decorations after level 60 are already on the farm)');
  assert.ok(F.customer(fm, g, { stock: fm.basket }), 'customers come');
}

console.log('farm tests passed ·', Object.entries(seen).map(([k, v]) => k + ' ' + v).join(', '));
