// Browser smoke test: node tests/smoke.mjs [screenshotDir]
// Plays through onboarding, a level, the trainer, daily quest, hatchery and grown-ups page; fails on any console error.
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
async function run(viewport, tag) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name) => shots && page.screenshot({ path: path.join(shots, `${tag}-${name}.png`), fullPage: true });
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await snap('01-onboard');
  await page.fill('#ob-name', 'Sofia');
  await page.click('[data-act=pickBuddy][data-arg="🐙"]');
  await page.click('[data-act=startGame]');
  await snap('02-home');

  // Solve a level: answer the first problem wrong once (to see the hint), then everything right.
  async function solve(n, { wrongFirst = false } = {}) {
    for (let i = 0; i < n; i++) {
      await page.waitForFunction(() => { const s = MQ.app.session(); return document.querySelector('.result') || (s && s.p && !s.locked); });
      if (await page.$('.result')) return;
      const p = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices }; });
      if (wrongFirst && i === 0) {
        if (p.kind === 'num') { await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=submit]'); }
        else { const w = p.choices.findIndex((c) => c !== p.answer); await page.click(`.choice >> nth=${w}`); }
        await page.waitForTimeout(150);
        if (i === 0) await snap('04-hint');
        const locked = await page.evaluate(() => MQ.app.session().locked);
        if (locked) { await page.click('[data-act=next]'); continue; }
      }
      if (p.kind === 'num') {
        for (const ch of String(p.answer)) await page.click(`[data-act=key][data-arg="${ch}"]`);
        await page.click('[data-act=submit]');
      } else {
        await page.click(`.choice >> nth=${p.choices.indexOf(p.answer)}`);
      }
      await page.waitForTimeout(1500);
    }
  }
  await page.click('.continue');
  await page.waitForSelector('.pcard');
  await snap('03-play');
  await solve(6, { wrongFirst: true });
  await page.waitForSelector('.result');
  await page.waitForTimeout(1800);
  await snap('05-level-done');

  // Visit every topic visually at each difficulty (renders without errors).
  await page.evaluate(() => {
    for (const t of Object.keys(MQ.TOPICS)) for (let d = 1; d <= 5; d++) for (let k = 0; k < 20; k++) {
      const p = MQ.makeProblem(t, d); const div = document.createElement('div'); div.innerHTML = p.text + (p.visual || ''); }
  });

  // Trainer
  await page.click('[data-act=go][data-arg="world:tide"]');
  await page.click('[data-act=go][data-arg=map]');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=trainer]');
  await page.click('[data-act=toggleTopic][data-arg=time]');
  await page.click('[data-act=toggleTopic][data-arg=money]');
  await page.click('[data-act=toggleTopic][data-arg=data]');
  await snap('06-trainer');
  await page.click('[data-act=startTrainer]');
  await solve(3);
  await snap('07-trainer-play');
  await page.click('[data-act=quit]');
  await page.waitForSelector('.sumgrid');
  await snap('08-summary');

  // Daily quest
  await page.click('.result [data-act=go][data-arg=home]');
  await page.click('[data-act=daily]');
  await solve(5);
  await page.waitForSelector('.result');
  await snap('09-daily');

  // Hatchery
  await page.evaluate(() => { MQ.state.crystals += 40; MQ.store.save(); });
  await page.click('.result [data-act=go][data-arg=hatch]');
  await page.click('[data-act=buyEgg]');
  for (let i = 0; i < 3; i++) await page.click('[data-act=tapEgg]', { force: true });
  await page.waitForTimeout(1800);
  await snap('10-hatch');

  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=journal]');
  await snap('11-journal');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=map]');
  await snap('12-map');
  await page.click('.wcard >> nth=0');
  await snap('13-world');
  await page.click('[data-act=go][data-arg=map]');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=badges]');
  await snap('14-badges');

  // Grown-ups
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=parent]');
  const q = await page.textContent('.eqline');
  const [a, b] = q.match(/\d+/g).map(Number);
  await page.fill('#gate-in', String(a * b));
  await page.click('[data-act=gate]');
  await page.waitForSelector('.kpis');
  await snap('15-parent');

  // Show a selection of visual problem types for review
  if (shots) {
    for (const [t, d] of [['time', 3], ['money', 2], ['place', 2], ['shapes', 3], ['measure', 2], ['data', 2], ['logic', 4], ['logic', 5], ['add100', 3], ['mult', 1], ['arrays', 3], ['words', 4]]) {
      await page.evaluate(([t, d]) => { MQ.state.trainer = { topics: [t], diff: d, mode: 'endless' }; }, [t, d]);
      await page.evaluate(() => MQ.app.go('trainer'));
      await page.click('[data-act=startTrainer]');
      await page.waitForSelector('.pcard .ptext');
      await snap(`p-${t}-${d}`);
      await page.evaluate(() => MQ.app.go('home'));
    }
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(tag + ': horizontal overflow');
  await page.close();
}
await run({ width: 390, height: 844 }, 'phone');
await run({ width: 1024, height: 768 }, 'ipad');
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Smoke test OK');
