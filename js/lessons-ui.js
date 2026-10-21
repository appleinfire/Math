// Learn screens for the Add & Subtract and Multiply & Divide courses. Rules and content are in js/lessons.js.
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
    const V = MQ.V;
    if (v.kind === 'array') return V.array(v.a, v.b);
    if (v.kind === 'groups') return V.groups(v.a, v.b, v.emoji || '●');
    if (v.kind === 'line') return V.numberLine({ min: v.a, max: v.b, step: v.step, marker: v.b });
    if (v.kind === 'bond') return V.bond(v.whole, v.a, v.b);
    if (v.kind === 'arrows') return V.arrows(v.start, v.steps);
    if (v.kind === 'chart') return V.pvChart(v.h, v.t, v.o);
    if (v.kind === 'column') return V.column(v.nums, v.op);
    if (v.kind === 'blocks') return V.blocks(v.h, v.t, v.o);
    return '';
  };
  const D_NAMES = { 1: 'Sprout', 2: 'Explorer', 3: 'Ranger', 4: 'Expert', 5: 'Legend' };
  // Place value disks for Build it: a disk is a button when tapping its place does something.
  const disk = (label, cls = '', act = '') => (act ? `<button class="ls-disk d${label} ${cls}" data-act="lessonBuild" data-arg="${act}" aria-label="${label}">${label}</button>` : `<span class="ls-disk d${label} ${cls}">${label}</span>`);
  const pvBoard = (cols) => `<div class="ls-pv">${cols.map((c) => `<div class="ls-pv-col"><b>${c.name}</b><div class="ls-pv-disks">${c.disks.join('') || `<em>no ${c.name}</em>`}</div></div>`).join('')}</div>`;
  const many = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  function speech() {
    if (!run) return 'Learn: Add and Subtract, Multiply and Divide.';
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
    const course = (c) => {
      const list = L.courseModules(c.id), cards = list.map((m, i) => {
        const p = L.progress(st(), m.id), open = L.isOpen(st(), m.id, S.preview);
        const status = p.done ? '⭐ Complete' : open && p.step ? `${stepName(p.step)} · continue` : open ? m.minutes : 'Finish the module before it';
        return `<button class="ls-module ${p.done ? 'done' : ''}" data-act="lessonOpen" data-arg="${m.id}" ${open ? '' : 'disabled'} data-module="${m.id}">
          <span class="ls-num">${p.done ? '⭐' : open ? i + 1 : '🔒'}</span><span class="ls-icon">${m.icon}</span><span><b>${m.title}</b><small>${status}</small></span><span class="ls-go">›</span></button>`;
      }).join('');
      return `<section class="ls-intro" data-course="${c.id}"><h2>${c.icon} ${esc(c.title)} <small>${L.completed(st(), c.id)} / ${list.length}</small></h2><p>${c.intro}</p></section><div class="ls-modules">${cards}</div>`;
    };
    K().render(K().header('📖 Learn') + `<main class="ls-hub">${L.COURSES.map(course).join('')}</main>`);
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
    if (kind === 'tenframe') { // 8 + 5: move dots from the second frame to fill the first ten
      const first = many(10, (i) => `<i class="${i < 8 ? 'on' : i < 8 + b.n ? 'on new' : ''}"></i>`).join(''), left = 5 - b.n;
      const second = many(10, (i) => (i < left ? `<button data-act="lessonBuild" data-arg="move" aria-label="Move a dot"></button>` : '<i></i>')).join('');
      return `<div class="ls-frames"><div class="ls-frame">${first}</div><span class="ls-plus">+</span><div class="ls-frame two">${second}</div></div><p class="ls-model-note">${b.done ? '8 + 5 = 10 + 3 = 13' : `Move ${2 - b.n} more to make 10`}</p>`;
    }
    if (kind === 'pvadd') { // 34 + 25 on the chart
      return pvBoard([{ name: 'tens', disks: [...many(3, () => disk(10)), ...many(b.t, () => disk(10, 'new'))] }, { name: 'ones', disks: [...many(4, () => disk(1)), ...many(b.o, () => disk(1, 'new'))] }]) +
        `<div class="row"><button class="btn ghost" data-act="lessonBuild" data-arg="ten" ${b.t >= 2 ? 'disabled' : ''}>+ 1 ten</button><button class="btn ghost" data-act="lessonBuild" data-arg="one" ${b.o >= 5 ? 'disabled' : ''}>+ 1 one</button></div>` +
        `<p class="ls-model-note">${b.done ? '34 + 25 = 5 tens 9 ones = 59' : `Added ${b.t} of 2 tens and ${b.o} of 5 ones`}</p>`;
    }
    if (kind === 'bundle') { // 47 + 26 = 6 tens 13 ones: pick 10 ones to bundle
      const ones = b.done ? many(3, () => disk(1)) : many(13, (i) => (i < b.n ? disk(1, 'sel') : disk(1, '', 'one')));
      return pvBoard([{ name: 'tens', disks: [...many(6, () => disk(10)), ...(b.done ? [disk(10, 'new')] : [])] }, { name: 'ones', disks: ones }]) +
        `<p class="ls-model-note">${b.done ? '10 ones make 1 new ten: 47 + 26 = 7 tens 3 ones = 73' : `${b.n} of 10 ones picked`}</p>`;
    }
    if (kind === 'unbundle') { // 52 − 27: unbundle a ten, take away 7 ones and 2 tens
      const tensN = b.unb ? 4 : 5, onesN = b.unb ? 12 : 2;
      const tens = many(tensN, (i) => (i >= tensN - b.tens ? disk(10, 'gone') : disk(10, '', 'ten')));
      const ones = many(onesN, (i) => (i >= onesN - b.ones ? disk(1, 'gone') : disk(1, b.unb && i >= 2 ? 'new' : '', 'one')));
      return pvBoard([{ name: 'tens', disks: tens }, { name: 'ones', disks: ones }]) +
        `<p class="ls-model-note">${b.done ? '52 − 27 = 2 tens 5 ones = 25' : !b.unb ? 'Tap a ten to unbundle it into 10 ones.' : `Take away ${7 - b.ones} more ones and ${2 - b.tens} more tens.`}</p>`;
    }
    if (kind === 'bundle2') { // 365 + 248 = 5 hundreds 10 tens 13 ones
      const t = [10, 11, 1][b.step], o = [13, 3, 3][b.step], live = (act) => (b.done ? '' : act);
      return pvBoard([{ name: 'hundreds', disks: many(b.step === 2 ? 6 : 5, (i) => disk(100, i === 5 ? 'new' : '')) }, { name: 'tens', disks: many(t, (i) => disk(10, b.step === 1 && i === 10 ? 'new' : '', live('tens'))) }, { name: 'ones', disks: many(o, () => disk(1, '', live('ones'))) }]) +
        `<p class="ls-model-note">${['Tap the ones: 13 ones. Bundle 10 of them into a ten.', 'Now tap the tens: 11 tens. Bundle 10 of them into a hundred.', '365 + 248 = 6 hundreds 1 ten 3 ones = 613'][b.step]}</p>`;
    }
    if (kind === 'zeros') { // 400: unbundle a hundred, then a ten
      return pvBoard([{ name: 'hundreds', disks: many(b.step === 0 ? 4 : 3, () => disk(100, '', b.done ? '' : 'hundred')) }, { name: 'tens', disks: many([0, 10, 9][b.step], () => disk(10, '', b.done ? '' : 'ten')) }, { name: 'ones', disks: many(b.step === 2 ? 10 : 0, () => disk(1, 'new')) }]) +
        `<p class="ls-model-note">${['Tap a hundred to unbundle it into 10 tens.', 'Now tap a ten to unbundle it into 10 ones.', 'Ready: 3 hundreds 9 tens 10 ones. 400 − 247 = 153'][b.step]}</p>`;
    }
    const dots = b.n === 0 ? 4 : b.n === 1 ? 4 : 8, rows = b.n === 0 ? 1 : 2;
    return `<button class="ls-double-build" data-act="lessonBuild" data-arg="tap" ${b.done ? 'disabled' : ''}><span>${b.n === 0 ? 'Tap to double 4' : b.n === 1 ? 'Tap to double 8' : 'Double 8 = 16'}</span><div class="ls-double-rows">${Array.from({ length: rows }, () => `<div>${Array(dots).fill('<i></i>').join('')}</div>`).join('')}</div><b>${b.n === 0 ? '4' : b.n === 1 ? '4 + 4 = 8' : '8 + 8 = 16'}</b></button>`;
  }
  function drawBuild() {
    const x = run.module.build;
    K().render(shell(`<section class="ls-card"><div class="ls-step"><span>2 · Build it</span>${speakButton()}</div><h2>${x.title}</h2><p class="lead">${run.build.part === 'grouping' ? 'Now the other meaning: how many groups of 3 are in 12?' : x.text}</p>${buildBoard()}${run.build.msg ? `<p class="ls-build-msg">${run.build.msg}</p>` : ''}${run.build.done ? '<div class="ls-good">✓ You built it!</div><button class="btn big" data-act="lessonNext">Solve together →</button>' : ''}</section>`, 1));
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
    const label = D_NAMES[L.practiceDifficulty(run.module.id)];
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
    lessonPractice: (id) => { const pr = L.practice(id); K().startPractice(pr.topic, pr.d); },
  };
  MQ.lessonsUI = { show: (arg) => arg ? start(arg) : hub(), actions, session: () => run };
})();
