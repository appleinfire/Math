// Pictures for the Hatchery's magical creatures and its eggs: small flat SVGs drawn from code (no image files).
// Real animals stay emoji everywhere; the creatures from Crystal, Legendary and Dragon eggs are drawn here.
//   MQ.art(id, { stage })      → '<svg …>' for a creature ('' when it has no picture). Dragons take a stage:
//                                 0 baby (still in the eggshell), 1 young, 2 grown, 3 elder (with a crown).
//   MQ.eggArt(tier, { crack, glow }) → an egg of the tier; crack 0…1 draws the crack, glow colors the light inside.
// Every call makes its own gradient ids, so one picture can be on the screen many times.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  let uid = 0;
  const f1 = (x) => +(+x).toFixed(1);
  const svg = (body, defs) => `<svg class="art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  const ol = (c, w = 2.5) => ` stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
  const P = (d, fill, o = '') => `<path d="${d}" fill="${fill}"${o}/>`;
  const E = (x, y, rx, ry, fill, o = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"${o}/>`;
  const C = (x, y, r, fill, o = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${o}/>`;
  const L = (d, c, w = 2.5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const G = (t, s) => `<g transform="${t}">${s}</g>`;
  // the same path flipped left ↔ right (paths here use only M, L, C, Q and Z with absolute x y pairs)
  const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (m, x, y) => `${f1(120 - x)} ${y}`);
  const pair = (d, fill, o = '') => P(d, fill, o) + P(mir(d), fill, o);
  const spk = (x, y, r, c = '#ffffff') => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
  const star = (x, y, r, c, o = '') => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push(f1(x + rr * Math.cos(a)) + ',' + f1(y + rr * Math.sin(a))); }
    return `<polygon points="${pts.join(' ')}" fill="${c}"${o}/>`;
  };
  const flake = (x, y, r, c = '#ffffff') => L([0, 60, 120].map((a) => { const t = (a * Math.PI) / 180, dx = f1(r * Math.cos(t)), dy = f1(r * Math.sin(t)); return `M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}`; }).join(''), c, 1.8);
  const lin = (id, cols, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${cols.map((c, i) => `<stop offset="${f1(i / (cols.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rad = (id, cols, cx = 0.4, cy = 0.35, r = 0.75) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${cols.map((c, i) => `<stop offset="${f1(i / (cols.length - 1))}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const glowG = (id, c) => `<radialGradient id="${id}"><stop offset="0.45" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  // faces
  const dots = (x1, x2, y, s = 1, iris = '#2b2140') => [x1, x2].map((x) => G(`translate(${x} ${y}) scale(${s})`, E(0, 0, 3.6, 4.6, iris) + C(1.2, -1.6, 1.4, '#ffffff'))).join('');
  const bigEyes = (x1, x2, y, s = 1, iris = '#2b2140') => [x1, x2].map((x) => G(`translate(${x} ${y}) scale(${s})`, E(0, 0, 6.5, 7.5, '#ffffff') + E(1, 1, 4.2, 5.2, iris) + C(2.6, -1.6, 1.7, '#ffffff'))).join('');
  const blush = (x1, x2, y, c = '#ff7aa8') => E(x1, y, 4, 2.5, c, ' opacity=".45"') + E(x2, y, 4, 2.5, c, ' opacity=".45"');
  const smile = (x, y, w, c, sw = 2) => L(`M${x - w} ${y}Q${x} ${y + w * 0.75} ${x + w} ${y}`, c, sw);

  const A = {}; // id → (k, opts) → [defs, body]; k is a unique prefix for gradient ids

  // ---------------------------------------------------------------- Crystal Egg: magic critters (flat colors)
  // Fox-shaped animals sitting and facing us: Ember Fox, Moon Wolf and (with nine tails) the Kitsune.
  function canine(k, c) {
    const o = ol(c.dark);
    const tail = c.tails ? '' : P('M70 100C100 104 112 80 101 62C97 56 90 58 92 66C96 80 86 92 70 92Z', c.tailFill || c.fur, o);
    return tail + (c.back || '') + P('M43 104C39 86 46 70 60 66C74 70 81 86 77 104Z', c.fur, o) +
      P('M51 70C55 80 65 80 69 70C69 85 65 96 60 101C55 96 51 85 51 70Z', c.chest) +
      E(50, 105, 7.5, 4.5, c.sock) + E(70, 105, 7.5, 4.5, c.sock) +
      pair('M38 44L35 13L56 34Z', c.fur, o) + pair('M40 38L38.5 21L50 33Z', c.inner) +
      P('M32 44C34 30 46 28 60 28C74 28 86 30 88 44C88 54 80 60 72 62L60 72L48 62C40 60 32 54 32 44Z', c.fur, o) +
      P('M36 50C44 56 52 58 60 72C68 58 76 56 84 50C82 58 74 62 70 63L60 72L50 63C46 62 38 58 36 50Z', c.chest) +
      E(60, 70, 4, 3, '#2b2140') + (c.liner ? L('M43 44L53 45M77 44L67 45', c.liner, 2.4) : '') + dots(49, 71, 46) + blush(42, 78, 54) + (c.mark || '') + (c.front || '');
  }
  A.emberfox = () => ['', C(18, 28, 2.4, '#ffb02e') + C(106, 20, 2, '#ff8a1f') + C(12, 70, 1.8, '#ffd166') +
    canine(0, { fur: '#f07b2e', dark: '#9a3f12', chest: '#fff4e8', sock: '#5b3524', inner: '#5b3524',
      front: P('M101 63C95 53 99 43 104 37C104 45 111 48 109 57C108 62 104 64 101 63Z', '#ff8a1f') + P('M101 62C98 57 100 52 103 48C104 53 107 55 105 59Z', '#ffe14d'),
      mark: P('M60 30C57 24 59 19 62 16C62 21 65 22 64 26C63.5 28.5 62 30 60 30Z', '#ffd166') })];
  A.moonwolf = () => ['', spk(16, 24, 6, '#fff3a6') + spk(104, 16, 5, '#fff3a6') + spk(108, 52, 3.5, '#d9e0ff') + C(14, 60, 1.8, '#fff3a6') +
    canine(0, { fur: '#9aa6dc', dark: '#3d4878', chest: '#eef0ff', sock: '#56609e', inner: '#56609e', tailFill: '#8794cf',
      front: P('M101 62C99 58 103 54 106 56C104 58 104 60 106 62C104 64 102 64 101 62Z', '#eef0ff'),
      mark: P('M61 29C56 30 54 36 57 40C59 43 64 43 66 41C62 41 59 38 59 35C59 32 60 30 61 29Z', '#ffe066') })];
  A.stardust = (k) => [lin(k + 'a', ['#5563c9', '#2f347f']),
    P('M76 100C98 104 104 84 96 72C92 66 86 70 90 76C94 84 88 94 76 94Z', `url(#${k}a)`, ol('#1c2160')) +
    P('M42 104C38 86 44 72 60 70C76 72 82 86 78 104Z', `url(#${k}a)`, ol('#1c2160')) + E(60, 90, 11, 13, '#7d8be0') +
    E(50, 105, 8, 5, '#4a57b8', ol('#1c2160')) + E(70, 105, 8, 5, '#4a57b8', ol('#1c2160')) +
    pair('M36 42L37 15L57 32Z', '#4a57b8', ol('#1c2160')) + pair('M40 37L40.5 23L51 32Z', '#ff9ad5') +
    E(60, 52, 27, 22, `url(#${k}a)`, ol('#1c2160')) +
    [[49, 52], [71, 52]].map(([x, y]) => E(x, y, 6.5, 7.5, '#ffe066') + E(x, y + 0.5, 2.4, 6, '#1a1640') + C(x + 2.4, y - 2.6, 1.6, '#ffffff')).join('') +
    P('M57 60L63 60L60 63Z', '#ff9ad5') + L('M55 65Q58 67 60 64Q62 67 65 65', '#d9dcff', 1.8) + blush(41, 79, 61) +
    L('M38 60L26 58M38 64L27 66M82 60L94 58M82 64L93 66', '#d9dcff', 1.4) +
    star(50, 37, 3, '#ffe066') + star(74, 40, 2.4, '#ffe066') + star(54, 86, 2.6, '#ffe066') + star(68, 96, 2, '#ffe066') + star(92, 80, 2.2, '#ffe066') +
    spk(18, 30, 6, '#ffe066') + spk(104, 22, 5, '#ffffff') + spk(20, 88, 4, '#ffffff')];
  A.frostowl = () => ['', flake(16, 24, 6, '#9fd8ff') + flake(104, 20, 5, '#9fd8ff') + flake(106, 96, 4, '#9fd8ff') + spk(14, 70, 4, '#cfeeff') +
    pair('M36 44L30 18L52 34Z', '#cfeaff', ol('#3d7fb0')) + E(60, 70, 31, 36, '#dff3ff', ol('#3d7fb0')) +
    pair('M30 60C20 74 22 94 34 102C40 90 40 74 36 62Z', '#a9dcfa', ol('#3d7fb0')) +
    E(60, 82, 19, 22, '#ffffff') + L('M52 74L55 77L58 74M62 74L65 77L68 74M50 84L53 87L56 84M64 84L67 87L70 84M57 93L60 96L63 93', '#9fcbe8', 1.6) +
    C(47, 56, 13, '#ffffff', ol('#3d7fb0', 2)) + C(73, 56, 13, '#ffffff', ol('#3d7fb0', 2)) +
    [47, 73].map((x) => C(x, 56, 8, '#5cc4ff') + C(x, 56, 4.6, '#1d2a4a') + C(x + 2.4, 53.4, 1.8, '#ffffff')).join('') +
    P('M55 64L65 64L60 74Z', '#ffb84d', ol('#b5600c', 1.8)) +
    L('M48 104L48 110M44 106L48 110L52 106M72 104L72 110M68 106L72 110L76 106', '#ff9f2e', 2.6)];
  A.moonrabbit = (k) => [rad(k + 'm', ['#fffbe0', '#ffe991', '#f7cf55'], 0.45, 0.4, 0.7),
    C(70, 48, 42, `url(#${k}m)`) + C(52, 30, 6, '#f4d66e', ' opacity=".6"') + C(88, 64, 8, '#f4d66e', ' opacity=".6"') + C(92, 32, 4, '#f4d66e', ' opacity=".6"') +
    G('rotate(-10 46 30)', E(46, 30, 6.5, 19, '#fdfbff', ol('#8b80b8')) + E(46, 31, 3, 14, '#ffc4dc')) +
    G('rotate(12 64 28)', E(64, 28, 6.5, 19, '#fdfbff', ol('#8b80b8')) + E(64, 29, 3, 14, '#ffc4dc')) +
    C(78, 94, 7, '#ffffff', ol('#8b80b8')) + E(56, 88, 23, 20, '#fdfbff', ol('#8b80b8')) +
    E(46, 104, 9, 5, '#fdfbff', ol('#8b80b8')) + E(66, 104, 9, 5, '#fdfbff', ol('#8b80b8')) +
    C(55, 58, 17, '#fdfbff', ol('#8b80b8')) + dots(49, 62, 56, 0.9) + P('M53 63L57 63L55 65.5Z', '#ff8fb1') +
    L('M55 66Q53 69 51 68M55 66Q57 69 59 68', '#8b80b8', 1.6) + blush(44, 67, 63) +
    E(48, 84, 4.5, 6, '#fdfbff', ol('#8b80b8', 2)) + E(63, 84, 4.5, 6, '#fdfbff', ol('#8b80b8', 2)) +
    spk(16, 22, 6, '#fff3a6') + spk(108, 100, 5, '#fff3a6') + spk(20, 96, 4, '#ffffff')];
  A.wishfish = (k) => [lin(k + 'a', ['#fff0a0', '#ffcf3a', '#f5a01a']),
    C(14, 40, 4.5, 'none', ol('#7cc7f0', 2)) + C(9, 28, 3, 'none', ol('#7cc7f0', 2)) + C(16, 19, 2, 'none', ol('#7cc7f0', 1.6)) +
    P('M80 60C90 44 102 37 112 34C107 50 107 70 112 86C102 83 90 76 80 60Z', '#ff9f2e', ol('#b5600c')) + L('M88 60L108 44M88 60L109 60M88 60L108 76', '#ffd166', 2) +
    P('M48 42C53 28 66 25 75 31C69 35 65 41 63 46Z', '#ff9f2e', ol('#b5600c')) + P('M50 78C51 89 60 94 67 92C63 88 61 83 61 78Z', '#ff9f2e', ol('#b5600c')) +
    P('M22 60C34 36 66 33 84 52C88 56 88 64 84 68C66 87 34 84 22 60Z', `url(#${k}a)`, ol('#b5600c')) +
    [[54, 52], [64, 50], [59, 61], [69, 60], [54, 70], [64, 70], [74, 66]].map(([x, y]) => L(`M${x - 4} ${y}Q${x} ${y + 5} ${x + 4} ${y}`, '#e08a12', 1.6)).join('') +
    C(38, 56, 6.5, '#ffffff') + C(37, 57, 4, '#2b2140') + C(38.6, 55, 1.5, '#ffffff') + smile(30, 65, 4, '#b5600c') + E(44, 66, 3.5, 2.2, '#ff7aa8', ' opacity=".45"') +
    G('rotate(-14 40 35)', P('M30 40L31 28L36 33L40 25L44 33L49 28L50 40Z', '#ffd23f', ol('#a8650a', 1.8)) + C(40, 35, 2.2, '#ff4d6d')) +
    spk(98, 18, 6, '#ffe66d') + spk(100, 100, 5, '#ffe66d')];
  // Side-view hoofed animals facing left: the Little Humpbacked Horse, Silver Hoof and Pegasus.
  function hoofed(c) {
    const o = ol(c.dark), legs = c.thin ? [[52, 4], [60, 4], [80, 4], [88, 4]] : [[52, 6], [60, 6], [80, 6], [88, 6]];
    const leg = ([x, w], i) => {
      if (c.lift && i === 0) return P(`M${x} 84L${x - 6} 94L${x - 12} 92`, 'none', ` stroke="${c.dark}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"`) + P(`M${x} 84L${x - 6} 94L${x - 12} 92`, 'none', ` stroke="${c.body}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`) + E(x - 13, 92, 4, 3.4, c.hoof, ol(c.dark, 1.8));
      const shade = i % 2 ? ' opacity=".8"' : '';
      return `<g${shade}>${P(`M${x - w / 2} 82L${x - w / 2} 104L${x + w / 2} 104L${x + w / 2} 82Z`, c.body, o)}${P(`M${x - w / 2 - 0.5} 100L${x + w / 2 + 0.5} 100L${x + w / 2 + 0.5} 106L${x - w / 2 - 0.5} 106Z`, c.hoof, ol(c.dark, 1.8))}</g>`;
    };
    return (c.behind || '') + P('M92 70C106 70 110 86 102 98C100 90 96 84 92 82Z', c.mane, o) + legs.map(leg).join('') +
      E(70, 76, c.thin ? 21 : 24, c.thin ? 12 : 14, c.body, o) + (c.hump || '') +
      P('M42 48C46 56 50 64 52 74L70 70C64 60 56 48 50 38Z', c.body) +
      P('M38 28C46 28 50 36 50 44C50 50 46 56 40 58L26 60C18 60 14 54 16 48C18 42 24 36 30 32C32 30 35 28 38 28Z', c.body, o) +
      L('M50 40C56 50 62 60 68 70', c.dark, 2.5) + P('M44 30C54 32 62 46 70 64L62 68C58 54 52 42 44 36Z', c.mane, o) +
      (c.ears || P('M36 31L38 18L45 29Z', c.body, o)) + P('M34 30C38 24 44 26 44 32C40 30 38 32 36 34Z', c.mane, o) +
      E(22, 54, 7, 5.5, c.snout) + E(20, 53, 1.4, 1.8, c.dark) + smile(25, 57, 3, c.dark, 1.6) +
      G('translate(37 42)', E(0, 0, 3.4, 4.4, '#2b2140') + C(1.2, -1.5, 1.3, '#ffffff')) + E(31, 49, 3.5, 2.2, '#ff7aa8', ' opacity=".45"') + (c.front || '');
  }
  A.humpbackhorse = () => ['', spk(100, 22, 6, '#ffe066') + spk(14, 92, 4, '#ffe066') + L('M98 40L112 40M100 48L116 48', '#e2b07a', 2) +
    hoofed({ body: '#f0b86e', dark: '#8a5526', mane: '#6b3d1f', snout: '#ffe2b8', hoof: '#5b3a26',
      hump: C(64, 63, 8, '#f0b86e', ol('#8a5526')) + C(77, 63, 8, '#f0b86e', ol('#8a5526')) + E(70, 72, 20, 8, '#f0b86e'),
      ears: G('rotate(-14 34 22)', E(34, 20, 4, 15, '#f0b86e', ol('#8a5526')) + E(34, 20, 1.8, 10, '#ffc4a0')) + G('rotate(10 44 22)', E(44, 20, 4, 15, '#f0b86e', ol('#8a5526')) + E(44, 20, 1.8, 10, '#ffc4a0')) })];
  A.silverhoof = (k) => [lin(k + 'h', ['#ffffff', '#c9d2e3', '#8e9ab3']),
    spk(12, 70, 5, '#ffffff') + spk(104, 20, 5, '#d8f3ff') +
    hoofed({ body: '#fbf8f2', dark: '#7d7890', mane: '#e6e0d4', snout: '#ffffff', hoof: `url(#${k}h)`, thin: true, lift: true,
      ears: P('M34 34L22 30L32 38Z', '#fbf8f2', ol('#7d7890')) + P('M46 34L56 28L48 38Z', '#fbf8f2', ol('#7d7890')) +
        L('M38 30L34 14M35.5 20L28 15M36 25L30 24M42 30L46 12M44 20L52 16M45 16L42 8', '#c9a26a', 3),
      front: P('M20 60L22 66L26 62Z', '#e6e0d4', ol('#7d7890', 1.5)) +
        P('M18 106L22 100L26 106L22 112Z', '#ff4d6d', ol('#a32040', 1.4)) + P('M28 108L33 101L38 108L33 114Z', '#3ddc84', ol('#1a8a4a', 1.4)) + P('M8 108L12 102L16 108L12 113Z', '#4dc9ff', ol('#1f78a8', 1.4)) +
        spk(30, 94, 4, '#ffe14d') + spk(10, 96, 3, '#ffffff') })];
  A.frogprince = () => ['', E(60, 106, 46, 10, '#5fbf5f', ol('#2f7a3a', 2)) + P('M60 106L76 98L80 104Z', '#e9f6ff') +
    E(31, 95, 13, 8, '#6fcf5a', ol('#2f7a3a')) + E(89, 95, 13, 8, '#6fcf5a', ol('#2f7a3a')) +
    P('M30 98C26 78 38 62 60 62C82 62 94 78 90 98Z', '#6fcf5a', ol('#2f7a3a')) + E(60, 88, 18, 12, '#d9f7a8') +
    E(47, 101, 7, 4, '#6fcf5a', ol('#2f7a3a', 2)) + E(73, 101, 7, 4, '#6fcf5a', ol('#2f7a3a', 2)) +
    C(44, 42, 12, '#6fcf5a', ol('#2f7a3a')) + C(76, 42, 12, '#6fcf5a', ol('#2f7a3a')) + E(60, 56, 31, 18, '#6fcf5a', ol('#2f7a3a')) +
    C(44, 41, 8, '#ffffff') + C(76, 41, 8, '#ffffff') + C(45, 42, 4.6, '#1f2a1a') + C(77, 42, 4.6, '#1f2a1a') + C(47, 40, 1.8, '#ffffff') + C(79, 40, 1.8, '#ffffff') +
    smile(60, 62, 16, '#2f7a3a', 2.4) + blush(36, 84, 62) + C(55, 54, 1.2, '#2f7a3a') + C(65, 54, 1.2, '#2f7a3a') +
    P('M49 33L48 17L55 23L60 12L65 23L72 17L71 33Z', '#ffd23f', ol('#a8650a', 2)) + C(60, 26, 2.6, '#ff4d6d') + C(52, 28, 1.6, '#4dc9ff') + C(68, 28, 1.6, '#4dc9ff') +
    spk(16, 26, 6, '#ffe066') + spk(104, 24, 5, '#ffe066')];
  A.pixie = (k) => [lin(k + 'w', ['#ffffff', '#c9f0ff']) + lin(k + 'd', ['#c9a7ff', '#8f6fe8']),
    G('rotate(-35 36 52)', E(36, 52, 18, 10, `url(#${k}w)`, ol('#7cc7f0', 2))) + G('rotate(25 38 72)', E(38, 72, 12, 7, `url(#${k}w)`, ol('#7cc7f0', 2))) +
    G('rotate(35 84 52)', E(84, 52, 18, 10, `url(#${k}w)`, ol('#7cc7f0', 2))) + G('rotate(-25 82 72)', E(82, 72, 12, 7, `url(#${k}w)`, ol('#7cc7f0', 2))) +
    L('M54 96L54 106M66 96L66 106', '#f2b896', 4) + E(53, 107, 4.5, 2.6, '#ff7ab6') + E(67, 107, 4.5, 2.6, '#ff7ab6') +
    L('M50 70L40 82M70 70L80 78', '#f2b896', 4) + L('M80 78L94 56', '#c9a26a', 2.6) + star(95, 53, 7, '#ffe14d', ol('#c99a00', 1.2)) +
    P('M50 66L70 66L80 96C74 100 66 98 60 99C54 98 46 100 40 96Z', `url(#${k}d)`, ol('#6a4bbf')) + L('M44 92Q48 97 52 94Q56 98 60 95Q64 98 68 94Q72 97 76 92', '#ffffff', 1.6) +
    P('M44 46L36 40L44 52Z', '#ffe0cc', ol('#c98a6a', 1.6)) + P('M76 46L84 40L76 52Z', '#ffe0cc', ol('#c98a6a', 1.6)) +
    C(60, 46, 17, '#ffe0cc', ol('#c98a6a', 2)) + C(60, 24, 7, '#ff7ab6', ol('#c2407e', 2)) +
    P('M42 48C40 30 50 26 60 26C70 26 80 30 78 48C74 40 68 36 60 36C52 36 46 40 42 48Z', '#ff7ab6', ol('#c2407e', 2)) +
    C(72, 32, 3, '#ffe14d') + dots(53, 67, 48, 0.85) + blush(48, 72, 54) + smile(60, 55, 3.5, '#c2407e', 1.8) +
    spk(18, 24, 6, '#ffe066') + spk(104, 98, 5, '#c9f0ff') + spk(16, 96, 4, '#ffe066')];
  A.gnome = () => ['', E(60, 108, 34, 5, '#8fd36a', ' opacity=".7"') +
    P('M44 78L76 78L84 104L36 104Z', '#5fb86b', ol('#2f7a3a')) + P('M38 96L82 96L83 100L37 100Z', '#8a5a32') +
    E(48, 106, 9, 5, '#8a5a32', ol('#4b2e17', 2)) + E(72, 106, 9, 5, '#8a5a32', ol('#4b2e17', 2)) +
    C(36, 86, 6, '#ff5a4f', ol('#9c2a1e', 2)) + C(84, 86, 6, '#ff5a4f', ol('#9c2a1e', 2)) +
    E(60, 64, 17, 13, '#ffd9c2', ol('#c98a6a', 2)) +
    P('M43 68C43 92 51 100 60 100C69 100 77 92 77 68C72 75 66 75 60 73C54 75 48 75 43 68Z', '#ffffff', ol('#9aa3b8', 2)) +
    C(60, 69, 5, '#ffb0a0', ol('#c98a6a', 1.6)) + dots(53, 67, 62, 0.75) + blush(47, 73, 67) +
    P('M22 54C22 30 40 16 60 16C80 16 98 30 98 54C98 60 90 62 60 62C30 62 22 60 22 54Z', '#ff5a4f', ol('#9c2a1e')) +
    C(40, 34, 5, '#ffffff') + C(62, 26, 6, '#ffffff') + C(80, 38, 4.5, '#ffffff') + C(50, 48, 3.5, '#ffffff') + C(88, 52, 3, '#ffffff') + C(30, 50, 3, '#ffffff') +
    spk(14, 22, 5, '#ffe066') + spk(106, 18, 4, '#ffe066')];
  A.rainbowsnail = () => {
    const ring = ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'];
    return ['', spk(94, 104, 4, '#ffb84d') + spk(106, 96, 3, '#5ec8ff') + spk(112, 106, 2.5, '#a77bff') + L('M88 108L114 108', '#a77bff', 2) +
      P('M14 102C14 94 18 88 22 80C24 72 30 66 36 68C42 70 42 78 40 86L96 88C104 90 106 100 98 102Z', '#c8f08a', ol('#5a9a2a')) +
      ring.map((c, i) => C(70, 62, 30 - i * 5, c, i ? '' : ol('#6a4bbf'))).join('') + L('M70 62C70 58 76 58 76 63C76 70 64 70 64 62C64 52 82 52 82 63C82 76 58 76 58 62', '#ffffff', 1.6) +
      L('M28 70L22 48M36 70L40 50', '#5a9a2a', 2.6) + C(22, 46, 5.5, '#ffffff', ol('#5a9a2a', 2)) + C(40, 48, 5.5, '#ffffff', ol('#5a9a2a', 2)) +
      C(23, 47, 3, '#2b2140') + C(41, 49, 3, '#2b2140') + C(24, 45.6, 1.1, '#ffffff') + C(42, 47.6, 1.1, '#ffffff') +
      smile(26, 82, 4, '#5a9a2a') + E(35, 84, 3.2, 2, '#ff7aa8', ' opacity=".5"') + spk(102, 26, 6, '#ffe066') + spk(18, 22, 4, '#ff8fc7')];
  };
  A.thistlehog = () => {
    const pts = [];
    for (let i = 0; i <= 26; i++) { const a = Math.PI + (i * Math.PI) / 26, r = i % 2 ? 31 : 41; pts.push(f1(64 + r * Math.cos(a) * 1.05) + ',' + f1(86 + r * Math.sin(a))); }
    const flower = (x, y) => L(`M${x - 4} ${y - 2}L${x - 6} ${y - 9}M${x} ${y - 3}L${x} ${y - 11}M${x + 4} ${y - 2}L${x + 6} ${y - 9}M${x - 2} ${y - 3}L${x - 3} ${y - 10}M${x + 2} ${y - 3}L${x + 3} ${y - 10}`, '#c46ae8', 2.4) + E(x, y + 1, 5, 4, '#6fbf5a', ol('#2f7a3a', 1.4));
    return ['', `<polygon points="${pts.join(' ')}" fill="#a0704a"${ol('#5a3a22')}/>` + L('M40 70L46 60M58 58L60 48M76 60L82 52M88 72L96 66', '#7a5232', 2) +
      E(66, 98, 32, 8, '#f3d3a8', ol('#a0704a', 2)) + E(48, 104, 6, 4, '#5a3a22') + E(82, 104, 6, 4, '#5a3a22') +
      P('M50 74C46 68 38 68 30 74C24 78 18 84 16 88C22 92 30 96 40 96C50 96 56 88 54 80Z', '#f3d3a8', ol('#a0704a')) +
      C(16, 88, 3.4, '#2b2140') + C(42, 72, 4.5, '#f3d3a8', ol('#a0704a', 2)) + G('translate(32 81)', E(0, 0, 3, 3.8, '#2b2140') + C(1, -1.3, 1.2, '#ffffff')) +
      E(38, 88, 3.4, 2.2, '#ff7aa8', ' opacity=".5"') + smile(24, 92, 3, '#a0704a', 1.6) +
      flower(56, 50) + flower(82, 58) + flower(98, 76) + spk(16, 28, 5, '#ffe066') + spk(104, 30, 4, '#e9b8ff')];
  };
  A.bubbleturtle = (k) => [lin(k + 's', ['#5fd6c4', '#2a9d8f']),
    C(18, 34, 6, 'none', ol('#7cc7f0', 2)) + C(10, 20, 3.5, 'none', ol('#7cc7f0', 2)) + C(28, 16, 2.5, 'none', ol('#7cc7f0', 1.6)) + C(104, 24, 5, 'none', ol('#7cc7f0', 2)) + C(112, 36, 2.5, 'none', ol('#7cc7f0', 1.6)) +
    G('rotate(-30 44 46)', E(44, 46, 6, 14, '#86dba0', ol('#2f7a5a'))) + E(98, 66, 6, 3.5, '#86dba0', ol('#2f7a5a', 2)) +
    G('rotate(28 92 84)', E(92, 84, 6, 13, '#86dba0', ol('#2f7a5a'))) + G('rotate(-40 42 86)', E(42, 86, 7, 16, '#86dba0', ol('#2f7a5a'))) +
    E(66, 72, 34, 8, '#d9f5c4', ol('#2f7a5a')) + P('M32 70C32 50 48 38 66 38C84 38 100 50 100 70Z', `url(#${k}s)`, ol('#1f6b5f')) +
    P('M58 52L66 47L74 52L74 60L66 64L58 60Z', '#8be8d6', ol('#1f6b5f', 1.6)) + P('M40 64L48 58L56 62L56 69L40 69Z', '#8be8d6', ol('#1f6b5f', 1.6)) + P('M76 62L84 58L92 64L92 69L76 69Z', '#8be8d6', ol('#1f6b5f', 1.6)) +
    P('M46 52L52 46L58 50L56 56L48 58Z', '#8be8d6', ol('#1f6b5f', 1.4)) + P('M74 50L80 46L86 52L84 58L76 56Z', '#8be8d6', ol('#1f6b5f', 1.4)) +
    C(24, 66, 13, '#86dba0', ol('#2f7a5a')) + G('translate(20 63)', E(0, 0, 3.4, 4.2, '#2b2140') + C(1.2, -1.4, 1.3, '#ffffff')) + smile(17, 71, 3.5, '#2f7a5a', 1.8) + E(28, 70, 3, 2, '#ff7aa8', ' opacity=".5"') +
    C(8, 56, 4, '#ffffff', ' opacity=".9"' + ol('#7cc7f0', 1.6)) + C(9, 44, 2.5, 'none', ol('#7cc7f0', 1.4))];
  A.glimmerwing = (k) => [lin(k + 'u', ['#ff9ad5', '#b48cf2'], 1, 1) + lin(k + 'l', ['#7fd8ff', '#5ec8c0'], 1, 1),
    pair('M58 56C44 28 18 20 12 34C6 48 22 64 56 64Z', `url(#${k}u)`, ol('#7a3fa8')) + pair('M58 64C40 66 22 78 26 92C30 104 48 100 58 74Z', `url(#${k}l)`, ol('#2f7a8a')) +
    C(30, 40, 6.5, '#ffffff', ' opacity=".75"') + C(90, 40, 6.5, '#ffffff', ' opacity=".75"') + C(30, 40, 3, '#ffe14d') + C(90, 40, 3, '#ffe14d') +
    P('M38 84L42 78L46 84L42 90Z', '#ffffff', ' opacity=".85"') + P('M82 84L78 78L74 84L78 90Z', '#ffffff', ' opacity=".85"') + C(44, 52, 3, '#ffffff', ' opacity=".6"') + C(76, 52, 3, '#ffffff', ' opacity=".6"') +
    E(60, 70, 5.5, 22, '#6a3fb5', ol('#3d2370', 2)) + L('M56 38C52 28 48 24 44 22M64 38C68 28 72 24 76 22', '#3d2370', 2) + star(44, 21, 4.5, '#ffe14d') + star(76, 21, 4.5, '#ffe14d') +
    C(60, 44, 9, '#8c5bd6', ol('#3d2370', 2)) + dots(56.5, 63.5, 43.5, 0.6) + smile(60, 47.5, 2.4, '#ffffff', 1.4) +
    spk(14, 100, 5, '#ffe066') + spk(106, 100, 5, '#ffe066') + spk(104, 14, 4, '#ffffff')];
  A.acornsprite = (k) => [lin(k + 'b', ['#e8b075', '#b87a3e']),
    pair('M40 70C26 56 12 60 8 72C20 76 30 78 40 74Z', '#8fd36a', ol('#3f8a2a', 2)) + L('M38 72L14 70M28 72L20 66M28 72L20 76', '#3f8a2a', 1.4) + L('M82 72L106 70M92 72L100 66M92 72L100 76', '#3f8a2a', 1.4) +
    L('M52 100L52 108M68 100L68 108', '#6b4224', 4) + E(51, 109, 4.5, 2.4, '#4b2e17') + E(69, 109, 4.5, 2.4, '#4b2e17') +
    P('M38 58C38 86 48 104 60 106C72 104 82 86 82 58Z', `url(#${k}b)`, ol('#7a4a22')) + dots(52, 68, 74, 0.9) + blush(46, 74, 82) + smile(60, 84, 4, '#7a4a22') +
    P('M30 60C30 44 44 34 60 34C76 34 90 44 90 60C90 64 84 64 60 64C36 64 30 64 30 60Z', '#8a5a32', ol('#4b2e17')) +
    L('M38 44L48 62M50 38L62 62M64 36L74 62M78 40L84 56M40 56L52 38M52 62L66 36M66 62L80 40', '#6b4224', 1.4) +
    P('M58 35C58 28 60 22 66 20C66 25 63 30 63 35Z', '#6b4224', ol('#4b2e17', 1.8)) + P('M64 24C70 16 80 16 84 20C78 24 72 26 64 24Z', '#8fd36a', ol('#3f8a2a', 1.6)) +
    spk(16, 28, 5, '#ffe066') + spk(104, 30, 5, '#ffe066') + spk(100, 100, 3.5, '#ffffff')];

  // ---------------------------------------------------------------- Legendary Egg: myths and legends (rich gradients, gold)
  A.firebird = (k) => [lin(k + 'b', ['#ff8a3d', '#e83a2a'], 1, 1) + lin(k + 't', ['#ff3d2e', '#ff9a2e', '#ffe14d'], 1, 0) + lin(k + 'u', ['#ffb02e', '#ffe873'], 1, 0) + lin(k + 'r', ['#ff5a2e', '#ffb02e'], 1, 1),
    P('M66 70C84 58 96 38 112 26C107 44 104 58 96 70C90 78 78 79 66 75Z', `url(#${k}t)`, ol('#a3271a')) +
    P('M66 74C88 74 104 68 117 58C112 74 100 86 87 88C78 89 70 83 66 79Z', `url(#${k}u)`, ol('#a3271a')) +
    P('M64 78C80 88 94 98 104 113C90 109 79 104 71 96C66 91 64 85 64 80Z', `url(#${k}r)`, ol('#a3271a')) +
    [[100, 42], [104, 72], [92, 102]].map(([x, y]) => C(x, y, 5.5, '#ffe14d', ol('#c46a12', 1.2)) + C(x, y, 2.5, '#3fb6ff')).join('') +
    L('M50 85L48 99M58 86L58 100M44 99L52 99M54 100L62 100', '#c46a12', 3) +
    P('M36 36C31 26 33 17 38 10C40 18 45 22 43 33Z', '#ffd23f', ol('#a3271a', 2)) + P('M30 39C23 32 22 24 25 17C29 24 34 27 35 35Z', '#ff9f2e', ol('#a3271a', 2)) + P('M42 38C43 29 48 23 54 20C53 27 55 32 49 39Z', '#ff9f2e', ol('#a3271a', 2)) +
    C(38, 11, 2.2, '#fff6b0') + C(25, 17, 1.8, '#fff6b0') + C(54, 20, 1.8, '#fff6b0') +
    P('M30 50C30 40 40 34 46 40C52 46 50 56 58 58C68 54 76 62 74 72C72 82 62 88 52 87C40 86 32 78 34 68C35 62 31 58 30 50Z', `url(#${k}b)`, ol('#a3271a')) +
    P('M46 68C56 60 70 62 74 72C66 74 58 80 48 78C46 75 45 71 46 68Z', '#ffd23f', ol('#a3271a', 2)) + L('M54 70L68 72M51 75L64 76', '#ff9f2e', 1.8) +
    P('M30 47L17 52L30 55Z', '#ffcf3f', ol('#a36a0e', 2)) +
    C(37, 46, 3.6, '#2b2140') + C(38.3, 44.6, 1.3, '#ffffff') + E(42, 54, 3, 2, '#ff7aa8', ' opacity=".5"') +
    spk(16, 76, 5, '#ffd166') + spk(84, 18, 5, '#ffd166') + C(22, 100, 2, '#ff8a1f') + C(112, 100, 1.8, '#ffd166')];
  A.griffin = (k) => [lin(k + 'w', ['#ffe27a', '#e3a53a', '#b8742a']) + lin(k + 'b', ['#f7cf74', '#d9963b']) + rad(k + 'h', ['#ffffff', '#fff3dc']),
    pair('M44 66C30 56 14 40 8 16C20 22 28 22 34 28C32 20 34 12 40 8C44 20 48 30 54 42C54 52 50 60 44 66Z', `url(#${k}w)`, ol('#8a5526')) +
    L('M14 24C22 34 30 44 40 54M24 20C30 32 36 42 44 52M36 14C40 26 44 38 48 48', '#8a5526', 1.5) + L('M106 24C98 34 90 44 80 54M96 20C90 32 84 42 76 52M84 14C80 26 76 38 72 48', '#8a5526', 1.5) +
    L('M80 100C96 100 104 92 104 82', '#8a5526', 7) + L('M80 100C96 100 104 92 104 82', '#e3a53a', 3.5) + P('M100 82C98 74 104 70 108 72C110 76 108 82 104 84Z', '#8a5526') +
    P('M38 108C34 88 42 70 60 66C78 70 86 88 82 108Z', `url(#${k}b)`, ol('#8a5526')) + E(44, 106, 9, 5, '#e3a53a', ol('#8a5526', 2)) + E(76, 106, 9, 5, '#e3a53a', ol('#8a5526', 2)) +
    P('M46 70C50 82 70 82 74 70C72 86 66 94 60 96C54 94 48 86 46 70Z', '#fff4dc') + L('M52 80L56 84L60 80L64 84L68 80M54 88L60 92L66 88', '#e3c48a', 1.4) +
    L('M52 96L52 104M68 96L68 104', '#ffb000', 4) + L('M48 106L52 104L56 106M64 106L68 104L72 106', '#7a4a10', 2) +
    P('M44 34C42 24 52 22 56 26C58 18 66 18 68 24C74 20 80 26 76 34Z', '#ffd36b', ol('#8a5526', 2)) +
    C(60, 46, 19, `url(#${k}h)`, ol('#8a5526')) + L('M44 38L54 41M76 38L66 41', '#8a5526', 2.4) +
    [50, 70].map((x) => C(x, 45, 5, '#ffb000') + C(x, 45, 2.8, '#2b2140') + C(x + 1.6, 43.4, 1.2, '#ffffff')).join('') +
    P('M50 52L70 52C70 60 64 68 58 70C60 64 56 60 50 56Z', '#ffc23d', ol('#a3650e', 2)) + E(46, 56, 3, 2, '#ff7aa8', ' opacity=".45"') + E(74, 56, 3, 2, '#ff7aa8', ' opacity=".45"') +
    spk(16, 92, 5, '#ffe066') + spk(104, 58, 4, '#ffe066') + spk(60, 10, 5, '#fff3a6')];
  A.pegasus = (k) => [lin(k + 'b', ['#ffffff', '#e4defc']) + lin(k + 'm', ['#ff9ad5', '#b48cf2', '#7fc8ff']) + lin(k + 'w', ['#ffffff', '#d6ecff', '#ffe7a3']) + lin(k + 'g', ['#fff3a6', '#f5b521']),
    spk(14, 18, 6, '#fff3a6') + spk(112, 100, 4, '#ffffff') + spk(16, 96, 4, '#ffe066') +
    hoofed({ body: `url(#${k}b)`, dark: '#7b6fb3', mane: `url(#${k}m)`, snout: '#fff6fb', hoof: `url(#${k}g)`,
      front: P('M62 64C56 44 62 24 82 12C80 22 86 26 96 24C90 34 96 38 106 40C98 50 92 58 76 66Z', `url(#${k}w)`, ol('#7b6fb3')) +
        L('M68 60C74 48 80 38 90 30M72 63C80 54 88 48 100 44M66 54C68 42 72 32 80 22', '#a9a0d6', 1.5) + star(38, 30, 3.5, '#ffe14d') })];
  A.mermaid = (k) => [lin(k + 't', ['#34d1bf', '#3a8be0', '#8c5bd6']) + lin(k + 'h', ['#ff7a6b', '#ff4d6d']),
    C(14, 30, 4, 'none', ol('#7cc7f0', 2)) + C(20, 18, 2.5, 'none', ol('#7cc7f0', 1.6)) + C(104, 40, 3.5, 'none', ol('#7cc7f0', 1.8)) +
    P('M42 34C40 20 50 16 60 16C72 16 82 22 80 40C82 54 86 64 80 74C74 70 72 60 74 50C70 42 64 38 60 38C56 38 48 42 46 50C48 60 46 70 40 74C34 64 40 54 42 34Z', `url(#${k}h)`, ol('#b32a4a', 2)) +
    P('M48 70C42 86 48 102 66 106C78 108 88 102 92 94C86 98 76 98 70 94C62 88 64 80 72 72Z', `url(#${k}t)`, ol('#2a4a8a')) +
    L('M52 80Q56 84 60 80M50 90Q54 94 58 90M58 98Q62 102 66 98M66 84Q68 88 70 84', '#b9f5ff', 1.4) +
    P('M90 94C94 84 104 80 112 82C108 88 106 92 104 96C108 98 112 104 112 110C104 110 96 104 92 98Z', '#8c5bd6', ol('#2a4a8a')) +
    P('M48 60C48 54 54 52 60 52C66 52 72 54 72 60L72 72L48 72Z', '#ffd9c2', ol('#c98a6a', 2)) +
    E(53, 62, 6, 5, '#b48cf2', ol('#6a4bbf', 1.6)) + E(67, 62, 6, 5, '#b48cf2', ol('#6a4bbf', 1.6)) + L('M50 64L56 60M64 60L70 64', '#ffffff', 1) +
    L('M48 60L38 70M72 60L82 66', '#ffd9c2', 5) + C(60, 36, 15, '#ffd9c2', ol('#c98a6a', 2)) +
    P('M45 34C46 24 54 20 60 21C68 20 76 26 75 34C70 28 62 26 56 28C52 30 48 32 45 34Z', `url(#${k}h)`) + star(72, 26, 5, '#ffe14d', ol('#c99a00', 1)) +
    dots(54, 66, 37, 0.85) + blush(49, 71, 43) + smile(60, 44, 3.5, '#c2407e', 1.8) + spk(102, 18, 6, '#fff3a6') + spk(14, 100, 5, '#b9f5ff')];
  A.genie = (k) => [lin(k + 'l', ['#fff3a6', '#f5b521', '#c47a10']) + lin(k + 'b', ['#7fb6ff', '#3a6fe0']) + lin(k + 's', ['#5a8dff', '#9fc4ff', '#d6e6ff']),
    spk(16, 22, 6, '#ffe066') + spk(104, 18, 5, '#e9b8ff') + spk(108, 70, 4, '#ffe066') + spk(14, 64, 4, '#e9b8ff') +
    P('M60 88C48 86 44 78 52 74C60 70 72 72 66 64C62 58 50 62 50 56L70 56C78 64 80 74 72 80C68 84 66 86 60 88Z', `url(#${k}s)`, ol('#2a4fb0', 2)) +
    P('M42 58C42 44 50 38 60 38C70 38 78 44 78 58Z', `url(#${k}b)`, ol('#2a4fb0')) + P('M50 40L56 58L64 58L70 40C66 38 54 38 50 40Z', '#8c5bd6', ol('#5a2f9a', 1.6)) +
    G('rotate(10 60 50)', E(60, 50, 15, 4.5, `url(#${k}b)`, ol('#2a4fb0', 2))) + G('rotate(-10 60 50)', E(60, 51, 15, 4.5, `url(#${k}b)`, ol('#2a4fb0', 2))) + E(46, 47, 3, 4.5, '#ffd23f', ol('#a8650a', 1.2)) + E(74, 47, 3, 4.5, '#ffd23f', ol('#a8650a', 1.2)) +
    P('M58 14C55 5 62 1 67 3C63 6 63 10 65 14Z', '#2b2140') + C(60, 28, 14, `url(#${k}b)`, ol('#2a4fb0')) + E(60, 15, 6, 2.5, '#ffd23f', ol('#a8650a', 1.2)) +
    dots(54, 66, 27, 0.8) + L('M50 22L56 23M70 22L64 23', '#1f3a8a', 2) + P('M53 33Q60 39 67 33Q60 36 53 33Z', '#ffffff', ol('#1f3a8a', 1.6)) + C(46, 30, 2, '#ffd23f', ol('#a8650a', 1)) +
    P('M32 100C32 92 44 88 60 88C76 88 88 92 88 100C88 106 76 110 60 110C44 110 32 106 32 100Z', `url(#${k}l)`, ol('#8a5a10')) +
    P('M32 98C24 96 16 90 10 82C16 84 24 88 32 92Z', `url(#${k}l)`, ol('#8a5a10', 2)) + L('M88 94C100 92 102 104 90 104', '#c47a10', 4) +
    E(60, 89, 10, 3, '#ffe27a', ol('#8a5a10', 1.6)) + C(60, 98, 3, '#ff4d6d') + L('M40 102Q60 108 80 102', '#ffe9a0', 1.4)];
  A.merlin = (k) => [lin(k + 'h', ['#5b7cff', '#2a3fa8']) + lin(k + 'r', ['#6a5be0', '#3a2a9a']) + rad(k + 'c', ['#ffffff', '#9ff0ff', '#3ac0e0']) + glowG(k + 'g', '#7ff0ff'),
    C(96, 22, 16, `url(#${k}g)`) + P('M38 64L82 64L94 110L26 110Z', `url(#${k}r)`, ol('#24186b')) + star(40, 96, 4, '#ffe14d') + star(78, 92, 3.5, '#ffe14d') + star(56, 104, 3, '#ffe14d') +
    L('M96 108L96 32', '#8a5a32', 4.5) + P('M96 10L103 22L96 34L89 22Z', `url(#${k}c)`, ol('#1f78a8', 1.8)) +
    E(30, 82, 7, 6, '#ffd9c2', ol('#c98a6a', 1.6)) + E(90, 76, 7, 6, '#ffd9c2', ol('#c98a6a', 1.6)) +
    E(60, 56, 15, 11, '#ffd9c2', ol('#c98a6a', 2)) +
    P('M42 56C40 82 50 98 60 106C70 98 80 82 78 56C72 63 66 63 60 61C54 63 48 63 42 56Z', '#ffffff', ol('#9aa3b8', 2)) + L('M52 74Q54 86 58 94M66 74Q66 86 62 96', '#d6dbe8', 1.4) +
    E(60, 62, 9, 3.5, '#ffffff', ol('#9aa3b8', 1.4)) + C(60, 58, 3.6, '#ffb0a0', ol('#c98a6a', 1.4)) + dots(53, 67, 53, 0.7) + L('M47 49L56 48M73 49L64 48', '#ffffff', 3.4) +
    P('M28 48C42 42 52 28 60 6C66 18 74 34 92 48Z', `url(#${k}h)`, ol('#1a2470')) + E(60, 48, 35, 7, `url(#${k}h)`, ol('#1a2470')) +
    star(52, 34, 4, '#ffe14d') + star(70, 40, 3, '#ffe14d') + P('M60 18C56 20 56 26 60 28C58 26 58 21 62 19Z', '#ffe14d') +
    spk(14, 30, 6, '#bff6ff') + spk(16, 74, 4, '#ffe066')];
  A.kraken = (k) => [rad(k + 'h', ['#e48bff', '#b44fd8', '#7a2fa8']) + lin(k + 'w', ['#9fe4ff', '#4db8f0']),
    P('M0 104C14 98 26 110 40 104C54 98 66 110 80 104C94 98 106 110 120 104L120 120L0 120Z', `url(#${k}w)`, ' opacity=".6"') +
    [['M38 68C22 64 10 50 14 36C17 28 26 30 24 38', 1], ['M82 68C98 64 110 50 106 36C103 28 94 30 96 38', 1], ['M42 76C30 86 22 100 30 108C36 112 42 106 38 100', 0], ['M78 76C90 86 98 100 90 108C84 112 78 106 82 100', 0], ['M52 78C48 92 52 104 60 108', 0], ['M68 78C72 92 70 102 62 108', 0]]
      .map(([d, up]) => L(d, '#5a1f80', 12) + L(d, up ? '#c35be6' : '#b44fd8', 7.5)).join('') +
    C(16, 44, 1.8, '#f6d6ff') + C(104, 44, 1.8, '#f6d6ff') + C(30, 98, 1.8, '#f6d6ff') + C(90, 98, 1.8, '#f6d6ff') + C(54, 96, 1.8, '#f6d6ff') + C(68, 96, 1.8, '#f6d6ff') +
    P('M28 62C28 32 42 14 60 14C78 14 92 32 92 62C92 74 80 80 60 80C40 80 28 74 28 62Z', `url(#${k}h)`, ol('#5a1f80')) +
    C(44, 30, 4, '#f0b8ff', ' opacity=".7"') + C(76, 28, 3, '#f0b8ff', ' opacity=".7"') + C(70, 22, 2, '#f0b8ff', ' opacity=".7"') +
    bigEyes(47, 73, 54, 1.15) + smile(60, 66, 6, '#5a1f80', 2.2) + blush(38, 82, 64) +
    P('M90 24L110 24L106 30L94 30Z', '#ffffff', ol('#7a4a22', 1.6)) + L('M100 24L100 10', '#7a4a22', 1.6) + P('M100 11L110 20L100 20Z', '#ff6b6b') + spk(16, 16, 5, '#fff3a6')];
  A.yeti = () => {
    const fluff = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; fluff.push([f1(60 + 30 * Math.cos(a)), f1(70 + 34 * Math.sin(a)), 9]); }
    const arms = [[24, 62, 9], [18, 52, 8], [96, 62, 9], [102, 52, 8]];
    const all = [...fluff, ...arms, [60, 70, 30]];
    return ['', flake(14, 20, 6, '#9fd8ff') + flake(106, 24, 5, '#9fd8ff') + flake(108, 96, 4, '#9fd8ff') + E(60, 110, 44, 6, '#e9f6ff') +
      all.map(([x, y, r]) => C(x, y, r + 2.5, '#6f8fb8')).join('') + all.map(([x, y, r]) => C(x, y, r, '#ffffff')).join('') +
      E(46, 108, 10, 5, '#a8d8f0', ol('#4a7aa8', 2)) + E(74, 108, 10, 5, '#a8d8f0', ol('#4a7aa8', 2)) +
      C(18, 50, 5, '#a8d8f0', ol('#4a7aa8', 1.8)) + C(102, 50, 5, '#a8d8f0', ol('#4a7aa8', 1.8)) +
      P('M42 56C42 44 50 40 60 40C70 40 78 44 78 56C78 68 70 74 60 74C50 74 42 68 42 56Z', '#a8d8f0', ol('#4a7aa8', 2)) +
      bigEyes(52, 68, 54, 0.75, '#1d3a6a') + P('M52 64Q60 72 68 64Z', '#ffffff', ol('#2a4a7a', 1.8)) + P('M55 64.5L57 68L59 65Z', '#ffffff') + blush(46, 74, 62) +
      L('M54 36C56 30 60 30 62 34C64 28 68 28 70 32', '#c9dcef', 2.4) + spk(60, 24, 4, '#cfeeff')];
  };
  A.kitsune = (k) => {
    const tails = [-100, -75, -50, -25, 0, 25, 50, 75, 100].map((a) => G(`rotate(${a} 60 94)`, P('M60 94C48 78 50 54 60 40C70 54 72 78 60 94Z', `url(#${k}t)`, ol('#b0476a', 2)) + P('M60 40C57 46 57 50 60 54C63 50 63 46 60 40Z', '#7fb6ff'))).join('');
    return [lin(k + 't', ['#7fb6ff', '#fff6fb', '#ffffff'], 0, 1) + lin(k + 'f', ['#ffffff', '#ffe3ef']),
      canine(0, { fur: `url(#${k}f)`, dark: '#b0476a', chest: '#ffffff', sock: '#e2557a', inner: '#e2557a', tails: true, liner: '#e2557a', back: tails,
        mark: P('M60 28C56 32 56 38 60 42C64 38 64 32 60 28Z', '#e2557a') + C(60, 36, 1.6, '#ffe14d'),
        front: P('M18 30C14 24 16 18 20 14C20 20 24 22 23 27C22 30 20 31 18 30Z', '#7fb6ff') + P('M102 102C98 96 100 90 104 86C104 92 108 94 107 99C106 102 104 103 102 102Z', '#7fb6ff') }) +
      spk(104, 24, 5, '#fff3a6') + spk(14, 92, 4, '#bfe0ff')];
  };
  A.featherserpent = (k) => [lin(k + 'b', ['#3ee08a', '#14a35c'], 1, 1) + lin(k + 'h', ['#4fe896', '#1fb86a']),
    ['#ff4d6d', '#ffb84d', '#ffe14d', '#3dd6c4', '#4d8cff'].map((c, i) => G(`rotate(${-70 + i * 30} 80 26)`, E(80, 10, 4.5, 15, c, ol('#136b3c', 1.6)))).join('') +
    L('M22 100C40 112 82 112 94 96C106 80 88 68 70 74C50 80 38 70 46 58C52 48 64 46 70 36', '#0f5c33', 17) +
    L('M22 100C40 112 82 112 94 96C106 80 88 68 70 74C50 80 38 70 46 58C52 48 64 46 70 36', `url(#${k}b)`, 12) +
    `<path d="M22 100C40 112 82 112 94 96C106 80 88 68 70 74C50 80 38 70 46 58C52 48 64 46 70 36" fill="none" stroke="#ffe14d" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>` +
    G('rotate(-30 50 70)', E(36, 66, 4, 11, '#ffb84d', ol('#136b3c', 1.6)) + E(30, 70, 4, 10, '#ff4d6d', ol('#136b3c', 1.6))) +
    E(16, 98, 4, 10, '#4d8cff', ol('#136b3c', 1.6)) + G('rotate(40 18 100)', E(18, 100, 4, 10, '#3dd6c4', ol('#136b3c', 1.6))) +
    G('rotate(-18 78 30)', E(78, 30, 15, 11, `url(#${k}h)`, ol('#0f5c33'))) + G('translate(80 26)', E(0, 0, 3.4, 4.3, '#2b2140') + C(1.2, -1.5, 1.3, '#ffffff')) +
    smile(86, 34, 4, '#0f5c33', 1.8) + E(73, 35, 3, 2, '#ff7aa8', ' opacity=".5"') + L('M92 34L100 38M100 38L104 36M100 38L103 41', '#ff4d6d', 1.6) +
    spk(16, 22, 6, '#ffe066') + spk(108, 64, 4, '#ffe066')];
  A.starwhale = (k) => [lin(k + 'b', ['#4f6bff', '#6a3fd1', '#3a1f8a'], 1, 1) + lin(k + 'f', ['#7a5cff', '#3a1f8a']),
    [[30, 16], [42, 10], [52, 18]].map(([x, y]) => spk(x, y, 4, '#fff3a6')).join('') + L('M36 34C34 26 30 22 26 20M40 34C42 26 46 22 50 22', '#bfd4ff', 1.6) +
    P('M14 62C14 44 34 34 58 36C78 38 92 48 100 56C106 50 110 40 116 36C114 48 114 58 118 68C110 66 104 64 98 66C88 80 66 88 44 86C26 84 14 76 14 62Z', `url(#${k}b)`, ol('#1f1060')) +
    L('M20 72C36 82 62 82 82 74M24 78C40 86 60 86 76 80', '#a9b8ff', 1.4) + P('M50 80C52 92 60 98 68 96C64 90 62 86 62 80Z', `url(#${k}f)`, ol('#1f1060', 2)) +
    L('M48 50L60 46L72 54L84 52', '#e6ecff', 1) + star(48, 50, 3, '#ffffff') + star(60, 46, 2.4, '#fff3a6') + star(72, 54, 3, '#ffffff') + star(84, 52, 2.2, '#fff3a6') +
    C(56, 64, 1.4, '#ffffff') + C(92, 60, 1.4, '#ffffff') + C(66, 70, 1.2, '#fff3a6') + C(40, 66, 1.2, '#ffffff') +
    G('translate(30 58)', E(0, 0, 3.6, 4.4, '#ffffff') + E(0.6, 0.6, 2.2, 3, '#1a1040') + C(1.4, -0.8, 0.9, '#ffffff')) + smile(22, 68, 4, '#c9d4ff', 1.8) + E(34, 67, 3, 2, '#ff8fc7', ' opacity=".6"') +
    spk(102, 20, 6, '#fff3a6') + spk(108, 94, 5, '#ffffff') + spk(12, 98, 4, '#fff3a6') + C(90, 104, 1.5, '#ffffff')];
  A.worldturtle = (k) => [lin(k + 'o', ['#7fdcff', '#2a8fe0']) + `<clipPath id="${k}c"><path d="M26 80C26 52 46 36 68 36C90 36 108 52 108 80Z"/></clipPath>`,
    E(30, 92, 7, 9, '#7ed39a', ol('#2f6b4a')) + E(52, 96, 7, 9, '#7ed39a', ol('#2f6b4a')) + E(82, 96, 7, 9, '#7ed39a', ol('#2f6b4a')) + E(102, 90, 7, 9, '#7ed39a', ol('#2f6b4a')) +
    P('M106 80L116 86L106 88Z', '#7ed39a', ol('#2f6b4a', 2)) + C(16, 76, 11, '#7ed39a', ol('#2f6b4a')) +
    G('translate(12 73)', E(0, 0, 3, 3.8, '#2b2140') + C(1, -1.3, 1.2, '#ffffff')) + smile(9, 80, 3, '#2f6b4a', 1.6) + E(19, 81, 2.6, 1.8, '#ff7aa8', ' opacity=".5"') +
    P('M26 80C26 52 46 36 68 36C90 36 108 52 108 80Z', `url(#${k}o)`) +
    `<g clip-path="url(#${k}c)">${P('M30 70C36 60 46 62 50 54C56 46 66 50 64 60C62 68 52 70 48 78L30 80Z', '#6fcf5a') + P('M78 44C86 40 98 46 100 56C96 62 88 58 84 64C80 60 74 52 78 44Z', '#6fcf5a') + P('M70 74C76 68 88 70 96 76L96 82L70 82Z', '#6fcf5a') + E(56, 46, 7, 3, '#ffffff', ' opacity=".8"') + E(88, 70, 6, 2.5, '#ffffff', ' opacity=".8"')}</g>` +
    P('M26 80C26 52 46 36 68 36C90 36 108 52 108 80Z', 'none', ol('#1f5a8a')) + E(67, 82, 44, 6, '#c9a26a', ol('#7a5232')) +
    L('M66 36L66 24', '#7a5232', 3) + C(66, 20, 7, '#4cc76a', ol('#2f7a3a', 2)) + P('M80 38L86 28L92 40Z', '#9aa3b8', ol('#5a6378', 1.6)) + P('M84 32L86 28L88 33Z', '#ffffff') +
    P('M44 42L44 34L52 30L60 34L60 42Z', '#ffffff', ol('#7a5232', 1.6)) + P('M42 35L52 27L62 35Z', '#ff6b5b', ol('#a3271a', 1.6)) +
    spk(16, 26, 6, '#ffe066') + spk(106, 20, 5, '#ffe066') + C(24, 50, 1.6, '#ffffff')];

  // ---------------------------------------------------------------- Dragon Egg: one dragon drawing in ten (eleven) colors
  // pal: main/light (body), dark (outline), belly, wing (fill or 'id' of a gradient made in extras), horn, crest, el (glow)
  MQ.DRAGON_LOOK = {
    dr_ember: { main: '#ef5a3c', light: '#ff9466', dark: '#9c2a1e', belly: '#ffd38a', wing: ['#ffb84d', '#ff6a2e'], horn: '#fff1d6', crest: '#ffc93c', el: '#ff7a2e' },
    dr_frost: { main: '#6fbdf0', light: '#b4e2ff', dark: '#2f6f9e', belly: '#eaf8ff', wing: ['#ffffff', '#a8dcff'], horn: '#ffffff', crest: '#bfeaff', el: '#7fd0ff' },
    dr_storm: { main: '#6a6fe0', light: '#9da2ff', dark: '#2e2f7a', belly: '#e5e8ff', wing: ['#b9bdf5', '#6f74c9'], horn: '#fff6c2', crest: '#ffe14d', el: '#ffe14d' },
    dr_forest: { main: '#45c26a', light: '#86e39a', dark: '#1f6b3a', belly: '#e9fbc4', wing: ['#c4f08a', '#6cc94a'], horn: '#fff6dc', crest: '#8fdc5a', el: '#7ed957' },
    dr_ocean: { main: '#22b0c9', light: '#6fe0ef', dark: '#0f5e7a', belly: '#dffaff', wing: ['#9ff2ff', '#3fb6d9'], horn: '#e6fbff', crest: '#7fe0ef', el: '#4dd0ff' },
    dr_crystal: { main: '#f08bd2', light: '#ffc4ec', dark: '#9a3a82', belly: '#fff0fb', wing: ['#e3f6ff', '#d3b8ff', '#ffc4ec'], horn: '#ffffff', crest: '#9ff0ff', el: '#ff8fe0' },
    dr_moon: { main: '#4a4fb8', light: '#7d82e0', dark: '#20235e', belly: '#dcdfff', wing: ['#3a3f9a', '#1d1f5a'], horn: '#e8ecff', crest: '#e8ecff', el: '#b9c3ff' },
    dr_sun: { main: '#ffae1f', light: '#ffd65c', dark: '#a8580a', belly: '#fff3c4', wing: ['#ffd65c', '#ff7a2e'], horn: '#fffbe6', crest: '#ffe14d', el: '#ffd23f' },
    dr_rainbow: { main: '#b48cf2', light: '#d8c2ff', dark: '#5d3a9b', belly: '#fff0fb', wing: ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ed957', '#5ec8ff', '#a77bff'], horn: '#fff6cc', crest: '#ff8fc7', el: '#ff8fc7' },
    dr_cosmic: { main: '#4a33b0', light: '#7c5ce8', dark: '#1a0f52', belly: '#e6dcff', wing: ['#ff6ad5', '#7a3fd1', '#1b1050'], horn: '#fff3c4', crest: '#ffe14d', el: '#a77bff' },
    dr_royal: { main: '#ffc928', light: '#fff0a0', dark: '#9a5a08', belly: '#fff8dc', wing: ['#e0407a', '#9a2a8c'], horn: '#ffffff', crest: '#ff4d6d', el: '#ffd23f' },
  };
  // fly: the just-hatched baby flying around (small wings, no eggshell)
  function dragon(k, id, stage, fly) {
    const c = MQ.DRAGON_LOOK[id], d = c.dark, el = id.slice(3);
    const o = ol(d);
    const defs = rad(k + 'b', [c.light, c.main], 0.4, 0.3, 0.8) + lin(k + 'w', c.wing) + glowG(k + 'g', c.el);
    const W = `url(#${k}w)`, B = `url(#${k}b)`;
    const wingL = 'M46 64C34 48 20 40 8 42C14 50 14 56 12 64C19 61 24 65 24 72C30 67 37 69 40 74Z';
    const ws = fly && !stage ? 0.6 : [0, 0.72, 1, 1.15][stage];
    const veins = el === 'forest' ? L('M42 66L14 46M30 60L18 62', '#3f8a2a', 1.4) + L(mir('M42 66L14 46M30 60L18 62'), '#3f8a2a', 1.4)
      : el === 'ocean' ? L('M42 66L12 46M40 70L16 60M40 72L24 70', '#ffffff', 1.2) + L(mir('M42 66L12 46M40 70L16 60M40 72L24 70'), '#ffffff', 1.2)
        : el === 'cosmic' || el === 'moon' ? star(22, 52, 2.2, '#ffffff') + star(98, 52, 2.2, '#ffffff') + C(32, 62, 1.2, '#ffffff') + C(88, 62, 1.2, '#ffffff') : '';
    const wings = ws ? G(`translate(60 66) scale(${ws}) translate(-60 -66)`, pair(wingL, W, o) + veins) : '';
    const tailD = 'M78 98C100 102 110 86 105 74C102 66 94 67 96 75';
    const tail = stage || fly ? L(tailD, d, 12) + L(tailD, c.main, 7) : '';
    const tips = {
      ember: P('M96 76C88 68 92 58 97 52C97 59 104 61 102 68C101 73 99 75 96 76Z', '#ff8a1f') + P('M96 75C93 70 95 65 97 62C98 66 101 68 99 72Z', '#ffe14d'),
      frost: P('M96 62L100 70L96 78L92 70Z', '#ffffff', ol(d, 1.5)),
      storm: P('M98 58L92 70L97 70L93 80L103 66L98 66L101 58Z', '#ffe14d', ol('#a87a00', 1.4)),
      forest: P('M96 76C90 70 90 62 96 56C102 62 102 70 96 76Z', '#8fdc5a', ol('#1f6b3a', 1.6)) + L('M96 74L96 60', '#1f6b3a', 1.2),
      ocean: P('M96 74C90 70 86 64 88 58C92 62 94 64 96 66C98 64 100 62 104 58C106 64 102 70 96 74Z', '#7fe0ef', ol(d, 1.6)),
      crystal: P('M96 58L101 66L96 78L91 66Z', '#9ff0ff', ol('#1f78a8', 1.4)) + P('M96 58L98 66L96 78Z', '#ffffff', ' opacity=".6"'),
      moon: P('M98 60C92 62 91 70 95 74C97 76 101 76 103 74C99 74 96 71 96 67C96 64 97 62 98 60Z', '#ffe066'),
      sun: C(96, 68, 6, '#ffe14d', ol('#c97a00', 1.4)),
      rainbow: star(96, 68, 6, '#ffe66d', ol('#c99a00', 1.2)),
      cosmic: star(96, 68, 6, '#ffe14d', ol('#c99a00', 1.2)),
      royal: P('M96 58L101 66L96 76L91 66Z', '#ff4d6d', ol('#9a1a3a', 1.4)),
    };
    const tip = stage ? tips[el] : '';
    const body = E(60, 84, 24, 23, B, o) + E(60, 88, 14, 16, c.belly) + [80, 87, 94].map((y) => L(`M49 ${y}Q60 ${y + 3} 71 ${y}`, d, 1.5).replace('stroke-width', 'stroke-opacity=".25" stroke-width')).join('') +
      (el === 'cosmic' ? C(46, 74, 1.3, '#ffffff') + C(76, 96, 1.2, '#ffffff') + star(74, 76, 2, '#ffe14d') : '') +
      (el === 'storm' ? P('M62 82L56 90L60 90L57 97L65 88L61 88L64 82Z', '#ffe14d', ol('#a87a00', 1)) : '') +
      (el === 'royal' ? P('M60 76L64 82L60 88L56 82Z', '#ff4d6d', ol('#9a1a3a', 1.2)) + C(52, 92, 2, '#4dc9ff') + C(68, 92, 2, '#3ddc84') : '');
    const arms = E(42, 86, 5, 8, c.main, o + ' transform="rotate(25 42 86)"') + E(78, 86, 5, 8, c.main, o + ' transform="rotate(-25 78 86)"');
    const feet = E(47, 106, 9, 5.5, c.main, o) + E(73, 106, 9, 5.5, c.main, o) + [42, 47, 52, 68, 73, 78].map((x) => C(x, 108, 1.6, c.belly)).join('');
    const shell = stage === 0 && !fly ? P('M28 92L35 85L42 92L49 84L56 92L63 84L70 92L77 84L84 91L92 86C94 108 80 117 60 117C40 117 26 108 28 92Z', '#fff4dc', ol('#c9a26a')) + C(44, 104, 4, '#9fd36d') + C(74, 102, 5, '#f7c64f') : '';
    const hornL = stage === 0 ? 'M47 28C45 22 43 19 40 17C44 18 48 22 51 26Z' : stage === 1 ? 'M46 28C43 20 41 16 36 13C42 15 47 20 51 25Z' : 'M45 28C41 18 39 13 33 10C40 12 47 18 51 25Z';
    const crests = {
      ember: P('M52 25L54 13L58 20L61 10L64 20L68 14L68 25Z', '#ffb02e', o),
      frost: P('M53 24L55 12L58 22L61 8L63 22L66 12L67 24Z', '#ffffff', o),
      storm: P('M63 6L54 19L59 19L55 28L68 14L62 14L66 6Z', c.crest, ol('#a87a00', 1.8)),
      forest: P('M60 24C54 20 54 12 60 8C66 12 66 20 60 24Z', '#8fdc5a', o) + P('M54 25C48 24 46 18 48 14C54 16 56 20 54 25Z', '#6cc94a', o) + C(70, 22, 4, '#ff8fc7', ol('#c2407e', 1.4)) + C(70, 22, 1.6, '#ffe14d'),
      ocean: P('M50 25C52 16 58 10 66 10C64 14 64 18 70 25Z', '#7fe0ef', o) + L('M56 23L58 14M62 23L64 13', '#ffffff', 1.2),
      crystal: P('M52 25L55 14L58 25Z', '#9ff0ff', ol('#1f78a8', 1.6)) + P('M57 25L61 8L65 25Z', '#ffc4ec', ol('#9a3a82', 1.6)) + P('M63 25L66 15L69 25Z', '#d3b8ff', ol('#6a4bbf', 1.6)),
      moon: P('M53 24L56 15L60 22L64 15L67 24Z', c.crest, o),
      sun: '',
      rainbow: ['#ff6b6b', '#ffe66d', '#5ec8ff'].map((col, i) => P(`M${52 + i * 6} 25L${55 + i * 6} ${13 + (i % 2) * -3}L${58 + i * 6} 25Z`, col, ol(d, 1.6))).join(''),
      cosmic: star(60, 16, 7, '#ffe14d', ol('#c99a00', 1.4)),
      royal: '',
    };
    const halo = el === 'sun' && stage ? [...Array(12)].map((_, i) => G(`rotate(${i * 30} 60 46)`, P('M56 14L60 4L64 14Z', i % 2 ? '#ffe14d' : '#ffb02e'))).join('') + C(60, 46, 29, '#ffd65c', ' opacity=".55"') : '';
    const crown = stage === 3 || el === 'royal'
      ? P('M46 25L45 9L53 16L60 5L67 16L75 9L74 25Z', '#ffd23f', ol('#a8650a', 2)) + C(60, 18, 3, '#ff4d6d') + C(51, 20, 2, '#4dc9ff') + C(69, 20, 2, '#7ed957') : '';
    const crest = stage === 0 || crown ? '' : crests[el];
    const finCol = c.wing[0];
    const head = pair('M37 42L25 36L33 52Z', finCol, o) + pair(hornL, c.horn, o) + crest + C(60, 46, 24, B, o) + E(60, 57, 15, 10, c.belly) +
      E(55, 54, 1.6, 2.2, d) + E(65, 54, 1.6, 2.2, d) + L('M53 61Q60 66 67 61', d, 2) +
      (el === 'moon' ? P('M61 29C56 30 54 36 57 40C59 43 64 43 66 41C62 41 59 38 59 35C59 32 60 30 61 29Z', '#ffe066') : '') +
      (el === 'frost' && stage ? C(44, 34, 1.5, '#ffffff') + C(76, 34, 1.5, '#ffffff') : '');
    const eyeS = stage === 0 ? 1.15 : 1;
    const face = bigEyes(49, 71, 42, eyeS) + blush(41, 79, 52);
    const glow = stage === 3 ? C(60, 62, 56, `url(#${k}g)`) : '';
    const aura = {
      ember: C(18, 30, 2.5, '#ffb02e') + C(104, 22, 2, '#ff8a1f') + C(14, 62, 1.8, '#ffd166') + C(108, 50, 1.6, '#ffd166'),
      frost: flake(16, 24, 5, '#a8dcff') + flake(104, 30, 4, '#a8dcff') + flake(12, 64, 3, '#a8dcff'),
      storm: P('M16 18L12 28L16 28L13 36L21 25L17 25L20 18Z', '#ffe14d') + P('M104 22L100 30L104 30L102 36L108 28L104 28L106 22Z', '#ffe14d'),
      forest: P('M16 30C12 26 12 20 16 16C20 20 20 26 16 30Z', '#8fdc5a') + P('M104 26C100 22 100 16 104 12C108 16 108 22 104 26Z', '#6cc94a') + C(12, 62, 2.5, '#ff8fc7'),
      ocean: C(16, 28, 4, 'none', ol('#7fe0ef', 1.6)) + C(10, 18, 2.5, 'none', ol('#7fe0ef', 1.4)) + C(106, 24, 3.5, 'none', ol('#7fe0ef', 1.6)),
      crystal: spk(16, 24, 6, '#ffc4ec') + spk(104, 22, 5, '#9ff0ff') + spk(12, 62, 3.5, '#d3b8ff'),
      moon: star(16, 22, 4, '#fff3a6') + star(104, 18, 3.5, '#fff3a6') + C(12, 60, 1.6, '#ffffff') + C(108, 54, 1.4, '#ffffff'),
      sun: spk(14, 22, 5, '#ffe14d') + spk(106, 98, 4, '#ffe14d'),
      rainbow: spk(14, 20, 6, '#ffe66d') + spk(106, 18, 5, '#ff8fc7') + spk(12, 64, 4, '#5ec8ff'),
      cosmic: star(14, 20, 4, '#ffe14d') + spk(104, 18, 5, '#ffffff') + C(12, 60, 1.6, '#ffffff') + C(108, 52, 1.4, '#ff8fe0') + C(20, 44, 1.2, '#ffffff'),
      royal: spk(14, 22, 6, '#ffe14d') + spk(106, 20, 5, '#ffe14d') + spk(108, 100, 4, '#ff8fc7'),
    }[el];
    return [defs, glow + aura + halo + wings + tail + tip + body + arms + feet + shell + head + face + crown + (stage === 3 ? spk(30, 24, 4, '#ffffff') + spk(92, 24, 4, '#ffffff') : '')];
  }
  Object.keys(MQ.DRAGON_LOOK).forEach((id) => { A[id] = (k, o) => dragon(k, id, o.stage == null ? 2 : o.stage, o.fly); });

  MQ.art = (id, o = {}) => {
    const f = A[id];
    if (!f) return '';
    const [defs, body] = f('g' + (++uid).toString(36), o);
    return svg(body, defs);
  };
  MQ.hasArt = (id) => !!A[id];

  // ---------------------------------------------------------------- eggs
  const EGG = 'M60 8C84 8 100 48 100 72C100 96 82 112 60 112C38 112 20 96 20 72C20 48 36 8 60 8Z';
  const SHINE = '<ellipse cx="43" cy="38" rx="6" ry="13" fill="#ffffff" opacity=".55" transform="rotate(20 43 38)"/>';
  const CRACK = 'M60 9L54 30L66 42L52 58L68 72L56 90L64 111';
  const EGGS = {
    meadow: (k) => ['', P(EGG, '#fff4dc') + C(72, 40, 7, '#9fd36d') + C(44, 70, 9, '#f7c64f') + C(78, 82, 6, '#ff9ab0') + C(58, 98, 5, '#9fd36d') + C(84, 60, 4, '#7cc7f0') + SHINE, '#c9a26a', '#ffd35c', '#9a6a2a'],
    crystal: (k) => {
      const f = [['60,8 38,44 60,58', 0.45], ['60,8 82,44 60,58', 0.12], ['38,44 18,74 60,58', 0.28], ['82,44 102,74 60,58', 0.05], ['18,74 40,108 60,58', 0.12], ['102,74 80,108 60,58', 0.32], ['40,108 60,114 80,108 60,58', 0.2]];
      return [lin(k + 'a', ['#9fe8ff', '#b79bff', '#ff9fdc'], 1, 1) + `<clipPath id="${k}c"><path d="${EGG}"/></clipPath>`,
        `<g clip-path="url(#${k}c)"><rect width="120" height="120" fill="url(#${k}a)"/>${f.map(([pts, op]) => `<polygon points="${pts}" fill="#ffffff" opacity="${op}" stroke="#ffffff" stroke-opacity=".6" stroke-width="1.2"/>`).join('')}</g>` +
        spk(100, 22, 9) + spk(16, 44, 6, '#fff7b0') + spk(98, 100, 5), '#6f55c4', '#c9a7ff'];
    },
    legend: (k) => [rad(k + 'a', ['#fff6c4', '#ffcf48', '#d98a10'], 0.38, 0.3, 0.8) + glowG(k + 'r', '#ffe066'),
      C(60, 64, 58, `url(#${k}r)`) + P(EGG, `url(#${k}a)`) + P('M22 66C44 74 76 74 98 66L99 80C76 88 44 88 21 80Z', '#c9780c', ' opacity=".55"') +
      star(40, 76, 6, '#fff6c2') + star(60, 79, 7, '#fff6c2') + star(80, 76, 6, '#fff6c2') + star(60, 36, 9, '#fff1a6') + SHINE +
      spk(102, 26, 8, '#fff1a6') + spk(18, 30, 6, '#fff1a6') + spk(104, 96, 5, '#fff1a6'), '#a8650a', '#ffe066'],
    dragon: (k, o) => [`<pattern id="${k}p" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 12C0 4 14 4 14 12M-7 6C-7 -2 7 -2 7 6M7 6C7 -2 21 -2 21 6" fill="none" stroke="#9b59b6" stroke-width="2"/></pattern><clipPath id="${k}c"><path d="${EGG}"/></clipPath>` + glowG(k + 'g', o.glow || '#ff9f1c'),
      C(60, 66, 56, `url(#${k}g)`) + `<g clip-path="url(#${k}c)"><rect width="120" height="120" fill="#5a2a6e"/><rect width="120" height="120" fill="url(#${k}p)"/><rect y="70" width="120" height="50" fill="#2e1240" opacity=".35"/></g>` +
      spk(100, 24, 7, o.glow || '#ffd166') + spk(18, 98, 5, o.glow || '#ffd166'), '#2a0f38', o.glow || '#ffd166'],
    royal: (k, o) => [rad(k + 'a', ['#fff6c4', '#ffcf48', '#c98a10'], 0.38, 0.3, 0.8) + glowG(k + 'g', o.glow || '#ff8fe0') + `<clipPath id="${k}c"><path d="${EGG}"/></clipPath>` +
      `<pattern id="${k}p" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 12C0 4 14 4 14 12M-7 6C-7 -2 7 -2 7 6M7 6C7 -2 21 -2 21 6" fill="none" stroke="#e0a21b" stroke-width="2"/></pattern>`,
      C(60, 66, 58, `url(#${k}g)`) + P(EGG, `url(#${k}a)`) + `<g clip-path="url(#${k}c)"><rect width="120" height="120" fill="url(#${k}p)"/><rect y="62" width="120" height="16" fill="#9a2a8c"/></g>` +
      P('M44 56L43 38L52 46L60 32L68 46L77 38L76 56Z', '#ffd23f', ol('#9a5a08', 2)) + C(60, 46, 3.5, '#ff4d6d') + C(51, 50, 2.4, '#4dc9ff') + C(69, 50, 2.4, '#3ddc84') + star(40, 70, 3.5, '#ffe14d') + star(80, 70, 3.5, '#ffe14d') + star(60, 70, 4, '#ffe14d') + SHINE +
      spk(102, 24, 8, '#ffe14d') + spk(16, 34, 6, '#ff8fe0') + spk(104, 98, 5, '#ffe14d'), '#7a3a08', o.glow || '#ff8fe0'],
  };
  MQ.eggArt = (tier, o = {}) => {
    const k = 'g' + (++uid).toString(36);
    const [defs, body, line, light, inner = '#fffbe6'] = EGGS[tier](k, o);
    const crack = o.crack || 0;
    const cr = crack > 0 ? `<path d="${CRACK}" pathLength="100" fill="none" stroke="${light}" stroke-width="6" stroke-linejoin="round" stroke-dasharray="${f1(crack * 100)} 100" opacity=".5"/><path d="${CRACK}" pathLength="100" fill="none" stroke="${inner}" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="${f1(crack * 100)} 100"/>` : '';
    const always = tier === 'dragon' && !crack ? `<path d="${CRACK}" fill="none" stroke="${light}" stroke-width="5" stroke-linejoin="round" opacity=".4"/><path d="${CRACK}" fill="none" stroke="#fff3c4" stroke-width="2" stroke-linejoin="round"/>` : '';
    return svg(body + always + cr + P(EGG, 'none', ol(line, 3)), defs);
  };
})();
