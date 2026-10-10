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
  // A question this child has not seen yet: never one already in this attempt (`avoid`), preferably one
  // not shown in earlier attempts (profile `seen`); when every candidate was seen, the one seen longest ago.
  P.fresh = (topic, d, avoid = new Set()) => {
    const seen = (MQ.state && MQ.state.seen && MQ.state.seen[topic]) || [];
    let best = null, bestRank = Infinity;
    for (let i = 0; i < 40; i++) {
      const p = MQ.makeProblem(topic, d), k = U.qkey(p);
      const rank = avoid.has(k) ? 1e9 : seen.indexOf(k);
      if (rank === -1) { best = p; break; }
      if (rank < bestRank || !best) { best = p; bestRank = rank; }
    }
    avoid.add(U.qkey(best));
    return best;
  };
  // review: skills the child got wrong before ({ topic, d }, most urgent first). Kangaroo and Logic tests swap a few
  // questions for fresh ones of those skills, in the same section, so the test keeps its size and point values.
  // (CogAT, Brain Games and Joey tests already ask every question type at every level they use.)
  P.REVIEW_IN_CONTEST = 3;
  const bandOf = (d) => (d <= 2 ? 3 : d === 3 ? 4 : 5);
  P.newContest = (kind, review = []) => {
    const avoid = new Set();
    const make = (topic, d) => P.fresh(topic, d, avoid);
    const items = [];
    if (kind === 'logic' || kind === 'logick') {
      // Logic Lab challenge: every kind of logic puzzle, the easier round first.
      const [topics, levels] = kind === 'logic' ? [MQ.LOGIC_TOPICS, [4, 5]] : [MQ.LOGIC_K, [1, 2]];
      levels.forEach((d, r) => { for (const t of U.shuffle(topics)) items.push({ p: make(t, d), pts: 1, sec: r ? 'Round 2' : 'Round 1' }); });
    } else if (kind === 'joey') {
      for (let i = 0; i < 12; i++) items.push({ p: make('kg_joey', 1), pts: 1 });
    } else if (kind === 'cogat' || kind === 'cogatk') {
      // CogAT style: battery by battery, each question type in a row, getting harder within the type.
      const levels = kind === 'cogat' ? [1, 2, 3, 4, 5] : [1, 1];
      for (const b of MQ.COGAT_BATTERIES) for (const t of b.topics) for (const d of levels) items.push({ p: make(t, d), pts: 1, sec: b.id });
    } else {
      for (const pts of [3, 4, 5]) {
        const topics = U.shuffle(MQ.KANGAROO_TOPICS);
        for (let i = 0; i < 8; i++) items.push({ p: make(topics[i % topics.length], pts === 3 ? U.rnd(1, 2) : pts === 4 ? 3 : U.rnd(4, 5)), pts });
      }
    }
    const family = kind === 'kangaroo' ? MQ.KANGAROO_TOPICS : kind === 'logic' ? MQ.LOGIC_TOPICS : kind === 'logick' ? MQ.LOGIC_K : [];
    const maxD = kind === 'logick' ? 2 : 5;
    for (const r of review.filter((x) => family.includes(x.topic) && x.d <= maxD).slice(0, P.REVIEW_IN_CONTEST)) {
      // the same type if it is in the test, otherwise any question of the same section
      const fits = (it) => !it.rv && (kind === 'kangaroo' ? it.pts === bandOf(r.d) : true);
      let at = items.findIndex((it) => fits(it) && it.p.topic === r.topic);
      if (at < 0) at = items.findIndex(fits);
      if (at < 0) continue;
      const p = make(r.topic, r.d);
      p.review = true;
      items[at] = Object.assign({}, items[at], { p, rv: true });
    }
    return { kind, items, answers: items.map(() => null), flags: items.map(() => false), i: 0, seconds: kind === 'kangaroo' ? P.KANGAROO_MINUTES * 60 : 0, started: Date.now() };
  };
  P.scoreContest = (ct) => {
    const graded = ct.items.map((it, i) => ({ it, given: ct.answers[i], ok: ct.answers[i] !== null && ct.answers[i] === it.p.answer }));
    // Sections: point values for Kangaroo, batteries for CogAT. Types: accuracy per kind of question.
    const sections = {}, types = {};
    for (const g of graded) {
      const s = (sections[g.it.sec || g.it.pts] = sections[g.it.sec || g.it.pts] || { right: 0, n: 0 });
      const t = (types[g.it.p.topic] = types[g.it.p.topic] || { right: 0, n: 0 });
      s.n++; t.n++;
      if (g.ok) { s.right++; t.right++; }
    }
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      date: U.dateKey(), kind: ct.kind,
      score: U.sum(graded.filter((g) => g.ok).map((g) => g.it.pts)), max: U.sum(ct.items.map((it) => it.pts)),
      right: graded.filter((g) => g.ok).length, blank: graded.filter((g) => g.given === null).length, n: graded.length,
      sections, types, minutes: Math.max(1, Math.round((Date.now() - ct.started) / 60000)), timed: !!ct.timed,
      items: graded.map((g) => ({
        t: g.it.p.topic, d: g.it.p.d, pts: g.it.pts, sec: g.it.sec || '', ok: g.ok, rv: !!g.it.rv,
        q: String(g.it.p.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
        g: g.given === null ? '' : g.given, a: g.it.p.answer, e: g.it.p.explain || '',
        letterG: g.given === null ? '' : 'ABCDE'[g.it.p.choices.indexOf(g.given)], letterA: 'ABCDE'[g.it.p.choices.indexOf(g.it.p.answer)],
      })),
    };
  };

  // ---------- what each test is, for the ⓘ buttons ----------
  P.INFO = {
    check: {
      title: 'Placement Check', icon: '🎯',
      what: 'A practice version of the i-Ready Diagnostic in math: an adaptive test where the next question gets harder after a right answer and easier after a wrong one.',
      where: 'Many California schools give the i-Ready Diagnostic three times a year (fall, winter, spring). Teachers use it to see each child’s level and to choose lessons.',
      checks: 'Four areas of school math: Numbers & Operations, Algebra & Algebraic Thinking, Measurement & Data, and Geometry. The result is a level such as “Mid 2nd”, compared with where most kids are at that time of year.',
      how: 'Take a check about a week before the school test, or every couple of months to see growth. No hints during the check. Afterwards, “Practice these” trains the two weakest areas, and the mistakes come back in Fix-it Lab.',
    },
    kangaroo: {
      title: 'Math Kangaroo', icon: '🦘',
      what: 'An international math contest with thinking puzzles, not drills. Levels 1–2 take the same paper: 24 puzzles in 75 minutes, answers A–E.',
      where: 'Held once a year in March at test centers across the US (Math Kangaroo USA). Kids sign up through a local center, often a school or a library.',
      checks: 'Logic, counting, shapes and patterns, careful reading. Puzzles are worth 3, 4 or 5 points, and a wrong answer costs nothing.',
      how: 'Try a mock contest with the clock once in a while, and use “Practice by type” for the kinds of puzzles that went wrong. Missed puzzle types come back in the next mock contest.',
    },
    joey: {
      title: 'Joey Puzzles', icon: '🐣',
      what: 'Picture brain teasers in the style of Math Kangaroo, made easier for kindergarten.',
      where: 'Math Kangaroo starts in 1st grade; these puzzles get a kindergartner used to the style early.',
      checks: 'Counting, comparing, simple patterns and shapes, and listening carefully to the question.',
      how: 'Play the 12 puzzles with a grown-up nearby. Every question can be read aloud with 🔊. There is no clock.',
    },
    cogat: {
      title: 'CogAT practice', icon: '🧠',
      what: 'Practice for the Cognitive Abilities Test (CogAT), which measures reasoning, not what was taught in class.',
      where: 'Eureka Union School District gives the CogAT to every 2nd grader as one part of GATE screening. Many other districts use it for gifted programs too.',
      checks: 'Three parts: Verbal (picture analogies, sentence completion, picture classification), Quantitative (number analogies, number puzzles, number series) and Nonverbal (figure matrices, figure classification, paper folding).',
      how: 'Short sessions of “Practice by type” work best; a full 45-question test now and then shows progress in each part. Real CogAT percentiles cannot be estimated from practice.',
    },
    cogatk: {
      title: 'Brain Games', icon: '🧠',
      what: 'Picture thinking puzzles in the style of the CogAT, made for kindergarten.',
      where: 'Eureka Union gives the CogAT in 2nd grade; these games build the same kinds of thinking early.',
      checks: 'Seeing patterns, things that go together, and how shapes change.',
      how: 'Play a few puzzles at a time. Every question is read aloud.',
    },
    logic: {
      title: 'Logic Lab', icon: '🧩',
      what: 'Logic puzzles in words: put people in order from clues, find who has what, decide what must be true, count all the ways, and catch the fibber.',
      where: 'Not a school test, but the same thinking is in Math Kangaroo, CogAT and the word problems on i-Ready, and it helps in reading too.',
      checks: 'Careful reading, using only what is said, trying possibilities and checking them. Levels 4–5 are advanced puzzles for kids who want more.',
      how: 'Use “Practice by type” (it gets harder as answers are right, and every answer is explained). The 12-puzzle challenge mixes all types at the advanced levels.',
    },
    logick: {
      title: 'Logic Lab', icon: '🧩',
      what: 'First logic puzzles: who is tallest, who has which pet, yes or no, and what happens next.',
      where: 'Not a school test. It builds the careful thinking used in all later math.',
      checks: 'Listening to clues and putting them together.',
      how: 'Play with a grown-up: every puzzle is read aloud, and drawing the clues on paper helps.',
    },
  };

  MQ.prep = P;
})();
