// Browser test for "In class now": node tests/school-smoke.mjs [screenshotDir]
// A grown-up picks the school program and this week's lessons, the home screen shows the tile, a class practice
// asks only those skills, the Daily Quest mixes in 2 of them, and every new picture renders on a phone and an iPad.
import { createRequire } from 'module';
import { createServer } from 'http';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright')); }
const dir = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(dir, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), rel = pathname === '/' ? 'index.html' : pathname.slice(1), file = path.resolve(site, rel);
  if (!file.startsWith(path.resolve(site) + path.sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const shots = process.argv[2];
const errors = [];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined) });

async function answer(page) {
  const p = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices, items: s.p.items, line: s.p.line }; });
  if (p.kind === 'num') { for (const ch of String(p.answer)) await page.click(`[data-act=key][data-arg="${ch}"]`); await page.click('[data-act=submit]'); }
  else if (p.kind === 'choice') await page.click(`.choice >> nth=${p.choices.indexOf(p.answer)}`);
  else if (p.kind === 'multi') { for (const a of p.answer) await page.click(`.choices.multi .choice >> nth=${p.choices.indexOf(a)}`); await page.click('.go-pick'); }
  else if (p.kind === 'order') { for (const a of p.answer) await page.click(`.order-items .choice >> nth=${p.items.indexOf(a)}`); await page.click('.go-pick'); }
  else if (p.kind === 'line') { await page.click(`.tickhit[data-arg="${p.answer}"]`, { force: true }); await page.click('.go-pick'); }
}
const ready = (page) => page.waitForFunction(() => document.querySelector('.result') || (MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked));
async function grownUps(page) {
  await page.evaluate(() => MQ.app.go('parent'));
  const [a, b] = (await page.textContent('.eqline')).match(/\d+/g).map(Number);
  await page.fill('#gate-in', String(a * b));
  await page.click('[data-act=gate]');
  await page.waitForSelector('.classset');
}

async function run(viewport, tag) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name) => { if (shots) { await page.waitForTimeout(450); await page.screenshot({ path: path.join(shots, `${tag}-class-${name}.png`), fullPage: true }); } };
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-localonly', '1'); });
  await page.reload();
  await page.fill('#ob-name', 'Sofia');
  await page.click('[data-act=pickGrade][data-arg=g2]');
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.home');
  if (await page.$('.t-class')) errors.push(tag + ': class tile shows before a grown-up sets it');

  // ---- a grown-up picks Eureka Math, Module 3, Lessons 8–10
  await grownUps(page);
  await snap('01-off');
  await page.click('[data-act=setSchool][data-arg=eureka]');
  await page.click('[data-act=setSchoolUnit][data-arg="3"]');
  await page.click('[data-act=setSchoolPart][data-arg="2"]');
  const set = await page.evaluate(() => MQ.state.settings.school);
  if (set.program !== 'eureka' || set.unit !== 3 || set.part !== 2 || set.at !== (await page.evaluate(() => MQ.U.dateKey()))) errors.push(tag + ': setting not saved ' + JSON.stringify(set));
  const sec = await page.textContent('.classset');
  if (!/Lessons this week/.test(sec) || !/\$1, \$10 and \$100 bills/.test(sec) || !/Lesson 12 Homework/.test(sec)) errors.push(tag + ': grown-ups section text: ' + sec.slice(0, 300));
  if (!(await page.$('.classset [data-act=setSchoolPart][data-arg="2"].sel'))) errors.push(tag + ': chosen lessons not highlighted');
  await snap('02-eureka');

  // ---- the home tile and a class practice of 10 problems, all from these lessons (or earlier ones of Module 3)
  await page.evaluate(() => MQ.app.go('home'));
  const tile = await page.textContent('.t-class');
  if (!/In class now/.test(tile) || !/bills/.test(tile)) errors.push(tag + ': home tile: ' + tile);
  await snap('03-home');
  const gems0 = await page.evaluate(() => MQ.state.crystals);
  await page.click('.t-class');
  const kinds = new Set(), topics = new Set();
  for (let i = 0; i < 10; i++) {
    await ready(page);
    if (await page.$('.result')) break;
    const q = await page.evaluate(() => ({ k: MQ.app.session().p.kindId || '', t: MQ.app.session().p.topic, title: document.querySelector('.pstatus .ptitle').textContent }));
    kinds.add(q.k); topics.add(q.t);
    if (!/In class now/.test(q.title)) errors.push(tag + ': play bar title ' + q.title);
    if (i === 0) await snap('04-play');
    await answer(page);
    await page.click('.fb.ok [data-act=advance]', { timeout: 3000 }).catch(() => {});
  }
  await page.waitForSelector('.result');
  if (![...topics].every((t) => t === 'place') || !kinds.has('pv_bills')) errors.push(tag + ': class practice asked other things: ' + [...topics, ...kinds].join(', '));
  const res = await page.evaluate(() => ({ title: document.querySelector('.result .title').textContent, again: !!document.querySelector('[data-act=classPractice]') }));
  if (res.title !== 'Class practice done!' || !res.again) errors.push(tag + ': result screen ' + JSON.stringify(res));
  if ((await page.evaluate(() => MQ.state.crystals)) <= gems0) errors.push(tag + ': no crystals for class practice');
  await snap('05-done');

  // ---- every new class picture in a real problem card: arrows, place value chart, tape diagram, number bond, bills
  for (const [unit, part, name] of [[4, 0, 'arrows'], [4, 1, 'bundle'], [4, 4, 'take-from-hundred'], [4, 5, 'tape'], [6, 1, 'rows'], [7, 0, 'tally'], [7, 1, 'money'], [7, 5, 'lineplot'], [8, 2, 'time']]) {
    await page.evaluate(([u, p]) => { MQ.state.settings.school = { program: 'eureka', unit: u, part: p, topics: [], at: MQ.U.dateKey() }; MQ.app.go('home'); }, [unit, part]);
    await page.click('.t-class');
    await ready(page);
    await snap('06-' + name);
    await page.click('[data-act=quit]');
    await page.waitForSelector('.home'); // nothing answered yet: straight back home
  }
  await page.evaluate(() => MQ.app.go('home'));
  const bad = await page.evaluate(() => {
    const out = [];
    for (const id of Object.keys(MQ.KINDS)) for (const d of MQ.KINDS[id].ds) for (let i = 0; i < 25; i++) {
      const p = MQ.makeKind(id, d), div = document.createElement('div');
      div.className = 'pcard'; div.innerHTML = `<div class="ptext">${p.text}</div><div class="pvis">${p.visual || ''}</div>`;
      document.body.appendChild(div);
      if (div.scrollWidth > div.clientWidth + 2 && window.innerWidth < 500) out.push(id + ' d' + d + ' is too wide');
      div.remove();
    }
    return [...new Set(out)];
  });
  if (bad.length) errors.push(tag + ': ' + bad.join('; '));

  // ---- the Daily Quest asks 2 questions from class, marked 🏫 Class
  await page.evaluate(() => { MQ.state.settings.school = { program: 'eureka', unit: 3, part: 2, topics: [], at: MQ.U.dateKey() }; MQ.state.settings.gatePlan = false; MQ.state.review = {}; MQ.app.go('home'); });
  await page.click('[data-act=daily]');
  let fromClass = 0, chips = 0;
  for (let i = 0; i < 5; i++) {
    await ready(page);
    if (await page.$('.result')) break;
    const q = await page.evaluate(() => ({ cls: !!MQ.app.session().p.cls, chip: !!document.querySelector('.pcard .dchip.cls') }));
    fromClass += q.cls; chips += q.chip;
    if (q.cls && i === 0) await snap('07-daily-class');
    await answer(page);
    await page.click('.fb.ok [data-act=advance]', { timeout: 3000 }).catch(() => {});
  }
  if (fromClass !== 2 || chips !== 2) errors.push(tag + `: Daily Quest had ${fromClass} class questions (${chips} chips)`);
  await page.waitForSelector('.result');

  // ---- three weeks later: ask whether the class moved on, and move on with one tap
  await page.evaluate(() => { MQ.state.settings.school.at = '2020-01-01'; });
  await grownUps(page);
  if (!(await page.$('.classnote [data-act=schoolNext]'))) errors.push(tag + ': no "moved on?" note after 3 weeks');
  await page.click('[data-act=schoolNext]');
  const nx = await page.evaluate(() => MQ.state.settings.school);
  if (nx.unit !== 3 || nx.part !== 3 || await page.$('.classnote')) errors.push(tag + ': next lessons ' + JSON.stringify(nx));

  // ---- another program: pick topics (up to 3); then off
  await page.click('[data-act=setSchool][data-arg=topics]');
  for (const t of ['time', 'money', 'data', 'shapes']) await page.click(`[data-act=toggleSchoolTopic][data-arg=${t}]`);
  const tp = await page.evaluate(() => MQ.state.settings.school.topics);
  if (tp.join() !== 'money,data,shapes') errors.push(tag + ': topics kept ' + tp.join());
  await snap('08-topics');
  await page.evaluate(() => MQ.app.go('home'));
  if (!/Money · Graphs · Shapes/.test(await page.textContent('.t-class'))) errors.push(tag + ': topics tile ' + (await page.textContent('.t-class')));
  await page.click('.t-class');
  for (let i = 0; i < 4; i++) {
    await ready(page);
    const t = await page.evaluate(() => MQ.app.session().p.topic);
    if (!['money', 'data', 'shapes'].includes(t)) errors.push(tag + ': topics practice asked ' + t);
    await answer(page);
    await page.click('.fb.ok [data-act=advance]', { timeout: 3000 }).catch(() => {});
  }
  await page.click('[data-act=quit]');
  await grownUps(page);
  await page.click('[data-act=setSchool][data-arg=off]');
  await page.evaluate(() => MQ.app.go('home'));
  if (await page.$('.t-class')) errors.push(tag + ': tile still there after Off');

  // ---- kindergarten: no Eureka data, but following the class by topic works
  await page.evaluate(() => { MQ.state.grade = 'k'; MQ.app.go('home'); });
  await grownUps(page);
  if (await page.$('[data-act=setSchool][data-arg=eureka]')) errors.push(tag + ': Eureka offered for kindergarten');
  await page.click('[data-act=setSchool][data-arg=topics]');
  await page.click('.classset [data-act=toggleSchoolTopic] >> nth=0');
  await page.evaluate(() => MQ.app.go('home'));
  if (!(await page.$('.t-class'))) errors.push(tag + ': no class tile for kindergarten topics');
  await snap('09-k-home');

  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) errors.push(tag + ': horizontal overflow');
  await page.close();
}
await run({ width: 390, height: 844 }, 'phone');
await run({ width: 1024, height: 768 }, 'ipad');
await browser.close();
await new Promise((resolve) => server.close(resolve));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('In class now smoke test OK');
