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
  await page.evaluate(() => { const f = MQ.state.farm; f.xp = 13227; /* 3 XP before level 50 */ f.tier = MQ.farm.tiers(MQ.state.grade).length; f.basket = { honey: 9, milk: 9, pumpkin: 9, egg: 9, truffle: 9, grapes: 9 }; f.customers = 4; f.stand = 3;
    Object.keys(MQ.farm.DECOR).forEach((id) => (f.owned[id] = true));
    f.beds = ['carrot', 'strawberry', 'tomato', 'corn', 'pumpkin', null].map((c, i) => ({ c, g: i % 3 === 0 ? 9 : i % 3, u: i }));
    f.pens = ['chicken', 'bees', 'cow', 'fishpond', 'turkey', 'unicorn'].map((a, i) => ({ a, g: i % 3 === 0 ? 0 : 9, fed: i % 2 === 0, ready: i % 3 === 1 ? 2 : 0, u: i % 4 }));
    Object.keys(MQ.farm.WORKS).forEach((id, i) => (f.works[id] = i % 3 === 2 ? { r: 0, g: 0, ready: 0, out: '' } : i % 3 === 1 ? { r: null, g: 0, ready: 1, out: MQ.farm.WORKS[id].recipes[0].out } : { r: null, g: 0, ready: 0, out: '' }));
    f.bank = { bal: 1234, since: MQ.farm.addDays(MQ.U.dateKey(), -15), log: [] };
    MQ.store.save(); });
  await page.click('[data-act=go][data-arg=farm]');
  await snap('13-bigfarm');
  await page.click('[data-act=fMarket]');
  for (let i = 0; i < 6; i++) {
    await page.waitForSelector('.fplay #fanswer');
    if (i === 0) await snap('14-vip');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    if (await page.$('#modal')) { await snap('15-levelup'); await page.click('#modal [data-act=closeModal]'); }
    if (await page.$('[data-act=fNext]')) await page.click('[data-act=fNext]');
  }
  await page.click('[data-act=fQuit]');
  await page.waitForSelector('.result');
  const vip = await page.evaluate(() => MQ.state.farm.stats.vip);
  if (vip < 1) errors.push(`${tag}: no challenge customer served`);
  // the bank: two bank days waiting (interest questions), then save money and take some out
  await page.click('[data-act=go][data-arg=farm]');
  await page.click('.fbankday');
  await page.waitForSelector('.fbank');
  await snap('16-bank');
  await page.click('[data-act=fInterest]');
  for (let i = 0; i < 2; i++) {
    await page.waitForSelector('.fplay #fanswer');
    if (i === 0) await snap('17-interest');
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    if (await page.$('#modal')) await page.click('#modal [data-act=closeModal]');
    await page.click('[data-act=fNext]');
  }
  await page.waitForSelector('.fbank');
  const bank1 = await page.evaluate(() => MQ.state.farm.bank);
  const want = grade === 'k' ? 1234 + 50 + 50 : 1234 + 120 + 130;
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

  // reloading keeps the farm; the home tile shows it
  await page.reload();
  await page.waitForSelector('.t-farm');
  const kept = await page.evaluate(() => MQ.state.farm.stats.jobs);
  if (kept !== 4) errors.push(`${tag}: farm not saved`);
  await page.click('.t-farm');
  if (!(await page.$('.bar [data-act=go][aria-label=Back]'))) errors.push(tag + ': no back button on the farm');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(tag + ': horizontal overflow');
  await page.close();
}
await play('g2', 'g2-phone', { width: 390, height: 844 });
await play('k', 'k-ipad', { width: 1024, height: 768 });
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Farm smoke test OK');
