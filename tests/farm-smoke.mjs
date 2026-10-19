// Browser test for Sunny Farm: node tests/farm-smoke.mjs [screenshotDir]
// A 2nd grader and a kindergartner each pick crops, sell at the stand, pay in the shop (and get change),
// sleep, feed animals and do odd jobs. Fails on any console error, a stuck screen or wrong money.
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright')); }
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, '..', 'index.html');
const shots = process.argv[2];
const errors = [];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined });

// Answer what's on screen (a customer, an odd job, a payment or its change question), right or wrong.
async function answer(page, right = true) {
  const p = await page.evaluate(() => { const s = MQ.farmUI.playing(); const q = s.step === 'change' ? s.change : s.p; return { kind: q.kind, answer: q.answer, choices: q.choices, target: q.target, kinds: q.coinKinds, pay: !!q.pay }; });
  if (p.kind === 'num') {
    for (const ch of right ? String(p.answer) : '99') await page.click(`[data-act=fKey][data-arg="${ch}"]`);
    await page.click('[data-act=fCheck]');
  } else if (p.kind === 'choice') {
    const i = right ? p.choices.indexOf(String(p.answer)) : p.choices.findIndex((c) => c !== p.answer);
    await page.click(`#fanswer .choice >> nth=${i}`);
  } else {
    const coins = await page.evaluate(([t, k, ok]) => (ok ? MQ.farm.fewest(t, k) : MQ.farm.COINV[k[k.length - 1]] === t ? [k[k.length - 1], k[k.length - 1]] : [k[k.length - 1]]), [p.target, p.kinds, right]);
    for (const c of coins) await page.click(`.fpalette [data-act=fCoin][data-arg=${c}]`);
    await page.click('[data-act=fCheck]');
  }
  return p;
}

async function play(grade, tag, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    const synth = { getVoices: () => [], speak(u) { setTimeout(() => u.onend && u.onend(), 50); }, cancel() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name) => shots && (await page.waitForTimeout(450), page.screenshot({ path: path.join(shots, `farm-${tag}-${name}.png`), fullPage: true }));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-localonly', '1'); });
  await page.reload();
  await page.fill('#ob-name', grade === 'k' ? 'Leo' : 'Sofia');
  await page.click(`[data-act=pickGrade][data-arg=${grade}]`);
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.t-farm');
  await snap('01-home');
  await page.click('.t-farm');
  await page.waitForSelector('.farm .fbed');
  const start = await page.evaluate(() => MQ.state.farm.money);
  if (start !== (grade === 'k' ? 5 : 30)) errors.push(`${tag}: start money ${start}`);
  await snap('02-farm');

  // pick the ripe carrots, feed the chick
  await page.click('.fbed.ready', { force: true });
  await page.click('.fpen.hungry');
  const basket = await page.evaluate(() => MQ.state.farm.basket.carrot);
  if (basket !== 3) errors.push(`${tag}: basket after harvest ${basket}`);

  // the stand: first customer wrong twice (answer shown, still sold), the rest right
  await page.click('[data-act=fMarket]');
  await page.waitForSelector('.fplay');
  await snap('03-customer');
  let guard = 0, first = true;
  while ((await page.$('.fplay')) && guard++ < 20) {
    if (first) {
      await answer(page, false);
      await page.waitForSelector('.fb.hint');
      await snap('04-hint');
      await answer(page, false);
      await page.waitForSelector('.fb.reveal');
      first = false;
    } else {
      await answer(page, true);
      await page.waitForSelector('.fb.ok');
    }
    if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
    await page.click('[data-act=fNext]');
  }
  await page.waitForSelector('.result');
  await snap('05-soldout');
  const after = await page.evaluate(() => ({ money: MQ.state.farm.money, sold: MQ.state.farm.stats.sold, basket: MQ.farm.basketCount(MQ.state.farm), days: MQ.state.days }));
  if (after.sold !== 3 || after.basket !== 0) errors.push(`${tag}: after selling ${JSON.stringify(after)}`);
  const carrot = grade === 'k' ? 1 : 10;
  if (after.money < start + 3 * carrot) errors.push(`${tag}: money ${after.money} < ${start + 3 * carrot}`);
  if (!Object.values(after.days)[0] || !Object.values(after.days)[0].a) errors.push(`${tag}: farm answers not counted in daily totals`);

  // plant carrots: pay with coins (2nd grade overpays with a $1 bill and works out the change)
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('.fbed.empty >> nth=0');
  await page.waitForSelector('.fseeds');
  await snap('06-seeds');
  await page.click('[data-act=fPlant][data-arg="0:carrot"]');
  await page.waitForSelector('.fpalette');
  const before = await page.evaluate(() => MQ.state.farm.money);
  const seed = grade === 'k' ? 2 : 15;
  if (grade === 'g2') {
    await page.click('.fpalette [data-act=fCoin][data-arg=q]');
    await page.click('[data-act=fCheck]');
    await page.waitForSelector('.fchange');
    await snap('07-change');
    const ch = await page.evaluate(() => MQ.farmUI.playing().change.answer);
    if (ch !== 10) errors.push(`${tag}: change from 25¢ for 15¢ is ${ch}`);
  }
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await snap('08-paid');
  const paid = await page.evaluate(() => ({ money: MQ.state.farm.money, bed: MQ.state.farm.beds[0] }));
  if (paid.money !== before - seed || paid.bed.c !== 'carrot') errors.push(`${tag}: paying for seeds ${JSON.stringify(paid)} (before ${before})`);
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.farm .fbed');

  // sleep: carrots ripen, the chick grows; morning card
  await page.click('[data-act=fSleep]');
  await snap('09a-night');
  await page.waitForSelector('#modal');
  await snap('09-morning');
  await page.click('#modal [data-act=closeModal]');
  const day = await page.evaluate(() => ({ day: MQ.state.farm.day, ready: MQ.farm.cropStage(MQ.state.farm.beds[0]), chick: MQ.farm.animalStage(MQ.state.farm.pens[0]) }));
  if (day.day !== 2 || day.ready !== 'ready' || day.chick !== 1) errors.push(`${tag}: next day ${JSON.stringify(day)}`);

  // shop: buy feed (exact coins), set a saving goal
  await page.evaluate(() => { MQ.state.farm.money += 500; MQ.store.save(); });
  await page.click('[data-act=go][data-arg="farm:shop"]');
  await page.waitForSelector('.fitems');
  await snap('10-shop');
  await page.click('[data-act=fBuy][data-arg="feed:5"]');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fitems');
  const feed = await page.evaluate(() => MQ.state.farm.feed);
  if (feed < 7) errors.push(`${tag}: feed after buying ${feed}`);
  // sell the chicken to Rosa: a money question, then the pen is empty for another kind
  const sell = await page.evaluate(() => ({ money: MQ.state.farm.money, pay: MQ.farm.resale(MQ.state.farm.pens[0], MQ.state.grade).total }));
  await page.click('[data-act=fSellAsk][data-arg="0"]');
  await page.waitForSelector('#modal [data-act=fSell]');
  await snap('10b-sell-ask');
  await page.click('#modal [data-act=fSell]');
  await page.waitForSelector('.fplay #fanswer');
  await snap('10c-sell');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  const sold = await page.evaluate(() => ({ money: MQ.state.farm.money, pen: MQ.state.farm.pens[0].a }));
  if (sold.money !== sell.money + sell.pay || sold.pen !== null) errors.push(`${tag}: selling the chicken ${JSON.stringify(sold)} (before ${JSON.stringify(sell)})`);
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fitems [data-act=fBuy][data-arg="animal:chicken"]');
  await page.click('[data-act=fTab][data-arg=decor]');
  await page.click('[data-act=fGoal] >> nth=0');
  await page.waitForSelector('.fgoal');
  await snap('11-goal');

  // odd jobs: a few, then stop
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('[data-act=fJobs]');
  for (let i = 0; i < 4; i++) {
    await page.waitForSelector('.fplay #fanswer');
    if (i === 0) await snap('12-job');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
    await page.click('[data-act=fNext]');
  }
  await page.click('[data-act=fQuit]');
  await page.waitForSelector('.result');
  const jobs = await page.evaluate(() => MQ.state.farm.stats.jobs);
  if (jobs !== 4) errors.push(`${tag}: jobs ${jobs}`);

  // a high-level farm: every tier, challenge customers, a level-up card
  await page.evaluate(() => { const f = MQ.state.farm; f.xp = 13227; /* 3 XP before level 50 */ f.tier = MQ.farm.tiers(MQ.state.grade).length; f.basket = { honey: 9, milk: 9, pumpkin: 9, egg: 40, truffle: 9, grapes: 9 }; f.customers = 4; f.stand = 3;
    Object.keys(MQ.farm.DECOR).forEach((id) => (f.owned[id] = true));
    f.beds = ['carrot', 'strawberry', 'tomato', 'corn', 'pumpkin', null].map((c, i) => ({ c, g: i % 3 === 0 ? 9 : i % 3, u: i }));
    f.pens = ['chicken', 'bees', 'cow', 'fishpond', 'turkey', 'unicorn'].map((a, i) => ({ a, g: i % 3 === 0 ? 0 : 9, fed: i % 2 === 0, ready: i % 3 === 1 ? 2 : 0, u: i % 4 }));
    Object.keys(MQ.farm.WORKS).forEach((id, i) => (f.works[id] = i % 3 === 2 ? { r: 0, g: 0, ready: 0, out: '' } : i % 3 === 1 ? { r: null, g: 0, ready: 1, out: MQ.farm.WORKS[id].recipes[0].out } : { r: null, g: 0, ready: 0, out: '' }));
    f.day = 14;
    const b0 = MQ.state.grade === 'k' ? 1234 : 6234; // above the Piggy account limit: interest in two parts
    f.bank = { bal: b0, acct: 0, log: [], pend: [{ day: 7, bal: b0 }, { day: 14, bal: b0 + MQ.farm.interest(b0, MQ.state.grade) }] };
    f.dream.seen = true; // the Big Dreams intro is tested below
    f.orders = { seen: true, n: 0, list: [] }; // and the order board
    MQ.store.save(); });
  await page.click('[data-act=go][data-arg=farm]');
  await snap('13-bigfarm');
  // tapping a pen far down the page keeps the page where it is; the dock at the bottom shows the change
  {
    const i = await page.evaluate(() => MQ.state.farm.pens.map((p, k) => (p.ready ? k : -1)).filter((k) => k >= 0).pop());
    const penSel = `.fpen[data-arg="${i}"]`;
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), penSel);
    const before = await page.evaluate(() => ({ y: window.scrollY, basket: +document.querySelector('#fdbasket b').textContent }));
    if (before.y < 200) errors.push(`${tag}: test setup did not scroll (${before.y})`);
    await page.click(penSel, { force: true });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ y: window.scrollY, basket: +document.querySelector('#fdbasket b').textContent, label: !!document.querySelector('.ftext') }));
    if (Math.abs(after.y - before.y) > 2) errors.push(`${tag}: the page jumped from ${before.y} to ${after.y} after a tap`);
    if (after.basket <= before.basket) errors.push(`${tag}: the dock basket did not grow (${before.basket} → ${after.basket})`);
    if (!after.label) errors.push(`${tag}: no "+N" label where the tap was`);
    if (shots) await page.screenshot({ path: path.join(shots, `farm-${tag}-13b-dock.png`) });
  }
  await page.click('[data-act=fMarket]');
  const startCount = await page.evaluate(() => MQ.farm.basketCount(MQ.state.farm));
  let trucks = 0;
  for (let i = 0; i < 6; i++) {
    await page.waitForSelector('.fplay #fanswer');
    if (i === 0) await snap('14-vip');
    const truck = await page.evaluate(() => { const p = MQ.farmUI.playing().p; return p.truck ? { q: p.sale.egg, eggs: MQ.state.farm.basket.egg } : null; });
    if (truck) { trucks++; await snap('14c-truck'); }
    if (!(await page.$('#fbbar li.want'))) errors.push(`${tag}: the basket bar does not mark what the customer wants`);
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    // the basket bar at the stand: sold + left = what was in the basket when the stand opened
    const bb = await page.evaluate(() => ({ label: document.querySelector('#fbbar').getAttribute('aria-label'), left: MQ.farm.basketCount(MQ.state.farm) }));
    const m = /(\d+) sold, (\d+) left/.exec(bb.label || '');
    if (!m || +m[2] !== bb.left || +m[1] + +m[2] !== startCount) errors.push(`${tag}: basket bar ${bb.label} (left ${bb.left}, started with ${startCount})`);
    if (i === 1) await snap('14b-basketbar');
    if (truck) { const eggs = await page.evaluate(() => MQ.state.farm.basket.egg || 0); if (!(truck.q >= 10 && eggs === truck.eggs - truck.q)) errors.push(`${tag}: the market truck took ${truck.q} eggs (${truck.eggs} → ${eggs})`); }
    if (await page.$('#modal')) { await snap('15-levelup'); await page.click('#modal [data-act=closeModal]'); }
    if (await page.$('[data-act=fNext]')) await page.click('[data-act=fNext]');
  }
  await page.click('[data-act=fQuit]');
  await page.waitForSelector('.result');
  const vip = await page.evaluate(() => MQ.state.farm.stats.vip);
  if (vip < 1) errors.push(`${tag}: no challenge customer served`);
  if (trucks < 1) errors.push(`${tag}: the market truck never came for 40 eggs`);
  // the bank: two bank days waiting (interest questions), then save money and take some out
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('.fbankday');
  await page.waitForSelector('.fbank');
  await snap('16-bank');
  await page.click('[data-act=fInterest]');
  for (let i = 0; i < 2; i++) {
    await page.waitForSelector('.fplay #fanswer');
    if (i === 0) await snap('17-interest');
    if (i === 0 && !/up to .* above/.test(await page.textContent('.fplay'))) errors.push(`${tag}: the interest question does not explain the two rates`);
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
    await page.click('[data-act=fNext]');
  }
  await page.waitForSelector('.fbank');
  const bank1 = await page.evaluate(() => MQ.state.farm.bank);
  // k: 50¢ on the first 500¢ + 1¢ for each 100¢ above; g2: $5 on the first $50 + 1¢ for each dollar above
  const want = grade === 'k' ? 1234 + 57 + 57 : 6234 + 512 + 517;
  if (bank1.bal !== want || bank1.log.length !== 2) errors.push(`${tag}: bank after interest ${JSON.stringify(bank1)} (want ${want})`);
  const wallet = await page.evaluate(() => MQ.state.farm.money);
  await page.click('[data-act=fDeposit]');
  await page.click(`.fpalette [data-act=fCoin][data-arg=${grade === 'k' ? 'd' : 'b'}]`);
  await page.click(`.fpalette [data-act=fCoin][data-arg=${grade === 'k' ? 'd' : 'b'}]`);
  await page.click('[data-act=fCheck]');
  await page.waitForSelector('.fchange');
  await snap('18-deposit');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fbank');
  const dep = await page.evaluate(() => ({ bal: MQ.state.farm.bank.bal, money: MQ.state.farm.money }));
  const two = grade === 'k' ? 20 : 200;
  if (dep.bal !== want + two || dep.money !== wallet - two) errors.push(`${tag}: deposit ${JSON.stringify(dep)}`);
  await page.click('[data-act=fWithdraw]');
  await page.click('.fpalette [data-act=fCoin][data-arg=q]');
  await page.click('[data-act=fCheck]');
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fbank');
  await snap('19-bankbook');
  const wd = await page.evaluate(() => MQ.state.farm.bank.bal);
  if (wd !== want + two - 25) errors.push(`${tag}: withdraw left ${wd}`);
  // the all-time summary: saved, the bank added, took out, and what the money in the bank is made of
  const sum = await page.evaluate(() => { const s = MQ.farm.bankSummary(MQ.state.farm), el = document.querySelector('.bsum'); return { s, n: el ? el.querySelectorAll('.bsum-k > div').length : 0, bar: !!(el && el.querySelector('.bsum-bar')), t: el ? el.textContent : '' }; });
  if (sum.s.saved !== two || sum.s.tookOut !== 25 || !sum.s.interest || sum.n !== 3 || !sum.bar || sum.s.own + sum.s.fromInterest !== wd) errors.push(`${tag}: bank summary ${JSON.stringify(sum)}`);
  // a better bank account, bought at the bank: more of the savings earn the big interest
  if (!(await page.$('.bacct'))) errors.push(`${tag}: no account card at the bank`);
  await page.evaluate(() => { MQ.state.farm.money += MQ.farm.shopItem(MQ.state.farm, MQ.state.grade, 'acct').price; MQ.app.go('farm:bank'); });
  await page.click('.bacct [data-act=fBuy][data-arg=acct]');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fbank');
  await snap('19b-account');
  const acct = await page.evaluate(() => ({ a: MQ.state.farm.bank.acct, t: document.querySelector('.bacct').textContent }));
  if (acct.a !== 1 || !/Silver account/.test(acct.t)) errors.push(`${tag}: account upgrade ${JSON.stringify(acct)}`);

  // a workshop: take what is ready, then make something (the question first), sleep, take it
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('.fwork.ready >> nth=0');
  const made = await page.evaluate(() => MQ.state.farm.stats.made);
  if (made !== 1) errors.push(`${tag}: took ${made} from the workshop`);
  await page.evaluate(() => { const f = MQ.state.farm; f.basket.strawberry = 8; MQ.store.save(); MQ.app.go('farm'); });
  await page.click('.fwork[data-arg=jamkitchen]');
  await page.waitForSelector('#modal .fitems');
  await snap('20-workshop');
  await page.click('#modal [data-act=fMake][data-arg="jamkitchen:0"]');
  await page.waitForSelector('.fplay #fanswer');
  await snap('21-worth');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fwork.busy[data-arg=jamkitchen]');
  await page.click('[data-act=fSleep]');
  await page.waitForSelector('#modal');
  await page.click('#modal [data-act=closeModal]');
  await page.click('.fwork.ready[data-arg=jamkitchen]');
  const jam = await page.evaluate(() => MQ.state.farm.basket.jam || 0);
  if (jam < 1) errors.push(`${tag}: no jam after a night`);

  // version 3: upgrade a bed in the shop, plant every empty bed with one payment, pick all, hire the farmhand
  await page.evaluate(() => { const f = MQ.state.farm; f.money += 5000; f.beds.forEach((b) => Object.assign(b, { c: null, g: 0 })); f.beds[0] = { c: 'carrot', g: 9, u: 0 }; f.beds[1] = { c: 'tomato', g: 9, u: 0 }; MQ.store.save(); });
  await page.click('[data-act=go][data-arg="farm:shop"]');
  await page.click('[data-act=fTab][data-arg=up]');
  await page.waitForSelector('.fitems');
  await snap('22-upgrades');
  await page.click('[data-act=fBuy][data-arg="bedup:0"]');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fitems');
  if ((await page.evaluate(() => MQ.state.farm.beds[0].u)) !== 1) errors.push(`${tag}: bed upgrade not bought`);
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('[data-act=fPickAll]');
  // picked crops fly to the basket as small emoji (another screen's style must not change them)
  const fly = await page.evaluate(() => { const el = document.querySelector('.flyer'); return el && Math.max(el.getBoundingClientRect().width, el.getBoundingClientRect().height); });
  if (fly && fly > 80) errors.push(`${tag}: a picked crop flies ${fly}px big`);
  const picked = await page.evaluate(() => MQ.state.farm.beds.filter((b) => b.c).length);
  if (picked !== 0) errors.push(`${tag}: pick all left ${picked} beds`);
  await page.click('[data-act=fPlantAll]');
  await page.waitForSelector('#modal .fseeds');
  await page.click('#modal [data-act=fPlantAllCrop][data-arg=carrot]');
  await page.waitForSelector('.fpalette');
  await snap('23-plantall');
  const cost = await page.evaluate(() => MQ.farmUI.playing().p.target);
  if (cost !== 6 * (grade === 'k' ? 2 : 15)) errors.push(`${tag}: plant all costs ${cost}`);
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.scene');
  const planted = await page.evaluate(() => MQ.state.farm.beds.filter((b) => b.c === 'carrot').length);
  if (planted !== 6) errors.push(`${tag}: plant all planted ${planted}`);
  await page.click('[data-act=go][data-arg="farm:shop"]');
  await page.click('[data-act=fTab][data-arg=farm]');
  await page.click('[data-act=fBuy][data-arg=helper]');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=fNext]');
  await page.click('[data-act=go][data-arg=farm]');
  await page.waitForSelector('.fhelp');
  await snap('24-farmhand');
  await page.click('[data-act=fSleep]');
  await page.waitForSelector('#modal');
  const morning = await page.evaluate(() => document.querySelector('#modal').textContent);
  if (!/Sam was paid/.test(morning)) errors.push(`${tag}: no farmhand in the morning card: ${morning}`);
  await page.click('#modal [data-act=closeModal]');

  // Big Dreams: the intro, paying the builders from the bank (a question), built overnight, its money on bank day
  {
    const k = grade === 'k', bal0 = k ? 150 : 3000, cost = k ? 100 : 2500, pay = k ? 12 : 300;
    await page.evaluate((b) => { const f = MQ.state.farm; f.dream = { p: 0, s: 0, b: false, seen: false }; f.bank.pend = []; f.bank.bal = b; f.day = 20; MQ.store.save(); MQ.app.go('farm'); }, bal0);
    await page.waitForSelector('#modal [data-act=go][data-arg="farm:dreams"]');
    await snap('26-dream-intro');
    await page.click('#modal [data-act=go][data-arg="farm:dreams"]');
    await page.waitForSelector('.fdreams .dbuild');
    await snap('27-dreams');
    await page.click('[data-act=fBuild]');
    await page.waitForSelector('.fplay #fanswer');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    const paid = await page.evaluate(() => ({ bal: MQ.state.farm.bank.bal, b: MQ.state.farm.dream.b }));
    if (paid.bal !== bal0 - cost || !paid.b) errors.push(`${tag}: paying the builders ${JSON.stringify(paid)}`);
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.fdreams .dnote.work');
    await page.click('[data-act=go][data-arg=farm]');
    await page.waitForSelector('.fdream');
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal .dbuilt');
    await snap('28-dream-built');
    await page.click('#modal [data-act=closeModal]');
    if (!(await page.$('.dreamland .dl'))) errors.push(`${tag}: the built orchard is not on the farm`);
    await page.evaluate(() => { const F = MQ.farm, f = MQ.state.farm; while (!F.bankDue(f)) F.nextDay(f, MQ.state.grade); MQ.store.save(); MQ.app.go('farm:bank'); });
    await page.waitForSelector('.fbank .fdreamjar');
    const before = await page.evaluate(() => MQ.state.farm.bank.bal);
    await page.click('[data-act=fInterest]');
    let asked = 0, sawIncome = false;
    while (asked < 4) {
      await page.waitForSelector('.fplay #fanswer');
      if (await page.evaluate(() => /buildings/.test(MQ.farmUI.playing().label || ''))) sawIncome = true;
      await answer(page, true);
      await page.waitForSelector('.fb.ok');
      asked++;
      await page.click('[data-act=fNext]');
      if (await page.waitForSelector('.fbank', { timeout: 1500 }).then(() => true, () => false)) break;
    }
    const got = await page.evaluate(() => ({ bal: MQ.state.farm.bank.bal, inc: MQ.state.farm.stats.dreamIn, due: MQ.farm.bankDue(MQ.state.farm) }));
    const int = await page.evaluate((b) => MQ.farm.interest(b, MQ.state.grade, MQ.state.farm.bank.acct), before);
    if (!sawIncome || got.inc !== pay || got.due || got.bal !== before + int + pay) errors.push(`${tag}: bank day with the orchard ${JSON.stringify({ got, before, int, sawIncome })}`);
    await snap('29-dream-bank');
  }
  // the traveling merchant: he arrives in the morning of his bank week with two week charms and (on his first visit) a
  // rare treasure; the wagon card opens them. Buy the treasure, then Mythic Feed: the pen's animals turn mythic.
  {
    await page.evaluate(() => { const f = MQ.state.farm; f.day = 14; f.merchant = null; f.treasure = {}; f.charms = {}; f.money += 30000; MQ.store.save(); MQ.app.go('farm'); });
    await page.waitForSelector('.fdream');
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal .mline');
    await page.click('#modal [data-act=closeModal]');
    await page.waitForSelector('.fmerchant');
    await snap('30-merchant');
    await page.click('.fmerchant');
    await page.waitForSelector('#modal .mcharm [data-act=fBuyCharm]');
    await page.waitForSelector('#modal [data-act=fBuyTreasure]');
    await snap('31-treasure');
    const visit = await page.evaluate(() => ({ id: MQ.farm.merchantNow(MQ.state.farm), m: MQ.state.farm.merchant }));
    await page.click('#modal [data-act=fBuyTreasure]');
    await page.waitForSelector('.fpalette');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
    const after = await page.evaluate((x) => ({ got: !!MQ.state.farm.treasure[x], card: !!document.querySelector('.fmerchant'), sprite: !!document.querySelector('.trs.tr-' + x) }), visit.id);
    if (!visit.id || !after.got || !after.card || !after.sprite) errors.push(`${tag}: buying ${visit.id} from the merchant ${JSON.stringify(after)}`);
    if (!visit.m.charms.includes('myth') || !visit.m.a) errors.push(`${tag}: his first visit brings Mythic Feed ${JSON.stringify(visit.m)}`);
    await page.click('.fmerchant');
    await page.waitForSelector('#modal [data-act=fBuyCharm][data-arg=myth]');
    await page.click('#modal [data-act=fBuyCharm][data-arg=myth]');
    await page.waitForSelector('.fpalette');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
    const myth = await page.evaluate((a) => ({ on: MQ.farm.mythOn(MQ.state.farm, a), pen: !!document.querySelector(`.fpen.myth.a-${a} svg.myth`), strip: !!document.querySelector('.fcharm.c-myth') }), visit.m.a);
    if (!myth.on || !myth.pen || !myth.strip) errors.push(`${tag}: Mythic Feed for ${visit.m.a} ${JSON.stringify(myth)}`);
    await page.evaluate(() => document.querySelector('.fpen.myth').scrollIntoView({ block: 'center' }));
    await snap('32-mythic');
    // collecting mythic things: they fly to the basket and "+3" floats up with the glowing icon (not its HTML)
    const pen = await page.evaluate((a) => { const f = MQ.state.farm, i = f.pens.findIndex((p) => p.a === a); f.pens[i].rare = 3; MQ.store.save(); MQ.farmUI.redraw(); return i; }, visit.m.a);
    await page.click(`.fpen[data-arg="${pen}"]`, { force: true });
    await page.waitForSelector('.ftext');
    const float = await page.evaluate(() => [...document.querySelectorAll('.ftext')].map((d) => ({ text: d.textContent, glow: !!d.querySelector('.mye') })));
    if (!float.some((x) => x.glow) || float.some((x) => /class=|</.test(x.text))) errors.push(`${tag}: collecting mythic things ${JSON.stringify(float)}`);
    // the week is over: the morning card says what it cost and brought, and asks whether it paid off
    await page.evaluate(() => { const c = MQ.state.farm.charms.myth; c.until = MQ.state.farm.day + 1; c.gain = c.cost * 3; MQ.store.save(); MQ.app.go('farm'); });
    await page.waitForSelector('.scene');
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal .mcend [data-act=fProfit]');
    await page.click('#modal [data-act=fProfit]');
    await page.waitForSelector('.fplay #fanswer');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    const end = await page.evaluate(() => ({ wins: MQ.state.farm.stats.charmWins, on: MQ.farm.charmOn(MQ.state.farm, 'myth') }));
    if (end.wins !== 1 || end.on) errors.push(`${tag}: the Mythic Feed week ended ${JSON.stringify(end)}`);
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
  }
  // the locked deposit (2nd grade): offered once the savings pass the account limit; lock, wait 4 bank weeks, collect
  if (grade !== 'k') {
    await page.evaluate(() => { const f = MQ.state.farm; f.bank.pend = []; f.bank.bal = 25000; f.bank.acct = 0; f.dep = { ok: false, amt: 0, until: 0 }; MQ.store.save(); MQ.app.go('farm:bank'); });
    await page.waitForSelector('.fdep [data-act=fDepLock]');
    await snap('32-deposit');
    const amt = await page.evaluate(() => +document.querySelector('.fdep-pick b').textContent.replace(/[$,.]/g, ''));
    await page.click('[data-act=fDepAmt][data-arg="1"]');
    await page.click('[data-act=fDepLock]');
    await page.waitForSelector('.fplay #fanswer');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.fdep.locked');
    const dep = await page.evaluate(() => ({ bal: MQ.state.farm.bank.bal, d: MQ.state.farm.dep }));
    if (amt !== 20000 || dep.d.amt !== 20500 || dep.bal !== 4500) errors.push(`${tag}: locking ${amt} → ${JSON.stringify(dep)}`);
    await snap('33-deposit-locked');
    await page.evaluate(() => { const F = MQ.farm, f = MQ.state.farm; while (!F.depositReady(f)) { F.nextDay(f, 'g2'); while (F.bankDue(f)) { F.payInterest(f, 'g2'); F.payIncome(f); } } MQ.store.save(); MQ.app.go('farm:bank'); });
    const bal = await page.evaluate(() => MQ.state.farm.bank.bal);
    await page.click('[data-act=fDepCollect]');
    await page.waitForSelector('.fplay #fanswer');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.fbank');
    const back = await page.evaluate(() => ({ bal: MQ.state.farm.bank.bal, amt: MQ.state.farm.dep.amt }));
    if (back.amt || back.bal !== bal + 24600) errors.push(`${tag}: collecting the deposit ${JSON.stringify(back)} (bank was ${bal})`);
  }

  // the order board: the intro the first time; what an order needs stays in the basket (the stand sells only the
  // rest); delivering it is a money question and it pays more than the stand; saying no; a new order in the morning
  {
    await page.evaluate(() => { const f = MQ.state.farm; Object.assign(f, { orders: { seen: false, n: 0, list: [] }, basket: {}, charms: {}, merchant: null }); f.dream.b = false; MQ.store.save(); MQ.app.go('farm'); });
    await page.waitForSelector('#modal [data-act=fOrders]');
    await snap('34-orders-intro');
    await page.click('#modal [data-act=fOrders]');
    await page.waitForSelector('#modal .ocard');
    const o = await page.evaluate(() => {
      const f = MQ.state.farm, o = f.orders.list[0], used = new Set(f.orders.list.flatMap((x) => Object.keys(x.items)));
      const extra = ['carrot', 'egg', 'honey', 'tomato', 'corn', 'potato'].find((id) => !used.has(id));
      f.basket = Object.assign({ [extra]: 2 }, o.items);
      MQ.store.save(); MQ.farmUI.redraw();
      return { n: o.n, pay: o.pay, items: o.items, extra, count: f.orders.list.length };
    });
    if (o.count !== 2) errors.push(`${tag}: the board starts with ${o.count} orders`);
    await page.click('#modal [data-act=closeModal]');
    await page.waitForSelector('.forders .forder.ready');
    const strip = await page.evaluate(() => ({ stand: document.querySelector('.fstand').textContent, kept: document.querySelectorAll('.fbasket .fkept').length }));
    if (!/2 to sell/.test(strip.stand) || strip.kept < 1) errors.push(`${tag}: the basket with an order ${JSON.stringify(strip)}`);
    await page.evaluate(() => document.querySelector('.forders').scrollIntoView({ block: 'center' }));
    await snap('35-order-strip');
    // the stand sells the 2 other things and leaves the order's things in the basket
    await page.click('[data-act=fMarket]');
    let guard = 0;
    while ((await page.$('.fplay')) && guard++ < 6) {
      await answer(page, true);
      await page.waitForSelector('.fb.ok');
      if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
      await page.click('[data-act=fNext]');
    }
    await page.waitForSelector('.result');
    const left = await page.evaluate((x) => ({ extra: MQ.state.farm.basket[x.extra] || 0, kept: Object.entries(x.items).every(([id, n]) => MQ.state.farm.basket[id] === n) }), o);
    if (left.extra || !left.kept) errors.push(`${tag}: the stand and the order's things ${JSON.stringify(left)}`);
    // deliver it
    await page.click('[data-act=go][data-arg=farm]');
    await page.click('.forder.ready');
    await page.waitForSelector(`#modal [data-act=fDeliver][data-arg="${o.n}"]`);
    await snap('36-order-board');
    await page.click(`#modal [data-act=fDeliver][data-arg="${o.n}"]`);
    await page.waitForSelector('.fplay #fanswer');
    await snap('37-order-deliver');
    const before = await page.evaluate(() => MQ.state.farm.money);
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    const done = await page.evaluate((n) => ({ money: MQ.state.farm.money, orders: MQ.state.farm.stats.orders, on: MQ.state.farm.orders.list.some((x) => x.n === n), basket: MQ.farm.basketCount(MQ.state.farm) }), o.n);
    if (done.money !== before + o.pay || done.orders !== 1 || done.on || done.basket) errors.push(`${tag}: delivering the order ${JSON.stringify(done)} (pays ${o.pay}, money was ${before})`);
    await snap('38-order-paid');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
    // say no to the other one, then a new order comes in the morning
    await page.click('.forder');
    await page.click('#modal [data-act=fOrderNo] >> nth=0');
    await page.click('#modal [data-act=fOrderDrop]');
    await page.waitForSelector('#modal .mtitle');
    if ((await page.evaluate(() => MQ.state.farm.orders.list.length)) !== 0) errors.push(`${tag}: saying no left an order`);
    await page.click('#modal [data-act=closeModal]');
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal');
    if (!/New order/.test(await page.textContent('#modal'))) errors.push(`${tag}: no new order in the morning card`);
    await snap('39-order-morning');
    await page.click('#modal [data-act=closeModal]');
    if ((await page.evaluate(() => MQ.state.farm.orders.list.length)) !== 1) errors.push(`${tag}: one new order a morning`);
  }

  // farm supplies: buy Grow-Fast and rent a field in the shop (paying), plant a rented bed, then both end one
  // morning: the field goes back, and the card asks whether Grow-Fast paid off
  {
    await page.evaluate(() => { const f = MQ.state.farm; f.boosts = {}; f.money += 100000; f.beds = f.beds.filter((b) => !b.rent).map((b) => Object.assign(b, { c: null, g: 0 })); MQ.store.save(); MQ.app.go('farm:shop'); });
    await page.click('[data-act=fTab][data-arg=supply]');
    await page.waitForSelector('.mcharm.c-boost [data-act=fBuyBoost][data-arg=grow]');
    await snap('40a-supplies');
    for (const id of ['grow', 'field']) {
      await page.click(`[data-act=fBuyBoost][data-arg=${id}]`);
      await answer(page, true);
      await page.waitForSelector('.fb.ok');
      await page.click('[data-act=fNext]');
      await page.waitForSelector('.mcharms');
    }
    const on = await page.evaluate(() => ({ b: Object.keys(MQ.state.farm.boosts), rented: MQ.state.farm.beds.filter((x) => x.rent).length }));
    if (on.b.join() !== 'grow,field' || on.rented !== 2) errors.push(`${tag}: buying supplies ${JSON.stringify(on)}`);
    await page.click('[data-act=go][data-arg=farm]');
    await page.waitForSelector('.fcharm.c-boost');
    if ((await page.$$('.fbed.rented')).length !== 2) errors.push(`${tag}: the rented beds are not on the farm`);
    await page.click('.fbed.rented >> nth=0', { force: true });
    await page.waitForSelector('#modal .fseeds');
    await snap('40b-rented-bed');
    await page.click('#modal [data-act=fPlant][data-arg="6:carrot"]');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
    if ((await page.evaluate(() => MQ.state.farm.beds[6].c)) !== 'carrot') errors.push(`${tag}: planting the rented bed`);
    await page.evaluate(() => document.querySelector('.fbed.rented').scrollIntoView({ block: 'center' }));
    await snap('40c-rented-field');
    await page.evaluate(() => { const f = MQ.state.farm; f.boosts.grow.until = f.day + 1; f.boosts.grow.gain = f.boosts.grow.cost * 3; f.boosts.field.until = f.day + 1; MQ.store.save(); MQ.app.go('farm'); });
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal .mcend.c-boost [data-act=fProfit]');
    await snap('40d-supply-over');
    const end = await page.evaluate(() => ({ t: document.querySelector('#modal').textContent, beds: MQ.state.farm.beds.length, boosts: Object.keys(MQ.state.farm.boosts).length }));
    if (!/rented field went back/.test(end.t) || end.beds !== 6 || end.boosts) errors.push(`${tag}: the supplies' last morning ${JSON.stringify(end)}`);
    await page.click('#modal .mcend.c-boost [data-act=fProfit]');
    await page.waitForSelector('.fplay #fanswer');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    if ((await page.evaluate(() => MQ.state.farm.stats.boostWins)) < 1) errors.push(`${tag}: Grow-Fast did not count as paid off`);
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.scene');
  }

  // the barnyard: build the henhouse (pay in the shop), feed it on the farm, then move a pen's chickens into it
  {
    await page.evaluate(() => { const f = MQ.state.farm; f.yard = {}; f.pens[0] = { a: 'chicken', g: 9, fed: true, ready: 0, u: 1 }; f.money += 100000; f.feed += 50; f.helper.on = false; MQ.store.save(); MQ.app.go('farm'); }); // Sam would collect the eggs himself
    await page.waitForSelector('.byard .fhouse.buy[data-arg=chicken]');
    if ((await page.$$('.byard .fhouse')).length !== 6) errors.push(`${tag}: the barnyard does not show 6 houses`);
    await page.evaluate(() => document.querySelector('.byard').scrollIntoView({ block: 'center' }));
    await snap('40-barnyard-empty');
    await page.click('.fhouse.buy[data-arg=chicken]');
    await page.waitForSelector('.fyard');
    await snap('41-barnyard-shop');
    await page.click('[data-act=fBuy][data-arg="house:chicken"]');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.fitems');
    if (!(await page.evaluate(() => !!MQ.state.farm.yard.chicken))) errors.push(`${tag}: the henhouse was not built`);
    await page.click('[data-act=go][data-arg=farm]');
    await page.click('.fhouse.hungry[data-arg=chicken]');
    await page.waitForSelector('.fhouse.fed[data-arg=chicken]');
    // the pen's chickens: Sell offers to move them into the henhouse
    await page.click('.fpen[data-arg="0"]', { force: true });
    await page.click('#modal [data-act=fSellAsk][data-arg="0"]');
    await page.waitForSelector('#modal [data-act=fMove]');
    await snap('42-move-or-sell');
    await page.click('#modal [data-act=fMove]');
    await page.waitForSelector('#modal .mtitle');
    const moved = await page.evaluate(() => ({ pen: MQ.state.farm.pens[0].a, n: MQ.farm.penCount(MQ.state.farm.yard.chicken), fed: MQ.state.farm.yard.chicken.fed, t: document.querySelector('#modal').textContent }));
    if (moved.pen !== null || moved.n !== 3 || !moved.fed || !/Moved/.test(moved.t)) errors.push(`${tag}: moving chickens into the henhouse ${JSON.stringify(moved)}`);
    await page.click('#modal [data-act=closeModal]');
    await page.evaluate(() => document.querySelector('.byard').scrollIntoView({ block: 'center' }));
    await snap('43-barnyard');
    // a night: the henhouse lays, Collect all takes it
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal');
    await page.click('#modal [data-act=closeModal]');
    await page.waitForSelector('.fhouse.ready[data-arg=chicken]');
    const eggs = await page.evaluate(() => MQ.state.farm.basket.egg || 0);
    await page.click('[data-act=fCollectAll]');
    if ((await page.evaluate(() => MQ.state.farm.basket.egg || 0)) !== eggs + 6) errors.push(`${tag}: Collect all did not take the henhouse eggs`);
  }

  // the market shift and Mila: hire her in the shop, serve a shift of 10, let her sell the rest, her money in the morning
  {
    await page.evaluate(() => { const f = MQ.state.farm; f.money += 5000; f.basket = { egg: 90, milk: 30, carrot: 40, tomato: 30 }; f.orders.list = []; f.customers = 0; f.shift = { day: f.day, n: 0, right: 0, earned: 0 }; MQ.store.save(); });
    await page.click('[data-act=go][data-arg="farm:shop"]');
    await page.click('[data-act=fTab][data-arg=farm]');
    await page.click('[data-act=fBuy][data-arg=mgr]');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.fitems');
    if (!(await page.evaluate(() => MQ.state.farm.mgr.hired))) errors.push(`${tag}: Mila was not hired`);
    await page.click('[data-act=go][data-arg=farm]');
    await page.waitForSelector('.fmgr');
    await snap('44-shift-card');
    await page.click('.fstand');
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('.fplay #fanswer');
      const st = await page.evaluate(() => ({ status: document.querySelector('.pstatus').textContent, p: MQ.farmUI.playing().p, now: MQ.farm.tierNow(MQ.state.farm, MQ.state.grade) }));
      if (!st.status.includes(`customer ${i + 1} of 10`)) errors.push(`${tag}: shift status "${st.status}"`);
      if (i === 0 && !st.p.vip && st.p.tier !== Math.max(1, st.now - 1)) errors.push(`${tag}: the first customer of the shift brought tier ${st.p.tier}, not one easier than ${st.now}`);
      if (i === 0) await snap('45-shift');
      await answer(page, i !== 3); // one miss: 9 of 10 right on the first try
      if (i === 3) { await page.waitForSelector('.fb.hint'); await answer(page, true); }
      await page.waitForSelector('.fb.ok');
      if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
      if (i < 9) await page.click('[data-act=fNext]');
    }
    // the shift's last customer: it waits (stop or go on)
    await page.waitForTimeout(2000);
    const done = await page.evaluate(() => ({ fb: document.querySelector('.fb.ok').textContent, quit: !!document.querySelector('#fanswer [data-act=fQuit]'), still: !!document.querySelector('.fplay'), stars: MQ.farm.shiftStars(MQ.state.farm) }));
    if (!/Shift done/.test(done.fb) || !done.quit || !done.still || done.stars !== 3) errors.push(`${tag}: after the shift ${JSON.stringify(done)}`);
    await snap('46-shift-done');
    await page.click('#fanswer [data-act=fQuit]');
    await page.waitForSelector('.result .fmgrbox [data-act=fMgrSell]');
    await snap('47-mila-choice');
    const rest = await page.evaluate(() => ({ n: MQ.farm.saleCount(MQ.state.farm), value: MQ.farm.standValue(MQ.farm.forSale(MQ.state.farm), MQ.state.grade) }));
    await page.click('.result [data-act=fMgrSell]');
    await page.waitForSelector('.farm .fmgr [data-act=fMgrStay]');
    if (!(await page.evaluate(() => MQ.farm.mgrTonight(MQ.state.farm)))) errors.push(`${tag}: Mila doesn't sell tonight`);
    await snap('48-mila-tonight');
    await page.click('[data-act=fSleep]');
    await page.waitForSelector('#modal [data-act=fMgrCollect]');
    await snap('49-mila-morning');
    const night = await page.evaluate((v) => ({ pend: MQ.state.farm.mgr.pend, money: MQ.state.farm.money, keep: MQ.farm.mgrKeep(v, 10, MQ.state.grade) }), rest.value);
    if (!night.pend || night.pend.n !== rest.n || night.pend.sold !== rest.value || night.pend.kept !== night.keep) errors.push(`${tag}: Mila's night ${JSON.stringify(night)} (rest ${JSON.stringify(rest)})`);
    await page.click('#modal [data-act=fMgrCollect]');
    await page.waitForSelector('.fplay #fanswer');
    await snap('50-mila-question');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    const paidMila = await page.evaluate(() => ({ money: MQ.state.farm.money, pend: MQ.state.farm.mgr.pend }));
    if (paidMila.pend || paidMila.money !== night.money + night.pend.sold - night.pend.kept) errors.push(`${tag}: Mila's money ${JSON.stringify(paidMila)} (before ${night.money})`);
    await page.click('[data-act=fNext]');
    await page.waitForSelector('.farm .fbed');
    if (await page.$('.fmgr.hot')) errors.push(`${tag}: Mila's card still waits after collecting`);
  }

  // reloading keeps the farm; the home tile shows it
  await page.reload();
  await page.waitForSelector('.t-farm');
  const kept = await page.evaluate(() => MQ.state.farm.stats.jobs);
  if (kept !== 4) errors.push(`${tag}: farm not saved`);
  await page.click('.t-farm');
  if (!(await page.$('.bar [data-act=go][aria-label=Back]'))) errors.push(tag + ': no back button on the farm');
  // grown-up preview: through the grown-ups lock, the farm opens as a level-60 farm; nothing is saved
  const real = await page.evaluate(() => JSON.stringify(MQ.state.farm));
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=parent]');
  const [ga, gb] = await page.evaluate(() => document.querySelector('.eqline').textContent.match(/\d+/g).map(Number));
  await page.fill('#gate-in', String(ga * gb));
  await page.click('[data-act=gate]');
  await page.click('[data-act=startPreview]');
  await page.evaluate(() => MQ.app.go('farm'));
  await page.waitForSelector('.pvlevels [data-act=fPvTier]');
  await snap('25-preview-farm');
  const pv = await page.evaluate(() => ({ lv: MQ.farm.level(MQ.state.farm.xp).level, decor: Object.keys(MQ.state.farm.owned).length }));
  if (pv.lv !== 60 || pv.decor < 20) errors.push(`${tag}: preview farm ${JSON.stringify(pv)}`);
  await page.click('[data-act=fPvTier][data-arg="1"]');
  await page.click('[data-act=fMarket]');
  await page.waitForSelector('.fplay #fanswer');
  const t = await page.evaluate(() => MQ.farmUI.playing().p.tier);
  if (t > 2) errors.push(`${tag}: preview tier 1 brought tier ${t}`);
  await answer(page, false);
  await answer(page, false);
  await page.waitForSelector('.fb.reveal');
  await page.click('[data-act=fNext]');
  await page.waitForSelector('.fplay #fanswer');
  if ((await page.evaluate(() => MQ.state.farm.tier)) !== 1) errors.push(`${tag}: preview tier moved after misses`);
  await page.click('[data-act=fQuit]');
  await page.click('.pvbar [data-act=exitPreview]');
  await page.waitForSelector('.home');
  const back = await page.evaluate(() => JSON.stringify(MQ.state.farm));
  if (back !== real) errors.push(`${tag}: the preview changed the real farm`);
  // For grown-ups: the farm's shift length and problems ahead of the grade
  await page.click('[data-act=go][data-arg=parent]');
  {
    const [a, b] = await page.evaluate(() => document.querySelector('.eqline').textContent.match(/\d+/g).map(Number));
    await page.fill('#gate-in', String(a * b));
    await page.click('[data-act=gate]');
  }
  await page.waitForSelector('[data-act=farmOpt][data-arg="shift:5"]');
  await page.click('[data-act=farmOpt][data-arg="shift:5"]');
  await page.check('[data-act=farmOpt][data-arg=ahead]');
  await snap('51-grownup-farm');
  const opts = await page.evaluate(() => MQ.state.farm.opts);
  if (opts.shift !== 5 || !opts.ahead || opts.mgr === false) errors.push(`${tag}: farm settings ${JSON.stringify(opts)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(tag + ': horizontal overflow');
  await page.close();
}
await play('g2', 'g2-phone', { width: 390, height: 844 });
await play('k', 'k-ipad', { width: 1024, height: 768 });
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Farm smoke test OK');
