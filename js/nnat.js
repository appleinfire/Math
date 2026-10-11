// NNAT-3 style practice (Naglieri Nonverbal Ability Test, 3rd edition), the test Eureka Union uses for GATE eligibility
// (NAI 132 / 98th percentile, from 2nd grade). Level C (2nd grade) has four kinds of nonverbal puzzles, all pictures:
//   Pattern Completion · Reasoning by Analogy · Serial Reasoning · Spatial Visualization
// Every item has 5 answer pictures, like the real test, and a `say` line for the short spoken directions.
// Levels 1–5 go from easy to hard; level 6 (Expert) is harder than most real Level C items, for the 98th-percentile goal.
// All items are original and generated here; nothing is copied from the real test.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U;
  const { C } = MQ.G;
  const { rnd, pick, shuffle } = U;
  MQ.NNAT_FALLBACKS = {};

  // ---------------------------------------------------------------- drawing
  const COL = { blue: '#2e64b8', yellow: '#f5c518', white: '#ffffff', ink: '#1f2a44', sky: '#9cc3ef' };
  const INK = '#1f2a44';
  const r1 = (x) => Math.round(x * 10) / 10;
  const rad = (d) => (d * Math.PI) / 180;
  const svg = (w, h, body, cls = '') => `<svg class="vis nn ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="picture" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross', 'half', 'arrow'];
  const TURNY = ['triangle', 'half', 'arrow']; // shapes that look different after a quarter turn
  const POS = { c: [0.5, 0.5], tl: [0.28, 0.28], tr: [0.72, 0.28], bl: [0.28, 0.72], br: [0.72, 0.72] };
  const SPOTS = { 1: [[0.5, 0.5]], 2: [[0.3, 0.5], [0.7, 0.5]], 3: [[0.5, 0.28], [0.28, 0.72], [0.72, 0.72]], 4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]] };
  function shapeAt(shape, cx, cy, r, fill, rot) {
    const st = `fill="${COL[fill] || fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`;
    const turn = (pts) => pts.map(([x, y]) => { const a = rad(rot), X = x * r, Y = y * r; return `${r1(cx + X * Math.cos(a) - Y * Math.sin(a))},${r1(cy + X * Math.sin(a) + Y * Math.cos(a))}`; }).join(' ');
    switch (shape) {
      case 'circle': return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" ${st}/>`;
      case 'square': return `<polygon points="${turn([[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]])}" ${st}/>`;
      case 'diamond': return `<polygon points="${turn([[0, -1], [1, 0], [0, 1], [-1, 0]])}" ${st}/>`;
      case 'triangle': return `<polygon points="${turn([[0, -1], [0.95, 0.75], [-0.95, 0.75]])}" ${st}/>`;
      case 'cross': return `<polygon points="${turn([[-0.32, -1], [0.32, -1], [0.32, -0.32], [1, -0.32], [1, 0.32], [0.32, 0.32], [0.32, 1], [-0.32, 1], [-0.32, 0.32], [-1, 0.32], [-1, -0.32], [-0.32, -0.32]])}" ${st}/>`;
      case 'half': { // a half disc, flat side down when rot = 0
        const pts = [];
        for (let k = 0; k <= 12; k++) { const a = Math.PI + (Math.PI * k) / 12; pts.push([Math.cos(a), Math.sin(a) * 1 + 0.45]); }
        return `<polygon points="${turn(pts)}" ${st}/>`;
      }
      case 'arrow': return `<polygon points="${turn([[0, -1], [0.75, -0.15], [0.28, -0.15], [0.28, 1], [-0.28, 1], [-0.28, -0.15], [-0.75, -0.15]])}" ${st}/>`;
      default: return '';
    }
  }
  // A figure in a box: { bg, shape, fill, big, pos, rot, n }
  function figBody(f, x, y, s) {
    let b = `<rect x="${x + 1}" y="${y + 1}" width="${s - 2}" height="${s - 2}" rx="4" fill="${COL[f.bg || 'white']}" stroke="#b9c6d6" stroke-width="2"/>`;
    if (!f.shape) return b;
    const n = f.n || 1;
    const r = (f.big === false || n > 1 ? 0.17 : 0.3) * s;
    const spots = n > 1 ? SPOTS[n] : [POS[f.pos || 'c']];
    for (const [px, py] of spots) b += shapeAt(f.shape, x + px * s, y + py * s, r, f.fill || 'blue', f.rot || 0);
    return b;
  }
  const fig = (f, s = 64) => svg(s, s, figBody(f, 0, 0, s), 'fig');
  // What a figure looks like (two figures with the same key look the same: a turned circle is still a circle).
  const keyOf = (f) => {
    const n = f.n || 1, turny = TURNY.includes(f.shape);
    return JSON.stringify([f.bg || 'white', f.shape || '', f.fill || '', n > 1 ? false : f.big !== false, n > 1 ? 'c' : f.pos || 'c', turny ? ((f.rot || 0) % 360 + 360) % 360 : 0, n]);
  };
  const QBOX = (x, y, s) => `<rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 4}" rx="5" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${x + s / 2}" y="${y + s / 2 + 9}" font-size="26" font-family="Nunito, sans-serif" font-weight="900" fill="${INK}" text-anchor="middle">?</text>`;
  // A matrix of figures (rows of cells); null = the missing one.
  function matrix(cells, s = 64) {
    const R = cells.length, Cn = cells[0].length, g = 6;
    let b = '';
    cells.forEach((row, r) => row.forEach((f, c) => { const x = c * (s + g), y = r * (s + g); b += f ? figBody(f, x, y, s) : QBOX(x, y, s); }));
    return `<div class="vis nnwrap">${svg(Cn * (s + g) - g, R * (s + g) - g, b, 'mx')}</div>`;
  }
  // Five answer pictures: the right one and four that are close. Returns a choice problem.
  function five(type, text, say, right, wrongs, draw, o = {}) {
    const all = shuffle([right, ...wrongs.slice(0, 4)]);
    const values = all.map((_, i) => 'picture ' + (i + 1));
    return C(text, values[all.indexOf(right)], values, Object.assign({ choiceHtml: all.map(draw), say, nnat: type }, o));
  }
  // Pick wrong answers: unique, not the right one, preferring the given order.
  function distinct(right, cands, key, n = 4) {
    const seen = new Set([key(right)]), out = [];
    for (const c of cands) { const k = key(c); if (!seen.has(k)) { seen.add(k); out.push(c); } if (out.length === n) break; }
    return out.length === n ? out : null;
  }

  // ---------------------------------------------------------------- 1. Pattern Completion
  // A big design made of tiles with a hole; which piece fills the hole?
  // tile = { bg, m } where m is a small mark shape (or ''); a piece is a k×k block of tiles.
  const BGS = ['blue', 'yellow', 'white'];
  const MARKS = ['circle', 'diamond', 'square', 'cross'];
  function tileBody(t, x, y, s) {
    let b = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${COL[t.bg]}" stroke="#d3dbe6" stroke-width="0.6"/>`;
    if (t.m) b += shapeAt(t.m, x + s / 2, y + s / 2, s * 0.27, t.mf || (t.bg === 'blue' ? 'white' : 'blue'), 0);
    return b;
  }
  const pieceKey = (piece) => piece.map((row) => row.map((t) => t.bg + (t.m || '') + (t.mf || '')).join(',')).join('|');
  function pieceSvg(piece, s = 30) {
    const k = piece.length;
    let b = '';
    piece.forEach((row, r) => row.forEach((t, c) => { b += tileBody(t, c * s, r * s, s); }));
    b += `<rect x="1" y="1" width="${k * s - 2}" height="${k * s - 2}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    return svg(k * s, k * s, b, 'piece');
  }
  // Designs: a rule from (row, col) to a tile, on an n×n board.
  function design(d) {
    const [A, B, Cc] = shuffle(BGS), [m1, m2] = U.sample(MARKS, 2), N = d <= 2 ? 5 : 6;
    const rules = {
      1: [(r) => ({ bg: [A, B][r % 2] }), (r, c) => ({ bg: [A, B][c % 2] })],
      2: [(r, c) => ({ bg: [A, B][(r + c) % 2] }), (r, c) => ({ bg: [A, B][r % 2], m: c % 2 ? m1 : '' })],
      3: [(r, c) => ({ bg: [A, B, Cc][(r + c) % 3] }), (r, c) => ({ bg: [A, B][(r + c) % 2], m: [m1, m2][r % 2] })],
      4: [(r, c) => ({ bg: [A, B, Cc][(r + c) % 3], m: c % 2 ? m1 : '' }), (r, c) => ({ bg: [A, B][Math.floor(r / 2) % 2 ^ Math.floor(c / 2) % 2], m: (r + c) % 2 ? m1 : '' })],
      5: [(r, c) => ({ bg: [A, B, Cc][(r + 2 * c) % 3], m: [m1, '', m2][(r + c) % 3] }), (r, c) => ({ bg: [A, B][(r % 3 === 0) || (c % 3 === 0) ? 0 : 1], m: r === c || r + c === N - 1 ? m1 : '' })],
      6: [ // symmetric rings and diagonals: the hole is off-centre, so the piece comes from the mirror side
        (r, c) => { const ring = Math.min(r, c, N - 1 - r, N - 1 - c); return { bg: [A, B, Cc][ring % 3], m: r === c || r + c === N - 1 ? m1 : '' }; },
        (r, c) => ({ bg: [A, B, Cc][(Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2)) % 3 | 0], m: (r + c) % 2 ? m2 : '' }),
      ],
    };
    return { N, rule: pick(rules[d]) };
  }
  function nn_pattern(d) {
    for (let t = 0; t < 200; t++) {
      const { N, rule } = design(d);
      const k = d <= 3 ? 1 : 2;
      const hr = rnd(0, N - k), hc = rnd(0, N - k);
      const tileAt = (r, c) => rule(((r % N) + N) % N, ((c % N) + N) % N);
      const take = (r0, c0, f = (t2) => t2) => U.range(0, k - 1).map((r) => U.range(0, k - 1).map((c) => f(tileAt(r0 + r, c0 + c), r, c)));
      const right = take(hr, hc);
      const swap = (bgA, bgB) => (t2) => Object.assign({}, t2, { bg: t2.bg === bgA ? bgB : t2.bg === bgB ? bgA : t2.bg });
      const cands = shuffle([
        take(hr, hc + 1), take(hr + 1, hc), take(hr, hc - 1), take(hr - 1, hc),
        right.map((row) => row.slice().reverse()), right.slice().reverse(),
        right.map((row) => row.map(swap('blue', 'yellow'))), right.map((row) => row.map(swap('yellow', 'white'))),
        right.map((row, r) => row.map((t2, c) => (r === k - 1 && c === k - 1 ? Object.assign({}, t2, { m: t2.m ? '' : 'circle' }) : t2))),
      ]);
      // spare wrong pieces: one tile with another color or another mark (always different, a little less tricky)
      const spare = [];
      for (let i = 0; i < 12; i++) {
        const rr = rnd(0, k - 1), cc = rnd(0, k - 1);
        spare.push(right.map((row, r) => row.map((t2, c) => (r === rr && c === cc ? (i % 2 ? Object.assign({}, t2, { bg: pick(BGS.filter((x) => x !== t2.bg)) }) : Object.assign({}, t2, { m: pick(['', ...MARKS].filter((x) => x !== (t2.m || ''))) })) : t2))));
      }
      const wrongs = distinct(right, [...cands, ...spare], pieceKey);
      if (!wrongs) continue;
      const ts = 26;
      let b = '';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const inHole = r >= hr && r < hr + k && c >= hc && c < hc + k;
        if (!inHole) b += tileBody(tileAt(r, c), c * ts, r * ts, ts);
      }
      b += `<rect x="${hc * ts + 1}" y="${hr * ts + 1}" width="${k * ts - 2}" height="${k * ts - 2}" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
      b += `<rect x="1" y="1" width="${N * ts - 2}" height="${N * ts - 2}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
      return five('pattern', `Look at the design. Which piece fits in the empty space?<div class="vis nnwrap">${svg(N * ts, N * ts, b, 'design')}</div>`, 'Look at the design. Which piece fits in the empty space?', right, wrongs, (pc) => pieceSvg(pc, k === 1 ? 46 : 30), {
        hint: 'Follow the colors and marks along the row and down the column into the empty space.',
        explain: k === 1 ? 'The design repeats: the tile that fits keeps the same pattern of colors and marks as its row and its column.' : 'The design repeats (or is the same on both sides): the piece that fits continues every row and every column through the hole.',
      });
    }
    MQ.NNAT_FALLBACKS[d] = (MQ.NNAT_FALLBACKS[d] || 0) + 1; // counted by the tests: this level could not be made
    return nn_pattern(1);
  }

  // ---------------------------------------------------------------- 2. Reasoning by Analogy
  // How does a figure change across a row (and down a column)? Apply the same change to the last one.
  const T = {
    turn: { ok: (f) => TURNY.includes(f.shape), do: (f) => Object.assign({}, f, { rot: ((f.rot || 0) + 90) % 360 }), say: 'turns a quarter turn' },
    flip: { ok: (f) => TURNY.includes(f.shape), do: (f) => Object.assign({}, f, { rot: ((f.rot || 0) + 180) % 360 }), say: 'turns upside down' },
    color: { ok: (f) => f.fill !== 'white', do: (f) => Object.assign({}, f, { fill: f.fill === 'blue' ? 'yellow' : 'blue' }), say: 'changes color' },
    size: { ok: (f) => (f.n || 1) === 1 && (f.pos || 'c') === 'c', do: (f) => Object.assign({}, f, { big: f.big === false }), say: 'changes size' },
    more: { ok: (f) => (f.n || 1) < 3, do: (f) => Object.assign({}, f, { n: (f.n || 1) + 1, big: false, pos: 'c' }), say: 'gets one more' },
    bg: { ok: () => true, do: (f) => Object.assign({}, f, { bg: f.bg === 'white' ? 'sky' : 'white' }), say: 'gets a new background' },
    move: { ok: (f) => (f.n || 1) === 1 && f.big === false && (f.pos || 'c') !== 'c', do: (f) => Object.assign({}, f, { pos: { tl: 'tr', tr: 'br', br: 'bl', bl: 'tl' }[f.pos] }), say: 'moves to the next corner' },
  };
  COL.sky = '#cfe3f7';
  const base = (o = {}) => Object.assign({ bg: 'white', shape: pick(SHAPES), fill: pick(['blue', 'yellow']), big: true, pos: 'c', rot: pick([0, 90, 180, 270]), n: 1 }, o);
  const SAYS = { 1: [['color', 'size', 'more']], 2: [['turn', 'flip', 'color', 'move']], 3: [['turn', 'color', 'size', 'more', 'move']] };
  function nn_analogy(d) {
    for (let t = 0; t < 300; t++) {
      if (d <= 2) { // A → B, C → ?   (one change, two different figures)
        const name = pick(SAYS[d][0]), tr = T[name];
        const small = name === 'move';
        const a = base(small ? { big: false, pos: pick(['tl', 'tr', 'bl', 'br']), shape: pick(TURNY) } : name === 'turn' || name === 'flip' ? { shape: pick(TURNY) } : {});
        const c = Object.assign({}, a, { shape: pick(SHAPES.filter((x) => x !== a.shape && (!['turn', 'flip'].includes(name) || TURNY.includes(x)))), fill: pick(['blue', 'yellow']) });
        if (!tr.ok(a) || !tr.ok(c)) continue;
        const right = tr.do(c);
        const others = Object.keys(T).filter((k) => k !== name && T[k].ok(c)).map((k) => T[k].do(c));
        const wrongs = distinct(right, [c, tr.do(tr.do(c)), ...shuffle(others), Object.assign({}, right, { shape: a.shape }), tr.do(a)], keyOf);
        if (!wrongs) continue;
        return five('analogy', `The first picture changes into the second. Change the third picture in the same way.${matrix([[a, tr.do(a)], [c, null]])}`, 'The first picture changes into the second. Which picture shows the third one changed in the same way?', right, wrongs, (f) => fig(f), { hint: 'Say what changed from the first picture to the second. Do the same to the third.', explain: `Across the row the figure ${tr.say}, so the ${c.shape} ${tr.say} too.` });
      }
      if (d === 3) { // 2×2: one change across, another change down
        const [na, nd] = U.sample(SAYS[3][0], 2), ta = T[na], td = T[nd];
        const a = base(['move'].includes(na) || ['move'].includes(nd) ? { big: false, pos: pick(['tl', 'tr', 'bl', 'br']) } : {});
        if (!ta.ok(a) || !td.ok(a) || !ta.ok(td.do(a)) || !td.ok(ta.do(a))) continue;
        const b = ta.do(a), c = td.do(a), right = ta.do(c);
        if (keyOf(ta.do(td.do(a))) !== keyOf(td.do(ta.do(a)))) continue;
        const wrongs = distinct(right, [b, c, a, ta.do(ta.do(c)), td.do(td.do(b)), ...Object.keys(T).filter((k) => T[k].ok(c) && k !== na).map((k) => T[k].do(c))], keyOf);
        if (!wrongs) continue;
        return five('analogy', `Look across and down. Which picture goes in the empty box?${matrix([[a, b], [c, null]])}`, 'Look how the pictures change across and down. Which picture goes in the empty box?', right, wrongs, (f) => fig(f), { hint: 'Find what changes across the top row, and what changes down the left column. The empty box gets both changes.', explain: `Across, the figure ${ta.say}; down, it ${td.say}. The empty box has both changes.` });
      }
      // 3×3: each row starts with its own figure; columns apply 0, 1 and 2 steps of a change (level 6: two changes at once)
      // the main change keeps going (turning, one more, the next corner), so the last box needs two steps
      const n1 = pick(d === 4 ? ['turn', 'more'] : ['turn', 'more', 'move']);
      const n2 = d === 6 ? pick(['color', 'bg', 'turn', 'more'].filter((k) => k !== n1 && !(n1 === 'move' && k === 'more'))) : null;
      const step = (f) => { let g = T[n1].do(f); if (n2) g = T[n2].do(g); return g; };
      const opts = n1 === 'move' ? { big: false, pos: pick(['tl', 'tr', 'bl', 'br']) } : {};
      const turning = n1 === 'turn' || n2 === 'turn';
      const rows = U.sample(SHAPES.filter((x) => !turning || TURNY.includes(x)), 3).map((shape) => base(Object.assign({}, opts, { shape, n: 1 })));
      const grid = rows.map((f) => [f, step(f), step(step(f))]);
      if (!grid.every((row) => row.every((f, i) => i === 0 || (T[n1].ok(row[i - 1]) && (!n2 || T[n2].ok(T[n1].do(row[i - 1]))))))) continue;
      const right = grid[2][2];
      const cells = grid.map((row, r) => row.map((f, c) => (r === 2 && c === 2 ? null : f)));
      const wrongs = distinct(right, [grid[2][1], step(right), grid[1][2], Object.assign({}, right, { shape: grid[0][0].shape }), T[n1].do(grid[2][1]), n2 ? T[n2].do(grid[2][1]) : grid[2][0], grid[2][0]], keyOf);
      if (!wrongs) continue;
      return five('analogy', `Each row changes in the same way. Which picture goes in the empty box?${matrix(cells, 58)}`, 'Each row changes in the same way. Which picture goes in the empty box?', right, wrongs, (f) => fig(f, 58), { hint: 'Look at the first two rows: what happens from the first picture to the second, and again to the third?', explain: `In every row the figure ${T[n1].say}${n2 ? ' and ' + T[n2].say : ''} at each step, two times by the last box.` });
    }
    MQ.NNAT_FALLBACKS[d] = (MQ.NNAT_FALLBACKS[d] || 0) + 1; // counted by the tests: this level could not be made
    return nn_analogy(1);
  }

  // ---------------------------------------------------------------- 3. Serial Reasoning
  // A 3×3 grid where each row and each column has every value once (shape, color, size, …); find the missing one.
  function nn_serial(d) {
    for (let t = 0; t < 300; t++) {
      const attrs = { 1: ['shape'], 2: ['fill'], 3: ['shape', 'fill'], 4: ['shape', 'fill', 'n'], 5: ['shape', 'fill', 'rot'], 6: ['shape', 'fill', 'n', 'rot'] }[d];
      const shapes = U.sample(attrs.includes('rot') ? TURNY : SHAPES, 3);
      const vals = { shape: shapes, fill: ['blue', 'yellow', 'white'], rot: [0, 90, 180], n: [1, 2, 3] };
      // each attribute gets its own Latin-square shift (rows move the values one step left or right)
      const shift = {}, off = {};
      for (const a of attrs) { shift[a] = pick([1, 2]); off[a] = rnd(0, 2); }
      const fixed = { shape: shapes[0], fill: pick(['blue', 'yellow']), big: true, rot: 0, n: attrs.includes('n') ? 1 : pick([1, 1, 2]), bg: 'white' };
      const cellAt = (r, c) => {
        const f = Object.assign({}, fixed, { pos: 'c' });
        for (const a of attrs) {
          f[a] = vals[a][(c + shift[a] * r + off[a]) % 3];
        }
        return f;
      };
      const grid = U.range(0, 2).map((r) => U.range(0, 2).map((c) => cellAt(r, c)));
      if (new Set(grid.flat().map(keyOf)).size !== (attrs.length === 1 ? 3 : 9)) continue; // two attributes moving the same way would repeat cells
      const [mr, mc] = d === 1 ? [2, 2] : [rnd(0, 2), rnd(0, 2)];
      const right = grid[mr][mc];
      // wrong answers: copy a neighbour in the row or column, or break one attribute
      const breakOne = (a) => {
        return Object.assign({}, right, { [a]: pick(vals[a].filter((v) => v !== right[a])) });
      };
      const neighbours = [grid[mr][(mc + 1) % 3], grid[mr][(mc + 2) % 3], grid[(mr + 1) % 3][mc], grid[(mr + 2) % 3][mc]];
      // and pictures that change something the grid never changes (a color, a shape, the size or the number)
      const extra = [];
      if (!attrs.includes('fill')) for (const fl of ['blue', 'yellow', 'white'].filter((x) => x !== right.fill)) extra.push(Object.assign({}, right, { fill: fl }));
      if (!attrs.includes('shape')) for (const sh of U.sample(SHAPES.filter((x) => x !== right.shape), 2)) extra.push(Object.assign({}, right, { shape: sh }));
      if (!attrs.includes('n')) extra.push(Object.assign({}, right, { n: 2 }), Object.assign({}, right, { big: false }));
      const wrongs = distinct(right, shuffle([...neighbours, ...attrs.map(breakOne), ...attrs.map(breakOne), ...extra]), keyOf);
      if (!wrongs) continue;
      const cells = grid.map((row, r) => row.map((f, c) => (r === mr && c === mc ? null : f)));
      const names = { shape: 'shape', fill: 'color', rot: 'direction', n: 'number of shapes' };
      return five('serial', `Which picture goes in the empty box?${matrix(cells, 58)}`, 'Look at each row and each column. Which picture goes in the empty box?', right, wrongs, (f) => fig(f, 58), {
        hint: `Each row and each column uses every ${attrs.map((a) => names[a]).join(' and every ')} once. What is missing in this row and this column?`,
        explain: `Every row and every column has each ${attrs.map((a) => names[a]).join(', each ')} one time, so the empty box gets the one that is still missing.`,
      });
    }
    MQ.NNAT_FALLBACKS[d] = (MQ.NNAT_FALLBACKS[d] || 0) + 1; // counted by the tests: this level could not be made
    return nn_serial(1);
  }

  // ---------------------------------------------------------------- 4. Spatial Visualization
  // Line drawings: the first two pictures in a row are put together to make the third.
  // Levels 1–3: put together (everything shows). Levels 4–6: lines that are in both pictures disappear.
  const PARTS = ['top', 'bottom', 'left', 'right', 'd1', 'd2', 'vm', 'hm', 'ring', 'dot'];
  function linesBody(parts, x, y, s) {
    const p = (a) => x + a * s, q = (a) => y + a * s, w = 'stroke="' + INK + '" stroke-width="4" stroke-linecap="round"';
    let b = `<rect x="${x + 1}" y="${y + 1}" width="${s - 2}" height="${s - 2}" rx="4" fill="#ffffff" stroke="#b9c6d6" stroke-width="2"/>`;
    const L = (x1, y1, x2, y2) => `<line x1="${r1(p(x1))}" y1="${r1(q(y1))}" x2="${r1(p(x2))}" y2="${r1(q(y2))}" ${w}/>`;
    for (const k of parts) {
      if (k === 'top') b += L(0.2, 0.2, 0.8, 0.2);
      if (k === 'bottom') b += L(0.2, 0.8, 0.8, 0.8);
      if (k === 'left') b += L(0.2, 0.2, 0.2, 0.8);
      if (k === 'right') b += L(0.8, 0.2, 0.8, 0.8);
      if (k === 'd1') b += L(0.2, 0.2, 0.8, 0.8);
      if (k === 'd2') b += L(0.8, 0.2, 0.2, 0.8);
      if (k === 'vm') b += L(0.5, 0.2, 0.5, 0.8);
      if (k === 'hm') b += L(0.2, 0.5, 0.8, 0.5);
      if (k === 'ring') b += `<circle cx="${r1(p(0.5))}" cy="${r1(q(0.5))}" r="${r1(s * 0.2)}" fill="none" ${w}/>`;
      if (k === 'dot') b += `<circle cx="${r1(p(0.5))}" cy="${r1(q(0.5))}" r="${r1(s * 0.07)}" fill="${COL.blue}" stroke="${INK}" stroke-width="2"/>`;
    }
    return b;
  }
  const linesKey = (ps) => ps.slice().sort().join(',');
  const linesFig = (ps, s = 58) => svg(s, s, linesBody(ps, 0, 0, s), 'lines');
  function nn_spatial(d) {
    const xor = d >= 4;
    const size = { 1: [1, 2], 2: [2, 2], 3: [2, 3], 4: [2, 3], 5: [3, 3], 6: [3, 4] }[d];
    const join = (a, b) => (xor ? [...a.filter((k) => !b.includes(k)), ...b.filter((k) => !a.includes(k))] : [...new Set([...a, ...b])]);
    for (let t = 0; t < 300; t++) {
      const rowPair = () => {
        const a = U.sample(PARTS, rnd(size[0], size[1]));
        const b = U.sample(PARTS, rnd(size[0], size[1]));
        return [a, b];
      };
      const rows = [rowPair(), rowPair(), rowPair()];
      // every row must show the rule clearly: at levels 1–3 something new is added; at 4–6 some lines cancel
      if (rows.some(([a, b]) => linesKey(a) === linesKey(b) || join(a, b).length === 0)) continue;
      if (xor && !rows.slice(0, 2).some(([a, b]) => a.some((k) => b.includes(k)))) continue; // a full row shows lines cancelling
      if (xor && !rows[2][0].some((k) => rows[2][1].includes(k))) continue; // the question uses it too
      if (!xor && rows.some(([a, b]) => a.some((k) => b.includes(k)))) continue; // levels 1–3: no shared lines, so "put together" is the only reading
      const [a3, b3] = rows[2];
      const right = join(a3, b3);
      const union = [...new Set([...a3, ...b3])];
      const cands = [
        xor ? union : a3.filter((k) => b3.includes(k)),
        right.slice(0, -1), [...right, pick(PARTS.filter((k) => !right.includes(k)))],
        a3, b3, right.map((k) => ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left', d1: 'd2', d2: 'd1' }[k] || k)),
        [...right.slice(1), pick(PARTS.filter((k) => !right.includes(k)))],
      ].filter((ps) => ps.length);
      const wrongs = distinct(right, shuffle(cands), linesKey);
      if (!wrongs || !right.length) continue;
      const S = 58, g = 6;
      let b = '';
      rows.forEach(([a, bb], r) => {
        const yy = r * (S + g);
        b += linesBody(a, 0, yy, S);
        b += `<text x="${S + 9}" y="${yy + S / 2 + 7}" font-size="20" font-weight="900" fill="${INK}" text-anchor="middle" font-family="Nunito, sans-serif">+</text>`;
        b += linesBody(bb, S + 18, yy, S);
        b += `<text x="${2 * S + 27}" y="${yy + S / 2 + 7}" font-size="20" font-weight="900" fill="${INK}" text-anchor="middle" font-family="Nunito, sans-serif">=</text>`;
        b += r === 2 ? QBOX(2 * S + 36, yy, S) : linesBody(join(a, bb), 2 * S + 36, yy, S);
      });
      return five('spatial', `Put the first two pictures together. Which picture goes in the empty box?<div class="vis nnwrap">${svg(3 * S + 36, 3 * S + 2 * g, b, 'spatial')}</div>`, 'In each row the first two pictures are put together to make the third. Which picture goes in the empty box?', right, wrongs, (ps) => linesFig(ps), {
        hint: xor ? 'Look at the first two rows: a line that is in both pictures disappears. Lines in only one picture stay.' : 'Every line from the first picture and every line from the second picture is in the third.',
        explain: xor ? 'Lines that are in both pictures cancel out; lines that are in only one of them stay.' : 'The third picture has all the lines of the first and second pictures together.',
      });
    }
    MQ.NNAT_FALLBACKS[d] = (MQ.NNAT_FALLBACKS[d] || 0) + 1; // counted by the tests: this level could not be made
    return nn_spatial(1);
  }

  // ---------------------------------------------------------------- registry
  const TT = (name, icon, gen, desc) => ({ name, icon, std: 'NNAT-3 style · nonverbal', gen, track: 'prep', nnat: true, maxD: 6, desc });
  Object.assign(MQ.TOPICS, {
    nn_pattern: TT('Pattern Completion', '🧩', nn_pattern, 'A big design has a hole. Find the piece that fits it.'),
    nn_analogy: TT('Reasoning by Analogy', '🔁', nn_analogy, 'See how a shape changes across a row, then change the last one the same way.'),
    nn_serial: TT('Serial Reasoning', '🔢', nn_serial, 'Every row and column uses each shape and color once. Find the missing one.'),
    nn_spatial: TT('Spatial Visualization', '🧊', nn_spatial, 'Put two line drawings together in your mind. At higher levels, lines in both disappear.'),
  });
  MQ.NNAT_TOPICS = ['nn_pattern', 'nn_analogy', 'nn_serial', 'nn_spatial'];
  // The practice test: 48 questions in 30 minutes, about like Level C (more analogy and serial items, fewer spatial ones),
  // getting harder from the first question to the last, with the kinds mixed.
  MQ.NNAT_TEST = { n: 48, minutes: 30, mix: { nn_pattern: 13, nn_analogy: 15, nn_serial: 14, nn_spatial: 6 } };
  MQ.nnatPlan = () => {
    const pool = shuffle(Object.entries(MQ.NNAT_TEST.mix).flatMap(([t, k]) => Array(k).fill(t)));
    return pool.map((t, i) => ({ topic: t, d: 1 + Math.floor((i * 6) / MQ.NNAT_TEST.n) }));
  };
})();
