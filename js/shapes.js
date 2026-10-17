// Puzzle Time: the shapes and pictures (drawn from code), the jigsaw cut, the album, and the short problems that build them.
//   SH.PICS     creatures from the Hatchery in little scenes, for the picture puzzles (🧲 Snap!, ✋ Find the piece, ☁️ Who's hiding?)
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
  const turn = (pts, a) => pts.map(([x, y]) => [f1(60 + (x - 60) * Math.cos(a) - (y - 60) * Math.sin(a)), f1(60 + (x - 60) * Math.sin(a) + (y - 60) * Math.cos(a))]);
  const oval = (cx, cy, rx, ry, n = 48) => U.range(0, n - 1).map((i) => { const a = (i * 2 * Math.PI) / n; return [f1(cx + rx * Math.cos(a)), f1(cy + ry * Math.sin(a))]; });
  // A crescent moon: the big circle without the part the smaller circle covers.
  const crescent = () => {
    const [ax, ay, ar] = [60, 60, 50], [bx, by, br] = [80, 46, 40], N = 120;
    const inA = (x, y) => Math.hypot(x - ax, y - ay) < ar, inB = (x, y) => Math.hypot(x - bx, y - by) < br;
    const ringA = U.range(0, N - 1).map((i) => { const a = (i * 2 * Math.PI) / N; return [ax + ar * Math.cos(a), ay + ar * Math.sin(a)]; });
    const ringB = U.range(0, N - 1).map((i) => { const a = (i * 2 * Math.PI) / N; return [bx + br * Math.cos(a), by + br * Math.sin(a)]; });
    const run = (ring, keep) => { // the points kept, in one unbroken run around the ring
      const s = ring.findIndex((p, i) => keep(p) && !keep(ring[(i + N - 1) % N]));
      const out = [];
      for (let k = 0; k < N; k++) { const p = ring[(s + k) % N]; if (!keep(p)) break; out.push(p); }
      return out;
    };
    const outer = run(ringA, ([x, y]) => !inB(x, y)), inner = run(ringB, ([x, y]) => inA(x, y)).reverse();
    return [...outer, ...inner].map(([x, y]) => [f1(x), f1(y)]);
  };
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
    { id: 'rectangle', name: 'rectangle', pts: R4(6, 28, 114, 92), c: ['#ffc59a', '#ff7a3c'], face: [60, 58, 1.2], fact: 'A rectangle has 4 sides and 4 square corners. Two sides are long and two are short.' },
    { id: 'oval', name: 'oval', pts: oval(60, 60, 54, 38), d: 'M6 60A54 38 0 1 0 114 60A54 38 0 1 0 6 60Z', c: ['#c9f2a8', '#6cc94a'], face: [60, 58, 1.1], fact: 'An oval is like a stretched circle, the shape of an egg. It has no corners.' },
    { id: 'pentagon', name: 'pentagon', pts: turn(ring(60, 60, 56, 5), -Math.PI / 2).map(([x, y]) => [x, f1(y + 4)]), c: ['#a8e6ff', '#2bb3a3'], face: [60, 66, 1.1], fact: 'A pentagon has 5 sides and 5 corners.' },
    { id: 'octagon', name: 'octagon', pts: turn(ring(60, 60, 56, 8), Math.PI / 8), c: ['#ff9a8a', '#d9503c'], face: [60, 58, 1.2], fact: 'An octagon has 8 sides and 8 corners, like a stop sign!' },
    { id: 'rhombus', name: 'rhombus', pts: [[60, 4], [112, 60], [60, 116], [8, 60]], c: ['#d3c2ff', '#7a5cd6'], face: [60, 60, 1], fact: 'A rhombus has 4 sides, all the same length. It looks like a diamond.' },
    { id: 'crescent', name: 'crescent moon', pts: crescent(), c: ['#fff3a6', '#ffc93c'], face: [28, 70, 0.7], fact: 'A crescent is the shape of a thin moon. It has two sharp points.' },
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
      { kind: 'circle', c: [16, 24], r: 5, col: '#bfeaff' },
    ] },
    { id: 'boat', name: 'a sailboat', parts: [
      { kind: 'rectangle', pts: R4(56, 22, 64, 84), col: '#5b3524' },
      { kind: 'triangle', pts: [[67, 28], [67, 80], [103, 80]], col: '#ff8fb1' },
      { kind: 'triangle', pts: [[53, 34], [53, 80], [24, 80]], col: '#8fd3ff' },
      { kind: 'triangle', pts: [[64, 8], [83, 15], [64, 22]], col: '#ff6b5b' },
      { kind: 'trapezoid', pts: [[16, 84], [104, 84], [90, 106], [30, 106]], col: '#a8673a' },
      { kind: 'circle', c: [20, 20], r: 9, col: '#ffe14d' },
    ] },
    { id: 'car', name: 'a car', parts: [
      { kind: 'trapezoid', pts: [[32, 62], [42, 36], [80, 36], [92, 62]], col: '#ff8a7a' },
      { kind: 'rectangle', pts: R4(46, 42, 76, 58), col: '#bfeaff' },
      { kind: 'rectangle', pts: R4(12, 60, 108, 88), col: '#ff6b5b' },
      { kind: 'circle', c: [34, 90], r: 12, col: '#3a4766' },
      { kind: 'circle', c: [86, 90], r: 12, col: '#3a4766' },
    ] },
    { id: 'castle', name: 'a castle', parts: [
      { kind: 'square', pts: R4(38, 66, 82, 110), col: '#d3c2ff' },
      { kind: 'rectangle', pts: R4(14, 40, 38, 110), col: '#b79bff' },
      { kind: 'rectangle', pts: R4(82, 40, 106, 110), col: '#b79bff' },
      { kind: 'triangle', pts: [[10, 40], [26, 12], [42, 40]], col: '#7a5cd6' },
      { kind: 'triangle', pts: [[78, 40], [94, 12], [110, 40]], col: '#7a5cd6' },
      { kind: 'rectangle', pts: R4(52, 84, 68, 110), col: '#a8673a' },
    ] },
    { id: 'robot', name: 'a robot', parts: [
      { kind: 'square', pts: R4(36, 54, 84, 102), col: '#9fc3ff' },
      { kind: 'rectangle', pts: R4(40, 18, 80, 48), col: '#bfd6ff' },
      { kind: 'circle', c: [51, 33], r: 6.5, col: '#ffe14d' },
      { kind: 'circle', c: [69, 33], r: 6.5, col: '#ffe14d' },
      { kind: 'rectangle', pts: R4(16, 58, 32, 92), col: '#7f9ee0' },
      { kind: 'rectangle', pts: R4(88, 58, 104, 92), col: '#7f9ee0' },
    ] },
    { id: 'flower', name: 'a flower', parts: [
      { kind: 'rectangle', pts: R4(56, 64, 64, 114), col: '#3fae6a' },
      { kind: 'circle', c: [60, 22], r: 11, col: '#ff8fb1' },
      { kind: 'circle', c: [82, 44], r: 11, col: '#ff8fb1' },
      { kind: 'circle', c: [38, 44], r: 11, col: '#ff8fb1' },
      { kind: 'circle', c: [60, 66], r: 11, col: '#ff8fb1' },
      { kind: 'circle', c: [60, 44], r: 9, col: '#ffd23f' },
    ] },
    { id: 'train', name: 'a train', parts: [
      { kind: 'rectangle', pts: R4(30, 34, 42, 58), col: '#3a4766' },
      { kind: 'rectangle', pts: R4(20, 58, 72, 92), col: '#ffb547' },
      { kind: 'rectangle', pts: R4(72, 38, 106, 92), col: '#ff6b5b' },
      { kind: 'square', pts: R4(80, 46, 98, 64), col: '#bfeaff' },
      { kind: 'circle', c: [36, 96], r: 10, col: '#3a4766' },
      { kind: 'circle', c: [62, 96], r: 10, col: '#3a4766' },
      { kind: 'circle', c: [90, 96], r: 10, col: '#3a4766' },
    ] },
  ];
  // Parts with the same shape and size fit each other's outlines (two wheels, two towers).
  SH.sig = (pt) => {
    if (pt.c) return pt.kind + ':' + pt.r;
    const [x, y] = SH.partBB(pt);
    return pt.kind + ':' + pt.pts.map(([a, b]) => f1(a - x) + ',' + f1(b - y)).join(' ');
  };

  // Dot-to-dot: the line goes 1 → 2 → … and back to 1.
  SH.DOTS = [
    { id: 'star', name: 'star', pts: starPts(60, 64, 52, 21), c: ['#fff07a', '#ffb547'], face: [60, 68, 0.85], fact: 'A star has 5 points. Count them!' },
    { id: 'heart', name: 'heart', pts: [[60, 34], [80, 14], [104, 24], [106, 50], [60, 104], [14, 50], [16, 24], [40, 14]], c: ['#ffa3bf', '#ff4d6d'], face: [60, 52, 1], fact: 'A heart has two bumps on top and a point at the bottom.' },
    { id: 'house', name: 'house', pts: [[32, 58], [60, 18], [88, 58], [88, 108], [32, 108]], c: ['#ffd97a', '#ff9f1c'], face: [60, 80, 1], fact: 'A house is a square with a triangle roof!' },
    { id: 'fish', name: 'fish', pts: [[8, 60], [32, 38], [64, 36], [86, 54], [112, 36], [112, 86], [86, 68], [64, 86], [32, 84]], c: ['#8fd8ff', '#3f8fe0'], face: [42, 58, 0.8], fact: 'A fish swims with its tail. This tail is a triangle!' },
    { id: 'diamond', name: 'diamond', pts: [[38, 22], [82, 22], [106, 48], [60, 108], [14, 48]], c: ['#d3c2ff', '#7a5cd6'], face: [60, 50, 1], fact: 'This diamond has 5 corners. Count them: 1, 2, 3, 4, 5!' },
    { id: 'crown', name: 'crown', pts: [[14, 98], [14, 40], [37, 66], [60, 24], [83, 66], [106, 40], [106, 98]], c: ['#fff07a', '#ffb02e'], face: [60, 80, 0.9], fact: 'A crown has 3 points on top. Who is the king or queen?' },
    { id: 'rocket', name: 'rocket', pts: [[60, 6], [80, 34], [80, 82], [100, 106], [60, 94], [20, 106], [40, 82], [40, 34]], c: ['#bfd6ff', '#5b7fe0'], face: [60, 56, 0.75], fact: 'A rocket has a triangle nose and fins to fly straight.' },
    { id: 'tree', name: 'Christmas tree', pts: [[60, 8], [90, 48], [74, 48], [106, 92], [14, 92], [46, 48], [30, 48]], c: ['#a8eb96', '#2f9a5a'], face: [60, 72, 0.9], fact: 'A Christmas tree looks like triangles stacked up.' },
    { id: 'boat', name: 'sailboat', pts: [[58, 8], [96, 64], [110, 64], [92, 98], [28, 98], [10, 64], [58, 64]], c: ['#8fd8ff', '#3f8fe0'], face: [60, 81, 0.75], fact: 'A sailboat has a triangle sail. The wind pushes it!' },
    { id: 'cat', name: 'cat', pts: [[18, 104], [18, 42], [32, 10], [50, 34], [70, 34], [88, 10], [102, 42], [102, 104]], c: ['#ffd2a8', '#ff9f4a'], face: [60, 70, 1.1], fact: 'A cat has two pointy ears, like two triangles. Meow!' },
  ];

  // Picture puzzles: a creature from the Hatchery (js/creature-art.js) in a little scene.
  SH.PICS = [
    { id: 'dr_ember', stage: 2, scene: 'sunset' }, { id: 'pegasus', scene: 'sky' }, { id: 'mermaid', scene: 'sea' },
    { id: 'moonrabbit', scene: 'night' }, { id: 'emberfox', scene: 'autumn' }, { id: 'dr_rainbow', stage: 1, scene: 'rainbow' },
    { id: 'frogprince', scene: 'pond' }, { id: 'griffin', scene: 'mountain' }, { id: 'dr_frost', stage: 2, scene: 'snow' },
    { id: 'starwhale', scene: 'night' }, { id: 'bubbleturtle', scene: 'sea' }, { id: 'pixie', scene: 'garden' },
    { id: 'kitsune', scene: 'autumn' }, { id: 'yeti', scene: 'snow' }, { id: 'firebird', scene: 'sunset' }, { id: 'dr_ocean', stage: 2, scene: 'sea' },
  ];
  SH.picName = (pic) => pic.name || ((MQ.EGG_CREATURES || []).find((c) => c.id === pic.id) || { name: pic.id }).name;
  const sky = (k, a, b) => `<defs><linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#${k})"/>`;
  const cloud = (x, y, s) => `<g fill="#ffffff" opacity=".92"><ellipse cx="${x}" cy="${y}" rx="${12 * s}" ry="${5 * s}"/><ellipse cx="${f1(x - 4 * s)}" cy="${f1(y - 4 * s)}" rx="${6 * s}" ry="${5 * s}"/><ellipse cx="${f1(x + 4 * s)}" cy="${f1(y - 5 * s)}" rx="${7 * s}" ry="${6 * s}"/></g>`;
  const dots = (list, r, fill) => `<g fill="${fill}">${list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  SH.SCENES = {
    sunset: (k) => sky(k, '#ffd08f', '#ff9f8c') + '<circle cx="94" cy="28" r="14" fill="#fff0b8"/><circle cx="94" cy="28" r="20" fill="#fff0b8" opacity=".3"/>' + cloud(24, 26, 1) +
      '<path d="M0 90C30 76 62 84 120 72V120H0Z" fill="#9bd27f"/><path d="M0 104C40 94 82 100 120 90V120H0Z" fill="#62ae5f"/>',
    sky: (k) => sky(k, '#86cfff', '#dff3ff') + cloud(22, 24, 1.1) + cloud(98, 16, 0.9) + cloud(102, 70, 0.8) + cloud(16, 76, 0.7) + '<path d="M0 100C34 90 80 96 120 88V120H0Z" fill="#8fd47a"/>',
    sea: (k) => sky(k, '#7fdcf0', '#2a86c6') + '<path d="M0 18C20 12 40 24 60 18S100 12 120 18V0H0Z" fill="#ffffff" opacity=".25"/>' +
      '<g fill="none" stroke="#e8fbff" stroke-width="1.2" opacity=".8"><circle cx="18" cy="40" r="3"/><circle cx="24" cy="30" r="2"/><circle cx="102" cy="48" r="3.5"/><circle cx="96" cy="36" r="2"/></g>' +
      '<path d="M10 120C6 104 16 98 10 86M18 120C16 108 24 102 20 92M108 120C104 106 114 100 110 88" fill="none" stroke="#3fae6a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M0 108C30 102 70 106 120 100V120H0Z" fill="#f2d59b"/>',
    night: (k) => sky(k, '#262b66', '#5a5fb0') + '<circle cx="96" cy="24" r="11" fill="#fff3c4"/><circle cx="92" cy="21" r="2.4" fill="#f0dd9e"/>' +
      dots([[14, 14], [34, 30], [60, 10], [76, 40], [12, 52], [108, 54], [46, 22], [24, 70]], 1, '#ffffff') + '<path d="M0 98C36 86 76 92 120 84V120H0Z" fill="#2f6b58"/>',
    autumn: (k) => sky(k, '#ffeab8', '#ffd59a') + '<rect x="10" y="62" width="4" height="30" fill="#8a5526"/><circle cx="12" cy="56" r="12" fill="#f08a3c"/><rect x="104" y="58" width="4" height="34" fill="#8a5526"/><circle cx="106" cy="50" r="13" fill="#e2553a"/>' +
      '<path d="M0 94C36 86 80 92 120 86V120H0Z" fill="#d9894a"/><path d="M0 108C40 102 84 106 120 100V120H0Z" fill="#b8693a"/>',
    rainbow: (k) => sky(k, '#e3f1ff', '#fdf0ff') + `<g fill="none" stroke-width="5" opacity=".85">${['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'].map((c, i) => `<path d="M${-6 + i * 5} 100A${66 - i * 5} ${66 - i * 5} 0 0 1 ${126 - i * 5} 100" stroke="${c}"/>`).join('')}</g>` +
      cloud(14, 96, 1) + cloud(108, 96, 1) + '<path d="M0 104C40 96 80 102 120 96V120H0Z" fill="#a4e58f"/>',
    pond: (k) => sky(k, '#c4ecff', '#eaf8ff') + '<path d="M0 74C30 70 90 70 120 74V120H0Z" fill="#9bd27f"/><ellipse cx="60" cy="100" rx="58" ry="17" fill="#59b8de"/>' +
      '<path d="M8 76V52M112 76V50" stroke="#3f8f4a" stroke-width="2" stroke-linecap="round"/><ellipse cx="8" cy="52" rx="2" ry="5" fill="#8a5526"/><ellipse cx="112" cy="50" rx="2" ry="5" fill="#8a5526"/>',
    mountain: (k) => sky(k, '#a6d6ff', '#e6f4ff') + cloud(26, 20, 0.9) + '<path d="M-10 92L28 40L66 92Z" fill="#9aa8c4"/><path d="M28 40L18 54L24 52L28 58L33 52L38 54Z" fill="#ffffff"/><path d="M50 92L94 30L134 92Z" fill="#8494b5"/><path d="M94 30L82 47L89 45L94 51L99 45L106 47Z" fill="#ffffff"/>' +
      '<path d="M0 96C36 88 80 94 120 88V120H0Z" fill="#8fcf7a"/>',
    snow: (k) => sky(k, '#bfe3ff', '#eef8ff') + dots([[12, 14], [30, 34], [52, 12], [78, 26], [100, 12], [110, 40], [20, 60], [96, 64], [64, 44]], 1.6, '#ffffff') +
      '<path d="M0 92C32 80 70 88 120 78V120H0Z" fill="#ffffff"/><path d="M0 106C40 98 84 104 120 96V120H0Z" fill="#e3effb"/>',
    garden: (k) => sky(k, '#d8f3ff', '#f3fbff') + cloud(96, 20, 0.9) + '<path d="M0 92C36 84 80 90 120 84V120H0Z" fill="#8fd47a"/>' +
      [[14, 100, '#ff8fb1'], [32, 108, '#ffd23f'], [96, 102, '#b79bff'], [110, 112, '#ff8fb1']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.5" fill="#fff3a6"/>`).join(''),
  };
  // The picture (the inside of an SVG with viewBox 0 0 120 120): a Hatchery creature on its scene, an emoji picture,
  // or a Legendary one (the last two are drawn in js/puzzle-art.js).
  SH.picArt = (pic) => (pic.kind === 'emoji' ? SH.emojiArt(pic) : pic.kind === 'legend' ? SH.legendArt(pic)
    : SH.SCENES[pic.scene]('sp' + (++uid).toString(36)) + MQ.art(pic.id, { stage: pic.stage }).replace('<svg class="art"', '<svg x="8" y="10" width="104" height="104"'));

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
  SH.GRID = { 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3], 16: [4, 4], 20: [5, 4] };
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
  // Pieces of a picture (shape = null) or of a shape. Only cells that hold some of the shape are pieces, and a knob on the shape's border
  // always belongs to the piece inside, so no piece has a bite missing.
  SH.cut = (n, shape) => {
    const [cols, rows] = SH.GRID[n], W = 120 / cols, H = 120 / rows, T = Math.min(W, H);
    const cov = shape ? SH.coverage(n, shape) : U.range(1, cols * rows).map(() => 1); // a picture fills the board
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
      const tip = shape && shape.pts.some(([x, y]) => x >= c * W && x < (c + 1) * W && y >= r * H && y < (r + 1) * H); // a sharp point too thin to sample
      if (inc(r, c) || !(cov[r * cols + c] || tip)) continue;
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

  // ---------------------------------------------------------------- the album, the packs, stars, the puzzle of the day
  // st.puzzles = {
  //   n: pieces in a jigsaw (4 … 20),
  //   done:  { 'pic:<id>' | 'shape:<id>' | 'build:<id>' | 'dots:<id>': times finished },
  //   stars: { key: best stars } — a jigsaw in 4–6 pieces ★, 9–12 ★★, 16–20 ★★★ (Build It and Dot to Dot have none),
  //   packs: { packId: date bought }, gold: { key: true } — finished as a golden puzzle,
  //   daily: { last: date, streak, best } — the puzzle of the day
  // }
  // 'pic:<id>' is a picture finished in any of the three picture puzzles.
  SH.PACKS = [{ id: 'free', icon: '🐉', name: 'Hatchery Pictures', price: 0 }]; // js/puzzle-art.js adds the rest
  SH.reindex = () => {
    SH.picById = {};
    for (const p of SH.PICS) SH.picById[p.id] = p;
    SH.ITEMS = [...SH.PICS.map((p) => 'pic:' + p.id), ...SH.SHAPES.map((s) => 'shape:' + s.id), ...SH.FIGS.map((f) => 'build:' + f.id), ...SH.DOTS.map((d) => 'dots:' + d.id)];
    SH.FREE = SH.ITEMS.filter((k) => !k.startsWith('pic:') || !SH.pack(SH.picById[k.slice(4)].pack).price);
  };
  SH.pack = (id) => SH.PACKS.find((P) => P.id === (id || 'free')) || SH.PACKS[0];
  SH.ensure = (st) => {
    const pz = (st.puzzles = st.puzzles || {});
    if (!SH.GRID[pz.n]) pz.n = 6;
    for (const k of ['done', 'stars', 'packs', 'gold']) pz[k] = pz[k] || {};
    pz.daily = Object.assign({ last: '', streak: 0, best: 0 }, pz.daily);
    return pz;
  };
  const doneOf = (st) => (st.puzzles || {}).done || {};
  SH.count = (st) => SH.ITEMS.filter((k) => doneOf(st)[k]).length;
  SH.total = () => SH.ITEMS.length;
  SH.countFree = (st) => SH.FREE.filter((k) => doneOf(st)[k]).length;
  SH.REWARD = { right: 1, done: 3, fresh: 5, guess: 1, daily: 5 }; // 💎 for a first-try answer, a finished puzzle, a new one for the album, each cloud left when Who's hiding? is guessed, the puzzle of the day
  SH.GOLD_CHANCE = 1 / 8; // a picture puzzle comes up golden: double crystals
  SH.LEGEND_MIN = 9; // a Legendary picture has at least this many pieces
  SH.starsFor = (n) => (n >= 16 ? 3 : n >= 9 ? 2 : 1);

  // Packs: free ones, ones bought with crystals, and seasonal ones that are free in their season (MM-DD to MM-DD).
  SH.inSeason = (P, day = U.dateKey()) => {
    if (!P.season) return false;
    const md = day.slice(5), [a, b] = P.season;
    return a <= b ? md >= a && md <= b : md >= a || md <= b;
  };
  SH.hasPack = (st, P, day) => !P.price || !!SH.ensure(st).packs[P.id] || SH.inSeason(P, day);
  SH.owns = (st, pic, day) => SH.hasPack(st, SH.pack(pic.pack), day);
  // Buy a pack; false when it is already owned for good or there aren't enough crystals.
  SH.buy = (st, id, day = U.dateKey()) => {
    const P = SH.PACKS.find((x) => x.id === id), pz = SH.ensure(st);
    if (!P || !P.price || pz.packs[id] || st.crystals < P.price) return false;
    st.crystals -= P.price;
    pz.packs[id] = day;
    return true;
  };
  SH.packPics = (id) => SH.PICS.filter((p) => (p.pack || 'free') === id);
  // Pictures the picture puzzles pick from: everything owned except the Legendary ones (they are played from their pack).
  SH.pool = (st, day) => SH.PICS.filter((p) => p.kind !== 'legend' && SH.owns(st, p, day));

  // Mark a puzzle finished. o.n: pieces (stars), o.gold: a golden puzzle. Returns what is new: { fresh, stars, more, gold }.
  SH.finish = (st, key, o = {}) => {
    const pz = SH.ensure(st), fresh = !pz.done[key];
    pz.done[key] = (pz.done[key] || 0) + 1;
    const stars = o.n ? SH.starsFor(o.n) : 0, more = stars > (pz.stars[key] || 0);
    if (more) pz.stars[key] = stars;
    const gold = !!o.gold && !pz.gold[key];
    if (o.gold) pz.gold[key] = true;
    return { fresh, stars, more, gold };
  };
  // The next dot-to-dot surprise: one not found yet, else any but the one just played.
  SH.nextDots = (st, last) => {
    const done = SH.ensure(st).done;
    const notYet = SH.DOTS.filter((d) => !done['dots:' + d.id] && d.id !== last);
    return U.pick(notYet.length ? notYet : SH.DOTS.filter((d) => d.id !== last));
  };
  // The next picture puzzle: an owned picture not finished yet, else any owned one but the one just played.
  SH.nextPic = (st, last, day) => {
    const done = SH.ensure(st).done, pool = SH.pool(st, day);
    const notYet = pool.filter((p) => !done['pic:' + p.id] && p.id !== last);
    return U.pick(notYet.length ? notYet : pool.filter((p) => p.id !== last));
  };
  // The puzzle of the day: the same for the whole day (it depends on the date and the explorer), from every pack —
  // a taste of the packs not bought yet — and a different picture puzzle each day.
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; return h; };
  SH.daily = (st, day = U.dateKey()) => {
    const list = SH.PICS.filter((p) => p.kind !== 'legend'), h = hash(day + '|' + (st.id || ''));
    return { pic: list[h % list.length], mode: ['snap', 'find', 'hide'][(h >>> 8) % 3], day };
  };
  SH.dailyDone = (st, day = U.dateKey()) => SH.ensure(st).daily.last === day;
  // The puzzle of the day finished: a day streak like the Daily Quest (a missed day starts it over).
  SH.finishDaily = (st, day = U.dateKey()) => {
    const d = SH.ensure(st).daily;
    if (d.last === day) return false;
    d.streak = d.last && U.daysBetween(d.last, day) === 1 ? d.streak + 1 : 1;
    d.best = Math.max(d.best, d.streak);
    d.last = day;
    return true;
  };
  SH.find = (key) => {
    const [mode, id] = String(key).split(':');
    if (['snap', 'find', 'hide'].includes(mode)) return { mode, item: SH.picById[id] || null };
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

  SH.reindex();
  MQ.shapes = SH;
})();
