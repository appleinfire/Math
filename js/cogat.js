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
    else if (d === 3) { ans = rnd(2, 7); text = `${A} + ${A} = ${2 * ans}`; say = `Two of the same animal make ${2 * ans}. What number is one animal?`; explain = `${ans} + ${ans} = ${2 * ans}`; }
    else if (d === 4) { const b = rnd(6, 12); ans = rnd(1, b - 2); text = `${B} = ${b}<br>${A} + ${b - ans} = ${B}`; say = `The second animal is ${b}. The first animal plus ${b - ans} equals the second animal. What number is the first animal?`; explain = `${A} + ${b - ans} = ${b}, so ${A} = ${ans}`; }
    else { ans = rnd(2, 6); const y = rnd(1, 5); text = `${A} + ${A} + ${y} = ${2 * ans + y}`; say = `Two of the same animal plus ${y} make ${2 * ans + y}. What number is one animal?`; explain = `${2 * ans + y} − ${y} = ${2 * ans}, half of that is ${ans}`; }
    const opts = U.numChoices(ans, [ans + 1, ans - 1, ans + 2, ans * 2], 4).sort((a, b) => a - b);
    return C(`<div class="emojieq">${text}</div>What number is ${A}?`, ans, opts, { say, explain, hint: 'Make both sides equal.' });
  }
  function cg_numseries(d) {
    let seq;
    for (let t = 0; t < 100; t++) {
      if (d === 1) { const s = rnd(1, 5); seq = chance(0.7) ? [s, s + 1, s + 2, s + 3, s + 4] : [s + 3, s + 2, s + 1, s]; }
      else if (d === 2) { if (chance(0.5)) { const s = rnd(6, 9); seq = [s, s - 1, s - 2, s - 3, s - 4]; } else { const s = rnd(1, 2); seq = [s, s + 2, s + 4, s + 6, s + 8]; } }
      else if (d === 3) { const a = rnd(1, 4), b = rnd(a + 2, 8); seq = chance(0.5) ? [a, b, a, b, a, b] : [a, a + 1, a + 2, a, a + 1, a + 2]; }
      else if (d === 4) {
        const s = rnd(1, 3);
        seq = pick([[s, s + 1, s + 3, s + 6], [1, 2, 4, 8], [9, 8, 6, 3], [s, s + 2, s + 3, s + 5, s + 6], [s + 6, s + 4, s + 3, s + 1, s]]);
      }
      else { const a = rnd(1, 3), b = rnd(5, 6); seq = [a, b, a + 1, b + 1, a + 2, b + 2]; }
      if (Math.max(...seq) <= 9 && Math.min(...seq) >= 1) break;
    }
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
  function cg_classify(d) {
    for (let t = 0; t < 100; t++) {
      // The rule the three pictures share, and the attribute each picture is free to vary.
      const rule = { 1: pick(['shape']), 2: pick(['color', 'shape']), 3: pick(['count', 'color']), 4: pick(['dot', 'small', 'count']), 5: 'two' }[d];
      let fits, three, correct, wrongs, says;
      if (rule === 'shape') { const s = pick(SHAPES); fits = (f) => f.shape === s; three = [0, 1, 2].map(() => randFig({ shape: s, big: chance(0.7) })); correct = randFig({ shape: s }); wrongs = [0, 1, 2].map(() => randFig({ shape: pick(SHAPES.filter((x) => x !== s)), color: pick([three[0].color, pick(COLORS)]) })); says = `they are all ${s}s`; }
      else if (rule === 'color') { const c = pick(COLORS); fits = (f) => f.color === c; three = [0, 1, 2].map(() => randFig({ color: c })); correct = randFig({ color: c }); wrongs = [0, 1, 2].map(() => randFig({ color: pick(COLORS.filter((x) => x !== c)), shape: pick([three[0].shape, three[1].shape]) })); says = `they are all ${c}`; }
      else if (rule === 'count') { const n = rnd(2, 4); fits = (f) => f.count === n; three = [0, 1, 2].map(() => randFig({ count: n })); correct = randFig({ count: n }); wrongs = [0, 1, 2].map(() => randFig({ count: pick([1, 2, 3, 4].filter((x) => x !== n)), shape: three[0].shape })); says = `they all have ${n} shapes`; }
      else if (rule === 'dot') { fits = (f) => f.dot; three = [0, 1, 2].map(() => randFig({ dot: true })); correct = randFig({ dot: true }); wrongs = [0, 1, 2].map(() => randFig({ dot: false, shape: three[0].shape, color: three[1].color })); says = 'they all have a dot in the middle'; }
      else if (rule === 'small') { fits = (f) => f.big === false; three = [0, 1, 2].map(() => randFig({ big: false })); correct = randFig({ big: false }); wrongs = [0, 1, 2].map(() => randFig({ big: true, shape: three[0].shape })); says = 'they are all small'; }
      else { const s = pick(SHAPES), c = pick(COLORS); fits = (f) => f.shape === s && f.color === c; three = [0, 1, 2].map((i) => randFig({ shape: s, color: c, big: i !== 1, count: i === 2 ? 2 : 1 })); correct = randFig({ shape: s, color: c, big: chance(0.5), count: pick([1, 2, 3]) }); wrongs = [randFig({ shape: s, color: pick(COLORS.filter((x) => x !== c)) }), randFig({ shape: pick(SHAPES.filter((x) => x !== s)), color: c }), randFig({ shape: pick(SHAPES.filter((x) => x !== s)), color: c, count: 2 })]; says = `they are all ${c} ${s}s`; }
      const allKeys = [...three, correct, ...wrongs].map(key);
      if (new Set(allKeys).size !== 7 || !three.every(fits) || !fits(correct) || wrongs.some(fits)) continue;
      return pics(`These three pictures are alike in some way:${V.figRow(three)}Which picture goes with them?`, V.fig(correct), wrongs.map((f) => V.fig(f)), { say: 'These three pictures are alike in some way. Which picture goes with them?', hint: 'Look at shape, color, size, how many, and what is inside.', explain: `They belong together because ${says}.` });
    }
    return cg_classify(1);
  }
  function cg_folding(d) {
    for (let t = 0; t < 100; t++) {
      const fold = d <= 3 ? pick(['v', 'h']) : d === 4 ? pick(['q', 'q', 'v', 'h']) : 'q';
      const nHoles = d === 3 || d === 5 || (d === 4 && fold !== 'q') ? 2 : 1;
      const cellsOk = (r, c) => (fold === 'v' ? c >= 2 : fold === 'h' ? r >= 2 : r >= 2 && c >= 2);
      const open = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (cellsOk(r, c)) open.push([r, c]);
      const holes = U.sample(open, nHoles);
      const mirrorV = ([r, c]) => [r, 3 - c], mirrorH = ([r, c]) => [3 - r, c];
      const unfold = (hs, how) => { let out = hs.slice(); if (how === 'v' || how === 'q') out = out.concat(out.map(mirrorV)); if (how === 'h' || how === 'q') out = out.concat(out.map(mirrorH)); return uniqueBy(out, (x) => x.join()); };
      const right = unfold(holes, fold);
      const k = (hs) => hs.map((x) => x.join()).sort().join(';');
      const wrongSets = uniqueBy([
        holes,
        unfold(holes, fold === 'v' ? 'h' : 'v'),
        fold === 'q' ? unfold(holes, 'v') : unfold(holes, 'q'),
        right.map(([r, c]) => [r, (c + 1) % 4]),
        right.map(([r, c]) => [(r + 1) % 4, c]),
      ].filter((hs) => k(hs) !== k(right)), k);
      if (wrongSets.length < 3) continue;
      const how = fold === 'v' ? 'folded in half from left to right' : fold === 'h' ? 'folded in half from top to bottom' : 'folded in half two times';
      return pics(`A sheet of paper is ${how}, then a hole is punched through it. What does the paper look like when it is opened?${V.foldSteps(fold, holes)}`, V.sheet(right, { size: 72 }), shuffle(wrongSets).slice(0, 3).map((hs) => V.sheet(hs, { size: 72 })), { say: `A sheet of paper is ${how}. Then a hole is punched. What does it look like when it is opened?`, hint: 'Every layer gets a hole. Unfolding makes a mirror copy across the fold.', explain: `The folded paper has ${fold === 'q' ? 4 : 2} layers, so each punch makes ${fold === 'q' ? 4 : 2} holes: ${right.length} holes in all, mirrored across the fold${fold === 'q' ? 's' : ''}.` });
    }
    return cg_folding(1);
  }

  // ===================== Verbal (pictures) =====================
  // Relation groups for picture analogies: every pair in a group is linked the same way.
  const ANALOGY = {
    1: [['eats', [['🐇', '🥕'], ['🐒', '🍌'], ['🐶', '🦴'], ['🐭', '🧀'], ['🐼', '🎋']]], ['gives us', [['🐄', '🥛'], ['🐔', '🥚'], ['🐝', '🍯'], ['🐑', '🧶']]]],
    2: [['grows into', [['🐛', '🦋'], ['🥚', '🐣'], ['🌱', '🌳']]], ['is worn on', [['🦶', '👟'], ['✋', '🧤'], ['🙂', '🧢']]]],
    3: [['is used with', [['🔑', '🔒'], ['✏️', '📄'], ['⚽', '🥅'], ['🏹', '🎯']]], ['eats', [['🐇', '🥕'], ['🐒', '🍌'], ['🐶', '🦴'], ['🐭', '🧀']]]],
    4: [['works with', [['👩‍🍳', '🍳'], ['👨‍🚒', '🚒'], ['👩‍⚕️', '🩺'], ['👨‍🌾', '🚜'], ['👩‍🎨', '🎨']]], ['grows into', [['🐛', '🦋'], ['🥚', '🐣'], ['🌱', '🌳']]]],
    5: [['is the opposite of', [['☀️', '🌙'], ['🔥', '🧊'], ['⬆️', '⬇️'], ['➕', '➖']]], ['works with', [['👩‍🍳', '🍳'], ['👨‍🚒', '🚒'], ['👩‍⚕️', '🩺'], ['👨‍🌾', '🚜']]]],
  };
  const ALL_ANALOGY_ITEMS = [...new Set(Object.values(ANALOGY).flatMap((g) => g.flatMap(([, ps]) => ps.flat())))];
  function cg_picanalogy(d) {
    const [rel, pairs] = pick(ANALOGY[d]);
    const [[a, b], [c, ans]] = U.sample(pairs, 2);
    const wrong = U.sample(ALL_ANALOGY_ITEMS.filter((x) => ![a, b, c, ans].includes(x) && !pairs.some((p) => p[1] === x)), 2).concat([c]);
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
    [2, 'Which one would you find in a garden?', '🌻', ['🛏️', '🚿', '📺']],
    [2, 'Which one grows on a tree?', '🍎', ['🥕', '🥚', '🧀']],
    [2, 'Which animal can live both in water and on land?', '🐸', ['🐟', '🐦', '🐴']],
    [2, 'Which one do you use to call a friend?', '📱', ['📖', '🎸', '⚽']],
    [2, 'Which one gives light in the dark?', '🔦', ['🧸', '🧲', '🥁']],
    [3, 'Which one is the biggest animal?', '🐋', ['🐘', '🦒', '🐻']],
    [3, 'Which one is a baby animal?', '🐣', ['🐓', '🦅', '🦉']],
    [3, 'Which one helps a doctor listen to your heart?', '🩺', ['🔨', '🎤', '🧲']],
    [3, 'Which one do you use to see things far away?', '🔭', ['🔍', '🕶️', '📷']],
    [3, 'Which one would melt in the sun?', '⛄', ['🪨', '🧱', '🏀']],
    [4, 'Which one can you NOT eat?', '🧱', ['🍞', '🥕', '🍇']],
    [4, 'Which one is used to build a house?', '🧱', ['🎈', '🧸', '🍩']],
    [4, 'Which one do bees make?', '🍯', ['🥛', '🧀', '🥚']],
    [4, 'Which one would you need at the beach on a sunny day?', '🕶️', ['🧣', '🧤', '☂️']],
    [4, 'Which one has the most legs?', '🕷️', ['🐔', '🐕', '🐞']],
    [5, 'Which one is cold AND sweet?', '🍦', ['🧊', '🍰', '⛄']],
    [5, 'Which one flies but is NOT a bird?', '🦋', ['🦅', '🦉', '🐧']],
    [5, 'Which one is an animal that does NOT live in water?', '🐫', ['🐬', '🐙', '🦈']],
    [5, 'Which one would you use to fix a broken chair?', '🔨', ['✂️', '🧹', '🖍️']],
    [5, 'Which one is a fruit that is NOT red?', '🍌', ['🍓', '🍒', '🍎']],
  ];
  function cg_sentence(d) {
    const [, q, ans, wrong] = pick(SENT.filter((s) => s[0] === d));
    return EC(`🔊 <b>${q}</b>`, ans, shuffle([ans, ...wrong]), { say: q, hint: 'Listen to the question again with 🔊.', explain: `${ans} — ${q.replace(/\?$/, '')}.` });
  }

  const T = (name, icon, battery, gen) => ({ name, icon, std: 'CogAT style · ' + battery, gen, track: 'prep', cogat: true, battery });
  Object.assign(MQ.TOPICS, {
    cg_picanalogy: T('Picture Analogies', '🔗', 'Verbal', cg_picanalogy),
    cg_sentence: T('Sentence Completion', '👂', 'Verbal', cg_sentence),
    cg_picclass: T('Picture Classification', '🗂️', 'Verbal', cg_picclass),
    cg_numanalogy: T('Number Analogies', '🔢', 'Quantitative', cg_numanalogy),
    cg_numpuzzle: T('Number Puzzles', '🧮', 'Quantitative', cg_numpuzzle),
    cg_numseries: T('Number Series', '🧿', 'Quantitative', cg_numseries),
    cg_matrix: T('Figure Matrices', '🔲', 'Nonverbal', cg_matrix),
    cg_classify: T('Figure Classification', '🔷', 'Nonverbal', cg_classify),
    cg_folding: T('Paper Folding', '📄', 'Nonverbal', cg_folding),
  });
  MQ.COGAT_BATTERIES = [
    { id: 'Verbal', icon: '💬', topics: ['cg_picanalogy', 'cg_sentence', 'cg_picclass'] },
    { id: 'Quantitative', icon: '🔢', topics: ['cg_numanalogy', 'cg_numpuzzle', 'cg_numseries'] },
    { id: 'Nonverbal', icon: '🔷', topics: ['cg_matrix', 'cg_classify', 'cg_folding'] },
  ];
})();
