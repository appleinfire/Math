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

  // ---- Mistakes come back: the level above had a wrong first answer, so that skill is waiting to be practiced
  const rev0 = await page.evaluate(() => Object.values(MQ.state.review));
  if (!rev0.length || rev0.some((r) => r.box > 1 || r.miss < 1)) errors.push(tag + ': a mistake did not go to the review list ' + JSON.stringify(rev0)); // box 1 if the same skill was answered right later in the level
  // In training, every 4th question is a fresh one of a missed skill (marked 🔁 Review)
  await page.evaluate(() => { MQ.state.review = { 'money|2': { topic: 'money', d: 2, box: 0, due: MQ.U.dateKey(), miss: 1, last: MQ.U.dateKey() } }; MQ.state.trainer = { topics: ['add20'], diff: 1, mode: 'endless' }; MQ.app.go('trainer'); });
  await page.click('[data-act=startTrainer]');
  const asked = [];
  for (let k = 0; k < 4; k++) {
    await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked);
    asked.push(await page.evaluate(() => ({ t: MQ.app.session().p.topic, d: MQ.app.session().p.d, rv: !!MQ.app.session().p.review, chip: !!document.querySelector('.pcard .dchip.rv') })));
    if (k < 3) { await answer(page, true); await page.click('[data-act=advance]', { timeout: 2000 }).catch(() => {}); }
  }
  if (asked.slice(0, 3).some((a) => a.rv) || !asked[3].rv || asked[3].t !== 'money' || asked[3].d !== 2 || !asked[3].chip) errors.push(tag + ': review question not mixed in as the 4th: ' + JSON.stringify(asked));
  await snap('16b-review-question');
  await answer(page, true);
  await page.waitForSelector('.fb.ok');
  const rv1 = await page.evaluate(() => MQ.state.review['money|2']);
  if (!rv1 || rv1.box !== 1) errors.push(tag + ': a right review answer did not move the skill up ' + JSON.stringify(rv1));
  await page.click('[data-act=quit]');
  await page.waitForSelector('.sumgrid');

  // ---- Fix-it Lab: only the mistakes, with a strategy tip; a skill on its last step gets fixed (+3 💎)
  await page.evaluate(() => {
    const t = MQ.U.dateKey();
    MQ.state.review = { 'time|1': { topic: 'time', d: 1, box: 2, due: t, miss: 1, last: t }, 'add100|2': { topic: 'add100', d: 2, box: 0, due: t, miss: 2, last: t }, 'place|1': { topic: 'place', d: 1, box: 1, due: '2099-01-01', miss: 1, last: t } };
    MQ.state.tips = {};
    MQ.app.go('home');
  });
  if (!(await page.textContent('.t-fixit')).includes('2 to fix')) errors.push(tag + ': home does not show 2 mistakes to fix');
  await page.click('[data-act=go][data-arg=fixit]');
  await page.waitForSelector('.fxlist');
  if ((await page.$$('.fx')).length !== 3 || (await page.$$('.fx.due')).length !== 2) errors.push(tag + ': Fix-it Lab list is wrong');
  await snap('17-fixit');
  const fixGems = await page.evaluate(() => MQ.state.crystals);
  await page.click('[data-act=startFixit]');
  for (let k = 0; k < 2; k++) {
    await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked);
    const q = await page.evaluate(() => ({ t: MQ.app.session().p.topic, tip: !!document.querySelector('.pcard .tipcard') }));
    if (!['time', 'add100'].includes(q.t)) errors.push(tag + ': Fix-it asked a topic that is not due: ' + q.t);
    if (!q.tip) errors.push(tag + ': no strategy tip in Fix-it Lab');
    if (k === 0) await snap('17b-fixit-question');
    await answer(page, true);
    await page.click('[data-act=advance]', { timeout: 2000 }).catch(() => {});
  }
  await page.waitForSelector('.result');
  await snap('17c-fixit-done');
  const fx = await page.evaluate(() => ({ rev: Object.keys(MQ.state.review).sort(), fixed: MQ.state.stats.fixed, gems: MQ.state.crystals }));
  if (fx.rev.join() !== 'add100|2,place|1' || fx.fixed !== 1 || fx.gems !== fixGems + 3) errors.push(tag + ': Fix-it result wrong ' + JSON.stringify(fx));

  // ---- Strategy tip after missing the same kind of problem twice in a session
  await page.evaluate(() => { MQ.state.review = {}; MQ.state.tips = {}; MQ.state.trainer = { topics: ['add20'], diff: 1, mode: 'endless' }; MQ.app.go('trainer'); });
  await page.click('[data-act=startTrainer]');
  for (let k = 0; k < 2; k++) {
    await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked);
    await answer(page, false);
    await page.waitForTimeout(100);
    if (!(await page.evaluate(() => MQ.app.session().locked))) await answer(page, false);
    await page.click('[data-act=advance]');
  }
  await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked);
  if (!(await page.$('.pcard .tipcard'))) errors.push(tag + ': no tip after two misses in a row');
  await snap('17d-tip');
  await page.click('[data-act=quit]');
  await page.waitForSelector('.sumgrid');

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
  // Daily goal set by a grown-up shows on the home screen
  await page.click('[data-act=setGoal][data-arg="perDay:10"]');
  await page.click('[data-act=setGoal][data-arg="days:4"]');
  if (await page.evaluate(() => JSON.stringify(MQ.state.goal)) !== '{"perDay":10,"days":4}') errors.push(tag + ': goal not saved');
  await page.evaluate(() => MQ.app.go('home'));
  if (!(await page.$('.home .goal .ring'))) errors.push(tag + ': no goal ring on home');
  await snap('15b-home-goal');

  // ---- Grown-up preview: every level opens, a locked level can be played, and nothing is saved
  const storeBefore = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))));
  await page.evaluate(() => MQ.app.go('parent'));
  {
    const [pa, pb] = (await page.textContent('.eqline')).match(/\d+/g).map(Number);
    await page.fill('#gate-in', String(pa * pb));
    await page.click('[data-act=gate]');
  }
  await page.click('[data-act=startPreview]');
  await page.waitForSelector('#app > .pvbar + header + .map');
  if ((await page.$$('.wcard.locked')).length) errors.push(tag + ': preview did not open every world');
  await snap('19-preview-map');
  const lastWorld = await page.evaluate(() => MQ.track('g2').worlds.slice(-1)[0].id);
  await page.click(`[data-act=go][data-arg="world:${lastWorld}"]`);
  await page.click('.lrow >> nth=5');
  await page.waitForSelector('#app.is-play > .pvbar');
  await solve(9);
  await page.waitForSelector('.result');
  await page.evaluate(() => MQ.app.go('lgtypes'));
  await page.click('[data-act=pvLevel][data-arg="5"]');
  await page.click('[data-act=kgPractice][data-arg=lg_liars]');
  await page.waitForSelector('.pcard');
  if ((await page.evaluate(() => MQ.app.session().p.d)) !== 5) errors.push(tag + ': preview level picker did not start at level 5');
  await snap('19b-preview-level5');
  await answer(page, false);
  await page.click('.pvbar [data-act=exitPreview]');
  await page.waitForSelector('.home');
  if (await page.$('.pvbar')) errors.push(tag + ': preview bar still shown after Exit');
  const storeAfter = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))));
  if (storeAfter !== storeBefore) errors.push(tag + ': the preview changed saved progress');
  const real = await page.evaluate(() => ({ unlock: MQ.state.settings.unlockAll, last: Object.keys(MQ.state.levels).some((k) => k.startsWith(MQ.track('g2').worlds.slice(-1)[0].id)) }));
  if (real.unlock || real.last) errors.push(tag + ': preview leaked into the child profile ' + JSON.stringify(real));
  await page.click('[data-act=go][data-arg=map]');
  if (!(await page.$$('.wcard.locked')).length) errors.push(tag + ': worlds are not locked again after the preview');
  await page.evaluate(() => MQ.app.go('home'));

  // ---- My Progress: six months of practice that gets better, seeded, then read back from the chart
  await page.evaluate(() => {
    const st = MQ.state, d = new Date();
    for (let i = 180; i >= 1; i--) {
      if (i % 3) continue;
      const day = new Date(d); day.setDate(d.getDate() - i);
      const k = MQ.U.dateKey(day), a = 20, c = Math.round(a * (0.55 + 0.35 * (1 - i / 180)));
      st.days[k] = { a, c };
      const m = k.slice(0, 7); st.months[m] = st.months[m] || {}; const t = (st.months[m].add20 = st.months[m].add20 || [0, 0]); t[0] += a; t[1] += c;
    }
    MQ.store.save();
    MQ.app.go('progress');
  });
  await page.waitForSelector('.progress .pchart svg');
  await page.click('[data-act=progRange][data-arg="6m"]');
  await page.waitForSelector('.progress .verdict');
  const pv = await page.evaluate(() => ({ verdict: document.querySelector('.verdict').className, dots: document.querySelectorAll('.pchart .cdot').length, skills: document.querySelectorAll('.skill').length }));
  if (!/up/.test(pv.verdict) || pv.dots < 20 || pv.skills < 12) errors.push(tag + ': progress screen wrong ' + JSON.stringify(pv));
  await snap('18-progress');
  await page.selectOption('.progress select[data-act=progTopic]', 'add20');
  await page.waitForFunction(() => document.querySelector('.progress select').value === 'add20');
  const monthly = await page.evaluate(() => document.querySelectorAll('.pchart .cdot').length);
  if (monthly < 6 || monthly > 8) errors.push(tag + ': one topic should show months, got ' + monthly + ' points');
  await page.click('[data-act=practiceTopic][data-arg=time]');
  await page.waitForSelector('.pcard');
  if ((await page.evaluate(() => MQ.app.session().topics.join())) !== 'time') errors.push(tag + ': skill map does not start practice of that skill');
  await page.click('[data-act=quit]');
  await page.waitForSelector('.trainer');

  // ---- Placement Check (i-Ready style): 30 questions, no feedback, then results and a practice plan
  // Reload the page (like closing and reopening it) and come back to this child's home screen.
  async function reopen() {
    await page.reload();
    await page.waitForSelector('.home, .who-screen');
    if (await page.$('.who-screen')) await page.click('.profile >> text=Sofia');
    await page.waitForSelector('.home');
  }
  async function runCheck(expectN, knowsUpTo, pauseAt = -1) {
    await page.evaluate(() => MQ.app.go('prep'));
    await page.waitForSelector('.testcard');
    await page.click('[data-act=startCheck]');
    let n = 0;
    for (;;) {
      await page.waitForFunction(() => document.querySelector('.presult') || (MQ.app.session() && MQ.app.session().p && !MQ.app.session().locked));
      if (await page.$('.presult')) break;
      const step = await page.evaluate(() => MQ.app.session().p.step);
      if (n === 3) await snap('30-check-question');
      if (n === pauseAt) { // stop in the middle, close the page, then continue from the same question
        const q = await page.evaluate(() => MQ.app.session().p.text);
        await page.click('[data-act=quit]');
        await page.click('[data-act=leave]');
        await page.waitForSelector('.prep .tc-resume');
        await reopen();
        if (!(await page.textContent('.t-prep')).includes('unfinished')) errors.push(tag + ': home does not mention the unfinished check');
        await page.evaluate(() => MQ.app.go('prep'));
        await snap('29-check-resume');
        await page.click('[data-act=resumeTest][data-arg=check]');
        await page.waitForFunction(() => MQ.app.session() && MQ.app.session().p);
        const back = await page.evaluate(() => ({ q: MQ.app.session().p.text, n: MQ.app.session().answered }));
        if (back.q !== q || back.n !== pauseAt) errors.push(`${tag}: check did not continue where it stopped ${JSON.stringify(back)}`);
      }
      if (await page.$('.fb')) errors.push(tag + ': the check showed feedback');
      await answer(page, step <= knowsUpTo);
      n++;
      if (n > expectN + 2) { errors.push(tag + ': check did not end'); break; }
    }
    if (n !== expectN) errors.push(`${tag}: check asked ${n} questions, expected ${expectN}`);
    return page.evaluate(() => MQ.state.tests.checks.slice(-1)[0]);
  }
  const gemsBefore = await page.evaluate(() => MQ.state.crystals);
  const res = await runCheck(30, 6, 4);
  if (await page.evaluate(() => !!MQ.store.paused('check'))) errors.push(tag + ': finished check is still marked unfinished');
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
  // ⓘ on every test card explains the test
  await page.evaluate(() => MQ.app.go('prep'));
  for (const k of ['check', 'cogat', 'kangaroo', 'logic']) {
    await page.click(`.infobtn[data-arg=${k}]`);
    await page.waitForSelector('#modal .infobox');
    if ((await page.$$('#modal .infobox h3')).length !== 4) errors.push(tag + ': info for ' + k + ' is incomplete');
    if (k === 'kangaroo') await snap('39-info');
    await page.click('#modal [data-act=closeModal]');
  }
  // A missed Kangaroo puzzle type comes back in the next mock contest, in its point section
  await page.evaluate(() => { const t = MQ.U.dateKey(); MQ.state.review = { 'kg_mirror|5': { topic: 'kg_mirror', d: 5, box: 0, due: t, miss: 1, last: t } }; });
  const attempts0 = await page.evaluate(() => MQ.state.stats.attempts);
  const kres1 = await runContest('kangaroo:timed', 24, (k) => (k % 4 === 3 ? 'skip' : k % 5 === 4 ? 'wrong' : 'right'));
  if (!kres1.res.items.some((i) => i.rv && i.t === 'kg_mirror' && i.pts === 5)) errors.push(tag + ': missed puzzle type did not come back in the mock contest');
  if ((await page.evaluate(() => MQ.state.stats.attempts)) - attempts0 !== 18) errors.push(tag + ': contest answers not counted in statistics');
  if (!(await page.evaluate(() => Object.keys(MQ.state.review).some((k) => k.startsWith('kg_'))))) errors.push(tag + ': contest mistakes not saved to practice');
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
  // Answer two, stop on the third, close the page: the test continues with the same questions and answers.
  const firstKeys = await page.evaluate(() => MQ.app.contest().items.map((i) => MQ.U.qkey(i.p)));
  for (const k of [0, 1]) {
    await page.click('.choices.ct .choice >> nth=0');
    await page.click(`.ctbar [data-act=ctGo][data-arg="${k + 1}"]`);
  }
  await page.click('[data-act=ctQuit]');
  await page.click('[data-act=ctLeave]');
  await page.waitForSelector('.prep .tc-resume');
  if (!(await page.textContent('.tc-resume')).includes('2 of 45')) errors.push(tag + ': resume box does not say 2 of 45');
  await reopen();
  await page.evaluate(() => MQ.app.go('prep'));
  await snap('45b-cogat-resume');
  await page.click('[data-act=resumeTest][data-arg=cogat]');
  await page.waitForSelector('.contest');
  const back = await page.evaluate(() => ({ i: MQ.app.contest().i, answered: MQ.app.contest().answers.filter((a) => a !== null).length, keys: MQ.app.contest().items.map((i) => MQ.U.qkey(i.p)) }));
  if (back.i !== 2 || back.answered !== 2 || back.keys.join() !== firstKeys.join()) errors.push(`${tag}: CogAT did not continue where it stopped (question ${back.i + 1}, ${back.answered} answered)`);
  await page.click('[data-act=ctQuit]');
  await page.click('[data-act=ctLeave]');
  // Starting over asks first, then throws the unfinished test away.
  await page.click('[data-act=startContest][data-arg="cogat"]');
  await page.waitForSelector('#modal [data-act=restartTest]');
  await page.click('#modal [data-act=restartTest]');
  await page.waitForSelector('.contest');
  const fresh = await page.evaluate(() => ({ answered: MQ.app.contest().answers.filter((a) => a !== null).length, keys: MQ.app.contest().items.map((i) => MQ.U.qkey(i.p)).join() }));
  if (fresh.answered !== 0 || fresh.keys === firstKeys.join()) errors.push(tag + ': start over did not begin a new test');
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
  if (!(await page.$('.parent .pchart svg'))) errors.push(tag + ': parent page has no progress chart');

  // ---- Logic Lab: practice by type (with descriptions), then the 12-puzzle advanced challenge
  await page.evaluate(() => MQ.app.go('lgtypes'));
  if ((await page.$$('.tile.type')).length !== 6 || !(await page.textContent('.tile.type small'))) errors.push(tag + ': Logic Lab types missing');
  await snap('50-lgtypes');
  for (const t of ['lg_whois', 'lg_liars']) {
    await page.evaluate(() => MQ.app.go('lgtypes'));
    await page.click(`[data-act=kgPractice][data-arg=${t}]`);
    await page.waitForSelector('.pcard .clues, .pcard .ptext');
    await snap('51-' + t);
    await answer(page, true);
    await page.waitForSelector('.fb.ok');
    await page.click('[data-act=quit]');
    await page.waitForSelector('.sumgrid');
  }
  if (!(await page.$('[data-act=go][data-arg=lgtypes]'))) errors.push(tag + ': logic practice summary does not lead back to Logic Lab');
  const lres = await runContest('logic', 12, (k) => (k < 8 ? 'right' : 'wrong'));
  await snap('52-logic-result');
  if (!lres.res || lres.res.kind !== 'logic' || lres.res.right !== 8 || (await page.$$('.presult .pr-dom')).length !== 6) errors.push(`${tag}: logic challenge result wrong ${lres.res && lres.res.right}`);

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
  const lkres = await runContest('logick', 8, (k) => (k < 6 ? 'right' : 'wrong'));
  if (!lkres.res || lkres.res.kind !== 'logick' || lkres.res.right !== 6) errors.push(`${tag}: K logic result wrong ${lkres.res && lkres.res.right}`);
  await page.evaluate(() => MQ.app.go('lgtypes'));
  if ((await page.$$('.tile.type')).length !== 4) errors.push(tag + ': K Logic Lab should have 4 types');
  await page.click('[data-act=kgPractice][data-arg=lg_order]');
  await page.waitForSelector('.pcard');
  if ((await page.evaluate(() => MQ.app.session().p.d)) > 2) errors.push(tag + ': K logic too hard');
  await page.click('[data-act=quit]');
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
  for (const scr of ['map', 'trainer', 'journal', 'hatch', 'badges', 'parent', 'progress', 'fixit', 'lgtypes']) {
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
