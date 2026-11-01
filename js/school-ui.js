// School lessons screens: the program's modules, a lesson page with its steps, and 💡 How it works (big ideas and
// solved examples). Rules and data are in js/school.js; the practice runs in the app's game loop (startClass in js/app.js).
// Routes: 'school' (modules), 'school:3:1' (a lesson), 'school:3:1:how' (its How it works); 'now' is the topics lesson.
(function () {
  const MQ = globalThis.MQ, SC = MQ.school, S = MQ.store, U = MQ.U;
  const K = () => MQ.app.kit;
  const st = () => K().state();
  const esc = (s) => U.esc(String(s));
  const D_NAMES = { 1: 'Sprout', 2: 'Explorer', 3: 'Ranger', 4: 'Expert', 5: 'Legend' };
  const D_ICONS = { 1: '🌱', 2: '🧭', 3: '🏕️', 4: '🏔️', 5: '🐉' };
  let shown = null; // the module the child opened: { who, wk, n }, kept until this week's lessons change
  let ex = null; // the solved example on How it works: { key, i: step, p }
  const keepScroll = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
  const weekKey = (s) => { const wk = SC.week(s); return wk ? wk.unit + ':' + wk.part : ''; };
  const shownUnit = (s) => (shown && shown.who === s.id && shown.wk === weekKey(s) ? shown.n : SC.week(s) ? SC.week(s).unit : 0);
  const opened = (s, L) => !L.unit || SC.isOpen(s, L.unit.n, S.preview);
  const unitName = (L) => SC.PROGRAMS[L.program].unitName;
  const lead = (L) => (L.part ? `${esc(unitName(L))} ${L.unit.n} · ${esc(L.title)}` : esc(L.title));
  // what: 'learn', 'check' or a step index → the button that opens it, and its name
  const act = (L, what) => (what === 'learn' ? `data-act="go" data-arg="school:${L.id}:how"` : what === 'check' ? `data-act="classPractice" data-arg="${L.id}"` : `data-act="classStep" data-arg="${L.id}|${what}"`);
  const label = (L, what) => (what === 'learn' ? 'How it works' : what === 'check' ? 'Lesson check' : `Step ${what + 1}`);
  const bar = (pr) => `<span class="sc-bar" aria-hidden="true"><i style="width:${Math.round((pr.earned / pr.total) * 100)}%"></i></span>`;
  const meter = (pr, L) => (pr.mastered ? '🏆 Mastered' : pr.earned ? `${pr.done ? '✓ ' : ''}★ ${pr.earned} / ${pr.total}` : pr.learn ? 'Started' : `${L.steps.length} ${L.steps.length === 1 ? 'step' : 'steps'} and a check`);
  const speakBtn = (what) => (MQ.canSpeak() ? `<button class="speak" data-act="schoolSpeak" data-arg="${what}" aria-label="Read aloud">🔊</button>` : '');

  // ---- the modules of the program, each opening to its lesson groups
  function modules() {
    const s = st(), pid = SC.program(s);
    if (!pid) return K().go('home');
    if (pid === 'topics') return lesson('now');
    const units = SC.units(pid, s.grade), wk = SC.week(s), P = SC.PROGRAMS[pid], n = shownUnit(s);
    const W = wk && SC.lesson(s, weekKey(s));
    const now = W ? `<button class="sc-week" data-act="go" data-arg="school:${W.id}"><span class="sc-wi">🏫</span><span><b>In class now</b><small>${esc(W.title)} · ${esc(W.sub)}</small></span><span class="btn">Open ▶</span></button>` : '';
    const list = units.map((u) => {
      const open = SC.isOpen(s, u.n, S.preview), here = !!wk && wk.unit === u.n, isShown = open && n === u.n, up = SC.unitProgress(s, u.n);
      const parts = isShown ? `<div class="sc-parts">${u.parts.map((p, i) => {
        const L = SC.lesson(s, `${u.n}:${i}`), pr = SC.progress(s, L), isNow = here && wk.part === i;
        return `<button class="sc-part ${isNow ? 'now' : ''} ${pr.mastered ? 'mastered' : ''}" data-act="go" data-arg="school:${L.id}"><b>Lessons ${p.from}–${p.to}</b><small>${esc(p.title)}</small><span class="sc-pr">${pr.earned || pr.learn ? bar(pr) : ''}<span>${meter(pr, L)}</span></span>${isNow ? '<span class="sc-tag">🏫 In class now</span>' : ''}</button>`;
      }).join('')}</div>` : '';
      const note = open ? `${P.unitName} ${u.n} · ${u.parts.length} lesson groups${up.mastered ? ` · 🏆 ${up.mastered}` : ''}${up.done ? ` · ✓ ${up.done} done` : ''}${here ? ' · 🏫 in class now' : ''}` : 'A grown-up can open it';
      return `<section class="sc-unit ${open ? '' : 'locked'} ${isShown ? 'open' : ''} ${here ? 'here' : ''}"><button class="sc-head" data-act="schoolUnit" data-arg="${u.n}" aria-expanded="${isShown}"><span class="sc-num">${open ? (up.parts && up.mastered === up.parts ? '🏆' : u.n) : '🔒'}</span><span><b>${esc(u.title)}</b><small>${note}</small></span><span class="sc-go">${isShown ? '▾' : '›'}</span></button>${parts}</section>`;
    }).join('');
    K().render(K().header('School lessons') + `<main class="school"><p class="lead">${esc(P.short)} · ${MQ.track(s.grade).label}</p>${now}<p class="muted">Pick any lessons. Each one teaches the big ideas, then practices every skill step by step.</p><div class="sc-units">${list}</div></main>`);
    K().setCur('school');
  }

  // ---- a lesson: How it works, the steps (8 right answers each) and the lesson check, with stars for each
  function lesson(id) {
    const s = st(), L = SC.lesson(s, id);
    if (!L || !opened(s, L)) return K().go(SC.program(s) === 'topics' || !SC.program(s) ? 'home' : 'school');
    const pr = SC.progress(s, L), nx = SC.upNext(s, L);
    const row = (what, icon, name, small, status, done) => `<li><button class="sl-step ${done ? 'done' : ''} ${nx === what ? 'next' : ''}" ${act(L, what)}><span class="sl-ic">${icon}</span><span class="sl-tx"><b>${name}</b><small>${small}</small></span><span class="sl-st">${status}</span></button></li>`;
    const steps = L.steps.map((x, k) => row(k, k + 1, esc(x.name), `${x.d ? `${D_ICONS[x.d]} ${D_NAMES[x.d]} · ` : ''}${SC.STEP_GOAL} right answers`, K().starStr(pr.steps[k]), pr.steps[k] === 3)).join('');
    const go = nx === null ? `<div class="unlock">🏆 Lesson mastered: ★★★ everywhere! Any step can be practiced again.</div>`
      : `<button class="btn big sl-go" ${act(L, nx)}>${pr.learn ? 'Continue' : 'Start'}: ${label(L, nx)}${typeof nx === 'number' ? ' · ' + esc(L.steps[nx].name) : ''} ▶</button>`;
    const learnLink = L.learn && s.grade === 'g2' && MQ.lessons && MQ.lessons.module(L.learn) ? `<button class="btn ghost" data-act="go" data-arg="lessons:${L.learn}">📖 Learn: ${esc(MQ.lessons.module(L.learn).title)}</button>` : '';
    const nextLink = L.next ? `<button class="btn ghost" data-act="go" data-arg="school:${L.next}">Next lessons ›</button>` : '';
    K().render(K().header(L.part ? `Lessons ${L.part.from}–${L.part.to}` : 'In class now', id === 'now' ? 'home' : 'school') + `<main class="school sl-lesson">
      <p class="lead">${lead(L)}${L.now && L.part ? ' <span class="sc-tag">🏫 In class now</span>' : ''}</p>
      <div class="sl-meter">${bar(pr)}<b>${pr.mastered ? '🏆' : '★'} ${pr.earned} / ${pr.total}</b></div>
      ${go}
      <ol class="sl-path">
        ${row('learn', '💡', 'How it works', 'Big ideas and solved examples', pr.learn ? '✓' : '', pr.learn)}
        ${steps}
        ${row('check', '🏆', 'Lesson check', `${SC.CHECK_GOAL} right answers, all the steps mixed${L.pi ? ', and earlier lessons too' : ''}`, K().starStr(pr.check), pr.check === 3)}
      </ol>
      <p class="muted">A step with no mistakes gets ★★★. Practice a step again any time to get better.</p>
      ${learnLink || nextLink ? `<div class="row">${learnLink}${nextLink}</div>` : ''}
    </main>`);
    K().setCur('school:' + L.id);
  }

  // ---- How it works: the big ideas and a solved example of every step
  // A question with its answer filled in, how to think about it, and why.
  function solved(p) {
    const blank = /<span class="blank">\?<\/span>/g, n = (p.text.match(blank) || []).length;
    let text = p.text, vis = p.visual || '';
    if (p.kind === 'num' || (p.kind === 'choice' && n === 1)) text = text.replace(blank, `<span class="blank shown">${esc(p.kind === 'num' ? U.comma(p.answer) : p.answer)}</span>`);
    if (p.kind === 'num') { // the answer in its box: a written column, or the end (or the missing jump) of the arrows
      vis = vis.replace(/<span class="num ans">( *)\?<\/span>/, (m, sp) => `<span class="num ans shown">${String(p.answer).padStart(sp.length + 1, ' ')}</span>`)
        .replace(/<span class="anum q">\?<\/span>/, `<span class="anum sl-got">${p.answer}</span>`).replace(/<small>([+−])\?<\/small>/, `<small class="sl-got">$1${p.answer}</small>`);
    }
    if (p.kind === 'line') vis += MQ.V.numberLine(Object.assign({}, p.line, { pick: false, correct: p.answer }));
    // select all: every choice, the right ones green and the others crossed out
    const picks = p.kind === 'multi' ? `<div class="sl-picks">${p.choices.map((c, i) => { const ok = p.answer.includes(c); return `<span class="sl-pick ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${p.choiceHtml ? p.choiceHtml[i] : esc(c)}</span>`; }).join('')}</div>` : '';
    const ans = p.kind === 'multi' ? `✓ The right ones are <b>green</b>.` : `✓ The answer is <b>${K().fmtAnswer(p)}</b>.`;
    return `<div class="pcard sl-card"><div class="ptext ${p.big ? 'eq' : ''} ${p.wordy ? 'wordy' : ''}">${text}</div>${vis ? `<div class="pvis">${vis}</div>` : ''}${picks}
      <div class="sl-sol"><div class="sl-think"><b>💡 Think:</b> ${p.hint || 'Read it slowly and look at the picture.'}</div><div class="sl-ans">${ans}</div>${p.explain ? `<div class="explain">${p.explain}</div>` : ''}</div></div>`;
  }
  const solvedSpeech = (p) => `${MQ.toSpeech(p.text)}. Think: ${MQ.toSpeech(p.hint || '')}. ${p.kind === 'multi' ? 'The right ones are green' : `The answer is ${MQ.toSpeech(K().fmtAnswer(p)) || 'the green one'}`}.`;
  const qkey = (p) => (p ? p.text + (p.visual || '') : '');
  const newExample = (L, i) => { ex = { key: L.key, i, p: SC.example(SC.pick(L.steps[i].skills), qkey(ex && ex.p)) }; };
  const exampleHtml = (L) => `<div class="sl-h"><h2>👀 Watch one</h2>${speakBtn('example')}</div>
    ${L.steps.length > 1 ? `<div class="chips sl-chips">${L.steps.map((x, k) => `<button class="chip ${k === ex.i ? 'sel' : ''}" data-act="schoolExample" data-arg="${k}" title="${esc(x.name)}">Step ${k + 1}</button>`).join('')}</div>` : ''}
    <p class="muted">Step ${ex.i + 1} · ${esc(L.steps[ex.i].name)}</p>${solved(ex.p)}
    <div class="row"><button class="btn ghost" data-act="schoolExample" data-arg="${ex.i}">Another example ▶</button></div>`;
  let howL = null; // the lesson on the How it works screen
  function how(id) {
    const s = st(), L = SC.lesson(s, id);
    if (!L || !opened(s, L)) return K().go('school');
    SC.save(s, L, 'learn');
    S.save();
    howL = L;
    if (!ex || ex.key !== L.key) { ex = null; newExample(L, 0); }
    const nx = SC.upNext(s, L);
    K().render(K().header('How it works', 'school:' + L.id) + `<main class="school sl-how">
      <p class="lead">${L.part ? `Lessons ${L.part.from}–${L.part.to} · ` : ''}${esc(L.title)}</p>
      <section class="sl-ideas"><div class="sl-h"><h2>💡 Big ideas</h2>${speakBtn('ideas')}</div><ul>${L.teach.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
      <section class="sl-ex" id="sl-ex">${exampleHtml(L)}</section>
      <button class="btn big sl-go" ${act(L, nx === null || nx === 'learn' ? 0 : nx)}>Let’s practice ▶</button>
    </main>`);
    if (s.settings.readAloud) setTimeout(() => MQ.speak(L.teach.join('. ')), 200);
  }

  // ---- 💡 during practice: the big ideas and a solved question like the one on screen (nothing is counted)
  function help() {
    const sess = MQ.app.session();
    if (!sess || !sess.classSet || !sess.p) return;
    const p = sess.p, sk = p.kindId ? { kind: p.kindId, topic: p.topic, d: p.d } : { topic: p.topic, d: p.d };
    const e = SC.example(sk, qkey(p), p.text);
    K().modal(`<div class="mtitle">💡 How it works</div><ul class="sl-tips">${sess.classSet.teach.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <h3 class="sl-mh">👀 One like it, solved</h3>${solved(e)}<div class="row"><button class="btn" data-act="closeModal">Back to my problem</button></div>`);
  }

  // ---- the end of a step or a lesson check (called by the app's result screen): stars for a whole round, what is next
  function finish(sess) {
    const s = st(), c = sess.classSet, L = SC.lesson(s, c.id) || c, what = c.step >= 0 ? c.step : 'check';
    const full = sess.correct >= sess.goal, stars = full ? SC.stars(sess.mistakes) : 0;
    const p0 = SC.progress(s, L), best0 = what === 'check' ? p0.check : p0.steps[what];
    const mastered = full && SC.save(s, L, what, stars);
    if (mastered) K().addGems(SC.MASTER_GEMS);
    const nx = SC.upNext(s, L), name = what === 'check' ? 'Lesson check' : `Step ${what + 1} · ${L.steps[what].name}`;
    const again = what === 'check' ? act(L, 'check') : act(L, what);
    const nxAct = nx === null ? (L.next ? `data-act="go" data-arg="school:${L.next}"` : '') : act(L, nx);
    const more = nx === what || !nxAct
      ? `<button class="btn" ${again}>${full && stars < 3 ? 'Try for ★★★' : 'Practice again'}</button>`
      : `<button class="btn ghost" ${again}>Practice again</button><button class="btn" ${nxAct}>${nx === null ? 'Next lessons' : 'Next: ' + label(L, nx)} ▶</button>`;
    return {
      title: !full ? 'Good practice!' : mastered ? 'Lesson mastered!' : what === 'check' ? 'Lesson check done!' : 'Step done!',
      lead: `${esc(name)}${L.part ? ` · ${esc(L.title)}` : ''}`,
      extra: full ? `<div class="sl-stars">${K().starStr(stars)}</div>${best0 && stars > best0 ? '<p class="muted">New best!</p>' : ''}${stars < 3 ? '<p class="muted">No mistakes gets ★★★.</p>' : ''}${mastered ? `<div class="unlock">🏆 ★★★ on every step and the check! <b>+${SC.MASTER_GEMS} 💎</b></div>` : ''}`
        : `<p class="muted">Get ${sess.goal} right to earn stars for this ${what === 'check' ? 'check' : 'step'}.</p>`,
      buttons: `<button class="btn ghost" data-act="go" data-arg="school:${L.id}">Lesson</button>${more}`,
      stars,
    };
  }

  const actions = {
    schoolUnit: (a) => {
      const s = st();
      if (!SC.isOpen(s, +a, S.preview)) return K().toast('🔒 A grown-up can open this module in <b>For grown-ups</b>.');
      shown = { who: s.id, wk: weekKey(s), n: shownUnit(s) === +a ? 0 : +a };
      keepScroll(modules);
    },
    schoolExample: (a) => {
      if (!howL) return;
      newExample(howL, U.clamp(+a || 0, 0, howL.steps.length - 1));
      const box = document.getElementById('sl-ex');
      if (box) box.innerHTML = exampleHtml(howL);
      if (st().settings.readAloud) MQ.speak(solvedSpeech(ex.p));
    },
    schoolSpeak: (a) => { if (howL) MQ.speak(a === 'ideas' ? howL.teach.join('. ') : solvedSpeech(ex.p)); },
    classHow: () => help(),
  };
  const show = (arg) => {
    if (!arg) return modules();
    const parts = String(arg).split(':');
    return parts[parts.length - 1] === 'how' ? how(parts.slice(0, -1).join(':')) : lesson(arg);
  };
  MQ.schoolUI = { show, finish, actions, solved };
})();
