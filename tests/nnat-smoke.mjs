// Browser test for NNAT-3 practice: node tests/nnat-smoke.mjs [screenshotDir]
// A 2nd grader opens Test Prep, practices each kind of puzzle, takes the 48-question practice test until the
// 30-minute clock runs out, and sees results by kind and by level; then the two challenge tests (harder levels). Fails on console errors or horizontal overflow.
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

for (const [tag, viewport] of [['phone', { width: 390, height: 844 }], ['ipad', { width: 1024, height: 768 }]]) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name, full = true) => shots && (await page.waitForTimeout(300), page.screenshot({ path: path.join(shots, `nnat-${tag}-${name}.png`), fullPage: full }));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-localonly', '1'); });
  await page.reload();
  await page.fill('#ob-name', 'Mia');
  await page.click('[data-act=pickGrade][data-arg=g2]');
  await page.click('[data-act=createKid]');
  // the GATE plan on the home screen: weeks to the February test and the next step of the district's timeline
  await page.waitForSelector('.gatecard');
  await snap('00-home');
  const tl = await page.evaluate(() => ['2026-10-11', '2026-12-03', '2027-01-20', '2027-02-16', '2027-03-10', '2027-04-20'].map((d) => { const g = MQ.gateTimeline(d); return [g.year, g.step.icon, g.weeks]; }));
  const want = [[2027, '📧', 18], [2027, '📝', 11], [2027, '🔷', 4], [2027, '🍀', 0], [2027, '📬', 0], [2028, '📧', 43]];
  if (JSON.stringify(tl) !== JSON.stringify(want)) errors.push(`${tag}: GATE timeline ${JSON.stringify(tl)}`);
  // the Daily Quest starts with an NNAT warm-up, and NNAT answers count as practice for this week's plan
  await page.click('[data-act=daily]');
  await page.waitForFunction(() => { const s = MQ.app.session(); return s && s.p && !s.locked; });
  const dq = await page.evaluate(() => ({ topic: MQ.app.session().p.topic, goal: MQ.app.session().goal }));
  if (!dq.topic.startsWith('nn_') || dq.goal !== 7) errors.push(`${tag}: Daily Quest warm-up ${JSON.stringify(dq)}`);
  await snap('00b-daily-warmup', false);
  const p0 = await page.evaluate(() => { const s = MQ.app.session(); return { ch: s.p.choices, a: s.p.answer }; });
  await page.click(`.choice >> nth=${p0.ch.indexOf(p0.a)}`);
  await page.waitForFunction(() => MQ.app.session().locked);
  const days = await page.evaluate(() => Object.values(MQ.state.nnatDays || {})[0]);
  if (days !== 1) errors.push(`${tag}: NNAT practice day count ${days}`);
  await page.click('[data-act=quit]');
  if (await page.$('#modal')) await page.click('#modal [data-act=leave]');
  await page.evaluate(() => MQ.app.go('home'));
  await page.click('[data-act=go][data-arg=prep]');
  await page.waitForSelector('.nncard');
  await snap('01-prep');
  // the info box tells the Eureka facts
  await page.click('.nncard [data-act=info]');
  const info = await page.textContent('#modal');
  if (!/NNAT-3/.test(info) || !/98th percentile/.test(info) || !/February/.test(info)) errors.push(`${tag}: NNAT info box: ${info.slice(0, 120)}`);
  await page.click('#modal [data-act=closeModal]');
  // practice by type: one right answer and one wrong for each kind
  await page.click('.nncard [data-act=go][data-arg=nntypes]');
  await page.waitForSelector('.kgtypes [data-act=kgPractice]');
  await snap('02-types');
  for (const t of ['nn_pattern', 'nn_analogy', 'nn_serial', 'nn_spatial']) {
    await page.click(`[data-act=kgPractice][data-arg=${t}]`);
    await page.waitForFunction(() => { const s = MQ.app.session(); return s && s.p && !s.locked; });
    const p = await page.evaluate(() => { const s = MQ.app.session(); return { ch: s.p.choices, a: s.p.answer, n: s.p.choiceHtml.length, topic: s.p.topic }; });
    if (p.n !== 5 || p.topic !== t) errors.push(`${tag}: ${t} practice question ${JSON.stringify(p)}`);
    if (t === 'nn_pattern') await snap('03-practice');
    await page.click(`.choice >> nth=${p.ch.indexOf(p.a)}`);
    await page.waitForFunction(() => MQ.app.session().locked);
    await page.click('[data-act=quit]');
    if (await page.$('#modal')) await page.click('#modal [data-act=leave]');
    await page.evaluate(() => MQ.app.go('nntypes'));
    await page.waitForSelector('.kgtypes [data-act=kgPractice]');
  }
  // the 48-question practice test with the 30-minute clock
  await page.evaluate(() => MQ.app.go('prep'));
  await page.click('[data-act=startContest][data-arg="nnat:timed"]');
  await page.waitForSelector('.contest');
  const ct = await page.evaluate(() => { const c = MQ.app.contest(); return { n: c.items.length, left: c.left, kinds: [...new Set(c.items.map((x) => x.p.topic))].length, first: c.items[0].p.d, last: c.items[c.items.length - 1].p.d }; });
  if (ct.n !== 48 || ct.left !== 1800 || ct.kinds !== 4 || ct.first !== 1 || ct.last !== 6) errors.push(`${tag}: practice test ${JSON.stringify(ct)}`);
  await snap('04-test', false);
  // answer the first 20 (right, except every 5th), then let the clock run out
  for (let i = 0; i < 20; i++) {
    const c = await page.evaluate(() => { const c = MQ.app.contest(); const p = c.items[c.i].p; return { ch: p.choices, a: p.answer }; });
    const k = i % 5 === 4 ? (c.ch.indexOf(c.a) + 1) % 5 : c.ch.indexOf(c.a);
    await page.click(`.choices.ct .choice >> nth=${k}`);
    await page.click('.ctbar [data-act=ctGo] >> nth=1');
  }
  await page.waitForTimeout(1200);
  const ticking = await page.evaluate(() => MQ.app.contest().left);
  if (!(ticking < 1800)) errors.push(`${tag}: the clock does not run (${ticking})`);
  await page.evaluate(() => { MQ.app.contest().left = 2; });
  await page.waitForSelector('.presult', { timeout: 10000 });
  await snap('05-results');
  const res = await page.evaluate(() => MQ.state.tests.contests.slice(-1)[0]);
  if (res.kind !== 'nnat' || res.right !== 16 || res.n !== 48 || res.blank !== 28 || Object.keys(res.levels).length !== 6) errors.push(`${tag}: result ${JSON.stringify({ kind: res.kind, right: res.right, n: res.n, blank: res.blank, levels: res.levels })}`);
  const tiles = await page.$$eval('.sumgrid > div', (els) => els.length);
  if (tiles !== 4) errors.push(`${tag}: ${tiles} result tiles`);
  if (!(await page.$('text=By level'))) errors.push(`${tag}: no results by level`);
  // the two challenge tests: the same 48 puzzles and 30 minutes, only the upper levels (4–7 and 6–8)
  for (const [tier, lo, hi] of [[1, 4, 7], [2, 6, 8]]) {
    await page.evaluate(() => MQ.app.go('prep'));
    await page.click(`.nncard [data-act=startContest][data-arg="nnat:timed:${tier}"]`);
    await page.waitForSelector('.contest');
    const ch = await page.evaluate(() => { const c = MQ.app.contest(); return { tier: c.tier, n: c.items.length, left: c.left, first: c.items[0].p.d, last: c.items[c.items.length - 1].p.d, title: document.querySelector('.ptitle').textContent }; });
    if (ch.tier !== tier || ch.n !== 48 || ch.left !== 1800 || ch.first !== lo || ch.last !== hi || !/challenge/i.test(ch.title)) errors.push(`${tag}: challenge test ${tier} ${JSON.stringify(ch)}`);
    // the hardest puzzles fit on the screen: jump to the last one, answer it, and let the clock run out
    await page.click('.ctnav [data-act=ctGo] >> nth=47');
    const overflowQ = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflowQ) errors.push(`${tag}: challenge test ${tier}: horizontal overflow on a question`);
    await snap(`06-challenge-${tier}`, false);
    const c = await page.evaluate(() => { const c = MQ.app.contest(); const p = c.items[c.i].p; return p.choices.indexOf(p.answer); });
    await page.click(`.choices.ct .choice >> nth=${c}`);
    await page.evaluate(() => { MQ.app.contest().left = 2; });
    await page.waitForSelector('.presult .pr-tier', { timeout: 10000 });
    const r = await page.evaluate(() => MQ.state.tests.contests.slice(-1)[0]);
    if (r.kind !== 'nnat' || r.tier !== tier || r.right !== 1 || Object.keys(r.levels).join() !== Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).join()) errors.push(`${tag}: challenge result ${JSON.stringify({ tier: r.tier, right: r.right, levels: r.levels })}`);
    await snap(`07-challenge-${tier}-results`);
  }
  await page.evaluate(() => MQ.app.go('prep'));
  const lastLine = await page.textContent('.nncard .tc-last');
  if (!/super challenge/.test(lastLine)) errors.push(`${tag}: the card does not name the last challenge test: ${lastLine}`);
  // practice by type goes up to the challenge level 8
  const top = await page.evaluate(() => MQ.NNAT_TOPICS.map((t) => MQ.TOPICS[t].maxD).join());
  if (top !== '8,8,8,8') errors.push(`${tag}: top practice levels ${top}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(tag + ': horizontal overflow');
  await page.close();
}
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('NNAT smoke test OK');
