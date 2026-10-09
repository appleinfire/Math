// Saved progress lives in localStorage on this device. Parents can export / import a save code.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const KEY = 'math-expedition-v1';

  const fresh = () => ({
    v: 1,
    name: '',
    companion: '🦊',
    buddyName: 'Pip',
    created: MQ.U.dateKey(),
    crystals: 0,
    xp: 0,
    levels: {}, // 'tide-0': { stars, best }
    creatures: {}, // id: { got: date, from }
    badges: {}, // id: date
    eggsHatched: 0,
    stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0 },
    daily: { last: '', streak: 0, best: 0 },
    days: {}, // 'YYYY-MM-DD': { a, c }
    mistakes: [], // recent misses for the grown-ups page
    trainer: { topics: ['add20', 'add100', 'sub100'], diff: 'auto', mode: 'endless' },
    settings: { sound: true, unlockAll: false },
  });

  function merge(base, saved) {
    for (const k of Object.keys(saved)) {
      if (saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], saved[k]);
      else base[k] = saved[k];
    }
    return base;
  }

  const S = {};
  S.load = () => {
    let st = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) st = merge(fresh(), JSON.parse(raw));
    } catch (e) { /* storage blocked: play without saving */ }
    MQ.state = st;
    MQ.playerName = st.name;
    return st;
  };
  S.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(MQ.state)); } catch (e) { /* ignore */ }
  };
  S.reset = () => {
    MQ.state = fresh();
    S.save();
  };
  S.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(MQ.state))));
  S.importCode = (code) => {
    const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!obj || obj.v !== 1) throw new Error('This is not a Math Expedition save code.');
    MQ.state = merge(fresh(), obj);
    MQ.playerName = MQ.state.name;
    S.save();
  };

  // Record one answered problem (first-try result) for statistics.
  S.record = (p, firstTry, given) => {
    const st = MQ.state;
    const t = (st.stats.topics[p.topic] = st.stats.topics[p.topic] || { a: 0, c: 0, byD: {} });
    const bd = (t.byD[p.d] = t.byD[p.d] || { a: 0, c: 0 });
    t.a++; bd.a++; st.stats.attempts++;
    if (firstTry) { t.c++; bd.c++; }
    const day = MQ.U.dateKey();
    const dd = (st.days[day] = st.days[day] || { a: 0, c: 0 });
    dd.a++;
    if (firstTry) dd.c++;
    if (!firstTry && given !== undefined) {
      st.mistakes.unshift({ topic: p.topic, d: p.d, text: p.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140), given: String(given), answer: String(p.answer), date: day });
      st.mistakes.length = Math.min(st.mistakes.length, 40);
    }
    // keep ~90 days of history
    const keys = Object.keys(st.days).sort();
    while (keys.length > 90) delete st.days[keys.shift()];
  };

  MQ.store = S;
})();
