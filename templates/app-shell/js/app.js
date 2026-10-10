// UI shell: profile picker, new profile, family sync, grown-ups page, preview, routing.
// Screens render into #app; every click is routed through data-act="<action>" data-arg="<argument>" attributes.
// The demo activity (home → "Play", a 5-question quiz) shows where the new app's own screens plug in.
(function () {
  const APP = globalThis.APP, U = APP.U, S = APP.store, CFG = APP.CONFIG;
  const esc = U.esc;
  const WORD = CFG.profileWord;
  const Word = WORD[0].toUpperCase() + WORD.slice(1);

  let st = null; // APP.state: the open profile
  let sess = null; // the activity in progress
  let ui = {}; // small per-screen state (forms, "tap again to confirm" buttons…)
  let cur = ''; // screen that may be redrawn when another device changes the data ('' = leave it alone)
  let wanted = ''; // profile name from a link of our other app (…/#who=Mia): open that profile on start
  let timers = [];

  const $ = (sel) => document.querySelector(sel);
  const root = () => document.getElementById('app');
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const kindOf = (id) => CFG.kinds.find((k) => k.id === id) || CFG.kinds[0];
  const kindChip = (id) => `<span class="kchip" style="--pc:${kindOf(id).color}">${kindOf(id).label}</span>`;
  const pct = (c, a) => (a ? Math.round((c / a) * 100) : 0);
  // Links to our other apps (CFG.apps without this one). With a profile open, the link carries its name
  // (#who=Mia), so the other app opens the profile with the same name.
  const appLinks = () => {
    const other = (CFG.apps || []).filter((a) => a.id !== CFG.id);
    const who = st ? '#who=' + encodeURIComponent(st.name) : '';
    return other.length ? `<nav class="apps" aria-label="Our other apps"><span>Our other apps:</span>${other.map((a) => `<a class="appbtn" href="${esc(a.url + who)}">${a.icon} ${esc(a.name)}</a>`).join('')}</nav>` : '';
  };

  function render(html, cls = '') {
    timers.forEach(clearTimeout);
    timers = [];
    cur = '';
    const r = root();
    r.className = cls;
    r.innerHTML = previewBar() + html;
    window.scrollTo(0, 0);
  }
  function header(title, back = 'home') {
    return `<header class="bar"><button class="iconbtn" data-act="go" data-arg="${back}" aria-label="Back">←</button><h1>${title}</h1>
      <button class="mini-av" data-act="go" data-arg="who" aria-label="Switch ${WORD} (now ${esc(st.name)})" title="Switch ${WORD}">${st.avatar}</button></header>`;
  }
  function toast(html) {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
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

  // ---------------------------------------------------------------- grown-up preview
  // Everything unlocked on a copy of the profile, nothing saved. A bar on every screen says so.
  const previewBar = () => (S.preview ? '<div class="pvbar" role="status"><span>👀 <b>Grown-up preview</b> · everything is open · nothing is saved</span><button class="btn" data-act="exitPreview">Exit</button></div>' : '');
  function endPreview() {
    if (!S.preview) return;
    sess = null;
    st = S.endPreview();
  }

  // ---------------------------------------------------------------- profiles
  function who() {
    endPreview();
    const list = S.profiles();
    if (!list.length) return newProfile();
    sess = null;
    st = null;
    APP.state = null;
    render(`<main class="who-screen">
      <h1 class="title center">Who’s playing?</h1>
      <div class="profiles">${list.map((p) => `<button class="profile" data-act="openProfile" data-arg="${p.id}" style="--pc:${kindOf(p.kind).color}">
          <span class="pav">${p.avatar}</span><b>${esc(p.name)}</b>${kindChip(p.kind)}<small>${p.stats.correct} right answers</small></button>`).join('')}
        <button class="profile add" data-act="go" data-arg="new"><span class="pav">＋</span><b>New ${WORD}</b><small>Add a brother or sister</small></button>
      </div>
      <p class="muted center">Each ${WORD} has their own progress.</p>
      ${syncLine()}
      ${appLinks()}
    </main>`, 'is-who');
    cur = 'who';
  }
  function newProfile() {
    const first = !S.profiles().length;
    const k = (ui.newKid = ui.newKid || { name: '', kind: CFG.kinds[0].id, avatar: CFG.avatars[0] });
    render(`<main class="onboard">
      ${first ? `<h1 class="title">${esc(CFG.name)}</h1>` : `<header class="bar"><button class="iconbtn" data-act="go" data-arg="who" aria-label="Back">←</button><h1>New ${WORD}</h1></header>`}
      ${first && CL() && !APP.cloud.family ? '<p class="muted">Already use this app on another device? <button class="linkbtn" data-act="go" data-arg="family">Connect your family ☁️</button></p>' : ''}
      <label for="ob-name">Name</label>
      <input id="ob-name" class="field" maxlength="16" autocomplete="off" value="${esc(k.name)}" placeholder="Name">
      <div class="label">Which group?</div>
      <div class="kinds">${CFG.kinds.map((g) => `<button class="kind-pick ${k.kind === g.id ? 'sel' : ''}" data-act="pickKind" data-arg="${g.id}" style="--pc:${g.color}"><span class="gi">${g.icon}</span><b>${g.label}</b><small>${g.about}</small></button>`).join('')}</div>
      <div class="label">Pick a picture</div>
      <div class="avatars">${CFG.avatars.map((a) => `<button class="avatar-pick ${k.avatar === a ? 'sel' : ''}" data-act="pickAvatar" data-arg="${a}">${a}</button>`).join('')}</div>
      <button class="btn big" data-act="createProfile">Start →</button>
    </main>`, 'is-onboard');
  }
  const keepNewKid = () => { if ($('#ob-name')) ui.newKid.name = $('#ob-name').value.trim(); };
  function openProfile(id) {
    endPreview();
    st = S.open(id);
    if (!st) return who();
    sess = null;
    ui = {};
    remember('home');
    home();
  }

  // ---------------------------------------------------------------- family sync
  const CL = () => (APP.cloud && APP.cloud.configured() ? APP.cloud : null);
  function syncLine() {
    const C = CL();
    if (!C) return '';
    if (!C.family) {
      const sib = C.sibling();
      return `<div id="sync" class="sync off">📱 Progress is saved on this device only. <button class="linkbtn" data-act="go" data-arg="family">${sib ? `Use family ${esc(sib.name)} ☁️` : 'Connect family ☁️'}</button></div>`;
    }
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
    const back = f.mode !== 'choose' ? '<button class="iconbtn" data-act="famMode" data-arg="choose" aria-label="Back">←</button>'
      : hasKids ? '<button class="iconbtn" data-act="go" data-arg="who" aria-label="Back">←</button>' : '';
    const title = f.mode === 'create' ? 'Create a family' : f.mode === 'join' ? 'Join your family' : 'Save progress online';
    let body;
    if (f.mode === 'choose') {
      const sib = APP.cloud.sibling();
      body = `<p class="lead center">Connect this device to your family, and every phone, tablet and computer shows the same ${WORD}s and progress.</p>
        <div class="kinds">
          ${sib ? `<button class="kind-pick" id="fam-sib" data-act="famSibling" style="--pc:#5b3fa8"><span class="gi">🔗</span><b>Use family ${esc(sib.name)}</b><small>Already connected in ${esc(sib.app)} on this device · no PIN needed</small></button>` : ''}
          <button class="kind-pick" data-act="famMode" data-arg="create" style="--pc:#2bb3a3"><span class="gi">🏡</span><b>Create a family</b><small>First device: choose a family code and PIN</small></button>
          <button class="kind-pick" data-act="famMode" data-arg="join" style="--pc:#e0a21b"><span class="gi">🔑</span><b>I already have a family</b><small>Another device: type the same code and PIN</small></button>
          ${hasKids ? '' : '<button class="kind-pick" data-act="localOnly" style="--pc:#c4ccd6"><span class="gi">📱</span><b>Use this device only</b><small>You can connect later in For grown-ups</small></button>'}
        </div>
        <p class="famerr" id="fam-err" role="alert">${esc(f.error)}</p>`;
    } else {
      const create = f.mode === 'create';
      body = `<p class="muted">${create ? 'Pick a family code you will remember (at least 6 letters, for example <b>smith-tigers</b>) and a 4–6 digit PIN. Write them down: you type them once on every new device.' : 'Type the family code and PIN you chose on the first device.'}${hasKids && create ? ` The ${WORD}s already on this device will be added to the family.` : ''}</p>
        <label for="fam-code">Family code</label>
        <input id="fam-code" class="field" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(f.code)}" placeholder="family code">
        <label for="fam-pin">PIN</label>
        <input id="fam-pin" class="field" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="4–6 digits">
        ${create ? '<label for="fam-pin2">PIN again</label><input id="fam-pin2" class="field" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="same PIN">' : ''}
        <p class="famerr" id="fam-err" role="alert">${esc(f.error)}</p>
        <button class="btn big" id="fam-go" data-act="famSubmit">${create ? 'Create family' : 'Connect'}</button>`;
    }
    render(`<main class="onboard"><header class="bar">${back}<h1>${title}</h1></header>${body}</main>`, 'is-onboard');
  }
  async function famSubmit() {
    const f = ui.fam, btn = $('#fam-go'), err = $('#fam-err');
    f.code = $('#fam-code').value;
    const pin = $('#fam-pin').value.trim();
    const showErr = (code) => { f.error = FAM_ERRORS[code] || 'Something went wrong. Try again.'; err.textContent = f.error; btn.disabled = false; btn.textContent = f.mode === 'create' ? 'Create family' : 'Connect'; };
    if (f.mode === 'create' && pin !== $('#fam-pin2').value.trim()) return showErr('pin-mismatch');
    btn.disabled = true;
    btn.textContent = 'Connecting…';
    err.textContent = '';
    try { await APP.cloud.connect({ code: f.code, pin, create: f.mode === 'create' }); } catch (e) { return showErr(e.code); }
    ui.fam = null;
    toast('☁️ Family connected');
    startScreen();
  }
  async function famSibling() {
    const btn = $('#fam-sib'), err = $('#fam-err');
    btn.disabled = true;
    err.textContent = '';
    try { await APP.cloud.connectSibling(); } catch (e) { btn.disabled = false; ui.fam.error = FAM_ERRORS[e.code] || 'Something went wrong. Try again.'; err.textContent = ui.fam.error; return; }
    ui.fam = null;
    toast('☁️ Family connected');
    startScreen();
  }
  // The first screen: the profile a link asked for (#who=), else the only profile, else the picker.
  function startScreen() {
    const list = S.profiles();
    const name = wanted.trim();
    wanted = '';
    if (name) {
      const p = list.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
      if (p) return openProfile(p.id);
      ui.newKid = { name: name.slice(0, 16), kind: CFG.kinds[0].id, avatar: CFG.avatars[0] }; // not here yet: offer to add
      return newProfile();
    }
    if (!list.length) return newProfile();
    if (list.length === 1) return openProfile(list[0].id);
    who();
  }
  // Another device changed something: refresh the screen if it only shows data (never in the middle of an activity).
  function onCloud(what) {
    if (what === 'status') { const el = $('#sync'); if (el) el.outerHTML = syncLine(); return; }
    if (root().classList.contains('is-play')) return;
    if (st && APP.state !== st) { st = null; return who(); } // this profile was deleted on another device
    if (!cur) return;
    const redraw = { who, home }[cur];
    if (redraw) redraw();
  }

  // ---------------------------------------------------------------- home (replace with the new app's own screens)
  function home() {
    if (!st) return who();
    const today = st.days[U.dateKey()] || { a: 0, c: 0 };
    render(`<main class="home">
      <header class="bar"><button class="mini-av big" data-act="go" data-arg="who" aria-label="Switch ${WORD}">${st.avatar}</button><h1>Hi, ${esc(st.name)}!</h1><span class="pill">⭐ ${st.xp}</span></header>
      <p class="lead">${kindChip(st.kind)} Today: ${today.c} right of ${today.a}.</p>
      <div class="tiles">
        <button class="tile" data-act="play"><span>🎯</span><b>Play</b><small>5 quick questions</small></button>
        <button class="tile" data-act="go" data-arg="who"><span>👥</span><b>Switch</b><small>Another ${WORD}</small></button>
        <button class="tile" data-act="go" data-arg="parent"><span>🔒</span><b>For grown-ups</b><small>Report and settings</small></button>
      </div>
      ${syncLine()}
      ${appLinks()}
    </main>`, 'is-home');
    cur = 'home';
  }

  // ---------------------------------------------------------------- demo activity
  function play() {
    const hard = st.kind !== CFG.kinds[0].id || st.settings.unlockAll;
    sess = { n: 0, right: 0, streak: 0, hard };
    remember('play');
    next();
  }
  function next() {
    const a = U.rnd(1, sess.hard ? 20 : 5), b = U.rnd(1, sess.hard ? 20 : 5);
    sess.q = { text: `${a} + ${b} = ?`, answer: a + b, choices: U.shuffle([a + b, a + b + 1, Math.max(0, a + b - 2)].filter((x, i, arr) => arr.indexOf(x) === i)) };
    render(`<main class="play"><header class="bar"><button class="iconbtn" data-act="quit" aria-label="Stop">✕</button><h1>Question ${sess.n + 1} of 5</h1></header>
      <div class="card q">${sess.q.text}</div>
      <div class="choices">${sess.q.choices.map((c) => `<button class="choice" data-act="answer" data-arg="${c}">${c}</button>`).join('')}</div></main>`, 'is-play');
  }
  function answer(v) {
    if (!sess || sess.locked) return;
    const ok = +v === sess.q.answer;
    sess.locked = true;
    sess.n++;
    S.tally(ok);
    st.stats.attempts++;
    if (ok) { sess.right++; sess.streak++; st.stats.correct++; st.xp += 10; st.stats.bestStreak = Math.max(st.stats.bestStreak, sess.streak); } else sess.streak = 0;
    S.save();
    toast(ok ? '✅ Right!' : `Not quite: ${sess.q.answer}`);
    later(() => { sess.locked = false; sess.n >= 5 ? finish() : next(); }, 700);
  }
  function finish() {
    const stars = sess.right === 5 ? 3 : sess.right >= 3 ? 2 : 1;
    const lv = st.levels.demo || { stars: 0 };
    st.levels.demo = { stars: Math.max(lv.stars, stars) };
    S.save();
    const r = sess.right;
    sess = null;
    render(`<main class="result"><h1 class="title center">${'★'.repeat(stars)}</h1><p class="lead center">${r} of 5 right${S.preview ? ' · preview, not saved' : ''}</p>
      <div class="row"><button class="btn" data-act="play">Again</button><button class="btn ghost" data-act="go" data-arg="home">Home</button></div></main>`);
  }
  function quit() {
    modal(`<p class="lead">Stop now? Progress in this round is kept.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep going</button><button class="btn" data-act="leave">Stop</button></div>`);
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
    const days = U.range(0, 13).map((i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = U.dateKey(d); return { k, n: (st.days[k] || {}).a || 0, wd: 'SMTWTFS'[d.getDay()] }; });
    const maxN = Math.max(10, ...days.map((d) => d.n));
    const kids = S.profiles().map((p) => `<li class="kid"><span class="kav">${p.avatar}</span>
        <span class="kname"><b>${esc(p.name)}</b><small>${p.stats.correct} right${p.lastPlayed ? ' · last played ' + p.lastPlayed : ''}</small></span>
        <span class="chips">${CFG.kinds.map((g) => `<button class="chip ${p.kind === g.id ? 'sel' : ''}" data-act="setKind" data-arg="${p.id}:${g.id}">${g.label}</button>`).join('')}</span>
        <button class="linkbtn" data-act="delProfile" data-arg="${p.id}">${ui.delArmed === p.id ? 'Tap again to delete' : 'Delete'}</button></li>`).join('');
    const synced = CL() && APP.cloud.family;
    render(header('For grown-ups') + `<main class="parent">
      <p class="lead">Report for <b>${esc(st.name)}</b> ${kindChip(st.kind)}</p>
      <section class="kpis">
        <div><b>${s.correct}</b><small>right answers</small></div>
        <div><b>${pct(s.correct, s.attempts)}%</b><small>accuracy</small></div>
        <div><b>${days.filter((d) => d.n).length}/14</b><small>active days</small></div>
        <div><b>${s.bestStreak}</b><small>best streak</small></div>
      </section>
      <section><h2>Last 14 days</h2><div class="days">${days.map((d) => `<div class="day" title="${d.k}: ${d.n}"><span style="height:${Math.round((d.n / maxN) * 100)}%"></span><small>${d.wd}</small></div>`).join('')}</div></section>
      <section><h2>👀 Look at everything</h2>
        <p class="muted">Open every level to see what ${esc(st.name)} will meet later. Nothing is saved in the preview. It ends when you tap <b>Exit</b>, come back here, or switch ${WORD}.</p>
        <button class="btn" data-act="startPreview">Start preview 👀</button></section>
      <section class="settings"><h2>Settings</h2>
        <label class="toggle"><input type="checkbox" data-act="setting" data-arg="sound" ${st.settings.sound ? 'checked' : ''}> Sound effects</label>
        <label class="toggle"><input type="checkbox" data-act="setting" data-arg="unlockAll" ${st.settings.unlockAll ? 'checked' : ''}> Unlock everything</label>
        <label for="set-name">Name</label><input id="set-name" class="field" maxlength="16" value="${esc(st.name)}">
        <button class="btn ghost" data-act="saveName">Save name</button>
      </section>
      ${famSection()}
      <section><h2>${synced ? 'Backup save code' : 'Move progress to another device'}</h2>
        <p class="muted">${synced ? 'Progress already syncs through your family. A save code is an extra backup.' : 'Copy the save code here and paste it on the other device.'}</p>
        <textarea id="savecode" class="field code" rows="3" placeholder="Save code appears here, or paste one to load it"></textarea>
        <div class="row left"><button class="btn ghost" data-act="exportSave">Show & copy save code</button><button class="btn ghost" data-act="importSave">Load pasted code</button></div>
        <p class="muted" id="save-msg"></p></section>
      <section><h2>${synced ? `${Word}s in your family` : `${Word}s on this device`}</h2>
        <ul class="kids">${kids}</ul>
        <button class="btn ghost" data-act="go" data-arg="new">Add a ${WORD}</button></section>
      <section><h2>Start over</h2><button class="btn danger" data-act="reset">${ui.resetArmed ? `Tap again to erase ${esc(st.name)}’s progress` : `Erase ${esc(st.name)}’s progress`}</button></section>
    </main>`);
  }
  function famSection() {
    const C = CL();
    if (!C) return '<section><h2>Family sync</h2><p class="muted">Online sync works in the website version.</p></section>';
    if (!C.family) return `<section><h2>Family sync</h2>${syncLine()}<p class="muted">Connect to keep the same ${WORD}s and progress on every device.</p><button class="btn" data-act="go" data-arg="family">Connect family ☁️</button></section>`;
    return `<section><h2>Family sync</h2>${syncLine()}
      <p>To add a phone, tablet or computer: open <b>${esc(location.origin + location.pathname)}</b>, choose <b>I already have a family</b>, and type the family code <b>${esc(C.family.name)}</b> and your PIN.</p>
      <p class="muted">The PIN is not stored on devices. If you forget it, create a new family on this device: the ${WORD}s here move into it.</p>
      <button class="btn ghost" data-act="famDisconnect">${ui.discArmed ? 'Tap again to disconnect this device' : 'Disconnect this device'}</button></section>`;
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
    if (sess && root().classList.contains('is-play')) { remember('play'); return quit(); } // leaving an activity asks first
    closeModal();
    const where = (e.state && e.state.where) || (st ? 'home' : 'who');
    fromPop = true;
    go(where === 'play' || where === 'start' ? (st ? 'home' : 'who') : where);
    fromPop = false;
  }
  function go(where) {
    remember(where);
    closeModal();
    if (where !== 'parent') { ui.resetArmed = false; ui.delArmed = null; ui.discArmed = false; }
    const [scr] = where.split(':');
    sess = null;
    if (scr === 'who') return who();
    if (scr === 'new') { ui.newKid = null; return newProfile(); }
    if (scr === 'family') { ui.fam = null; return family(); }
    if (!st) return who();
    if (scr === 'parent' && S.preview) { endPreview(); toast('Preview ended'); }
    ({ home, parent: parentGate }[scr] || home)();
  }

  const ACTIONS = {
    go: (a) => go(a),
    closeModal: () => closeModal(),
    openProfile: (a) => openProfile(a),
    pickKind: (a) => { keepNewKid(); ui.newKid.kind = a; newProfile(); },
    pickAvatar: (a) => { keepNewKid(); ui.newKid.avatar = a; newProfile(); },
    createProfile: () => {
      keepNewKid();
      const k = ui.newKid;
      if (!k.name) { $('#ob-name').focus(); $('#ob-name').classList.add('shake'); return; }
      endPreview();
      st = S.create({ name: k.name.slice(0, 16), kind: k.kind, avatar: k.avatar });
      ui = {};
      remember('home');
      home();
    },
    famMode: (a) => { ui.fam = ui.fam || {}; if ($('#fam-code')) ui.fam.code = $('#fam-code').value; ui.fam.mode = a; ui.fam.error = ''; family(); },
    famSubmit: () => famSubmit(),
    famSibling: () => famSibling(),
    localOnly: () => { try { localStorage.setItem(CFG.id + '-localonly', '1'); } catch (e) { /* ignore */ } ui.newKid = null; startScreen(); },
    famDisconnect: () => {
      if (!ui.discArmed) { ui.discArmed = true; return parent(); }
      ui.discArmed = false;
      APP.cloud.disconnect();
      toast('This device is no longer synced');
      parent();
    },
    play: () => play(),
    answer: (a) => answer(a),
    quit: () => quit(),
    leave: () => { closeModal(); sess = null; home(); },
    gate: () => {
      if (Number($('#gate-in').value) === ui.gate.a * ui.gate.b) parent();
      else { $('#gate-msg').textContent = 'Not quite — try again.'; $('#gate-in').value = ''; }
    },
    setting: (a, el) => { st.settings[a] = el.checked; S.save(); },
    saveName: () => { st.name = $('#set-name').value.trim().slice(0, 16) || st.name; S.save(); toast('Saved'); },
    setKind: (a) => {
      const [id, kind] = a.split(':');
      S.update(id, { kind });
      if (st.id === id) st = S.open(id);
      parent();
    },
    delProfile: (a) => {
      if (ui.delArmed !== a) { ui.delArmed = a; return parent(); }
      ui.delArmed = null;
      const self = st.id === a;
      S.remove(a);
      if (self) { st = null; return who(); }
      parent();
    },
    startPreview: () => { st = S.startPreview(); ui = {}; toast('👀 Preview: everything is open, nothing is saved'); go('home'); },
    exitPreview: () => { endPreview(); ui = {}; toast('Preview ended. Nothing was saved.'); go('home'); },
    exportSave: () => {
      const code = S.exportCode(), ta = $('#savecode');
      ta.value = code;
      const done = () => ($('#save-msg').textContent = 'Copied. Paste it on the other device.');
      const fallback = () => { ta.focus(); ta.select(); $('#save-msg').textContent = 'Select the code above and copy it.'; };
      try { navigator.clipboard.writeText(code).then(done, fallback); } catch (e) { fallback(); }
    },
    importSave: () => {
      try { endPreview(); st = S.importCode($('#savecode').value); toast('Progress loaded'); parent(); } catch (e) { $('#save-msg').textContent = 'That code did not work. Copy the whole code and try again.'; }
    },
    reset: () => {
      if (!ui.resetArmed) { ui.resetArmed = true; return parent(); }
      ui.resetArmed = false;
      S.reset();
      st = APP.state;
      toast('Progress erased');
      home();
    },
  };
  function act(name, arg, el) { if (ACTIONS[name]) ACTIONS[name](arg, el); }

  function init() {
    S.init();
    if (APP.cloud) { APP.cloud.init(); APP.cloud.onUpdate(onCloud); }
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
      if (e.key === 'Escape' && $('#modal')) return closeModal();
      if (e.key === 'Enter' && $('#fam-go') && !$('#fam-go').disabled) return famSubmit();
    });
    window.addEventListener('popstate', onPop);
    const m = /^#who=(.+)$/.exec(location.hash);
    if (m) { try { wanted = decodeURIComponent(m[1]); } catch (e) { /* broken link: ignore */ } }
    try {
      if (useHistory) history.replaceState({ where: 'start' }, '', location.pathname + location.search); // drop #who= from the address
    } catch (e) { /* ignore */ }
    // A brand-new device first offers to join the family, so progress is shared from the start.
    // Then: the profile a link asked for, the only profile, or the picker.
    let localOnly = false;
    try { localOnly = localStorage.getItem(CFG.id + '-localonly') === '1'; } catch (e) { /* ignore */ }
    if (!S.profiles().length && CL() && !APP.cloud.family && !localOnly) return family();
    startScreen();
  }

  APP.app = { init, go, session: () => sess }; // session() is used by the browser test
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
