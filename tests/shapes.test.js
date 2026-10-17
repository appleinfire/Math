// Run: node tests/shapes.test.js
// Checks Shape Puzzles: the jigsaw cut covers each shape with no crumbs, the pictures are valid SVG inside the board,
// the problems (both grades) and how they are recorded, the album, its badges, and merging it from two devices.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'store', 'shapes']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ, SH = MQ.shapes;

// Well-formed SVG: tags close in order, every url(#id) has its definition, no NaN.
function checkSvg(inner, what) {
  const s = `<svg viewBox="0 0 120 120">${inner}</svg>`, stack = [];
  for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    if (m[3]) continue;
    if (m[1]) assert.strictEqual(stack.pop(), m[2], `${what}: </${m[2]}> closes the wrong tag`);
    else stack.push(m[2]);
  }
  assert.deepStrictEqual(stack, [], what + ': unclosed tags');
  assert.ok(!/NaN|undefined/.test(s), what + ': NaN or undefined');
  const ids = new Set([...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of s.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(m[1]), `${what}: url(#${m[1]}) has no definition`);
}
const inBoard = (pts, what) => pts.forEach(([x, y]) => assert.ok(x >= 0 && x <= 120 && y >= 0 && y <= 120, `${what}: point ${x},${y} is off the board`));

// ---- shapes and the cut
assert.strictEqual(SH.ITEMS.length, 16, '6 shapes, 5 pictures, 5 dot-to-dots');
assert.strictEqual(new Set(SH.ITEMS).size, SH.ITEMS.length, 'album keys are unique');
for (const sh of SH.SHAPES) {
  inBoard(sh.pts, sh.id);
  checkSvg(SH.shapeArt(sh), sh.id);
  assert.ok(SH.inside(sh.pts, sh.face[0], sh.face[1]), sh.id + ': the face is inside the shape');
  for (const n of Object.keys(SH.GRID).map(Number)) {
    for (let run = 0; run < 20; run++) { // knobs are random: cut it many times
      const { cols, rows, pieces } = SH.cut(n, sh);
      assert.ok(pieces.length >= Math.min(4, n) && pieces.length <= n, `${sh.id} ${n}: ${pieces.length} pieces`);
      for (const p of pieces) {
        assert.ok(p.cover >= SH.MIN_COVER, `${sh.id} ${n}: a crumb of a piece`);
        assert.ok(/^M[\d. LCZ-]+Z$/.test(p.d) && !/NaN/.test(p.d), `${sh.id} ${n}: bad piece path`);
        assert.ok(p.bb[2] > 0 && p.bb[3] > 0 && p.bb[0] >= 0 && p.bb[1] >= 0 && p.bb[0] + p.bb[2] <= 120.01 && p.bb[1] + p.bb[3] <= 120.01, `${sh.id} ${n}: box off the board`);
      }
      // All of the shape is in the pieces: a crumb in a cell that is not a piece goes with a neighbouring piece.
      const W = 120 / cols, H = 120 / rows, have = new Set(pieces.map((p) => p.r * cols + p.c));
      const held = new Set([...have, ...pieces.flatMap((p) => (p.crumbs || []).map(([r, c]) => r * cols + c))]);
      for (const p of pieces) for (const [r, c] of p.crumbs || []) assert.ok(Math.abs(p.r - r) + Math.abs(p.c - c) === 1 && !have.has(r * cols + c), `${sh.id} ${n}: a crumb far from its piece`);
      let lost = 0;
      for (let x = 0.5; x < 120; x += 1) for (let y = 0.5; y < 120; y += 1) if (SH.inside(sh.pts, x, y) && !held.has(Math.floor(y / H) * cols + Math.floor(x / W))) lost++;
      assert.strictEqual(lost, 0, `${sh.id} ${n}: part of the shape is in no piece`);
      // A knob on the border between a piece and an empty cell points out of the piece (no bites taken out of it).
      for (const p of pieces) {
        const below = p.r + 1 < rows && !have.has((p.r + 1) * cols + p.c);
        if (below) { const ys = [...p.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => +m[2]); assert.ok(Math.max(...ys) > p.y0 + p.H + 0.1, `${sh.id} ${n}: the knob below piece ${p.i} points in`); }
      }
    }
  }
}
// a circle in 12 pieces keeps all 12; a triangle drops its two empty top corners when cut in 6
assert.strictEqual(SH.cut(12, SH.SHAPES[0]).pieces.length, 12);
assert.strictEqual(SH.cut(6, SH.SHAPES.find((s) => s.id === 'triangle')).pieces.length, 4);

// ---- pictures made of shapes
const KINDS = ['square', 'rectangle', 'triangle', 'circle', 'star', 'trapezoid'];
for (const f of SH.FIGS) {
  assert.ok(f.parts.length >= 5 && f.parts.length <= 6, f.id + ': 5–6 shapes to place');
  checkSvg(SH.figArt(f), f.id);
  for (const pt of f.parts) {
    assert.ok(KINDS.includes(pt.kind), `${f.id}: unknown kind ${pt.kind}`);
    const [x, y, w, h] = SH.partBB(pt);
    inBoard([[x, y], [x + w, y + h]], f.id + ' ' + pt.kind);
    assert.ok(Math.min(w, h) >= 8, `${f.id}: a ${pt.kind} too small to drag (${w}×${h})`);
    if (pt.kind === 'square') assert.strictEqual(w, h, f.id + ': a square has equal sides');
  }
  assert.match(SH.shapeCount(f), /^It has \d+ \w+(, \d+ \w+)*( and \d+ \w+)?\.$/);
}
assert.strictEqual(SH.shapeCount(SH.FIGS.find((f) => f.id === 'house')), 'It has 2 circles, 1 square, 1 triangle and 1 rectangle.');

// ---- dot to dot
for (const d of SH.DOTS) {
  assert.ok(d.pts.length >= 5 && d.pts.length <= 10, d.id + ': 5 to 10 dots (counting to 10)');
  inBoard(d.pts, d.id);
  checkSvg(SH.dotArt(d), d.id);
  for (let i = 0; i < d.pts.length; i++) for (let j = i + 1; j < d.pts.length; j++)
    assert.ok(Math.hypot(d.pts[i][0] - d.pts[j][0], d.pts[i][1] - d.pts[j][1]) >= 12, `${d.id}: dots ${i + 1} and ${j + 1} are too close to tell apart`);
}

// ---- problems
for (const grade of ['k', 'g2']) {
  let prev = null;
  const types = new Set();
  for (let i = 0; i < 20000; i++) {
    const p = SH.problem(grade, prev);
    types.add(p.t);
    assert.ok(MQ.TOPICS[p.topic], `${grade}: unknown topic ${p.topic}`);
    assert.strictEqual(MQ.TOPICS[p.topic].track, grade, `${grade}: topic ${p.topic} belongs to another grade`);
    assert.ok(p.d >= 1 && p.d <= 5);
    assert.strictEqual(p.opts.length, 3, 'three answers');
    assert.strictEqual(new Set(p.opts).size, 3, 'three different answers');
    assert.ok(p.opts.includes(p.answer), 'the answer is one of them');
    assert.deepStrictEqual(p.opts, p.opts.slice().sort((a, b) => a - b), 'answers in order');
    const top = grade === 'k' ? 10 : 20;
    assert.ok(p.opts.every((v) => Number.isInteger(v) && v >= 0 && v <= top), `${grade}: answers ${p.opts}`);
    if (p.t === 'add') assert.strictEqual(p.a + p.b, p.answer);
    if (p.t === 'sub') assert.ok(p.a - p.b === p.answer && p.answer >= 0);
    if (p.t !== 'count') assert.strictEqual(p.text, `${p.eq} = ?`);
    if (grade === 'g2' && p.t === 'add') assert.ok(p.answer > 10, 'facts to 20 cross ten');
    const cells = SH.cells(p, grade), dots = cells.filter((c) => c).length;
    assert.strictEqual(cells.length, top, 'one ten-frame per ten');
    assert.strictEqual(dots, p.t === 'count' ? p.n : p.a + (p.t === 'add' ? p.b : 0), 'the ten-frame shows the problem');
    assert.ok(p.say && !/undefined|NaN/.test(p.say + p.text));
    prev = p;
  }
  assert.deepStrictEqual([...types].sort(), grade === 'k' ? ['add', 'count', 'sub'] : ['add', 'sub']);
}

// ---- recording an answer: counts in the day's totals and the topic; a miss comes back as that skill
MQ.state = { stats: { attempts: 0, correct: 0, topics: {} }, days: {}, months: {}, topicDays: {}, mistakes: [], review: {} };
const k1 = SH.problem('k');
MQ.store.record(k1, false, k1.answer + 1);
const today = MQ.U.dateKey();
assert.deepStrictEqual(MQ.state.days[today], { a: 1, c: 0 });
assert.ok(MQ.state.review[MQ.store.rkey(k1.topic, k1.d)], 'the missed skill is in the Fix-it Lab');
assert.strictEqual(MQ.state.mistakes[0].text, k1.text);
const again = MQ.makeProblem(k1.topic, k1.d); // what the Fix-it Lab will ask
assert.ok(again && again.answer !== undefined);

// ---- the album
const st = { puzzles: undefined };
assert.strictEqual(SH.count(st), 0);
SH.ensure(st);
assert.deepStrictEqual(st.puzzles, { n: 6, done: {} });
assert.strictEqual(SH.finish(st, 'shape:star'), true, 'first time: new in the album');
assert.strictEqual(SH.finish(st, 'shape:star'), false, 'second time: not new');
assert.strictEqual(st.puzzles.done['shape:star'], 2);
st.puzzles.done['shape:old-one'] = 1; // a puzzle removed in a later version does not count
assert.strictEqual(SH.count(st), 1);
for (const d of SH.DOTS.slice(0, 4)) SH.finish(st, 'dots:' + d.id);
for (let i = 0; i < 30; i++) assert.strictEqual(SH.nextDots(st, '').id, SH.DOTS[4].id, 'the dot-to-dot not found yet comes next');
for (let i = 0; i < 30; i++) assert.notStrictEqual(SH.nextDots(st, SH.DOTS[4].id).id, SH.DOTS[4].id, 'not the same one twice in a row');
assert.deepStrictEqual(SH.find('build:rocket').item.id, 'rocket');
assert.strictEqual(SH.find('build:nope').item, null);
assert.strictEqual(SH.find('nope:x'), null);

// ---- badges
const badge = (id) => MQ.BADGES.find((b) => b.id === id);
assert.ok(badge('puzzle1') && badge('puzzleall'));
assert.strictEqual(badge('puzzle1').test(st), true);
assert.strictEqual(badge('puzzleall').test(st), false);
for (const k of SH.ITEMS) SH.finish(st, k);
assert.strictEqual(badge('puzzleall').test(st), true);
assert.strictEqual(badge('puzzle1').test({}), false, 'an old profile without puzzles');

// ---- two devices: every puzzle finished on either one stays in the album
const base = () => ({ v: 1, id: 'kid', grade: 'k', name: 'Leo', crystals: 0, xp: 0, rev: 0, eggsHatched: 0, levels: {}, creatures: {}, badges: {}, days: {}, lastPlayed: '',
  stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0 }, daily: { last: '', streak: 0, best: 0 } });
const a = Object.assign(base(), { rev: 100, puzzles: { n: 9, done: { 'shape:star': 2, 'dots:fish': 1 } } });
const b = Object.assign(base(), { rev: 200, puzzles: { n: 4, done: { 'shape:star': 1, 'build:house': 3 } } });
const m = MQ.store.mergeProfiles(a, b);
assert.deepStrictEqual(m.puzzles.done, { 'shape:star': 2, 'dots:fish': 1, 'build:house': 3 });
assert.strictEqual(m.puzzles.n, 4, 'the piece count comes from the most recent copy');
const m2 = MQ.store.mergeProfiles(base(), Object.assign(base(), { rev: 5 }));
assert.deepStrictEqual(m2.puzzles.done, {}, 'profiles from before Shape Puzzles merge fine');

console.log('shapes ok:', SH.SHAPES.length, 'shapes cut 4 ways ×20,', SH.FIGS.length, 'pictures,', SH.DOTS.length, 'dot-to-dots, 40,000 problems');
