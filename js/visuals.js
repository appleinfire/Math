// SVG / HTML pictures used inside problems: clocks, coins, base-ten blocks, shapes,
// fraction models, rulers, graphs, arrays. Every function returns a markup string.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const V = {};
  const INK = '#22304f';
  const FONT = "Nunito, 'Trebuchet MS', sans-serif";
  const FILLS = ['#5cc8b8', '#ffb547', '#ff7e6b', '#8c9cff', '#7fd36b', '#f58fc8'];
  const r1 = (x) => Math.round(x * 10) / 10;
  const rad = (deg) => (deg * Math.PI) / 180;
  const svg = (w, h, body, cls = '', label = '') =>
    `<svg class="vis ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const text = (x, y, t, size = 14, extra = '') =>
    `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-family="${FONT}" font-weight="800" fill="${INK}" text-anchor="middle" ${extra}>${t}</text>`;
  V.FILLS = FILLS;

  // ---------- Clock ----------
  V.clock = (h, m) => {
    const c = 100;
    let s = `<circle cx="100" cy="100" r="93" fill="#ffffff" stroke="${INK}" stroke-width="6"/>`;
    for (let i = 0; i < 60; i++) {
      const a = rad(i * 6);
      const big = i % 5 === 0;
      const ra = big ? 78 : 83, rb = 88;
      s += `<line x1="${r1(c + ra * Math.sin(a))}" y1="${r1(c - ra * Math.cos(a))}" x2="${r1(c + rb * Math.sin(a))}" y2="${r1(c - rb * Math.cos(a))}" stroke="${INK}" stroke-width="${big ? 3 : 1.2}" stroke-linecap="round"/>`;
    }
    for (let n = 1; n <= 12; n++) {
      const a = rad(n * 30);
      s += text(c + 63 * Math.sin(a), c - 63 * Math.cos(a) + 7, n, 20);
    }
    const hand = (deg, len, w, color) => {
      const a = rad(deg);
      return `<line x1="100" y1="100" x2="${r1(c + len * Math.sin(a))}" y2="${r1(c - len * Math.cos(a))}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    };
    s += hand(((h % 12) + m / 60) * 30, 44, 8, INK);
    s += hand(m * 6, 73, 4.5, '#ff6b5b');
    s += `<circle cx="100" cy="100" r="7" fill="${INK}"/><circle cx="100" cy="100" r="2.5" fill="#ffffff"/>`;
    return svg(200, 200, s, 'clock', 'analog clock');
  };

  // ---------- Coins & bills ----------
  const COIN = {
    p: { v: 1, r: 19, fill: '#cf8a55', stroke: '#8e5530', name: 'penny' },
    n: { v: 5, r: 22, fill: '#c9ced6', stroke: '#7f8792', name: 'nickel' },
    d: { v: 10, r: 17, fill: '#e1e5ea', stroke: '#8f97a2', name: 'dime' },
    q: { v: 25, r: 25, fill: '#d2d7de', stroke: '#7a828e', name: 'quarter' },
    b: { v: 100, name: 'dollar' },
  };
  V.COIN = COIN;
  V.coins = (list, showValues = true) => {
    const maxW = 360;
    let x = 6, y = 6, rowH = 58, items = '', w = 0;
    for (const k of list) {
      const c = COIN[k];
      const iw = k === 'b' ? 100 : c.r * 2 + 10;
      if (x + iw > maxW) { x = 6; y += rowH; }
      if (k === 'b') {
        items += `<rect x="${x}" y="${y + 4}" width="94" height="46" rx="5" fill="#cfe7c6" stroke="#4d7d48" stroke-width="2.5"/>` +
          `<ellipse cx="${x + 47}" cy="${y + 27}" rx="14" ry="16" fill="#e6f3df" stroke="#4d7d48" stroke-width="1.5"/>` +
          text(x + 47, y + 33, '$1', 16, 'fill="#2f5a2b"') + text(x + 12, y + 18, '1', 10, 'fill="#2f5a2b"') + text(x + 82, y + 46, '1', 10, 'fill="#2f5a2b"');
      } else {
        const cx = x + c.r + 5, cy = y + 27;
        items += `<circle cx="${cx}" cy="${cy}" r="${c.r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5"/>` +
          `<circle cx="${cx}" cy="${cy}" r="${c.r - 4}" fill="none" stroke="${c.stroke}" stroke-width="1" stroke-dasharray="2 2"/>`;
        items += showValues
          ? text(cx, cy + 5, c.v + '¢', c.r > 20 ? 14 : 12)
          : text(cx, cy + 4, c.name.toUpperCase(), c.r > 20 ? 9 : 7.5);
      }
      x += iw;
      w = Math.max(w, x);
    }
    return svg(Math.max(w + 6, 60), y + rowH, items, 'coins', 'coins');
  };

  // ---------- Base-ten blocks ----------
  V.blocks = (h, t, o) => {
    const u = 7, H = 10 * u;
    let x = 6, s = '';
    for (let i = 0; i < h; i++) {
      s += `<rect x="${x}" y="6" width="${H}" height="${H}" fill="#79c6ea" stroke="${INK}" stroke-width="1.5"/>`;
      for (let k = 1; k < 10; k++) {
        s += `<line x1="${x + k * u}" y1="6" x2="${x + k * u}" y2="${6 + H}" stroke="${INK}" stroke-width="0.4"/>` +
          `<line x1="${x}" y1="${6 + k * u}" x2="${x + H}" y2="${6 + k * u}" stroke="${INK}" stroke-width="0.4"/>`;
      }
      x += H + 8;
    }
    if (h) x += 4;
    for (let i = 0; i < t; i++) {
      s += `<rect x="${x}" y="6" width="${u}" height="${H}" fill="#ffc94d" stroke="${INK}" stroke-width="1.3"/>`;
      for (let k = 1; k < 10; k++) s += `<line x1="${x}" y1="${6 + k * u}" x2="${x + u}" y2="${6 + k * u}" stroke="${INK}" stroke-width="0.4"/>`;
      x += u + 5;
    }
    if (t) x += 6;
    for (let i = 0; i < o; i++) {
      const col = Math.floor(i / 5), row = i % 5;
      s += `<rect x="${x + col * (u + 5)}" y="${6 + H - (row + 1) * (u + 5) + 5}" width="${u}" height="${u}" fill="#ff8c78" stroke="${INK}" stroke-width="1.2"/>`;
    }
    if (o) x += Math.ceil(o / 5) * (u + 5);
    return svg(Math.max(x + 6, 40), H + 12, s, 'blocks', 'base ten blocks');
  };

  // ---------- Dots in pairs (odd / even) ----------
  V.pairs = (n) => {
    const cols = Math.ceil(n / 2), sp = 28;
    let s = '';
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / 2), row = i % 2;
      s += `<circle cx="${18 + col * sp}" cy="${18 + row * sp}" r="10" fill="${FILLS[0]}" stroke="${INK}" stroke-width="2"/>`;
    }
    return svg(cols * sp + 10, 64, s, 'pairs', n + ' dots');
  };

  // ---------- Arrays ----------
  V.array = (rows, cols) => {
    const sp = 30;
    let s = '';
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const fill = FILLS[r % FILLS.length];
        s += `<circle cx="${20 + c * sp}" cy="${20 + r * sp}" r="11" fill="${fill}" stroke="${INK}" stroke-width="2"/>`;
      }
    return svg(cols * sp + 10, rows * sp + 10, s, 'array', rows + ' rows of ' + cols);
  };

  // ---------- Equal groups ----------
  V.groups = (g, k, emoji) => {
    let s = '<div class="vis groups">';
    for (let i = 0; i < g; i++) s += `<div class="group">${Array(k).fill(`<span>${emoji}</span>`).join('')}</div>`;
    return s + '</div>';
  };

  // ---------- Shapes ----------
  const poly = (pts, fill) =>
    `<polygon points="${pts.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  const regular = (n, R, rot, jitter) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rad(rot + (360 / n) * i + (jitter ? (Math.random() - 0.5) * 18 : 0));
      const rr = R * (jitter ? 0.72 + Math.random() * 0.28 : 1);
      pts.push([90 + rr * Math.sin(a), 90 - rr * Math.cos(a)]);
    }
    return pts;
  };
  V.shape = (kind, opts = {}) => {
    const fill = opts.fill || MQ.U.pick(FILLS);
    const rot = opts.rotate ? Math.random() * 360 : 0;
    const jit = !!opts.irregular;
    let s = '';
    const rotPts = (pts) => {
      if (!opts.rotate) return pts;
      const a = rad(MQ.U.rnd(-25, 25));
      return pts.map(([x, y]) => [90 + (x - 90) * Math.cos(a) - (y - 90) * Math.sin(a), 90 + (x - 90) * Math.sin(a) + (y - 90) * Math.cos(a)]);
    };
    switch (kind) {
      case 'circle': s = `<circle cx="90" cy="90" r="62" fill="${fill}" stroke="${INK}" stroke-width="4"/>`; break;
      case 'square': s = poly(rotPts([[35, 35], [145, 35], [145, 145], [35, 145]]), fill); break;
      case 'rectangle': s = poly(rotPts([[18, 52], [162, 52], [162, 128], [18, 128]]), fill); break;
      case 'rhombus': s = poly(rotPts([[90, 18], [150, 90], [90, 162], [30, 90]]), fill); break;
      case 'trapezoid': s = poly(rotPts([[55, 50], [125, 50], [165, 132], [15, 132]]), fill); break;
      case 'triangle': s = poly(regular(3, 72, rot, jit).map(([x, y]) => [x, y + 10]), fill); break;
      case 'pentagon': s = poly(regular(5, 70, rot, jit), fill); break;
      case 'hexagon': s = poly(regular(6, 70, rot, jit), fill); break;
      case 'octagon': s = poly(regular(8, 70, rot, jit), fill); break;
      default: s = poly(regular(opts.n || 5, 70, rot, jit), fill);
    }
    return svg(180, 180, s, 'shape', kind);
  };

  V.cube = () => {
    const s =
      `<polygon points="40,60 110,60 110,130 40,130" fill="#79c6ea" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<polygon points="40,60 75,30 145,30 110,60" fill="#a8dcf2" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<polygon points="110,60 145,30 145,100 110,130" fill="#4fa9d1" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<polyline points="40,130 75,100 145,100" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 5"/>` +
      `<line x1="75" y1="30" x2="75" y2="100" stroke="${INK}" stroke-width="2" stroke-dasharray="5 5"/>`;
    return svg(180, 160, s, 'shape', 'cube');
  };

  // ---------- Fraction models ----------
  V.fraction = (n, k, style = 'bar', fill = '#ffb547') => {
    let s = '';
    if (style === 'circle') {
      const cx = 90, cy = 90, R = 70;
      if (n === 1) s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${k ? fill : '#ffffff'}" stroke="${INK}" stroke-width="4"/>`;
      for (let i = 0; i < n && n > 1; i++) {
        const a0 = rad((360 / n) * i), a1 = rad((360 / n) * (i + 1));
        const x0 = cx + R * Math.sin(a0), y0 = cy - R * Math.cos(a0), x1 = cx + R * Math.sin(a1), y1 = cy - R * Math.cos(a1);
        const large = 360 / n > 180 ? 1 : 0;
        s += `<path d="M${cx},${cy} L${r1(x0)},${r1(y0)} A${R},${R} 0 ${large} 1 ${r1(x1)},${r1(y1)} Z" fill="${i < k ? fill : '#ffffff'}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
      }
      return svg(180, 180, s, 'shape', k + ' of ' + n + ' parts shaded');
    }
    const W = 240, H = 80, w = W / n;
    for (let i = 0; i < n; i++)
      s += `<rect x="${r1(10 + i * w)}" y="10" width="${r1(w)}" height="${H}" fill="${i < k ? fill : '#ffffff'}" stroke="${INK}" stroke-width="3.5"/>`;
    return svg(W + 20, H + 20, s, 'fracbar', k + ' of ' + n + ' parts shaded');
  };

  // ---------- Grid of squares (partition / area) ----------
  V.grid = (rows, cols, fill = '#8c9cff') => {
    const u = Math.min(36, Math.floor(260 / Math.max(rows, cols)));
    let s = `<rect x="8" y="8" width="${cols * u}" height="${rows * u}" fill="${fill}" stroke="${INK}" stroke-width="4"/>`;
    for (let c = 1; c < cols; c++) s += `<line x1="${8 + c * u}" y1="8" x2="${8 + c * u}" y2="${8 + rows * u}" stroke="${INK}" stroke-width="2"/>`;
    for (let r = 1; r < rows; r++) s += `<line x1="8" y1="${8 + r * u}" x2="${8 + cols * u}" y2="${8 + r * u}" stroke="${INK}" stroke-width="2"/>`;
    return svg(cols * u + 16, rows * u + 16, s, 'grid', rows + ' by ' + cols + ' grid');
  };

  // ---------- Rectangle with side labels (perimeter) ----------
  V.rectSides = (w, h, unit) => {
    const sc = Math.min(200 / w, 110 / h, 28);
    const W = w * sc, H = h * sc, x = 60, y = 30;
    const s =
      `<rect x="${x}" y="${y}" width="${r1(W)}" height="${r1(H)}" fill="#a6e3d8" stroke="${INK}" stroke-width="4"/>` +
      text(x + W / 2, y - 9, w + ' ' + unit, 15) +
      text(x + W / 2, y + H + 22, w + ' ' + unit, 15) +
      text(x - 30, y + H / 2 + 5, h + ' ' + unit, 15) +
      text(x + W + 30, y + H / 2 + 5, h + ' ' + unit, 15);
    return svg(r1(W + 120), r1(H + 62), s, 'shape', 'rectangle');
  };

  V.polySides = (sides, unit) => {
    const n = sides.length;
    const pts = regular(n, 72, n === 4 ? 45 : 0, false).map(([px, py]) => [px + 30, py + 20]);
    let s = poly(pts, '#ffd58a');
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const dx = mx - 120, dy = my - 110, d = Math.hypot(dx, dy) || 1;
      s += text(mx + (dx / d) * 24, my + (dy / d) * 24 + 5, sides[i] + ' ' + unit, 14);
    }
    return svg(240, 220, s, 'shape', 'shape with labeled sides');
  };

  // ---------- Ruler ----------
  V.ruler = ({ unit = 'in', max = 7, start = 0, len = 3, guides = true, color = '#ff7e6b' }) => {
    const px = unit === 'in' ? 46 : 26;
    const x0 = 18, W = max * px;
    const a = x0 + start * px, b = x0 + (start + len) * px;
    let s = '';
    // the object: a pencil / crayon shape
    s += `<rect x="${a}" y="16" width="${b - a - 16}" height="26" rx="4" fill="${color}" stroke="${INK}" stroke-width="2.5"/>` +
      `<polygon points="${b - 16},16 ${b},29 ${b - 16},42" fill="#f6d9a8" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<rect x="${a}" y="16" width="10" height="26" rx="3" fill="#f58fc8" stroke="${INK}" stroke-width="2.5"/>`;
    if (guides) {
      s += `<line x1="${a}" y1="44" x2="${a}" y2="62" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
        `<line x1="${b}" y1="31" x2="${b}" y2="62" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    }
    s += `<rect x="${x0 - 12}" y="62" width="${W + 24}" height="52" rx="4" fill="#ffe7a3" stroke="${INK}" stroke-width="2.5"/>`;
    const sub = unit === 'in' ? 4 : 2;
    for (let i = 0; i <= max * sub; i++) {
      const x = x0 + (i * px) / sub;
      const major = i % sub === 0;
      const tl = major ? 20 : unit === 'in' && i % 2 === 0 ? 13 : 8;
      s += `<line x1="${r1(x)}" y1="62" x2="${r1(x)}" y2="${62 + tl}" stroke="${INK}" stroke-width="${major ? 2 : 1.2}"/>`;
      if (major) s += text(x, 104, i / sub, 13);
    }
    s += text(x0 + W - 4, 76, unit === 'in' ? 'inches' : 'cm', 10, 'text-anchor="end" font-weight="700"');
    return svg(W + 36, 122, s, 'ruler', 'ruler');
  };

  // ---------- Bar graph ----------
  V.barGraph = (data, { step = 1, title = '' } = {}) => {
    const maxV = Math.max(...data.map((d) => d.value));
    const top = Math.ceil((maxV + step * 0.01) / step) * step + (maxV % step === 0 ? step : 0);
    const L = 44, T = 12, PW = 300, PH = 170;
    let s = '';
    const lines = top / step;
    const labelEvery = lines > 10 ? 2 : 1;
    for (let i = 0; i <= lines; i++) {
      const y = T + PH - (PH * i) / lines;
      s += `<line x1="${L}" y1="${r1(y)}" x2="${L + PW}" y2="${r1(y)}" stroke="#c7d0e0" stroke-width="1"/>`;
      if (i % labelEvery === 0) s += text(L - 8, y + 4, i * step, 11, 'text-anchor="end"');
    }
    const n = data.length, bw = (PW / n) * 0.56;
    data.forEach((d, i) => {
      const cx = L + (PW / n) * (i + 0.5);
      const h = (PH * d.value) / top;
      s += `<rect x="${r1(cx - bw / 2)}" y="${r1(T + PH - h)}" width="${r1(bw)}" height="${r1(h)}" rx="3" fill="${FILLS[i % FILLS.length]}" stroke="${INK}" stroke-width="2"/>`;
      s += `<text x="${r1(cx)}" y="${T + PH + 26}" font-size="22" text-anchor="middle">${d.emoji}</text>`;
      s += text(cx, T + PH + 44, d.label, 11, 'font-weight="700"');
    });
    s += `<line x1="${L}" y1="${T}" x2="${L}" y2="${T + PH}" stroke="${INK}" stroke-width="2"/><line x1="${L}" y1="${T + PH}" x2="${L + PW}" y2="${T + PH}" stroke="${INK}" stroke-width="2"/>`;
    return (title ? `<div class="vis-title">${title}</div>` : '') + svg(L + PW + 12, T + PH + 52, s, 'bargraph', 'bar graph');
  };

  // ---------- Picture graph (HTML) ----------
  V.picGraph = (data, { per = 1, title = '' } = {}) => {
    let s = `<div class="vis picgraph">${title ? `<div class="vis-title">${title}</div>` : ''}<table>`;
    for (const d of data) {
      s += `<tr><th>${d.label}</th><td>${Array(Math.round(d.value / per)).fill(`<span>${d.emoji}</span>`).join('')}</td></tr>`;
    }
    s += '</table>';
    if (per > 1) s += `<div class="key">Key: each symbol = ${per}</div>`;
    return s + '</div>';
  };

  // ---------- Column arithmetic ----------
  V.column = (nums, op) => {
    const w = Math.max(...nums.map((n) => String(n).length));
    let s = '<div class="vis column">';
    nums.forEach((n, i) => {
      s += `<span class="op">${i === nums.length - 1 ? op : ''}</span><span class="num">${String(n).padStart(w, ' ')}</span>`;
    });
    s += `<span class="rule"></span><span class="op"></span><span class="num ans">${'?'.padStart(w, ' ')}</span></div>`;
    return s;
  };

  // ---------- Number pyramid ----------
  V.pyramid = (rows) => {
    // rows: array from top to bottom, entries number or null (= ?)
    let s = '<div class="vis pyramid">';
    for (const row of rows) {
      s += '<div class="prow">' + row.map((v) => `<span class="${v === null ? 'pq' : ''}">${v === null ? '?' : v}</span>`).join('') + '</div>';
    }
    return s + '</div>';
  };

  V.magic = (grid) => {
    let s = '<div class="vis magic">';
    // null = the asked box (highlighted), '' = another hidden box
    for (const v of grid) s += `<span class="${v === null ? 'pq' : v === '' ? 'ph' : ''}">${v === null || v === '' ? '?' : v}</span>`;
    return s + '</div>';
  };

  // ---------- Number line ----------
  // labels: values to print under the line (only the ends, so kids still have to count).
  // marker: an arrow pointing at a value. pick: every tick can be tapped (data-act="tick").
  // chosen / correct: dots drawn on a tick (the child's choice, the right answer).
  V.numberLine = ({ min, max, step = 1, labels, marker = null, pick = false, chosen = null, correct = null }) => {
    const n = Math.round((max - min) / step), L = 22, W = 340, y = 58;
    const px = (W - 2 * L) / n;
    const X = (v) => L + ((v - min) / step) * px;
    const lab = labels || [min, max];
    let s = `<line x1="${L - 12}" y1="${y}" x2="${W - L + 12}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      `<polygon points="${W - L + 16},${y} ${W - L + 8},${y - 6} ${W - L + 8},${y + 6}" fill="${INK}"/>` +
      `<polygon points="${L - 16},${y} ${L - 8},${y - 6} ${L - 8},${y + 6}" fill="${INK}"/>`;
    for (let i = 0; i <= n; i++) {
      const v = min + i * step, x = X(v), big = lab.includes(v);
      s += `<line x1="${r1(x)}" y1="${y - (big ? 12 : 8)}" x2="${r1(x)}" y2="${y + (big ? 12 : 8)}" stroke="${INK}" stroke-width="${big ? 3 : 2}"/>`;
      if (big) s += text(x, y + 34, v, 15);
    }
    if (marker !== null) {
      const x = X(marker);
      s += `<line x1="${r1(x)}" y1="${y - 40}" x2="${r1(x)}" y2="${y - 16}" stroke="#ff6b5b" stroke-width="4" stroke-linecap="round"/><polygon points="${r1(x - 8)},${y - 22} ${r1(x + 8)},${y - 22} ${r1(x)},${y - 12}" fill="#ff6b5b"/>`;
    }
    if (correct !== null) s += `<circle cx="${r1(X(correct))}" cy="${y}" r="10" fill="#23955a" stroke="${INK}" stroke-width="2"/>`;
    if (chosen !== null && chosen !== correct) s += `<circle cx="${r1(X(chosen))}" cy="${y}" r="9" fill="#ff6b5b" stroke="${INK}" stroke-width="2"/>`;
    if (pick) for (let i = 0; i <= n; i++) {
      const v = min + i * step;
      s += `<rect class="tickhit" data-act="tick" data-arg="${v}" x="${r1(X(v) - px / 2)}" y="${y - 30}" width="${r1(px)}" height="60" fill="#ffffff" fill-opacity="0"><title>${v}</title></rect>`;
    }
    return svg(W, 100, s, 'numline', 'number line from ' + min + ' to ' + max);
  };

  // ================= Puzzle pictures (Math Kangaroo style) =================
  // A shape made of unit squares. cells = [[row, col], …].
  V.cellShape = (cells, { size = 34, fill = '#8c9cff', line = null } = {}) => {
    const rows = Math.max(...cells.map((c) => c[0])) + 1, cols = Math.max(...cells.map((c) => c[1])) + 1;
    let s = cells.map(([r, c]) => `<rect x="${6 + c * size}" y="${6 + r * size}" width="${size}" height="${size}" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`).join('');
    let W = cols * size + 12;
    if (line === 'right') { // a dotted mirror line to the right of the shape
      s += `<line x1="${W + 8}" y1="0" x2="${W + 8}" y2="${rows * size + 12}" stroke="#ff6b5b" stroke-width="3" stroke-dasharray="6 5"/>`;
      W += 16;
    }
    return svg(W, rows * size + 12, s, 'cells', 'shape made of squares');
  };
  // A triangle cut by lines from the top corner into `parts` pieces.
  V.fan = (parts) => {
    const A = [130, 14], L = [14, 176], R = [246, 176];
    let s = `<polygon points="${A} ${L} ${R}" fill="#ffd58a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    for (let i = 1; i < parts; i++) {
      const x = L[0] + ((R[0] - L[0]) * i) / parts;
      s += `<line x1="${A[0]}" y1="${A[1]}" x2="${r1(x)}" y2="${L[1]}" stroke="${INK}" stroke-width="3"/>`;
    }
    return svg(260, 190, s, 'shape', 'triangle cut into parts');
  };
  // A balance scale in equilibrium with emoji on each pan.
  V.scale = (left, right) => {
    const pan = (cx, items) => {
      const t = items.join('');
      return `<path d="M${cx - 62},96 Q${cx},132 ${cx + 62},96 Z" fill="#cfd8e3" stroke="${INK}" stroke-width="3"/>` +
        `<line x1="${cx - 56}" y1="96" x2="${cx}" y2="40" stroke="${INK}" stroke-width="1.5"/><line x1="${cx + 56}" y1="96" x2="${cx}" y2="40" stroke="${INK}" stroke-width="1.5"/>` +
        `<text x="${cx}" y="90" font-size="${items.length > 4 ? 18 : 24}" text-anchor="middle">${t}</text>`;
    };
    const s = `<rect x="146" y="40" width="8" height="120" fill="${INK}"/><rect x="110" y="158" width="80" height="10" rx="4" fill="${INK}"/>` +
      `<line x1="70" y1="40" x2="230" y2="40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="150" cy="40" r="7" fill="#ffb547" stroke="${INK}" stroke-width="2"/>` +
      pan(70, left) + pan(230, right);
    return svg(300, 172, s, 'scale', 'balance scale');
  };
  // A street grid: A at the bottom left, B at the top right.
  V.pathGrid = (rows, cols) => {
    const u = Math.min(56, Math.floor(240 / Math.max(rows, cols))), x0 = 26, y0 = 18;
    let s = '';
    for (let r = 0; r <= rows; r++) s += `<line x1="${x0}" y1="${y0 + r * u}" x2="${x0 + cols * u}" y2="${y0 + r * u}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    for (let c = 0; c <= cols; c++) s += `<line x1="${x0 + c * u}" y1="${y0}" x2="${x0 + c * u}" y2="${y0 + rows * u}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="${x0}" cy="${y0 + rows * u}" r="12" fill="#ff6b5b" stroke="${INK}" stroke-width="2"/>` + text(x0, y0 + rows * u + 5, 'A', 13, 'fill="#ffffff"');
    s += `<circle cx="${x0 + cols * u}" cy="${y0}" r="12" fill="#2bb3a3" stroke="${INK}" stroke-width="2"/>` + text(x0 + cols * u, y0 + 5, 'B', 13, 'fill="#ffffff"');
    return svg(x0 * 2 + cols * u, y0 * 2 + rows * u, s, 'grid', 'grid of streets from A to B');
  };
  // Towers of cubes, drawn in 3D. back / front = tower heights per column (front row may be omitted).
  V.towers = (back, front = []) => {
    const s0 = 30, dx = 15, dy = 15, cols = back.length, maxH = Math.max(...back, ...front, 1);
    const W = cols * s0 + dx * 2 + 24, H = maxH * s0 + dy * 2 + 24, base = H - 10;
    const cube = (x, y, color) =>
      `<polygon points="${x},${y} ${x + dx},${y - dy} ${x + dx + s0},${y - dy} ${x + s0},${y}" fill="#d9f1ff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="${x + s0},${y} ${x + s0 + dx},${y - dy} ${x + s0 + dx},${y - dy + s0} ${x + s0},${y + s0}" fill="#5aa9d6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<rect x="${x}" y="${y}" width="${s0}" height="${s0}" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    let s = '';
    const row = (heights, off, color) => heights.forEach((h, c) => { for (let k = 0; k < h; k++) s += cube(12 + c * s0 + off, base - (k + 1) * s0 - off, color); });
    row(back, front.length ? dx : 0, '#9fd3ef');
    if (front.length) row(front, 0, '#9fd3ef');
    return svg(W, H, s, 'towers', 'towers of cubes');
  };

  // ================= CogAT-style pictures =================
  // A figure described by attributes: { shape, color, big, count, rot, dot }.
  const FIG_COLORS = { blue: '#5b63c9', red: '#ff6b5b', green: '#2bb3a3', yellow: '#ffb547', white: '#ffffff' };
  V.FIG_COLORS = FIG_COLORS;
  function figShape(shape, cx, cy, r, fill, rot) {
    const pts = (n, start) => U_range(n).map((i) => { const a = rad(start + (360 / n) * i + rot); return `${r1(cx + r * Math.sin(a))},${r1(cy - r * Math.cos(a))}`; }).join(' ');
    const st = `fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (shape) {
      case 'circle': return `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`;
      case 'square': return `<polygon points="${pts(4, 45)}" ${st}/>`;
      case 'diamond': return `<polygon points="${pts(4, 0)}" ${st}/>`;
      case 'triangle': return `<polygon points="${pts(3, 0)}" ${st}/>`;
      case 'hexagon': return `<polygon points="${pts(6, 0)}" ${st}/>`;
      case 'star': return `<polygon points="${U_range(10).map((i) => { const a = rad(36 * i + rot), rr = i % 2 ? r * 0.45 : r; return `${r1(cx + rr * Math.sin(a))},${r1(cy - rr * Math.cos(a))}`; }).join(' ')}" ${st}/>`;
      case 'arrow': { // points up when rot = 0
        const P = [[0, -1], [0.7, -0.1], [0.28, -0.1], [0.28, 1], [-0.28, 1], [-0.28, -0.1], [-0.7, -0.1]].map(([x, y]) => {
          const a = rad(rot), X = x * r, Y = y * r;
          return `${r1(cx + X * Math.cos(a) - Y * Math.sin(a))},${r1(cy + X * Math.sin(a) + Y * Math.cos(a))}`;
        });
        return `<polygon points="${P.join(' ')}" ${st}/>`;
      }
      default: return `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`;
    }
  }
  const U_range = (n) => Array.from({ length: n }, (_, i) => i);
  V.fig = (f, size = 76) => {
    const n = f.count || 1, r = (f.big === false ? 0.17 : 0.3) * size * (n > 1 ? 0.62 : 1);
    const spots = { 1: [[0.5, 0.5]], 2: [[0.3, 0.5], [0.7, 0.5]], 3: [[0.5, 0.27], [0.27, 0.72], [0.73, 0.72]], 4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]] }[n];
    let s = `<rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="8" fill="#ffffff" stroke="#d6e0e6" stroke-width="2"/>`;
    for (const [px, py] of spots) {
      s += figShape(f.shape, r1(px * size), r1(py * size), r, FIG_COLORS[f.color] || f.color, f.rot || 0);
      if (f.dot) s += `<circle cx="${r1(px * size)}" cy="${r1(py * size)}" r="${Math.max(3, r * 0.22)}" fill="${INK}"/>`;
    }
    return svg(size, size, s, 'fig', 'figure');
  };
  // 2×2 matrix: A → B, C → ?
  V.matrix2 = (a, b, c) =>
    `<div class="vis matrix2"><span>${V.fig(a)}</span><b>→</b><span>${V.fig(b)}</span><span>${V.fig(c)}</span><b>→</b><span class="mq">?</span></div>`;
  V.figRow = (figs) => `<div class="vis figrow">${figs.map((f) => V.fig(f, 70)).join('')}</div>`;
  // Abacus rods with beads; null = an empty rod with a question mark.
  V.abacus = (counts, h = 9) => {
    const w = 34, H = h * 13 + 30;
    let s = `<rect x="4" y="${H - 14}" width="${counts.length * w + 8}" height="10" rx="4" fill="#8a5a2b"/>`;
    counts.forEach((n, i) => {
      const x = 8 + i * w + w / 2;
      s += `<line x1="${x}" y1="10" x2="${x}" y2="${H - 14}" stroke="#8a5a2b" stroke-width="4"/>`;
      if (n === null) s += text(x, H / 2, '?', 22, 'fill="#ff6b5b"');
      else for (let k = 0; k < n; k++) s += `<ellipse cx="${x}" cy="${H - 22 - k * 13}" rx="13" ry="6.5" fill="${FILLS[(i % 5) + 1]}" stroke="${INK}" stroke-width="1.8"/>`;
    });
    return svg(counts.length * w + 16, H, s, 'abacus', 'abacus');
  };
  // Paper folding: a 4×4 sheet. holes = [[r, c]], fold = 'v' (left half over right) / 'h' (top over bottom) / 'q' (both).
  V.sheet = (holes, { size = 96, visible = null } = {}) => {
    const u = size / 4;
    const show = (r, c) => !visible || visible(r, c);
    let s = `<rect x="2" y="2" width="${size}" height="${size}" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>`;
    for (let i = 1; i < 4; i++) s += `<line x1="${2 + i * u}" y1="2" x2="${2 + i * u}" y2="${2 + size}" stroke="#e3e8ef" stroke-width="1"/><line x1="2" y1="${2 + i * u}" x2="${2 + size}" y2="${2 + i * u}" stroke="#e3e8ef" stroke-width="1"/>`;
    if (visible) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!show(r, c)) s += `<rect x="${2 + c * u}" y="${2 + r * u}" width="${u}" height="${u}" fill="#c9d3df"/>`;
    for (const [r, c] of holes) s += `<circle cx="${2 + c * u + u / 2}" cy="${2 + r * u + u / 2}" r="${u * 0.26}" fill="${INK}"/>`;
    return svg(size + 4, size + 4, s, 'sheet', 'sheet of paper');
  };
  V.foldSteps = (fold, holes) => {
    const vis = fold === 'v' ? (r, c) => c >= 2 : fold === 'h' ? (r, c) => r >= 2 : (r, c) => r >= 2 && c >= 2;
    const lines = fold === 'v' ? 'folded in half from left to right' : fold === 'h' ? 'folded in half from top to bottom' : 'folded in half twice';
    return `<div class="vis foldsteps"><div>${V.sheet([], { visible: null })}<small>paper</small></div><b>→</b><div>${V.sheet([], { visible: vis })}<small>${lines}</small></div><b>→</b><div>${V.sheet(holes, { visible: vis })}<small>hole punched</small></div></div>`;
  };
  // Little groups of emoji (for picture number analogies).
  V.cluster = (emoji, n) => `<span class="cluster c${Math.min(n, 9)}">${Array(n).fill(`<i>${emoji}</i>`).join('')}</span>`;

  // ================= Kindergarten pictures =================
  // A neat grid of emoji, in rows of `cols`. The last `gone` items are crossed out (take-away problems).
  V.emojis = (emoji, n, { cols = 5, gone = 0 } = {}) => {
    let s = `<div class="vis emojis" style="--cols:${Math.min(cols, Math.max(n, 1))}">`;
    for (let i = 0; i < n; i++) s += `<span class="${i >= n - gone ? 'gone' : ''}">${emoji}</span>`;
    return s + '</div>';
  };
  // Two groups joined by a sign: 🍎🍎 + 🍎🍎🍎
  V.emojiSum = (emoji, a, b, op = '+') =>
    `<div class="vis emojisum"><span class="eg">${Array(a).fill(emoji).join('')}</span><b>${op}</b><span class="eg">${Array(b).fill(emoji).join('')}</span></div>`;
  // Groups of ten in boxes, plus loose ones.
  V.tenGroups = (emoji, tens, ones) => {
    let s = '<div class="vis tengroups">';
    for (let i = 0; i < tens; i++) s += `<span class="tg">${Array(10).fill(emoji).join('')}</span>`;
    if (ones) s += `<span class="tg loose">${Array(ones).fill(emoji).join('')}</span>`;
    return s + '</div>';
  };
  // Pattern strip; null = the missing spot.
  V.strip = (items) => `<div class="vis strip">${items.map((x) => (x === null ? '<span class="pq">?</span>' : `<span>${x}</span>`)).join('')}</div>`;
  // Two rows lined up one-to-one so kids can compare by matching.
  V.compareRows = (a, ea, b, eb) =>
    `<div class="vis comparerows"><div>${Array(a).fill(`<span>${ea}</span>`).join('')}</div><div>${Array(b).fill(`<span>${eb}</span>`).join('')}</div></div>`;
  // Ten-frames: 2 × 5 boxes, filled with dots. n may go past 10 (several frames).
  V.tenFrames = (n, color = '#ff7e6b') => {
    const frames = Math.max(1, Math.ceil(n / 10)), c = 34, gap = 14;
    let s = '';
    for (let f = 0; f < frames; f++) {
      const ox = 6 + f * (5 * c + gap);
      s += `<rect x="${ox}" y="6" width="${5 * c}" height="${2 * c}" fill="#ffffff" stroke="${INK}" stroke-width="3" rx="4"/>`;
      for (let i = 1; i < 5; i++) s += `<line x1="${ox + i * c}" y1="6" x2="${ox + i * c}" y2="${6 + 2 * c}" stroke="${INK}" stroke-width="2"/>`;
      s += `<line x1="${ox}" y1="${6 + c}" x2="${ox + 5 * c}" y2="${6 + c}" stroke="${INK}" stroke-width="2"/>`;
      for (let i = 0; i < 10; i++) {
        if (f * 10 + i >= n) break;
        s += `<circle cx="${ox + (i % 5) * c + c / 2}" cy="${6 + Math.floor(i / 5) * c + c / 2}" r="11" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
      }
    }
    return svg(frames * 5 * c + (frames - 1) * gap + 12, 2 * c + 12, s, 'tenframe', n + ' dots in ten frames');
  };
  // Colored ribbons (horizontal) or towers (vertical) for longer / shorter / taller.
  V.ribbons = (list, vertical = false) => {
    let s = '';
    if (!vertical) {
      list.forEach((r, i) => { s += `<rect x="10" y="${10 + i * 40}" width="${r.len * 26}" height="24" rx="12" fill="${r.color}" stroke="${INK}" stroke-width="2.5"/>`; });
      return svg(10 + 12 * 26 + 10, list.length * 40 + 10, s, 'ribbons', 'ribbons');
    }
    list.forEach((r, i) => { const h = r.len * 16; s += `<rect x="${12 + i * 60}" y="${10 + 12 * 16 - h}" width="40" height="${h}" rx="6" fill="${r.color}" stroke="${INK}" stroke-width="2.5"/>`; });
    s += `<line x1="4" y1="${10 + 12 * 16}" x2="${list.length * 60 + 8}" y2="${10 + 12 * 16}" stroke="${INK}" stroke-width="3"/>`;
    return svg(list.length * 60 + 12, 12 * 16 + 16, s, 'ribbons', 'towers');
  };
  // A ribbon measured with a row of cubes underneath.
  V.cubeMeasure = (len, color = '#5cc8b8') => {
    const u = 28;
    let s = `<rect x="8" y="8" width="${len * u}" height="22" rx="11" fill="${color}" stroke="${INK}" stroke-width="2.5"/>`;
    for (let i = 0; i < len; i++) s += `<rect x="${8 + i * u}" y="40" width="${u}" height="${u}" fill="${FILLS[(i % 3) + 1]}" stroke="${INK}" stroke-width="2"/>`;
    return svg(len * u + 16, 40 + u + 8, s, 'cubes', 'ribbon and cubes');
  };
  // A small shape icon (used inside answer buttons and in "count the shapes" pictures).
  V.mini = (kind, size = 64, fill) => V.shape(kind, { fill: fill || FILLS[{ circle: 0, square: 3, triangle: 1, rectangle: 4, hexagon: 2, pentagon: 5 }[kind] || 0] }).replace('width="180"', `width="${size}"`);

  MQ.V = V;
})();
