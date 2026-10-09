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

  MQ.V = V;
})();
