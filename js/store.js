// Saved progress, one profile per child, in localStorage on this device.
//   math-expedition-profiles   → { active, order: [ids] }
//   math-expedition-p-<id>     → that child's whole state (grade, progress, crystals, stats…)
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
    stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0 },
    daily: { last: '', streak: 0, best: 0 },
    days: {}, // 'YYYY-MM-DD': { a, c }
    mistakes: [],
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
  S.remove = (id) => {
    del(PKEY(id));
    delete memory[id];
    index.order = index.order.filter((x) => x !== id);
    if (index.active === id) index.active = null;
    put(INDEX, index);
    if (MQ.state && MQ.state.id === id) MQ.state = null;
    changed('remove', id);
  };
  S.update = (id, fields) => { // change another profile's name / grade from the grown-ups page
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
    if (!st) return;
    stamp(st);
    memory[st.id] = st;
    put(PKEY(st.id), st);
    changed('save', st.id, st);
  };
  S.reset = () => { // erase one child's progress, keep who they are
    const { id, name, grade, companion, buddyName } = MQ.state;
    MQ.state = Object.assign(fresh(grade), { id, name, grade, companion, buddyName, resetAt: Date.now() });
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
    for (const k of ['attempts', 'correct', 'bestStreak', 'd5', 'lightning60', 'lightning120', 'endlessBest']) out.stats[k] = max(nw.stats[k], old.stats[k]);
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
    out.rev = max(nw.rev, old.rev);
    return out;
  };
  // A copy of a profile arrived from another device. Returns true if anything changed here.
  S.applyRemote = (remote) => {
    if (!remote || !remote.id) return false;
    const id = remote.id;
    const local = (MQ.state && MQ.state.id === id ? MQ.state : null) || readProfile(id) || memory[id];
    const merged = merge(fresh(remote.grade || 'g2'), S.mergeProfiles(local, remote));
    if (local && JSON.stringify(local) === JSON.stringify(merged)) return false;
    if (MQ.state && MQ.state.id === id) { // update in place so the screen keeps the same object
      for (const k of Object.keys(MQ.state)) delete MQ.state[k];
      Object.assign(MQ.state, merged);
    }
    memory[id] = merged;
    put(PKEY(id), MQ.state && MQ.state.id === id ? MQ.state : merged);
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
  S.raw = (id) => (MQ.state && MQ.state.id === id ? MQ.state : readProfile(id) || memory[id]);

  // Record one answered problem (first-try result) for statistics.
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
    if (!firstTry && given !== undefined) {
      st.mistakes.unshift({ topic: p.topic, d: p.d, text: p.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140), given: String(given), answer: String(p.answer), date: day });
      st.mistakes.length = Math.min(st.mistakes.length, 40);
    }
    const keys = Object.keys(st.days).sort();
    while (keys.length > 90) delete st.days[keys.shift()];
  };

  MQ.store = S;
})();
