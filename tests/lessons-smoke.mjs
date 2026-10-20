// Run: node tests/lessons-smoke.mjs
// Completes Learn modules 1–2 on iPad and phone, including remediation, persistence and grown-up preview.
import { createRequire } from 'module';
import { createServer } from 'http';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright')); }
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..'), errors = [];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, rel);
  if (!file.startsWith(path.resolve(root) + path.sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const executablePath = process.env.CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await pw.chromium.launch({ executablePath });

async function noOverflow(page, where) {
  const size = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  if (size.sw > size.iw + 1) throw new Error(`${where}: horizontal overflow ${size.sw} > ${size.iw}`);
}
async function answer(page, right = true, thenRight = false) {
  const q = await page.evaluate(() => {
    const s = MQ.lessonsUI.session(), q = s.questions[s.qi];
    return { answer: q.p.answer, choices: q.p.choices };
  });
  const i = right ? q.choices.indexOf(q.answer) : q.choices.findIndex((x) => x !== q.answer);
  await page.click(`[data-act=lessonAnswer][data-arg="${i}"]`);
  if (!right && thenRight) {
    await page.waitForSelector('.ls-feedback.hint');
    await page.click(`[data-act=lessonAnswer][data-arg="${q.choices.indexOf(q.answer)}"]`);
  }
  await page.waitForSelector('[data-act=lessonNext]');
  await page.click('[data-act=lessonNext]');
}
async function answerStage(page, n, wrongAt = -1) {
  for (let i = 0; i < n; i++) await answer(page, i !== wrongAt, i === wrongAt);
}
async function beginModule(page, id) {
  await page.click(`[data-module="${id}"]`);
  await page.waitForSelector('.ls-card');
  if ((await page.locator('.ls-speak').count()) !== 1) throw new Error(id + ': no read-aloud button');
  await noOverflow(page, id + ' See it');
  await page.click('[data-act=lessonNext]');
}
async function buildGroups(page) {
  for (let i = 0; i < 12; i++) await page.click(`.ls-build-groups button >> nth=${i % 3}`);
  await page.click('[data-act=lessonNext]');
}
async function buildArray(page) {
  for (let i = 0; i < 15; i++) await page.click('.ls-build-array button:not(.on) >> nth=0');
  await page.click('[data-act=lessonBuild][data-arg=turn]');
  await page.click('[data-act=lessonBuild][data-arg=cut]');
  await page.click('[data-act=lessonNext]');
}
async function openGrownUps(page) {
  await page.click('[data-act=go][data-arg=parent]');
  const eq = await page.locator('.eqline').textContent(), nums = eq.match(/\d+/g).map(Number);
  await page.fill('#gate-in', String(nums[0] * nums[1]));
  await page.click('[data-act=gate]');
  await page.waitForSelector('[data-act=startPreview]');
}

async function run(viewport, tag) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-localonly', '1'); });
  await page.reload();
  await page.fill('#ob-name', 'Sofia');
  await page.click('[data-act=pickGrade][data-arg=g2]');
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.t-learn');
  await noOverflow(page, tag + ' home');

  // All three entry points: the home tile, the trainer link, and (after a Show miss) Fix-it Lab.
  await page.click('[data-act=go][data-arg=trainer]');
  if ((await page.locator('.learn-link').count()) !== 1) throw new Error(tag + ': no Learn button beside Multiply & Divide');
  await page.click('.learn-link');
  await page.waitForSelector('[data-module=groups]');
  if (await page.locator('[data-module=arrays]').isEnabled()) throw new Error(tag + ': module 2 opened too early');

  // Module 1: direct ⭐ path.
  await beginModule(page, 'groups');
  await buildGroups(page);
  await answerStage(page, 1); // Solve together: not recorded.
  await answerStage(page, 4); // Try it.
  await answerStage(page, 2); // Show: both right first try.
  await page.waitForSelector('.ls-finish');
  await page.click('[data-act=go][data-arg=lessons]');
  if (!(await page.locator('[data-module=arrays]').isEnabled())) throw new Error(tag + ': module 2 stayed locked');

  // Module 2: miss in Show, see a different model, then solve two new problems.
  await beginModule(page, 'arrays');
  await buildArray(page);
  await answerStage(page, 1);
  await answerStage(page, 4);
  await answerStage(page, 2, 0);
  await page.waitForSelector('.ls-another');
  await page.click('[data-act=lessonRemedy]');
  await answerStage(page, 2);
  await page.waitForSelector('.ls-finish');
  const state = await page.evaluate(() => ({ lessons: MQ.state.lessons, attempts: MQ.state.stats.attempts, crystals: MQ.state.crystals, review: MQ.state.review }));
  if (!state.lessons.groups.done || !state.lessons.arrays.done || state.attempts !== 14 || !Object.keys(state.review).some((k) => k.startsWith('mult|'))) throw new Error(tag + ': lesson rewards/statistics/progress are wrong');

  await page.click('[data-act=go][data-arg=lessons]');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=fixit]');
  if ((await page.locator('.ls-fix-link').count()) !== 1) throw new Error(tag + ': no lesson link in Fix-it Lab');
  await page.reload();
  await page.waitForSelector('.t-learn');
  await page.click('.t-learn');
  const persisted = await page.evaluate(() => ({ a: MQ.lessons.progress(MQ.state, 'groups'), b: MQ.lessons.progress(MQ.state, 'arrays') }));
  if (!persisted.a.done || !persisted.b.done) throw new Error(tag + ': progress did not survive reload');

  // Grown-up preview opens all modules and writes nothing to the saved profile.
  await page.click('[data-act=go][data-arg=home]');
  await openGrownUps(page);
  const before = await page.evaluate(() => localStorage.getItem('math-expedition-p-' + MQ.state.id));
  await page.click('[data-act=startPreview]');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('.t-learn');
  for (const id of ['groups', 'arrays', 'facts2', 'facts34', 'division', 'families']) if (!(await page.locator(`[data-module="${id}"]`).isEnabled())) throw new Error(tag + ': preview did not open ' + id);
  await page.click('[data-module=families]');
  await page.click('[data-act=lessonNext]');
  await page.click('[data-act=exitPreview]');
  const after = await page.evaluate(() => localStorage.getItem('math-expedition-p-' + MQ.state.id));
  if (before !== after) throw new Error(tag + ': preview changed the saved profile');
  await page.reload();
  await page.waitForSelector('.t-learn');
  const familySaved = await page.evaluate(() => MQ.lessons.progress(MQ.state, 'families'));
  if (familySaved.step || familySaved.done) throw new Error(tag + ': preview lesson progress persisted');
  await noOverflow(page, tag + ' final home');
  await context.close();
  console.log(`  ${tag}: modules, remediation, reload and preview OK`);
}

try {
  await run({ width: 1024, height: 768 }, 'iPad 1024x768');
  await run({ width: 390, height: 844 }, 'phone 390x844');
  if (errors.length) throw new Error('Browser errors:\n' + errors.join('\n'));
  console.log('Learn browser smoke OK');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
