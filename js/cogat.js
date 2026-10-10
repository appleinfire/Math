// CogAT-style practice (the screening Eureka Union gives every 2nd grader for GATE).
// For 2nd grade the real test is picture-based with spoken directions, in three batteries:
//   Verbal: Picture Analogies, Sentence Completion, Picture Classification
//   Quantitative: Number Analogies, Number Puzzles, Number Series
//   Nonverbal: Figure Matrices, Figure Classification, Paper Folding
// Every item has 4 answer choices and a `say` line for read-aloud. All items are original.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U, V = MQ.V;
  const { C } = MQ.G;
  const { rnd, pick, chance, shuffle } = U;

  // Picture choices: values are "picture 1…4", the pictures are drawn by choiceHtml.
  function pics(text, correctHtml, wrongHtmls, o = {}) {
    const all = shuffle([correctHtml, ...wrongHtmls.slice(0, 3)]);
    const values = all.map((_, i) => 'picture ' + (i + 1));
    return C(text, values[all.indexOf(correctHtml)], values, Object.assign({ choiceHtml: all }, o));
  }
  // Emoji choices are drawn big.
  const EC = (text, ans, choices, o = {}) => C(text, ans, choices, Object.assign({ choiceHtml: choices.map((e) => `<span class="cemo">${e}</span>`) }, o));
  const uniqueBy = (arr, key) => arr.filter((x, i) => arr.findIndex((y) => key(y) === key(x)) === i);

  // ===================== Quantitative =====================
  const OBJ = ['🍎', '🐟', '⭐', '🌸', '🍪', '🐞', '🥕', '🎈'];
  const RULES = {
    1: [['+1', (n) => n + 1], ['+2', (n) => n + 2]],
    2: [['−1', (n) => n - 1], ['−2', (n) => n - 2], ['+2', (n) => n + 2]],
    3: [['×2', (n) => n * 2], ['+3', (n) => n + 3]],
    4: [['half', (n) => n / 2], ['−3', (n) => n - 3], ['×2', (n) => n * 2]],
    5: [['×2 − 1', (n) => n * 2 - 1], ['×2 + 1', (n) => n * 2 + 1], ['half + 1', (n) => n / 2 + 1]],
  };
  function cg_numanalogy(d) {
    for (let t = 0; t < 100; t++) {
      const [name, f] = pick(RULES[d]);
      const [e1, e2] = U.sample(OBJ, 2);
      const a = rnd(1, 5), c = rnd(1, 5);
      const b = f(a), ans = f(c);
      if (a === c || !Number.isInteger(b) || !Number.isInteger(ans) || b < 1 || ans < 1 || b > 9 || ans > 9 || b === a) continue;
      const wrong = uniqueBy([c, ans + 1, ans - 1, c + (b - a), ans + 2].filter((n) => n !== ans && n >= 1 && n <= 9), (n) => n).slice(0, 3);
      if (wrong.length < 3) continue;
      const opts = shuffle([ans, ...wrong]);
      const values = opts.map((_, i) => 'picture ' + (i + 1));
      return C(`The first two boxes go together. Which picture goes with the third box in the same way?<div class="vis analogy"><span class="abox">${V.cluster(e1, a)}</span><b>→</b><span class="abox">${V.cluster(e1, b)}</span><span class="abox">${V.cluster(e2, c)}</span><b>→</b><span class="abox mq">?</span></div>`,
        values[opts.indexOf(ans)], values, { choiceHtml: opts.map((n) => V.cluster(e2, n)), say: 'The first two boxes go together. Which picture goes with the third box in the same way?', hint: `Count both boxes in the top pair. What happened to the number?`, explain: `${a} became ${b} (${name}), so ${c} becomes ${ans}.` });
    }
    return cg_numanalogy(1);
  }
  const PUZ = ['🐸', '🐢', '🦊', '🐼', '🦉', '🐙'];
  function cg_numpuzzle(d) {
    const [A, B] = U.sample(PUZ, 2);
    let text, ans, say, explain;
    if (d === 1) { const x = rnd(1, 6), y = rnd(1, 4); ans = x + y; text = `${A} = ${x} + ${y}`; say = `The animal equals ${x} plus ${y}. What number is the animal?`; explain = `${x} + ${y} = ${ans}`; }
    else if (d === 2) { ans = rnd(2, 8); const y = rnd(1, 5); text = `${A} + ${y} = ${ans + y}`; say = `The animal plus ${y} equals ${ans + y}. What number is the animal?`; explain = `${ans + y} − ${y} = ${ans}`; }
    else if (d === 3 && chance(0.7)) { ans = rnd(2, 9); text = `${A} + ${A} = ${2 * ans}`; say = `Two of the same animal make ${2 * ans}. What number is one animal?`; explain = `${ans} + ${ans} = ${2 * ans}`; }
    else if (d === 3) { ans = rnd(2, 5); text = `${A} + ${A} + ${A} = ${3 * ans}`; say = `Three of the same animal make ${3 * ans}. What number is one animal?`; explain = `${ans} + ${ans} + ${ans} = ${3 * ans}`; }
    else if (d === 4) { const b = rnd(6, 12); ans = rnd(1, b - 2); text = `${B} = ${b}<br>${A} + ${b - ans} = ${B}`; say = `The second animal is ${b}. The first animal plus ${b - ans} equals the second animal. What number is the first animal?`; explain = `${A} + ${b - ans} = ${b}, so ${A} = ${ans}`; }
    else { ans = rnd(2, 6); const y = rnd(1, 5); text = `${A} + ${A} + ${y} = ${2 * ans + y}`; say = `Two of the same animal plus ${y} make ${2 * ans + y}. What number is one animal?`; explain = `${2 * ans + y} − ${y} = ${2 * ans}, half of that is ${ans}`; }
    const opts = U.numChoices(ans, [ans + 1, ans - 1, ans + 2, ans * 2], 4).sort((a, b) => a - b);
    return C(`<div class="emojieq">${text}</div>What number is ${A}?`, ans, opts, { say, explain, hint: 'Make both sides equal.' });
  }
  // Every bead pattern a level can use (1 to 9 beads per rod); the last number is the answer.
  const SERIES = (() => {
    const L = { 1: [], 2: [], 3: [], 4: [], 5: [] }, R = (n) => U.range(1, n);
    const step = (s, k, len) => U.range(0, len - 1).map((i) => s + i * k);
    const rep = (unit, len) => U.range(0, len - 1).map((i) => unit[i % unit.length]);
    for (const s of R(9)) {
      L[1].push(step(s, 1, 5), step(s, -1, 4));
      L[2].push(step(s, 2, 4), step(s, -2, 4), step(s, -1, 5), step(s, 1, 6));
      L[3].push(rep([s, s + 1, s + 2], 6), step(s, 2, 5), step(s, -2, 5), step(s, 3, 3).concat([s + 9]));
      L[4].push([s, s + 1, s + 3, s + 6], [s, s + 2, s + 3, s + 5, s + 6], [s, s - 2, s - 3, s - 5, s - 6], [s, s + 1, s, s + 2, s, s + 3], [s, s, s + 1, s + 1, s + 2, s + 2], step(s, 3, 3), [s, s + 3, s + 1, s + 4, s + 2, s + 5], [s, s - 1, s - 3, s - 6], [s, s + 2, s + 1, s + 3, s + 2]);
      L[5].push([s, s - 2, s - 1, s - 3, s - 2, s - 4], [s, s + 2, s + 1, s + 3, s + 2, s + 4], [s, s, s + 2, s + 2, s + 4, s + 4], [s, s + 1, s + 3, s + 6, s + 10].slice(0, 4), [s, s - 1, s - 3, s - 6]);
      for (const t of R(9)) if (t !== s) {
        L[1].push(rep([s, t], 5));
        L[2].push(rep([s, s, t], 6));
        L[3].push(rep([s, t, t], 6));
        if (t >= s + 2) L[3].push(rep([s, t], 6));
        if (Math.abs(t - s) >= 2) L[5].push([s, t, s + 1, t + 1, s + 2, t + 2], [s, t, s + 1, t - 1, s + 2, t - 2]); // two rows taking turns, far enough apart to tell
      }
    }
    L[4].push([1, 2, 4, 8], [8, 4, 2, 1]);
    const ok = (q) => q.every((n) => n >= 1 && n <= 9) && new Set(q).size > 1;
    for (const d of R(5)) L[d] = uniqueBy(L[d].filter(ok), (q) => q.join());
    return L;
  })();
  function cg_numseries(d) {
    const seq = pick(SERIES[d]);
    const ans = seq[seq.length - 1], shown = seq.slice(0, -1);
    const wrong = uniqueBy([ans + 1, ans - 1, ans + 2, ans - 2, shown[shown.length - 1], ans + 3, ans - 3].filter((n) => n !== ans && n >= 0 && n <= 9), (n) => n).slice(0, 3);
    const opts = shuffle([ans, ...wrong]);
    const values = opts.map((_, i) => 'picture ' + (i + 1));
    return C('Look at the beads on each rod. Which rod comes next?', values[opts.indexOf(ans)], values, { visual: V.abacus([...shown, null]), choiceHtml: opts.map((n) => V.abacus([n])), say: 'Look at the beads on each rod. Which rod comes next?', hint: 'Count the beads on every rod and look for the pattern.', explain: `The rods go ${shown.join(', ')}, so next is ${ans}.` });
  }

  // ===================== Nonverbal =====================
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star'];
  const COLORS = ['blue', 'red', 'green', 'yellow'];
  const key = (f) => [f.shape, f.color, f.big === false ? 's' : 'b', f.count || 1, f.rot || 0, f.dot ? 1 : 0].join('|');
  const randFig = (o = {}) => Object.assign({ shape: pick(SHAPES), color: pick(COLORS), big: true, count: 1, rot: 0, dot: false }, o);
  function cg_matrix(d) {
    for (let t = 0; t < 100; t++) {
      // Each rule changes one thing about a figure; harder levels combine two rules.
      const rules = {
        color: () => { const [c1, c2] = U.sample(COLORS, 2); return { from: { color: c1 }, to: { color: c2 }, say: 'the color changes' }; },
        size: () => (chance(0.5) ? { from: { big: true }, to: { big: false }, say: 'it gets smaller' } : { from: { big: false }, to: { big: true }, say: 'it gets bigger' }),
        count: () => { const [n1, n2] = U.sample([1, 2, 3, 4], 2); return { from: { count: n1 }, to: { count: n2 }, say: `${n1} becomes ${n2}` }; },
        shape: () => { const [s1, s2] = U.sample(['circle', 'square', 'triangle', 'diamond', 'hexagon'], 2); return { from: { shape: s1 }, to: { shape: s2 }, say: `the ${s1} becomes a ${s2}` }; },
        rotate: () => { const r = pick([90, 180, 270]); return { from: { shape: 'arrow', rot: 0 }, to: { shape: 'arrow', rot: r }, turn: r, say: 'the arrow turns' }; },
        dot: () => ({ from: { dot: false }, to: { dot: true }, say: 'a dot appears inside' }),
      };
      const names = { 1: ['color'], 2: [pick(['size', 'count'])], 3: [pick(['shape', 'rotate', 'dot'])], 4: U.sample(['color', 'size', 'count', 'dot'], 2), 5: [pick(['rotate', 'shape']), pick(['color', 'count'])] }[d];
      const rs = names.map((n) => rules[n]());
      const free = (o) => { const f = randFig(); for (const r of rs) Object.assign(f, r.from); return Object.assign(f, o); };
      // A and C share the "before" state of every rule but differ in something else.
      const A = free({});
      let Cf = free({});
      if (key(A) === key(Cf)) {
        const other = names.includes('color') ? (names.includes('shape') || names.includes('rotate') ? { count: (A.count % 4) + 1 } : { shape: pick(SHAPES.filter((s) => s !== A.shape)) }) : { color: pick(COLORS.filter((c) => c !== A.color)) };
        Cf = Object.assign({}, Cf, other);
      }
      if (key(A) === key(Cf)) continue;
      const apply = (f) => { const g = Object.assign({}, f); for (const r of rs) { Object.assign(g, r.to); if (r.turn !== undefined) g.rot = ((f.rot || 0) + r.turn) % 360; } return g; };
      const B = apply(A), D = apply(Cf);
      // Wrong answers: the rule only half applied, the picture unchanged, the top answer copied, a random change.
      const wrongs = uniqueBy([
        Cf,
        B,
        ...rs.map((r) => { const g = Object.assign({}, D); Object.assign(g, r.from); return g; }),
        Object.assign({}, D, { color: pick(COLORS.filter((c) => c !== D.color)) }),
        Object.assign({}, D, { big: !D.big }),
        Object.assign({}, D, { count: (D.count % 4) + 1 }),
      ].filter((f) => key(f) !== key(D)), key);
      if (wrongs.length < 3) continue;
      const w3 = shuffle(wrongs).slice(0, 3);
      return pics(`The top two pictures go together. Which picture goes with the bottom one in the same way?${V.matrix2(A, B, Cf)}`, V.fig(D), w3.map((f) => V.fig(f)), { say: 'The first two pictures go together. Which picture goes with the third picture in the same way?', hint: 'What changed from the first picture to the second? Make the same change.', explain: `In the top pair ${rs.map((r) => r.say).join(' and ')}. Do the same to the bottom picture.` });
    }
    return cg_matrix(1);
  }
  const ATTRS = ['shape', 'color', 'big', 'count', 'dot'];
  const vary = (o = {}) => randFig(Object.assign({ big: chance(0.7), count: pick([1, 1, 2, 3]), dot: chance(0.25) }, o));
  function cg_classify(d) {
    for (let t = 0; t < 200; t++) {
      // The rule the three pictures share; everything else varies.
      const rule = { 1: pick(['shape']), 2: pick(['color', 'shape']), 3: pick(['count', 'color']), 4: pick(['dot', 'small', 'count']), 5: 'two' }[d];
      let fixed, says;
      if (rule === 'shape') { fixed = { shape: pick(SHAPES) }; says = `they are all ${fixed.shape}s`; }
      else if (rule === 'color') { fixed = { color: pick(COLORS) }; says = `they are all ${fixed.color}`; }
      else if (rule === 'count') { fixed = { count: rnd(2, 4) }; says = `they all have ${fixed.count} shapes`; }
      else if (rule === 'dot') { fixed = { dot: true }; says = 'they all have a dot in the middle'; }
      else if (rule === 'small') { fixed = { big: false }; says = 'they are all small'; }
      else {
        const pair = pick([['shape', 'color'], ['shape', 'count'], ['color', 'count'], ['shape', 'dot'], ['color', 'dot']]);
        const v = { shape: pick(SHAPES), color: pick(COLORS), count: rnd(2, 3), dot: true };
        fixed = {};
        for (const k of pair) fixed[k] = v[k];
        says = {
          'shape,color': `they are all ${v.color} ${v.shape}s`, 'shape,count': `each one has ${v.count} ${v.shape}s`, 'color,count': `each one has ${v.count} ${v.color} shapes`,
          'shape,dot': `they are all ${v.shape}s with a dot`, 'color,dot': `they are all ${v.color} with a dot`,
        }[pair.join()];
      }
      const keys = Object.keys(fixed);
      const fits = (f) => keys.every((k) => f[k] === fixed[k]);
      // Each wrong answer breaks one part of the rule (and only that), so it looks close.
      const breakOne = (k) => ({ shape: { shape: pick(SHAPES.filter((x) => x !== fixed.shape)) }, color: { color: pick(COLORS.filter((x) => x !== fixed.color)) }, count: { count: pick([1, 2, 3, 4].filter((x) => x !== fixed.count)) }, dot: { dot: false }, big: { big: true } })[k];
      const three = [0, 1, 2].map(() => vary(fixed));
      const correct = vary(fixed);
      const wrongs = [0, 1, 2].map((i) => vary(Object.assign({}, fixed, breakOne(keys[i % keys.length]))));
      // No hidden second rule: whatever all three share, the right answer shares too and every wrong one misses.
      const shared = ATTRS.filter((k) => three.every((f) => f[k] === three[0][k]));
      const fitsAll = (f) => shared.every((k) => f[k] === three[0][k]);
      const allKeys = [...three, correct, ...wrongs].map(key);
      if (new Set(allKeys).size !== 7 || !fits(correct) || wrongs.some(fits) || !fitsAll(correct) || wrongs.some(fitsAll)) continue;
      return pics(`These three pictures are alike in some way:${V.figRow(three)}Which picture goes with them?`, V.fig(correct), wrongs.map((f) => V.fig(f)), { say: 'These three pictures are alike in some way. Which picture goes with them?', hint: 'Look at shape, color, size, how many, and what is inside.', explain: `They belong together because ${says}.` });
    }
    return cg_classify(1);
  }
  function cg_folding(d) {
    for (let t = 0; t < 100; t++) {
      // Single folds from any side; double folds leave any one quarter on top.
      const fold = d <= 3 ? pick(['v', 'vr', 'h', 'hb']) : d === 4 ? pick(['q', 'q2', 'q3', 'q4', 'v', 'vr', 'h', 'hb']) : pick(['q', 'q2', 'q3', 'q4', 'q', 'q2', 'q3', 'q4', 'v', 'vr', 'h', 'hb']);
      const F = V.FOLDS[fold], twice = fold[0] === 'q';
      const nHoles = d <= 2 ? 1 : d === 3 ? 2 : d === 4 ? (twice ? 1 : 2) : twice ? 2 : 3;
      const open = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (F.vis(r, c)) open.push([r, c]);
      const holes = U.sample(open, nHoles);
      const mirrorV = ([r, c]) => [r, 3 - c], mirrorH = ([r, c]) => [3 - r, c];
      const unfold = (hs, axes) => { let out = hs.slice(); if (axes.includes('v')) out = out.concat(out.map(mirrorV)); if (axes.includes('h')) out = out.concat(out.map(mirrorH)); return uniqueBy(out, (x) => x.join()); };
      const right = unfold(holes, F.axes);
      const k = (hs) => hs.map((x) => x.join()).sort().join(';');
      const wrongSets = uniqueBy([
        holes,
        unfold(holes, F.axes === 'v' ? 'h' : 'v'),
        twice ? unfold(holes, 'v') : unfold(holes, 'vh'),
        twice ? unfold(holes, 'h') : unfold(holes, F.axes === 'v' ? 'h' : 'v').concat(holes),
        right.map(([r, c]) => [r, (c + 1) % 4]),
        right.map(([r, c]) => [(r + 1) % 4, c]),
      ].map((hs) => uniqueBy(hs, (x) => x.join())).filter((hs) => k(hs) !== k(right)), k);
      if (wrongSets.length < 3) continue;
      const layers = twice ? 4 : 2;
      return pics(`A sheet of paper is ${F.text}, then ${nHoles === 1 ? 'a hole is' : nHoles + ' holes are'} punched through it. What does the paper look like when it is opened?${V.foldSteps(fold, holes)}`, V.sheet(right, { size: 72 }), shuffle(wrongSets).slice(0, 3).map((hs) => V.sheet(hs, { size: 72 })), { say: `A sheet of paper is ${F.text}. Then ${nHoles === 1 ? 'a hole is' : nHoles + ' holes are'} punched. What does it look like when it is opened?`, hint: 'Every layer gets a hole. Unfolding makes a mirror copy across the fold.', explain: `The folded paper has ${layers} layers, so each punch makes ${layers} holes: ${right.length} holes in all, mirrored across the fold${twice ? 's' : ''}.` });
    }
    return cg_folding(1);
  }

  // ===================== Verbal (pictures) =====================
  // Relation groups for picture analogies: every pair in a group is linked the same way.
  // Wrong answers come from `wrong` (a hand-picked list that never fits the relation) or, when it is
  // 'targets', from the other pairs' answers (they fit the relation, but for a different picture).
  const GROUPS = {
    eats: ['eats', [['🐇', '🥕'], ['🐒', '🍌'], ['🐶', '🦴'], ['🐭', '🧀'], ['🐼', '🎋'], ['🐿️', '🌰'], ['🐄', '🌾']], ['🧸', '🚗', '👟', '🎈', '📚', '🔑', '⚽', '🎸', '🛏️', '✏️']],
    gives: ['gives us', [['🐄', '🥛'], ['🐔', '🥚'], ['🐝', '🍯'], ['🐑', '🧶']], ['🍎', '🍞', '🥕', '🍌', '🌽', '🧸', '🍇']],
    worn: ['is worn on', [['🦶', '👟'], ['✋', '🧤'], ['🙂', '🧢'], ['👀', '🕶️'], ['👂', '🎧']], 'targets'],
    grows: ['grows into', [['🐛', '🦋'], ['🌱', '🌳'], ['🐣', '🐓'], ['👶', '🧑'], ['🌰', '🌳']], 'targets'],
    used: ['is used with', [['🔑', '🔒'], ['✏️', '📄'], ['⚽', '🥅'], ['🏹', '🎯'], ['🥄', '🥣']], 'targets'],
    needs: ['needs', [['🚗', '⛽'], ['🌱', '💧'], ['📺', '🔌'], ['🔦', '🔋'], ['⛵', '💨']], ['🧸', '🎈', '🍕', '🧦', '🎸', '📚', '🎁']],
    works: ['works with', [['👩‍🍳', '🍳'], ['👨‍🚒', '🚒'], ['👩‍⚕️', '🩺'], ['👨‍🌾', '🚜'], ['👩‍🎨', '🎨'], ['👩‍🚀', '🚀'], ['👮', '🚓']], 'targets'],
    opposite: ['is the opposite of', [['☀️', '🌙'], ['🔥', '🧊'], ['⬆️', '⬇️'], ['➕', '➖'], ['⬅️', '➡️'], ['😀', '😢'], ['🔊', '🔇']], 'targets'],
  };
  const ANALOGY = {
    1: [GROUPS.eats, GROUPS.gives, GROUPS.worn],
    2: [GROUPS.worn, GROUPS.grows, GROUPS.gives],
    3: [GROUPS.used, GROUPS.eats, GROUPS.needs],
    4: [GROUPS.works, GROUPS.grows, GROUPS.needs],
    5: [GROUPS.opposite, GROUPS.works, GROUPS.used],
  };
  function cg_picanalogy(d) {
    const [rel, pairs, pool] = pick(ANALOGY[d]);
    const [[a, b], [c, ans]] = U.sample(pairs, 2);
    const from = [...new Set(pool === 'targets' ? pairs.map((p) => p[1]) : pool)];
    const wrong = U.sample(from.filter((x) => ![a, b, c, ans].includes(x)), 2).concat([c]);
    return EC(`The first two pictures go together. Which picture goes with the third one in the same way?<div class="vis analogy emo"><span class="abox">${a}</span><b>→</b><span class="abox">${b}</span><span class="abox">${c}</span><b>→</b><span class="abox mq">?</span></div>`, ans, shuffle([ans, ...wrong]), { say: 'The first two pictures go together. Which picture goes with the third one in the same way?', hint: 'Say how the first two go together, then use the same words for the third.', explain: `${a} ${rel} ${b}, and ${c} ${rel} ${ans}.` });
  }
  const CATS = {
    fruit: ['🍎', '🍌', '🍇', '🍓', '🍐', '🍒', '🍑', '🍍'],
    vehicles: ['🚗', '🚌', '🚲', '🚂', '🚜', '🛴', '🚕'],
    'things that fly': ['🦅', '✈️', '🚁', '🦋', '🐝', '🦉', '🚀'],
    clothes: ['👕', '👖', '🧦', '🧣', '👗', '🧤', '👟'],
    'sea animals': ['🐠', '🐙', '🦀', '🐬', '🐳', '🦈', '🐡'],
    instruments: ['🎸', '🎹', '🥁', '🎺', '🎻'],
    tools: ['🔨', '🔧', '✂️', '📏', '🪓'],
    'cold things': ['❄️', '🧊', '⛄', '🍦', '🏔️'],
    insects: ['🐞', '🐝', '🦋', '🐜', '🐛'],
    'farm animals': ['🐄', '🐷', '🐑', '🐔', '🐴', '🐐'],
  };
  // Harder levels use groups whose wrong answers look similar (e.g. a car among things that fly).
  const CLASS_LEVEL = {
    1: [['fruit', ['vehicles', 'clothes', 'instruments']], ['vehicles', ['fruit', 'sea animals', 'clothes']]],
    2: [['clothes', ['fruit', 'tools', 'farm animals']], ['sea animals', ['vehicles', 'fruit', 'instruments']], ['instruments', ['tools', 'clothes', 'fruit']]],
    3: [['farm animals', ['sea animals', 'insects']], ['tools', ['instruments', 'clothes']], ['insects', ['farm animals', 'sea animals']]],
    4: [['things that fly', ['vehicles', 'farm animals']], ['cold things', ['fruit', 'clothes']]],
    5: [['things that fly', ['vehicles', 'sea animals', 'farm animals']], ['sea animals', ['farm animals', 'things that fly']], ['cold things', ['clothes', 'sea animals']]],
  };
  function cg_picclass(d) {
    for (let t = 0; t < 50; t++) {
      const [cat, others] = pick(CLASS_LEVEL[d]);
      const pool = CATS[cat];
      const [x, y, z, ans] = U.sample(pool, 4);
      const wrong = U.sample(others.flatMap((o) => CATS[o]).filter((e) => !pool.includes(e)), 3);
      if (wrong.length < 3) continue;
      return EC(`These three pictures go together: <div class="vis analogy emo"><span class="abox">${x}</span><span class="abox">${y}</span><span class="abox">${z}</span></div>Which picture belongs with them?`, ans, shuffle([ans, ...wrong]), { say: 'These three pictures go together. Which picture belongs with them?', hint: 'What kind of things are they?', explain: `They are all ${cat}.` });
    }
    return cg_picclass(1);
  }
  // Sentence completion: a spoken question, picture answers. [level, question, answer, wrong answers]
  const SENT = [
    [1, 'Which one do you use to cut paper?', '✂️', ['🥄', '📏', '🖍️']],
    [1, 'Which one tells you what time it is?', '⏰', ['📚', '🔑', '🎈']],
    [1, 'Which one keeps you dry in the rain?', '☂️', ['🕶️', '🧦', '🎒']],
    [1, 'Which animal says “moo”?', '🐄', ['🐶', '🐷', '🐑']],
    [1, 'Which one do you wear on your feet?', '👟', ['🧢', '🧤', '👓']],
    [1, 'Which animal says “woof”?', '🐶', ['🐱', '🐄', '🐔']],
    [1, 'Which one do you sleep in?', '🛏️', ['🚗', '📺', '🍳']],
    [1, 'Which one do you read?', '📖', ['🍎', '⚽', '🧦']],
    [1, 'Which one can you eat?', '🍌', ['🧱', '👟', '🔑']],
    [1, 'Which one do you wear on your head?', '🧢', ['🧦', '👟', '🧤']],
    [1, 'Which one can fly?', '🐦', ['🐟', '🐢', '🐄']],
    [1, 'Which one lives in the water?', '🐟', ['🐈', '🐄', '🐔']],
    [1, 'Which one is hot?', '🔥', ['🧊', '⛄', '🍦']],
    [1, 'Which one do you kick?', '⚽', ['📚', '🍎', '🛏️']],
    [1, 'Which one do you drink from?', '🥤', ['🍴', '🔨', '👟']],
    [1, 'Which one has wheels?', '🚗', ['🐴', '⛵', '🏠']],
    [1, 'Which one do you play music on?', '🎸', ['🍳', '🧹', '🛏️']],
    [1, 'Which one shines in the sky at night?', '🌙', ['☀️', '🌈', '🌳']],
    [1, 'Which one is a fruit?', '🍓', ['🥕', '🍞', '🧀']],
    [1, 'Which one do you use to write?', '✏️', ['🥄', '🧦', '🔑']],
    [1, 'Which animal hops?', '🐇', ['🐌', '🐟', '🐢']],
    [2, 'Which one would you find in a garden?', '🌻', ['🛏️', '🚿', '📺']],
    [2, 'Which one grows on a tree?', '🍎', ['🥕', '🥚', '🧀']],
    [2, 'Which animal can live both in water and on land?', '🐸', ['🐟', '🐦', '🐴']],
    [2, 'Which one do you use to call a friend?', '📱', ['📖', '🎸', '⚽']],
    [2, 'Which one gives light in the dark?', '🔦', ['🧸', '🧲', '🥁']],
    [2, 'Which one do you use to sweep the floor?', '🧹', ['🍴', '🎨', '📏']],
    [2, 'Which one do you wear when it is cold?', '🧣', ['🩳', '🕶️', '👙']],
    [2, 'Which one is a vegetable?', '🥕', ['🍎', '🍪', '🍩']],
    [2, 'Which animal has a very long neck?', '🦒', ['🐷', '🐢', '🐇']],
    [2, 'Which one do you use to eat soup?', '🥄', ['🔪', '✏️', '🔑']],
    [2, 'Which one lives in a beehive?', '🐝', ['🐦', '🐟', '🐌']],
    [2, 'Which one do firefighters drive?', '🚒', ['🚌', '🚲', '🚜']],
    [2, 'Which one is made of snow?', '⛄', ['🏠', '🧸', '🚗']],
    [2, 'Which animal has black and white stripes?', '🦓', ['🐘', '🐻', '🐑']],
    [2, 'Which one do you wear on your hands?', '🧤', ['🧦', '🧢', '👖']],
    [2, 'Which one comes from a chicken?', '🥚', ['🥛', '🍯', '🧀']],
    [2, 'Which one can you blow up with air?', '🎈', ['🧱', '📚', '🍎']],
    [2, 'Which one do you use to take a picture?', '📷', ['📺', '📻', '⌚']],
    [2, 'Which one is a bird?', '🦉', ['🐿️', '🐢', '🐍']],
    [2, 'Which one tastes sour?', '🍋', ['🍬', '🍰', '🍫']],
    [3, 'Which one is the biggest animal?', '🐋', ['🐘', '🦒', '🐻']],
    [3, 'Which one is a baby animal?', '🐣', ['🐓', '🦅', '🦉']],
    [3, 'Which one helps a doctor listen to your heart?', '🩺', ['🔨', '🎤', '🧲']],
    [3, 'Which one do you use to see things far away?', '🔭', ['🔍', '🕶️', '📷']],
    [3, 'Which one would melt in the sun?', '⛄', ['🧱', '🏀', '🪑']],
    [3, 'Which one helps you find your way?', '🧭', ['🎁', '🧸', '🍕']],
    [3, 'Which one do you use to see how heavy something is?', '⚖️', ['📏', '⏰', '🌡️']],
    [3, 'Which one tells you how hot or cold it is?', '🌡️', ['⚖️', '📏', '⏰']],
    [3, 'Which animal sleeps all winter long?', '🐻', ['🐄', '🐎', '🐓']],
    [3, 'Which one is the smallest?', '🐜', ['🐈', '🐕', '🐎']],
    [3, 'Which one grows under the ground?', '🥕', ['🍎', '🍒', '🍌']],
    [3, 'Which one is NOT alive?', '🧸', ['🐶', '🌳', '🐟']],
    [3, 'Which one makes honey?', '🐝', ['🦋', '🐞', '🐜']],
    [3, 'Which one carries people across the ocean?', '🚢', ['🚗', '🚲', '🚂']],
    [3, 'Which one do you need to bake a cake?', '🥚', ['🧦', '🔑', '🧸']],
    [3, 'Which animal carries its house on its back?', '🐢', ['🐸', '🐍', '🦎']],
    [3, 'Which one would you see at a birthday party?', '🎂', ['🧹', '🛏️', '🔧']],
    [3, 'Which one falls from trees in the fall?', '🍂', ['🌵', '🌽', '🍄']],
    [3, 'Which animal is good at climbing trees?', '🐒', ['🐟', '🐄', '🐧']],
    [3, 'Which one flashes in the sky during a storm?', '⚡', ['🌈', '☁️', '💧']],
    [3, 'Which animal has eight arms?', '🐙', ['🦀', '🐠', '🐬']],
    [4, 'Which one can you NOT eat?', '🧱', ['🍞', '🥕', '🍇']],
    [4, 'Which one is used to build a house?', '🧱', ['🎈', '🧸', '🍩']],
    [4, 'Which one do bees make?', '🍯', ['🥛', '🧀', '🥚']],
    [4, 'Which one would you need at the beach on a sunny day?', '🕶️', ['🧣', '🧤', '🧥']],
    [4, 'Which one has the most legs?', '🕷️', ['🐔', '🐕', '🐞']],
    [4, 'Which one is NOT a fruit?', '🥦', ['🍎', '🍐', '🍑']],
    [4, 'Which one does NOT have wings?', '🐍', ['🐝', '🦅', '🦇']],
    [4, 'Which one would you take on a camping trip?', '⛺', ['🛁', '📺', '🛋️']],
    [4, 'Which one is the fastest?', '🚀', ['🚲', '🐢', '🚗']],
    [4, 'Which one is the heaviest?', '🐘', ['🐁', '🐇', '🐈']],
    [4, 'Which one do you ride down a snowy hill?', '🛷', ['🛹', '🚲', '🛴']],
    [4, 'Which one is a planet?', '🌍', ['⭐', '🌙', '☀️']],
    [4, 'Which one does NOT grow?', '🪑', ['🌱', '🐶', '👶']],
    [4, 'Which animal lays eggs?', '🐔', ['🐄', '🐶', '🐈']],
    [4, 'Which one do you use to measure how long something is?', '📏', ['⚖️', '⏰', '🌡️']],
    [4, 'Which one would you NOT find in a kitchen?', '🚜', ['🍳', '🥄', '🍴']],
    [4, 'Which one keeps a door shut so nobody can open it?', '🔒', ['🎀', '🧸', '🎈']],
    [4, 'Which one makes the loudest sound?', '🥁', ['🧸', '🧦', '🍃']],
    [4, 'Which one keeps you warm in a snowstorm?', '🧥', ['🩳', '👙', '🕶️']],
    [4, 'Which one has roots?', '🌳', ['🐢', '🚗', '🎈']],
    [5, 'Which one is cold AND sweet?', '🍦', ['🧊', '🍰', '⛄']],
    [5, 'Which one flies but is NOT a bird?', '🦋', ['🦅', '🦉', '🐧']],
    [5, 'Which one is an animal that does NOT live in water?', '🐫', ['🐬', '🐙', '🦈']],
    [5, 'Which one would you use to fix a broken chair?', '🔨', ['✂️', '🧹', '🖍️']],
    [5, 'Which one is a fruit that is NOT red?', '🍌', ['🍓', '🍒', '🍎']],
    [5, 'Which one is round AND good to eat?', '🍊', ['⚽', '🍌', '🥖']],
    [5, 'Which one lives in water but is NOT a fish?', '🐬', ['🐟', '🐠', '🐡']],
    [5, 'Which one has wheels but NO engine?', '🚲', ['🚗', '🚌', '🏍️']],
    [5, 'Which one is a bird that can NOT fly?', '🐧', ['🦅', '🦜', '🦉']],
    [5, 'Which one is yellow AND a fruit?', '🍌', ['🌻', '🍓', '🍇']],
    [5, 'Which one is cold but is NOT ice cream?', '⛄', ['🍦', '🔥', '☕']],
    [5, 'Which one has a tail but NO legs?', '🐍', ['🐶', '🐈', '🐒']],
    [5, 'Which one is NOT a vehicle?', '🏠', ['🚗', '🚌', '🚲']],
    [5, 'Which one is hot AND you can drink it?', '☕', ['🔥', '🧃', '🍦']],
    [5, 'Which one has stripes AND is a big cat?', '🐅', ['🦓', '🐈', '🦁']],
    [5, 'Which one can swim AND fly?', '🦆', ['🐟', '🐬', '🦅']],
    [5, 'Which one grows on a tree but is NOT a fruit?', '🍃', ['🍎', '🍐', '🍒']],
    [5, 'Which one has wings but is NOT an animal?', '✈️', ['🦅', '🦋', '🐝']],
    [5, 'Which one is green AND a vegetable?', '🥦', ['🥕', '🍏', '🌽']],
    [5, 'Which animal lives in the desert?', '🐪', ['🐧', '🐠', '🐄']],
    [5, 'Which one is NOT something you wear?', '☂️', ['👕', '👖', '🧢']],
  ];
  function cg_sentence(d) {
    const [, q, ans, wrong] = pick(SENT.filter((s) => s[0] === d));
    return EC(`🔊 <b>${q}</b>`, ans, shuffle([ans, ...wrong]), { say: q, hint: 'Listen to the question again with 🔊.', explain: `${ans} — ${q.replace(/\?$/, '')}.` });
  }

  const T = (name, icon, battery, gen, desc) => ({ name, icon, std: 'CogAT style · ' + battery, gen, track: 'prep', cogat: true, battery, desc });
  Object.assign(MQ.TOPICS, {
    cg_picanalogy: T('Picture Analogies', '🔗', 'Verbal', cg_picanalogy, 'This goes with that, so what goes with this? Find the pair that matches the first pair.'),
    cg_sentence: T('Sentence Completion', '👂', 'Verbal', cg_sentence, 'Listen to a question and pick the picture that answers it.'),
    cg_picclass: T('Picture Classification', '🗂️', 'Verbal', cg_picclass, 'Three pictures belong together. Find the one that belongs with them.'),
    cg_numanalogy: T('Number Analogies', '🔢', 'Quantitative', cg_numanalogy, 'Find the number rule in the first pairs and use it on the last one.'),
    cg_numpuzzle: T('Number Puzzles', '🧮', 'Quantitative', cg_numpuzzle, 'Each animal stands for a number. Find the number that makes it true.'),
    cg_numseries: T('Number Series', '🧿', 'Quantitative', cg_numseries, 'Find the pattern in a row of numbers and pick what comes next.'),
    cg_matrix: T('Figure Matrices', '🔲', 'Nonverbal', cg_matrix, 'Find how the shapes change across a row and pick the missing one.'),
    cg_classify: T('Figure Classification', '🔷', 'Nonverbal', cg_classify, 'Three shapes are alike in some way. Find another one that is alike too.'),
    cg_folding: T('Paper Folding', '📄', 'Nonverbal', cg_folding, 'Fold paper, punch holes, then imagine where the holes are when it is opened.'),
  });
  MQ.COGAT_BATTERIES = [
    { id: 'Verbal', icon: '💬', topics: ['cg_picanalogy', 'cg_sentence', 'cg_picclass'] },
    { id: 'Quantitative', icon: '🔢', topics: ['cg_numanalogy', 'cg_numpuzzle', 'cg_numseries'] },
    { id: 'Nonverbal', icon: '🔷', topics: ['cg_matrix', 'cg_classify', 'cg_folding'] },
  ];
})();
