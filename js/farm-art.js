// Pictures of the farm's Big Dreams: an orchard, a guest cottage, a railway and a castle, drawn as SVG in code.
// MQ.dreamArt(id, built, { building, ghost }) draws a dream with its first `built` stages; the next stage shows as a
// dashed outline (unless ghost: false), with scaffolding and a crane while the builders work on it (building: true). The castle is the special
// one: gold, glowing windows, flags and sparkles.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  let uid = 0;
  const f1 = (x) => +(+x).toFixed(1);
  const GHOST = ' fill="none" stroke="#9aa3b8" stroke-width="1.6" stroke-dasharray="4 3" stroke-linejoin="round"';
  // a drawing pen: on a built stage shapes are filled and outlined; on a stage still to come they are dashed outlines
  const pen = (ghost) => {
    const o = (stroke, w = 2) => (ghost ? GHOST : ` stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"`);
    const fill = (c) => (ghost ? '' : ` fill="${c}"`);
    return {
      ghost,
      P: (d, c, s, w) => `<path d="${d}"${ghost ? GHOST : fill(c) + (s ? o(s, w) : '')}/>`,
      R: (x, y, w, h, c, s, rx = 0, sw) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${ghost ? GHOST : fill(c) + (s ? o(s, sw) : '')}/>`,
      C: (x, y, r, c, s, sw) => `<circle cx="${x}" cy="${y}" r="${r}"${ghost ? GHOST : fill(c) + (s ? o(s, sw) : '')}/>`,
      E: (x, y, rx, ry, c, s, sw) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${ghost ? GHOST : fill(c) + (s ? o(s, sw) : '')}/>`,
      L: (d, c, w = 2) => (ghost ? '' : `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`),
      D: (s) => (ghost ? '' : s), // details only on built stages
    };
  };
  const spk = (x, y, r, c = '#ffffff') => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
  const lin = (id, cols, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${cols.map((c, i) => `<stop offset="${f1(i / (cols.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const glowG = (id, c) => `<radialGradient id="${id}"><stop offset="0.35" stop-color="${c}" stop-opacity="0.7"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const hill = (c1 = '#8fd36a', c2 = '#6cbf4a') => `<path d="M0 98C40 86 120 86 160 98L160 120L0 120Z" fill="${c1}"/><path d="M0 110C50 102 110 102 160 110L160 120L0 120Z" fill="${c2}"/>`;
  // builders at work: scaffolding around a box and a little crane next to it
  const scaffold = ([x, y, w, h]) => {
    const poles = [x, x + w].map((px) => `<path d="M${px} ${y + h}L${px} ${y - 4}" stroke="#a8763c" stroke-width="2.4"/>`).join('');
    const planks = [0.35, 0.7].map((k) => `<path d="M${x - 3} ${f1(y + h * k)}L${x + w + 3} ${f1(y + h * k)}" stroke="#c98a4b" stroke-width="2.6"/>`).join('');
    const cx = Math.min(150, x + w + 12), top = Math.max(6, y - 16);
    const crane = `<path d="M${cx} ${y + h}L${cx} ${top}M${cx - 26} ${top + 3}L${cx + 8} ${top + 3}M${cx} ${top}L${cx - 26} ${top + 3}M${cx - 20} ${top + 3}L${cx - 20} ${top + 16}" stroke="#f5b521" stroke-width="2.4" stroke-linecap="round"/>` +
      `<rect x="${cx - 25}" y="${top + 16}" width="10" height="7" rx="1" fill="#b9b9c6" stroke="#6f7488" stroke-width="1.2"/><rect x="${cx + 3}" y="${top + 1}" width="7" height="6" fill="#6f7488"/>`;
    return `<g class="scaffold">${poles}${planks}${crane}</g>`;
  };
  // draw a dream: parts[i] = (pen) => svg for stage i; order = the stage drawing order (back to front); box[i] = scaffold box
  function draw(D, built, building, k, ghost) {
    let out = '';
    for (const i of D.order) {
      if (i < built) out += D.parts[i](pen(false), k);
      else if (i === built && (ghost || building)) out += D.parts[i](pen(true), k);
    }
    if (building && built < D.parts.length) out += scaffold(D.box[built]);
    return out;
  }
  const svg = (body, defs = '') => `<svg class="dart" viewBox="0 0 160 120" aria-hidden="true" focusable="false">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

  // ---------------------------------------------------------------- Fruit Orchard: three rows of fruit trees
  const FRUIT = {
    apple: (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#ff4d4d" stroke="#a32020" stroke-width="0.8"/>`,
    pear: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3" fill="#ffd84d" stroke="#a87a00" stroke-width="0.8"/>`,
    peach: (x, y) => `<circle cx="${x}" cy="${y}" r="2.7" fill="#ffa07a" stroke="#c25a2a" stroke-width="0.8"/><path d="M${x} ${y - 2.6}L${x + 2} ${y - 4}" stroke="#3f8a2a" stroke-width="1.2"/>`,
  };
  const tree = (p, x, y, s, fruit) => {
    const trunk = p.P(`M${f1(x - 3 * s)} ${y}L${f1(x - 2 * s)} ${f1(y - 16 * s)}L${f1(x + 2 * s)} ${f1(y - 16 * s)}L${f1(x + 3 * s)} ${y}Z`, '#8a5a32', '#5b3a1e', 1.4);
    const crown = p.C(f1(x - 9 * s), f1(y - 22 * s), f1(10 * s), '#5cbf4a', '#2f7a3a', 1.6) + p.C(f1(x + 9 * s), f1(y - 22 * s), f1(10 * s), '#5cbf4a', '#2f7a3a', 1.6) + p.C(x, f1(y - 31 * s), f1(12 * s), '#6fd35a', '#2f7a3a', 1.6);
    const fruits = p.D([[-9, -20], [6, -27], [10, -17], [-3, -35], [-12, -28], [2, -19]].map(([dx, dy]) => FRUIT[fruit](f1(x + dx * s), f1(y + dy * s))).join(''));
    return p.D(`<ellipse cx="${x}" cy="${y + 1}" rx="${f1(12 * s)}" ry="${f1(2.5 * s)}" fill="#3f8a2a" opacity=".35"/>`) + trunk + crown + fruits;
  };
  const ORCHARD = {
    order: [0, 1, 2],
    box: [[16, 34, 128, 40], [8, 48, 140, 40], [24, 62, 130, 42]],
    parts: [
      (p) => [28, 80, 132].map((x) => tree(p, x, 74, 0.72, 'apple')).join(''),
      (p) => [18, 70, 122].map((x) => tree(p, x, 88, 0.82, 'pear')).join(''),
      (p) => [42, 94, 146].map((x) => tree(p, x, 104, 0.92, 'peach')).join('') + p.D('<rect x="4" y="104" width="22" height="10" rx="2" fill="#c98a4b" stroke="#7a4a22" stroke-width="1.2"/>' + [8, 13, 18, 23].map((x, i) => FRUIT[['apple', 'pear', 'peach', 'apple'][i]](x, 103)).join('')),
    ],
  };

  // ---------------------------------------------------------------- Guest Cottage: floor, walls, roof, garden
  const COTTAGE = {
    order: [0, 1, 2, 3],
    box: [[38, 84, 84, 14], [44, 50, 72, 40], [38, 24, 84, 32], [10, 78, 140, 22]],
    parts: [
      (p) => p.R(40, 86, 80, 11, '#b9b9c6', '#6f7488', 2) + p.D('<path d="M52 86L52 97M66 86L66 97M80 86L80 97M94 86L94 97M108 86L108 97M40 91.5L120 91.5" stroke="#8e93a6" stroke-width="1"/>') +
        p.D([[80, 101], [77, 106], [82, 111], [79, 116]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="#d9d9e3" stroke="#8e93a6" stroke-width="0.8"/>`).join('')),
      (p) => p.R(46, 52, 68, 36, '#fff1d6', '#a8763c', 0, 2) + p.P('M74 88L74 72C74 66 86 66 86 72L86 88Z', '#c06a2e', '#7a3f18', 1.6) + p.D('<circle cx="83.5" cy="79" r="1.2" fill="#ffd23f"/>') +
        p.R(52, 60, 15, 12, '#9fe0ff', '#7a4a22', 1, 1.6) + p.R(93, 60, 15, 12, '#9fe0ff', '#7a4a22', 1, 1.6) + p.L('M59.5 60L59.5 72M52 66L67 66M100.5 60L100.5 72M93 66L108 66', '#7a4a22', 1.2) +
        p.D('<rect x="51" y="72" width="17" height="4" rx="1" fill="#a8763c"/><rect x="92" y="72" width="17" height="4" rx="1" fill="#a8763c"/><circle cx="55" cy="71" r="1.8" fill="#ff6fa8"/><circle cx="60" cy="70.5" r="1.8" fill="#ffd23f"/><circle cx="65" cy="71" r="1.8" fill="#ff6fa8"/><circle cx="96" cy="71" r="1.8" fill="#b48cf2"/><circle cx="101" cy="70.5" r="1.8" fill="#ffd23f"/><circle cx="106" cy="71" r="1.8" fill="#b48cf2"/>'),
      (p) => p.R(98, 28, 8, 16, '#c0504a', '#7a2a24', 0, 1.6) + p.P('M38 55L80 26L122 55Z', '#e8574a', '#9c2a1e', 2.2) + p.L('M50 47L110 47M60 40L100 40M70 33L90 33', '#b8382e', 1.4) + p.C(80, 44, 4.5, '#9fe0ff', '#7a2a24', 1.4) +
        p.D('<circle cx="103" cy="22" r="4" fill="#e6ecf5" opacity=".9"/><circle cx="108" cy="15" r="5" fill="#e6ecf5" opacity=".75"/><circle cx="115" cy="8" r="6" fill="#e6ecf5" opacity=".55"/>'),
      (p) => {
        const fence = (x0, x1) => p.L(`M${x0} 86L${x1} 86M${x0} 92L${x1} 92` + [...Array(Math.floor((x1 - x0) / 7) + 1)].map((_, i) => `M${x0 + i * 7} 82L${x0 + i * 7} 97`).join(''), '#ffffff', 2.2) + (p.ghost ? p.P(`M${x0} 82L${x1} 82L${x1} 97L${x0} 97Z`) : '');
        const flowers = [16, 23, 30, 126, 133, 140, 147].map((x, i) => p.D(`<path d="M${x} 100L${x} 94" stroke="#3f8a2a" stroke-width="1.4"/><circle cx="${x}" cy="93" r="2.6" fill="${['#ff6fa8', '#ffd23f', '#b48cf2', '#ff8a5a'][i % 4]}"/><circle cx="${x}" cy="93" r="1" fill="#fff6c2"/>`)).join('');
        const bush = p.E(36, 92, 7, 5, '#4cb26a', '#2f7a3a', 1.4) + p.E(124, 92, 7, 5, '#4cb26a', '#2f7a3a', 1.4);
        const mailbox = p.D('<path d="M150 98L150 84" stroke="#7a4a22" stroke-width="2"/><rect x="144" y="78" width="12" height="7" rx="3" fill="#4d8cff" stroke="#1f4fb0" stroke-width="1.2"/><path d="M155 78L155 73L159 74.5L155 76" fill="#ff4d4d"/>');
        return fence(10, 38) + fence(122, 150) + bush + flowers + mailbox + p.D('<path d="M64 98L64 89L72 89L72 98" fill="none" stroke="#7a4a22" stroke-width="1.6"/><path d="M68 94.5C66 92 63 93 64.5 95.5L68 98L71.5 95.5C73 93 70 92 68 94.5Z" fill="#ff4d6d"/>');
      },
    ],
  };

  // ---------------------------------------------------------------- Farm Railway: tracks, station, train, bridge
  const rails = (p, x0, x1) => p.D([...Array(Math.ceil((x1 - x0) / 7))].map((_, i) => `<rect x="${x0 + i * 7}" y="99" width="3.5" height="8" fill="#8a5a32"/>`).join('')) + p.L(`M${x0} 100.5L${x1} 100.5M${x0} 105.5L${x1} 105.5`, '#5b6378', 2.2) + (p.ghost ? p.P(`M${x0} 99L${x1} 99L${x1} 107L${x0} 107Z`) : '');
  const RAILWAY = {
    order: [0, 1, 3, 2],
    box: [[2, 94, 100, 14], [4, 48, 56, 50], [28, 62, 76, 40], [100, 90, 58, 26]],
    parts: [
      (p) => rails(p, 2, 104),
      (p) => p.R(8, 64, 44, 30, '#ffe9c4', '#a8763c', 0, 2) + p.P('M3 66L30 50L57 66Z', '#4cb26a', '#2f7a3a', 2) + p.C(30, 60, 4.5, '#ffffff', '#5b6378', 1.4) + p.L('M30 60L30 57.5M30 60L32 61', '#2b2140', 1.2) +
        p.R(14, 72, 9, 9, '#9fe0ff', '#7a4a22', 1, 1.4) + p.R(37, 72, 9, 9, '#9fe0ff', '#7a4a22', 1, 1.4) + p.R(25, 76, 10, 18, '#c06a2e', '#7a3f18', 1, 1.4) + p.R(2, 93, 56, 5, '#c9ced9', '#6f7488', 1, 1.4),
      (p) => {
        const wheel = (x) => p.C(x, 101, 4.4, '#2b2140', '#2b2140', 1) + p.D(`<circle cx="${x}" cy="101" r="1.6" fill="#c9ced9"/>`);
        const car = p.R(30, 80, 28, 17, '#4d8cff', '#1f4fb0', 2, 1.8) + p.D('<rect x="34" y="83" width="8" height="7" rx="1" fill="#e9f6ff"/><rect x="46" y="83" width="8" height="7" rx="1" fill="#e9f6ff"/><rect x="28" y="78" width="32" height="3" rx="1" fill="#ffd23f"/>') + wheel(37) + wheel(51);
        const loco = p.R(62, 82, 26, 15, '#e8453c', '#9c2a1e', 3, 1.8) + p.R(84, 70, 16, 27, '#e8453c', '#9c2a1e', 2, 1.8) + p.R(66, 70, 7, 12, '#2b2140', '#2b2140', 1, 1) + p.R(82, 67, 20, 4, '#2b2140', '#2b2140', 1, 1) +
          p.D('<rect x="87" y="74" width="10" height="8" rx="1" fill="#e9f6ff"/><rect x="62" y="88" width="26" height="3" fill="#ffd23f"/><circle cx="60.5" cy="86" r="2.6" fill="#fff6a0" stroke="#c99a00" stroke-width="1"/><path d="M58 97L62 92L62 97Z" fill="#5b6378"/>') + wheel(68) + wheel(80) + wheel(93);
        const smoke = p.D('<circle cx="69" cy="62" r="4" fill="#e6ecf5" opacity=".9"/><circle cx="64" cy="54" r="5" fill="#e6ecf5" opacity=".75"/><circle cx="57" cy="45" r="6" fill="#e6ecf5" opacity=".55"/>');
        return car + p.D('<path d="M58 92L62 92" stroke="#5b6378" stroke-width="2"/>') + loco + smoke;
      },
      (p) => p.P('M100 102L142 102L142 118C134 104 108 104 100 118Z', '#c9b28a', '#7a5a32', 1.8) + p.D('<path d="M108 102L108 108M121 102L121 104M134 102L134 108" stroke="#7a5a32" stroke-width="1"/>') + rails(p, 100, 160),
    ],
  };
  const river = '<path d="M104 120C106 110 102 102 106 96L136 96C140 104 134 112 138 120Z" fill="#5ec8ff"/><path d="M112 104C116 102 120 106 124 104M116 112C120 110 124 114 128 112" stroke="#e9f6ff" stroke-width="1.4" fill="none" stroke-linecap="round"/>';

  // ---------------------------------------------------------------- Castle on the Hill (the special one)
  const merlons = (x0, x1, y, h, c, s, p) => [...Array(Math.floor((x1 - x0) / 10))].map((_, i) => p.R(x0 + i * 10 + 1, y - h, 6, h + 1, c, s, 0, 1.4)).join('');
  const CASTLE = {
    order: [4, 0, 1, 2, 3],
    box: [[28, 56, 104, 46], [10, 12, 140, 90], [56, 70, 48, 44], [10, 0, 140, 92], [56, 10, 48, 58]],
    parts: [
      (p, k) => p.R(30, 64, 100, 36, `url(#${k}s)`, '#5d4f8a', 0, 2) + merlons(30, 130, 64, 7, `url(#${k}s)`, '#5d4f8a', p) + p.L('M30 76L130 76M30 88L130 88M45 64L45 76M65 64L65 76M95 64L95 76M115 64L115 76M38 76L38 88M58 76L58 88M102 76L102 88M122 76L122 88M48 88L48 100M112 88L112 100', '#a79fc8', 1),
      (p, k) => [14, 120].map((x) => p.R(x, 42, 26, 58, `url(#${k}s)`, '#5d4f8a', 0, 2) + p.P(`M${x - 4} 44L${x + 13} 12L${x + 30} 44Z`, `url(#${k}r)`, '#3a2470', 2) + p.P(`M${x + 10} 58C${x + 10} 52 ${x + 16} 52 ${x + 16} 58L${x + 16} 68L${x + 10} 68Z`, '#3a2a5a') + p.D(`<path d="M${x + 6} 44L${x + 13} 22L${x + 15} 44Z" fill="#ffffff" opacity=".18"/>`)).join(''),
      (p, k) => p.E(80, 108, 58, 6, '#5ec8ff', '#2a8fd4', 1.4) + p.P('M68 100L68 82C68 72 92 72 92 82L92 100Z', '#3a2a5a', '#2a1a40', 2) + p.L('M72 78L72 100M78 75L78 100M84 75L84 100M90 78L90 100M68 86L92 86M68 93L92 93', '#ffd23f', 1.2) +
        p.P('M66 100L94 100L98 112L62 112Z', '#a8763c', '#6b4210', 1.6) + p.L('M70 104L90 104M68 108L92 108', '#6b4210', 1),
      (p) => {
        const flag = (x, y, c) => p.L(`M${x} ${y}L${x} ${y - 12}`, '#6b4210', 1.6) + p.P(`M${x} ${y - 12}C${x + 5} ${y - 15} ${x + 9} ${y - 9} ${x + 15} ${y - 12}L${x + 15} ${y - 5}C${x + 9} ${y - 2} ${x + 5} ${y - 8} ${x} ${y - 5}Z`, c, '#7a1a2a', 1.2);
        const banner = (x, c) => p.P(`M${x} 68L${x + 10} 68L${x + 10} 86L${x + 5} 82L${x} 86Z`, c, '#1f2a6b', 1.2) + p.D(`<path d="M${x + 2.5} 76L${x + 3.5} 72.5L${x + 5} 74.5L${x + 6.5} 72.5L${x + 7.5} 76Z" fill="#ffd23f"/>`);
        return flag(27, 13, '#ff4d6d') + flag(133, 13, '#ffd23f') + flag(80, 22, '#4d8cff') + banner(44, '#4d6bff') + banner(106, '#4d6bff');
      },
      (p, k) => p.D(`<circle cx="80" cy="40" r="38" fill="url(#${k}g)"/>`) + p.R(58, 32, 44, 34, `url(#${k}s)`, '#5d4f8a', 0, 2) + p.P('M56 34C56 14 104 14 104 34Z', `url(#${k}o)`, '#a8650a', 2) +
        p.P('M72 16L71 6L76 10L80 2L84 10L89 6L88 16Z', '#ffd23f', '#a8650a', 1.4) + p.D('<circle cx="80" cy="10" r="1.8" fill="#ff4d6d"/>') +
        [64, 76, 88].map((x) => p.P(`M${x} 58L${x} 48C${x} 43 ${x + 8} 43 ${x + 8} 48L${x + 8} 58Z`, '#ffe066', '#a8650a', 1.4)).join('') +
        p.D(spk(46, 22, 4, '#fff3a6') + spk(114, 22, 4, '#fff3a6') + spk(80, 30, 2.6, '#ffffff')),
    ],
  };
  const castleDefs = (k) => lin(k + 's', ['#f4f1ff', '#c9c0e6']) + lin(k + 'r', ['#9d7bff', '#4a2f9a']) + lin(k + 'o', ['#fff6c4', '#ffcf48', '#e0961a']) + glowG(k + 'g', '#ffe066');

  const DRAW = { orchard: ORCHARD, cottage: COTTAGE, railway: RAILWAY, castle: CASTLE };
  MQ.dreamArt = (id, built, { building = false, ghost = true } = {}) => {
    const D = DRAW[id], k = 'd' + (++uid).toString(36);
    if (!D) return '';
    const done = built >= D.parts.length;
    const sky = id === 'castle' && done ? `<circle cx="80" cy="60" r="70" fill="url(#${k}g)"/>${spk(14, 18, 6, '#ffe066')}${spk(148, 26, 5, '#ff8fe0')}${spk(150, 70, 4, '#ffe066')}${spk(10, 64, 4, '#9ff0ff')}` : '';
    const ground = id === 'castle' ? hill('#a6e08a', '#86cf6a') : hill();
    return svg(sky + ground + (id === 'railway' ? river : '') + draw(D, built, building, k, ghost), id === 'castle' ? castleDefs(k) : '');
  };
  MQ.dreamStages = (id) => (DRAW[id] ? DRAW[id].parts.length : 0);
})();
