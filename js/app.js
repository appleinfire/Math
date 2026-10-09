// UI: screens, game loop, rewards. Screens render into #app; clicks are routed through data-act attributes.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, S = MQ.store;
  const D_NAMES = { 1: 'Sprout', 2: 'Explorer', 3: 'Ranger', 4: 'Expert', 5: 'Legend' };
  const D_ICONS = { 1: '🌱', 2: '🧭', 3: '🏕️', 4: '🏔️', 5: '🐉' };
  const TRACK_COLOR = { k: '#e0a21b', g2: '#2bb3a3' };
  const DAILY_REWARD = 15;

  let st = null; // MQ.state
  let sess = null; // current play session
  let timers = [];
  let ui = {}; // small per-screen UI state (new-explorer form, hatch, reset confirm…)
  let cur = ''; // screen that may be redrawn when another device changes the data ('' = leave it alone)

  const $ = (sel) => document.querySelector(sel);
  const track = () => MQ.track(st.grade);
  const WORLDS = () => track().worlds;
  const root = () => document.getElementById('app');
  const esc = U.esc;
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  let ct = null; // the mock contest in progress (Math Kangaroo / Joey)
  const endContest = () => { if (ct && ct.interval) clearInterval(ct.interval); ct = null; };
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (sess && sess.interval) { clearInterval(sess.interval); sess.interval = null; }
    if (ct && ct.interval) { clearInterval(ct.interval); ct.interval = null; }
  }
  function render(html, cls = '') {
    clearTimers();
    const r = root();
    cur = '';
    MQ.hush();
    document.body.dataset.track = st ? st.grade : '';
    r.className = cls;
    r.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- helpers
  const worldIndex = (id) => WORLDS().findIndex((w) => w.id === id);
  const worldOpen = (i) => st.settings.unlockAll || i === 0 || !!st.levels[WORLDS()[i - 1].id + '-5'];
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
  const fmtAnswer = (p) => {
    if (p.kind === 'choice') return p.choiceHtml ? p.choiceHtml[p.choices.indexOf(p.answer)] : fmtChoice(p.answer);
    if (p.kind === 'multi') return p.choiceHtml ? `<span class="mini-pics">${p.answer.map((a) => p.choiceHtml[p.choices.indexOf(a)]).join('')}</span>` : p.answer.map(fmtChoice).join(', ');
    if (p.kind === 'order') return p.answer.map(fmtChoice).join(' → ');
    return U.comma(p.answer) + (p.unit ? ' ' + p.unit : '');
  };
  const gradeChip = (g) => `<span class="gchip g-${g}">${MQ.track(g).label}</span>`;

  // ---------------------------------------------------------------- voice
  const voiceOn = () => st.settings.voice !== false && MQ.canSpeak() && !(sess && sess.timer);
  const UNIT_WORDS = { '¢': 'cents', min: 'minutes', in: 'inches', cm: 'centimeters', ft: 'feet', 'sq cm': 'square centimeters' };
  function spokenAnswer(p) {
    if (p.kind === 'num' || p.kind === 'line') return p.answer + (p.unit ? ' ' + (UNIT_WORDS[p.unit] || p.unit) : '');
    if (p.kind === 'multi') return p.choiceHtml ? '' : p.answer.map((a) => MQ.toSpeech(a)).join(' and ');
    if (p.kind === 'order') return p.answer.map((a) => MQ.toSpeech(a)).join(', then ');
    const words = { '<': 'less than', '>': 'greater than', '=': 'equal', '= same': 'the same' }[p.answer];
    return words || MQ.toSpeech(p.answer.replace(/^\$/, '')) || '';
  }

  function header(title, back = 'home') {
    return `<header class="bar"><button class="iconbtn" data-act="go" data-arg="${back}" aria-label="Back">←</button><h1>${title}</h1>${gemPill()}<button class="mini-av" data-act="go" data-arg="who" aria-label="Switch explorer (now ${esc(st.name)})" title="Switch explorer">${st.companion}</button></header>`;
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
    const w = MQ.worldById(c.world);
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

  // ---------------------------------------------------------------- profiles
  // "Who's exploring?" — one card per child. Each child has their own grade track and progress.
  function who() {
    const list = S.profiles();
    if (!list.length) return newExplorer();
    sess = null;
    st = null;
    MQ.state = null;
    render(`<main class="who-screen">
      <div class="ob-hero" aria-hidden="true">🧭</div>
      <h1 class="title center">Who’s exploring today?</h1>
      <div class="profiles">${list.map((p) => {
        const lv = MQ.levelFromXp(p.xp).level;
        return `<button class="profile" data-act="openProfile" data-arg="${p.id}" style="--pc:${TRACK_COLOR[p.grade] || '#2bb3a3'}">
          <span class="pav">${p.companion}</span><b>${esc(p.name)}</b>${gradeChip(p.grade)}
          <small>Level ${lv} · 💎 ${p.crystals} · ${Object.keys(p.creatures).length} creatures</small></button>`;
      }).join('')}
        <button class="profile add" data-act="go" data-arg="new"><span class="pav">＋</span><b>New explorer</b><small>Add a brother or sister</small></button>
      </div>
      <p class="muted center">Each explorer has their own grade, map, creatures and progress.</p>
      ${syncLine()}
    </main>`, 'is-who');
    cur = 'who';
  }

  // ---------------------------------------------------------------- family sync
  const CL = () => (MQ.cloud && MQ.cloud.configured() ? MQ.cloud : null);
  function syncLine() {
    const C = CL();
    if (!C) return '';
    if (!C.family) return `<div id="sync" class="sync off">📱 Progress is saved on this device only. <button class="linkbtn" data-act="go" data-arg="family">Connect family ☁️</button></div>`;
    const label = { connecting: 'connecting…', saving: 'saving…', synced: 'synced ✓', offline: 'offline — saved here, will sync later', error: 'sync problem, will retry' }[C.status] || 'synced ✓';
    return `<div id="sync" class="sync s-${C.status}">☁️ Family <b>${esc(C.family.name)}</b> · ${label}</div>`;
  }
  const FAM_ERRORS = {
    'short-code': 'The family code needs at least 6 letters or numbers.',
    'bad-pin': 'The PIN must be 4 to 6 digits.',
    'pin-mismatch': 'The two PINs are different. Type the same PIN twice.',
    exists: 'This family code and PIN are already used. Choose “I already have a family” to join it, or pick a different code.',
    'not-found': 'No family found with this code and PIN. Check both and try again.',
    offline: 'No internet connection. Connect to Wi-Fi and try again.',
    denied: 'The server refused access. Check the Firebase setup (docs/DEPLOY.md).',
    unavailable: 'Online sync is not available in this copy of the app. Open the website version.',
  };
  function family() {
    const f = (ui.fam = ui.fam || { mode: 'choose', code: '', error: '' });
    const hasKids = S.profiles().length > 0;
    const backTo = f.mode !== 'choose' ? 'famChoose' : hasKids ? 'who' : '';
    const top = `<header class="bar">${backTo ? `<button class="iconbtn" data-act="${backTo === 'who' ? 'go' : 'famMode'}" data-arg="${backTo === 'who' ? 'who' : 'choose'}" aria-label="Back">←</button>` : ''}<h1>${f.mode === 'create' ? 'Create a family' : f.mode === 'join' ? 'Join your family' : 'Save progress online'}</h1></header>`;
    let body;
    if (f.mode === 'choose') {
      body = `<div class="ob-hero" aria-hidden="true">☁️</div>
        <p class="lead center">Connect this device to your family, and every phone, tablet and computer shows the same explorers, levels and creatures.</p>
        <div class="famchoices">
          <button class="grade-pick" data-act="famMode" data-arg="create" style="--pc:#2bb3a3"><span class="gi">🏡</span><b>Create a family</b><small>First device: choose a family code and PIN</small></button>
          <button class="grade-pick" data-act="famMode" data-arg="join" style="--pc:#e0a21b"><span class="gi">🔑</span><b>I already have a family</b><small>Another device: type the same code and PIN</small></button>
          ${hasKids ? '' : `<button class="grade-pick" data-act="localOnly" style="--pc:#c4ccd6"><span class="gi">📱</span><b>Play on this device only</b><small>You can connect later in For grown-ups</small></button>`}
        </div>`;
    } else {
      const create = f.mode === 'create';
      body = `<p class="muted">${create ? 'Pick a family code you will remember (at least 6 letters, for example <b>rudyk-tigers</b>) and a 4–6 digit PIN. Write them down: you type them once on every new device.' : 'Type the family code and PIN you chose on the first device.'}${hasKids && create ? ' The explorers already on this device will be added to the family.' : ''}</p>
        <label for="fam-code">Family code</label>
        <input id="fam-code" class="field" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(f.code)}" placeholder="family code">
        <label for="fam-pin">PIN</label>
        <input id="fam-pin" class="field" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="4–6 digits">
        ${create ? '<label for="fam-pin2">PIN again</label><input id="fam-pin2" class="field" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="same PIN">' : ''}
        <p class="famerr" id="fam-err" role="alert">${esc(f.error)}</p>
        <button class="btn big" id="fam-go" data-act="famSubmit">${create ? 'Create family' : 'Connect'}</button>`;
    }
    render(`<main class="onboard family">${top}${body}</main>`, 'is-onboard');
  }
  async function famSubmit() {
    const f = ui.fam, C = MQ.cloud, btn = $('#fam-go'), err = $('#fam-err');
    f.code = $('#fam-code').value;
    const pin = $('#fam-pin').value.trim();
    const showErr = (code) => { f.error = FAM_ERRORS[code] || 'Something went wrong. Try again.'; err.textContent = f.error; btn.disabled = false; btn.textContent = f.mode === 'create' ? 'Create family' : 'Connect'; };
    if (f.mode === 'create' && pin !== $('#fam-pin2').value.trim()) return showErr('pin-mismatch');
    btn.disabled = true;
    btn.textContent = 'Connecting…';
    err.textContent = '';
    try {
      await C.connect({ code: f.code, pin, create: f.mode === 'create' });
    } catch (e) {
      return showErr(e.code);
    }
    ui.fam = null;
    toast('☁️ Family connected');
    MQ.sfx('reward');
    const list = S.profiles();
    if (!list.length) return newExplorer();
    if (list.length === 1) return openProfile(list[0].id);
    who();
  }
  // Another device changed something: refresh the screen if it only shows data (never in the middle of a game).
  function onCloud(what) {
    if (what === 'status') { const el = $('#sync'); if (el) el.outerHTML = syncLine(); return; }
    if (root().classList.contains('is-play')) return;
    if (st && MQ.state !== st) { st = null; return who(); } // this explorer was deleted on another device
    if (!cur) return;
    if (cur === 'who') return who();
    const [scr, arg] = cur.split(':');
    const redraw = { home, map, journal, badges, prep, world: () => world(arg) }[scr];
    if (redraw) redraw();
  }
  function newExplorer() {
    const first = !S.profiles().length;
    const k = (ui.newKid = ui.newKid || { name: '', grade: 'g2', buddy: '🦊', buddyName: 'Pip' });
    const grades = [
      ['k', '🌻', 'Kindergarten', 'Counting, adding within 10, shapes · read-aloud'],
      ['g2', '🧭', '2nd grade', 'Numbers to 1000, time, money, word problems'],
    ];
    render(`<main class="onboard">
      ${first ? '' : '<header class="bar"><button class="iconbtn" data-act="go" data-arg="who" aria-label="Back">←</button><h1>New explorer</h1></header>'}
      ${first ? '<div class="ob-hero" aria-hidden="true">🧭</div><h1 class="title">Math Expedition</h1><p class="lead">Explore wild worlds, solve number puzzles, and discover amazing real animals.</p>' : ''}
      ${first && CL() && !MQ.cloud.family ? '<p class="muted">Already have a family on another device? <button class="linkbtn" data-act="go" data-arg="family">Connect it ☁️</button></p>' : ''}
      <label for="ob-name">Explorer’s name</label>
      <input id="ob-name" class="field" maxlength="16" autocomplete="off" value="${esc(k.name)}" placeholder="Name">
      <div class="label">Which grade?</div>
      <div class="grades">${grades.map(([id, ic, n, d]) => `<button class="grade-pick ${k.grade === id ? 'sel' : ''}" data-act="pickGrade" data-arg="${id}" style="--pc:${TRACK_COLOR[id]}"><span class="gi">${ic}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
      <div class="label">Pick an expedition buddy</div>
      <div class="buddies">${MQ.COMPANIONS.map((c) => `<button class="buddy-pick ${k.buddy === c.e ? 'sel' : ''}" data-act="pickBuddy" data-arg="${c.e}" aria-label="${c.n}">${c.e}</button>`).join('')}</div>
      <label for="ob-buddy">Name your buddy</label>
      <input id="ob-buddy" class="field" maxlength="14" autocomplete="off" value="${esc(k.buddyName)}">
      <button class="btn big" data-act="createKid">Start the adventure →</button>
    </main>`, 'is-onboard');
  }
  function keepNewKidFields() {
    const k = ui.newKid;
    if ($('#ob-name')) k.name = $('#ob-name').value.trim();
    if ($('#ob-buddy')) k.buddyName = $('#ob-buddy').value.trim() || 'Pip';
  }
  function openProfile(id) {
    st = S.open(id);
    if (!st) return who();
    sess = null;
    ui = {};
    remember('home');
    home();
  }

  // ---------------------------------------------------------------- home
  function nextUp() {
    for (let wi = 0; wi < WORLDS().length; wi++) {
      if (!worldOpen(wi)) break;
      const w = WORLDS()[wi];
      const li = w.levels.findIndex((_, i) => !st.levels[w.id + '-' + i]);
      if (li >= 0 && levelOpen(w, li)) return { w, li };
    }
    return null;
  }
  function home() {
    if (!st) return who();
    const lv = MQ.levelFromXp(st.xp);
    const pct = Math.round(((st.xp - lv.from) / (lv.to - lv.from)) * 100);
    const nu = nextUp();
    const all = MQ.trackCreatures(st.grade);
    const have = all.filter((c) => st.creatures[c.id]).length, total = all.length;
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
          <div class="rank">${gradeChip(st.grade)} Level ${lv.level} · ${MQ.rankTitle(lv.level)}</div>
          <div class="xp" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>
        <div class="hello-r">${gemPill()}<button class="pill switch" data-act="go" data-arg="who">👥 ${S.profiles().length > 1 ? 'Switch' : 'Add / switch'}</button></div>
      </header>
      <div class="buddy"><span class="buddy-e">${st.companion}</span><div class="bubble" id="bubble">${esc(st.buddyName)}: ${esc(U.pick(MQ.SAY.hello))}</div></div>
      ${cont}
      <div class="tiles">
        <button class="tile t-map" data-act="go" data-arg="map"><span class="ti">🗺️</span><b>Expedition Map</b><small>${WORLDS().length} worlds · ${WORLDS().length * 6} levels</small></button>
        <button class="tile t-endless" data-act="go" data-arg="trainer"><span class="ti">♾️</span><b>Endless Training</b><small>Pick topics & difficulty</small></button>
        <button class="tile t-daily ${dailyDone ? 'done' : ''}" data-act="daily"><span class="ti">${dailyDone ? '✅' : '📅'}</span><b>Daily Quest</b><small>${dailyDone ? 'Done today · 🔥 ' + st.daily.streak : '+' + DAILY_REWARD + ' 💎 · streak ' + st.daily.streak}</small></button>
        <button class="tile t-journal" data-act="go" data-arg="journal"><span class="ti">📔</span><b>Field Journal</b><small>${have} / ${total} creatures</small></button>
        <button class="tile t-hatch" data-act="go" data-arg="hatch"><span class="ti">🥚</span><b>Hatchery</b><small>Rare eggs · ${MQ.EGG_PRICE} 💎</small></button>
        <button class="tile t-badges" data-act="go" data-arg="badges"><span class="ti">🏅</span><b>Badges</b><small>${badgeCount} / ${MQ.BADGES.length}</small></button>
        <button class="tile t-prep wide" data-act="go" data-arg="prep"><span class="ti">🎯</span><span><b>Test Prep</b><small>Placement Check in the style of i-Ready${myChecks().length ? ' · last: ' + P().label(myChecks().slice(-1)[0].overall) : ''}</small></span></button>
      </div>
      <footer class="foot">${syncLine()}<button class="linkbtn" data-act="go" data-arg="parent">For grown-ups</button></footer>
    </main>`);
    cur = 'home';
  }

  // ---------------------------------------------------------------- map & world
  function map() {
    const cards = WORLDS().map((w, i) => {
      const open = worldOpen(i);
      const stars = worldStars(w);
      const found = w.levels.filter((l) => st.creatures[l.creature]).length;
      return `<button class="wcard ${open ? '' : 'locked'}" ${open ? `data-act="go" data-arg="world:${w.id}"` : 'disabled'} style="--wc:${w.color};--wt:${w.tint}">
        <span class="wemoji">${open ? w.emoji : '🔒'}</span>
        <span class="winfo"><b>${i + 1}. ${w.name}</b><small>${w.blurb}</small>
        ${open ? `<span class="wprog">★ ${stars}/18 · ${w.levels.map((l) => `<i class="${st.creatures[l.creature] ? '' : 'sil'}">${MQ.CREATURES[l.creature].emoji}</i>`).join('')}</span>` : `<span class="wprog">Befriend the guardian of ${WORLDS()[i - 1].name} to open</span>`}
        </span>${open && found === 6 ? '<span class="wdone">✓</span>' : ''}</button>`;
    }).join('');
    render(header('Expedition Map') + `<main class="map">${cards}</main>`);
    cur = 'map';
  }

  function world(id) {
    const w = WORLDS().find((x) => x.id === id);
    if (!w) return map();
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
    cur = 'world:' + id;
  }

  // ---------------------------------------------------------------- play
  function pickProblem() {
    if (sess.mode === 'check') return MQ.prep.next(sess.eng);
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
    remember('play');
    sess = Object.assign({ correct: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0, answered: 0, earned: 0, recent: [], tries: 0, p: null, input: '', autoD: 2, up: 0, down: 0, left: cfg.timer || 0, locked: false }, cfg);
    const color = sess.world ? sess.world.color : sess.mode === 'daily' ? '#e09a2b' : sess.mode === 'check' ? '#5b63c9' : '#ff6b5b';
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
    } else if (sess.mode === 'check') {
      const total = MQ.prep.total(sess.eng), done = sess.answered;
      el.innerHTML = `<span class="ptitle">🎯 Placement Check</span><span class="cprog"><span style="width:${Math.round((done / total) * 100)}%"></span></span><span class="stat">${Math.min(done + 1, total)} / ${total}</span>`;
    } else {
      const title = sess.mode === 'daily' ? '📅 Daily Quest' : `${sess.world.emoji} ${levelName(sess.level, sess.li)}`;
      el.innerHTML = `<span class="ptitle">${title}</span><span class="slots">${U.range(1, sess.goal).map((i) => `<i class="${i <= sess.correct ? 'on' : ''}"></i>`).join('')}</span>`;
    }
  }
  function nextProblem() {
    sess.p = pickProblem();
    sess.pending = null;
    sess.tries = 0;
    sess.input = '';
    sess.locked = false;
    sess.sel = [];
    sess.lineVal = null;
    sess.showLine = null;
    sess.pickChoice = null;
    const p = sess.p, T = MQ.TOPICS[p.topic];
    const card = $('#pcard');
    // In a Placement Check the difficulty is not shown (it would give the level away).
    const chip = sess.mode === 'check' ? '' : `<span class="dchip d${p.d}">${D_ICONS[p.d]} ${D_NAMES[p.d]}</span>`;
    card.innerHTML = `<div class="pmeta"><span>${T.icon} ${T.name}</span><span class="pmeta-r">${MQ.canSpeak() ? '<button class="speak" data-act="speak" aria-label="Read the question aloud">🔊</button>' : ''}${chip}</span></div>
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
    redrawAnswer();
    showInput();
    status();
    if (st.settings.readAloud) MQ.speak(p.say || MQ.toSpeech(p.text));
  }
  // The answer area for each question format.
  //   num: number pad · choice: buttons · multi: tap every right answer · order: tap cards in order · line: tap the number line
  function answerHtml(p) {
    const checkMode = sess.mode === 'check';
    const go = sess.locked ? '' : `<button class="btn big go-pick" data-act="submitPick">${checkMode ? 'Next →' : 'Check'}</button>`;
    if (p.kind === 'num') {
      return `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="key" data-act="key" data-arg="${k}">${k}</button>`).join('')}<button class="key alt" data-act="key" data-arg="back" aria-label="Delete">⌫</button><button class="key" data-act="key" data-arg="0">0</button><button class="key go" data-act="submit">${checkMode ? 'Next' : 'Check'}</button></div>`;
    }
    if (p.kind === 'choice') {
      return `<div class="choices n${p.choices.length} ${p.choiceHtml ? 'pics' : ''}">${p.choices.map((c, i) => `<button class="choice" data-act="choose" data-arg="${i}" aria-label="${esc(c)}">${p.choiceHtml ? p.choiceHtml[i] : fmtChoice(c)}</button>`).join('')}</div>${checkMode ? go : ''}`;
    }
    if (p.kind === 'multi') {
      return `<p class="pick-note">Tap <b>every</b> right answer.</p><div class="choices multi n${p.choices.length} ${p.choiceHtml ? 'pics' : ''}">${p.choices.map((c, i) => `<button class="choice ${sess.sel.includes(i) ? 'sel' : ''}" data-act="toggle" data-arg="${i}" aria-pressed="${sess.sel.includes(i)}" aria-label="${esc(c)}">${p.choiceHtml ? p.choiceHtml[i] : fmtChoice(c)}</button>`).join('')}</div>${go}`;
    }
    if (p.kind === 'order') {
      const slotsHtml = p.items.map((_, k) => (sess.sel[k] === undefined ? `<span class="oslot empty">${k + 1}</span>` : `<button class="oslot" data-act="unorder" data-arg="${k}" aria-label="Take back ${esc(p.items[sess.sel[k]])}">${fmtChoice(p.items[sess.sel[k]])}</button>`)).join('<i class="oarrow">→</i>');
      return `<p class="pick-note">Tap the cards in order. Tap a placed card to take it back.</p><div class="order-slots">${slotsHtml}</div><div class="order-items">${p.items.map((c, i) => `<button class="choice" data-act="orderPick" data-arg="${i}" ${sess.sel.includes(i) ? 'disabled' : ''}>${fmtChoice(c)}</button>`).join('')}</div>${go}`;
    }
    if (p.kind === 'line') {
      return `<p class="pick-note">Tap a spot on the number line.</p><div class="linebox">${MQ.V.numberLine(Object.assign({}, p.line, { pick: !sess.locked, chosen: sess.lineVal, correct: sess.showLine }))}</div>${go}`;
    }
    return '';
  }
  function redrawAnswer() { $('#answer').innerHTML = answerHtml(sess.p); }
  function submitPick() {
    if (!sess || sess.locked) return;
    const p = sess.p;
    if (p.kind === 'num') return submit();
    if (p.kind === 'choice') {
      if (sess.pickChoice === null) return say(`${st.buddyName}: Tap an answer first!`);
      return check(p.choices[sess.pickChoice], document.querySelectorAll('.choice')[sess.pickChoice]);
    }
    if (p.kind === 'multi') {
      if (!sess.sel.length) return say(`${st.buddyName}: Tap the answers you think are right.`);
      return check(sess.sel.map((i) => p.choices[i]));
    }
    if (p.kind === 'order') {
      if (sess.sel.length < p.items.length) return say(`${st.buddyName}: Put all the cards in order first!`);
      return check(sess.sel.map((i) => p.items[i]));
    }
    if (p.kind === 'line') {
      if (sess.lineVal === null) return say(`${st.buddyName}: Tap a spot on the number line first!`);
      return check(sess.lineVal);
    }
  }
  // Show which picks were right after an answer (multi, order, number line).
  function markPicks(right) {
    const p = sess.p;
    if (p.kind === 'multi') document.querySelectorAll('.choices.multi .choice').forEach((b, i) => { b.classList.remove('sel'); if (p.answer.includes(p.choices[i])) b.classList.add('right'); else if (sess.sel.includes(i)) b.classList.add('nope'); });
    if (p.kind === 'order' && right) document.querySelectorAll('.oslot').forEach((b) => b.classList.add('right'));
    if (p.kind === 'line') { sess.showLine = p.answer; redrawAnswer(); }
    if (p.kind === 'multi' || p.kind === 'order') { const g = $('.go-pick'); if (g) g.remove(); }
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
    if (sess.mode === 'check') { // in a check, a tap only selects; "Next" confirms
      sess.pickChoice = i;
      document.querySelectorAll('.choice').forEach((b, k) => b.classList.toggle('sel', k === i));
      MQ.sfx('tap');
      return;
    }
    check(sess.p.choices[i], btn);
  }
  function check(given, btn) {
    const p = sess.p;
    const same = (a, b) => a.join('|') === b.join('|');
    const ok = p.kind === 'num' || p.kind === 'line' ? Number(given) === p.answer
      : p.kind === 'multi' ? same([...given].sort(), p.answer)
      : p.kind === 'order' ? same(given, p.answer)
      : String(given) === p.answer;
    if (sess.mode === 'check') return checkAnswer(ok, given);
    if (ok) right(btn); else wrong(Array.isArray(given) ? given.join(', ') : given, btn);
  }
  // Placement Check: no feedback, just save the answer and move on.
  function checkAnswer(ok, given) {
    sess.locked = true;
    sess.answered++;
    if (ok) sess.correct++;
    MQ.prep.answer(sess.eng, sess.p, ok, Array.isArray(given) ? given.join(', ') : given);
    MQ.sfx('tap');
    status();
    later(MQ.prep.done(sess.eng) ? finishCheck : nextProblem, 220);
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
    markPicks(true);
    const done = sess.goal && sess.correct >= sess.goal;
    $('#feedback').innerHTML = `<div class="fb ok"><span>✓ ${msg}</span>${sess.timer ? '' : `<button class="btn next" data-act="advance">${done ? 'Finish ★' : 'Next →'}</button>`}</div>`;
    say(`${st.buddyName}: ${msg}`);
    S.save();
    status();
    // Move on after the voice finishes (or a short pause without voice). "Next" skips the wait.
    const fn = done ? finish : nextProblem, s0 = sess;
    sess.pending = fn;
    const autoGo = () => { if (sess === s0 && s0.pending === fn) advance(); };
    if (voiceOn()) {
      const line = U.pick(MQ.SAY.voiceRight) + (U.chance(0.3) ? ' ' + st.name + '!' : '');
      MQ.speak(line).then(() => later(autoGo, 300));
    } else later(autoGo, sess.timer ? 450 : first ? 1100 : 1500);
  }
  function advance() {
    if (!sess || !sess.pending) return;
    const f = sess.pending;
    sess.pending = null;
    MQ.hush();
    f();
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
      sess.pending = nextProblem;
      later(advance, 1300);
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
        if (['multi', 'order', 'line'].includes(p.kind)) { sess.sel = []; sess.lineVal = null; redrawAnswer(); } // start the pick again
        $('#feedback').innerHTML = `<div class="fb hint">💡 ${p.hint || 'Look again carefully and try once more.'}</div>`;
        if (voiceOn()) MQ.speak(U.pick(MQ.SAY.voiceRetry) + (st.settings.readAloud && p.hint ? ' ' + MQ.toSpeech(p.hint) : ''));
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
    markPicks(false);
    $('#feedback').innerHTML = `<div class="fb reveal"><div>The answer is <b>${fmtAnswer(p)}</b>.</div>${p.explain ? `<div class="explain">${p.explain}</div>` : ''}<button class="btn" data-act="advance">Next →</button></div>`;
    say(`${st.buddyName}: ${U.pick(MQ.SAY.reveal)}`);
    sess.pending = nextProblem; // waits for the Next button
    if (voiceOn()) { const a = spokenAnswer(p); MQ.speak(U.pick(MQ.SAY.voiceReveal) + (a ? ` The answer is ${a}.` : ' Look at the green answer.')); }
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
    const newWorld = firstClear && lv.type === 'boss' && !st.settings.unlockAll ? WORLDS()[wi + 1] : null;
    S.save();
    const hasNext = li < 5 && levelOpen(w, li + 1);
    render(`<main class="result" style="--wc:${w.color};--wt:${w.tint}">
      <div class="bigstars">${starStr(stars)}</div>
      <h1 class="title">${lv.type === 'boss' ? 'Guardian befriended!' : stars === 3 ? 'Perfect expedition!' : 'Level complete!'}</h1>
      <p class="lead">${sess.correct} right${sess.mistakes ? ` · ${sess.mistakes} ${sess.mistakes === 1 ? 'oops' : 'oopses'}` : ' · no mistakes!'} · <b>+${gems} 💎</b></p>
      ${creature ? creatureCard(creature, true) : `<p class="muted">You already discovered the ${MQ.CREATURES[lv.creature].emoji} ${MQ.CREATURES[lv.creature].name} here.${stars < 3 ? ' Try for 3 stars!' : ''}</p>`}
      ${newWorld ? `<div class="unlock">🗺️ New world unlocked: <b>${newWorld.emoji} ${newWorld.name}</b></div>` : ''}
      <div class="row">
        <button class="btn ghost" data-act="go" data-arg="home">Home</button>
        <button class="btn ghost" data-act="go" data-arg="world:${w.id}">Map</button>
        <button class="btn ghost" data-act="startLevel" data-arg="${w.id}:${li}">Replay</button>
        ${hasNext ? `<button class="btn" data-act="startLevel" data-arg="${w.id}:${li + 1}">Next level →</button>` : newWorld ? `<button class="btn" data-act="go" data-arg="world:${newWorld.id}">Go to ${newWorld.name} →</button>` : ''}
      </div></main>`);
    MQ.sfx('reward');
    MQ.confetti(lv.type === 'boss' ? 220 : 120);
    if (st.settings.voice !== false) MQ.speak(creature ? `Level complete! You discovered the ${creature.name}!` : 'Level complete! Great job!');
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
    if (st.settings.voice !== false) MQ.speak('Daily quest complete! Great job!');
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
      <div class="row"><button class="btn ghost" data-act="go" data-arg="home">Home</button>${sess.kgTopic
        ? `<button class="btn ghost" data-act="go" data-arg="kgtypes">Other puzzle types</button><button class="btn" data-act="kgPractice" data-arg="${sess.kgTopic}">Play again</button>`
        : '<button class="btn ghost" data-act="go" data-arg="trainer">Change settings</button><button class="btn" data-act="startTrainer">Play again</button>'}</div></main>`);
    if (sess.correct) { MQ.sfx('reward'); if (record) MQ.confetti(); }
    if (st.settings.voice !== false && sess.correct) MQ.speak(`You got ${sess.correct} right! ${record ? 'A new record!' : 'Great training!'}`);
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
    if (sess.mode === 'check') {
      return modal(`<div class="mtitle">Stop the Placement Check?</div><p>Your answers so far will not be saved. You can start a new check any time.</p>
        <div class="row"><button class="btn ghost" data-act="closeModal">Keep going</button><button class="btn" data-act="leave">Stop</button></div>`);
    }
    modal(`<div class="mtitle">Leave this ${sess.mode === 'daily' ? 'quest' : 'level'}?</div><p>You will need to start it again to ${sess.mode === 'daily' ? 'finish the quest' : 'discover the creature'}.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep playing</button><button class="btn" data-act="leave">Leave</button></div>`);
  }

  // ---------------------------------------------------------------- test prep
  const P = () => MQ.prep;
  const myChecks = () => (st.tests.checks || []).filter((c) => c.grade === st.grade);
  const fmtDate = (k) => { const d = new Date(k + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  // Line chart of the overall level across checks, with where the grade "should" be as a dashed line.
  function historyChart(checks) {
    if (checks.length < 2) return '';
    const W = 320, H = 150, L = 64, T = 10, B = 24, PW = W - L - 12, PH = H - T - B;
    const lo = Math.max(0, Math.floor(Math.min(...checks.map((c) => Math.min(c.overall, c.expected))) - 1));
    const hi = Math.min(9, Math.ceil(Math.max(...checks.map((c) => Math.max(c.overall, c.expected))) + 1));
    const y = (v) => T + PH - ((v - lo) / Math.max(1, hi - lo)) * PH;
    const x = (i) => L + (checks.length === 1 ? PW / 2 : (i / (checks.length - 1)) * PW);
    let s = '';
    for (let v = lo; v <= hi; v++) s += `<line x1="${L}" y1="${y(v)}" x2="${L + PW}" y2="${y(v)}" stroke="#d6e0e6"/><text x="${L - 6}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="#5b6885" font-family="Nunito, sans-serif" font-weight="700">${P().STEPS[v].label}</text>`;
    s += `<polyline points="${checks.map((c, i) => `${x(i)},${y(c.expected)}`).join(' ')}" fill="none" stroke="#9aa6b8" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<polyline points="${checks.map((c, i) => `${x(i)},${y(c.overall)}`).join(' ')}" fill="none" stroke="#5b63c9" stroke-width="3"/>`;
    s += checks.map((c, i) => `<circle cx="${x(i)}" cy="${y(c.overall)}" r="5" fill="#5b63c9" stroke="#ffffff" stroke-width="2"/><text x="${x(i)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#5b6885" font-family="Nunito, sans-serif" font-weight="700">${fmtDate(c.date).replace(/, \d{4}$/, '')}</text>`).join('');
    return `<figure class="hchart">${`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Placement Check history">${s}</svg>`}<figcaption><span class="lg l1"></span>Placement Check level <span class="lg l2"></span>Where most kids are at that time of year</figcaption></figure>`;
  }
  function prep() {
    const checks = myChecks(), last = checks[checks.length - 1];
    const total = st.grade === 'k' ? 20 : 30;
    render(header('Test Prep') + `<main class="prep">
      <p class="lead">Get ready for the tests you take at school.</p>
      <article class="testcard" style="--pc:#5b63c9">
        <div class="tc-head"><span class="tc-ic">🎯</span><div><b>Placement Check</b><small>In the style of i-Ready · ${total} questions · about ${st.grade === 'k' ? 15 : 25} minutes</small></div></div>
        <p>Questions about numbers, algebra, measurement and shapes. They get harder or easier as you answer, like i-Ready at school. No hints this time: just do your best, and make your best guess if you are not sure.</p>
        ${last ? `<div class="tc-last">Last check, ${fmtDate(last.date)}: <b>${P().label(last.overall)}</b> · ${P().status(last.overall, last.expected).icon} ${P().status(last.overall, last.expected).text} <button class="linkbtn" data-act="viewCheck" data-arg="${last.id}">See results</button></div>` : ''}
        <button class="btn" data-act="startCheck">${last ? 'Take a new check' : 'Start the check'} ▶</button>
      </article>
      ${historyChart(checks)}
      ${contestCard()}
    </main>`);
    cur = 'prep';
  }
  function startCheck() {
    const eng = P().newCheck(st.grade, myChecks());
    startSession({ mode: 'check', eng, topics: [], d: [1, 1], goal: 0 });
    say(`${st.buddyName}: Do your best! No hints in a check. If you are not sure, make your best guess.`);
  }
  function finishCheck() {
    const res = P().result(sess.eng);
    const list = st.tests.checks;
    list.push(res);
    while (list.length > 12) list.shift();
    list.slice(0, -3).forEach((c) => { delete c.items; }); // keep the answer review only for the latest checks
    addGems(20);
    S.save();
    sess = null;
    checkResult(res, true);
    MQ.sfx('reward');
    MQ.confetti(120);
    if (st.settings.voice !== false) MQ.speak('You finished the placement check! Great job!');
    later(checkBadges, 1200);
  }
  function checkResult(res, fresh) {
    const stt = P().status(res.overall, res.expected);
    const plan = P().practicePlan(res, st.grade);
    const bar = (v) => `<span class="lbar"><span class="lfill" style="width:${((v + 0.5) / 10) * 100}%"></span><span class="lexp" style="left:${((res.expected + 0.5) / 10) * 100}%" title="Where most kids are now"></span></span>`;
    render(header('Placement Check', 'prep') + `<main class="presult">
      <div class="pr-hero">
        ${fresh ? '<div class="pr-done">Check complete! +20 💎</div>' : `<div class="pr-done muted">${fmtDate(res.date)}</div>`}
        <div class="pr-level">${P().label(res.overall)}</div>
        <div class="pr-status s-${stt.id}">${stt.icon} ${stt.text}</div>
        <p class="muted">${res.correct} of ${res.n} right · most kids are at <b>${P().label(res.expected)}</b> at this time of year</p>
      </div>
      <section class="pr-domains">${P().DOMAINS.map((d) => `<div class="pr-dom"><span class="pd-name">${d.icon} ${d.name}</span>${bar(res.domains[d.id])}<span class="pd-lv">${P().label(res.domains[d.id])}</span></div>`).join('')}
        <p class="muted small">The dark tick shows where most kids are at this time of year.</p></section>
      <section class="pr-plan"><h2>What to practice next</h2>
        <p>${plan.domains.map((d) => `${d.icon} <b>${d.name}</b>`).join(' and ')}</p>
        <div class="chips">${plan.topics.map((t) => `<span class="chip sel">${MQ.TOPICS[t].icon} ${MQ.TOPICS[t].name}</span>`).join('')}</div>
        <button class="btn" data-act="practicePlan" data-arg="${res.id}">Practice these ▶</button></section>
      <div class="row">${res.items ? `<button class="btn ghost" data-act="reviewCheck" data-arg="${res.id}">Review answers</button>` : ''}<button class="btn ghost" data-act="go" data-arg="prep">Test Prep</button><button class="btn ghost" data-act="go" data-arg="home">Home</button></div>
      <p class="muted small center">Practice in the style of i-Ready. The level is an estimate from this app, not an official i-Ready score.</p>
    </main>`);
  }
  function reviewCheck(res) {
    render(header('Review answers', 'prep') + `<main class="review"><ol class="rlist">${res.items.map((it) => `<li class="${it.ok ? 'ok' : 'no'}">
      <span class="rmark">${it.ok ? '✓' : '✗'}</span><div><div class="rq">${esc(it.q)}</div>
      ${it.ok ? `<div class="ra">Your answer: <b>${esc(it.given)}</b></div>` : `<div class="ra">Your answer: <b>${esc(it.given || '—')}</b> · Right answer: <b>${esc(it.a)}</b></div>${it.e ? `<div class="re">${esc(it.e)}</div>` : ''}`}</div></li>`).join('')}</ol>
      <div class="row"><button class="btn ghost" data-act="viewCheck" data-arg="${res.id}">Back to results</button></div></main>`);
  }
  // ---------------------------------------------------------------- Math Kangaroo style contest
  const myContests = (kind) => (st.tests.contests || []).filter((c) => c.kind === kind);
  function contestCard() {
    if (st.grade === 'k') {
      const last = myContests('joey').slice(-1)[0];
      return `<article class="testcard" style="--pc:#e0a21b">
        <div class="tc-head"><span class="tc-ic">🐣</span><div><b>Joey Puzzles</b><small>Brain teasers like Math Kangaroo, made for kindergarten · 12 puzzles</small></div></div>
        <p>Picture puzzles with 5 answers to choose from. Every question can be read aloud. No clock: take your time and think!</p>
        ${last ? `<div class="tc-last">Last time: <b>${last.right} of ${last.n}</b> ${'⭐'.repeat(Math.round((last.right / last.n) * 3))}</div>` : ''}
        <button class="btn" data-act="startContest" data-arg="joey">Play 12 puzzles ▶</button>
      </article>`;
    }
    const last = myContests('kangaroo').slice(-1)[0];
    return `<article class="testcard" style="--pc:#d4703a">
      <div class="tc-head"><span class="tc-ic">🦘</span><div><b>Math Kangaroo</b><small>Contest for grades 1–2 every March · 24 puzzles · 75 minutes</small></div></div>
      <p>Logic and thinking puzzles with answers A–E. The first 8 are worth 3 points, the next 8 are worth 4, the last 8 are worth 5. There is no penalty for a wrong answer, so always make a guess.</p>
      ${last ? `<div class="tc-last">Last mock contest, ${fmtDate(last.date)}: <b>${last.score} / ${last.max}</b> points <button class="linkbtn" data-act="viewContest" data-arg="${last.id}">See results</button></div>` : ''}
      <div class="row left">
        <button class="btn" data-act="startContest" data-arg="kangaroo:timed">Mock contest (75 min) ▶</button>
        <button class="btn ghost" data-act="startContest" data-arg="kangaroo">Without the clock</button>
        <button class="btn ghost" data-act="go" data-arg="kgtypes">Practice by type</button>
      </div>
    </article>`;
  }
  function kgtypes() {
    render(header('Kangaroo practice', 'prep') + `<main class="prep">
      <p class="lead">Pick a kind of puzzle. Problems get harder as you get them right, and every one has an explanation.</p>
      <div class="kgtypes">${MQ.KANGAROO_TOPICS.map((t) => `<button class="tile" data-act="kgPractice" data-arg="${t}"><span class="ti">${MQ.TOPICS[t].icon}</span><b>${MQ.TOPICS[t].name}</b></button>`).join('')}</div>
    </main>`);
  }
  function startContest(arg) {
    const [kind, timed] = arg.split(':');
    remember('contest');
    ct = P().newContest(kind);
    ct.timed = !!timed;
    ct.left = ct.timed ? ct.seconds : 0;
    render('', 'is-contest');
    contestView();
    if (ct.timed) ct.interval = setInterval(contestTick, 1000);
  }
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function contestTick() {
    if (!ct) return;
    ct.left--;
    const el = $('#ct-timer');
    if (el) { el.textContent = '⏱ ' + clock(Math.max(0, ct.left)); el.classList.toggle('low', ct.left <= 300); }
    if (ct.left <= 0) { clearInterval(ct.interval); ct.interval = null; toast('⏰ Time is up!'); contestFinish(); }
  }
  // Draw the contest without render(), so the clock keeps running between questions.
  function contestView() {
    const i = ct.i, it = ct.items[i], p = it.p, n = ct.items.length, joey = ct.kind === 'joey';
    const r = root();
    r.className = 'is-contest';
    r.innerHTML = `<div class="contest">
      <header class="playbar"><button class="iconbtn" data-act="ctQuit" aria-label="Stop">✕</button>
        <span class="ptitle">${joey ? '🐣 Joey Puzzles' : '🦘 Math Kangaroo'}</span>
        ${ct.timed ? `<span class="stat timer ${ct.left <= 300 ? 'low' : ''}" id="ct-timer">⏱ ${clock(ct.left)}</span>` : ''}</header>
      <nav class="ctnav" aria-label="Questions">${ct.items.map((x, k) => `<button class="ctdot ${k === i ? 'cur' : ''} ${ct.answers[k] !== null ? 'ans' : ''} ${ct.flags[k] ? 'flag' : ''} p${x.pts}" data-act="ctGo" data-arg="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</nav>
      <section class="pcard">
        <div class="pmeta"><span>Question ${i + 1} of ${n}${joey ? '' : ` · <b>${it.pts} points</b>`}</span><span class="pmeta-r">${ct.flags[i] ? '🚩' : ''}${MQ.canSpeak() ? '<button class="speak" data-act="ctSpeak" aria-label="Read the question aloud">🔊</button>' : ''}</span></div>
        <div class="ptext ${p.big ? 'eq' : ''} ${p.wordy ? 'wordy' : ''}">${p.text}</div>
        ${p.visual ? `<div class="pvis">${p.visual}</div>` : ''}
      </section>
      <div class="choices ct ${p.choiceHtml ? 'pics' : ''}">${p.choices.map((c, k) => `<button class="choice ${ct.answers[i] === c ? 'sel' : ''}" data-act="ctPick" data-arg="${k}" aria-pressed="${ct.answers[i] === c}"><span class="letter">${'ABCDE'[k]}</span><span class="copt">${p.choiceHtml ? p.choiceHtml[k] : fmtChoice(c)}</span></button>`).join('')}</div>
      <div class="ctbar">
        <button class="btn ghost" data-act="ctGo" data-arg="${i - 1}" ${i === 0 ? 'disabled' : ''}>← Back</button>
        ${joey ? '' : `<button class="btn ghost" data-act="ctFlag">${ct.flags[i] ? 'Unflag' : '🚩 Flag'}</button>`}
        ${i < n - 1 ? `<button class="btn" data-act="ctGo" data-arg="${i + 1}">Next →</button>` : '<button class="btn" data-act="ctFinish">Finish ✓</button>'}
      </div>
      <p class="muted center small">${ct.answers.filter((a) => a !== null).length} of ${n} answered${joey ? '' : ' · tap a number above to jump to any question'}</p>
    </div>`;
    if (st.settings.readAloud) MQ.speak(p.say || MQ.toSpeech(p.text));
  }
  function contestFinish(confirmed) {
    if (!ct) return;
    const blank = ct.answers.filter((a) => a === null).length;
    const timeUp = ct.timed && ct.left <= 0;
    if (!confirmed && blank && !timeUp) {
      return modal(`<div class="mtitle">Finish now?</div><p>You left <b>${blank}</b> ${blank === 1 ? 'question' : 'questions'} blank.${ct.kind === 'joey' ? '' : ' A wrong answer costs nothing, so a guess is better than a blank.'}</p>
        <div class="row"><button class="btn ghost" data-act="closeModal">Keep working</button><button class="btn" data-act="ctFinishNow">Finish</button></div>`);
    }
    closeModal();
    const res = P().scoreContest(ct);
    endContest();
    const list = st.tests.contests;
    list.push(res);
    while (list.length > 12) list.shift();
    list.slice(0, -3).forEach((c) => { delete c.items; });
    addGems(res.kind === 'joey' ? 15 : 25);
    S.save();
    contestResult(res, true);
    MQ.sfx('reward');
    MQ.confetti(140);
    if (st.settings.voice !== false) MQ.speak(res.kind === 'joey' ? `You solved ${res.right} puzzles! Great thinking!` : `You scored ${res.score} points! Great job!`);
    later(checkBadges, 1200);
  }
  function contestResult(res, fresh) {
    const joey = res.kind === 'joey';
    const sec = (pts) => res.sections[pts] ? `<div><b>${res.sections[pts].right} / ${res.sections[pts].n}</b><small>${pts}-point puzzles</small></div>` : '';
    render(header(joey ? 'Joey Puzzles' : 'Math Kangaroo', 'prep') + `<main class="presult">
      <div class="pr-hero" style="box-shadow: inset 0 0 0 3px ${joey ? '#e0a21b' : '#d4703a'}, 0 5px 0 ${joey ? '#e0a21b' : '#d4703a'}">
        ${fresh ? `<div class="pr-done">Finished! +${joey ? 15 : 25} 💎</div>` : `<div class="pr-done muted">${fmtDate(res.date)}</div>`}
        <div class="pr-level">${joey ? `${res.right} of ${res.n}` : `${res.score} / ${res.max}`}</div>
        <div class="muted">${joey ? 'puzzles solved ' + '⭐'.repeat(Math.max(1, Math.round((res.right / res.n) * 3))) : `points · ${res.right} of ${res.n} right${res.blank ? ` · ${res.blank} blank` : ''}${res.timed ? ` · ${res.minutes} min` : ''}`}</div>
      </div>
      ${joey ? '' : `<div class="sumgrid three">${sec(3)}${sec(4)}${sec(5)}</div>`}
      ${res.items ? `<section><h2>Review</h2><ol class="rlist">${res.items.map((it, k) => `<li class="${it.ok ? 'ok' : 'no'}">
        <span class="rmark">${it.ok ? '✓' : '✗'}</span><div><div class="rq"><b>${k + 1}.</b> ${esc(it.q)}${joey ? '' : ` <span class="dchip">${it.pts} pts</span>`}</div>
        <div class="ra">${it.ok ? `Your answer: <b>${it.letterG}</b>` : `Your answer: <b>${it.letterG || '—'}</b> · Right answer: <b>${it.letterA}</b>${/^picture/.test(it.a) ? '' : ` (${esc(it.a)})`}`}</div>
        ${!it.ok && it.e ? `<div class="re">${esc(it.e)}</div>` : ''}</div></li>`).join('')}</ol></section>` : ''}
      <div class="row"><button class="btn ghost" data-act="go" data-arg="prep">Test Prep</button><button class="btn ghost" data-act="go" data-arg="home">Home</button>${joey ? '' : '<button class="btn" data-act="go" data-arg="kgtypes">Practice by type</button>'}</div>
      <p class="muted small center">Original puzzles in the style of Math Kangaroo; not affiliated with Math Kangaroo USA. Past official papers are available from mathkangaroo.org.</p>
    </main>`);
  }
  function contestQuit() {
    modal(`<div class="mtitle">Stop the ${ct && ct.kind === 'joey' ? 'puzzles' : 'contest'}?</div><p>Your answers will not be saved.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep going</button><button class="btn" data-act="ctLeave">Stop</button></div>`);
  }

  // Grown-ups: history of checks by domain.
  function readinessSection() {
    const checks = myChecks();
    const rows = checks.slice().reverse().map((c) => `<tr><td>${fmtDate(c.date)}</td><td><b>${P().label(c.overall)}</b></td>${P().DOMAINS.map((d) => `<td>${P().label(c.domains[d.id])}</td>`).join('')}</tr>`).join('');
    return `<section><h2>Test readiness</h2>
      <p class="muted">i-Ready Diagnostic is taken at school three times a year (fall, winter, spring). A Placement Check here a week before helps ${esc(st.name)} get used to the format and shows what to practice. Results are estimates from this app, not official i-Ready scores.</p>
      ${checks.length ? `${historyChart(checks)}<div class="tablewrap"><table class="topics"><thead><tr><th>Date</th><th>Overall</th>${P().DOMAINS.map((d) => `<th>${d.short}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>` : '<p>No Placement Check yet. Start one from <b>Test Prep</b> on the home screen.</p>'}
      ${contestHistory()}
    </section>`;
  }
  function contestHistory() {
    const kind = st.grade === 'k' ? 'joey' : 'kangaroo', list = myContests(kind);
    const intro = kind === 'joey'
      ? '<h3>Joey Puzzles</h3><p class="muted">Kangaroo-style brain teasers for kindergarten (Math Kangaroo itself starts in 1st grade).</p>'
      : '<h3>Math Kangaroo</h3><p class="muted">The contest is held every March. Levels 1–2 take the same test: 24 puzzles, 75 minutes, answers A–E, 3/4/5 points (96 in all). Mock contests here use original puzzles in the same style; official past papers are sold at mathkangaroo.org.</p>';
    if (!list.length) return intro + '<p>No mock contest yet.</p>';
    return intro + `<div class="tablewrap"><table class="topics"><thead><tr><th>Date</th><th>Score</th><th>Right</th>${kind === 'joey' ? '' : '<th>3 pts</th><th>4 pts</th><th>5 pts</th><th>Time</th>'}</tr></thead><tbody>${list.slice().reverse().map((c) => `<tr><td>${fmtDate(c.date)}</td><td><b>${kind === 'joey' ? c.right + ' / ' + c.n : c.score + ' / ' + c.max}</b></td><td>${c.right} / ${c.n}</td>${kind === 'joey' ? '' : [3, 4, 5].map((p) => `<td>${c.sections[p] ? c.sections[p].right + '/' + c.sections[p].n : ''}</td>`).join('') + `<td>${c.timed ? c.minutes + ' min' : 'no clock'}</td>`}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------------------------------------------------------------- trainer
  function trainer() {
    const t = st.trainer;
    t.topics = t.topics.filter((x) => MQ.TOPICS[x] && MQ.TOPICS[x].track === st.grade);
    if (!t.topics.length) t.topics = track().core.slice(0, 3);
    const chip = (id) => { const T = MQ.TOPICS[id]; return `<button class="chip ${t.topics.includes(id) ? 'sel' : ''}" data-act="toggleTopic" data-arg="${id}" aria-pressed="${t.topics.includes(id)}">${T.icon} ${T.name}</button>`; };
    const diffs = ['auto', 1, 2, 3, 4, 5].map((d) => `<button class="seg ${String(t.diff) === String(d) ? 'sel' : ''}" data-act="setDiff" data-arg="${d}">${d === 'auto' ? '🎯<b>Auto</b><small>adjusts to you</small>' : `${D_ICONS[d]}<b>${D_NAMES[d]}</b><small>${track().dLabels[d]}</small>`}</button>`).join('');
    const modes = [['endless', '♾️', 'Endless', 'no clock, hints on'], ['l60', '⚡', 'Lightning 60s', `best: ${st.stats.lightning60 || 0}`], ['l120', '⏱️', 'Lightning 2 min', `best: ${st.stats.lightning120 || 0}`]]
      .map(([id, ic, n, sub]) => `<button class="seg ${t.mode === id ? 'sel' : ''}" data-act="setMode" data-arg="${id}">${ic}<b>${n}</b><small>${sub}</small></button>`).join('');
    render(header('Endless Training') + `<main class="trainer">
      <section><h2>1. Choose topics <button class="linkbtn" data-act="allCore">all ${track().label}</button></h2>
        <div class="chips">${track().core.map(chip).join('')}</div>
        <h3>${track().aheadLabel}</h3><div class="chips">${track().ahead.map(chip).join('')}</div></section>
      <section><h2>2. Difficulty</h2><div class="segs six">${diffs}</div></section>
      <section><h2>3. Mode</h2><div class="segs three">${modes}</div></section>
      <button class="btn big" data-act="startTrainer" ${t.topics.length ? '' : 'disabled'}>Start training ▶</button>
      <p class="muted center">+1 💎 for every first-try answer · a 🎁 chest every 5 in a row</p>
    </main>`);
  }
  function startTrainer() {
    const t = st.trainer;
    t.topics = t.topics.filter((x) => MQ.TOPICS[x] && MQ.TOPICS[x].track === st.grade);
    if (!t.topics.length) return trainer();
    startSession({ mode: 'trainer', topics: t.topics.slice(), auto: t.diff === 'auto', d: t.diff === 'auto' ? [2, 2] : [+t.diff, +t.diff], goal: 0, timer: t.mode === 'l60' ? 60 : t.mode === 'l120' ? 120 : 0 });
  }
  function startDaily() {
    // Mix of topics from worlds that are open, at a level that stretches a little.
    const topics = new Set();
    const core = track().core;
    WORLDS().forEach((w, i) => { if (worldOpen(i) && i < WORLDS().length - 1) w.levels.forEach((l) => l.topics.forEach((t) => core.includes(t) && topics.add(t))); });
    if (topics.size < 3) core.slice(0, 5).forEach((t) => topics.add(t));
    startSession({ mode: 'daily', topics: [...topics], d: track().daily, goal: 5 });
  }

  // ---------------------------------------------------------------- journal, hatchery, badges
  function journal() {
    const all = MQ.trackCreatures(st.grade);
    const have = all.filter((c) => st.creatures[c.id]).length, total = all.length;
    const card = (c) => st.creatures[c.id]
      ? `<button class="ccard r-${c.rarity}" data-act="creature" data-arg="${c.id}"><span class="ce">${c.emoji}</span><span class="cn">${c.name}</span></button>`
      : `<div class="ccard locked"><span class="ce sil">${c.emoji}</span><span class="cn">???</span></div>`;
    const sections = WORLDS().map((w) => `<section style="--wc:${w.color};--wt:${w.tint}"><h2>${w.emoji} ${w.name}</h2><div class="cgrid">${w.levels.map((l) => card(MQ.CREATURES[l.creature])).join('')}</div></section>`).join('') +
      `<section style="--wc:#b0569e;--wt:#f6dff1"><h2>🥚 Hatchery rarities</h2><div class="cgrid">${MQ.EGG_CREATURES.map(card).join('')}</div></section>`;
    render(header('Field Journal') + `<main class="journal"><div class="jcount"><b>${have}</b> of ${total} creatures discovered<div class="xp"><span style="width:${Math.round((have / total) * 100)}%"></span></div></div>${sections}</main>`);
    cur = 'journal';
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
    cur = 'badges';
  }

  // ---------------------------------------------------------------- grown-ups
  function parentGate() {
    ui.gate = { a: U.rnd(13, 29), b: U.rnd(6, 9) };
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
    const rows = Object.keys(MQ.TOPICS).filter((id) => MQ.TOPICS[id].track === st.grade || (s.topics[id] && s.topics[id].a)).map((id) => {
      const T = MQ.TOPICS[id], t = s.topics[id];
      if (!t || !t.a) return `<tr><td>${T.icon} ${T.name}<small>${T.std}</small></td><td colspan="3" class="muted">not practiced yet</td></tr>`;
      const pct = Math.round((t.c / t.a) * 100);
      const maxD = Math.max(...Object.keys(t.byD).map(Number));
      return `<tr><td>${T.icon} ${T.name}<small>${T.std}</small></td><td class="num">${t.a}</td><td class="num"><span class="acc ${pct >= 85 ? 'g' : pct >= 65 ? 'y' : 'r'}">${pct}%</span></td><td>${D_NAMES[maxD]}</td></tr>`;
    }).join('');
    const mist = st.mistakes.slice(0, 12).map((m) => `<li><span class="mt">${MQ.TOPICS[m.topic] ? MQ.TOPICS[m.topic].icon : ''} ${esc(m.text)}</span><span class="ma">answered <b>${esc(m.given)}</b>, correct <b>${esc(m.answer)}</b></span></li>`).join('');
    const kids = S.profiles().map((p) => `<li class="kid">
        <span class="kav">${p.companion}</span><span class="kname"><b>${esc(p.name)}</b><small>Level ${MQ.levelFromXp(p.xp).level} · ${p.stats.correct} solved${p.lastPlayed ? ' · last played ' + p.lastPlayed : ''}</small></span>
        <span class="kgrade">${Object.keys(MQ.TRACKS).map((g) => `<button class="chip ${p.grade === g ? 'sel' : ''}" data-act="setGrade" data-arg="${p.id}:${g}">${MQ.track(g).label}</button>`).join('')}</span>
        <button class="linkbtn" data-act="delProfile" data-arg="${p.id}">${ui.delArmed === p.id ? 'Tap again to delete' : 'Delete'}</button></li>`).join('');
    render(header('For grown-ups') + `<main class="parent">
      <p class="lead">Report for <b>${esc(st.name)}</b> ${gradeChip(st.grade)}</p>
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
        <label class="toggle"><input type="checkbox" id="set-voice" data-act="setting" data-arg="voice" ${st.settings.voice !== false ? 'checked' : ''}> Say “Great job!” or “Try again” out loud after each answer, and wait for the voice before the next problem</label>
        <label class="toggle"><input type="checkbox" id="set-read" data-act="setting" data-arg="readAloud" ${st.settings.readAloud ? 'checked' : ''}> Read every question aloud (for kids who don’t read yet; the 🔊 button always works)</label>
        <div class="namerow"><label for="set-name">Child’s name</label><input id="set-name" class="field" maxlength="16" value="${esc(st.name)}">
          <label for="set-buddy">Buddy’s name</label><input id="set-buddy" class="field" maxlength="14" value="${esc(st.buddyName)}">
          <button class="btn ghost" data-act="saveNames">Save names</button></div>
      </section>
      ${famSection()}
      <section><h2>${CL() && MQ.cloud.family ? 'Backup save code' : 'Move progress to another device'}</h2>
        <p class="muted">${CL() && MQ.cloud.family ? 'Progress already syncs through your family. A save code is an extra backup of this explorer.' : 'Copy the save code here and paste it on the other device.'}</p>
        <textarea id="savecode" class="field code" rows="3" placeholder="Save code appears here, or paste one to load it"></textarea>
        <div class="row left"><button class="btn ghost" data-act="exportSave">Show & copy save code</button><button class="btn ghost" data-act="importSave">Load pasted code</button></div>
        <p class="muted" id="save-msg"></p></section>
      ${readinessSection()}
      <section><h2>How levels map to school</h2><p>${track().school}</p></section>
      <section><h2>${CL() && MQ.cloud.family ? 'Explorers in your family' : 'Explorers on this device'}</h2>
        <p class="muted">Each child has a separate profile: their own grade, map, creatures, crystals and statistics. Changing the grade switches the map; progress in the other grade is kept.</p>
        <ul class="kids">${kids}</ul>
        <div class="row left"><button class="btn ghost" data-act="go" data-arg="new">Add an explorer</button></div></section>
      <section><h2>Start over</h2><button class="btn danger" data-act="reset">${ui.resetArmed ? `Tap again to erase ${esc(st.name)}’s progress` : `Erase ${esc(st.name)}’s progress`}</button></section>
    </main>`);
  }

  function famSection() {
    const C = CL();
    if (!C) return `<section><h2>Family sync</h2><p class="muted">Online sync works in the website version of Math Expedition.</p></section>`;
    if (!C.family) return `<section><h2>Family sync</h2>${syncLine()}<p class="muted">Connect to keep the same explorers, levels and creatures on every device.</p><div class="row left"><button class="btn" data-act="go" data-arg="family">Connect family ☁️</button></div></section>`;
    const url = location.origin + location.pathname;
    return `<section><h2>Family sync</h2>${syncLine()}
      <p>To add a phone, tablet or computer: open <b>${esc(url)}</b>, choose <b>I already have a family</b>, and type the family code <b>${esc(C.family.name)}</b> and your PIN.</p>
      <p class="muted">The PIN is not stored on devices. If you forget it, create a new family on this device: the explorers here will move into it.</p>
      <div class="row left"><button class="btn ghost" data-act="famDisconnect">${ui.discArmed ? 'Tap again to disconnect this device' : 'Disconnect this device'}</button></div></section>`;
  }

  // ---------------------------------------------------------------- routing
  // Browser back (Safari swipe, Android back) moves between screens instead of leaving the app.
  const useHistory = (() => { try { return window.top === window && !!history.pushState; } catch (e) { return false; } })();
  let fromPop = false;
  function remember(where) {
    if (!useHistory || fromPop) return;
    try { history.pushState({ where }, ''); } catch (e) { /* ignore */ }
  }
  function onPop(e) {
    if (sess && root().classList.contains('is-play')) { // leaving a game asks first, like the ✕ button
      remember('play');
      return quit();
    }
    if (ct && root().classList.contains('is-contest')) {
      remember('contest');
      return contestQuit();
    }
    if ($('#modal')) closeModal();
    const where = (e.state && e.state.where) || (st ? 'home' : 'who');
    fromPop = true;
    go(where === 'play' ? 'home' : where);
    fromPop = false;
  }
  function go(where) {
    remember(where);
    closeModal();
    if (where !== 'hatch') ui.hatch = null;
    if (where !== 'parent') { ui.resetArmed = false; ui.delArmed = null; ui.discArmed = false; }
    const [scr, arg] = where.split(':');
    if (scr !== 'play') sess = null;
    if (scr === 'who') return who();
    if (scr === 'new') { ui.newKid = null; return newExplorer(); }
    if (scr === 'family') { ui.fam = null; return family(); }
    if (!st) return who();
    endContest();
    ({ home, map, world: () => world(arg), trainer, journal, hatch, badges, prep, kgtypes, parent: parentGate }[scr] || home)();
  }

  const ACTIONS = {
    go: (a) => go(a),
    pickBuddy: (a) => { keepNewKidFields(); ui.newKid.buddy = a; newExplorer(); },
    pickGrade: (a) => { keepNewKidFields(); ui.newKid.grade = a; newExplorer(); },
    createKid: () => {
      keepNewKidFields();
      const k = ui.newKid;
      if (!k.name) { $('#ob-name').focus(); $('#ob-name').classList.add('shake'); return; }
      st = S.create({ name: k.name.slice(0, 16), grade: k.grade, companion: k.buddy, buddyName: k.buddyName.slice(0, 14) });
      ui = {};
      MQ.sfx('reward');
      home();
    },
    openProfile: (a) => openProfile(a),
    famMode: (a) => { ui.fam = ui.fam || {}; if ($('#fam-code')) ui.fam.code = $('#fam-code').value; ui.fam.mode = a; ui.fam.error = ''; family(); },
    famSubmit: () => famSubmit(),
    localOnly: () => { try { localStorage.setItem('math-expedition-localonly', '1'); } catch (e) { /* ignore */ } ui.newKid = null; newExplorer(); },
    famDisconnect: () => {
      if (!ui.discArmed) { ui.discArmed = true; return parent(); }
      ui.discArmed = false;
      MQ.cloud.disconnect();
      toast('This device is no longer synced');
      parent();
    },
    speak: () => { if (sess && sess.p) MQ.speak(sess.p.say || MQ.toSpeech(sess.p.text)); },
    setGrade: (a) => {
      const [id, g] = a.split(':');
      S.update(id, { grade: g, settings: Object.assign({}, (S.profiles().find((p) => p.id === id) || {}).settings, { readAloud: g === 'k' }) });
      if (st.id === id) st = S.open(id);
      parent();
    },
    delProfile: (a) => {
      if (ui.delArmed !== a) { ui.delArmed = a; return parent(); }
      ui.delArmed = null;
      const self = st.id === a;
      S.remove(a);
      if (self) return who();
      parent();
    },
    startLevel: (a) => { const [wid, i] = a.split(':'); const w = WORLDS().find((x) => x.id === wid); const lv = w.levels[+i]; startSession({ mode: 'level', world: w, li: +i, level: lv, topics: lv.topics, d: lv.d, goal: lv.goal }); },
    daily: () => startDaily(),
    key: (a) => key(a),
    submit: () => submit(),
    choose: (a) => choose(+a),
    next: () => advance(),
    advance: () => advance(),
    quit: () => quit(),
    leave: () => { closeModal(); const w = sess && sess.world, wasCheck = sess && sess.mode === 'check'; sess = null; w ? world(w.id) : wasCheck ? prep() : home(); },
    toggle: (a) => {
      if (!sess || sess.locked) return;
      const i = +a, k = sess.sel.indexOf(i);
      k >= 0 ? sess.sel.splice(k, 1) : sess.sel.push(i);
      MQ.sfx('tap');
      redrawAnswer();
    },
    orderPick: (a) => { if (!sess || sess.locked || sess.sel.includes(+a)) return; sess.sel.push(+a); MQ.sfx('tap'); redrawAnswer(); },
    unorder: (a) => { if (!sess || sess.locked) return; sess.sel.splice(+a, 1); MQ.sfx('tap'); redrawAnswer(); },
    tick: (a) => { if (!sess || sess.locked) return; sess.lineVal = +a; MQ.sfx('tap'); redrawAnswer(); },
    submitPick: () => submitPick(),
    startContest: (a) => startContest(a),
    ctGo: (a) => { if (!ct) return; const k = +a; if (k < 0 || k >= ct.items.length) return; ct.i = k; MQ.hush(); contestView(); window.scrollTo(0, 0); },
    ctPick: (a) => { if (!ct) return; const c = ct.items[ct.i].p.choices[+a]; ct.answers[ct.i] = ct.answers[ct.i] === c ? null : c; MQ.sfx('tap'); contestView(); },
    ctFlag: () => { if (!ct) return; ct.flags[ct.i] = !ct.flags[ct.i]; contestView(); },
    ctSpeak: () => { if (ct) { const p = ct.items[ct.i].p; MQ.speak(p.say || MQ.toSpeech(p.text)); } },
    ctFinish: () => contestFinish(false),
    ctFinishNow: () => contestFinish(true),
    ctQuit: () => contestQuit(),
    ctLeave: () => { closeModal(); endContest(); prep(); },
    viewContest: (a) => { const c = (st.tests.contests || []).find((x) => x.id === a); c ? contestResult(c, false) : prep(); },
    kgPractice: (a) => { if (!MQ.TOPICS[a]) return prep(); startSession({ mode: 'trainer', topics: [a], auto: true, d: [2, 2], goal: 0, timer: 0, kgTopic: a }); },
    startCheck: () => startCheck(),
    viewCheck: (a) => { const c = myChecks().find((x) => x.id === a); c ? checkResult(c, false) : prep(); },
    reviewCheck: (a) => { const c = myChecks().find((x) => x.id === a); c && c.items ? reviewCheck(c) : prep(); },
    practicePlan: (a) => {
      const c = myChecks().find((x) => x.id === a);
      if (!c) return prep();
      const plan = P().practicePlan(c, st.grade);
      st.trainer = { topics: plan.topics, diff: plan.diff, mode: 'endless' };
      S.save();
      startTrainer();
    },
    closeModal: () => closeModal(),
    toggleTopic: (a) => {
      const t = st.trainer.topics, i = t.indexOf(a);
      if (i >= 0 && t.length === 1) return toast('Keep at least one topic');
      i >= 0 ? t.splice(i, 1) : t.push(a);
      S.save();
      trainer();
    },
    allCore: () => { st.trainer.topics = track().core.slice(); S.save(); trainer(); },
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
      toast('Progress erased');
      home();
    },
  };
  function act(name, arg, el) { if (ACTIONS[name]) ACTIONS[name](arg, el); }

  function init() {
    S.init();
    if (MQ.cloud) { MQ.cloud.init(); MQ.cloud.onUpdate(onCloud); }
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
    window.addEventListener('popstate', onPop);
    try { if (useHistory) history.replaceState({ where: 'start' }, ''); } catch (e) { /* ignore */ }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#modal')) return closeModal();
      if (e.key === 'Enter' && $('#fam-go') && !$('#fam-go').disabled) return famSubmit();
      if (ct && root().classList.contains('is-contest') && !$('#modal')) { // contest: A–E picks, arrows move
        const k = 'abcde'.indexOf(e.key.toLowerCase());
        if (k >= 0 && k < ct.items[ct.i].p.choices.length) return act('ctPick', String(k));
        if (e.key === 'ArrowRight') return act('ctGo', String(ct.i + 1));
        if (e.key === 'ArrowLeft') return act('ctGo', String(ct.i - 1));
        return;
      }
      if (!root().classList.contains('is-play') || !sess || $('#modal')) return;
      if (sess.locked) { if ((e.key === 'Enter' || e.key === ' ') && sess.pending) { e.preventDefault(); advance(); } return; }
      if (sess.p.kind === 'num') {
        if (/^[0-9]$/.test(e.key)) key(e.key);
        else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
        else if (e.key === 'Enter') submit();
      } else if (/^[1-6]$/.test(e.key) && sess.p.kind === 'choice') choose(+e.key - 1);
      else if (e.key === 'Enter') submitPick();
    });
    // One child: straight to their home. Several: ask who is playing.
    // A brand-new device first offers to join the family, so progress is shared from the start.
    const list = S.profiles();
    let localOnly = false;
    try { localOnly = localStorage.getItem('math-expedition-localonly') === '1'; } catch (e) { /* ignore */ }
    if (!list.length && CL() && !MQ.cloud.family && !localOnly) return family();
    if (list.length === 1) openProfile(list[0].id);
    else who();
  }

  MQ.app = { init, go, session: () => sess, contest: () => ct }; // session() and contest() are used by the browser tests
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
