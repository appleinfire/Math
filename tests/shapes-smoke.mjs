// Browser test for Puzzle Time: node tests/shapes-smoke.mjs [screenshotDir]
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
  await page.evaluate(() => { MQ.shapes.GOLD_CHANCE = 0; }); // golden puzzles get their own test below
  await page.click('.t-shapes');
  await page.waitForSelector('.pzhub');
  check((await page.$$('.pzhub .pz-thumb')).length === 32, tag + ': 12 shapes, 10 pictures of shapes and 10 mystery dot-to-dots on the album page');
  check((await page.$$('.pz-pack')).length === 12, tag + ': 12 picture collections');
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

  // 🧲 Snap!: a picture of a creature, every answer right
  const playAll = async () => {
    for (let k = 0; k < 20; k++) {
      await idle();
      const x = await G();
      if (x.done) return;
      await page.click(`.pz-ans[data-arg="${x.answer}"]`);
    }
  };
  await page.click('[data-act=go][data-arg=shapes]');
  await page.click('[data-act=pzPlay][data-arg=snap]');
  await page.waitForSelector('.pz-ans');
  const snapPic = await page.evaluate(() => MQ.shapesUI.playing().item.id);
  await playAll();
  await page.waitForSelector('.pz-win');
  check(/You made /.test(await page.textContent('.pz-win b')), tag + ': Snap! names the picture');
  await snap('10-snap-done');

  // ✋ Find the piece: one wrong piece dragged into the hole (it bounces back, faded), then the right ones tapped
  await page.click('[data-act=pzNext]');
  await page.waitForSelector('.pz-ans');
  check(await page.evaluate((s) => MQ.shapesUI.playing().item.id !== s, snapPic), tag + ': the next picture is a new one');
  await page.click('[data-act=go][data-arg=shapes]');
  await page.click('[data-act=pzPlay][data-arg=find]');
  await page.waitForSelector('.pz-tp');
  await snap('11-find');
  g = await G();
  const wrongPiece = await (await page.$(`.pz-tp:not([data-v="${g.answer}"])`)).boundingBox();
  const holeBox = await (await page.$('.pz-holet')).boundingBox();
  await page.mouse.move(wrongPiece.x + wrongPiece.width / 2, wrongPiece.y + wrongPiece.height / 2);
  await page.mouse.down();
  await page.mouse.move(holeBox.x + holeBox.width / 2, holeBox.y + holeBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForSelector('.pz-tp.out');
  await page.waitForSelector('.pz-hint');
  check((await G()).left === g.left, tag + ': a wrong piece does not go in');
  for (let k = 0; k < 20; k++) {
    await idle();
    const x = await G();
    if (x.done) break;
    await page.click(`.pz-tp[data-v="${x.answer}"]`);
    await page.waitForFunction((n) => MQ.shapesUI.playing().left.length < n || MQ.shapesUI.playing().done, x.left);
  }
  await page.waitForSelector('.pz-win');
  await snap('12-find-done');

  // ☁️ Who's hiding?: one cloud, a wrong guess (locked until the next cloud), another cloud, the right guess (+ a cloud bonus)
  await page.click('[data-act=go][data-arg=shapes]');
  await page.click('[data-act=pzPlay][data-arg=hide]');
  await page.waitForSelector('.pz-ans');
  check(await page.isDisabled('.pz-guess'), tag + ': no guessing before a cloud is gone');
  g = await G();
  await page.click(`.pz-ans[data-arg="${g.answer}"]`);
  await idle();
  await page.click('.pz-guess');
  const who = await page.evaluate(() => MQ.shapesUI.playing().item.id);
  await page.click(`.pz-choice:not([data-arg="${who}"])`);
  await page.waitForSelector('.pz-ans');
  check(await page.isDisabled('.pz-guess'), tag + ': one guess per cloud');
  g = await G();
  await page.click(`.pz-ans[data-arg="${g.answer}"]`);
  await idle();
  await snap('13-hide');
  const before = (await state()).gems, cloudsLeft = (await G()).left;
  await page.click('.pz-guess');
  await page.click(`.pz-choice[data-arg="${who}"]`);
  await page.waitForSelector('.pz-win');
  const after = (await state()).gems;
  check(after - before === cloudsLeft + 3 + 5, `${tag}: early guess ${after - before} 💎, expected ${cloudsLeft} for the clouds + 8`);
  check(await page.evaluate(() => !document.querySelector('.pz-cloud')), tag + ': all the clouds blow away');
  await snap('14-hide-done');

  // the album page and the home tile count what was made; the badge for the first puzzle
  await page.click('[data-act=go][data-arg=shapes]');
  await page.waitForSelector('.pzhub');
  s1 = await state();
  check(s1.album === 6, `${tag}: ${s1.album} puzzles made, expected 6`);
  const gotN = (await page.$$('.pzhub .pz-thumb.got')).length;
  check(gotN === 3, tag + ': the star, the house and a dot-to-dot have ✓ on the album page, not ' + gotN);
  check(s1.badges.includes('puzzle1'), tag + ': Shape Maker badge');
  await snap('09-album-after');

  const toHub = async () => { await page.evaluate(() => MQ.app.go('shapes')); await page.waitForSelector('.pzhub'); };
  // any puzzle, played to the end with right answers (a tray piece in Find the piece)
  const playAny = async () => {
    for (let k = 0; k < 25; k++) {
      await idle();
      const x = await G();
      if (x.done) return;
      if (x.mode === 'find') {
        await page.click(`.pz-tp[data-v="${x.answer}"]`);
        await page.waitForFunction((n) => MQ.shapesUI.playing().left.length < n || MQ.shapesUI.playing().done, x.left);
      } else await page.click(`.pz-ans[data-arg="${x.answer}"]`);
    }
  };

  // 🌞 the puzzle of the day: once a day, a streak
  await page.click('.pz-daily [data-act=pzPlay]');
  await page.waitForSelector('.pz-panel .pz-prog');
  check(await page.evaluate(() => MQ.shapesUI.playing().daily), tag + ': the puzzle of the day');
  await playAny();
  await page.waitForSelector('.pz-win');
  check(/Puzzle of the day/.test(await page.textContent('.pz-win')), tag + ': the puzzle of the day says so');
  check(await page.evaluate(() => MQ.state.puzzles.daily.streak === 1 && MQ.shapes.dailyDone(MQ.state)), tag + ': a streak of 1 day');
  await page.click('[data-act=go][data-arg=shapes]');
  check(await page.$('.pz-daily.done') !== null && (await page.$('.pz-daily [data-act=pzPlay]')) === null, tag + ': done for today');

  // 🛍️ a pack for crystals: locked pictures, buy it, its pictures play in a row
  await page.evaluate(() => { MQ.state.crystals += 300; });
  await page.click('.pz-pack[data-arg=ocean]');
  await page.waitForSelector('.pz-packpage');
  check((await page.$$('.pz-thumb.locked')).length === 20, tag + ': 20 locked Ocean pictures');
  await snap('15-pack-locked');
  let c0 = (await state()).gems;
  await page.click('[data-act=pzBuy]');
  await page.click('[data-act=pzBuyYes]');
  await page.waitForFunction(() => !document.querySelector('.pz-thumb.locked') && document.querySelector('.pz-packpage'));
  check(c0 - (await state()).gems === 30, tag + ': the Ocean pack costs 30 💎');
  check(await page.evaluate(() => !!MQ.state.puzzles.packs.ocean), tag + ': the pack is yours');
  await page.click('.pz-packpage .pz-thumb');
  await page.waitForSelector('.pz-ans');
  const firstOcean = await page.evaluate(() => MQ.shapesUI.playing().item.id);
  check(/^ocean-/.test(firstOcean), tag + ': an Ocean picture');
  await snap('16-ocean');
  await playAny();
  await page.waitForSelector('.pz-win');
  await page.click('[data-act=pzNext]');
  await page.waitForSelector('.pz-panel .pz-prog');
  check(await page.evaluate((f) => { const g = MQ.shapesUI.playing(); return g.item.pack === 'ocean' && g.item.id !== f; }, firstOcean), tag + ': the next picture of the pack');

  // 🌟 a Legendary picture: at least 9 pieces, it comes alive at the end
  await toHub();
  await page.click('.pz-pack[data-arg=dragons]');
  c0 = (await state()).gems;
  await page.click('[data-act=pzBuy]');
  await page.click('[data-act=pzBuyYes]');
  await page.waitForFunction(() => !document.querySelector('.pz-thumb.locked') && document.querySelector('.pz-packpage'));
  check(c0 - (await state()).gems === 100, tag + ': Dragon Legends costs 100 💎');
  await page.click('[data-act=pzPlay][data-arg="snap:lg-royal"]');
  await page.waitForSelector('.pz-ans');
  check(await page.evaluate(() => MQ.shapesUI.playing().n >= 9 && !!document.querySelector('.is-legend')), tag + ': a Legendary puzzle has at least 9 pieces');
  await playAny();
  await page.waitForSelector('.pz-win');
  check(await page.evaluate(() => !!document.querySelector('.pz-svg.alive .pz-live .lg-hero')), tag + ': the Legendary picture comes alive');
  await snap('17-legend-done');
  await page.waitForTimeout(1800);
  check((await state()).badges.includes('puzzlelegend'), tag + ': Legend Maker badge');

  // ✨ a golden puzzle: double crystals for finishing it, a gold frame
  await page.evaluate(() => { MQ.shapes.GOLD_CHANCE = 1; });
  await toHub();
  await page.click('[data-act=pzPlay][data-arg=snap]');
  await page.waitForSelector('.is-gold .pz-ans');
  await page.evaluate(() => { MQ.shapes.GOLD_CHANCE = 0; });
  const goldKey = await page.evaluate(() => MQ.shapesUI.playing().key), fresh = await page.evaluate((k) => !MQ.state.puzzles.done[k], goldKey);
  const pieces2 = (await G()).left;
  c0 = (await state()).gems;
  await playAny();
  await page.waitForSelector('.pz-win');
  check((await state()).gems - c0 === pieces2 + (fresh ? 16 : 6), `${tag}: golden puzzle ${(await state()).gems - c0} 💎, expected ${pieces2} + ${fresh ? 16 : 6}`);
  check(await page.evaluate((k) => MQ.state.puzzles.gold[k] === true, goldKey), tag + ': the golden puzzle is remembered');

  // ★★★ the same shape in 16 pieces: three stars
  await toHub();
  await page.click('[data-act=pzSize][data-arg="16"]');
  await page.click('[data-act=pzPlay][data-arg="shape:circle"]');
  await page.waitForSelector('.pz-ans');
  check((await G()).left === 16, tag + ': a circle in 16 pieces');
  await playAny();
  await page.waitForSelector('.pz-win');
  check(await page.evaluate(() => MQ.state.puzzles.stars['shape:circle'] === 3), tag + ': three stars for 16 pieces');

  // 🖼️ the gallery: everything made hangs there; a tap shows it big, Play again plays it
  await toHub();
  await page.click('[data-act=pzSize][data-arg="6"]');
  await page.click('.pz-wallbtn');
  await page.waitForSelector('.pz-wall');
  const made = (await state()).album;
  check((await page.$$('.pz-framed')).length === made, `${tag}: ${(await page.$$('.pz-framed')).length} pictures on the wall, ${made} made`);
  check((await page.$$('.pz-framed.gold')).length >= 1 && (await page.$$('.pz-framed.legend')).length === 1, tag + ': a gold frame and a Legendary frame');
  await snap('18-gallery');
  await page.click('.pz-framed.legend');
  await page.waitForSelector('.pz-view .alive');
  await snap('19-view');
  await page.click('[data-act=pzReplay]');
  await page.waitForSelector('.pz-ans');
  check(await page.evaluate(() => MQ.shapesUI.playing().item.id === 'lg-royal'), tag + ': Play again from the gallery');
  await toHub();
  await page.waitForSelector('.pzhub');
  await page.click('[data-act=go][data-arg=home]');
  check(/puzzles made/.test(await page.textContent('.t-shapes')), tag + ': home tile shows the puzzles made');
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
console.log('OK — Puzzle Time played by a kindergartner and a 2nd grader');
