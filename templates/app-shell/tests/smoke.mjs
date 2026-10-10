// Browser smoke test: node tests/smoke.mjs   (needs Playwright; uses Chromium)
// Two profiles, a played round, the grown-ups gate and page, preview, back gesture, reload. Fails on any console error.
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright')); }
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, '..', 'index.html');
const errors = [];
const ok = (cond, msg) => { if (!cond) throw new Error('FAILED: ' + msg); console.log('ok -', msg); };

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);

// First profile
await page.fill('#ob-name', 'Mia');
await page.click('[data-act=pickKind][data-arg=older]');
await page.click('[data-act=createProfile]');
ok(await page.isVisible('text=Hi, Mia!'), 'first profile opens its home');

// Play a round, answering right
await page.click('[data-act=play]');
for (let i = 0; i < 5; i++) {
  const ans = await page.evaluate(() => APP.app.session().q.answer);
  await page.click(`[data-act=answer][data-arg="${ans}"]`);
  await page.waitForTimeout(800);
}
ok(await page.isVisible('text=5 of 5 right'), 'round finished');
ok(await page.evaluate(() => APP.state.stats.correct === 5 && APP.state.levels.demo.stars === 3), 'progress recorded');

// Back gesture inside a round asks first
await page.click('[data-act=play]');
await page.goBack();
ok(await page.isVisible('#modal'), 'back during a round asks before leaving');
await page.click('[data-act=leave]');

// Grown-ups gate
await page.click('[data-act=go][data-arg=parent]');
const g = await page.evaluate(() => [...document.querySelector('.eqline').textContent.matchAll(/\d+/g)].map(Number));
await page.fill('#gate-in', '1');
await page.click('[data-act=gate]');
ok(await page.isVisible('text=Not quite'), 'wrong answer keeps the gate closed');
await page.fill('#gate-in', String(g[0] * g[1]));
await page.click('[data-act=gate]');
ok(await page.isVisible('text=Report for'), 'grown-ups page opens');

// Preview saves nothing
await page.click('[data-act=startPreview]');
ok(await page.isVisible('.pvbar'), 'preview bar shows');
await page.click('[data-act=play]');
const ans = await page.evaluate(() => APP.app.session().q.answer);
await page.click(`[data-act=answer][data-arg="${ans}"]`);
await page.waitForTimeout(800);
await page.click('[data-act=exitPreview]');
ok(await page.evaluate(() => APP.state.stats.correct === 5), 'nothing from the preview was saved');

// Second profile and the picker
await page.click('[data-act=go][data-arg=who]');
await page.click('[data-act=go][data-arg=new]');
await page.fill('#ob-name', 'Leo');
await page.click('[data-act=createProfile]');
ok(await page.isVisible('text=Hi, Leo!'), 'second profile opens');
ok(await page.evaluate(() => APP.state.stats.correct === 0), 'profiles do not share progress');
await page.reload();
ok(await page.isVisible('text=Who’s playing?'), 'with two profiles the app asks who is playing');
ok(await page.evaluate(() => { const own = APP.CONFIG.apps.find((a) => a.id === APP.CONFIG.id); const links = [...document.querySelectorAll('.appbtn')].map((a) => a.href);
  return links.length === APP.CONFIG.apps.filter((a) => a.id !== APP.CONFIG.id).length && !(own && links.includes(own.url)); }), 'links to our other apps, not to this one');
await page.click('.profile >> text=Mia');
ok(await page.evaluate(() => APP.state.stats.correct === 5), 'progress survives a reload');

// A link from our other app with a name (#who=) opens that profile; an unknown name offers to add it.
await page.goto('about:blank'); // a link from another app loads the page fresh
await page.goto(url + '#who=mia');
ok(await page.isVisible('text=Hi, Mia!'), '#who= opens the profile with that name');
ok(await page.evaluate(() => location.hash === ''), '#who= is dropped from the address');
ok(await page.evaluate(() => [...document.querySelectorAll('.appbtn')].every((a) => a.href.endsWith('#who=Mia'))), 'links from home carry the name');
await page.goto('about:blank');
await page.goto(url + '#who=Zed');
ok(await page.inputValue('#ob-name') === 'Zed', 'an unknown name opens the new-profile form with the name filled in');

await browser.close();
if (errors.length) { console.error('Console errors:\n' + errors.join('\n')); process.exit(1); }
console.log('smoke test passed');
