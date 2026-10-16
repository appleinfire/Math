// Shape Puzzles: the shapes and pictures (drawn from code), the jigsaw cut, the album, and the short problems that build them.
//   SH.SHAPES   smiling shapes cut into jigsaw pieces: every right answer brings a piece (⭐ Shape Puzzle)
//   SH.FIGS     pictures made of shapes: every right answer gives a shape to put in its outline (🏠 Build It)
//   SH.DOTS     dot-to-dot pictures: every right answer draws the line to the next dot (✏️ Dot to Dot)
//   SH.cut(n, shape)        → jigsaw pieces of a shape cut on a grid of n cells
//   SH.problem(grade, prev) → a problem with three answers to tap, recorded under a regular topic of the grade
// The screens are in js/shapes-ui.js. Everything here is plain data and math, so the tests run it in node.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U;
  const SH = {};
  const f1 = (x) => +(+x).toFixed(2);
  let uid = 0;

  // ---------------------------------------------------------------- outlines (every shape is also a polygon, for the cut)
  const polyD = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';
  const ring = (cx, cy, R, n) => U.range(0, n - 1).map((i) => { const a = (i * 2 * Math.PI) / n; return [f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a))]; });
  const starPts = (cx, cy, R, r) => U.range(0, 9).map((i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; return [f1(cx + rr * Math.cos(a)), f1(cy + rr * Math.sin(a))]; });
  // the classic heart curve, scaled into the 120 × 120 picture
  const heartPts = () => U.range(0, 63).map((i) => {
    const t = (i / 64) * 2 * Math.PI, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [f1(60 + x * 3.25), f1(56 - y * 3.25)];
  });
  const R4 = (a, b, c, d) => [[a, b], [c, b], [c, d], [a, d]];
  SH.polyD = polyD;

  // Ray casting: is the point inside the polygon?
  SH.inside = (pts, x, y) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };

  SH.SHAPES = [
    { id: 'circle', name: 'circle', pts: ring(60, 60, 50, 48), d: 'M10 60A50 50 0 1 0 110 60A50 50 0 1 0 10 60Z', c: ['#8fd8ff', '#3f8fe0'], face: [60, 58, 1.2], fact: 'A circle is round. It has no corners and no straight sides.' },
    { id: 'square', name: 'square', pts: R4(14, 14, 106, 106), c: ['#a8eb96', '#3fae6a'], face: [60, 58, 1.2], fact: 'A square has 4 sides, all the same length, and 4 corners.' },
    { id: 'triangle', name: 'triangle', pts: [[60, 8], [114, 108], [6, 108]], c: ['#ffd97a', '#ff9f1c'], face: [60, 78, 1], fact: 'A triangle has 3 sides and 3 corners.' },
    { id: 'hexagon', name: 'hexagon', pts: ring(60, 60, 54, 6), c: ['#ffb8d6', '#e0407a'], face: [60, 58, 1.2], fact: 'A hexagon has 6 sides and 6 corners, like a honeycomb.' },
    { id: 'star', name: 'star', pts: starPts(60, 64, 56, 23), c: ['#fff07a', '#ffb547'], face: [60, 68, 0.9], fact: 'This star has 5 points.' },
    { id: 'heart', name: 'heart', pts: heartPts(), c: ['#ffa3bf', '#ff4d6d'], face: [60, 52, 1.1], fact: 'A heart has two bumps on top and a point at the bottom.' },
  ];
  for (const s of SH.SHAPES) if (!s.d) s.d = polyD(s.pts);

  // Pictures made of shapes. Parts are drawn in this order, so a door sits on its wall.
  SH.FIGS = [
    { id: 'house', name: 'a house', parts: [
      { kind: 'square', pts: R4(34, 58, 86, 110), col: '#ffd27a' },
      { kind: 'triangle', pts: [[24, 58], [60, 20], [96, 58]], col: '#ff6b5b' },
      { kind: 'rectangle', pts: R4(53, 82, 67, 110), col: '#a8673a' },
      { kind: 'circle', c: [74, 70], r: 6.5, col: '#8fd3ff' },
      { kind: 'circle', c: [104, 18], r: 9, col: '#ffe14d' },
    ] },
    { id: 'rocket', name: 'a rocket', parts: [
      { kind: 'triangle', pts: [[50, 92], [70, 92], [60, 114]], col: '#ffb547' },
      { kind: 'rectangle', pts: R4(46, 32, 74, 92), col: '#9fc3ff' },
      { kind: 'triangle', pts: [[46, 32], [60, 8], [74, 32]], col: '#ff6b5b' },
      { kind: 'circle', c: [60, 52], r: 7.5, col: '#ffe14d' },
      { kind: 'triangle', pts: [[46, 66], [28, 96], [46, 90]], col: '#ff6b5b' },
      { kind: 'triangle', pts: [[74, 66], [92, 96], [74, 90]], col: '#ff6b5b' },
    ] },
    { id: 'tree', name: 'a Christmas tree', parts: [
      { kind: 'rectangle', pts: R4(53, 88, 67, 112), col: '#a8673a' },
      { kind: 'triangle', pts: [[24, 94], [60, 56], [96, 94]], col: '#2f9a5a' },
      { kind: 'triangle', pts: [[31, 72], [60, 38], [89, 72]], col: '#45b86a' },
      { kind: 'triangle', pts: [[38, 50], [60, 22], [82, 50]], col: '#6fd18a' },
      { kind: 'star', pts: starPts(60, 17, 11, 4.6), col: '#ffd23f' },
      { kind: 'circle', c: [44, 84], r: 5.5, col: '#ff6b5b' },
    ] },
    { id: 'fish', name: 'a fish', parts: [
      { kind: 'triangle', pts: [[74, 62], [108, 38], [108, 86]], col: '#ff6b5b' },
      { kind: 'triangle', pts: [[36, 40], [62, 36], [42, 16]], col: '#ff8a3c' },
      { kind: 'triangle', pts: [[40, 86], [60, 88], [46, 106]], col: '#ff8a3c' },
      { kind: 'circle', c: [50, 62], r: 28, col: '#ffc24d' },
      { kind: 'circle', c: [38, 55], r: 6.5, col: '#ffffff' },
      { kind: 'circle', c: [16, 24], r: 6.5, col: '#bfeaff' },
    ] },
    { id: 'boat', name: 'a sailboat', parts: [
      { kind: 'rectangle', pts: R4(56, 22, 64, 84), col: '#5b3524' },
      { kind: 'triangle', pts: [[67, 28], [67, 80], [103, 80]], col: '#ff8fb1' },
      { kind: 'triangle', pts: [[53, 34], [53, 80], [24, 80]], col: '#8fd3ff' },
      { kind: 'triangle', pts: [[64, 8], [83, 15], [64, 22]], col: '#ff6b5b' },
      { kind: 'trapezoid', pts: [[16, 84], [104, 84], [90, 106], [30, 106]], col: '#a8673a' },
      { kind: 'circle', c: [20, 20], r: 9, col: '#ffe14d' },
    ] },
  ];

  // Dot-to-dot: the line goes 1 → 2 → … and back to 1.
  SH.DOTS = [
    { id: 'star', name: 'star', pts: starPts(60, 64, 52, 21), c: ['#fff07a', '#ffb547'], face: [60, 68, 0.85], fact: 'A star has 5 points. Count them!' },
    { id: 'heart', name: 'heart', pts: [[60, 34], [80, 14], [104, 24], [106, 50], [60, 104], [14, 50], [16, 24], [40, 14]], c: ['#ffa3bf', '#ff4d6d'], face: [60, 52, 1], fact: 'A heart has two bumps on top and a point at the bottom.' },
    { id: 'house', name: 'house', pts: [[32, 58], [60, 18], [88, 58], [88, 108], [32, 108]], c: ['#ffd97a', '#ff9f1c'], face: [60, 80, 1], fact: 'A house is a square with a triangle roof!' },
    { id: 'fish', name: 'fish', pts: [[8, 60], [32, 38], [64, 36], [86, 54], [112, 36], [112, 86], [86, 68], [64, 86], [32, 84]], c: ['#8fd8ff', '#3f8fe0'], face: [42, 58, 0.8], fact: 'A fish swims with its tail. This tail is a triangle!' },
    { id: 'diamond', name: 'diamond', pts: [[38, 22], [82, 22], [106, 48], [60, 108], [14, 48]], c: ['#d3c2ff', '#7a5cd6'], face: [60, 50, 1], fact: 'This diamond has 5 corners. Count them: 1, 2, 3, 4, 5!' },
  ];

  // ---------------------------------------------------------------- pictures
  const face = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-10" cy="0" rx="4.2" ry="5.4" fill="#22304f"/><ellipse cx="10" cy="0" rx="4.2" ry="5.4" fill="#22304f"/>` +
    '<circle cx="-8.6" cy="-1.8" r="1.6" fill="#ffffff"/><circle cx="11.4" cy="-1.8" r="1.6" fill="#ffffff"/><ellipse cx="-17" cy="8" rx="4.5" ry="2.6" fill="#ff5d8f" opacity=".45"/><ellipse cx="17" cy="8" rx="4.5" ry="2.6" fill="#ff5d8f" opacity=".45"/>' +
    '<path d="M-6 8Q0 14 6 8" fill="none" stroke="#22304f" stroke-width="2.2" stroke-linecap="round"/></g>';
  const grad = (k, c) => `<linearGradient id="${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`;

  // The inside of an SVG with viewBox 0 0 120 120. Each call makes its own ids, so a picture can be on screen twice.
  SH.shapeArt = (sh) => {
    const k = 'sp' + (++uid).toString(36), [fx, fy, s] = sh.face;
    let dots = '';
    for (let y = 8, row = 0; y < 120; y += 16, row++) for (let x = row % 2 ? 16 : 8; x < 120; x += 16) dots += `<circle cx="${x}" cy="${y}" r="3.2"/>`;
    return `<defs>${grad(k + 'g', sh.c)}<clipPath id="${k}c"><path d="${sh.d}"/></clipPath></defs>` +
      `<path d="${sh.d}" fill="url(#${k}g)"/><g clip-path="url(#${k}c)"><g fill="#ffffff" opacity=".22">${dots}</g><ellipse cx="38" cy="32" rx="15" ry="7" fill="#ffffff" opacity=".35" transform="rotate(-30 38 32)"/></g>` +
      face(fx, fy, s) + `<path d="${sh.d}" fill="none" stroke="rgba(34,48,79,.55)" stroke-width="2" stroke-linejoin="round"/>`;
  };
  SH.partShape = (pt, attrs) => (pt.c ? `<circle cx="${pt.c[0]}" cy="${pt.c[1]}" r="${pt.r}" ${attrs}/>` : `<polygon points="${pt.pts.map((p) => p.join(',')).join(' ')}" ${attrs}/>`);
  SH.partBB = (pt, pad = 0) => {
    if (pt.c) return [pt.c[0] - pt.r - pad, pt.c[1] - pt.r - pad, 2 * (pt.r + pad), 2 * (pt.r + pad)];
    const xs = pt.pts.map((p) => p[0]), ys = pt.pts.map((p) => p[1]), x = Math.min(...xs), y = Math.min(...ys);
    return [f1(x - pad), f1(y - pad), f1(Math.max(...xs) - x + 2 * pad), f1(Math.max(...ys) - y + 2 * pad)];
  };
  SH.figArt = (fig) => fig.parts.map((p) => SH.partShape(p, `class="pfill" fill="${p.col}" stroke="rgba(34,48,79,.55)" stroke-width=".9" stroke-linejoin="round"`)).join('');
  SH.dotArt = (d) => {
    const k = 'sp' + (++uid).toString(36);
    return `<defs>${grad(k, d.c)}</defs><path d="${polyD(d.pts)}" fill="url(#${k})" stroke="rgba(34,48,79,.6)" stroke-width="2" stroke-linejoin="round"/>` + face(...d.face);
  };

  // ---------------------------------------------------------------- the jigsaw cut
  // Every inside edge gets a knob to one side. The knob is symmetric, so the two pieces that share an edge draw
  // it the same way whichever direction they walk it.
  SH.GRID = { 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3] };
  function edge(P, Q, n, T) {
    if (!n) return `L${f1(Q[0])} ${f1(Q[1])}`;
    const dx = Q[0] - P[0], dy = Q[1] - P[1];
    const pt = (u, v) => f1(P[0] + dx * u + n[0] * v * T) + ' ' + f1(P[1] + dy * u + n[1] * v * T);
    return `L${pt(0.37, 0)}C${pt(0.42, 0)} ${pt(0.43, 0.06)} ${pt(0.4, 0.1)}C${pt(0.35, 0.17)} ${pt(0.39, 0.26)} ${pt(0.5, 0.26)}` +
      `C${pt(0.61, 0.26)} ${pt(0.65, 0.17)} ${pt(0.6, 0.1)}C${pt(0.57, 0.06)} ${pt(0.58, 0)} ${pt(0.63, 0)}L${f1(Q[0])} ${f1(Q[1])}`;
  }
  // How much of each grid cell the shape covers (sampled on a 10 × 10 grid inside the cell).
  SH.coverage = (n, shape) => {
    const [cols, rows] = SH.GRID[n], W = 120 / cols, H = 120 / rows, out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let k = 0;
      for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (SH.inside(shape.pts, c * W + ((i + 0.5) * W) / 10, r * H + ((j + 0.5) * H) / 10)) k++;
      out.push(k / 100);
    }
    return out;
  };
  SH.MIN_COVER = 0.04; // a cell with less of the shape than this is not a piece (it would be a crumb)
  // Pieces of the shape. Only cells that hold some of the shape are pieces, and a knob on the shape's border
  // always belongs to the piece inside, so no piece has a bite missing.
  SH.cut = (n, shape) => {
    const [cols, rows] = SH.GRID[n], W = 120 / cols, H = 120 / rows, T = Math.min(W, H);
    const cov = SH.coverage(n, shape);
    const inc = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && cov[r * cols + c] >= SH.MIN_COVER;
    const dir = (r1, c1, r2, c2) => (inc(r1, c1) && !inc(r2, c2) ? 1 : !inc(r1, c1) && inc(r2, c2) ? -1 : U.pick([1, -1]));
    const hz = U.range(0, rows - 2).map((r) => U.range(0, cols - 1).map((c) => dir(r, c, r + 1, c))); // +1: the knob points down
    const vt = U.range(0, rows - 1).map((r) => U.range(0, cols - 2).map((c) => dir(r, c, r, c + 1))); // +1: the knob points right
    const pieces = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!inc(r, c)) continue;
      const x0 = c * W, y0 = r * H, x1 = x0 + W, y1 = y0 + H, m = 0.28 * T;
      const d = `M${f1(x0)} ${f1(y0)}` +
        edge([x0, y0], [x1, y0], r > 0 ? [0, hz[r - 1][c]] : null, T) +
        edge([x1, y0], [x1, y1], c < cols - 1 ? [vt[r][c], 0] : null, T) +
        edge([x1, y1], [x0, y1], r < rows - 1 ? [0, hz[r][c]] : null, T) +
        edge([x0, y1], [x0, y0], c > 0 ? [vt[r][c - 1], 0] : null, T) + 'Z';
      const bx = Math.max(0, x0 - m), by = Math.max(0, y0 - m);
      pieces.push({ i: pieces.length, r, c, x0, y0, W, H, T, cx: x0 + W / 2, cy: y0 + H / 2, d, clip: d, cover: cov[r * cols + c],
        bb: [f1(bx), f1(by), f1(Math.min(120, x1 + m) - bx), f1(Math.min(120, y1 + m) - by)] });
    }
    // A crumb of the shape in a cell that is not a piece goes with the neighbouring piece that has the most of the shape:
    // that piece's picture is cut by its outline plus the crumb's cell (both drawn clockwise, so they add up).
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (inc(r, c) || !cov[r * cols + c]) continue;
      const host = pieces.filter((p) => Math.abs(p.r - r) + Math.abs(p.c - c) === 1).sort((a, b) => b.cover - a.cover)[0];
      if (!host) continue;
      const x0 = c * W, y0 = r * H;
      host.clip += `M${f1(x0)} ${f1(y0)}H${f1(x0 + W)}V${f1(y0 + H)}H${f1(x0)}Z`;
      (host.crumbs = host.crumbs || []).push([r, c]);
    }
    return { cols, rows, pieces };
  };

  // ---------------------------------------------------------------- problems
  // Kindergarten: adding and taking away within 10, counting dots in a ten-frame (K.OA.1–5, K.CC.5).
  // 2nd grade: facts to 20 that cross ten (2.OA.2). Each is recorded under the topic and level whose problems
  // look the same, so a miss comes back in the Fix-it Lab as a regular problem of that skill.
  const P = (t, a, b, answer, topic, d, sign, word) => ({ t, a, b, answer, topic, d, text: `${a} ${sign} ${b} = ?`, eq: `${a} ${sign} ${b}`, say: `${a} ${word} ${b}?` });
  function make(grade) {
    const { rnd } = U;
    if (grade === 'k') {
      const t = U.pick(['add', 'add', 'sub', 'sub', 'count']);
      if (t === 'add') { const s = rnd(2, 10), a = rnd(1, s - 1); return P('add', a, s - a, s, 'k_add', 3, '+', 'plus'); }
      if (t === 'sub') { const a = rnd(3, 10), b = rnd(1, a - 1); return P('sub', a, b, a - b, 'k_sub', 3, '−', 'take away'); }
      const n = rnd(4, 10);
      return { t: 'count', n, answer: n, topic: 'k_count', d: 2, text: 'How many dots?', eq: '', say: 'How many dots?' };
    }
    if (U.chance(0.5)) { const a = rnd(2, 9), b = rnd(Math.max(2, 11 - a), 9); return P('add', a, b, a + b, 'add20', 2, '+', 'plus'); }
    const c = rnd(11, 18), b = rnd(c - 9, 9);
    return P('sub', c, b, c - b, 'add20', 2, '−', 'minus');
  }
  SH.problem = (grade, prev) => {
    let p = make(grade);
    for (let k = 0; k < 20 && prev && p.text === prev.text && p.answer === prev.answer; k++) p = make(grade);
    const top = grade === 'k' ? 10 : 20, opts = new Set([p.answer]);
    while (opts.size < 3) { const v = p.answer + U.pick([-2, -1, 1, 2]); if (v >= 0 && v <= top) opts.add(v); }
    p.opts = [...opts].sort((x, y) => x - y);
    return p;
  };
  // The dots that show a problem: ten-frames (one for kindergarten, two for facts to 20), filled in reading order.
  // 'a' first number, 'b' the number added, 'x' taken away (crossed out).
  SH.cells = (p, grade) => U.range(0, (grade === 'k' ? 10 : 20) - 1).map((i) =>
    p.t === 'count' ? (i < p.n ? 'a' : '') : p.t === 'add' ? (i < p.a ? 'a' : i < p.a + p.b ? 'b' : '') : i < p.a - p.b ? 'a' : i < p.a ? 'x' : '');

  // ---------------------------------------------------------------- the album
  // st.puzzles = { n: pieces for a shape puzzle, done: { 'shape:circle': times finished, 'build:house': …, 'dots:star': … } }
  SH.ITEMS = [...SH.SHAPES.map((s) => 'shape:' + s.id), ...SH.FIGS.map((f) => 'build:' + f.id), ...SH.DOTS.map((d) => 'dots:' + d.id)];
  SH.ensure = (st) => {
    st.puzzles = st.puzzles || {};
    if (!SH.GRID[st.puzzles.n]) st.puzzles.n = 6;
    st.puzzles.done = st.puzzles.done || {};
    return st.puzzles;
  };
  SH.count = (st) => SH.ITEMS.filter((k) => ((st.puzzles || {}).done || {})[k]).length;
  SH.total = () => SH.ITEMS.length;
  SH.REWARD = { right: 1, done: 3, fresh: 5 }; // 💎 for a first-try answer, a finished puzzle, a new one for the album
  // Mark a puzzle finished; returns true when it is new in the album.
  SH.finish = (st, key) => {
    const done = SH.ensure(st).done, fresh = !done[key];
    done[key] = (done[key] || 0) + 1;
    return fresh;
  };
  // The next dot-to-dot surprise: one not found yet, else any but the one just played.
  SH.nextDots = (st, last) => {
    const done = SH.ensure(st).done;
    const notYet = SH.DOTS.filter((d) => !done['dots:' + d.id] && d.id !== last);
    return U.pick(notYet.length ? notYet : SH.DOTS.filter((d) => d.id !== last));
  };
  SH.find = (key) => {
    const [mode, id] = String(key).split(':');
    const list = { shape: SH.SHAPES, build: SH.FIGS, dots: SH.DOTS }[mode];
    return list ? { mode, item: list.find((x) => x.id === id) || null } : null;
  };
  // "It has 4 triangles, 1 rectangle and 1 star."
  SH.shapeCount = (fig) => {
    const n = {};
    for (const p of fig.parts) n[p.kind] = (n[p.kind] || 0) + 1;
    const list = Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${c} ${k}${c > 1 ? 's' : ''}`);
    return 'It has ' + (list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0]) + '.';
  };

  MQ.shapes = SH;
})();
