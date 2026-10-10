// Saved progress, one profile per child, in localStorage on this device.
//   math-expedition-profiles   → { active, order: [ids] }
//   math-expedition-p-<id>     → that child's whole state (grade, progress, crystals, stats, farm…)
// Profiles never share data: switching profile swaps the whole state object.
// When the family is connected to the cloud (js/cloud.js), every change is reported through S.onChange
// and changes from other devices come back through S.applyRemote / S.removeRemote.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const INDEX = 'math-expedition-profiles';
  const PKEY = (id) => 'math-expedition-p-' + id;
  const OLD = 'math-expedition-v1'; // single-player save from the first version

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fresh = (grade = 'g2') => ({
    v: 1,
    id: newId(),
    grade,
    name: '',
    companion: '🦊',
    buddyName: 'Pip',
    created: MQ.U.dateKey(),
    lastPlayed: '',
    crystals: 0,
    xp: 0,
    levels: {}, // '<world>-<i>': { stars }
    creatures: {}, // id: { got, from }
    badges: {}, // id: date
    eggsHatched: 0,
    stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0, fixed: 0 },
    daily: { last: '', streak: 0, best: 0 },
    days: {}, // 'YYYY-MM-DD': { a, c } — answers and first-try right answers, kept for two years
    months: {}, // 'YYYY-MM': { topic: [answers, right] } — long-term accuracy per topic
    mistakes: [],
    review: {}, // 'topic|d': { topic, d, box, due, miss, last } — mistakes to practice again (see S.miss / S.hit)
    goal: { perDay: 0, days: 5 }, // daily goal set by a grown-up: problems per day (0 = off), days per week
    tips: {}, // topic: date a strategy tip was last shown
    tests: { checks: [], contests: [] }, // Placement Check and mock contest results (newest last)
    seen: {}, // test-prep topic: recently shown question keys (oldest first), so retakes bring new questions
    trainer: { topics: MQ.track(grade).core.slice(0, 3), diff: 'auto', mode: 'endless' },
    settings: { sound: true, unlockAll: false, readAloud: grade === 'k', voice: true },
  });

  function merge(base, saved) {
    for (const k of Object.keys(saved)) {
      if (saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], saved[k]);
      else base[k] = saved[k];
    }
    return base;
  }
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: play without saving */ } };
  const del = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };
  const readProfile = (id) => { const raw = get(PKEY(id)); return raw ? merge(fresh(raw.grade), raw) : null; };

  const S = {};
  let index = { active: null, order: [] };
  let memory = {}; // fallback when storage is blocked
  const listeners = [];
  S.onChange = (fn) => listeners.push(fn);
  const changed = (type, id, st) => listeners.forEach((fn) => { try { fn(type, id, st); } catch (e) { /* a sync problem must never break the game */ } });
  const stamp = (st) => { st.rev = Math.max(Date.now(), (st.rev || 0) + 1); };

  S.init = () => {
    index = get(INDEX) || { active: null, order: [] };
    const old = get(OLD);
    if (old && !index.order.length) { // migrate the first version's single save into a 2nd-grade profile
      const st = merge(fresh('g2'), old);
      st.id = newId();
      st.grade = 'g2';
      put(PKEY(st.id), st);
      index = { active: st.id, order: [st.id] };
      put(INDEX, index);
      del(OLD);
    }
    index.order = index.order.filter((id) => get(PKEY(id)) || memory[id]);
    MQ.state = null;
    return index;
  };
  S.profiles = () => index.order.map((id) => readProfile(id) || memory[id]).filter(Boolean);
  S.lastActive = () => index.active;
  S.open = (id) => {
    const st = readProfile(id) || memory[id];
    if (!st) return null;
    MQ.state = st;
    MQ.playerName = st.name;
    index.active = id;
    put(INDEX, index);
    return st;
  };
  S.create = ({ name, grade, companion, buddyName }) => {
    const st = fresh(grade);
    Object.assign(st, { name, companion, buddyName });
    index.order.push(st.id);
    memory[st.id] = st;
    MQ.state = st;
    S.save();
    return S.open(st.id);
  };
  // Grown-up preview: the app plays on a copy of the child's profile with every world open, and nothing is saved
  // (no storage, no cloud upload, no unfinished tests). Ending the preview reloads the real profile.
  S.preview = false;
  S.startPreview = () => {
    if (!MQ.state || S.preview) return MQ.state;
    const copy = JSON.parse(JSON.stringify(MQ.state));
    copy.settings.unlockAll = true;
    S.preview = true;
    MQ.state = copy;
    return copy;
  };
  S.endPreview = () => {
    if (!S.preview) return MQ.state;
    S.preview = false;
    const id = MQ.state && MQ.state.id;
    MQ.state = null;
    return id ? S.open(id) : null;
  };

  // Unfinished tests (Placement Check, mock contests), one per kind, kept on this device for each child.
  const PAUSE = (id) => 'math-expedition-pause-' + id;
  S.paused = (kind) => (!S.preview && MQ.state && (get(PAUSE(MQ.state.id)) || {})[kind]) || null;
  S.setPaused = (kind, data) => {
    if (!MQ.state || S.preview) return;
    const all = get(PAUSE(MQ.state.id)) || {};
    all[kind] = data;
    put(PAUSE(MQ.state.id), all);
  };
  S.clearPaused = (kind) => {
    if (!MQ.state || S.preview) return;
    const all = get(PAUSE(MQ.state.id)) || {};
    if (!(kind in all)) return;
    delete all[kind];
    Object.keys(all).length ? put(PAUSE(MQ.state.id), all) : del(PAUSE(MQ.state.id));
  };
  S.remove = (id) => {
    del(PKEY(id));
    del(PAUSE(id));
    delete memory[id];
    index.order = index.order.filter((x) => x !== id);
    if (index.active === id) index.active = null;
    put(INDEX, index);
    if (MQ.state && MQ.state.id === id) MQ.state = null;
    changed('remove', id);
  };
  S.update = (id, fields) => { // change another profile's name / grade from the grown-ups page
    if (S.preview) return;
    const st = MQ.state && MQ.state.id === id ? MQ.state : readProfile(id);
    if (!st) return;
    Object.assign(st, fields);
    stamp(st);
    put(PKEY(id), st);
    memory[id] = st;
    changed('save', id, st);
  };
  S.save = () => {
    const st = MQ.state;
    if (!st || S.preview) return;
    stamp(st);
    memory[st.id] = st;
    put(PKEY(st.id), st);
    changed('save', st.id, st);
  };
  S.reset = () => { // erase one child's progress, keep who they are
    const { id, name, grade, companion, buddyName } = MQ.state;
    MQ.state = Object.assign(fresh(grade), { id, name, grade, companion, buddyName, resetAt: Date.now() });
    del(PAUSE(id));
    S.save();
  };
  S.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(MQ.state))));
  S.importCode = (code) => {
    const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!obj || obj.v !== 1) throw new Error('This is not a Math Expedition save code.');
    const st = merge(fresh(obj.grade || 'g2'), obj);
    if (!st.id || !index.order.includes(st.id)) { st.id = st.id || newId(); index.order.push(st.id); }
    stamp(st);
    memory[st.id] = st;
    put(PKEY(st.id), st);
    changed('save', st.id, st);
    return S.open(st.id);
  };

  // ---------- cloud sync support ----------
  // Combine two copies of the same child's progress (e.g. played offline on two devices).
  // Nothing earned is lost: creatures, badges and stars are united; counters keep the higher value;
  // spendable things (crystals) and settings come from the most recent copy.
  S.SEEN_MAX = 80;
  // Remember that a test-prep question was shown (most recent last).
  S.markSeen = (topic, key) => {
    const st = MQ.state;
    if (!st) return;
    const list = (st.seen = st.seen || {})[topic] || [];
    const at = list.indexOf(key);
    if (at === list.length - 1 && at >= 0) return;
    if (at >= 0) list.splice(at, 1);
    list.push(key);
    st.seen[topic] = list.slice(-S.SEEN_MAX);
  };
  S.mergeProfiles = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    const [nw, old] = (a.rev || 0) >= (b.rev || 0) ? [a, b] : [b, a];
    if ((nw.resetAt || 0) > (old.rev || 0)) return JSON.parse(JSON.stringify(nw)); // progress was erased on purpose
    const out = JSON.parse(JSON.stringify(nw));
    out.creatures = Object.assign({}, old.creatures, nw.creatures);
    out.badges = Object.assign({}, old.badges, nw.badges);
    out.levels = Object.assign({}, old.levels);
    for (const [k, v] of Object.entries(nw.levels || {})) out.levels[k] = { stars: Math.max(v.stars || 0, (old.levels[k] || {}).stars || 0) };
    const max = (x, y) => Math.max(x || 0, y || 0);
    out.xp = max(nw.xp, old.xp);
    out.eggsHatched = max(nw.eggsHatched, old.eggsHatched);
    for (const k of ['attempts', 'correct', 'bestStreak', 'd5', 'lightning60', 'lightning120', 'endlessBest', 'fixed']) out.stats[k] = max(nw.stats[k], old.stats[k]);
    for (const [t, v] of Object.entries(old.stats.topics || {})) if (!out.stats.topics[t] || out.stats.topics[t].a < v.a) out.stats.topics[t] = v;
    out.days = Object.assign({}, old.days);
    for (const [d, v] of Object.entries(nw.days || {})) out.days[d] = { a: max(v.a, (old.days[d] || {}).a), c: max(v.c, (old.days[d] || {}).c) };
    if ((old.daily.last || '') > (nw.daily.last || '')) out.daily = Object.assign({}, old.daily);
    out.daily.best = max(nw.daily.best, old.daily.best);
    if ((old.lastPlayed || '') > (out.lastPlayed || '')) out.lastPlayed = old.lastPlayed;
    // test results from both devices are kept (each result has its own id, which starts with a timestamp)
    out.tests = Object.assign({}, nw.tests);
    for (const key of new Set([...Object.keys(old.tests || {}), ...Object.keys(nw.tests || {})])) {
      const both = [...((old.tests || {})[key] || []), ...((nw.tests || {})[key] || [])];
      if (!both.every((x) => x && x.id)) continue;
      const byId = {};
      for (const r of both) byId[r.id] = r;
      out.tests[key] = Object.values(byId).sort((x, y) => (x.id < y.id ? -1 : 1));
    }
    // questions seen on either device; the newer copy's order wins
    out.seen = {};
    for (const t of new Set([...Object.keys(old.seen || {}), ...Object.keys(nw.seen || {})])) {
      const keys = [...((old.seen || {})[t] || []), ...((nw.seen || {})[t] || [])];
      out.seen[t] = keys.filter((k, i) => keys.lastIndexOf(k) === i).slice(-S.SEEN_MAX);
    }
    // monthly accuracy: each cell keeps the copy with more answers
    out.months = JSON.parse(JSON.stringify(old.months || {}));
    for (const [m, ts] of Object.entries(nw.months || {})) {
      const o = (out.months[m] = out.months[m] || {});
      for (const [t, v] of Object.entries(ts)) if (!o[t] || o[t][0] < v[0]) o[t] = v.slice();
    }
    // mistakes to practice: the copy that was practiced more recently wins for each skill
    out.review = Object.assign({}, old.review || {});
    for (const [k, v] of Object.entries(nw.review || {})) if (!out.review[k] || (v.last || '') >= (out.review[k].last || '')) out.review[k] = v;
    out.tips = Object.assign({}, old.tips || {}, nw.tips || {});
    // Sunny Farm: the copy changed last wins as a whole (money is spent, animals move), by the farm's own clock,
    // so a device that only opened the farm can't replace a farm played on another device.
    if (old.farm && (!nw.farm || (old.farm.t || 0) > (nw.farm.t || 0))) out.farm = JSON.parse(JSON.stringify(old.farm));
    out.rev = max(nw.rev, old.rev);
    return out;
  };
  // A copy of a profile arrived from another device. Returns true if anything changed here.
  S.applyRemote = (remote) => {
    if (!remote || !remote.id) return false;
    const id = remote.id;
    const live = MQ.state && MQ.state.id === id && !S.preview; // in a preview the copy on screen is left alone
    const local = (live ? MQ.state : null) || readProfile(id) || memory[id];
    const merged = merge(fresh(remote.grade || 'g2'), S.mergeProfiles(local, remote));
    if (local && JSON.stringify(local) === JSON.stringify(merged)) return false;
    if (live) { // update in place so the screen keeps the same object
      for (const k of Object.keys(MQ.state)) delete MQ.state[k];
      Object.assign(MQ.state, merged);
    }
    memory[id] = merged;
    put(PKEY(id), live ? MQ.state : merged);
    if (!index.order.includes(id)) index.order.push(id);
    put(INDEX, index);
    return true;
  };
  S.removeRemote = (id) => {
    if (!index.order.includes(id)) return false;
    del(PKEY(id));
    delete memory[id];
    index.order = index.order.filter((x) => x !== id);
    if (index.active === id) index.active = null;
    put(INDEX, index);
    if (MQ.state && MQ.state.id === id) MQ.state = null;
    return true;
  };
  S.raw = (id) => (MQ.state && MQ.state.id === id && !S.preview ? MQ.state : readProfile(id) || memory[id]);

  // ---------- mistakes to practice again ----------
  // A first-try mistake puts the skill (topic + difficulty) in box 0, due today. A first-try right answer on a
  // due skill moves it up a box: next try 1 day later, then 3 days later; the third right answer fixes it.
  // So a mistake counts as fixed after three right answers on three different days. A new mistake starts over.
  S.REVIEW_GAP = [0, 1, 3];
  S.REVIEW_MAX = 80;
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return MQ.U.dateKey(d); };
  S.addDays = addDays;
  S.rkey = (topic, d) => topic + '|' + d;
  S.miss = (topic, d) => {
    const st = MQ.state, today = MQ.U.dateKey(), k = S.rkey(topic, d);
    const r = (st.review[k] = st.review[k] || { topic, d, box: 0, due: today, miss: 0, last: today });
    Object.assign(r, { box: 0, due: today, last: today, miss: r.miss + 1 });
    const keys = Object.keys(st.review);
    if (keys.length > S.REVIEW_MAX) { // forget the skills missed longest ago
      keys.sort((a, b) => (st.review[a].last < st.review[b].last ? -1 : 1));
      for (const x of keys.slice(0, keys.length - S.REVIEW_MAX)) delete st.review[x];
    }
  };
  S.hit = (topic, d) => {
    const st = MQ.state, today = MQ.U.dateKey(), k = S.rkey(topic, d), r = st.review[k];
    if (!r || r.due > today) return null;
    r.box++;
    r.last = today;
    if (r.box >= S.REVIEW_GAP.length) { delete st.review[k]; st.stats.fixed = (st.stats.fixed || 0) + 1; return 'fixed'; }
    r.due = addDays(today, S.REVIEW_GAP[r.box]);
    return 'up';
  };
  // Skills to practice today (optionally only those that fit), the oldest and most-missed first.
  S.dueReview = (fit = () => true) => {
    const st = MQ.state, today = MQ.U.dateKey();
    return Object.values((st && st.review) || {})
      .filter((r) => r.due <= today && MQ.TOPICS[r.topic] && fit(r))
      .sort((a, b) => (a.due !== b.due ? (a.due < b.due ? -1 : 1) : b.miss - a.miss));
  };

  // Record one answered problem (first-try result) for statistics and the mistakes to practice again.
  // Returns 'fixed' when this answer fixed an old mistake, 'up' when it moved one closer to fixed.
  S.record = (p, firstTry, given) => {
    const st = MQ.state;
    const t = (st.stats.topics[p.topic] = st.stats.topics[p.topic] || { a: 0, c: 0, byD: {} });
    const bd = (t.byD[p.d] = t.byD[p.d] || { a: 0, c: 0 });
    t.a++; bd.a++; st.stats.attempts++;
    if (firstTry) { t.c++; bd.c++; }
    const day = MQ.U.dateKey();
    st.lastPlayed = day;
    const dd = (st.days[day] = st.days[day] || { a: 0, c: 0 });
    dd.a++;
    if (firstTry) dd.c++;
    const mk = day.slice(0, 7), mt = ((st.months[mk] = st.months[mk] || {})[p.topic] = st.months[mk][p.topic] || [0, 0]);
    mt[0]++;
    if (firstTry) mt[1]++;
    if (!firstTry && given !== undefined) {
      st.mistakes.unshift({ topic: p.topic, d: p.d, text: p.text.replace(/<li>/g, ' • ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140), given: String(given), answer: String(p.answer), date: day });
      st.mistakes.length = Math.min(st.mistakes.length, 40);
    }
    const keys = Object.keys(st.days).sort();
    while (keys.length > 730) delete st.days[keys.shift()];
    const months = Object.keys(st.months).sort();
    while (months.length > 36) delete st.months[months.shift()];
    if (!p.d) return null;
    if (firstTry) return S.hit(p.topic, p.d);
    S.miss(p.topic, p.d);
    return null;
  };

  MQ.store = S;
})();
