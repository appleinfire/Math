// Pictures of the farm's Big Dreams (an orchard, a guest cottage, a railway and a castle) and of the traveling
// merchant's things (his wagon, rare treasures, week charms and the mythic animals of a Mythic Feed week), drawn as SVG in code.
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

  // ---------------------------------------------------------------- the traveling merchant and his treasures
  // (special things: gold, rainbow colors and sparkles; viewBox 0 0 120 120)
  const svgT = (body, defs = '') => `<svg class="tart" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  const o = (c, w = 2.2) => ` stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
  const eye = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2140"/><circle cx="${f1(x + r * 0.35)}" cy="${f1(y - r * 0.4)}" r="${f1(r * 0.38)}" fill="#ffffff"/>`;
  const TREASURE = {
    goose: (k) => [lin(k + 'g', ['#fff6c4', '#ffd23f', '#e0961a'], 1, 1) + glowG(k + 'w', '#ffe066'),
      `<circle cx="60" cy="64" r="54" fill="url(#${k}w)"/>` +
      `<path d="M30 82C24 66 34 54 50 56C58 57 64 62 72 60C78 50 74 38 80 30C86 22 98 24 100 34C102 42 94 46 92 54C90 66 92 84 76 92C62 99 38 98 30 82Z" fill="url(#${k}g)"${o('#a8650a')}/>` +
      `<path d="M40 74C48 66 62 68 70 76C62 82 48 84 40 74Z" fill="#ffe680"${o('#c9860a', 1.6)}/><path d="M100 32L112 36L100 40Z" fill="#ff8a1f"${o('#b5600c', 1.6)}/>` + eye(92, 32) +
      `<path d="M50 92L48 102M62 94L62 104M44 102L52 102M58 104L66 104" stroke="#ff8a1f" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M84 26L83 16L88 21L91 12L94 21L99 16L98 26Z" fill="#ffd23f"${o('#a8650a', 1.4)}/>` +
      `<ellipse cx="20" cy="100" rx="9" ry="11" fill="url(#${k}g)"${o('#a8650a', 1.6)}/><ellipse cx="17" cy="96" rx="2.4" ry="4" fill="#ffffff" opacity=".7"/>` +
      spk(18, 18, 7, '#fff3a6') + spk(108, 70, 5, '#fff3a6') + spk(8, 70, 4, '#ffffff')],
    can: (k) => [lin(k + 'c', ['#7fd8ff', '#3a8be0'], 1, 1) + glowG(k + 'w', '#9ff0ff'),
      `<circle cx="60" cy="62" r="54" fill="url(#${k}w)"/>` +
      `<path d="M30 52L84 52L80 98C80 102 76 104 72 104L42 104C38 104 34 102 34 98Z" fill="url(#${k}c)"${o('#1f4fb0')}/>` +
      `<path d="M30 52L84 52L84 58L30 58Z" fill="#ffd23f"${o('#a8650a', 1.6)}/><path d="M36 92L78 92" stroke="#ffd23f" stroke-width="3"/>` +
      `<path d="M84 64L106 42L112 46L90 72Z" fill="url(#${k}c)"${o('#1f4fb0', 2)}/><ellipse cx="110" cy="43" rx="5" ry="7" fill="#ffd23f" transform="rotate(35 110 43)"${o('#a8650a', 1.4)}/>` +
      `<path d="M40 52C40 34 74 34 74 52" fill="none" stroke="#1f4fb0" stroke-width="5" stroke-linecap="round"/>` +
      ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'].map((c, i) => `<circle cx="${f1(112 - i * 2)}" cy="${56 + i * 9}" r="2.6" fill="${c}"/>`).join('') +
      `<path d="M50 70L60 64L70 70L66 82L54 82Z" fill="#ffffff" opacity=".35"/>` + spk(18, 22, 7, '#ffffff') + spk(14, 88, 5, '#fff3a6') + spk(98, 104, 4, '#ffffff')],
    musician: (k) => [lin(k + 'v', ['#e8a35a', '#a8622f'], 1, 1) + glowG(k + 'w', '#ff8fe0'),
      `<circle cx="60" cy="60" r="54" fill="url(#${k}w)"/>` +
      `<g transform="rotate(-28 56 66)"><path d="M56 30C66 30 70 38 66 46C72 50 74 58 70 64C78 70 76 90 56 92C36 90 34 70 42 64C38 58 40 50 46 46C42 38 46 30 56 30Z" fill="url(#${k}v)"${o('#6b3a14')}/>` +
      `<path d="M53 52C51 56 51 58 53 60M59 52C61 56 61 58 59 60" stroke="#3a1f0a" stroke-width="2" fill="none"/><rect x="52" y="8" width="8" height="26" rx="2" fill="#3a1f0a"/><rect x="50" y="4" width="12" height="8" rx="3" fill="#6b3a14"/>` +
      `<path d="M54 12L54 80M58 12L58 80" stroke="#f6e7c8" stroke-width="0.8"/><rect x="48" y="72" width="16" height="4" rx="1" fill="#3a1f0a"/></g>` +
      `<path d="M16 96L100 30" stroke="#6b3a14" stroke-width="3" stroke-linecap="round"/><path d="M18 94L98 32" stroke="#f6e7c8" stroke-width="1"/>` +
      `<path d="M88 64L88 82C88 86 80 88 80 84C80 80 86 80 88 82" fill="#ff4d6d" stroke="#ff4d6d" stroke-width="2.4" stroke-linecap="round"/><path d="M98 84L98 98C98 102 90 104 90 100C90 96 96 96 98 98M98 84L108 80L108 94C108 98 100 100 100 96" fill="none" stroke="#7a3fd1" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M14 40L14 56C14 60 6 62 6 58C6 54 12 54 14 56" fill="none" stroke="#3a8be0" stroke-width="2.4" stroke-linecap="round"/>` + spk(26, 18, 6, '#fff3a6') + spk(104, 22, 5, '#ffffff')],
    fairy: (k) => [lin(k + 'd', ['#b9f0a0', '#5fbf5f']) + lin(k + 'f', ['#ffffff', '#c9f0ff']) + glowG(k + 'w', '#c9f7a8'),
      `<circle cx="60" cy="60" r="54" fill="url(#${k}w)"/>` +
      `<g transform="rotate(-30 40 50)"><ellipse cx="40" cy="50" rx="18" ry="10" fill="url(#${k}f)"${o('#7cc7f0', 1.6)}/></g><g transform="rotate(30 80 50)"><ellipse cx="80" cy="50" rx="18" ry="10" fill="url(#${k}f)"${o('#7cc7f0', 1.6)}/></g>` +
      `<g transform="rotate(25 42 68)"><ellipse cx="42" cy="68" rx="12" ry="7" fill="url(#${k}f)"${o('#7cc7f0', 1.6)}/></g><g transform="rotate(-25 78 68)"><ellipse cx="78" cy="68" rx="12" ry="7" fill="url(#${k}f)"${o('#7cc7f0', 1.6)}/></g>` +
      `<path d="M50 62L70 62L78 92C68 96 52 96 42 92Z" fill="url(#${k}d)"${o('#2f7a3a', 2)}/><path d="M46 90Q50 94 54 91Q58 95 62 91Q66 95 70 91Q74 94 76 90" stroke="#ffffff" stroke-width="1.4" fill="none"/>` +
      `<path d="M55 94L55 104M65 94L65 104" stroke="#f2b896" stroke-width="3.4" stroke-linecap="round"/>` +
      `<circle cx="60" cy="46" r="14" fill="#ffe0cc"${o('#c98a6a', 1.8)}/><path d="M46 46C44 32 52 28 60 28C68 28 76 32 74 46C70 38 66 36 60 36C54 36 50 38 46 46Z" fill="#ffd23f"${o('#c99a00', 1.8)}/>` +
      eye(55, 47, 2.4) + eye(65, 47, 2.4) + `<path d="M56 53Q60 56 64 53" stroke="#c2407e" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M78 70L96 58M90 52L96 58L92 64M86 56L92 60" stroke="#c9a26a" stroke-width="2.4" stroke-linecap="round"/><path d="M96 58L104 46M98 60L108 52M96 56L100 44" stroke="#e8b84a" stroke-width="2.2" stroke-linecap="round"/>` +
      spk(18, 26, 6, '#fff3a6') + spk(104, 92, 5, '#ffffff') + spk(20, 92, 4, '#c9f7a8')],
    sheep: (k) => {
      const cols = ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'];
      const fluff = [[36, 60], [50, 50], [66, 48], [82, 54], [90, 68], [84, 82], [68, 88], [50, 88], [34, 78], [60, 68]];
      return [glowG(k + 'w', '#ffb8f0'),
        `<circle cx="60" cy="64" r="54" fill="url(#${k}w)"/>` +
        `<path d="M44 90L42 106M56 92L56 108M72 92L72 108M84 88L86 104" stroke="#3a2a4a" stroke-width="5" stroke-linecap="round"/>` +
        fluff.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="15" fill="${cols[i % 6]}"${o('#ffffff', 2)}/>`).join('') +
        `<ellipse cx="24" cy="58" rx="13" ry="15" fill="#4a3a5a"${o('#2b2140', 2)}/><ellipse cx="14" cy="50" rx="6" ry="3.5" fill="#4a3a5a" transform="rotate(-30 14 50)"/><ellipse cx="34" cy="48" rx="6" ry="3.5" fill="#4a3a5a" transform="rotate(30 34 48)"/>` +
        `<circle cx="24" cy="46" r="6" fill="#ff6b6b"${o('#ffffff', 1.4)}/><circle cx="18" cy="44" r="4" fill="#ffe66d"/><circle cx="30" cy="44" r="4" fill="#5ec8ff"/>` +
        eye(19, 58, 2.6) + eye(29, 58, 2.6) + `<path d="M21 66Q24 69 27 66" stroke="#ffd6e6" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        spk(100, 24, 7, '#fff3a6') + spk(108, 96, 5, '#ffffff') + spk(14, 96, 4, '#ffe66d')];
    },
  };
  MQ.treasureArt = (id) => { const f = TREASURE[id]; if (!f) return ''; const [defs, body] = f('t' + (++uid).toString(36)); return svgT(body, defs); };
  // Uncle Marco's wagon: a striped roof, a star on the side, big yellow wheels, a lantern, and Marco at the window.
  MQ.wagonArt = () => {
    const k = 'w' + (++uid).toString(36);
    const stripes = [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${18 + i * 14} 30L${32 + i * 14} 30L${32 + i * 14} 46L${18 + i * 14} 46Z" fill="${i % 2 ? '#ffffff' : '#ff4d6d'}"/>`).join('');
    const wheel = (x) => `<circle cx="${x}" cy="98" r="13" fill="#ffd23f" stroke="#a8650a" stroke-width="2.4"/><circle cx="${x}" cy="98" r="3.5" fill="#a8650a"/>` + [0, 45, 90, 135].map((a) => `<path d="M${x} 98L${f1(x + 12 * Math.cos((a * Math.PI) / 180))} ${f1(98 + 12 * Math.sin((a * Math.PI) / 180))}M${x} 98L${f1(x - 12 * Math.cos((a * Math.PI) / 180))} ${f1(98 - 12 * Math.sin((a * Math.PI) / 180))}" stroke="#a8650a" stroke-width="1.6"/>`).join('');
    return `<svg class="tart wagon" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>${lin(k + 'b', ['#9d7bff', '#5a2fb0'])}${glowG(k + 'w', '#ffe066')}<clipPath id="${k}r"><path d="M14 46C14 22 106 22 106 46Z"/></clipPath></defs>` +
      `<circle cx="60" cy="58" r="56" fill="url(#${k}w)"/>` +
      `<g clip-path="url(#${k}r)">${stripes}</g><path d="M14 46C14 22 106 22 106 46Z" fill="none" stroke="#9c1a3a" stroke-width="2.4"/>` +
      `<rect x="16" y="46" width="88" height="44" rx="4" fill="url(#${k}b)" stroke="#3a1a7a" stroke-width="2.4"/>` +
      `<rect x="26" y="54" width="26" height="20" rx="3" fill="#fff3c4" stroke="#3a1a7a" stroke-width="2"/><circle cx="39" cy="66" r="7" fill="#ffd9c2"/><path d="M32 61C34 55 44 55 46 61Z" fill="#7a4a22"/><path d="M34 68C36 66 38 67 39 68C40 67 42 66 44 68C42 71 36 71 34 68Z" fill="#5b3a1e"/>${eye(36.5, 63.5, 1.4)}${eye(41.5, 63.5, 1.4)}` +
      `<path d="M78 52L81 60L90 60L83 65L86 74L78 69L70 74L73 65L66 60L75 60Z" fill="#ffd23f" stroke="#a8650a" stroke-width="1.4"/>` +
      `<path d="M16 82L104 82" stroke="#ffd23f" stroke-width="3"/><path d="M104 66L114 66L114 72" stroke="#3a1a7a" stroke-width="2" fill="none"/><rect x="110" y="72" width="8" height="10" rx="2" fill="#ffe066" stroke="#a8650a" stroke-width="1.4"/>` +
      wheel(34) + wheel(86) + spk(10, 16, 6, '#fff3a6') + spk(110, 18, 5, '#ffffff') + `</svg>`;
  };
  MQ.TREASURE_IDS = Object.keys(TREASURE);
  // The bank's locked deposit: a little golden safe with a padlock (open when the deposit is ready).
  MQ.vaultArt = (open = false) => {
    const k = 'v' + (++uid).toString(36);
    const door = open
      ? `<path d="M34 34L18 26L18 94L34 86Z" fill="url(#${k}d)" stroke="#8a5a08" stroke-width="2.2" stroke-linejoin="round"/><rect x="34" y="34" width="52" height="52" rx="4" fill="#3a2a5a"/>` +
        [[44, 70], [56, 66], [68, 72], [50, 78], [62, 80], [74, 78]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#ffd23f" stroke="#a8650a" stroke-width="1"/>`).join('') + spk(60, 50, 8, '#fff3a6') + spk(76, 44, 4, '#ffffff')
      : `<rect x="34" y="34" width="52" height="52" rx="4" fill="url(#${k}d)" stroke="#8a5a08" stroke-width="2.2"/><circle cx="60" cy="60" r="13" fill="#ffe680" stroke="#8a5a08" stroke-width="2"/>` +
        [0, 60, 120, 180, 240, 300].map((a) => `<path d="M60 60L${f1(60 + 11 * Math.cos((a * Math.PI) / 180))} ${f1(60 + 11 * Math.sin((a * Math.PI) / 180))}" stroke="#8a5a08" stroke-width="2" stroke-linecap="round"/>`).join('') + '<circle cx="60" cy="60" r="3" fill="#8a5a08"/>' +
        `<path d="M78 74C78 66 92 66 92 74" fill="none" stroke="#6f7488" stroke-width="4"/><rect x="74" y="74" width="22" height="18" rx="3" fill="#c9ced9" stroke="#5b6378" stroke-width="2"/><circle cx="85" cy="82" r="2.4" fill="#2b2140"/><path d="M85 82L85 87" stroke="#2b2140" stroke-width="2"/>`;
    return `<svg class="tart vault" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>${lin(k + 'b', ['#fff1a6', '#ffcf48', '#d98a10'], 1, 1)}${lin(k + 'd', ['#ffe680', '#e8a823'], 1, 1)}${glowG(k + 'w', open ? '#ffe066' : '#c9b8ff')}</defs>` +
      `<circle cx="60" cy="60" r="56" fill="url(#${k}w)"/><rect x="24" y="24" width="72" height="72" rx="10" fill="url(#${k}b)" stroke="#8a5a08" stroke-width="2.6"/>` +
      `<rect x="30" y="96" width="12" height="8" rx="2" fill="#8a5a08"/><rect x="78" y="96" width="12" height="8" rx="2" fill="#8a5a08"/>${door}` + spk(16, 18, 6, '#fff3a6') + spk(106, 22, 5, '#ffffff') + `</svg>`;
  };

  // ---------------------------------------------------------------- mythic animals (the merchant's Mythic Feed)
  // A farm animal's mythic week: drawn bright, facing left like the animal emoji (the pens turn them around).
  // MQ.mythArt(kind, { aura }) → '<svg …>' ('' for a kind without a mythic form); aura: a glow behind (for big pictures).
  const mo = (c, w = 2.4) => ` stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
  const mP = (d, fill, o = '') => `<path d="${d}" fill="${fill}"${o}/>`;
  const mE = (x, y, rx, ry, fill, o = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"${o}/>`;
  const mC = (x, y, r, fill, o = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${o}/>`;
  const mL = (d, c, w = 2.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const star = (x, y, r, c, o = '') => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push(f1(x + rr * Math.cos(a)) + ',' + f1(y + rr * Math.sin(a))); }
    return `<polygon points="${pts.join(' ')}" fill="${c}"${o}/>`;
  };
  const rad = (id, cols, cx = 0.4, cy = 0.35, r = 0.75) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${cols.map((c, i) => `<stop offset="${f1(i / (cols.length - 1))}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const legs = (xs, y0, y1, c, hoof, o) => xs.map((x) => mP(`M${x - 3.5} ${y0}L${x + 3.5} ${y0}L${x + 3.5} ${y1}L${x - 3.5} ${y1}Z`, c, o) + mP(`M${x - 4} ${y1 - 1}L${x + 4} ${y1 - 1}L${x + 4} ${y1 + 4}L${x - 4} ${y1 + 4}Z`, hoof, o)).join('');
  const MYTH = {
    // Firebird Hen: a red-gold hen with a tail of flames and a flame crown
    chicken: (k) => [lin(k + 'b', ['#ffb347', '#ff5a2e', '#d6261a'], 1, 1) + lin(k + 't', ['#ffe14d', '#ff9a2e', '#ff3d2e'], 0, 1) + lin(k + 'h', ['#ffd86b', '#ff8a3d'], 1, 1) + glowG(k + 'w', '#ffb347'),
      mP('M80 70C90 54 96 36 92 14C104 28 110 48 100 70Z', `url(#${k}t)`, mo('#b5280e')) +
      mP('M84 74C100 66 110 50 112 30C118 50 114 70 98 80Z', `url(#${k}t)`, mo('#b5280e')) +
      mP('M84 80C100 82 110 74 118 62C118 78 108 90 90 90Z', `url(#${k}t)`, mo('#b5280e')) +
      mL('M58 98L56 110M50 110L62 110M72 98L74 110M68 110L80 110', '#ffb02e', 3.4) +
      mE(64, 78, 30, 23, `url(#${k}b)`, mo('#9a2a12')) +
      mP('M46 76C60 64 80 66 88 78C76 88 58 90 46 76Z', '#ffcf48', mo('#c9600a', 2)) + mL('M56 77C64 74 72 75 80 79', '#ff8a1f', 1.8) +
      mP('M30 62C26 50 30 36 42 34C54 34 58 46 54 58C52 66 46 70 40 70C34 70 31 66 30 62Z', `url(#${k}h)`, mo('#9a2a12')) +
      mP('M30 36C27 26 32 20 35 26C36 16 44 14 43 25C47 18 53 21 49 33Z', `url(#${k}t)`, mo('#b5280e', 2)) +
      mP('M30 46L16 50L30 54Z', '#ffd23f', mo('#a8650a', 1.8)) + mE(31, 60, 3.6, 6, '#ff3d2e', mo('#9a1a12', 1.4)) + eye(38, 45, 3.2) +
      spk(18, 20, 6, '#fff3a6') + mC(110, 96, 2.4, '#ffb02e') + mC(14, 86, 2, '#ffd166') + spk(106, 10, 4, '#ffe14d')],
    // Starlight Bees: a deep blue bee with gold stripes, glassy wings and star antennae
    bees: (k) => [lin(k + 'b', ['#6a5cff', '#3a2f9a'], 1, 1) + lin(k + 'w', ['#ffffff', '#c9f0ff'], 0, 1) + glowG(k + 'w2', '#9ff0ff') + `<clipPath id="${k}c"><ellipse cx="66" cy="72" rx="34" ry="24"/></clipPath>`,
      `<g transform="rotate(-28 64 40)">${mE(64, 40, 20, 12, `url(#${k}w)`, mo('#7cc7f0', 1.8) + ' opacity=".92"')}</g><g transform="rotate(18 86 44)">${mE(86, 44, 16, 9, `url(#${k}w)`, mo('#7cc7f0', 1.8) + ' opacity=".92"')}</g>` +
      mP('M99 70L114 72L99 78Z', '#ffd23f', mo('#a8650a', 1.6)) +
      mE(66, 72, 34, 24, `url(#${k}b)`) + `<g clip-path="url(#${k}c)">${[58, 74, 90].map((x) => `<path d="M${x} 44C${x - 6} 60 ${x - 6} 84 ${x} 100" fill="none" stroke="#ffd23f" stroke-width="8"/>`).join('')}</g>` + mE(66, 72, 34, 24, 'none', mo('#2a1f6e', 2.6)) +
      star(70, 58, 7, '#fff3a6', mo('#e0a21b', 1.2)) +
      mL('M26 54C22 42 18 36 12 34', '#2a1f6e', 2.4) + mL('M36 52C36 40 38 32 36 24', '#2a1f6e', 2.4) + star(12, 33, 6, '#ffe14d', mo('#a8650a', 1.2)) + star(36, 22, 6, '#ffe14d', mo('#a8650a', 1.2)) +
      mC(32, 68, 17, '#4a3fd1', mo('#2a1f6e', 2.6)) + mE(26, 66, 5, 6, '#ffffff') + mE(25, 67, 3.2, 4, '#2b2140') + mC(26.2, 65, 1.3, '#ffffff') +
      mL('M22 76Q26 79 30 76', '#ffd6f0', 1.8) + mE(36, 74, 3.5, 2.2, '#ff8fe0', ' opacity=".6"') +
      spk(104, 22, 6, '#9ff0ff') + spk(14, 92, 5, '#fff3a6') + spk(100, 100, 4, '#ffffff') + mC(48, 106, 2, '#9ff0ff')],
    // Crystal Goat: snow-white with a blue shimmer, crystal horns and crystal hooves
    goat: (k) => [lin(k + 'b', ['#ffffff', '#dfe8ff', '#b9c9ff'], 1, 1) + lin(k + 'c', ['#e6fbff', '#7fdcff', '#8a6cff'], 1, 1) + glowG(k + 'w', '#9ff0ff'),
      mP('M96 62L106 52L104 66Z', `url(#${k}b)`, mo('#5a6fb0', 2)) +
      legs([50, 60, 82, 92], 82, 102, `url(#${k}b)`, `url(#${k}c)`, mo('#5a6fb0', 1.8)) +
      mP('M42 64C42 54 54 50 66 51C82 52 96 54 98 66C100 80 92 86 80 86L54 86C44 86 40 76 42 64Z', `url(#${k}b)`, mo('#5a6fb0')) +
      [[58, 51], [70, 50], [82, 52]].map(([x, y]) => mP(`M${x} ${y}L${x + 4} ${y - 9}L${x + 8} ${y}Z`, `url(#${k}c)`, mo('#5a4fc0', 1.4))).join('') +
      mP('M42 72C36 64 34 58 34 50L50 44C52 52 54 60 60 66Z', `url(#${k}b)`, mo('#5a6fb0')) +
      mP('M36 30C36 20 42 10 54 4L52 18C46 20 44 26 44 31Z', `url(#${k}c)`, mo('#5a4fc0', 1.8)) + mL('M40 26C41 18 45 12 51 8', '#ffffff', 1.4) +
      mP('M44 31C46 22 54 14 66 12L61 25C56 26 52 29 52 34Z', `url(#${k}c)`, mo('#5a4fc0', 1.8)) + mL('M49 28C51 22 56 17 62 15', '#ffffff', 1.4) +
      mP('M46 38L62 38L50 48Z', `url(#${k}b)`, mo('#5a6fb0', 1.8)) +
      mP('M16 46C14 36 22 28 32 28C42 28 50 34 50 44C50 54 44 60 34 60C24 60 18 56 16 46Z', `url(#${k}b)`, mo('#5a6fb0')) +
      mE(24, 52, 9, 6.5, '#f3ecff', mo('#8a8ac8', 1.4)) + mE(20, 51, 1.4, 1.8, '#5a4fc0') + mE(26, 51, 1.4, 1.8, '#5a4fc0') +
      mP('M26 58L20 72L32 60Z', '#eef3ff', mo('#5a6fb0', 1.6)) + eye(35, 41, 3.2) + mE(42, 50, 3.5, 2.2, '#ff9ad5', ' opacity=".5"') +
      spk(16, 16, 6, '#c9f7ff') + spk(108, 30, 5, '#ffffff') + spk(110, 92, 4, '#c9f7ff') + spk(20, 96, 4, '#ffffff')],
    // Cloud Sheep: a fluffy cloud of golden fleece with golden curled horns, floating on little clouds
    sheep: (k) => {
      const fluff = [[44, 62], [56, 52], [72, 50], [86, 56], [94, 70], [88, 84], [72, 90], [56, 90], [44, 80], [68, 70]];
      return [rad(k + 'f', ['#ffffff', '#fff3c4', '#ffcf48']) + glowG(k + 'w', '#ffe066'),
        mE(46, 108, 12, 4, '#ffffff', ' opacity=".9"') + mE(82, 108, 13, 4.5, '#ffffff', ' opacity=".9"') +
        mL('M50 92L49 104M60 94L60 106M76 94L76 106M86 90L87 102', '#6a5aa8', 4.6) +
        fluff.map(([x, y]) => mC(x, y, 14, `url(#${k}f)`, mo('#e8b84a', 1.8))).join('') + fluff.slice(0, 6).map(([x, y]) => mC(x - 4, y - 5, 3, '#ffffff', ' opacity=".8"')).join('') +
        mE(28, 60, 12.5, 14.5, '#7a6ac8', mo('#3a2f78', 2.2)) +
        mL('M33 49C41 40 49 50 42 55C37 58 34 53 38 51', '#e0a21b', 4.4) + mL('M23 49C15 41 8 50 14 55C19 58 22 53 18 51', '#e0a21b', 4.4) +
        eye(24, 58, 2.6) + eye(33, 58, 2.6) + mL('M25 67Q28.5 70 32 67', '#ffd6e6', 1.8) +
        spk(102, 26, 7, '#fff3a6') + spk(16, 30, 5, '#ffffff') + spk(110, 90, 4, '#ffe066') + mC(100, 44, 2.2, '#ffe066')];
    },
    // Moon Cow: night-blue with a golden moon and stars for spots, silver horns, a star at the tip of the tail
    cow: (k) => [lin(k + 'b', ['#6f5fe0', '#3a2f9a', '#241c66'], 1, 1) + lin(k + 's', ['#ffffff', '#c9d2ea'], 1, 1) + glowG(k + 'w', '#b9a4ff'),
      mL('M102 58C112 62 112 74 108 80', '#241c66', 3) + star(108, 84, 6, '#ffe14d', mo('#a8650a', 1.2)) +
      legs([48, 58, 84, 94], 82, 100, '#3a2f9a', `url(#${k}s)`, mo('#1a1450', 1.8)) +
      mE(78, 86, 8, 5, '#ffb8e0', mo('#a8407e', 1.6)) +
      mP('M38 56C38 46 48 44 60 44L90 44C102 44 108 54 106 68C104 80 98 86 88 86L52 86C42 86 38 76 38 66Z', `url(#${k}b)`, mo('#1a1450')) +
      mP('M76 52C68 54 64 62 66 70C68 76 76 80 82 78C76 76 72 70 72 64C72 58 74 54 76 52Z', '#ffe14d', mo('#c99a00', 1.4)) +
      star(92, 56, 5.5, '#fff3a6') + star(54, 70, 5, '#fff3a6') + star(96, 76, 4.5, '#fff3a6') + star(58, 54, 3.5, '#ffffff') +
      mP('M18 36C10 30 10 22 14 18C15 24 20 28 26 30Z', `url(#${k}s)`, mo('#6a7499', 1.6)) + mP('M42 36C50 30 50 22 46 18C45 24 40 28 34 30Z', `url(#${k}s)`, mo('#6a7499', 1.6)) +
      mP('M12 40L4 36L10 46Z', '#3a2f9a', mo('#1a1450', 1.6)) +
      mP('M14 46C14 36 22 32 30 32C38 32 46 36 46 46C46 58 40 68 30 68C20 68 14 58 14 46Z', `url(#${k}b)`, mo('#1a1450')) +
      mE(30, 62, 12, 8, '#c9b8ff', mo('#5a4fc0', 1.6)) + mE(26, 62, 1.6, 2.2, '#3a2f78') + mE(34, 62, 1.6, 2.2, '#3a2f78') +
      eye(24, 46, 3) + eye(36, 46, 3) + mP('M30 72C28 76 30 80 33 78C31 77 31 74 33 72Z', '#ffe14d', mo('#c99a00', 1)) +
      spk(14, 14, 6, '#fff3a6') + spk(108, 26, 5, '#ffffff') + spk(16, 94, 4, '#fff3a6') + mC(66, 30, 2, '#fff3a6')],
    // Silver Swan: shining silver with a golden crown
    duck: (k) => [lin(k + 'b', ['#ffffff', '#dfe4f5', '#a9b4d6'], 1, 1) + glowG(k + 'w', '#c9e0ff'),
      mL('M64 96L62 106M58 106L68 106M78 96L80 106M74 106L84 106', '#ff9a2e', 3) +
      mP('M44 80C44 66 58 60 74 62C90 64 102 64 108 52C114 68 106 92 82 96L58 96C48 96 44 88 44 80Z', `url(#${k}b)`, mo('#6a7499')) +
      mP('M60 68C76 60 96 64 102 74C90 84 70 86 60 74Z', '#eef1fb', mo('#6a7499', 1.8)) + mL('M68 72C76 70 84 71 92 74M70 77C78 77 86 78 94 78', '#a9b4d6', 1.6) +
      mP('M48 78C38 68 30 58 30 44C30 32 38 24 48 26C56 28 58 36 54 40C48 44 44 48 46 56C48 64 54 70 60 74Z', `url(#${k}b)`, mo('#6a7499')) +
      mP('M36 32L20 37L36 40Z', '#ffb02e', mo('#a8650a', 1.6)) + eye(43, 33, 2.8) +
      mP('M40 22L41 12L45 18L48 9L51 18L55 12L56 23Z', '#ffd23f', mo('#a8650a', 1.6)) + mC(48, 17, 1.6, '#ff5a8a') +
      spk(18, 16, 6, '#ffffff') + spk(104, 30, 5, '#c9e0ff') + spk(108, 100, 4, '#ffffff') + spk(16, 76, 4, '#c9e0ff')],
    // Flying Pig: pink, with white-and-gold wings, floating above its shadow
    pig: (k) => [lin(k + 'b', ['#ffe0ec', '#ff9fc2', '#f07aa6'], 1, 1) + lin(k + 'w', ['#ffffff', '#fff6d6', '#ffd86b'], 0, 1) + glowG(k + 'w2', '#ffd1e8'),
      mE(62, 110, 26, 4, '#c2407e', ' opacity=".18"') +
      mP('M60 54C54 36 62 18 82 12C80 22 92 22 90 32C100 32 98 44 88 50C84 54 70 58 60 54Z', `url(#${k}w)`, mo('#c99a3a', 2)) + mL('M70 46C74 38 80 30 86 26M74 50C80 46 86 42 92 40', '#e8c46a', 1.4) +
      mL('M98 66C106 60 110 68 104 70C100 72 102 64 106 64', '#c2407e', 2.4) +
      legs([50, 62, 78, 88], 84, 94, '#ff9fc2', '#ffd23f', mo('#c2407e', 1.6)) +
      mE(68, 72, 32, 20, `url(#${k}b)`, mo('#c2407e')) +
      mP('M22 46L20 32L34 42Z', '#ff9fc2', mo('#c2407e', 1.8)) + mP('M38 42L44 30L48 46Z', '#ff9fc2', mo('#c2407e', 1.8)) +
      mC(34, 60, 18, `url(#${k}b)`, mo('#c2407e')) +
      mE(20, 64, 8, 7, '#ff7aa8', mo('#c2407e', 1.8)) + mE(18, 63, 1.4, 2.2, '#8a1f52') + mE(22.5, 63, 1.4, 2.2, '#8a1f52') +
      eye(34, 54, 3) + mE(40, 66, 4, 2.4, '#ff5a8a', ' opacity=".4"') + mL('M27 72Q31 75 35 72', '#c2407e', 1.6) +
      spk(104, 18, 6, '#fff3a6') + spk(16, 22, 5, '#ffffff') + spk(110, 88, 4, '#ffd86b') + mC(14, 90, 2, '#ffd86b')],
    // Thunderbird: a turkey with a storm-blue tail fan full of lightning
    turkey: (k) => {
      const fan = [-160, -136, -112, -88, -64, -40].map((a, i) => `<g transform="rotate(${a + 90} 74 74)">${mE(74, 44, 9, 27, ['#5ec8ff', '#7a5cff', '#3a8be0', '#a77bff', '#5ec8ff', '#7a5cff'][i], mo('#1e1f6b', 1.8))}${mP('M75 24L70 35L75 35L71 45L80 31L75 31Z', '#ffe14d')}</g>`).join('');
      return [lin(k + 'b', ['#4a52e0', '#252a8a', '#151760'], 1, 1) + glowG(k + 'w', '#9ff0ff'),
        fan + mL('M62 96L60 108M56 108L66 108M76 96L78 108M72 108L82 108', '#ffd23f', 3) +
        mE(70, 78, 25, 21, `url(#${k}b)`, mo('#0e0f40')) + mP('M66 64L57 79L65 79L59 94L76 74L67 74L73 64Z', '#ffe14d', mo('#a8650a', 1.4)) +
        mP('M48 72C42 64 40 56 42 48L52 50C52 58 54 64 58 70Z', '#252a8a', mo('#0e0f40', 2)) +
        mC(42, 44, 12, '#9ff0ff', mo('#2a6ea0', 2.2)) + mP('M38 52C33 58 34 66 39 65C41 62 39 58 41 54Z', '#ff3d5a', mo('#9a1a2a', 1.4)) +
        mP('M32 41L22 45L32 48Z', '#ffd23f', mo('#a8650a', 1.6)) + eye(42, 41, 2.8) +
        mP('M100 20L94 30L99 30L95 38L104 27L99 27Z', '#ffe14d') + mP('M18 76L13 84L17 84L14 91L21 82L17 82Z', '#ffe14d') + spk(18, 22, 5, '#9ff0ff') + spk(108, 96, 4, '#ffffff')];
    },
    // Star Alpaca: lavender and pink fluff with stars in it
    alpaca: (k) => {
      const puff = [[56, 62], [68, 58], [82, 60], [92, 68], [86, 80], [72, 82], [58, 78]];
      return [rad(k + 'f', ['#ffffff', '#ffd6f0', '#b9a4ff']) + glowG(k + 'w', '#ffb8f0'),
        legs([54, 64, 80, 90], 82, 102, '#e9d8ff', '#6a5aa8', mo('#6a5aa8', 1.6)) +
        puff.map(([x, y]) => mC(x, y, 13, `url(#${k}f)`, mo('#9a7ad8', 1.6))).join('') +
        mP('M34 66C32 52 32 38 34 28L48 28C48 40 50 52 54 64Z', `url(#${k}f)`, mo('#9a7ad8', 1.8)) +
        mP('M38 14L40 2L45 12Z', '#e9d8ff', mo('#9a7ad8', 1.6)) + mP('M46 14L50 4L52 15Z', '#e9d8ff', mo('#9a7ad8', 1.6)) +
        mP('M26 30C24 20 32 12 40 14C48 16 52 24 50 30C48 38 40 40 34 38C30 37 26 34 26 30Z', `url(#${k}f)`, mo('#9a7ad8', 1.8)) +
        [[34, 14], [41, 11], [47, 15]].map(([x, y]) => mC(x, y, 5, '#ffe0f4', mo('#c9a0e8', 1.2))).join('') +
        mE(30, 34, 7, 5, '#fff2fa', mo('#c9a0e8', 1.2)) + eye(37, 26, 2.8) + mL('M26 37Q29 39 32 37', '#9a5aa8', 1.4) +
        star(70, 66, 6, '#ffe14d', mo('#c99a00', 1)) + star(86, 74, 4.5, '#fff3a6') + star(58, 74, 4, '#ffffff') + star(40, 48, 3.5, '#ffe14d') +
        spk(104, 30, 6, '#fff3a6') + spk(14, 60, 5, '#ffffff') + spk(108, 96, 4, '#ffb8f0')];
    },
    // Pegasus: a white pony with golden wings and a rainbow mane and tail
    pony: (k) => [lin(k + 'b', ['#ffffff', '#eae4ff'], 1, 1) + lin(k + 'w', ['#ffffff', '#fff3c4', '#ffcf48'], 0, 1) + lin(k + 'g', ['#fff3a6', '#f5b521']) + glowG(k + 'w2', '#ffe7a3'),
      ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'].map((c, i) => mL(`M${92 + i} ${58 + i * 1.5}C${104 + i} ${64 + i * 2} ${106 + i} ${80 + i} ${98 + i * 2} ${92 + i}`, c, 3)).join('') +
      legs([52, 62, 82, 92], 74, 100, `url(#${k}b)`, `url(#${k}g)`, mo('#8a7ab8', 1.8)) +
      mE(72, 66, 26, 15, `url(#${k}b)`, mo('#8a7ab8')) +
      mP('M70 58C64 38 72 18 92 10C88 22 100 22 98 32C108 32 106 46 96 52C90 56 78 60 70 58Z', `url(#${k}w)`, mo('#c99a3a', 2)) + mL('M78 52C82 42 88 34 94 28M82 56C88 52 94 48 100 46', '#e8c46a', 1.4) +
      mP('M50 70C44 58 40 46 42 36L56 34C56 46 58 56 62 64Z', `url(#${k}b)`, mo('#8a7ab8')) +
      ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'].map((c, i) => mL(`M${52 + i * 1.4} ${30 + i * 5}C${58 + i * 1.6} ${32 + i * 5} ${60 + i * 1.6} ${36 + i * 5} ${60 + i * 1.6} ${40 + i * 5}`, c, 3.2)).join('') +
      mP('M44 26L46 14L52 24Z', `url(#${k}b)`, mo('#8a7ab8', 1.6)) +
      mP('M22 40C20 32 28 24 38 24C48 24 54 30 54 38C54 46 46 50 38 50L30 50C24 50 22 46 22 40Z', `url(#${k}b)`, mo('#8a7ab8')) +
      mE(26, 44, 5, 4, '#ffd6f0') + mE(24, 43, 1, 1.4, '#8a7ab8') + eye(38, 35, 3) + mE(44, 43, 3.5, 2.2, '#ff9ad5', ' opacity=".5"') +
      spk(16, 16, 6, '#fff3a6') + spk(110, 24, 5, '#ffffff') + spk(14, 86, 4, '#ffe7a3') + mC(30, 104, 2, '#ffcf48')],
  };
  MQ.mythArt = (a, { aura = true } = {}) => {
    const f = MYTH[a];
    if (!f) return '';
    const k = 'm' + (++uid).toString(36), [defs, body] = f(k);
    const glow = aura ? `<circle cx="60" cy="62" r="56" fill="url(#${k}w${a === 'bees' || a === 'pig' || a === 'pony' ? '2' : ''})"/>` : '';
    return `<svg class="tart myth m-${a}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>${defs}</defs>${glow}${body}</svg>`;
  };
  // a little Starlight Bee for the beehive pen
  MQ.starBee = () => '<svg class="sbee" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="10" cy="7" rx="5" ry="3.2" fill="#e6fbff" opacity=".9" transform="rotate(-25 10 7)"/><ellipse cx="13" cy="14" rx="8" ry="6" fill="#4a3fd1" stroke="#2a1f6e" stroke-width="1.2"/><path d="M11 8.5C9.5 12 9.5 16 11 19.5M15 8.4C13.5 12 13.5 16 15 19.6" stroke="#ffd23f" stroke-width="2.2" fill="none"/><circle cx="6" cy="13" r="3.4" fill="#4a3fd1" stroke="#2a1f6e" stroke-width="1"/><circle cx="5" cy="12.4" r="1" fill="#fff"/><path d="M4 7L5 4.4L6 7L8.6 7.2L6.6 8.6L7.4 11L5 9.6L2.8 11L3.6 8.6L1.6 7.2Z" fill="#ffe14d"/></svg>';
  MQ.MYTH_IDS = Object.keys(MYTH);
  // The merchant's week charms: MQ.charmArt(id) → '<svg …>' (bright, glowing).
  const CHARM = {
    // a four-leaf clover with golden edges
    clover: (k) => [lin(k + 'l', ['#b8f27a', '#43b02a'], 1, 1) + glowG(k + 'w', '#b8f27a'),
      mL('M64 62C70 80 70 94 82 108', '#2f7a1f', 4.4) +
      [0, 90, 180, 270].map((r) => `<g transform="rotate(${r + 45} 60 58)">${mP('M60 58C52 48 40 44 38 32C36 22 48 18 54 26C56 18 68 18 68 30C68 42 62 48 60 58Z', `url(#${k}l)`, mo('#c99a00', 2.2))}${mL('M60 56L60 32', '#2f7a1f', 1.4)}</g>`).join('') +
      mC(60, 58, 4, '#ffe14d', mo('#a8650a', 1.2)) +
      mE(88, 92, 7, 6, '#ff3d3d', mo('#7a1a1a', 1.4)) + mC(94, 88, 3.4, '#2b2140') + mL('M88 86L88 98', '#7a1a1a', 1.2) + mC(85, 92, 1.4, '#2b2140') + mC(91, 95, 1.4, '#2b2140') +
      spk(18, 18, 7, '#fff3a6') + spk(104, 20, 5, '#ffffff') + spk(16, 96, 5, '#d8ffb0') + spk(106, 62, 4, '#fff3a6')],
    // a round bottle of liquid sunshine
    sun: (k) => [lin(k + 'g', ['#ffffff', '#e6f6ff'], 1, 1) + lin(k + 'l', ['#fff3a6', '#ffcf48', '#ff9a2e'], 0, 1) + glowG(k + 'w', '#ffe066') + `<clipPath id="${k}c"><circle cx="60" cy="74" r="32"/></clipPath>`,
      mP('M50 22L70 22L70 44L50 44Z', `url(#${k}g)`, mo('#7a8ab8', 2.2)) + mP('M48 12L72 12L70 24L50 24Z', '#c98a4b', mo('#7a4a1e', 2)) +
      mC(60, 74, 32, `url(#${k}g)`) + `<g clip-path="url(#${k}c)">${mP('M24 66C36 60 48 72 60 66C72 60 84 72 96 66L96 110L24 110Z', `url(#${k}l)`)}</g>` +
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const t = (a * Math.PI) / 180; return mL(`M${f1(60 + 12 * Math.cos(t))} ${f1(84 + 12 * Math.sin(t))}L${f1(60 + 18 * Math.cos(t))} ${f1(84 + 18 * Math.sin(t))}`, '#ff8a1f', 2.6); }).join('') +
      mC(60, 84, 9, '#ffe14d', mo('#ff8a1f', 2)) + mC(57, 82, 1.3, '#a8650a') + mC(63, 82, 1.3, '#a8650a') + mL('M56 87Q60 90 64 87', '#a8650a', 1.4) +
      mC(60, 74, 32, 'none', mo('#7a8ab8', 2.6)) + mE(44, 62, 5, 10, '#ffffff', ' opacity=".7" transform="rotate(30 44 62)"') +
      spk(18, 24, 7, '#fff3a6') + spk(102, 30, 6, '#ffffff') + spk(104, 100, 5, '#ffe066') + spk(14, 92, 4, '#ffffff')],
    // a golden piggy bank with a crown, a coin dropping in
    piggy: (k) => [lin(k + 'b', ['#fff6c4', '#ffcf48', '#d98a10'], 1, 1) + glowG(k + 'w', '#ffe066'),
      mL('M98 70C106 64 110 72 104 74C100 76 102 68 106 68', '#a8650a', 2.4) +
      legs([44, 56, 74, 86], 88, 98, `url(#${k}b)`, '#a8650a', mo('#8a5a08', 1.6)) +
      mE(66, 74, 34, 22, `url(#${k}b)`, mo('#8a5a08', 2.6)) +
      mP('M44 56L42 42L56 52Z', `url(#${k}b)`, mo('#8a5a08', 2)) +
      mE(32, 76, 9, 8, '#ffe680', mo('#8a5a08', 2)) + mE(30, 75, 1.5, 2.4, '#8a5a08') + mE(35, 75, 1.5, 2.4, '#8a5a08') +
      eye(46, 66, 3.2) + mE(52, 78, 4, 2.6, '#ff8a5a', ' opacity=".45"') + mL('M60 54L80 54', '#8a5a08', 3) +
      mP('M54 42L56 30L62 37L66 28L70 37L76 30L78 42Z', '#ffd23f', mo('#a8650a', 1.6)) + mC(66, 34, 1.8, '#ff4d6d') +
      mE(92, 26, 9, 9, '#ffe14d', mo('#a8650a', 2)) + mL('M92 21L92 31M89 23.5C89 21 95 21 95 24C95 26.5 89 26 89 28.5C89 31 95 31 95 29', '#a8650a', 1.4) +
      spk(18, 22, 7, '#fff3a6') + spk(110, 56, 5, '#ffffff') + spk(14, 100, 5, '#ffe066') + mC(108, 100, 2.2, '#ffe066')],
    // a sack of Mythic Feed: purple, tied with gold, glowing seeds spilling out
    myth: (k) => [lin(k + 's', ['#b48cf2', '#7a3fd1', '#4a1f9a'], 1, 1) + glowG(k + 'w', '#ffb8f0'),
      mP('M34 50C28 72 30 96 40 104L80 104C90 96 92 72 86 50Z', `url(#${k}s)`, mo('#2e1260', 2.6)) +
      mP('M38 50C40 38 50 34 60 40C70 34 80 38 82 50Z', '#c9a0ff', mo('#2e1260', 2.2)) + mL('M38 52Q60 58 82 52', '#ffd23f', 4) +
      star(60, 78, 13, '#ffe14d', mo('#a8650a', 1.6)) + star(44, 92, 5, '#ffffff') + star(78, 64, 4.5, '#ffffff') +
      ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'].map((c, i) => mC(90 + i * 3.5, 104 - (i % 2) * 4, 3, c, mo('#ffffff', 1))).join('') +
      spk(18, 22, 7, '#fff3a6') + spk(104, 24, 6, '#ffb8f0') + spk(14, 86, 4, '#ffffff') + spk(104, 82, 4, '#fff3a6')],
  };
  MQ.charmArt = (id) => {
    const f = CHARM[id];
    if (!f) return '';
    const k = 'c' + (++uid).toString(36), [defs, body] = f(k);
    return `<svg class="tart charm c-${id}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>${defs}</defs><circle cx="60" cy="62" r="56" fill="url(#${k}w)"/>${body}</svg>`;
  };

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
