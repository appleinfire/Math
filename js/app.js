// UI: screens, game loop, rewards. Screens render into #app; clicks are routed through data-act attributes.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, S = MQ.store;
  const D_NAMES = { 1: 'Sprout', 2: 'Explorer', 3: 'Ranger', 4: 'Expert', 5: 'Legend' };
  const D_ICONS = { 1: '🌱', 2: '🧭', 3: '🏕️', 4: '🏔️', 5: '🐉' };
  const CORE = ['add20', 'place', 'add100', 'sub100', 'arrays', 'time', 'money', 'shapes', 'measure', 'data', 'big', 'words'];
  const DAILY_REWARD = 15;

  let st = null; // MQ.state
  let sess = null; // current play session
  let timers = [];
  let ui = {}; // small per-screen UI state (onboarding pick, hatch, reset confirm…)

  const $ = (sel) => document.querySelector(sel);
  const root = () => document.getElementById('app');
  const esc = U.esc;
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (sess && sess.interval) { clearInterval(sess.interval); sess.interval = null; }
  }
  function render(html, cls = '') {
    clearTimers();
    const r = root();
    r.className = cls;
    r.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- helpers
  const worldIndex = (id) => MQ.WORLDS.findIndex((w) => w.id === id);
  const worldOpen = (i) => st.settings.unlockAll || i === 0 || !!st.levels[MQ.WORLDS[i - 1].id + '-5'];
  const levelOpen = (w, i) => worldOpen(worldIndex(w.id)) && (st.settings.unlockAll || i === 0 || !!st.levels[w.id + '-' + (i - 1)]);
  const worldStars = (w) => w.levels.reduce((s, _, i) => s + ((st.levels[w.id + '-' + i] || {}).stars || 0), 0);
  const starStr = (n, of = 3) => '<span class="stars">' + U.range(1, of).map((i) => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('') + '</span>';
  const gemPill = () => `<span class="pill gem" aria-label="crystals">💎 <b id="gems">${st.crystals}</b></span>`;
  const levelName = (lv, i) => (lv.type === 'boss' ? 'Guardian' : lv.type === 'challenge' ? 'Challenge' : 'Level ' + (i + 1));
  const levelIcon = (lv, i) => (lv.type === 'boss' ? '👑' : lv.type === 'challenge' ? '⚡' : String(i + 1));
  const fmtChoice = (c) => {
    if (/^\d+\/\d+$/.test(c)) { const [a, b] = c.split('/'); return `<span class="frac"><span>${a}</span><span>${b}</span></span>`; }
    return esc(c);
  };
  const fmtAnswer = (p) => (p.kind === 'choice' ? fmtChoice(p.answer) : U.comma(p.answer) + (p.unit ? ' ' + p.unit : ''));

  function header(title, back = 'home') {
    return `<header class="bar"><button class="iconbtn" data-act="go" data-arg="${back}" aria-label="Back">←</button><h1>${title}</h1>${gemPill()}</header>`;
  }
  function say(text) {
    const b = $('#bubble');
    if (!b) return;
    b.textContent = text;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
  }
  function toast(html, cls = '') {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + cls;
    t.innerHTML = html;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  function modal(html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal';
    m.id = 'modal';
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  function addGems(n) {
    st.crystals += n;
    const g = $('#gems');
    if (g) { g.textContent = st.crystals; g.parentNode.classList.remove('bump'); void g.offsetWidth; g.parentNode.classList.add('bump'); }
  }
  function addXp(n) {
    const before = MQ.levelFromXp(st.xp).level;
    st.xp += n;
    const after = MQ.levelFromXp(st.xp).level;
    if (after > before) {
      later(() => { toast(`⬆️ <b>Explorer Level ${after}!</b> ${MQ.rankTitle(after)}`, 'gold'); MQ.sfx('streak'); }, 400);
    }
  }
  function checkBadges() {
    let any = false;
    for (const b of MQ.BADGES) {
      if (!st.badges[b.id] && b.test(st)) {
        st.badges[b.id] = U.dateKey();
        toast(`${b.icon} New badge: <b>${b.name}</b>`, 'gold');
        any = true;
      }
    }
    if (any) { S.save(); MQ.sfx('reward'); }
  }
  function creatureCard(c, reveal = false) {
    const w = MQ.WORLDS.find((x) => x.id === c.world);
    return `<div class="creature ${reveal ? 'reveal' : ''} r-${c.rarity}">
      <div class="creature-inner">
        <div class="cfront">?</div>
        <div class="cback">
          <div class="ctag">${c.rarity === 'common' ? 'Discovered' : c.rarity}</div>
          <div class="cemoji">${c.emoji}</div>
          <div class="cname">${c.name}</div>
          <p class="cfact">${c.fact}</p>
          <div class="cwhere">${w ? w.emoji + ' ' + w.name : '🥚 Hatchery'}</div>
        </div>
      </div></div>`;
  }

  // ---------------------------------------------------------------- onboarding
  function onboarding() {
    ui.buddy = ui.buddy || st.companion || '🦊';
    render(`<main class="onboard">
      <div class="ob-hero" aria-hidden="true">🧭</div>
      <h1 class="title">Math Expedition</h1>
      <p class="lead">Explore eight wild worlds, solve number puzzles, and discover amazing real animals.</p>
      <label for="ob-name">What’s your name, explorer?</label>
      <input id="ob-name" class="field" maxlength="16" autocomplete="off" value="${esc(st.name)}" placeholder="Your name">
      <div class="label">Pick an expedition buddy</div>
      <div class="buddies">${MQ.COMPANIONS.map((c) => `<button class="buddy-pick ${ui.buddy === c.e ? 'sel' : ''}" data-act="pickBuddy" data-arg="${c.e}" aria-label="${c.n}">${c.e}</button>`).join('')}</div>
      <label for="ob-buddy">Name your buddy</label>
      <input id="ob-buddy" class="field" maxlength="14" autocomplete="off" value="${esc(st.buddyName || 'Pip')}">
      <button class="btn big" data-act="startGame">Start the adventure →</button>
    </main>`, 'is-onboard');
  }

  // ---------------------------------------------------------------- home
  function nextUp() {
    for (let wi = 0; wi < MQ.WORLDS.length; wi++) {
      if (!worldOpen(wi)) break;
      const w = MQ.WORLDS[wi];
      const li = w.levels.findIndex((_, i) => !st.levels[w.id + '-' + i]);
      if (li >= 0 && levelOpen(w, li)) return { w, li };
    }
    return null;
  }
  function home() {
    if (!st.name) return onboarding();
    const lv = MQ.levelFromXp(st.xp);
    const pct = Math.round(((st.xp - lv.from) / (lv.to - lv.from)) * 100);
    const nu = nextUp();
    const have = Object.keys(st.creatures).length, total = MQ.ALL_CREATURES.length;
    const dailyDone = st.daily.last === U.dateKey();
    const badgeCount = Object.keys(st.badges).length;
    let cont;
    if (nu) {
      const lvObj = nu.w.levels[nu.li];
      const cr = MQ.CREATURES[lvObj.creature];
      cont = `<button class="continue" data-act="startLevel" data-arg="${nu.w.id}:${nu.li}" style="--wc:${nu.w.color};--wt:${nu.w.tint}">
        <span class="cont-world">${nu.w.emoji} ${nu.w.name} · ${levelName(lvObj, nu.li)}</span>
        <span class="cont-main"><span class="sil">${cr.emoji}</span><span><b>Next discovery</b><br>Get ${lvObj.goal} right to meet a mystery creature</span></span>
        <span class="btn">Play ▶</span></button>`;
    } else {
      cont = `<button class="continue" data-act="go" data-arg="map" style="--wc:#b0569e;--wt:#f6dff1"><span class="cont-world">🏆 Every world explored!</span><span class="cont-main"><span>Go back for 3 stars everywhere, or train in Endless mode.</span></span><span class="btn">Open map</span></button>`;
    }
    render(`<main class="home">
      <header class="hello">
        <div class="avatar" aria-hidden="true">${st.companion}</div>
        <div class="who"><div class="hi">Hi, ${esc(st.name)}!</div>
          <div class="rank">Level ${lv.level} · ${MQ.rankTitle(lv.level)}</div>
          <div class="xp" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>
        ${gemPill()}
      </header>
      <div class="buddy"><span class="buddy-e">${st.companion}</span><div class="bubble" id="bubble">${esc(st.buddyName)}: ${esc(U.pick(MQ.SAY.hello))}</div></div>
      ${cont}
      <div class="tiles">
        <button class="tile t-map" data-act="go" data-arg="map"><span class="ti">🗺️</span><b>Expedition Map</b><small>8 worlds · 48 levels</small></button>
        <button class="tile t-endless" data-act="go" data-arg="trainer"><span class="ti">♾️</span><b>Endless Training</b><small>Pick topics & difficulty</small></button>
        <button class="tile t-daily ${dailyDone ? 'done' : ''}" data-act="daily"><span class="ti">${dailyDone ? '✅' : '📅'}</span><b>Daily Quest</b><small>${dailyDone ? 'Done today · 🔥 ' + st.daily.streak : '+' + DAILY_REWARD + ' 💎 · streak ' + st.daily.streak}</small></button>
        <button class="tile t-journal" data-act="go" data-arg="journal"><span class="ti">📔</span><b>Field Journal</b><small>${have} / ${total} creatures</small></button>
        <button class="tile t-hatch" data-act="go" data-arg="hatch"><span class="ti">🥚</span><b>Hatchery</b><small>Rare eggs · ${MQ.EGG_PRICE} 💎</small></button>
        <button class="tile t-badges" data-act="go" data-arg="badges"><span class="ti">🏅</span><b>Badges</b><small>${badgeCount} / ${MQ.BADGES.length}</small></button>
      </div>
      <footer class="foot"><button class="linkbtn" data-act="go" data-arg="parent">For grown-ups</button></footer>
    </main>`);
  }

  // ---------------------------------------------------------------- map & world
  function map() {
    const cards = MQ.WORLDS.map((w, i) => {
      const open = worldOpen(i);
      const stars = worldStars(w);
      const found = w.levels.filter((l) => st.creatures[l.creature]).length;
      return `<button class="wcard ${open ? '' : 'locked'}" ${open ? `data-act="go" data-arg="world:${w.id}"` : 'disabled'} style="--wc:${w.color};--wt:${w.tint}">
        <span class="wemoji">${open ? w.emoji : '🔒'}</span>
        <span class="winfo"><b>${i + 1}. ${w.name}</b><small>${w.blurb}</small>
        ${open ? `<span class="wprog">★ ${stars}/18 · ${w.levels.map((l) => `<i class="${st.creatures[l.creature] ? '' : 'sil'}">${MQ.CREATURES[l.creature].emoji}</i>`).join('')}</span>` : `<span class="wprog">Befriend the guardian of ${MQ.WORLDS[i - 1].name} to open</span>`}
        </span>${open && found === 6 ? '<span class="wdone">✓</span>' : ''}</button>`;
    }).join('');
    render(header('Expedition Map') + `<main class="map">${cards}</main>`);
  }

  function world(id) {
    const w = MQ.WORLDS.find((x) => x.id === id);
    const rows = w.levels.map((lv, i) => {
      const open = levelOpen(w, i);
      const rec = st.levels[w.id + '-' + i];
      const cr = MQ.CREATURES[lv.creature];
      const got = !!st.creatures[lv.creature];
      const dtxt = lv.d[0] === lv.d[1] ? D_NAMES[lv.d[0]] : D_NAMES[lv.d[0]] + '–' + D_NAMES[lv.d[1]];
      return `<button class="lrow ${open ? '' : 'locked'} ${lv.type}" ${open ? `data-act="startLevel" data-arg="${w.id}:${i}"` : 'disabled'}>
        <span class="lnode">${open ? levelIcon(lv, i) : '🔒'}</span>
        <span class="linfo"><b>${levelName(lv, i)}</b><small>${lv.topics.map((t) => MQ.TOPICS[t].name).join(' + ')} · ${dtxt}</small>
          <span class="lgoal">${rec ? starStr(rec.stars) : `Get ${lv.goal} right`}</span></span>
        <span class="lreward ${got ? '' : 'sil'}" title="${got ? cr.name : 'Mystery creature'}">${cr.emoji}</span>
      </button>`;
    }).join('');
    render(header(`${w.emoji} ${w.name}`, 'map') + `<main class="world" style="--wc:${w.color};--wt:${w.tint}"><p class="wblurb">${w.blurb}</p><div class="trail">${rows}</div></main>`);
  }

  // ---------------------------------------------------------------- play
  function pickProblem() {
    const topic = U.pick(sess.topics);
    const d = sess.auto ? sess.autoD : U.rnd(sess.d[0], sess.d[1]);
    let p;
    for (let i = 0; i < 25; i++) {
      p = MQ.makeProblem(topic, d);
      const key = p.text + (p.visual || '');
      if (!sess.recent.includes(key)) { sess.recent.push(key); if (sess.recent.length > 25) sess.recent.shift(); break; }
    }
    return p;
  }
  function startSession(cfg) {
    sess = Object.assign({ correct: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0, answered: 0, earned: 0, recent: [], tries: 0, p: null, input: '', autoD: 2, up: 0, down: 0, left: cfg.timer || 0, locked: false }, cfg);
    const color = sess.world ? sess.world.color : sess.mode === 'daily' ? '#e09a2b' : '#ff6b5b';
    render(`<div class="play" style="--wc:${color}">
      <header class="playbar"><button class="iconbtn" data-act="quit" aria-label="Stop">✕</button><div class="pstatus" id="pstatus"></div>${gemPill()}</header>
      <div class="buddy small"><span class="buddy-e">${st.companion}</span><div class="bubble" id="bubble"></div></div>
      <section class="pcard" id="pcard"></section>
      <div id="answer" class="answer"></div>
    </div>`, 'is-play');
    say(sess.mode === 'level' ? `${st.buddyName}: Get ${sess.goal} right to discover a creature!` : sess.timer ? `${st.buddyName}: Lightning round! Go go go! ⚡` : sess.mode === 'daily' ? `${st.buddyName}: Today’s quest — 5 mixed puzzles!` : `${st.buddyName}: Let’s train! Every 5 in a row opens a chest. 🎁`);
    nextProblem();
    if (sess.timer) sess.interval = setInterval(tick, 1000);
  }
  function tick() {
    if (!sess || !sess.timer) return;
    sess.left--;
    if (sess.left <= 5 && sess.left > 0) MQ.sfx('tick');
    status();
    if (sess.left <= 0) { clearInterval(sess.interval); sess.interval = null; sess.locked = true; finishTrainer(); }
  }
  function status() {
    const el = $('#pstatus');
    if (!el) return;
    if (sess.mode === 'trainer') {
      const m = Math.floor(sess.left / 60), s = String(sess.left % 60).padStart(2, '0');
      el.innerHTML = `<span class="stat">🔥 <b>${sess.streak}</b></span><span class="stat">✓ <b>${sess.correct}</b></span>` +
        (sess.timer ? `<span class="stat timer ${sess.left <= 10 ? 'low' : ''}">⏱ <b>${m}:${s}</b></span>` : '') +
        `<span class="stat dchip d${sess.auto ? sess.autoD : sess.d[1]}">${sess.auto ? 'Auto · ' + D_NAMES[sess.autoD] : D_NAMES[sess.d[1]]}</span>`;
    } else {
      const title = sess.mode === 'daily' ? '📅 Daily Quest' : `${sess.world.emoji} ${levelName(sess.level, sess.li)}`;
      el.innerHTML = `<span class="ptitle">${title}</span><span class="slots">${U.range(1, sess.goal).map((i) => `<i class="${i <= sess.correct ? 'on' : ''}"></i>`).join('')}</span>`;
    }
  }
  function nextProblem() {
    sess.p = pickProblem();
    sess.tries = 0;
    sess.input = '';
    sess.locked = false;
    const p = sess.p, T = MQ.TOPICS[p.topic];
    const card = $('#pcard');
    card.innerHTML = `<div class="pmeta"><span>${T.icon} ${T.name}</span><span class="dchip d${p.d}">${D_ICONS[p.d]} ${D_NAMES[p.d]}</span></div>
      <div class="ptext ${p.big ? 'eq' : ''} ${p.wordy ? 'wordy' : ''}">${p.text}</div>
      ${p.visual ? `<div class="pvis">${p.visual}</div>` : ''}
      ${p.kind === 'num' ? `<div class="display" id="display"><span class="dval" id="dval"></span>${p.unit ? `<span class="unit">${p.unit}</span>` : ''}</div>` : ''}
      <div class="feedback" id="feedback" aria-live="polite"></div>`;
    card.classList.remove('enter');
    void card.offsetWidth;
    card.classList.add('enter');
    // If the problem has an answer box (?) inside it, type straight into that box.
    if (p.kind === 'num') {
      const slot = card.querySelector('.ptext .blank') || card.querySelector('.pvis .column .ans');
      if (slot) { slot.id = 'slot'; $('#display').hidden = true; }
    }
    $('#answer').innerHTML = p.kind === 'num'
      ? `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="key" data-act="key" data-arg="${k}">${k}</button>`).join('')}<button class="key alt" data-act="key" data-arg="back" aria-label="Delete">⌫</button><button class="key" data-act="key" data-arg="0">0</button><button class="key go" data-act="submit">Check</button></div>`
      : `<div class="choices n${p.choices.length}">${p.choices.map((c, i) => `<button class="choice" data-act="choose" data-arg="${i}">${fmtChoice(c)}</button>`).join('')}</div>`;
    showInput();
    status();
  }
  // All answer boxes show what is typed (e.g. "8 = ? + ?" with equal addends).
  const slots = () => { const s = document.querySelectorAll('.ptext .blank'); return $('#slot') && s.length > 1 ? [...s] : [$('#slot') || $('#dval')].filter(Boolean); };
  function showInput() {
    for (const slot of slots()) {
      slot.textContent = sess.input || '?';
      slot.classList.toggle('filled', !!sess.input);
    }
  }
  function key(k) {
    if (!sess || sess.locked || sess.p.kind !== 'num') return;
    if (k === 'back') sess.input = sess.input.slice(0, -1);
    else if (sess.input.length < 4) sess.input = sess.input === '0' ? k : sess.input + k;
    MQ.sfx('tap');
    showInput();
  }
  function submit() {
    if (!sess || sess.locked) return;
    if (sess.p.kind === 'num') {
      if (!sess.input) { say(`${st.buddyName}: Type your answer first!`); return; }
      check(sess.input);
    }
  }
  function choose(i) {
    if (!sess || sess.locked) return;
    const btn = document.querySelectorAll('.choice')[i];
    if (!btn || btn.disabled) return;
    check(sess.p.choices[i], btn);
  }
  function check(given, btn) {
    const p = sess.p;
    const ok = p.kind === 'num' ? Number(given) === p.answer : String(given) === p.answer;
    if (ok) right(btn); else wrong(given, btn);
  }
  function autoAdjust(good) {
    if (!sess.auto) return;
    if (good) {
      sess.down = 0;
      if (++sess.up >= 4 && sess.autoD < 5) { sess.autoD++; sess.up = 0; later(() => toast(`${D_ICONS[sess.autoD]} Leveling up to <b>${D_NAMES[sess.autoD]}</b>!`), 300); }
    } else {
      sess.up = 0;
      if (++sess.down >= 2 && sess.autoD > 1) { sess.autoD--; sess.down = 0; }
    }
  }
  function right(btn) {
    const p = sess.p, first = sess.tries === 0;
    sess.locked = true;
    S.record(p, first);
    sess.correct++;
    sess.answered++;
    st.stats.correct++;
    let msg = U.pick(MQ.SAY.correct);
    let chest = false;
    if (first) {
      sess.firstTry++;
      sess.streak++;
      sess.best = Math.max(sess.best, sess.streak);
      st.stats.bestStreak = Math.max(st.stats.bestStreak, sess.streak);
      if (p.d === 5) st.stats.d5 = (st.stats.d5 || 0) + 1;
      if (MQ.SAY.streak[sess.streak]) msg = MQ.SAY.streak[sess.streak];
      if (sess.mode === 'trainer') {
        addGems(1); sess.earned++;
        if (sess.streak % 5 === 0) { chest = true; addGems(5); sess.earned += 5; toast('🎁 Streak chest! <b>+5 💎</b>', 'gold'); }
      }
    }
    autoAdjust(first);
    addXp(first ? 10 : 5);
    MQ.sfx(chest || (first && MQ.SAY.streak[sess.streak]) ? 'streak' : 'correct');
    if (btn) btn.classList.add('right');
    slots().forEach((el) => el.classList.add('right'));
    $('#feedback').innerHTML = `<div class="fb ok">✓ ${msg}</div>`;
    say(`${st.buddyName}: ${msg}`);
    S.save();
    status();
    const done = sess.goal && sess.correct >= sess.goal;
    later(done ? finish : nextProblem, done ? 900 : sess.timer ? 450 : first ? 900 : 1400);
  }
  function wrong(given, btn) {
    const p = sess.p;
    sess.tries++;
    MQ.sfx('wrong');
    const card = $('#pcard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    if (sess.timer) { // lightning: no second chance, keep moving
      sess.locked = true;
      S.record(p, false, given);
      sess.answered++;
      sess.streak = 0;
      if (btn) btn.classList.add('nope');
      $('#feedback').innerHTML = `<div class="fb reveal">It was <b>${fmtAnswer(p)}</b></div>`;
      status();
      later(nextProblem, 1300);
      return;
    }
    if (sess.tries === 1) {
      sess.streak = 0;
      sess.mistakes++;
      autoAdjust(false);
      status();
      if (!(p.kind === 'choice' && p.choices.length <= 2)) {
        if (btn) { btn.disabled = true; btn.classList.add('nope'); }
        sess.input = '';
        showInput();
        $('#feedback').innerHTML = `<div class="fb hint">💡 ${p.hint || 'Look again carefully and try once more.'}</div>`;
        say(`${st.buddyName}: ${U.pick(MQ.SAY.retry)}`);
        return;
      }
    }
    reveal(given, btn);
  }
  function reveal(given, btn) {
    const p = sess.p;
    sess.locked = true;
    S.record(p, false, given);
    sess.answered++;
    if (btn) btn.classList.add('nope');
    document.querySelectorAll('.choice').forEach((b, i) => { if (p.choices && p.choices[i] === p.answer) b.classList.add('right'); });
    if (p.kind === 'num') slots().forEach((el) => { el.textContent = p.answer; el.classList.add('shown'); });
    $('#feedback').innerHTML = `<div class="fb reveal"><div>The answer is <b>${fmtAnswer(p)}</b>.</div>${p.explain ? `<div class="explain">${p.explain}</div>` : ''}<button class="btn" data-act="next">Next →</button></div>`;
    say(`${st.buddyName}: ${U.pick(MQ.SAY.reveal)}`);
    S.save();
    status();
  }
  function finish() {
    if (sess.mode === 'level') finishLevel();
    else if (sess.mode === 'daily') finishDaily();
    else finishTrainer();
  }

  function finishLevel() {
    const { world: w, li, level: lv } = sess;
    const stars = sess.mistakes === 0 ? 3 : sess.mistakes <= 2 ? 2 : 1;
    const key = w.id + '-' + li, prev = st.levels[key];
    const firstClear = !prev;
    st.levels[key] = { stars: Math.max(stars, prev ? prev.stars : 0) };
    let gems = 5 + stars * 2 + (lv.type === 'boss' ? 10 : lv.type === 'challenge' ? 5 : 0);
    if (!firstClear) gems = Math.ceil(gems / 2);
    addGems(gems);
    let creature = null;
    if (!st.creatures[lv.creature]) { st.creatures[lv.creature] = { got: U.dateKey(), from: w.id }; creature = MQ.CREATURES[lv.creature]; }
    const wi = worldIndex(w.id);
    const newWorld = firstClear && lv.type === 'boss' && !st.settings.unlockAll ? MQ.WORLDS[wi + 1] : null;
    S.save();
    const hasNext = li < 5 && levelOpen(w, li + 1);
    render(`<main class="result" style="--wc:${w.color};--wt:${w.tint}">
      <div class="bigstars">${starStr(stars)}</div>
      <h1 class="title">${lv.type === 'boss' ? 'Guardian befriended!' : stars === 3 ? 'Perfect expedition!' : 'Level complete!'}</h1>
      <p class="lead">${sess.correct} right${sess.mistakes ? ` · ${sess.mistakes} ${sess.mistakes === 1 ? 'oops' : 'oopses'}` : ' · no mistakes!'} · <b>+${gems} 💎</b></p>
      ${creature ? creatureCard(creature, true) : `<p class="muted">You already discovered the ${MQ.CREATURES[lv.creature].emoji} ${MQ.CREATURES[lv.creature].name} here.${stars < 3 ? ' Try for 3 stars!' : ''}</p>`}
      ${newWorld ? `<div class="unlock">🗺️ New world unlocked: <b>${newWorld.emoji} ${newWorld.name}</b></div>` : ''}
      <div class="row">
        <button class="btn ghost" data-act="go" data-arg="world:${w.id}">Map</button>
        <button class="btn ghost" data-act="startLevel" data-arg="${w.id}:${li}">Replay</button>
        ${hasNext ? `<button class="btn" data-act="startLevel" data-arg="${w.id}:${li + 1}">Next level →</button>` : newWorld ? `<button class="btn" data-act="go" data-arg="world:${newWorld.id}">Go to ${newWorld.name} →</button>` : ''}
      </div></main>`);
    MQ.sfx('reward');
    MQ.confetti(lv.type === 'boss' ? 220 : 120);
    later(checkBadges, 1400);
  }

  function finishDaily() {
    const today = U.dateKey();
    const first = st.daily.last !== today;
    let gems = 0;
    if (first) {
      const gap = st.daily.last ? U.daysBetween(st.daily.last, today) : 99;
      st.daily.streak = gap === 1 ? st.daily.streak + 1 : 1;
      st.daily.best = Math.max(st.daily.best, st.daily.streak);
      st.daily.last = today;
      gems = DAILY_REWARD + Math.min(st.daily.streak - 1, 10);
      addGems(gems);
    }
    S.save();
    render(`<main class="result" style="--wc:#e09a2b;--wt:#fbecd2">
      <div class="bigemoji">${first ? '🔥' : '✅'}</div>
      <h1 class="title">Daily Quest complete!</h1>
      <p class="lead">${first ? `Day streak: <b>${st.daily.streak}</b> · <b>+${gems} 💎</b>` : 'Extra practice — great job! Come back tomorrow for a new quest.'}</p>
      ${first && st.daily.streak > 1 ? `<p class="muted">Streak bonus: +${Math.min(st.daily.streak - 1, 10)} 💎 for coming back every day.</p>` : ''}
      <div class="row"><button class="btn ghost" data-act="go" data-arg="home">Home</button><button class="btn" data-act="go" data-arg="hatch">Visit the Hatchery 🥚</button></div></main>`);
    MQ.sfx('reward');
    MQ.confetti();
    later(checkBadges, 1400);
  }

  function finishTrainer() {
    if (!sess) return home();
    let record = '';
    if (sess.timer === 60 && sess.correct > (st.stats.lightning60 || 0)) { st.stats.lightning60 = sess.correct; record = 'New 60-second record!'; }
    if (sess.timer === 120 && sess.correct > (st.stats.lightning120 || 0)) { st.stats.lightning120 = sess.correct; record = 'New 2-minute record!'; }
    if (!sess.timer && sess.best > (st.stats.endlessBest || 0)) { st.stats.endlessBest = sess.best; if (sess.best >= 5) record = 'New best streak!'; }
    S.save();
    const acc = sess.answered ? Math.round((sess.firstTry / sess.answered) * 100) : 0;
    render(`<main class="result" style="--wc:#ff6b5b;--wt:#ffe3dd">
      <div class="bigemoji">${sess.timer ? '⚡' : '♾️'}</div>
      <h1 class="title">${sess.timer ? 'Time!' : 'Training done!'}</h1>
      ${record ? `<div class="unlock">🏆 ${record}</div>` : ''}
      <div class="sumgrid">
        <div><b>${sess.correct}</b><small>correct</small></div>
        <div><b>${acc}%</b><small>first try</small></div>
        <div><b>${sess.best}</b><small>best streak</small></div>
        <div><b>+${sess.earned}</b><small>💎 earned</small></div>
      </div>
      <div class="row"><button class="btn ghost" data-act="go" data-arg="home">Home</button><button class="btn ghost" data-act="go" data-arg="trainer">Change settings</button><button class="btn" data-act="startTrainer">Play again</button></div></main>`);
    if (sess.correct) { MQ.sfx('reward'); if (record) MQ.confetti(); }
    later(checkBadges, 1200);
  }

  function quit() {
    if (!sess) return home();
    if (sess.mode === 'trainer') {
      if (sess.answered === 0) return go('trainer');
      clearTimers();
      sess.locked = true;
      return finishTrainer();
    }
    modal(`<div class="mtitle">Leave this ${sess.mode === 'daily' ? 'quest' : 'level'}?</div><p>You will need to start it again to ${sess.mode === 'daily' ? 'finish the quest' : 'discover the creature'}.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep playing</button><button class="btn" data-act="leave">Leave</button></div>`);
  }

  // ---------------------------------------------------------------- trainer
  function trainer() {
    const t = st.trainer;
    const chip = (id) => { const T = MQ.TOPICS[id]; return `<button class="chip ${t.topics.includes(id) ? 'sel' : ''}" data-act="toggleTopic" data-arg="${id}" aria-pressed="${t.topics.includes(id)}">${T.icon} ${T.name}</button>`; };
    const diffs = ['auto', 1, 2, 3, 4, 5].map((d) => `<button class="seg ${String(t.diff) === String(d) ? 'sel' : ''}" data-act="setDiff" data-arg="${d}">${d === 'auto' ? '🎯<b>Auto</b><small>adjusts to you</small>' : `${D_ICONS[d]}<b>${D_NAMES[d]}</b><small>${['', 'warm-up', '2nd grade', 'strong 2nd', 'end of 2nd', 'ahead!'][d]}</small>`}</button>`).join('');
    const modes = [['endless', '♾️', 'Endless', 'no clock, hints on'], ['l60', '⚡', 'Lightning 60s', `best: ${st.stats.lightning60 || 0}`], ['l120', '⏱️', 'Lightning 2 min', `best: ${st.stats.lightning120 || 0}`]]
      .map(([id, ic, n, sub]) => `<button class="seg ${t.mode === id ? 'sel' : ''}" data-act="setMode" data-arg="${id}">${ic}<b>${n}</b><small>${sub}</small></button>`).join('');
    render(header('Endless Training') + `<main class="trainer">
      <section><h2>1. Choose topics <button class="linkbtn" data-act="allCore">all 2nd grade</button></h2>
        <div class="chips">${CORE.map(chip).join('')}</div>
        <h3>Challenge — ahead of 2nd grade</h3><div class="chips">${['mult', 'logic'].map(chip).join('')}</div></section>
      <section><h2>2. Difficulty</h2><div class="segs six">${diffs}</div></section>
      <section><h2>3. Mode</h2><div class="segs three">${modes}</div></section>
      <button class="btn big" data-act="startTrainer" ${t.topics.length ? '' : 'disabled'}>Start training ▶</button>
      <p class="muted center">+1 💎 for every first-try answer · a 🎁 chest every 5 in a row</p>
    </main>`);
  }
  function startTrainer() {
    const t = st.trainer;
    if (!t.topics.length) return trainer();
    startSession({ mode: 'trainer', topics: t.topics.slice(), auto: t.diff === 'auto', d: t.diff === 'auto' ? [2, 2] : [+t.diff, +t.diff], goal: 0, timer: t.mode === 'l60' ? 60 : t.mode === 'l120' ? 120 : 0 });
  }
  function startDaily() {
    // Mix of topics from worlds that are open, at a level that stretches a little.
    const topics = new Set();
    MQ.WORLDS.forEach((w, i) => { if (worldOpen(i) && w.id !== 'sky') w.levels.forEach((l) => l.topics.forEach((t) => CORE.includes(t) && topics.add(t))); });
    if (topics.size < 3) ['add20', 'add100', 'sub100', 'place', 'time'].forEach((t) => topics.add(t));
    startSession({ mode: 'daily', topics: [...topics], d: [2, 4], goal: 5 });
  }

  // ---------------------------------------------------------------- journal, hatchery, badges
  function journal() {
    const have = Object.keys(st.creatures).length, total = MQ.ALL_CREATURES.length;
    const card = (c) => st.creatures[c.id]
      ? `<button class="ccard r-${c.rarity}" data-act="creature" data-arg="${c.id}"><span class="ce">${c.emoji}</span><span class="cn">${c.name}</span></button>`
      : `<div class="ccard locked"><span class="ce sil">${c.emoji}</span><span class="cn">???</span></div>`;
    const sections = MQ.WORLDS.map((w) => `<section style="--wc:${w.color};--wt:${w.tint}"><h2>${w.emoji} ${w.name}</h2><div class="cgrid">${w.levels.map((l) => card(MQ.CREATURES[l.creature])).join('')}</div></section>`).join('') +
      `<section style="--wc:#b0569e;--wt:#f6dff1"><h2>🥚 Hatchery rarities</h2><div class="cgrid">${MQ.EGG_CREATURES.map(card).join('')}</div></section>`;
    render(header('Field Journal') + `<main class="journal"><div class="jcount"><b>${have}</b> of ${total} creatures discovered<div class="xp"><span style="width:${Math.round((have / total) * 100)}%"></span></div></div>${sections}</main>`);
  }
  function hatch() {
    const left = MQ.EGG_CREATURES.filter((c) => !st.creatures[c.id]);
    const h = ui.hatch;
    let nest;
    if (h && h.stage === 'egg') nest = `<button class="egg crack${h.taps}" data-act="tapEgg" aria-label="Tap the egg">🥚</button><p class="lead">Tap the egg to hatch it! (${3 - h.taps} more)</p>`;
    else if (h && h.stage === 'open') nest = creatureCard(MQ.creatureById(h.id), true);
    else nest = `<div class="egg idle" aria-hidden="true">🥚</div>`;
    render(header('Hatchery') + `<main class="hatch">
      <div class="nest">${nest}</div>
      ${h && h.stage === 'egg' ? '' : left.length ? `<button class="btn big" data-act="buyEgg" ${st.crystals < MQ.EGG_PRICE ? 'disabled' : ''}>Buy an egg · ${MQ.EGG_PRICE} 💎</button>
        <p class="muted center">${st.crystals < MQ.EGG_PRICE ? `You need ${MQ.EGG_PRICE - st.crystals} more 💎. Finish levels, the Daily Quest, or train to earn crystals.` : 'Eggs hold rare creatures you can’t find on the expedition.'}</p>` : '<p class="lead center">You hatched every rare creature! 🎉</p>'}
      <h2>Rare creatures: ${MQ.EGG_CREATURES.length - left.length} / ${MQ.EGG_CREATURES.length}</h2>
      <div class="minigrid">${MQ.EGG_CREATURES.map((c) => `<span class="${st.creatures[c.id] ? '' : 'sil'}" title="${st.creatures[c.id] ? c.name : '???'}">${c.emoji}</span>`).join('')}</div>
    </main>`);
  }
  function buyEgg() {
    const left = MQ.EGG_CREATURES.filter((c) => !st.creatures[c.id]);
    if (!left.length || st.crystals < MQ.EGG_PRICE) return;
    const weight = { common: 4, rare: 2, mythic: 1 };
    const bag = left.flatMap((c) => Array(weight[c.rarity] || 2).fill(c));
    const c = U.pick(bag);
    st.crystals -= MQ.EGG_PRICE;
    st.creatures[c.id] = { got: U.dateKey(), from: 'egg' }; // saved now, revealed after tapping
    st.eggsHatched++;
    S.save();
    ui.hatch = { stage: 'egg', taps: 0, id: c.id };
    MQ.sfx('tap');
    hatch();
  }
  function tapEgg() {
    const h = ui.hatch;
    if (!h || h.stage !== 'egg') return;
    h.taps++;
    if (h.taps < 3) { MQ.sfx('crack'); return hatch(); }
    h.stage = 'open';
    MQ.sfx('hatch');
    MQ.confetti(160);
    hatch();
    later(checkBadges, 1500);
  }
  function badges() {
    render(header('Badges') + `<main class="badges"><div class="bgrid">${MQ.BADGES.map((b) => `<div class="badge ${st.badges[b.id] ? 'got' : ''}"><span class="bi">${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></main>`);
  }

  // ---------------------------------------------------------------- grown-ups
  function parentGate() {
    ui.gate = { a: U.rnd(12, 19), b: U.rnd(3, 9) };
    render(header('For grown-ups') + `<main class="gate"><p class="lead">Grown-ups only. Please solve:</p>
      <div class="eqline">${ui.gate.a} × ${ui.gate.b} = </div>
      <input id="gate-in" class="field center" inputmode="numeric" autocomplete="off" aria-label="answer">
      <button class="btn big" data-act="gate">Open</button><p class="muted center" id="gate-msg"></p></main>`);
    const inp = $('#gate-in');
    inp.focus();
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') act('gate'); });
  }
  function parent() {
    const s = st.stats;
    const acc = s.attempts ? Math.round((U.sum(Object.values(s.topics).map((t) => t.c)) / s.attempts) * 100) : 0;
    const days = U.range(0, 13).map((i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = U.dateKey(d); return { k, n: (st.days[k] || {}).a || 0, wd: 'SMTWTFS'[d.getDay()] }; });
    const maxN = Math.max(10, ...days.map((d) => d.n));
    const active = days.filter((d) => d.n > 0).length;
    const rows = Object.keys(MQ.TOPICS).map((id) => {
      const T = MQ.TOPICS[id], t = s.topics[id];
      if (!t || !t.a) return `<tr><td>${T.icon} ${T.name}<small>${T.std}</small></td><td colspan="3" class="muted">not practiced yet</td></tr>`;
      const pct = Math.round((t.c / t.a) * 100);
      const maxD = Math.max(...Object.keys(t.byD).map(Number));
      return `<tr><td>${T.icon} ${T.name}<small>${T.std}</small></td><td class="num">${t.a}</td><td class="num"><span class="acc ${pct >= 85 ? 'g' : pct >= 65 ? 'y' : 'r'}">${pct}%</span></td><td>${D_NAMES[maxD]}</td></tr>`;
    }).join('');
    const mist = st.mistakes.slice(0, 12).map((m) => `<li><span class="mt">${MQ.TOPICS[m.topic] ? MQ.TOPICS[m.topic].icon : ''} ${esc(m.text)}</span><span class="ma">answered <b>${esc(m.given)}</b>, correct <b>${esc(m.answer)}</b></span></li>`).join('');
    render(header('For grown-ups') + `<main class="parent">
      <section class="kpis">
        <div><b>${s.correct}</b><small>problems solved</small></div>
        <div><b>${acc}%</b><small>right on first try</small></div>
        <div><b>${active}/14</b><small>active days</small></div>
        <div><b>${s.bestStreak}</b><small>best streak</small></div>
      </section>
      <section><h2>Last 14 days</h2><div class="days">${days.map((d) => `<div class="day" title="${d.k}: ${d.n}"><span style="height:${Math.round((d.n / maxN) * 100)}%"></span><small>${d.wd}</small></div>`).join('')}</div></section>
      <section><h2>Topics</h2><p class="muted">Green ≥ 85% first-try accuracy, yellow 65–84%, red below 65%: a good topic to practice in Endless Training.</p>
        <div class="tablewrap"><table class="topics"><thead><tr><th>Topic · standard</th><th>Tries</th><th>Accuracy</th><th>Highest level</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section><h2>Recent mistakes</h2>${mist ? `<ul class="mist">${mist}</ul>` : '<p class="muted">No mistakes recorded yet.</p>'}</section>
      <section class="settings"><h2>Settings</h2>
        <label class="toggle"><input type="checkbox" id="set-sound" data-act="setting" data-arg="sound" ${st.settings.sound ? 'checked' : ''}> Sound effects</label>
        <label class="toggle"><input type="checkbox" id="set-unlock" data-act="setting" data-arg="unlockAll" ${st.settings.unlockAll ? 'checked' : ''}> Unlock all worlds (skip ahead to match what is taught in class)</label>
        <div class="namerow"><label for="set-name">Child’s name</label><input id="set-name" class="field" maxlength="16" value="${esc(st.name)}">
          <label for="set-buddy">Buddy’s name</label><input id="set-buddy" class="field" maxlength="14" value="${esc(st.buddyName)}">
          <button class="btn ghost" data-act="saveNames">Save names</button></div>
      </section>
      <section><h2>Move progress to another device</h2>
        <p class="muted">Progress is saved in this browser only. Copy the save code here and paste it on the other device.</p>
        <textarea id="savecode" class="field code" rows="3" placeholder="Save code appears here, or paste one to load it"></textarea>
        <div class="row left"><button class="btn ghost" data-act="exportSave">Show & copy save code</button><button class="btn ghost" data-act="importSave">Load pasted code</button></div>
        <p class="muted" id="save-msg"></p></section>
      <section><h2>How levels map to school</h2>
        <p>Problems follow the California Common Core standards for 2nd grade. Difficulty: 🌱 Sprout = warm-up, 🧭 Explorer and 🏕️ Ranger = core 2nd grade, 🏔️ Expert = end of 2nd / start of 3rd, 🐉 Legend = challenge problems from 3rd grade and beyond. Each world ends with a ⚡ Challenge level and a 👑 Guardian level that mixes topics. The Sky Kingdom is all 3rd-grade challenge material: multiplication, division and logic puzzles.</p></section>
      <section><h2>Start over</h2><button class="btn danger" data-act="reset">${ui.resetArmed ? 'Tap again to erase all progress' : 'Erase all progress'}</button></section>
    </main>`);
  }

  // ---------------------------------------------------------------- routing
  function go(where) {
    closeModal();
    if (where !== 'hatch') ui.hatch = null;
    if (where !== 'parent') ui.resetArmed = false;
    const [scr, arg] = where.split(':');
    if (scr !== 'play') sess = null;
    ({ home, map, world: () => world(arg), trainer, journal, hatch, badges, parent: parentGate }[scr] || home)();
  }

  const ACTIONS = {
    go: (a) => go(a),
    pickBuddy: (a) => { ui.buddy = a; st.name = $('#ob-name').value.trim(); st.buddyName = $('#ob-buddy').value.trim() || 'Pip'; onboarding(); },
    startGame: () => {
      const n = $('#ob-name').value.trim();
      if (!n) { $('#ob-name').focus(); $('#ob-name').classList.add('shake'); return; }
      st.name = n.slice(0, 16);
      st.buddyName = ($('#ob-buddy').value.trim() || 'Pip').slice(0, 14);
      st.companion = ui.buddy || '🦊';
      MQ.playerName = st.name;
      S.save();
      MQ.sfx('reward');
      home();
    },
    startLevel: (a) => { const [wid, i] = a.split(':'); const w = MQ.WORLDS.find((x) => x.id === wid); const lv = w.levels[+i]; startSession({ mode: 'level', world: w, li: +i, level: lv, topics: lv.topics, d: lv.d, goal: lv.goal }); },
    daily: () => startDaily(),
    key: (a) => key(a),
    submit: () => submit(),
    choose: (a) => choose(+a),
    next: () => { if (sess) nextProblem(); },
    quit: () => quit(),
    leave: () => { closeModal(); const w = sess && sess.world; sess = null; w ? world(w.id) : home(); },
    closeModal: () => closeModal(),
    toggleTopic: (a) => { const t = st.trainer.topics; const i = t.indexOf(a); i >= 0 ? t.splice(i, 1) : t.push(a); S.save(); trainer(); },
    allCore: () => { st.trainer.topics = CORE.slice(); S.save(); trainer(); },
    setDiff: (a) => { st.trainer.diff = a === 'auto' ? 'auto' : +a; S.save(); trainer(); },
    setMode: (a) => { st.trainer.mode = a; S.save(); trainer(); },
    startTrainer: () => startTrainer(),
    creature: (a) => { const c = MQ.creatureById(a); modal(creatureCard(c) + '<div class="row"><button class="btn" data-act="closeModal">Close</button></div>'); },
    buyEgg: () => buyEgg(),
    tapEgg: () => tapEgg(),
    gate: () => {
      const v = Number($('#gate-in').value);
      if (v === ui.gate.a * ui.gate.b) parent();
      else { $('#gate-msg').textContent = 'Not quite — try again.'; $('#gate-in').value = ''; }
    },
    setting: (a, el) => { st.settings[a] = el.checked; S.save(); },
    saveNames: () => { st.name = $('#set-name').value.trim() || st.name; st.buddyName = $('#set-buddy').value.trim() || st.buddyName; MQ.playerName = st.name; S.save(); toast('Saved'); },
    exportSave: () => {
      const code = S.exportCode();
      const ta = $('#savecode');
      ta.value = code;
      const done = () => ($('#save-msg').textContent = 'Copied. Paste it into Math Expedition on the other device.');
      const fallback = () => { ta.focus(); ta.select(); $('#save-msg').textContent = 'Select the code above and copy it.'; };
      try { navigator.clipboard.writeText(code).then(done, fallback); } catch (e) { fallback(); }
    },
    importSave: () => {
      try { S.importCode($('#savecode').value); st = MQ.state; toast('Progress loaded'); parent(); }
      catch (e) { $('#save-msg').textContent = 'That code did not work. Copy the whole code and try again.'; }
    },
    reset: () => {
      if (!ui.resetArmed) { ui.resetArmed = true; return parent(); }
      ui.resetArmed = false;
      S.reset();
      st = MQ.state;
      MQ.playerName = '';
      onboarding();
    },
  };
  function act(name, arg, el) { if (ACTIONS[name]) ACTIONS[name](arg, el); }

  function init() {
    st = S.load();
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      if (el.type === 'checkbox') return; // handled on change
      act(el.dataset.act, el.dataset.arg, el);
    });
    document.addEventListener('change', (e) => {
      const el = e.target.closest('input[type=checkbox][data-act]');
      if (el) act(el.dataset.act, el.dataset.arg, el);
    });
    document.addEventListener('keydown', (e) => {
      if (!root().classList.contains('is-play') || !sess || $('#modal')) return;
      if (sess.locked) { if ((e.key === 'Enter' || e.key === ' ') && $('[data-act="next"]')) { e.preventDefault(); nextProblem(); } return; }
      if (sess.p.kind === 'num') {
        if (/^[0-9]$/.test(e.key)) key(e.key);
        else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
        else if (e.key === 'Enter') submit();
      } else if (/^[1-4]$/.test(e.key)) choose(+e.key - 1);
    });
    st.name ? home() : onboarding();
  }

  MQ.app = { init, go, session: () => sess }; // session() is used by the browser smoke test
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
