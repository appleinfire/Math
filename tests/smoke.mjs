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

// Answer the current question through the UI, right or wrong, whatever its format.
async function answer(page, right = true) {
  const p = await page.evaluate(() => { const s = MQ.app.session(); return { kind: s.p.kind, answer: s.p.answer, choices: s.p.choices, items: s.p.items, line: s.p.line, text: s.p.text, check: s.mode === 'check' }; });
  if (p.kind === 'num') {
    for (const ch of right ? String(p.answer) : '999') await page.click(`[data-act=key][data-arg="${ch}"]`);
    await page.click('[data-act=submit]');
  } else if (p.kind === 'choice') {
    await page.click(`.choice >> nth=${right ? p.choices.indexOf(p.answer) : p.choices.findIndex((c) => c !== p.answer)}`);
    if (p.check) await page.click('.go-pick');
  } else if (p.kind === 'multi') {
    const picks = right ? p.answer.map((a) => p.choices.indexOf(a)) : [p.choices.findIndex((c) => !p.answer.includes(c))];
    for (const i of picks) await page.click(`.choices.multi .choice >> nth=${i}`);
    await page.click('.go-pick');
  } else if (p.kind === 'order') {
    const seq = right ? p.answer.map((a) => p.items.indexOf(a)) : p.items.map((_, i) => i);
    for (const i of seq) await page.click(`.order-items .choice >> nth=${i}`);
    await page.click('.go-pick');
  } else if (p.kind === 'line') {
    const v = right ? p.answer : p.answer === p.line.min ? p.line.max : p.line.min;
    await page.click(`.tickhit[data-arg="${v}"]`, { force: true });
    await page.click('.go-pick');
  }
  return p;
}
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
      if (wrongFirst && i === 0) {
        await answer(page, false);
        await page.waitForTimeout(150);
        if (i === 0) await snap('04-hint');
        const locked = await page.evaluate(() => MQ.app.session().locked);
        if (locked) { await page.click('[data-act=advance]'); continue; }
      }
      await answer(page, true);
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
  // Remember the exact problem object (two problems can have the same text, e.g. "Add." with different numbers).
  const markProblem = () => page.evaluate(() => { window.__pmark = MQ.app.session().p; });
  const sameProblem = () => page.evaluate(() => MQ.app.session().p === window.__pmark);
  await markProblem();
  await answer(page, true);
  await page.waitForTimeout(700);
  const mid = await page.evaluate(() => ({ said: window.__said.slice(-1)[0], next: !!document.querySelector('.fb.ok [data-act=advance]') }));
  if (!(await sameProblem())) errors.push(tag + ': moved on before the voice finished');
  if (!mid.next) errors.push(tag + ': no Next button after a right answer');
  if (!/Great|Yes|Awesome|got it|Well done|Super|Perfect|Way to go/.test(mid.said || '')) errors.push(tag + ': praise not spoken: ' + mid.said);
  await page.waitForTimeout(1300);
  if (await sameProblem()) errors.push(tag + ': did not move on after the voice finished');
  await page.waitForFunction(() => !MQ.app.session().locked);
  await markProblem();
  await answer(page, true);
  await page.waitForTimeout(150);
  await page.click('.fb.ok [data-act=advance]');
  await page.waitForTimeout(100);
  if (await sameProblem()) errors.push(tag + ': Next did not skip the voice');
  // a wrong answer gets a gentle spoken "try again"
  await answer(page, false);
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

  // ---- Placement Check (i-Ready style): 30 questions, no feedback, then results and a practice plan
  async function runCheck(expectN, knowsUpTo) {
    await page.evaluate(() => MQ.app.go('prep'));
    await page.waitForSelector('.testcard');
    await page.click('[data-act=startCheck]');
    let n = 0;
    for (;;) {
      await page.waitForFunction(() => document.querySelector('.presult') || (MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked));
      if (await page.$('.presult')) break;
      const step = await page.evaluate(() => MQ.app.session().p.step);
      if (n === 3) await snap('30-check-question');
      if (await page.$('.fb')) errors.push(tag + ': the check showed feedback');
      await answer(page, step <= knowsUpTo);
      n++;
      if (n > expectN + 2) { errors.push(tag + ': check did not end'); break; }
    }
    if (n !== expectN) errors.push(`${tag}: check asked ${n} questions, expected ${expectN}`);
    return page.evaluate(() => MQ.state.tests.checks.slice(-1)[0]);
  }
  const gemsBefore = await page.evaluate(() => MQ.state.crystals);
  const res = await runCheck(30, 6);
  await snap('31-check-result');
  if (!res || res.items.length !== 30) errors.push(tag + ': check result not saved');
  else if (Math.abs(res.overall - 6) > 1.5) errors.push(`${tag}: a child who knows up to Mid 2nd got ${res.overall}`);
  if ((await page.evaluate(() => MQ.state.crystals)) !== gemsBefore + 20) errors.push(tag + ': no crystals for finishing the check');
  await page.click('[data-act=reviewCheck]');
  await page.waitForSelector('.rlist');
  if ((await page.$$('.rlist li')).length !== 30) errors.push(tag + ': review does not list all answers');
  await snap('32-check-review');
  await page.click('[data-act=viewCheck]');
  await page.click('[data-act=practicePlan]');
  await page.waitForSelector('.pcard');
  const planTopics = await page.evaluate(() => MQ.app.session().topics.map((t) => MQ.TOPICS[t].track));
  if (!planTopics.length || planTopics.some((tr) => tr !== 'g2')) errors.push(tag + ': practice plan topics wrong ' + planTopics);
  await page.click('[data-act=quit]');
  await page.evaluate(() => MQ.app.go('prep'));
  await snap('33-prep');
  await page.evaluate(() => MQ.app.go('parent'));
  const qq = await page.textContent('.eqline');
  const [ga, gb] = qq.match(/\d+/g).map(Number);
  await page.fill('#gate-in', String(ga * gb));
  await page.click('[data-act=gate]');
  if (!(await page.$('.parent table.topics th'))) errors.push(tag + ': no readiness table');

  // ---- New answer formats inside regular practice: find one of each and answer it
  async function practiceKind(topic, d, kind, name) {
    await page.evaluate(([t, d]) => { MQ.state.trainer = { topics: [t], diff: d, mode: 'endless' }; MQ.app.go('trainer'); }, [topic, d]);
    await page.click('[data-act=startTrainer]');
    for (let k = 0; k < 40; k++) {
      await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked);
      if ((await page.evaluate(() => MQ.app.session().p.kind)) === kind) break;
      await answer(page, true);
      await page.click('[data-act=advance]').catch(() => {});
    }
    if ((await page.evaluate(() => MQ.app.session().p.kind)) !== kind) { errors.push(tag + ': never saw a ' + kind); return; }
    await snap(`34-${name}-ask`);
    await answer(page, false); // wrong first: the pick resets and a hint shows
    if (!(await page.waitForSelector('.fb.hint', { timeout: 3000 }).catch(() => null))) errors.push(tag + ': no hint after a wrong ' + kind);
    await answer(page, true);
    if (!(await page.waitForSelector('.fb.ok', { timeout: 3000 }).catch(() => null))) errors.push(tag + ': right ' + kind + ' not accepted');
    await snap(`35-${name}-right`);
    await page.click('[data-act=quit]');
  }
  await practiceKind('place', 1, 'line', 'line');
  await practiceKind('arrays', 2, 'multi', 'multi');
  await practiceKind('place', 4, 'order', 'order');

  // ---- Math Kangaroo mock contest: answer, skip, flag, jump back, finish with the blank warning
  async function runContest(arg, n, plan) {
    await page.evaluate(() => MQ.app.go('prep'));
    await page.click(`[data-act=startContest][data-arg="${arg}"]`);
    await page.waitForSelector('.contest');
    const ctInfo = await page.evaluate(() => MQ.app.contest().items.map((i) => ({ answer: i.p.answer, choices: i.p.choices, pts: i.pts })));
    if (ctInfo.length !== n) errors.push(`${tag}: contest has ${ctInfo.length} questions`);
    let expect = 0;
    for (let k = 0; k < n; k++) {
      const what = plan(k); // 'right' | 'wrong' | 'skip'
      if (k === 2) await snap(`40-${arg.split(':')[0]}-question`);
      if (what !== 'skip') {
        const c = ctInfo[k];
        const idx = what === 'right' ? c.choices.indexOf(c.answer) : c.choices.findIndex((x) => x !== c.answer);
        await page.click(`.choices.ct .choice >> nth=${idx}`);
        if (what === 'right') expect += c.pts;
      }
      if (k === 4 && arg.startsWith('kangaroo')) await page.click('[data-act=ctFlag]');
      if (k < n - 1) await page.click(`.ctbar [data-act=ctGo][data-arg="${k + 1}"]`);
    }
    // jump back to the flagged question with the number strip, check it kept its answer
    if (arg.startsWith('kangaroo')) {
      await page.click('.ctnav [data-arg="4"]');
      const kept = await page.evaluate(() => MQ.app.contest().answers[4] !== null && MQ.app.contest().flags[4]);
      if (!kept) errors.push(tag + ': answer or flag lost when jumping back');
      await page.click(`.ctnav [data-arg="${n - 1}"]`);
    }
    await page.click('[data-act=ctFinish]');
    if (await page.$('#modal')) await page.click('[data-act=ctFinishNow]');
    await page.waitForSelector('.presult');
    const res = await page.evaluate(() => MQ.state.tests.contests.slice(-1)[0]);
    return { res, expect };
  }
  const kres1 = await runContest('kangaroo:timed', 24, (k) => (k % 4 === 3 ? 'skip' : k % 5 === 4 ? 'wrong' : 'right'));
  await snap('41-kangaroo-result');
  if (!kres1.res || kres1.res.score !== kres1.expect || kres1.res.max !== 96 || !kres1.res.timed) errors.push(`${tag}: kangaroo score ${kres1.res && kres1.res.score} != ${kres1.expect}`);
  if (await page.evaluate(() => !!(MQ.app.contest()))) errors.push(tag + ': contest still running after finish');
  // practice one puzzle type with picture answers
  await page.evaluate(() => MQ.app.go('kgtypes'));
  await snap('42-kgtypes');
  await page.click('[data-act=kgPractice][data-arg=kg_mirror]');
  await page.waitForSelector('.pcard');
  await snap('43-kg-mirror');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  await page.click('[data-act=quit]');
  await page.waitForSelector('.sumgrid');
  if (!(await page.$('[data-act=kgPractice][data-arg=kg_mirror]'))) errors.push(tag + ': summary does not offer to play the same puzzle type again');

  // ---- CogAT practice test: 3 parts × 15, soft clock, results by part and by question type
  const cres = await runContest('cogat', 45, (k) => (k < 15 ? 'right' : k < 25 ? 'wrong' : k % 2 ? 'skip' : 'right'));
  await snap('45-cogat-result');
  if (!cres.res || cres.res.kind !== 'cogat' || cres.res.right !== cres.expect) errors.push(`${tag}: cogat right ${cres.res && cres.res.right} != ${cres.expect}`);
  else if (cres.res.sections.Verbal.right !== 15 || Object.keys(cres.res.types).length !== 9) errors.push(`${tag}: cogat sections ${JSON.stringify(cres.res.sections)}`);
  if ((await page.$$('.presult .sumgrid > div')).length !== 3 || (await page.$$('.presult .pr-dom')).length !== 9) errors.push(tag + ': cogat result does not show parts and types');
  if (!(await page.$('.presult [data-act=go][data-arg=cgtypes]'))) errors.push(tag + ': cogat result has no practice-by-type button');
  // A second practice test brings new questions (the first test's questions are remembered in the profile)
  const before = await page.evaluate(() => Object.entries(MQ.state.seen || {}).flatMap(([t, ks]) => ks.map((k) => t + k)));
  if (before.length < 45) errors.push(`${tag}: only ${before.length} questions remembered after a CogAT test`);
  await page.evaluate(() => MQ.app.go('prep'));
  await page.click('[data-act=startContest][data-arg="cogat"]');
  await page.waitForSelector('.contest');
  const repeats = await page.evaluate((old) => MQ.app.contest().items.filter((i) => old.includes(i.p.topic + MQ.U.qkey(i.p))).length, before);
  if (repeats) errors.push(`${tag}: second CogAT test repeats ${repeats} questions`);
  await page.click('[data-act=ctQuit]');
  await page.click('[data-act=ctLeave]');
  await page.waitForSelector('.prep');
  await page.click('[data-act=go][data-arg=cgtypes]');
  await page.waitForSelector('[data-act=kgPractice][data-arg=cg_folding]');
  await snap('46-cgtypes');
  for (const t of ['cg_folding', 'cg_matrix', 'cg_picanalogy']) {
    await page.evaluate(() => MQ.app.go('cgtypes'));
    await page.click(`[data-act=kgPractice][data-arg=${t}]`);
    await page.waitForSelector('.pcard');
    await snap('47-' + t);
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=quit]');
    await page.waitForSelector('.sumgrid');
  }
  if (!(await page.$('[data-act=go][data-arg=cgtypes]'))) errors.push(tag + ': CogAT practice summary does not lead back to CogAT types');
  await page.evaluate(() => MQ.app.go('parent'));
  if (await page.$('#gate-in')) {
    const [qa, qb] = (await page.textContent('.eqline')).match(/\d+/g).map(Number);
    await page.fill('#gate-in', String(qa * qb));
    await page.click('[data-act=gate]');
  }
  await page.waitForSelector('.parent');
  if (!(await page.textContent('.parent')).includes('CogAT practice') || (await page.$$('.parent .pr-dom')).length < 9) errors.push(tag + ': parent page has no CogAT results by type');
  await snap('49-parent-cogat');

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
  const kres = await runCheck(20, 2);
  if (!kres || kres.grade !== 'k' || kres.items.length !== 20) errors.push(tag + ': kindergarten check not saved');
  else if (Math.abs(kres.overall - 2) > 1.5) errors.push(`${tag}: a K child who knows up to Late K got ${kres.overall}`);
  await snap('36-k-check-result');
  const jres = await runContest('joey', 12, (k) => (k < 9 ? 'right' : 'wrong'));
  await snap('44-joey-result');
  if (!jres.res || jres.res.kind !== 'joey' || jres.res.right !== 9) errors.push(`${tag}: joey result wrong ${jres.res && jres.res.right}`);
  const bres = await runContest('cogatk', 18, (k) => (k < 12 ? 'right' : 'wrong'));
  await snap('48-brain-games-result');
  if (!bres.res || bres.res.kind !== 'cogatk' || bres.res.right !== 12) errors.push(`${tag}: brain games result wrong ${bres.res && bres.res.right}`);
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
  await page.click('.profile >> text=Mila');
  if (shots) {
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
