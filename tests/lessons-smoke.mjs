// Run: node tests/lessons-smoke.mjs
// Completes Learn modules 1–2 of Multiply & Divide and module 1 of Add & Subtract on iPad and phone, including
// remediation, persistence, Practice and grown-up preview, and taps through every Build it model.
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
    return { answer: q.p.answer, choices: q.p.choices, stage: s.stage };
  });
  const i = right ? q.choices.indexOf(q.answer) : q.choices.findIndex((x) => x !== q.answer);
  await page.click(`[data-act=lessonAnswer][data-arg="${i}"]`);
  if (!right && thenRight) {
    await page.waitForSelector('.ls-feedback.hint');
    const feedback = (await page.locator('.ls-feedback.hint').textContent()).trim();
    if (q.stage === 4 && feedback !== 'Not quite. Try once more.') throw new Error('Show revealed a hint after the first miss: ' + feedback);
    if (q.stage !== 4 && !feedback.startsWith('Try again.')) throw new Error('guided practice lost its misconception hint: ' + feedback);
    await page.click(`[data-act=lessonAnswer][data-arg="${q.choices.indexOf(q.answer)}"]`);
  }
  await page.waitForSelector('[data-act=lessonNext]');
  await page.click('[data-act=lessonNext]');
}
async function answerStage(page, n, wrongAt = -1) {
  for (let i = 0; i < n; i++) await answer(page, i !== wrongAt, i === wrongAt);
}
async function missShowTwice(page) {
  const q = await page.evaluate(() => {
    const s = MQ.lessonsUI.session(), q = s.questions[s.qi];
    return { answer: q.p.answer, choices: q.p.choices, stage: s.stage };
  });
  if (q.stage !== 4) throw new Error('double-miss check must run in Show');
  const wrong = q.choices.findIndex((x) => x !== q.answer);
  await page.click(`[data-act=lessonAnswer][data-arg="${wrong}"]`);
  const first = (await page.locator('.ls-feedback.hint').textContent()).trim();
  if (first !== 'Not quite. Try once more.') throw new Error('Show revealed a hint after the first miss: ' + first);
  await page.click(`[data-act=lessonAnswer][data-arg="${wrong}"]`);
  const second = (await page.locator('.ls-feedback.answer').textContent()).trim();
  if (!second.startsWith(`The answer is ${q.answer}.`)) throw new Error('Show did not explain the answer after the second miss: ' + second);
  await page.click('[data-act=lessonNext]');
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
  if ((await page.locator('.ls-turn-note').textContent()).trim() !== '3 × 5 = 15 and 5 × 3 = 15: same dots, turned') throw new Error('array turn explanation is missing');
  await page.click('[data-act=lessonBuild][data-arg=cut]');
  if ((await page.locator('.ls-split-note').textContent()).trim() !== '2 × 3 + 3 × 3 = 6 + 9 = 15') throw new Error('array split explanation is missing');
  await page.click('[data-act=lessonNext]');
}
async function backToLessons(page) {
  await page.click('header [data-act=go][data-arg=lessons]');
  await page.waitForSelector('.ls-modules');
}
async function inspectNewBuildModels(page, tag) {
  await beginModule(page, 'facts2');
  if ((await page.locator('.ls-line-build .numline').count()) !== 1) throw new Error(tag + ': facts ×2/×5/×10 has no number line');
  await page.click('.ls-line-build');
  await page.click('.ls-line-build');
  if ((await page.locator('.ls-jump-arcs path').count()) !== 2) throw new Error(tag + ': each tap should draw one number-line jump');
  if (!(await page.locator('.ls-jump-path').textContent()).includes('0 → 2 → 4')) throw new Error(tag + ': number-line jumps are not drawn');
  await noOverflow(page, tag + ' number-line build');
  await backToLessons(page);

  await beginModule(page, 'facts34');
  await page.click('.ls-double-build');
  if ((await page.locator('.ls-double-rows > div').count()) !== 2 || (await page.locator('.ls-double-rows i').count()) !== 8) throw new Error(tag + ': double is not shown as two rows of dots');
  await page.click('.ls-double-build');
  if ((await page.locator('.ls-double-rows i').count()) !== 16) throw new Error(tag + ': double-again model is not drawn');
  await noOverflow(page, tag + ' double build');
  await backToLessons(page);

  await beginModule(page, 'division');
  if ((await page.locator('.ls-share-kids .ls-kid').count()) !== 3 || (await page.locator('.ls-berry-pile button').count()) !== 12) throw new Error(tag + ': sharing model needs three kids and 12 berries');
  for (let i = 0; i < 12; i++) await page.click('.ls-berry-pile button >> nth=0');
  if (!(await page.locator('.ls-good').textContent()).includes('Each kid gets 4')) throw new Error(tag + ': sharing result is missing');
  await page.click('[data-act=lessonBuild][data-arg=startGrouping]');
  if ((await page.locator('.ls-build-prompt').textContent()).trim() !== 'Make groups of 3 from 12') throw new Error(tag + ': grouping model is missing');
  for (let i = 0; i < 12; i++) await page.click('.ls-berry-pile button >> nth=0');
  if ((await page.locator('.ls-model-note').textContent()).trim() !== '4 groups') throw new Error(tag + ': grouping result is missing');
  await noOverflow(page, tag + ' division build');
  await backToLessons(page);
}
// Add & Subtract Build it models: ten-frames and place value disks, each with its own tap path and notes.
const note = async (page) => (await page.locator('.ls-model-note').textContent()).trim();
async function inspectAddSubModels(page, tag) {
  await beginModule(page, 'addtens');
  for (let i = 0; i < 2; i++) await page.click('[data-act=lessonBuild][data-arg=ten]');
  if (!(await page.locator('[data-act=lessonBuild][data-arg=ten]').isDisabled())) throw new Error(tag + ': more than 2 tens can be added to 34');
  for (let i = 0; i < 5; i++) await page.click('[data-act=lessonBuild][data-arg=one]');
  if ((await note(page)) !== '34 + 25 = 5 tens 9 ones = 59' || (await page.locator('.ls-pv .ls-disk.new').count()) !== 7) throw new Error(tag + ': 34 + 25 model');
  await noOverflow(page, tag + ' add tens build');
  await backToLessons(page);

  await beginModule(page, 'bundle');
  for (let i = 0; i < 10; i++) await page.click('.ls-pv button.ls-disk.d1 >> nth=0');
  if ((await note(page)) !== '10 ones make 1 new ten: 47 + 26 = 7 tens 3 ones = 73' || (await page.locator('.ls-pv-col >> nth=0').locator('.ls-disk').count()) !== 7) throw new Error(tag + ': bundling 10 ones');
  await noOverflow(page, tag + ' bundle build');
  await backToLessons(page);

  await beginModule(page, 'unbundle');
  await page.click('.ls-pv button.ls-disk.d1 >> nth=0');
  if (!/Unbundle a ten first/.test(await page.locator('.ls-build-msg').textContent())) throw new Error(tag + ': taking away a one before unbundling is not explained');
  await page.click('.ls-pv button.ls-disk.d10 >> nth=0');
  if ((await page.locator('.ls-pv-col >> nth=1').locator('.ls-disk').count()) !== 12) throw new Error(tag + ': a ten did not become 10 ones');
  for (let i = 0; i < 7; i++) await page.click('.ls-pv-col >> nth=1 >> button.ls-disk >> nth=0');
  for (let i = 0; i < 2; i++) await page.click('.ls-pv-col >> nth=0 >> button.ls-disk >> nth=0');
  if ((await note(page)) !== '52 − 27 = 2 tens 5 ones = 25' || !(await page.locator('[data-act=lessonNext]').count())) throw new Error(tag + ': 52 − 27 model');
  await noOverflow(page, tag + ' unbundle build');
  await backToLessons(page);

  await beginModule(page, 'hundreds');
  await page.click('.ls-pv-col >> nth=1 >> button.ls-disk >> nth=0');
  if (!/Start with the ones/.test(await page.locator('.ls-build-msg').textContent())) throw new Error(tag + ': bundling tens first is not explained');
  await page.click('.ls-pv-col >> nth=2 >> button.ls-disk >> nth=0');
  await page.click('.ls-pv-col >> nth=1 >> button.ls-disk >> nth=0');
  if ((await note(page)) !== '365 + 248 = 6 hundreds 1 ten 3 ones = 613') throw new Error(tag + ': 365 + 248 model');
  await noOverflow(page, tag + ' bundle twice build');
  await backToLessons(page);

  await beginModule(page, 'zeros');
  await page.click('.ls-pv-col >> nth=0 >> button.ls-disk >> nth=0');
  await page.click('.ls-pv-col >> nth=1 >> button.ls-disk >> nth=0');
  if ((await note(page)) !== 'Ready: 3 hundreds 9 tens 10 ones. 400 − 247 = 153' || (await page.locator('.ls-pv-col >> nth=2').locator('.ls-disk').count()) !== 10) throw new Error(tag + ': 400 − 247 model');
  await page.click('[data-act=lessonNext]');
  await page.waitForSelector('.ls-question');
  if (!(await page.locator('.ls-visual svg.pvchart').count())) throw new Error(tag + ': Solve together has no place value chart');
  await noOverflow(page, tag + ' zeros question');
  await backToLessons(page);
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
  await missShowTwice(page);
  await answer(page);
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

  // Add & Subtract: its own module 1 is open, module 2 waits; finish Make a ten, then Practice in Add to 100.
  if ((await page.locator('.ls-intro[data-course]').count()) !== 2) throw new Error(tag + ': Learn does not show both courses');
  if (!(await page.locator('[data-module=maketen]').isEnabled()) || (await page.locator('[data-module=addtens]').isEnabled())) throw new Error(tag + ': Add & Subtract does not start at Make a ten');
  await beginModule(page, 'maketen');
  if ((await page.locator('.ls-frame.two button').count()) !== 5) throw new Error(tag + ': 8 + 5 ten-frames are missing');
  await page.click('.ls-frame.two button >> nth=0');
  await page.click('.ls-frame.two button >> nth=0');
  if ((await note(page)) !== '8 + 5 = 10 + 3 = 13' || (await page.locator('.ls-frame:not(.two) i.on').count()) !== 10) throw new Error(tag + ': the first ten is not full');
  await noOverflow(page, tag + ' ten-frames');
  await page.click('[data-act=lessonNext]');
  await answerStage(page, 1);
  await answerStage(page, 4, 1); // a miss in Try it gets a specific hint
  await answerStage(page, 2);
  await page.waitForSelector('.ls-finish');
  await page.click('[data-act=lessonPractice]');
  const practice = await page.evaluate(() => { const s = MQ.app.session(); return { topics: s.topics, d: s.d, gems: MQ.state.crystals }; });
  if (practice.topics.join() !== 'add100' || practice.d.join() !== '2,2') throw new Error(tag + ': Practice after Make a ten ' + JSON.stringify(practice));
  await page.click('[data-act=quit]');
  await page.click('[data-act=go][data-arg=home]');
  if (!/3 \/ 12/.test(await page.textContent('.t-learn'))) throw new Error(tag + ': home tile does not count both courses: ' + (await page.textContent('.t-learn')));
  await page.click('.t-learn');
  if (!(await page.locator('[data-module=addtens]').isEnabled()) || !(await page.evaluate(() => MQ.state.lessons.maketen.done))) throw new Error(tag + ': Add tens and ones did not open after Make a ten');

  // Grown-up preview opens all modules and writes nothing to the saved profile.
  await page.click('[data-act=go][data-arg=home]');
  await openGrownUps(page);
  const before = await page.evaluate(() => localStorage.getItem('math-expedition-p-' + MQ.state.id));
  await page.click('[data-act=startPreview]');
  await page.click('[data-act=go][data-arg=home]');
  await page.click('.t-learn');
  for (const id of ['groups', 'arrays', 'facts2', 'facts34', 'division', 'families', 'maketen', 'addtens', 'bundle', 'unbundle', 'hundreds', 'zeros']) if (!(await page.locator(`[data-module="${id}"]`).isEnabled())) throw new Error(tag + ': preview did not open ' + id);
  await inspectNewBuildModels(page, tag);
  await inspectAddSubModels(page, tag);
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
