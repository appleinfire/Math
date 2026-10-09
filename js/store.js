// Saved progress, one profile per child, in localStorage on this device.
//   math-expedition-profiles   → { active, order: [ids] }
//   math-expedition-p-<id>     → that child's whole state (grade, progress, crystals, stats…)
// Profiles never share data: switching profile swaps the whole state object.
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
    trainer: { topics: MQ.track(grade).core.slice(0, 3), diff: 'auto', mode: 'endless' },
    settings: { sound: true, unlockAll: false, readAloud: grade === 'k' },
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
  };
  S.update = (id, fields) => { // change another profile's name / grade from the grown-ups page
    const st = MQ.state && MQ.state.id === id ? MQ.state : readProfile(id);
    if (!st) return;
    Object.assign(st, fields);
    put(PKEY(id), st);
    memory[id] = st;
  };
  S.save = () => {
    const st = MQ.state;
    if (!st) return;
    memory[st.id] = st;
    put(PKEY(st.id), st);
  };
  S.reset = () => { // erase one child's progress, keep who they are
    const { id, name, grade, companion, buddyName } = MQ.state;
    MQ.state = Object.assign(fresh(grade), { id, name, grade, companion, buddyName });
    S.save();
  };
  S.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(MQ.state))));
  S.importCode = (code) => {
    const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!obj || obj.v !== 1) throw new Error('This is not a Math Expedition save code.');
    const st = merge(fresh(obj.grade || 'g2'), obj);
    if (!st.id || !index.order.includes(st.id)) { st.id = st.id || newId(); index.order.push(st.id); }
    memory[st.id] = st;
    put(PKEY(st.id), st);
    return S.open(st.id);
  };

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
