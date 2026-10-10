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
    f.beds = ['carrot', 'strawberry', 'tomato', 'corn', 'pumpkin', 'sunflower', 'watermelon', null].map((c, i) => ({ c, g: i % 3 === 0 ? 9 : i % 3 }));
    f.pens = Object.keys(MQ.farm.ANIMALS).slice(0, 8).map((a, i) => ({ a, g: i % 3 === 0 ? 0 : 9, fed: i % 2 === 0, ready: i % 3 === 1 ? 2 : 0 }));
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
