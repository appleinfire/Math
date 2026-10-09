// End-to-end check of family sync against the real Firebase project (js/cloud-config.js).
// Two separate browser contexts play the part of two devices.
//   node tests/cloud-e2e.mjs [screenshotDir]
// Creates a test family with a random code; its explorer is deleted at the end
// (the empty family record stays — the rules do not allow deleting families).
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright')); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = process.argv[2];
// The app's files are served straight from disk by Playwright on a made-up https origin
// (a secure context, like GitHub Pages); only Firebase traffic goes over the network.
const ORIGIN = 'https://math.local', URL = ORIGIN + '/index.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); console.log((ok ? '✓ ' : '✗ ') + msg); };

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await pw.chromium.launch({ proxy });
const device = async (tag) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.route(ORIGIN + '/**', (route) => {
    const file = path.join(root, new globalThis.URL(route.request().url()).pathname);
    if (!file.startsWith(root) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ path: file, contentType: TYPES[path.extname(file)] || 'application/octet-stream' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|Failed to load resource|ERR_/.test(m.text()) && errors.push(tag + ' console: ' + m.text()));
  page.snap = (name) => shots && page.screenshot({ path: path.join(shots, `cloud-${tag}-${name}.png`) });
  await page.goto(URL);
  return page;
};
async function solve(page, n) {
  for (let i = 0; i < n; i++) {
    await page.waitForFunction(() => { const s = MQ.app.session(); return document.querySelector('.result') || (s && s.p && !s.locked); });
    if (await page.$('.result')) return;
    const p = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices }; });
    if (p.kind === 'num') { for (const ch of String(p.answer)) await page.click(`[data-act=key][data-arg="${ch}"]`); await page.click('[data-act=submit]'); }
    else await page.click(`.choice >> nth=${p.choices.indexOf(p.answer)}`);
    await page.waitForTimeout(300);
    if (await page.$('[data-act=advance]')) await page.click('[data-act=advance]').catch(() => {});
  }
}
const code = 'e2e-test-' + Math.random().toString(36).slice(2, 8), pin = '4321';
try {
  // ---- Device A: brand new, creates the family
  const A = await device('A');
  await A.waitForSelector('.family');
  await A.snap('1-choose');
  await A.click('[data-act=famMode][data-arg=create]');
  await A.fill('#fam-code', code);
  await A.fill('#fam-pin', pin);
  await A.fill('#fam-pin2', pin);
  await A.snap('2-create');
  await A.click('#fam-go');
  await A.waitForSelector('#ob-name', { timeout: 30000 });
  check(true, 'A: family created');
  await A.fill('#ob-name', 'Ava');
  await A.click('[data-act=createKid]');
  await A.waitForSelector('.home');
  await A.click('.continue');
  await solve(A, 8);
  await A.waitForSelector('.result');
  await A.evaluate(() => MQ.app.go('home'));
  await A.waitForFunction(() => MQ.cloud.status === 'synced', null, { timeout: 30000 });
  await A.snap('3-home-synced');
  check(true, 'A: level finished and synced');

  // ---- Device C: wrong PIN finds nothing
  const Cdev = await device('C');
  await Cdev.waitForSelector('.family');
  await Cdev.click('[data-act=famMode][data-arg=join]');
  await Cdev.fill('#fam-code', code);
  await Cdev.fill('#fam-pin', '9999');
  await Cdev.click('#fam-go');
  await Cdev.waitForFunction(() => document.querySelector('#fam-err').textContent.length > 0, null, { timeout: 30000 });
  check(/No family found/.test(await Cdev.textContent('#fam-err')), 'C: wrong PIN does not open the family');

  // ---- Device B: joins with the same code + PIN and sees the same progress
  const B = await device('B');
  await B.waitForSelector('.family');
  await B.click('[data-act=famMode][data-arg=join]');
  await B.fill('#fam-code', code.toUpperCase());
  await B.fill('#fam-pin', pin);
  await B.click('#fam-go');
  await B.waitForSelector('.home', { timeout: 30000 });
  await B.waitForFunction(() => MQ.cloud.status === 'synced', null, { timeout: 30000 }).then(() => check(true, 'B: status shows synced after joining'), () => check(false, 'B: status shows synced after joining'));
  await B.snap('4-joined');
  const onB = await B.evaluate(() => ({ name: MQ.state.name, levels: MQ.state.levels, creatures: Object.keys(MQ.state.creatures) }));
  check(onB.name === 'Ava' && onB.levels['tide-0'] && onB.creatures.includes('hermit'), 'B: sees Ava with the finished level and the Hermit Crab');

  // ---- A change on B reaches A live, without reloading
  await B.evaluate(() => { MQ.state.crystals += 100; MQ.store.save(); });
  const want = await B.evaluate(() => MQ.state.crystals);
  await A.waitForFunction((w) => MQ.state && MQ.state.crystals === w, want, { timeout: 30000 });
  check(true, 'A: crystals earned on B arrived live');
  await A.waitForFunction((w) => document.querySelector('#gems') && document.querySelector('#gems').textContent === String(w), want, { timeout: 5000 }).then(() => check(true, 'A: home screen redrawn with the new number'), () => check(false, 'A: home screen redrawn with the new number'));

  // ---- Reload B: everything is still there (and comes from the device cache instantly)
  await B.reload();
  await B.waitForSelector('.home');
  check((await B.evaluate(() => MQ.cloud.family && MQ.cloud.family.name)) === code, 'B: stays connected after reload');

  // ---- Device D already has a child played "on this device only", then joins the family
  const D = await device('D');
  await D.waitForSelector('.family');
  await D.click('[data-act=localOnly]');
  await D.fill('#ob-name', 'Mila');
  await D.click('[data-act=pickGrade][data-arg=k]');
  await D.click('[data-act=createKid]');
  await D.waitForSelector('.home');
  await D.click('.continue');
  await solve(D, 8);
  await D.waitForSelector('.result');
  await D.evaluate(() => MQ.app.go('home'));
  await D.click('.foot [data-act=go][data-arg=family]');
  await D.click('[data-act=famMode][data-arg=join]');
  await D.fill('#fam-code', code);
  await D.fill('#fam-pin', pin);
  await D.click('#fam-go');
  await D.waitForSelector('.who-screen', { timeout: 30000 });
  check((await D.$$('.profile:not(.add)')).length === 2, 'D: after joining shows both Ava (from the family) and Mila (from this device)');
  await A.evaluate(() => MQ.app.go('who'));
  await A.waitForFunction(() => document.querySelectorAll('.profile:not(.add)').length === 2, null, { timeout: 30000 }).then(() => check(true, 'A: Mila with her kindergarten progress appears on A live'), () => check(false, 'A: Mila with her kindergarten progress appears on A live'));
  await A.snap('5-who-two-kids');
  const mila = await A.evaluate(() => MQ.store.profiles().find((p) => p.name === 'Mila'));
  check(mila && mila.grade === 'k' && mila.creatures.k_chick, 'A: Mila kept her grade and the Chick she found on D');

  // ---- Clean up the test explorers
  await A.evaluate(() => MQ.store.profiles().forEach((p) => MQ.store.remove(p.id)));
  await B.waitForFunction(() => MQ.store.profiles().length === 0, null, { timeout: 30000 }).then(() => check(true, 'B: deleting on A removes the explorers on B too'), () => check(false, 'B: deleting on A removes the explorers on B too'));
} catch (e) {
  errors.push('crashed: ' + e.message.split('\n')[0]);
} finally {
  await browser.close();
}
if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
console.log('\nCloud sync OK (test family: ' + code + ')');
