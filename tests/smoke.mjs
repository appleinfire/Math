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
  await page.addInitScript(() => {
    window.__said = [];
    const synth = { speaking: false, _cur: null,
      getVoices: () => [{ lang: 'en-US', name: 'Test' }],
      speak(u) { this._cur = u; window.__said.push(u.text); const me = u; setTimeout(() => { if (synth._cur === me) { synth._cur = null; me.onend && me.onend(); } }, 1200); },
      cancel() { const u = this._cur; this._cur = null; if (u && u.onerror) u.onerror(); } };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  const snap = async (name) => shots && page.screenshot({ path: path.join(shots, `${tag}-${name}.png`), fullPage: true });
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await snap('01-onboard');
  await page.fill('#ob-name', 'Sofia');
  await page.click('[data-act=pickBuddy][data-arg="🐙"]');
  await page.click('[data-act=pickGrade][data-arg=g2]');
  await page.click('[data-act=createKid]');
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
        if (locked) { await page.click('[data-act=advance]'); continue; }
      }
      if (p.kind === 'num') {
        for (const ch of String(p.answer)) await page.click(`[data-act=key][data-arg="${ch}"]`);
        await page.click('[data-act=submit]');
      } else {
        await page.click(`.choice >> nth=${p.choices.indexOf(p.answer)}`);
      }
      await page.waitForTimeout(1900);
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

  // Voice: praise is spoken, the next problem waits for the voice, Next skips the wait.
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=trainer]');
  await page.click('[data-act=startTrainer]');
  await page.waitForFunction(() => { const s = MQ.app.session(); return s && s.p && !s.locked; });
  const answerRight = async () => {
    const p = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices, text: s.p.text }; });
    if (p.kind === 'num') { for (const ch of String(p.answer)) await page.click(`[data-act=key][data-arg="${ch}"]`); await page.click('[data-act=submit]'); }
    else await page.click(`.choice >> nth=${p.choices.indexOf(p.answer)}`);
    return p.text;
  };
  let before = await answerRight();
  await page.waitForTimeout(700);
  const mid = await page.evaluate(() => ({ text: MQ.app.session().p.text, said: window.__said.slice(-1)[0], next: !!document.querySelector('.fb.ok [data-act=advance]') }));
  if (mid.text !== before) errors.push(tag + ': moved on before the voice finished');
  if (!mid.next) errors.push(tag + ': no Next button after a right answer');
  if (!/Great|Yes|Awesome|got it|Well done|Super|Perfect|Way to go/.test(mid.said || '')) errors.push(tag + ': praise not spoken: ' + mid.said);
  await page.waitForTimeout(1300);
  if ((await page.evaluate(() => MQ.app.session().p.text)) === before) errors.push(tag + ': did not move on after the voice finished');
  await page.waitForFunction(() => !MQ.app.session().locked);
  before = await answerRight();
  await page.waitForTimeout(150);
  await page.click('.fb.ok [data-act=advance]');
  await page.waitForTimeout(100);
  if ((await page.evaluate(() => MQ.app.session().p.text)) === before) errors.push(tag + ': Next did not skip the voice');
  // a wrong answer gets a gentle spoken "try again"
  const pw = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices }; });
  if (pw.kind === 'num') { await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=key][data-arg="9"]'); await page.click('[data-act=submit]'); }
  else await page.click(`.choice >> nth=${pw.choices.findIndex((c) => c !== pw.answer)}`);
  await page.waitForTimeout(200);
  const saidWrong = await page.evaluate(() => window.__said.slice(-1)[0]);
  if (!/Oops|Almost|Not quite|try|Good try|okay|effort/i.test(saidWrong || '')) errors.push(tag + ': no gentle message after a wrong answer: ' + saidWrong);
  await snap('16-voice-wrong');
  await page.click('[data-act=quit]');
  await page.waitForSelector('.sumgrid');

  // Trainer
  await page.click('[data-act=go][data-arg=home]');
  await page.click('[data-act=go][data-arg=map]');
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
  await page.waitForSelector('.home');
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
  // ---- Second child in kindergarten: separate profile, separate progress
  await page.evaluate(() => MQ.app.go('home'));
  await page.click('.hello-r [data-act=go][data-arg=who]');
  await page.waitForSelector('.who-screen');
  await page.click('[data-act=go][data-arg=new]');
  await page.fill('#ob-name', 'Mila');
  await page.click('[data-act=pickGrade][data-arg=k]');
  await page.click('[data-act=pickBuddy][data-arg="🦦"]');
  await snap('20-new-k');
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.home');
  const k0 = await page.evaluate(() => ({ grade: MQ.state.grade, gems: MQ.state.crystals, creatures: Object.keys(MQ.state.creatures).length, read: MQ.state.settings.readAloud }));
  if (k0.grade !== 'k' || k0.gems !== 0 || k0.creatures !== 0 || !k0.read) errors.push(tag + ': new K profile is not clean ' + JSON.stringify(k0));
  await snap('21-k-home');
  await page.click('.continue');
  await solve(8);
  await page.waitForSelector('.result');
  await page.waitForTimeout(1500);
  await snap('22-k-level-done');
  const kc = await page.evaluate(() => Object.keys(MQ.state.creatures));
  if (kc.length !== 1 || !kc[0].startsWith('k_')) errors.push(tag + ': K creature wrong ' + kc);
  await page.evaluate(() => MQ.app.go('map'));
  await snap('23-k-map');
  await page.evaluate(() => MQ.app.go('trainer'));
  await snap('24-k-trainer');
  // Back to the older sister through the switch button: her progress is untouched
  await page.evaluate(() => MQ.app.go('home'));
  await page.click('.hello-r [data-act=go][data-arg=who]');
  await snap('25-who');
  const profiles = await page.$$('.profile:not(.add)');
  if (profiles.length !== 2) errors.push(tag + ': expected 2 profiles, got ' + profiles.length);
  await page.click('.profile >> text=Sofia');
  const g2 = await page.evaluate(() => ({ grade: MQ.state.grade, creatures: Object.keys(MQ.state.creatures) }));
  if (g2.grade !== 'g2' || g2.creatures.some((c) => c.startsWith('k_')) || g2.creatures.length < 2) errors.push(tag + ': profiles mixed ' + JSON.stringify(g2));
  // Reload keeps both, and shows the picker
  await page.reload();
  await page.waitForSelector('.who-screen');
  if (shots) {
    await page.click('.profile >> text=Mila');
    for (const t of ['k_count', 'k_numbers', 'k_compare', 'k_add', 'k_sub', 'k_teen', 'k_shapes', 'k_measure', 'k_words', 'k_patterns']) {
      for (const d of [1, 3, 5]) {
        await page.evaluate(([t, d]) => { MQ.state.trainer = { topics: [t], diff: d, mode: 'endless' }; MQ.app.go('trainer'); }, [t, d]);
        await page.click('[data-act=startTrainer]');
        await page.waitForSelector('.pcard .ptext');
        await page.waitForTimeout(350);
        await snap(`k-${t}-${d}`);
      }
    }
  }
  // Browser back moves between screens, and asks before leaving a game
  await page.evaluate(() => MQ.app.go('home'));
  await page.click('[data-act=go][data-arg=map]');
  await page.click('.wcard >> nth=0');
  await page.goBack();
  await page.waitForSelector('.map');
  await page.goBack();
  await page.waitForSelector('.home');
  await page.click('.continue');
  await page.waitForSelector('.pcard');
  await page.goBack();
  await page.waitForSelector('#modal');
  await snap('26-back-in-game');
  await page.click('[data-act=closeModal]');
  if (!(await page.$('.pcard'))) errors.push(tag + ': game closed after back + keep playing');
  // Every screen offers a way back (header back button or result buttons)
  for (const scr of ['map', 'trainer', 'journal', 'hatch', 'badges', 'parent']) {
    await page.evaluate((x) => MQ.app.go(x), scr);
    if (!(await page.$('.bar [data-act=go][aria-label=Back]'))) errors.push(tag + ': no back button on ' + scr);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(tag + ': horizontal overflow');
  await page.close();
}
// The first version saved one player under an old key: it must become a 2nd-grade profile.
{
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push('migrate: ' + e.message));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('math-expedition-v1', JSON.stringify({ v: 1, name: 'Old', companion: '🦉', crystals: 42, xp: 120, levels: { 'tide-0': { stars: 3 } }, creatures: { hermit: { got: '2026-10-01' } } })); });
  await page.reload();
  await page.waitForSelector('.home');
  const m = await page.evaluate(() => ({ name: MQ.state.name, grade: MQ.state.grade, gems: MQ.state.crystals, old: localStorage.getItem('math-expedition-v1') }));
  if (m.name !== 'Old' || m.grade !== 'g2' || m.gems !== 42 || m.old) errors.push('migrate: ' + JSON.stringify(m));
  await page.close();
}
await run({ width: 390, height: 844 }, 'phone');
await run({ width: 1024, height: 768 }, 'ipad');
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Smoke test OK');
