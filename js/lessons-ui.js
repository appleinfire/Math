// Learn screens for the Multiply & Divide course. Rules and content are in js/lessons.js.
(function () {
  const MQ = globalThis.MQ, L = MQ.lessons, S = MQ.store;
  const K = () => MQ.app.kit;
  let run = null;
  const st = () => K().state();
  const esc = (s) => MQ.U.esc(String(s));
  const stepName = (n) => ['See it', 'Build it', 'Solve together', 'Try it', 'Show what you know'][n] || 'Try another way';
  const speakButton = () => '<button class="ls-speak" data-act="lessonSpeak" aria-label="Read this step aloud">🔊</button>';
  const visual = (v) => {
    if (!v) return '';
    if (v.kind === 'array') return MQ.V.array(v.a, v.b);
    if (v.kind === 'groups') return MQ.V.groups(v.a, v.b, v.emoji || '●');
    if (v.kind === 'line') return MQ.V.numberLine({ min: v.a, max: v.b, step: v.step, marker: v.b });
    return '';
  };
  function speech() {
    if (!run) return 'Multiply and Divide lessons.';
    const m = run.module;
    if (run.stage === 0) return `${m.see.title}. ${m.see.text} ${m.see.lines.join('. ')}`;
    if (run.stage === 1) return run.build.part === 'grouping' ? 'Make groups of 3 from 12. Tap a berry to build each group.' : `${m.build.title}. ${m.build.text}`;
    if (run.stage === 'done') return `Module complete. Great learning!`;
    if (run.stage === 'another' && !run.questions) return `${m.alternate.title}. ${m.alternate.text}`;
    const q = current();
    return q ? `${q.p.say}. ${q.message || ''}` : `${stepName(run.stage)}.`;
  }
  function autoSpeak(key) {
    if (!st().settings.readAloud || !run || run.spoken === key) return;
    run.spoken = key;
    setTimeout(() => MQ.speak(speech()), 180);
  }
  const progressDots = (stage) => `<div class="ls-progress" aria-label="Lesson progress">${L.STEPS.map((_, i) => `<span class="${i < stage ? 'done' : i === stage ? 'now' : ''}">${i < stage ? '✓' : i + 1}</span>`).join('')}</div>`;

  function hub() {
    if (st().grade !== 'g2') return K().go('home');
    const cards = L.MODULES.map((m, i) => {
      const p = L.progress(st(), m.id), open = L.isOpen(st(), m.id, S.preview);
      const status = p.done ? '⭐ Complete' : open && p.step ? `${stepName(p.step)} · continue` : open ? m.minutes : 'Finish the module before it';
      return `<button class="ls-module ${p.done ? 'done' : ''}" data-act="lessonOpen" data-arg="${m.id}" ${open ? '' : 'disabled'} data-module="${m.id}">
        <span class="ls-num">${p.done ? '⭐' : open ? i + 1 : '🔒'}</span><span class="ls-icon">${m.icon}</span><span><b>${m.title}</b><small>${status}</small></span><span class="ls-go">›</span></button>`;
    }).join('');
    K().render(K().header('📖 Learn') + `<main class="ls-hub"><section class="ls-intro"><h2>Multiply &amp; Divide</h2><p>Learn with pictures, build models, and practice one small step at a time.</p></section><div class="ls-modules">${cards}</div></main>`);
    K().setCur('lessons');
  }

  function start(id) {
    const m = L.module(id);
    if (!m || st().grade !== 'g2' || !L.isOpen(st(), id, S.preview)) return hub();
    const p = L.progress(st(), id);
    run = { module: m, stage: p.done ? 0 : Math.min(4, p.step || 0), build: L.newBuild(id), questions: null, qi: 0, showFirst: [], spoken: '' };
    enter(run.stage);
  }
  function enter(stage) {
    run.stage = stage; run.questions = null; run.qi = 0; run.spoken = '';
    if (typeof stage === 'number') L.markStep(st(), run.module.id, stage);
    if (stage === 2) run.questions = [question('together')];
    if (stage === 3) run.questions = Array.from({ length: 4 }, () => question('try'));
    if (stage === 4) { run.questions = Array.from({ length: 2 }, () => question('show')); run.showFirst = []; }
    if (stage === 'another') run.remedySeen = false;
    S.save();
    draw();
  }
  const question = (phase, alternate = false) => ({ p: L.problem(run.module.id, phase, alternate), tries: 0, locked: false, message: '', first: null, recorded: false });
  const current = () => run && run.questions && run.questions[run.qi];

  function shell(body, stage = run.stage) {
    const n = typeof stage === 'number' ? stage : 4;
    return K().header(`${run.module.icon} ${run.module.title}`, 'lessons') + `<main class="ls-page">${progressDots(n)}${body}</main>`;
  }
  function draw() {
    if (!run) return hub();
    if (run.stage === 0) return drawSee();
    if (run.stage === 1) return drawBuild();
    if (run.stage === 'another' && !run.remedySeen) return drawAnother();
    if (run.stage === 'done') return drawDone();
    return drawQuestion();
  }
  function drawSee() {
    const x = run.module.see;
    K().render(shell(`<section class="ls-card"><div class="ls-step"><span>1 · See it</span>${speakButton()}</div><h2>${x.title}</h2><p class="lead">${x.text}</p><div class="ls-visual">${visual(x.visual)}</div><ol class="ls-work">${x.lines.map((s) => `<li>${s}</li>`).join('')}</ol><button class="btn big" data-act="lessonNext">Build it →</button></section>`, 0));
    autoSpeak('see');
  }
  function buildBoard() {
    const b = run.build, m = run.module, kind = m.build.kind;
    if (kind === 'groups') {
      const counts = b.counts || [0, 0, 0];
      return `<div class="ls-build-groups">${counts.map((n, i) => `<button data-act="lessonBuild" data-arg="group:${i}" aria-label="Add to group ${i + 1}"><b>${i + 1}</b><span>${Array(n).fill('🍎').join(' ') || 'Tap'}</span></button>`).join('')}</div><p class="ls-count">${b.n} / ${m.build.goal}</p>`;
    }
    if (kind === 'share') {
      const berryPile = (n, action) => `<div class="ls-berry-pile" aria-label="${n} berries left">${Array.from({ length: n }, (_, i) => `<button data-act="lessonBuild" data-arg="${action}" aria-label="Move berry ${i + 1}">🍓</button>`).join('') || '<span class="ls-empty-pile">All 12 berries are used.</span>'}</div>`;
      if (b.part === 'grouping') {
        const groups = Array.from({ length: 4 }, (_, i) => Math.max(0, Math.min(3, b.groupingN - i * 3)));
        return `<h3 class="ls-build-prompt">Make groups of 3 from 12</h3><p>Tap the berries. Put 3 in each group.</p>${berryPile(12 - b.groupingN, 'groupBerry')}<div class="ls-berry-groups">${groups.map((n, i) => `<div class="${n === 3 ? 'full' : ''}"><b>Group ${i + 1}</b><span>${Array(n).fill('🍓').join(' ') || '· · ·'}</span></div>`).join('')}</div><p class="ls-model-note">${b.done ? '4 groups' : `${Math.floor(b.groupingN / 3)} full ${Math.floor(b.groupingN / 3) === 1 ? 'group' : 'groups'}`}</p>`;
      }
      const kids = ['🧒', '👧', '👦'], counts = b.counts || [0, 0, 0];
      return `<h3 class="ls-build-prompt">Share 12 equally among 3 kids</h3><div class="ls-share-kids">${kids.map((kid, i) => `<div><span class="ls-kid">${kid}</span><span class="ls-kid-berries">${Array(counts[i]).fill('🍓').join(' ') || 'Waiting'}</span><b>${counts[i]}</b></div>`).join('')}</div>${berryPile(12 - b.n, 'shareBerry')}<p class="ls-count">${12 - b.n} berries left</p>${b.shareDone ? '<div class="ls-good">Each kid gets 4.</div><button class="btn" data-act="lessonBuild" data-arg="startGrouping">Make groups of 3 →</button>' : ''}`;
    }
    if (kind === 'array') {
      const dots = Array.from({ length: 15 }, (_, i) => `<button data-act="lessonBuild" data-arg="dot:${i}" class="${b.filled[i] ? 'on' : ''}" aria-label="Dot ${i + 1}"></button>`).join('');
      return `<div class="ls-build-array ${b.turned ? 'turned' : ''} ${b.cut ? 'cut' : ''}">${dots}</div><div class="row"><button class="btn ghost" data-act="lessonBuild" data-arg="turn" ${b.n < 15 ? 'disabled' : ''}>↻ Turn</button><button class="btn ghost" data-act="lessonBuild" data-arg="cut" ${!b.turned ? 'disabled' : ''}>✂️ Split</button></div>${b.turned ? '<p class="ls-model-note ls-turn-note">3 × 5 = 15 and 5 × 3 = 15: same dots, turned</p>' : ''}${b.cut ? '<p class="ls-model-note ls-split-note">2 × 3 + 3 × 3 = 6 + 9 = 15</p>' : ''}`;
    }
    if (kind === 'family') return `<div class="ls-family">${['3 × 4 = 12', '4 × 3 = 12', '12 ÷ 3 = 4', '12 ÷ 4 = 3'].map((s, i) => `<button data-act="lessonBuild" data-arg="card:${i}" class="${b.filled[i] ? 'on' : ''}">${b.filled[i] ? s : '?'}</button>`).join('')}</div>`;
    if (kind === 'jumps') {
      const stops = Array.from({ length: b.n + 1 }, (_, i) => i * 2);
      const arcs = Array.from({ length: b.n }, (_, i) => { const x1 = 22 + i * 59.2, x2 = x1 + 59.2; return `<path d="M ${x1.toFixed(1)} 52 Q ${((x1 + x2) / 2).toFixed(1)} 8 ${x2.toFixed(1)} 52"/><circle cx="${x2.toFixed(1)}" cy="52" r="4"/>`; }).join('');
      return `<button class="ls-line-build" data-act="lessonBuild" data-arg="tap" ${b.done ? 'disabled' : ''}><span>Tap to jump 2</span><div class="ls-jump-line">${MQ.V.numberLine({ min: 0, max: 10, step: 2, marker: b.n ? b.n * 2 : null })}<svg class="ls-jump-arcs" viewBox="0 0 340 100" aria-hidden="true">${arcs}</svg></div><b class="ls-jump-path">${stops.join(' → ')}</b></button>`;
    }
    const dots = b.n === 0 ? 4 : b.n === 1 ? 4 : 8, rows = b.n === 0 ? 1 : 2;
    return `<button class="ls-double-build" data-act="lessonBuild" data-arg="tap" ${b.done ? 'disabled' : ''}><span>${b.n === 0 ? 'Tap to double 4' : b.n === 1 ? 'Tap to double 8' : 'Double 8 = 16'}</span><div class="ls-double-rows">${Array.from({ length: rows }, () => `<div>${Array(dots).fill('<i></i>').join('')}</div>`).join('')}</div><b>${b.n === 0 ? '4' : b.n === 1 ? '4 + 4 = 8' : '8 + 8 = 16'}</b></button>`;
  }
  function drawBuild() {
    const x = run.module.build;
    K().render(shell(`<section class="ls-card"><div class="ls-step"><span>2 · Build it</span>${speakButton()}</div><h2>${x.title}</h2><p class="lead">${x.text}</p>${buildBoard()}${run.build.done ? '<div class="ls-good">✓ You built it!</div><button class="btn big" data-act="lessonNext">Solve together →</button>' : ''}</section>`, 1));
    autoSpeak(`build:${run.build.part || 'main'}`);
  }
  function drawQuestion() {
    const q = current();
    if (!q) return nextStage();
    const title = run.stage === 2 ? '3 · Solve together' : run.stage === 3 ? `4 · Try it · ${run.qi + 1} of ${run.questions.length}` : run.stage === 'another' ? `Try a new one · ${run.qi + 1} of 2` : `5 · Show what you know · ${run.qi + 1} of 2`;
    const guided = run.stage === 2 ? `<div class="ls-guide">💡 ${run.module.together.text}</div>` : '';
    const choices = q.p.choices.map((c, i) => `<button class="ls-choice ${q.locked && c === q.p.answer ? 'right' : ''}" data-act="lessonAnswer" data-arg="${i}" ${q.locked ? 'disabled' : ''}>${c}</button>`).join('');
    const feedback = q.message ? `<div class="ls-feedback ${q.locked ? 'answer' : 'hint'}">${q.message}</div>` : '';
    K().render(shell(`<section class="ls-card"><div class="ls-step"><span>${title}</span>${speakButton()}</div>${guided}<div class="ls-visual">${visual(q.p.visual)}</div><h2 class="ls-question">${q.p.text}</h2><div class="ls-choices">${choices}</div>${feedback}${q.locked ? '<button class="btn big" data-act="lessonNext">Next →</button>' : ''}</section>`, run.stage));
    autoSpeak(`${run.stage}:${run.qi}:${q.tries}`);
  }
  function drawAnother() {
    const x = run.module.alternate;
    K().render(shell(`<section class="ls-card ls-another"><div class="ls-step"><span>Another way</span>${speakButton()}</div><h2>${x.title}</h2><p class="lead">${x.text}</p><div class="ls-visual">${visual(x.visual)}</div><button class="btn big" data-act="lessonRemedy">Try 2 new problems →</button></section>`, 4));
    autoSpeak('another');
  }
  function drawDone() {
    const d = L.practiceDifficulty(run.module.id), label = d === 1 ? 'Sprout' : d === 2 ? 'Explorer' : 'Expert';
    K().render(shell(`<section class="ls-card ls-finish"><div class="ls-bigstar">⭐</div><h1>Module complete!</h1><p>You learned ${run.module.title.toLowerCase()}.</p>${run.firstFinish ? '<div class="ls-reward">+5 💎</div>' : ''}<div class="row"><button class="btn ghost" data-act="go" data-arg="lessons">All modules</button><button class="btn" data-act="lessonPractice" data-arg="${run.module.id}">Practice · ${label} →</button></div></section>`, 4));
    autoSpeak('done');
  }

  function advanceQuestion() {
    run.qi++;
    if (run.qi < run.questions.length) { run.spoken = ''; return draw(); }
    if (run.stage === 2) return enter(3);
    if (run.stage === 3) return enter(4);
    if (run.stage === 4) return L.assessmentPath(run.showFirst) === 'done' ? finish() : enter('another');
    if (run.stage === 'another') return finish();
  }
  function nextStage() {
    if (run.stage === 0) return enter(1);
    if (run.stage === 1) return enter(2);
    return advanceQuestion();
  }
  function finish() {
    const result = L.finish(st(), run.module.id);
    run.firstFinish = result.first;
    if (result.first && !S.preview) K().addGems(5);
    S.save(); K().checkBadges(); MQ.sfx('reward'); MQ.confetti(70);
    run.stage = 'done'; run.questions = null; run.spoken = ''; draw();
  }

  const actions = {
    lessonOpen: (id) => start(id),
    lessonSpeak: () => MQ.speak(speech()),
    lessonNext: () => { const q = current(); if (q && !q.locked) return; nextStage(); },
    lessonBuild: (action) => { run.build = L.buildTap(run.build, action); MQ.sfx('tap'); drawBuild(); },
    lessonRemedy: () => { run.remedySeen = true; run.questions = [question('another', true), question('another', true)]; run.qi = 0; run.spoken = ''; draw(); },
    lessonAnswer: (arg) => {
      const q = current(); if (!q || q.locked) return;
      const given = q.p.choices[+arg], right = given === q.p.answer, first = q.tries === 0;
      if (!q.recorded && run.stage !== 2) {
        K().record(q.p, right, given); q.recorded = true; q.first = right;
        if (right && !S.preview) K().addGems(1);
        if (run.stage === 4) run.showFirst.push(right);
        S.save();
      }
      if (right) { q.locked = true; q.message = `✓ ${q.p.explain}`; st().stats.correct++; S.save(); MQ.sfx('correct'); }
      else if (q.tries === 0) { q.tries = 1; q.message = run.stage === 4 ? 'Not quite. Try once more.' : `Try again. ${L.hint(q.p, given)}`; MQ.sfx('wrong'); }
      else { q.tries = 2; q.locked = true; q.message = `The answer is ${q.p.answer}. ${q.p.explain}`; MQ.sfx('wrong'); }
      drawQuestion();
    },
    lessonPractice: (id) => K().startPractice('mult', L.practiceDifficulty(id)),
  };
  MQ.lessonsUI = { show: (arg) => arg ? start(arg) : hub(), actions, session: () => run };
})();
