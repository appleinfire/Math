// Test prep: an i-Ready-style adaptive "Placement Check".
//
// One grade ladder (Early K … 3rd grade+) serves both grades. Each step takes its questions from the
// existing generators (kindergarten track for K–1st, 2nd-grade track for 2nd–3rd). The check covers the
// four i-Ready domains and picks every next question near the child's current estimated level.
//
// The level is estimated from all answers so far with a small item-response model:
//   P(right) = guess + (1 − guess) · logistic(1.7 · (ability − step))
// where "guess" depends on the format (a 2-button choice is easy to guess, a typed number is not).
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U;
  const P = {};

  P.DOMAINS = [
    { id: 'nbt', name: 'Number & Operations', short: 'Numbers', icon: '🔢' },
    { id: 'alg', name: 'Algebra & Algebraic Thinking', short: 'Algebra', icon: '🧩' },
    { id: 'md', name: 'Measurement & Data', short: 'Measurement', icon: '📏' },
    { id: 'geo', name: 'Geometry', short: 'Geometry', icon: '🔷' },
  ];
  const DOMAIN_OF = {
    add20: 'alg', place: 'nbt', add100: 'nbt', sub100: 'nbt', arrays: 'alg', time: 'md', money: 'md', shapes: 'geo', measure: 'md',
    data: 'md', big: 'nbt', words: 'alg', mult: 'alg', logic: 'alg',
    k_count: 'nbt', k_numbers: 'nbt', k_compare: 'nbt', k_teen: 'nbt', k_add: 'alg', k_sub: 'alg', k_words: 'alg', k_patterns: 'alg',
    k_measure: 'md', k_shapes: 'geo',
  };
  Object.entries(DOMAIN_OF).forEach(([t, d]) => { if (MQ.TOPICS[t]) MQ.TOPICS[t].domain = d; });

  // Which topics feed each domain on each track (school-math topics only, no enrichment puzzles).
  const POOL = {
    k: { nbt: ['k_count', 'k_numbers', 'k_compare', 'k_teen'], alg: ['k_add', 'k_sub', 'k_words'], md: ['k_measure'], geo: ['k_shapes'] },
    g2: { nbt: ['place', 'add100', 'sub100', 'big'], alg: ['add20', 'arrays', 'words'], md: ['time', 'money', 'measure', 'data'], geo: ['shapes'] },
  };
  P.POOL = POOL;
  P.STEPS = [
    { label: 'Early K', track: 'k', d: 1 },
    { label: 'Mid K', track: 'k', d: 2 },
    { label: 'Late K', track: 'k', d: 3 },
    { label: 'Early 1st', track: 'k', d: 4 },
    { label: 'Late 1st', track: 'k', d: 5 },
    { label: 'Early 2nd', track: 'g2', d: 1 },
    { label: 'Mid 2nd', track: 'g2', d: 2 },
    { label: 'Late 2nd', track: 'g2', d: 3 },
    { label: 'Early 3rd', track: 'g2', d: 4 },
    { label: '3rd grade+', track: 'g2', d: 5 },
  ];
  const TOP = P.STEPS.length - 1;
  const clampStep = (x) => U.clamp(Math.round(x), 0, TOP);
  P.label = (theta) => P.STEPS[clampStep(theta)].label;

  // Where a child "should" be today: fall = early, winter = mid, spring = late in their grade.
  P.expected = (grade, date = new Date()) => {
    const m = date.getMonth(); // 0 = Jan
    const part = m >= 7 && m <= 9 ? 0 : m >= 10 || m <= 1 ? 1 : 2;
    return (grade === 'k' ? 0 : 5) + part;
  };
  P.status = (theta, expected) => {
    const diff = theta - expected;
    if (diff >= 1.5) return { id: 'above', text: 'Above grade level', icon: '🌟' };
    if (diff >= -1) return { id: 'on', text: 'On grade level', icon: '✅' };
    return { id: 'below', text: 'Needs practice', icon: '🌱' };
  };

  // ---------- the statistics ----------
  const guessOf = (p) =>
    p.kind === 'choice' ? 1 / p.choices.length : p.kind === 'line' ? 1 / (Math.round((p.line.max - p.line.min) / p.line.step) + 1) : p.kind === 'order' ? 0.05 : p.kind === 'multi' ? 0.05 : 0.02;
  const pRight = (theta, step, g) => g + (1 - g) / (1 + Math.exp(-1.7 * (theta - step)));
  // Most likely ability given the answers, with a gentle prior around `mean`.
  function estimate(items, mean, sd = 2.5) {
    let best = mean, bestLL = -Infinity;
    for (let th = -1; th <= TOP + 1.001; th += 0.05) {
      let ll = -((th - mean) ** 2) / (2 * sd * sd);
      for (const it of items) {
        const pr = pRight(th, it.s, it.g);
        ll += Math.log(it.ok ? pr : 1 - pr);
      }
      if (ll > bestLL) { bestLL = ll; best = th; }
    }
    return U.clamp(best, 0, TOP);
  }
  P.estimate = estimate;

  // ---------- running a check ----------
  P.newCheck = (grade, history = []) => {
    const last = history.filter((h) => h.grade === grade).slice(-1)[0];
    // Like i-Ready: the first check starts one grade below; later checks start a little below the last result.
    const start = last ? U.clamp(Math.round(last.overall) - 1, 0, TOP) : grade === 'k' ? 0 : 3;
    const counts = grade === 'k' ? { nbt: 6, alg: 5, md: 4, geo: 5 } : { nbt: 8, alg: 8, md: 8, geo: 6 };
    const plan = [];
    const left = Object.assign({}, counts);
    while (Object.values(left).some((n) => n > 0)) for (const d of ['nbt', 'alg', 'md', 'geo']) if (left[d]-- > 0) plan.push(d);
    return { grade, start, plan, items: [], seen: new Set(), date: U.dateKey() };
  };
  P.total = (eng) => eng.plan.length;
  P.done = (eng) => eng.items.length >= eng.plan.length;
  const overallNow = (eng) => estimate(eng.items, eng.start + 0.5, 3);
  const domainNow = (eng, dom) => estimate(eng.items.filter((it) => it.dom === dom), eng.items.length ? overallNow(eng) : eng.start + 0.5, 2);

  P.next = (eng) => {
    const dom = eng.plan[eng.items.length];
    const step = clampStep(domainNow(eng, dom));
    const st = P.STEPS[step];
    let p;
    for (let i = 0; i < 30; i++) {
      p = MQ.makeProblem(U.pick(POOL[st.track][dom]), st.d);
      const key = p.text + (p.visual || '');
      if (!eng.seen.has(key)) { eng.seen.add(key); break; }
    }
    p.step = step;
    p.dom = dom;
    return p;
  };
  P.answer = (eng, p, ok, given) => {
    eng.items.push({
      dom: p.dom, s: p.step, ok: !!ok, g: guessOf(p), t: p.topic, d: p.d,
      q: String(p.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150),
      given: given === undefined ? '' : String(given), a: Array.isArray(p.answer) ? p.answer.join(', ') : String(p.answer), e: p.explain || '',
    });
  };
  P.result = (eng) => {
    const overall = overallNow(eng);
    const domains = {};
    for (const d of P.DOMAINS) domains[d.id] = Math.round(domainNow(eng, d.id) * 10) / 10;
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      date: eng.date, grade: eng.grade,
      overall: Math.round(overall * 10) / 10, domains,
      expected: P.expected(eng.grade),
      n: eng.items.length, correct: eng.items.filter((i) => i.ok).length,
      items: eng.items,
    };
  };

  // What to practice next: the two weakest domains, at the difficulty that matches the result.
  P.practicePlan = (res, grade) => {
    const track = grade === 'k' ? 'k' : 'g2';
    const toD = (theta) => (track === 'k' ? U.clamp(Math.round(theta) + 1, 1, 5) : U.clamp(Math.round(theta) - 4, 1, 5));
    const weakest = P.DOMAINS.slice().sort((a, b) => res.domains[a.id] - res.domains[b.id]).slice(0, 2);
    const topics = [...new Set(weakest.flatMap((d) => POOL[track][d.id]))];
    const diff = toD(Math.min(...weakest.map((d) => res.domains[d.id])));
    return { domains: weakest, topics, diff };
  };

  // ---------- Math Kangaroo style mock contest ----------
  // Kangaroo: 24 questions, 8 worth 3 points, 8 worth 4, 8 worth 5 (96 in all), 75 minutes, no penalty for wrong answers.
  // Joey (kindergarten): 12 picture puzzles, 1 point each, no clock.
  P.KANGAROO_MINUTES = 75;
  P.newContest = (kind) => {
    const seen = new Set();
    const make = (topic, d) => {
      let p;
      for (let i = 0; i < 40; i++) {
        p = MQ.makeProblem(topic, d);
        const key = p.text + (p.visual || '');
        if (!seen.has(key)) { seen.add(key); break; }
      }
      return p;
    };
    const items = [];
    if (kind === 'joey') {
      for (let i = 0; i < 12; i++) items.push({ p: make('kg_joey', 1), pts: 1 });
    } else {
      for (const pts of [3, 4, 5]) {
        const topics = U.shuffle(MQ.KANGAROO_TOPICS);
        for (let i = 0; i < 8; i++) items.push({ p: make(topics[i % topics.length], pts === 3 ? U.rnd(1, 2) : pts === 4 ? 3 : U.rnd(4, 5)), pts });
      }
    }
    return { kind, items, answers: items.map(() => null), flags: items.map(() => false), i: 0, seconds: kind === 'joey' ? 0 : P.KANGAROO_MINUTES * 60, started: Date.now() };
  };
  P.scoreContest = (ct) => {
    const graded = ct.items.map((it, i) => ({ it, given: ct.answers[i], ok: ct.answers[i] !== null && ct.answers[i] === it.p.answer }));
    const sections = {};
    for (const g of graded) {
      const s = (sections[g.it.pts] = sections[g.it.pts] || { right: 0, n: 0 });
      s.n++;
      if (g.ok) s.right++;
    }
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      date: U.dateKey(), kind: ct.kind,
      score: U.sum(graded.filter((g) => g.ok).map((g) => g.it.pts)), max: U.sum(ct.items.map((it) => it.pts)),
      right: graded.filter((g) => g.ok).length, blank: graded.filter((g) => g.given === null).length, n: graded.length,
      sections, minutes: Math.max(1, Math.round((Date.now() - ct.started) / 60000)), timed: !!ct.timed,
      items: graded.map((g) => ({
        t: g.it.p.topic, pts: g.it.pts, ok: g.ok,
        q: String(g.it.p.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
        g: g.given === null ? '' : g.given, a: g.it.p.answer, e: g.it.p.explain || '',
        letterG: g.given === null ? '' : 'ABCDE'[g.it.p.choices.indexOf(g.given)], letterA: 'ABCDE'[g.it.p.choices.indexOf(g.it.p.answer)],
      })),
    };
  };

  MQ.prep = P;
})();
