// Browser test for Shape Puzzles: node tests/shapes-smoke.mjs [screenshotDir]
// A kindergartner (iPad) and a 2nd grader (phone) each finish a shape puzzle (with two misses first), build a picture
// (dragging shapes, one into the wrong place) and a dot-to-dot. Fails on any console error, a stuck screen,
// or crystals, album and daily totals that don't add up.
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
const check = (ok, what) => { if (!ok) errors.push(what); };

async function play(grade, tag, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    const synth = { getVoices: () => [], speak(u) { setTimeout(() => u.onend && u.onend(), 50); }, cancel() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name) => shots && (await page.waitForTimeout(500), page.screenshot({ path: path.join(shots, `shapes-${tag}-${name}.png`), fullPage: true }));
  const G = () => page.evaluate(() => { const g = MQ.shapesUI.playing(); return g && { answer: g.prob.answer, opts: g.prob.opts, left: g.left.length, earn: g.earn, done: g.done, busy: g.busy, mode: g.mode }; });
  const idle = () => page.waitForFunction(() => { const g = MQ.shapesUI.playing(); return g && !g.busy; });
  const state = () => page.evaluate(() => ({ gems: MQ.state.crystals, day: MQ.state.days[MQ.U.dateKey()] || { a: 0, c: 0 }, album: MQ.shapes.count(MQ.state), badges: Object.keys(MQ.state.badges), review: Object.keys(MQ.state.review) }));

  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-localonly', '1'); });
  await page.reload();
  await page.fill('#ob-name', grade === 'k' ? 'Leo' : 'Sofia');
  await page.click(`[data-act=pickGrade][data-arg=${grade}]`);
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.t-shapes');
  await page.click('.t-shapes');
  await page.waitForSelector('.pzhub');
  check((await page.$$('.pzhub .pz-thumb')).length === 16, tag + ': 6 shapes + 5 pictures + 5 mystery dot-to-dots on the album page');
  await snap('01-album');

  // ⭐ a star in 6 pieces: two misses on the first problem (hint, then the answer glows), then all right
  await page.click('[data-act=pzSize][data-arg="6"]');
  await page.click('[data-act=pzPlay][data-arg="shape:star"]');
  await page.waitForSelector('.pz-ans');
  const s0 = await state();
  let g = await G();
  const pieces = g.left;
  const wrongs = g.opts.filter((v) => v !== g.answer);
  await page.click(`.pz-ans[data-arg="${wrongs[0]}"]`);
  await page.waitForSelector('.pz-hint');
  await snap('02-hint');
  await page.click(`.pz-ans[data-arg="${wrongs[1]}"]`);
  await page.waitForSelector('.pz-ans.show');
  await page.click(`.pz-ans[data-arg="${g.answer}"]`);
  let guard = 0;
  while (guard++ < 20) {
    await idle();
    g = await G();
    if (g.done) break;
    if (guard === 3) await snap('03-pieces');
    await page.click(`.pz-ans[data-arg="${g.answer}"]`);
  }
  await page.waitForSelector('.pz-win');
  await snap('04-star-done');
  let s1 = await state();
  // first-try answers: pieces − 1; finished +3, new in the album +5
  check(s1.gems - s0.gems === pieces - 1 + 3 + 5, `${tag}: star crystals ${s1.gems - s0.gems}, expected ${pieces - 1 + 8}`);
  check(s1.day.a - s0.day.a === pieces && s1.day.c - s0.day.c === pieces - 1, `${tag}: daily totals ${JSON.stringify(s1.day)}`);
  check(s1.review.length === 1, `${tag}: the missed skill goes to the Fix-it Lab (${s1.review})`);
  check(s1.album === 1, tag + ': the star is in the album');
  check(await page.waitForFunction(() => !!document.querySelector('.pz-svg.done') && getComputedStyle(document.querySelector('.pz-full')).opacity === '1', null, { timeout: 3000 }).then(() => true, () => false), tag + ': the finished star shows whole');

  // 🏠 a house: the first shape dragged to a wrong place bounces back, then dragged home; the rest are tapped into place
  await page.click('[data-act=go][data-arg=shapes]');
  await page.click('[data-act=pzPlay][data-arg="build:house"]');
  guard = 0;
  let missed = false;
  while (guard++ < 20) {
    await idle();
    g = await G();
    if (g.done) break;
    if (g.earn < 0) { await page.click(`.pz-ans[data-arg="${g.answer}"]`); continue; }
    await page.waitForSelector('.pz-tp');
    if (!missed) {
      await snap('05-got-shape');
      const tp = await (await page.$('.pz-tp')).boundingBox();
      const board = await (await page.$('.pz-svg')).boundingBox();
      const target = await page.evaluate(() => { const g = MQ.shapesUI.playing(), el = document.querySelector(`.pz-part[data-i="${g.earn}"]`).getBoundingClientRect(); return { x: el.x + el.width / 2, y: el.y + el.height / 2 }; });
      // far from its outline: the opposite corner of the board
      const away = { x: target.x < board.x + board.width / 2 ? board.x + board.width - 4 : board.x + 4, y: target.y < board.y + board.height / 2 ? board.y + board.height - 4 : board.y + 4 };
      await page.mouse.move(tp.x + tp.width / 2, tp.y + tp.height / 2);
      await page.mouse.down();
      await page.mouse.move(away.x, away.y, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(600);
      check((await G()).earn >= 0, tag + ': a shape dropped in the wrong place stays in the tray');
      const tp2 = await (await page.$('.pz-tp')).boundingBox();
      await page.mouse.move(tp2.x + tp2.width / 2, tp2.y + tp2.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 8 });
      await page.mouse.up();
      missed = true;
    } else await page.click('.pz-tp');
    await page.waitForFunction(() => MQ.shapesUI.playing().earn < 0);
  }
  await page.waitForSelector('.pz-win');
  check(await page.evaluate(() => document.querySelectorAll('.pz-part .pz-pfill').length === 5 && !document.querySelector('.pz-pslot')), tag + ': every shape of the house is in place');
  await snap('06-house-done');

  // ✏️ a dot-to-dot surprise, then "Next puzzle" brings another one not found yet
  await page.click('[data-act=go][data-arg=shapes]');
  await page.click('[data-act=pzPlay][data-arg=dots]');
  const first = await page.evaluate(() => MQ.shapesUI.playing().item.id);
  guard = 0;
  while (guard++ < 20) {
    await idle();
    g = await G();
    if (g.done) break;
    if (guard === 4) await snap('07-dots');
    await page.click(`.pz-ans[data-arg="${g.answer}"]`);
  }
  await page.waitForSelector('.pz-win');
  check(await page.evaluate(() => document.querySelectorAll('.pz-seg').length === MQ.shapesUI.playing().item.pts.length), tag + ': the line closes back to dot 1');
  await snap('08-dots-done');
  await page.click('[data-act=pzNext]');
  await page.waitForSelector('.pz-ans');
  check(await page.evaluate((f) => MQ.shapesUI.playing().item.id !== f, first), tag + ': the next surprise is a different picture');

  // the album page and the home tile count what was made; the badge for the first puzzle
  await page.click('[data-act=go][data-arg=shapes]');
  await page.waitForSelector('.pzhub');
  s1 = await state();
  check(s1.album === 3, `${tag}: album ${s1.album} of 16`);
  check((await page.$$('.pzhub .pz-thumb.got')).length === 3, tag + ': three ✓ on the album page');
  check(s1.badges.includes('puzzle1'), tag + ': Shape Maker badge');
  await snap('09-album-after');
  await page.click('[data-act=go][data-arg=home]');
  check(/Album: 3 of 16/.test(await page.textContent('.t-shapes')), tag + ': home tile shows the album');
  // back gesture from a puzzle goes to the album page
  await page.click('.t-shapes');
  await page.click('[data-act=pzPlay][data-arg="shape:circle"]');
  await page.waitForSelector('.pz-ans');
  await page.goBack();
  await page.waitForSelector('.pzhub');
  await page.close();
}

await play('k', 'k', { width: 1024, height: 768 });
await play('g2', 'g2', { width: 390, height: 844 });
await browser.close();
if (errors.length) { console.error('FAILED:\n' + errors.join('\n')); process.exit(1); }
console.log('OK — Shape Puzzles played by a kindergartner and a 2nd grader');
