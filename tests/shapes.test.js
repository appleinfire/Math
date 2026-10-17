// Run: node tests/shapes.test.js
// Checks Puzzle Time: the jigsaw cut covers each shape with no crumbs, the pictures are valid SVG inside the board,
// the problems (both grades) and how they are recorded, the album, its badges, and merging it from two devices.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k', 'creature-art', 'store', 'shapes', 'puzzle-art']) require(path.join(__dirname, '..', 'js', f + '.js'));
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
assert.strictEqual(SH.ITEMS.length, SH.PICS.length + 32, 'every picture, 12 shapes, 10 pictures made of shapes, 10 dot-to-dots');
assert.ok(SH.FREE.length >= 95, `about 100 free puzzles (${SH.FREE.length})`);
assert.strictEqual(new Set(SH.ITEMS).size, SH.ITEMS.length, 'album keys are unique');
for (const sh of SH.SHAPES) {
  inBoard(sh.pts, sh.id);
  checkSvg(SH.shapeArt(sh), sh.id);
  assert.ok(SH.inside(sh.pts, sh.face[0], sh.face[1]), sh.id + ': the face is inside the shape');
  for (const n of Object.keys(SH.GRID).map(Number)) {
    for (let run = 0; run < 20; run++) { // knobs are random: cut it many times
      const { cols, rows, pieces } = SH.cut(n, sh);
      assert.ok(pieces.length >= Math.min(3, n) && pieces.length <= n, `${sh.id} ${n}: ${pieces.length} pieces`);
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
const sigs = new Set();
for (const f of SH.FIGS) {
  assert.ok(f.parts.length >= 5 && f.parts.length <= 7, f.id + ': 5–7 shapes to place');
  checkSvg(SH.figArt(f), f.id);
  for (const pt of f.parts) {
    assert.ok(KINDS.includes(pt.kind), `${f.id}: unknown kind ${pt.kind}`);
    const [x, y, w, h] = SH.partBB(pt);
    inBoard([[x, y], [x + w, y + h]], f.id + ' ' + pt.kind);
    assert.ok(Math.min(w, h) >= 8, `${f.id}: a ${pt.kind} too small to drag (${w}×${h})`);
    if (pt.kind === 'square') assert.strictEqual(w, h, f.id + ': a square has equal sides');
    if (pt.kind === 'rectangle') assert.notStrictEqual(w, h, f.id + ': a rectangle that is a square should be called a square');
  }
  // Twins (same shape and size) fit each other's outlines, so they must look the same too.
  for (const a of f.parts) for (const b of f.parts) if (a !== b && SH.sig(a) === SH.sig(b)) assert.strictEqual(a.col, b.col, `${f.id}: twin ${a.kind}s should be the same color`);
  assert.match(SH.shapeCount(f), /^It has \d+ \w+(, \d+ \w+)*( and \d+ \w+)?\.$/);
}
assert.strictEqual(SH.shapeCount(SH.FIGS.find((f) => f.id === 'house')), 'It has 2 circles, 1 square, 1 triangle and 1 rectangle.');
const car = SH.FIGS.find((f) => f.id === 'car').parts;
assert.strictEqual(SH.sig(car[3]), SH.sig(car[4]), 'the two wheels of the car are twins');
assert.notStrictEqual(SH.sig(car[1]), SH.sig(car[2]), 'the window and the body are not');
const rocket = SH.FIGS.find((f) => f.id === 'rocket').parts;
assert.notStrictEqual(SH.sig(rocket[4]), SH.sig(rocket[5]), 'mirrored fins are not twins: each has its own side');
assert.strictEqual(new Set(SH.SHAPES.map((s) => s.id)).size, 12);
assert.strictEqual(new Set(SH.FIGS.map((s) => s.id)).size, 10);
assert.strictEqual(new Set(SH.DOTS.map((s) => s.id)).size, 10);

// ---- picture puzzles: Hatchery creatures in scenes, emoji pictures, Legendary pictures, in packs
const creatures = SH.PICS.filter((p) => !p.kind), emoji = SH.PICS.filter((p) => p.kind === 'emoji'), legends = SH.PICS.filter((p) => p.kind === 'legend');
assert.strictEqual(creatures.length, 16);
assert.strictEqual(new Set(SH.PICS.map((p) => p.id)).size, SH.PICS.length, 'every picture has its own id');
for (const p of creatures) {
  assert.ok(MQ.hasArt(p.id) && SH.SCENES[p.scene] && MQ.EGG_CREATURES.some((c) => c.id === p.id), p.id + ': a drawn Hatchery creature on a scene');
  assert.ok(SH.picName(p) && SH.picName(p) !== p.id, p.id + ': has a name');
  assert.ok(SH.picArt(p).includes('<svg x="8" y="10" width="104" height="104"'), p.id + ': the creature sits on the scene');
}
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
const oneEmoji = (e) => [...seg.segment(e)].length === 1 && /\p{Extended_Pictographic}/u.test(e);
for (const p of emoji) {
  assert.ok(SH.SCENES[p.bg], p.id + ': unknown scene ' + p.bg);
  assert.ok(oneEmoji(p.hero), `${p.id}: the hero ${p.hero} is one emoji`);
  assert.ok(p.extras.length >= 3 && p.extras.length <= 6 && p.extras.every(oneEmoji), `${p.id}: 3–6 small emoji (${p.extras.join(' ')})`);
  assert.ok(['c', 'l', 'r'].includes(p.lay) && p.name && p.name.length <= 24, p.id + ': layout and a short name');
}
for (const P of SH.PACKS) {
  const pics = SH.packPics(P.id), names = pics.map((p) => p.name || p.id);
  assert.ok(pics.length >= 5, P.id + ': has pictures');
  assert.strictEqual(new Set(names).size, names.length, P.id + ': every picture in a pack has its own name');
  if (P.legend) assert.ok(pics.every((p) => p.kind === 'legend') && pics.length === 5 && P.price >= 100, P.id + ': 5 Legendary pictures, 100 💎 or more');
  else if (P.price) assert.ok(P.price >= 30 && P.price <= 50 && pics.length >= (P.season ? 12 : 20), `${P.id}: a pack of 20 (12 seasonal) for 30–50 💎`);
}
assert.strictEqual(legends.length, 10);
for (const p of legends) assert.ok(MQ.hasArt(p.legend.art), p.id + ': a drawn creature');
// every picture draws as valid SVG (each kind, each scene)
for (const p of SH.PICS) checkSvg(SH.picArt(p), p.id);
for (const p of emoji) checkSvg(SH.heroArt(p), p.id + ' hero');
// a picture is cut into every cell of the board
for (const n of Object.keys(SH.GRID).map(Number)) assert.strictEqual(SH.cut(n, null).pieces.length, n);
assert.deepStrictEqual([SH.starsFor(4), SH.starsFor(6), SH.starsFor(9), SH.starsFor(12), SH.starsFor(16), SH.starsFor(20)], [1, 1, 2, 2, 3, 3]);

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

// ---- the album, stars, golden puzzles
const st = { id: 'kid', crystals: 0, puzzles: undefined };
assert.strictEqual(SH.count(st), 0);
SH.ensure(st);
assert.deepStrictEqual(st.puzzles, { n: 6, done: {}, stars: {}, packs: {}, gold: {}, daily: { last: '', streak: 0, best: 0 } });
assert.deepStrictEqual(SH.finish(st, 'shape:star', { n: 6 }), { fresh: true, stars: 1, more: true, gold: false }, 'first time: new, one star');
assert.deepStrictEqual(SH.finish(st, 'shape:star', { n: 16 }), { fresh: false, stars: 3, more: true, gold: false }, '16 pieces: three stars');
assert.deepStrictEqual(SH.finish(st, 'shape:star', { n: 9 }), { fresh: false, stars: 2, more: false, gold: false }, 'the best stars stay');
assert.strictEqual(st.puzzles.stars['shape:star'], 3);
assert.strictEqual(st.puzzles.done['shape:star'], 3);
assert.deepStrictEqual(SH.finish(st, 'pic:fun-bday', { n: 4, gold: true }), { fresh: true, stars: 1, more: true, gold: true });
assert.strictEqual(SH.finish(st, 'pic:fun-bday', { n: 4, gold: true }).gold, false, 'golden only counts once');
assert.deepStrictEqual(SH.finish(st, 'build:house'), { fresh: true, stars: 0, more: false, gold: false }, 'Build It has no stars');
st.puzzles.done['shape:old-one'] = 1; // a puzzle removed in a later version does not count
assert.strictEqual(SH.count(st), 3);
const lastDot = SH.DOTS[SH.DOTS.length - 1];
for (const d of SH.DOTS.slice(0, -1)) SH.finish(st, 'dots:' + d.id);
for (let i = 0; i < 30; i++) assert.strictEqual(SH.nextDots(st, '').id, lastDot.id, 'the dot-to-dot not found yet comes next');
for (let i = 0; i < 30; i++) assert.notStrictEqual(SH.nextDots(st, lastDot.id).id, lastDot.id, 'not the same one twice in a row');
assert.deepStrictEqual(SH.find('build:rocket').item.id, 'rocket');
assert.strictEqual(SH.find('build:nope').item, null);
assert.strictEqual(SH.find('nope:x'), null);
assert.strictEqual(SH.find('snap:ocean-octopus').item.pack, 'ocean');

// ---- packs: free ones, bought ones, seasonal ones; the picture puzzles pick only from what is yours
const AUG = '2026-08-10', OCT = '2026-10-17', DEC = '2026-12-20', JAN = '2027-01-05';
const pack = (id) => SH.PACKS.find((P) => P.id === id);
assert.ok(SH.hasPack(st, pack('fun'), AUG) && SH.hasPack(st, pack('free'), AUG), 'free packs are open');
assert.ok(!SH.hasPack(st, pack('ocean'), AUG), 'a pack for crystals is closed');
assert.ok(SH.hasPack(st, pack('halloween'), OCT) && !SH.hasPack(st, pack('halloween'), AUG), 'Halloween is free in October only');
assert.ok(SH.hasPack(st, pack('winter'), DEC) && SH.hasPack(st, pack('winter'), JAN) && !SH.hasPack(st, pack('winter'), OCT), 'the winter season goes over New Year');
const freePool = SH.pool(st, AUG);
assert.ok(freePool.every((p) => !SH.pack(p.pack).price) && freePool.length === SH.packPics('free').length + SH.packPics('fun').length, 'out of season: only free pictures');
assert.ok(SH.pool(st, OCT).some((p) => p.pack === 'halloween'), 'in October Halloween pictures come up');
assert.ok(SH.pool(st, OCT).every((p) => p.kind !== 'legend'), 'Legendary pictures are played from their pack only');
assert.strictEqual(SH.buy(st, 'ocean'), false, 'not enough crystals');
st.crystals = 45;
assert.strictEqual(SH.buy(st, 'ocean', AUG), true);
assert.strictEqual(st.crystals, 15);
assert.strictEqual(st.puzzles.packs.ocean, AUG);
assert.strictEqual(SH.buy(st, 'ocean', AUG), false, 'bought once');
assert.strictEqual(SH.buy(st, 'fun', AUG), false, 'a free pack is not sold');
assert.ok(SH.owns(st, SH.picById['ocean-whale'], AUG) && SH.pool(st, AUG).some((p) => p.pack === 'ocean'));
for (const p of SH.pool(st, AUG).slice(1)) SH.finish(st, 'pic:' + p.id);
const left = SH.pool(st, AUG)[0];
if (!st.puzzles.done['pic:' + left.id]) for (let i = 0; i < 20; i++) assert.strictEqual(SH.nextPic(st, '', AUG).id, left.id, 'the picture not made yet comes next');
for (let i = 0; i < 20; i++) assert.notStrictEqual(SH.nextPic(st, left.id, AUG).id, left.id, 'not the same picture twice in a row');

// ---- the puzzle of the day: the same all day, different days differ, a streak like the Daily Quest
const d1 = SH.daily(st, OCT), d1b = SH.daily(st, OCT);
assert.strictEqual(d1.pic.id, d1b.pic.id);
assert.ok(['snap', 'find', 'hide'].includes(d1.mode) && d1.pic.kind !== 'legend');
const days = new Set(U_days().map((d) => SH.daily(st, d).pic.id));
function U_days() { return MQ.U.range(1, 28).map((i) => '2026-11-' + String(i).padStart(2, '0')); }
assert.ok(days.size >= 20, `a month of puzzles of the day is varied (${days.size} different)`);
assert.ok(new Set(U_days().map((d) => SH.daily(st, d).pic.pack)).size >= 4, 'puzzles of the day come from many packs');
assert.notStrictEqual(SH.daily(st, OCT).pic.id + SH.daily(st, OCT).mode, SH.daily({ id: 'sister' }, OCT).pic.id + SH.daily({ id: 'sister' }, OCT).mode, 'sisters get different puzzles of the day');
assert.strictEqual(SH.finishDaily(st, '2026-11-01'), true);
assert.strictEqual(SH.finishDaily(st, '2026-11-01'), false, 'once a day');
SH.finishDaily(st, '2026-11-02');
SH.finishDaily(st, '2026-11-03');
assert.deepStrictEqual(st.puzzles.daily, { last: '2026-11-03', streak: 3, best: 3 });
SH.finishDaily(st, '2026-11-05');
assert.deepStrictEqual(st.puzzles.daily, { last: '2026-11-05', streak: 1, best: 3 }, 'a missed day starts the streak over');
assert.ok(SH.dailyDone(st, '2026-11-05') && !SH.dailyDone(st, '2026-11-06'));

// ---- badges
const badge = (id) => MQ.BADGES.find((b) => b.id === id);
for (const b of ['puzzle1', 'puzzleall', 'puzzlepack', 'puzzlelegend', 'puzzleday7']) assert.ok(badge(b), b);
assert.strictEqual(badge('puzzle1').test(st), true);
assert.strictEqual(badge('puzzlepack').test(st), true, 'bought the Ocean pack');
assert.strictEqual(badge('puzzleall').test(st), false);
assert.strictEqual(badge('puzzlelegend').test(st), false);
assert.strictEqual(badge('puzzleday7').test(st), false);
SH.finish(st, 'pic:lg-royal', { n: 9 });
assert.strictEqual(badge('puzzlelegend').test(st), true);
for (const k of SH.FREE) SH.finish(st, k);
assert.strictEqual(badge('puzzleall').test(st), true, 'every free puzzle');
st.puzzles.daily.best = 7;
assert.strictEqual(badge('puzzleday7').test(st), true);
for (const b of ['puzzle1', 'puzzleall', 'puzzlepack', 'puzzlelegend', 'puzzleday7']) assert.strictEqual(badge(b).test({}), false, b + ': an old profile without puzzles');

// ---- two devices: every puzzle finished on either one stays in the album
const base = () => ({ v: 1, id: 'kid', grade: 'k', name: 'Leo', crystals: 0, xp: 0, rev: 0, eggsHatched: 0, levels: {}, creatures: {}, badges: {}, days: {}, lastPlayed: '',
  stats: { attempts: 0, correct: 0, bestStreak: 0, topics: {}, d5: 0, lightning60: 0, lightning120: 0, endlessBest: 0 }, daily: { last: '', streak: 0, best: 0 } });
const a = Object.assign(base(), { rev: 100, puzzles: { n: 9, done: { 'shape:star': 2, 'dots:fish': 1 }, stars: { 'shape:star': 3 }, packs: { ocean: '2026-10-01' }, gold: { 'pic:fun-bday': true }, daily: { last: '2026-10-16', streak: 4, best: 6 } } });
const b = Object.assign(base(), { rev: 200, puzzles: { n: 4, done: { 'shape:star': 1, 'build:house': 3 }, stars: { 'shape:star': 1, 'pic:fun-kite': 2 }, packs: { space: '2026-10-10' }, gold: {}, daily: { last: '2026-10-17', streak: 5, best: 5 } } });
const m = MQ.store.mergeProfiles(a, b);
assert.deepStrictEqual(m.puzzles.done, { 'shape:star': 2, 'dots:fish': 1, 'build:house': 3 });
assert.deepStrictEqual(m.puzzles.stars, { 'shape:star': 3, 'pic:fun-kite': 2 }, 'the best stars from either device');
assert.deepStrictEqual(Object.keys(m.puzzles.packs).sort(), ['ocean', 'space'], 'packs bought on either device');
assert.deepStrictEqual(m.puzzles.gold, { 'pic:fun-bday': true });
assert.deepStrictEqual(m.puzzles.daily, { last: '2026-10-17', streak: 5, best: 6 }, 'the latest puzzle of the day, the best streak');
assert.strictEqual(m.puzzles.n, 4, 'the piece count comes from the most recent copy');
const m2 = MQ.store.mergeProfiles(base(), Object.assign(base(), { rev: 5 }));
assert.deepStrictEqual(m2.puzzles.done, {}, 'profiles from before Shape Puzzles merge fine');

console.log('puzzles ok:', SH.PICS.length, 'pictures (' + emoji.length + ' emoji, ' + legends.length + ' Legendary) in', SH.PACKS.length, 'packs,', SH.FREE.length, 'free puzzles,', SH.SHAPES.length, 'shapes cut 6 ways ×20,', SH.FIGS.length, 'pictures of shapes,', SH.DOTS.length, 'dot-to-dots, 40,000 problems');
