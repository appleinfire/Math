// Puzzle Time pictures beyond the Hatchery creatures (js/shapes.js has the rules):
//   • emoji pictures: big colourful emoji on a scene drawn in code, one line each (free ones and expansion packs)
//   • Legendary pictures: a dragon or a mythic creature in a big painted scene that comes alive when it is finished
//   • the packs: which pictures are free, which cost crystals, which open by themselves in their season
// Every picture is the inside of an SVG with viewBox 0 0 120 120, like the rest of Puzzle Time.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, SH = MQ.shapes;
  const f1 = (x) => +(+x).toFixed(2);
  let uid = 0;
  const id = () => 'pa' + (++uid).toString(36);

  // ---------------------------------------------------------------- scenes (backgrounds)
  const grad = (k, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${k}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const sky = (k, a, b) => grad(k, a, b) + `<rect width="120" height="120" fill="url(#${k})"/>`;
  const hill = (y, c, dip = 12) => `<path d="M0 ${y}C30 ${y - dip} 80 ${y + 4} 120 ${y - 10}V120H0Z" fill="${c}"/>`;
  const dots = (list, r, fill, op = 1) => `<g fill="${fill}" opacity="${op}">${list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  const STARS = [[10, 12], [28, 30], [52, 8], [74, 24], [96, 10], [112, 34], [16, 52], [104, 58], [40, 44], [86, 46], [60, 30]];
  const cloud = (x, y, s) => `<g fill="#ffffff" opacity=".92"><ellipse cx="${x}" cy="${y}" rx="${12 * s}" ry="${5 * s}"/><ellipse cx="${f1(x - 4 * s)}" cy="${f1(y - 4 * s)}" rx="${6 * s}" ry="${5 * s}"/><ellipse cx="${f1(x + 4 * s)}" cy="${f1(y - 5 * s)}" rx="${7 * s}" ry="${6 * s}"/></g>`;
  const floor = (y, c, line) => `<rect y="${y}" width="120" height="${120 - y}" fill="${c}"/>` + (line ? `<rect y="${y}" width="120" height="2" fill="${line}"/>` : '');
  const bunting = (cols) => `<path d="M0 8Q60 22 120 8" fill="none" stroke="#8a5526" stroke-width=".8"/>` + U.range(0, 9).map((i) => { const x = 6 + i * 12, y = 8 + 14 * Math.sin((Math.PI * x) / 120) * 0.5; return `<path d="M${x - 4} ${f1(y)}L${x + 4} ${f1(y)}L${x} ${f1(y + 8)}Z" fill="${cols[i % cols.length]}"/>`; }).join('');
  Object.assign(SH.SCENES, {
    space: (k) => sky(k, '#120f3a', '#3b2a7a') + dots(STARS, 1, '#ffffff') + dots([[20, 90], [100, 100], [70, 70], [8, 30]], 0.7, '#fff3a6') + '<circle cx="100" cy="96" r="14" fill="#ff9ab8" opacity=".25"/><circle cx="18" cy="104" r="9" fill="#8fd8ff" opacity=".3"/>',
    deepsea: (k) => sky(k, '#2a86c6', '#0d3b66') + dots([[16, 30], [22, 20], [104, 44], [98, 34], [60, 14]], 2, 'none') + '<g fill="none" stroke="#bfefff" stroke-width="1" opacity=".6"><circle cx="16" cy="30" r="2.5"/><circle cx="22" cy="20" r="1.6"/><circle cx="104" cy="44" r="3"/><circle cx="98" cy="34" r="1.8"/></g>' +
      '<path d="M8 120C4 104 14 98 8 86M112 120C108 106 118 100 114 88" fill="none" stroke="#2f9a5a" stroke-width="3" stroke-linecap="round"/>' + hill(110, '#e9c98a', 6),
    beach: (k) => sky(k, '#8fd8ff', '#e6f7ff') + '<circle cx="98" cy="22" r="11" fill="#fff0a0"/>' + cloud(26, 20, 0.9) + '<rect y="70" width="120" height="22" fill="#3fa9e0"/><path d="M0 74Q15 70 30 74T60 74T90 74T120 74" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".7"/>' + hill(96, '#f6dca0', 6),
    candy: (k) => sky(k, '#ffd6ec', '#fff3fb') + cloud(24, 20, 1) + cloud(96, 26, 0.8) + hill(94, '#ffb3d9') + hill(106, '#ff8fc7', 8) + dots([[20, 102], [46, 110], [80, 104], [104, 112]], 2.2, '#ffffff', 0.7),
    jungle: (k) => sky(k, '#b9f0c8', '#e9ffef') + '<path d="M-6 60Q14 40 30 62Q40 34 58 58Q74 36 88 60Q104 38 126 58V120H-6Z" fill="#45b86a" opacity=".55"/>' + hill(96, '#3f9a4f') + '<path d="M6 120V70M114 120V66" stroke="#8a5526" stroke-width="4"/><g fill="#2f8a43"><ellipse cx="6" cy="66" rx="14" ry="6"/><ellipse cx="114" cy="62" rx="14" ry="6"/></g>',
    savanna: (k) => sky(k, '#ffd59a', '#fff4d6') + '<circle cx="90" cy="30" r="14" fill="#ffe680"/>' + hill(92, '#e8c26a') + hill(104, '#d4a64a', 6) + '<path d="M18 92V70" stroke="#8a5526" stroke-width="2.5"/><ellipse cx="18" cy="68" rx="14" ry="4" fill="#6a9a3a"/>',
    volcano: (k) => sky(k, '#ffb38a', '#ffe0c4') + '<path d="M20 96L50 40L62 40L94 96Z" fill="#7a5040"/><path d="M50 40Q56 30 62 40L58 52L54 46Z" fill="#ff6b3c"/><path d="M56 38Q50 22 60 12Q58 24 66 18Q60 30 56 38Z" fill="#9aa0a8" opacity=".8"/>' + hill(96, '#6cbf5a') + hill(108, '#4fa04a', 6),
    desert: (k) => sky(k, '#ffe7a8', '#fff6dd') + '<circle cx="94" cy="24" r="12" fill="#fff0a0"/>' + hill(90, '#f2cf86', 10) + hill(104, '#e8b866', 6),
    farm: (k) => sky(k, '#a8dcff', '#e9f7ff') + cloud(24, 18, 0.9) + '<path d="M84 60L100 46L116 60V84H84Z" fill="#d9503c"/><rect x="95" y="68" width="10" height="16" fill="#ffffff"/>' + hill(86, '#9bd27f') + '<path d="M0 98H120" stroke="#c9a26a" stroke-width="2" stroke-dasharray="4 3"/>' + hill(106, '#7cbf5f', 6),
    city: (k) => sky(k, '#bfe3ff', '#eef8ff') + cloud(90, 16, 0.8) + '<g fill="#9fb3d9"><rect x="4" y="40" width="20" height="60"/><rect x="28" y="54" width="16" height="46"/><rect x="78" y="34" width="18" height="66"/><rect x="100" y="50" width="18" height="50"/></g>' +
      dots([[10, 48], [18, 48], [10, 58], [18, 58], [84, 42], [90, 42], [84, 52], [90, 52], [106, 58], [112, 58]], 1.6, '#fff3a6') + floor(100, '#8a93a6') + '<path d="M0 110H120" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6 5"/>',
    castle: (k) => sky(k, '#d7c8ff', '#fbefff') + '<g fill="#c4b0f5"><rect x="72" y="40" width="40" height="56"/><rect x="66" y="30" width="12" height="66"/><rect x="106" y="30" width="12" height="66"/></g><g fill="#9b7be0"><path d="M64 30L72 16L80 30Z"/><path d="M104 30L112 16L120 30Z"/></g><rect x="86" y="72" width="12" height="24" rx="6" fill="#7a5cd6"/>' + hill(96, '#a8e6a0') + hill(108, '#86d17e', 6),
    meadow: (k) => sky(k, '#b6e4ff', '#f0faff') + cloud(26, 22, 1) + cloud(98, 14, 0.8) + hill(90, '#a8e08e') + hill(104, '#86cf6e', 8) + [[14, 100, '#ff8fb1'], [104, 98, '#ffd23f'], [62, 112, '#ffffff']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join(''),
    home: (k) => grad(k, '#fff1d6', '#ffe0b8') + `<rect width="120" height="120" fill="url(#${k})"/><rect x="78" y="14" width="30" height="26" rx="2" fill="#bfe8ff" stroke="#c9a26a" stroke-width="2"/><path d="M93 14V40M78 27H108" stroke="#c9a26a" stroke-width="1.5"/>` + floor(92, '#d9a066', '#b8804a'),
    kitchen: (k) => grad(k, '#eaf8f2', '#d8f0e6') + `<rect width="120" height="120" fill="url(#${k})"/>` + U.range(0, 5).map((i) => `<rect x="${i * 24}" y="0" width="12" height="60" fill="#ffffff" opacity=".45"/>`).join('') + floor(84, '#e8c08a', '#c99a5a') + '<rect y="84" width="120" height="4" fill="#ffffff" opacity=".5"/>',
    party: (k) => grad(k, '#fff0f6', '#ffe1ef') + `<rect width="120" height="120" fill="url(#${k})"/>` + bunting(['#ff6b5b', '#ffb547', '#2bb3a3', '#7a5cd6']) + dots([[14, 40], [104, 36], [24, 70], [96, 70], [60, 30]], 1.5, '#ffb547', 0.8) + floor(100, '#c9a7ff'),
    stage: (k) => sky(k, '#3a1d5c', '#7a3a8a') + '<path d="M0 0H22Q14 50 22 100H0Z" fill="#d9503c"/><path d="M120 0H98Q106 50 98 100H120Z" fill="#d9503c"/><path d="M30 0L46 100H74L90 0Z" fill="#fff3a6" opacity=".18"/>' + floor(100, '#8a5526', '#a8673a'),
    field: (k) => sky(k, '#9fd8ff', '#e6f6ff') + cloud(90, 18, 0.9) + hill(80, '#7cc95f', 4) + '<path d="M10 104L60 84L110 104" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".8"/>' + hill(110, '#5fae4a', 4),
    forest: (k) => sky(k, '#c9f0d6', '#f0fff4') + [[10, 64], [28, 54], [94, 56], [112, 66]].map(([x, y]) => `<path d="M${x} ${y - 30}L${x + 12} ${y}H${x - 12}Z" fill="#3f9a5a"/><rect x="${x - 2}" y="${y}" width="4" height="10" fill="#8a5526"/>`).join('') + hill(92, '#7cc070') + hill(106, '#5fa85a', 6),
    rain: (k) => sky(k, '#8fa6c4', '#d8e4f2') + '<g fill="#6f84a6"><ellipse cx="30" cy="16" rx="24" ry="9"/><ellipse cx="90" cy="12" rx="28" ry="10"/></g>' + '<g stroke="#ffffff" stroke-width="1" opacity=".6">' + [[20, 30], [40, 36], [70, 26], [96, 34], [110, 46], [14, 52], [58, 48]].map(([x, y]) => `<path d="M${x} ${y}l-2 6"/>`).join('') + '</g>' + hill(96, '#7cb86a') + '<ellipse cx="86" cy="106" rx="18" ry="4" fill="#9fc4e8"/>',
    swamp: (k) => sky(k, '#c6e3b0', '#eef8e0') + hill(84, '#6a9a4a') + '<ellipse cx="60" cy="104" rx="56" ry="12" fill="#5f8f6a"/><path d="M10 96V70M16 96V76M106 96V68" stroke="#4a7a3a" stroke-width="2"/>',
    halloween: (k) => sky(k, '#2a1b4a', '#6a3a8a') + '<circle cx="92" cy="26" r="15" fill="#ffe9a8"/><circle cx="87" cy="22" r="3" fill="#f0d68a"/>' + dots(STARS.slice(0, 7), 0.9, '#ffffff') + '<path d="M0 92Q20 80 40 90T80 86T120 90V120H0Z" fill="#3a2a5a"/><path d="M12 92V66M12 74L4 66M12 80L20 72" stroke="#2a1b3a" stroke-width="2.5" fill="none"/>',
    xmas: (k) => sky(k, '#1d2f6a', '#4a5fa8') + dots(STARS, 0.9, '#ffffff') + dots([[14, 40], [36, 22], [62, 46], [88, 18], [106, 44], [26, 64], [96, 70]], 1.6, '#ffffff', 0.9) + hill(92, '#ffffff', 8) + hill(106, '#e3effb', 6),
    ice: (k) => sky(k, '#c8ecff', '#f2fbff') + '<path d="M0 84L18 62L34 80L54 56L76 82L96 60L120 80V120H0Z" fill="#e6f6ff"/><path d="M18 62L26 72L34 80M54 56L64 70M96 60L106 72" stroke="#a8d8f0" stroke-width="1.2" fill="none"/>' + floor(96, '#bfe6fa') + '<path d="M0 96H120" stroke="#ffffff" stroke-width="2"/>',
  });

  // ---------------------------------------------------------------- emoji pictures
  // A hero emoji in the middle (or to one side) and a few small ones around it. tint turns the hero's colours
  // (a pink T. rex, a blue unicorn), so packs with few emoji still get many different pictures.
  const EMOJI_FONT = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  const LAYOUTS = {
    c: [[60, 66, 58], [[20, 24, 22], [100, 24, 22], [16, 98, 20], [104, 98, 20], [60, 14, 15], [36, 106, 15], [84, 106, 15]]],
    l: [[44, 68, 60], [[100, 24, 22], [100, 64, 20], [98, 102, 20], [56, 14, 15], [16, 18, 15], [16, 108, 14]]],
    r: [[76, 68, 60], [[20, 24, 22], [20, 64, 20], [22, 102, 20], [64, 14, 15], [104, 18, 15], [104, 108, 14]]],
  };
  const glyph = (e, x, y, s, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONT}"${extra}>${e}</text>`;
  // The hero alone, big: the answer cards of Who's hiding?
  SH.heroArt = (p) => glyph(p.hero, 60, 64, 84, p.tint ? ` style="filter:hue-rotate(${p.tint}deg)"` : '');
  SH.emojiArt = (p) => {
    const [hero, slots] = LAYOUTS[p.lay];
    const extras = p.extras.map((e, i) => { const [x, y, s] = slots[i % slots.length]; return glyph(e, x, y, s, ` transform="rotate(${i % 2 ? 8 : -8} ${x} ${y})"`); }).join('');
    return SH.SCENES[p.bg](id()) + extras + glyph(p.hero, hero[0], hero[1], hero[2], p.tint ? ` style="filter:hue-rotate(${p.tint}deg)"` : '');
  };

  // ---------------------------------------------------------------- the packs
  // price 0 = free. A seasonal pack is free during its season (MM-DD to MM-DD) and costs crystals the rest of the year.
  const PACKS = [
    { id: 'fun', icon: '🎈', name: 'Fun Pictures', price: 0, about: 'Pets, parties, farms, trucks and more.' },
    { id: 'ocean', icon: '🌊', name: 'Ocean', price: 30, about: 'Octopus, whales, sharks, mermaids and sunken treasure.' },
    { id: 'space', icon: '🚀', name: 'Space', price: 30, about: 'Rockets, planets, aliens and shooting stars.' },
    { id: 'candy', icon: '🍭', name: 'Candy Land', price: 30, about: 'Cupcakes, lollipops, ice cream and donuts.' },
    { id: 'jungle', icon: '🌴', name: 'Jungle Safari', price: 30, about: 'Lions, elephants, giraffes, monkeys and parrots.' },
    { id: 'dino', icon: '🦕', name: 'Dinosaurs', price: 50, about: 'Rainbow dinosaurs, volcanoes and dinosaur eggs.' },
    { id: 'unicorn', icon: '🦄', name: 'Unicorn Kingdom', price: 50, about: 'Unicorns, castles, fairies, crowns and rainbows.' },
    { id: 'halloween', icon: '🎃', name: 'Halloween', price: 30, season: ['10-01', '11-07'], about: 'Pumpkins, friendly ghosts, bats and a witch’s hat.' },
    { id: 'winter', icon: '🎄', name: 'Winter Holidays', price: 30, season: ['12-01', '01-15'], about: 'Christmas trees, Santa, reindeer and presents.' },
    { id: 'dragons', icon: '🐉', name: 'Dragon Legends', price: 100, legend: true, about: 'Five elder dragons in their kingdoms. They come alive when you finish them!' },
    { id: 'mythic', icon: '🌟', name: 'Mythic Wonders', price: 150, legend: true, about: 'A genie, a wizard, the Kraken, the World Turtle and the Moon Wolf. They come alive!' },
  ];
  // [id, name, scene, hero, extras, layout c/l/r, tint]
  const E = {
    fun: [
      ['bday', 'Birthday Party', 'party', '🎂', '🎈 🎁 🎉 🧁 🎊'], ['puppy', 'Puppy Play', 'meadow', '🐶', '🦴 🎾 🌼 🦋', 'l'], ['kitty', 'Kitty Nap', 'home', '🐱', '🧶 🐭 🥛 ⭐', 'r'],
      ['bunny', 'Bunny Garden', 'garden', '🐰', '🥕 🌷 🦋 🐞'], ['teddy', 'Teddy Picnic', 'meadow', '🧸', '🍯 🍓 🧺 🌸', 'l'], ['cow', 'Farm Morning', 'farm', '🐮', '🐔 🐷 🌻 🐑', 'l'],
      ['tractor', 'Busy Tractor', 'farm', '🚜', '🌾 🐓 🌽 ☀️'], ['firetruck', 'Fire Truck', 'city', '🚒', '🚨 🏠 💧 ⭐'], ['bus', 'School Bus', 'city', '🚌', '🚦 🏫 🎒 🌳', 'r'],
      ['plane', 'Up in the Air', 'sky', '✈️', '☁️ 🎈 🐦 🌈'], ['heli', 'Helicopter Ride', 'mountain', '🚁', '☁️ 🐦 ☀️ 🌲', 'l'], ['icecream', 'Ice Cream Day', 'beach', '🍦', '🌞 🐚 🕶️ ⛱️'],
      ['pizza', 'Pizza Night', 'kitchen', '🍕', '🧀 🍅 🍄 🌶️'], ['pancake', 'Pancake Breakfast', 'kitchen', '🥞', '🍓 🍯 🥛 🧈', 'r'], ['bee', 'Busy Bee', 'garden', '🐝', '🌻 🌼 🍯 🌸'],
      ['ladybug', 'Little Ladybug', 'garden', '🐞', '🍃 🌷 🌼 🐛', 'l'], ['butterfly', 'Butterfly Dance', 'meadow', '🦋', '🌸 🌼 🌺 🐝'], ['umbrella', 'Rainy Day', 'rain', '☔', '🐸 🐌 🌈 💧'],
      ['duck', 'Duck Pond', 'pond', '🦆', '🐸 🌿 🐟 💧', 'r'], ['owl', 'Night Owl', 'night', '🦉', '🌙 ⭐ ✨ 🍂'], ['fox', 'Forest Friends', 'forest', '🦊', '🍄 🦔 🐿️ 🌰', 'l'],
      ['deer', 'Deer in the Woods', 'forest', '🦌', '🍄 🐦 🍂 🌼', 'r'], ['snowman', 'Snow Day', 'snow', '⛄', '❄️ 🧣 🌲 ⭐'], ['penguin', 'Penguin Slide', 'ice', '🐧', '❄️ 🐟 🧊 ⛄', 'l'],
      ['guitar', 'Rock Band', 'stage', '🎸', '🎵 🥁 🎹 🎶'], ['soccer', 'Soccer Game', 'field', '⚽', '🥅 🏆 ⭐ 🌞'], ['baseball', 'Home Run', 'field', '⚾', '🧢 🏆 ⭐ 🌭', 'r'],
      ['police', 'Police Car', 'city', '🚓', '🚦 🏢 🌳 ⭐', 'l'], ['kite', 'Kite Day', 'sky', '🪁', '☁️ 🌈 🐦 🌞', 'r'], ['rainbow', 'Rainbow Day', 'rainbow', '🌈', '☁️ 🌟 🎈 🌸'],
      ['horse', 'Pony Ride', 'farm', '🐴', '🥕 🍎 🌻 ☁️', 'r'], ['frog', 'Frog Concert', 'pond', '🐸', '🎵 💧 🌿 🎶'], ['moon', 'Goodnight Moon', 'night', '🌙', '⭐ 🐑 💤 ✨'],
      ['apple', 'Apple Tree', 'garden', '🍎', '🌳 🐛 🍏 🐦', 'l'], ['leaves', 'Fall Leaves', 'autumn', '🍁', '🍂 🦔 🍄 🌰'], ['camel', 'Desert Trip', 'desert', '🐫', '🌵 ☀️ 🦎 💧', 'l'],
      ['goat', 'Mountain Goat', 'mountain', '🐐', '🌼 ☁️ 🦅 🌲', 'r'], ['train', 'Choo-Choo Train', 'field', '🚂', '🚃 🌳 ☁️ 🏠'], ['sailboat', 'Sailing Day', 'beach', '⛵', '🌞 🐦 ☁️ 🏝️', 'l'],
      ['cookie', 'Cookie Time', 'kitchen', '🍪', '🥛 🥄 ⭐ 🍰', 'l'], ['magic', 'Magic Show', 'stage', '🎩', '🐇 ✨ 🪄 ⭐'], ['circus', 'Circus Day', 'party', '🎪', '🐘 🎈 🍿 ⭐'],
      ['robot', 'Robot Friend', 'home', '🤖', '⚙️ 🔋 💡 ⭐', 'l'], ['bike', 'Bike Ride', 'field', '🚲', '🌳 🌞 🐦 🌼', 'l'], ['tent', 'Camping Night', 'night', '⛺', '🔥 🌙 ⭐ 🌲', 'r'],
      ['snail', 'Snail Race', 'garden', '🐌', '🍄 🌱 💧 🍓', 'r'], ['chick', 'Little Chick', 'meadow', '🐥', '🥚 🌼 🐔 🌱'], ['swan', 'Swan Lake', 'pond', '🦢', '🌿 💧 🌸 🐟', 'l'],
      ['pig', 'Muddy Piggy', 'farm', '🐷', '💧 🌽 🐔 🌻'], ['hedgehog', 'Hedgehog Walk', 'autumn', '🦔', '🍎 🍄 🍂 🐛', 'r'],
    ],
    ocean: [
      ['octopus', 'Octopus Party', 'deepsea', '🐙', '🐠 🐚 ⭐ 🦀'], ['whale', 'Whale Song', 'sea', '🐳', '🐟 🎵 🐠 🌊', 'l'], ['shark', 'Friendly Shark', 'deepsea', '🦈', '🐟 🐡 🌿 🐠', 'r'],
      ['dolphin', 'Dolphin Jump', 'beach', '🐬', '🌊 🌞 🐟 ⛵'], ['crab', 'Crab Beach', 'beach', '🦀', '🐚 🌴 ⭐ 🌞', 'l'], ['puffer', 'Puffy Pufferfish', 'sea', '🐡', '🐠 🐚 🌿 💧', 'r'],
      ['turtle', 'Sea Turtle', 'sea', '🐢', '🐠 🌿 🐚 🐟'], ['tropical', 'Tropical Fish', 'deepsea', '🐠', '🐟 🐡 🌿 🐚', 'l'], ['lobster', 'Lobster Rock', 'sea', '🦞', '🐚 🦀 🌿 ⭐', 'r'],
      ['squid', 'Squid Swim', 'deepsea', '🦑', '🐟 🐠 💧 🌿'], ['seal', 'Seal Rock', 'ice', '🦭', '🐟 🌊 ❄️ ☁️', 'l'], ['mermaid', 'Mermaid Song', 'sea', '🧜‍♀️', '🐚 🐠 ⭐ 🎵', 'r'],
      ['treasure', 'Sunken Treasure', 'deepsea', '💰', '⚓ 🐙 💎 🐠'], ['shrimp', 'Shrimp Dance', 'sea', '🦐', '🐟 🌿 🐚 💧', 'l'], ['bluewhale', 'Big Blue Whale', 'sea', '🐋', '🐬 🌊 🐟 🌞', 'r'],
      ['shell', 'Shell Collection', 'beach', '🐚', '🦀 🌟 🌴 🌊'], ['boat', 'Fishing Boat', 'beach', '🚤', '🐟 🌊 🐦 ☀️', 'l'], ['surf', 'Surfing Day', 'beach', '🏄', '🌊 🌞 🐬 🌴', 'r'],
      ['ship', 'Ship Ahoy', 'beach', '🚢', '🌊 ⚓ 🐦 ☁️'], ['otter', 'Otter Float', 'sea', '🦦', '🐚 🌊 🐟 🌿', 'l'],
    ],
    space: [
      ['rocket', 'Rocket Launch', 'space', '🚀', '🌍 ⭐ 🌙 ✨'], ['astronaut', 'Astronaut', 'space', '👩‍🚀', '🚀 🌙 ⭐ 🛰️', 'l'], ['alien', 'Alien Friend', 'space', '👽', '🛸 ⭐ 🪐 ✨', 'r'],
      ['ufo', 'Flying Saucer', 'space', '🛸', '👽 ⭐ 🌙 ✨'], ['saturn', 'Ringed Planet', 'space', '🪐', '⭐ ☄️ 🌙 ✨', 'l'], ['earth', 'Our Earth', 'space', '🌍', '🌙 🛰️ ⭐ ☀️', 'r'],
      ['fullmoon', 'Full Moon', 'space', '🌕', '🚀 ⭐ ✨ 🌠'], ['shooting', 'Shooting Star', 'space', '🌠', '⭐ 🌙 ✨ 🪐', 'l'], ['comet', 'Comet', 'space', '☄️', '⭐ 🪐 🌍 ✨', 'r'],
      ['invader', 'Space Invader', 'space', '👾', '⭐ 🛸 ✨ 🌙'], ['satellite', 'Satellite', 'space', '🛰️', '🌍 ⭐ ✨ 🌙', 'l'], ['telescope', 'Stargazing', 'night', '🔭', '🌙 ⭐ 🪐 ✨', 'r'],
      ['sun', 'Our Sun', 'space', '☀️', '🌍 🪐 ⭐ ✨'], ['crescent', 'Moon Night', 'space', '🌙', '⭐ ✨ 🚀 🌠', 'l'], ['galaxy', 'Milky Way', 'space', '🌌', '⭐ 🚀 ✨ 🪐', 'r'],
      ['moonbase', 'Moon Base', 'space', '🌗', '🚀 🚩 ⭐ 🌍'], ['spacedog', 'Space Puppy', 'space', '🐕', '🚀 ⭐ 🌙 🦴', 'l'], ['spacecat', 'Galaxy Kitty', 'space', '🐈', '⭐ 🪐 ✨ 🌙', 'r', 200],
      ['stars', 'Starry Night', 'space', '🌟', '🌙 ✨ ⭐ 💫'], ['spacecow', 'Cow in Space', 'space', '🐄', '🛸 ⭐ 🌙 ✨', 'l'],
    ],
    candy: [
      ['lolly', 'Lollipop Hill', 'candy', '🍭', '🍬 🍫 ⭐ 🍩'], ['cupcake', 'Cupcake Party', 'candy', '🧁', '🎂 🍓 🍬 ✨', 'l'], ['donut', 'Donut Day', 'candy', '🍩', '🍫 🍪 🥛 ⭐', 'r'],
      ['cake', 'Birthday Cake', 'party', '🎂', '🧁 🍬 🎈 ✨'], ['chocolate', 'Chocolate Bar', 'candy', '🍫', '🍪 🥛 🍬 ⭐', 'l'], ['cone', 'Ice Cream Cone', 'candy', '🍦', '🍒 🍫 🍓 ✨', 'r'],
      ['sundae', 'Sundae Treat', 'kitchen', '🍨', '🍒 🍓 🍫 ⭐'], ['shaved', 'Rainbow Ice', 'candy', '🍧', '🍓 🍋 🌈 ✨', 'l'], ['dango', 'Sweet Dango', 'candy', '🍡', '🍵 🌸 🍬 ⭐', 'r'],
      ['slice', 'Strawberry Cake', 'kitchen', '🍰', '🍓 ☕ 🍪 ✨'], ['pie', 'Apple Pie', 'kitchen', '🥧', '🍎 🍯 🥛 ⭐', 'l'], ['custard', 'Wobbly Pudding', 'candy', '🍮', '🍒 🍓 🍬 ✨', 'r'],
      ['candy', 'Candy Rain', 'candy', '🍬', '🍭 🍫 🍩 🌈'], ['cookies', 'Cookie Jar', 'kitchen', '🍪', '🥛 🍫 🍬 ⭐', 'l'], ['honey', 'Honey Pot', 'candy', '🍯', '🐝 🌼 🍪 ✨', 'r'],
      ['popcorn', 'Popcorn Show', 'stage', '🍿', '🥤 🍫 🍬 ⭐'], ['berries', 'Berry Bowl', 'candy', '🍓', '🍒 🫐 🍇 ✨', 'l'], ['juice', 'Juice Box', 'candy', '🧃', '🍊 🍓 🍎 ⭐', 'r'],
      ['candyhouse', 'Candy House', 'candy', '🏠', '🍭 🍬 🍫 🍩', 'c', 300], ['bear', 'Gummy Bear', 'candy', '🧸', '🍬 🍭 🍫 ✨', 'l', 280],
    ],
    jungle: [
      ['lion', 'Lion King', 'savanna', '🦁', '🌴 🦜 🐒 🌺'], ['tiger', 'Tiger Stripes', 'jungle', '🐯', '🌿 🦋 🌺 🐒', 'l'], ['elephant', 'Elephant Splash', 'savanna', '🐘', '💧 🌴 🐦 ☀️', 'r'],
      ['giraffe', 'Tall Giraffe', 'savanna', '🦒', '🌳 🐦 ☁️ 🌞'], ['zebra', 'Zebra Run', 'savanna', '🦓', '🌾 🐦 ☀️ 🌳', 'l'], ['hippo', 'Happy Hippo', 'swamp', '🦛', '💧 🐸 🌿 🐟', 'r'],
      ['monkey', 'Monkey Fun', 'jungle', '🐒', '🍌 🌴 🦜 🌺'], ['gorilla', 'Gentle Gorilla', 'jungle', '🦍', '🍌 🌿 🦋 🌺', 'l'], ['parrot', 'Parrot Talk', 'jungle', '🦜', '🌺 🍍 🌴 🦋', 'r'],
      ['croc', 'Crocodile River', 'swamp', '🐊', '🐟 🌿 🐸 💧'], ['snake', 'Silly Snake', 'jungle', '🐍', '🍃 🦋 🌺 🐞', 'l'], ['flamingo', 'Pink Flamingo', 'swamp', '🦩', '💧 🌿 🐟 🌸', 'r'],
      ['leopard', 'Leopard Nap', 'savanna', '🐆', '🌳 🦋 ☀️ 🌾'], ['rhino', 'Rhino Walk', 'savanna', '🦏', '🐦 🌾 ☀️ 🌳', 'l'], ['kangaroo', 'Kangaroo Hop', 'desert', '🦘', '🌵 ☀️ 🐦 🌼', 'r'],
      ['koala', 'Sleepy Koala', 'forest', '🐨', '🌿 🍃 💤 🌙'], ['sloth', 'Slow Sloth', 'jungle', '🦥', '🍃 🌺 🦋 💤', 'l'], ['orangutan', 'Orangutan', 'jungle', '🦧', '🍌 🌴 🦜 🌺', 'r'],
      ['panda', 'Panda Snack', 'forest', '🐼', '🎋 🍃 🦋 🌿'], ['toucan', 'Bird Paradise', 'jungle', '🐦', '🦜 🌺 🍍 🦋', 'l', 160],
    ],
    dino: [
      ['trex', 'T. rex', 'volcano', '🦖', '🌋 🌿 🥚 🦴'], ['bronto', 'Long Neck', 'jungle', '🦕', '🌴 🌿 🦋 ☀️', 'l'], ['pinktrex', 'Pink T. rex', 'candy', '🦖', '🌸 🥚 ⭐ 🌈', 'r', 290],
      ['bluebronto', 'Blue Dino', 'beach', '🦕', '🌊 🌴 🐚 ☀️', 'c', 180], ['egg', 'Dino Egg', 'volcano', '🥚', '🦖 🦕 🌿 ✨', 'l'], ['fossil', 'Fossil Hunt', 'desert', '🦴', '🦖 ⛏️ 🌵 ☀️', 'r'],
      ['purpletrex', 'Purple T. rex', 'night', '🦖', '🌙 ⭐ 🌋 ✨', 'c', 230], ['swampdino', 'Swamp Dino', 'swamp', '🦕', '🐸 🌿 💧 🦋', 'l'], ['volcano', 'Volcano Day', 'volcano', '🌋', '🦕 🦖 🌿 ☁️', 'r'],
      ['icetrex', 'Ice Age T. rex', 'ice', '🦖', '❄️ 🧊 ⛄ ⭐', 'c', 160], ['goldbronto', 'Golden Dino', 'savanna', '🦕', '☀️ 🌾 🐦 ✨', 'l', 40], ['babydino', 'Baby Dinos', 'meadow', '🦖', '🥚 🌼 🦋 🐣', 'r', 100],
      ['dinoparty', 'Dino Party', 'party', '🦕', '🎂 🎈 🎉 🦖', 'c', 300], ['spacedino', 'Space Dino', 'space', '🦖', '🚀 ⭐ 🪐 ✨', 'l', 250], ['seadino', 'Sea Dino', 'deepsea', '🦕', '🐠 🐚 🌿 🐟', 'r', 200],
      ['croc', 'Old Crocodile', 'swamp', '🐊', '🦕 🌿 💧 🐸'], ['lizard', 'Little Lizard', 'desert', '🦎', '🌵 ☀️ 🥚 🦴', 'l'], ['turtle', 'Ancient Turtle', 'beach', '🐢', '🦕 🌊 🐚 ☀️', 'r'],
      ['rainbowtrex', 'Rainbow T. rex', 'rainbow', '🦖', '🌈 ⭐ ☁️ ✨', 'c', 140], ['dinomeal', 'Dino Lunch', 'jungle', '🦕', '🌿 🍃 🌴 🦋', 'l', 320],
    ],
    unicorn: [
      ['unicorn', 'Unicorn', 'rainbow', '🦄', '🌈 ⭐ ✨ 🌸'], ['castle', 'Fairy Castle', 'castle', '🏰', '🦄 👑 ✨ 🌸', 'l'], ['fairy', 'Little Fairy', 'garden', '🧚', '✨ 🌸 🦋 🍄', 'r'],
      ['crown', 'Royal Crown', 'castle', '👑', '💎 ✨ ⭐ 🌹'], ['blueunicorn', 'Blue Unicorn', 'sky', '🦄', '☁️ 🌈 ⭐ ✨', 'l', 200], ['gem', 'Magic Gem', 'stage', '💎', '✨ 🔮 ⭐ 👑', 'r'],
      ['wand', 'Magic Wand', 'night', '🪄', '✨ ⭐ 🌙 🦋'], ['crystalball', 'Crystal Ball', 'night', '🔮', '✨ 🌙 ⭐ 🦄', 'l'], ['princess', 'Princess', 'castle', '👸', '👑 🦄 🌹 ✨', 'r'],
      ['carousel', 'Carousel', 'party', '🎠', '🎈 ⭐ 🎵 ✨'], ['swan', 'Magic Swan', 'pond', '🦢', '✨ 🌸 👑 💧', 'l'], ['mermaid', 'Rainbow Mermaid', 'sea', '🧜‍♀️', '🐚 💎 ✨ 🐠', 'r', 120],
      ['pinkunicorn', 'Pink Unicorn', 'candy', '🦄', '🍭 🌈 ✨ 🌸', 'c', 300], ['dragon', 'Friendly Dragon', 'castle', '🐉', '🏰 ⭐ 🔥 ✨', 'l'], ['mushroom', 'Fairy House', 'forest', '🍄', '🧚 ✨ 🐌 🌸', 'r'],
      ['nightunicorn', 'Night Unicorn', 'night', '🦄', '🌙 ⭐ ✨ 💫', 'c', 240], ['rose', 'Enchanted Rose', 'stage', '🌹', '✨ 🦋 ⭐ 💎', 'l'], ['butterflyqueen', 'Butterfly Queen', 'meadow', '🦋', '👑 🌸 ✨ 🌼', 'r', 90],
      ['rainbowhorse', 'Rainbow Pony', 'rainbow', '🐴', '🌈 ☁️ ⭐ ✨', 'c', 270], ['goldunicorn', 'Golden Unicorn', 'sky', '🦄', '👑 ✨ 🌟 ☁️', 'l', 30],
    ],
    halloween: [
      ['pumpkin', 'Pumpkin Patch', 'halloween', '🎃', '🦇 🍬 🌙 🍂'], ['ghost', 'Friendly Ghost', 'halloween', '👻', '🎃 ⭐ 🦇 🍭', 'l'], ['bat', 'Bat Night', 'halloween', '🦇', '🌕 ⭐ 🎃 ✨', 'r'],
      ['witch', 'Witch Hat', 'halloween', '🧙', '🧹 🔮 🎃 ⭐'], ['spider', 'Spider Web', 'halloween', '🕸️', '🕷️ 🌙 🍬 ⭐', 'l'], ['candy', 'Trick or Treat', 'halloween', '🍬', '🎃 🍭 🍫 👻', 'r'],
      ['cat', 'Black Cat', 'halloween', '🐈', '🎃 🌙 ⭐ 🦇', 'c', 0], ['owl', 'Spooky Owl', 'halloween', '🦉', '🌕 🍂 🦇 ⭐', 'l'], ['broom', 'Broom Ride', 'halloween', '🧹', '🌕 🦇 ⭐ ✨', 'r'],
      ['potion', 'Magic Potion', 'halloween', '🔮', '✨ 🍄 🕯️ ⭐'], ['pumpkins', 'Pumpkin Party', 'halloween', '🎃', '👻 🍬 🎉 🦇', 'l'], ['moon', 'Harvest Moon', 'halloween', '🌕', '🦉 🍂 🎃 ⭐', 'r'],
    ],
    winter: [
      ['tree', 'Christmas Tree', 'xmas', '🎄', '🎁 ⭐ 🔔 ❄️'], ['santa', 'Santa', 'xmas', '🎅', '🎁 🦌 ⭐ ❄️', 'l'], ['reindeer', 'Reindeer', 'xmas', '🦌', '🔔 ⭐ ❄️ 🌲', 'r'],
      ['gift', 'Presents', 'home', '🎁', '🎄 🧸 🎀 ⭐'], ['snowman', 'Snowman', 'xmas', '☃️', '❄️ 🧣 🥕 ⭐', 'l'], ['bell', 'Jingle Bells', 'xmas', '🔔', '🎄 ⭐ 🎵 ❄️', 'r'],
      ['cookies', 'Cookies for Santa', 'home', '🍪', '🥛 🎅 ⭐ 🎄'], ['sock', 'Christmas Stocking', 'home', '🧦', '🎁 🍬 ⭐ 🎄', 'l'], ['sled', 'Sled Ride', 'snow', '🛷', '❄️ 🌲 ⛄ ⭐', 'r'],
      ['penguin', 'Holiday Penguin', 'ice', '🐧', '🎁 ❄️ 🎄 ⭐'], ['star', 'Christmas Star', 'xmas', '🌟', '🎄 ✨ ❄️ 🔔', 'l'], ['candle', 'Cozy Night', 'home', '🕯️', '🎄 ❄️ ⭐ 🍪', 'r'],
    ],
  };
  // ---------------------------------------------------------------- Legendary pictures
  // A painted scene, the creature (bigger, an elder for dragons) and effects. The effects only move when the picture
  // is alive: on the finished puzzle and in the gallery (CSS classes lg-*, in css/style.css).
  const tw = (list, r, c, cls = 'lg-twinkle') => list.map(([x, y], i) => `<circle class="${cls}" style="animation-delay:${(i * 0.37) % 2}s" cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
  const sparkle = (x, y, r, c, i = 0) => `<path class="lg-twinkle" style="animation-delay:${(i * 0.41) % 2}s" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
  const LEGENDS = {
    dragons: [
      { id: 'royal', art: 'dr_royal', name: 'The Royal Dragon', bg: (k) => sky(k, '#4a2a8a', '#ff9ac4') + '<g fill="#3a1f6a"><rect x="0" y="70" width="26" height="50"/><rect x="94" y="64" width="26" height="56"/><path d="M0 70L13 50L26 70Z"/><path d="M94 64L107 42L120 64Z"/></g>' +
        [[22, 22, '#ffd23f'], [98, 18, '#ff6b9a'], [62, 12, '#8fd8ff']].map(([x, y, c], i) => `<g class="lg-burst" style="animation-delay:${i * 0.7}s;transform-origin:${x}px ${y}px">${U.range(0, 7).map((j) => { const a = (j * Math.PI) / 4; return `<path d="M${x} ${y}L${f1(x + 9 * Math.cos(a))} ${f1(y + 9 * Math.sin(a))}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`; }).join('')}</g>`).join('') + hill(104, '#2a1550', 6) },
      { id: 'cosmic', art: 'dr_cosmic', name: 'The Cosmic Dragon', bg: (k) => sky(k, '#0b0726', '#3a1c6e') + '<ellipse cx="34" cy="40" rx="40" ry="18" fill="#ff6ad5" opacity=".18" transform="rotate(-20 34 40)"/><ellipse cx="90" cy="84" rx="36" ry="14" fill="#7a5cff" opacity=".22"/>' +
        '<circle cx="100" cy="22" r="9" fill="#ffb547"/><ellipse cx="100" cy="22" rx="15" ry="3.5" fill="none" stroke="#ffe0a0" stroke-width="1.2"/><circle cx="16" cy="96" r="6" fill="#5ec8ff"/>' + tw(STARS, 1.1, '#ffffff') + '<path class="lg-shoot" d="M10 20L26 26" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>' },
      { id: 'storm', art: 'dr_storm', name: 'The Storm Dragon', bg: (k) => sky(k, '#2e335a', '#7880b0') + '<g fill="#4a5080"><ellipse cx="26" cy="14" rx="30" ry="12"/><ellipse cx="94" cy="10" rx="34" ry="13"/></g>' +
        '<path class="lg-flash" d="M18 18L10 40H18L12 60L30 32H22L28 18Z" fill="#ffe14d"/><path class="lg-flash" style="animation-delay:1.3s" d="M104 16L96 36H104L98 54L114 30H106L112 16Z" fill="#ffe14d"/>' +
        '<g stroke="#cfe0ff" stroke-width=".8" opacity=".7">' + [[8, 70], [24, 84], [40, 66], [86, 72], [100, 88], [116, 68], [60, 92]].map(([x, y], i) => `<path class="lg-rain" style="animation-delay:${i * 0.17}s" d="M${x} ${y}l-3 8"/>`).join('') + '</g>' + hill(104, '#3a4070', 6) },
      { id: 'crystal', art: 'dr_crystal', name: 'The Crystal Dragon', bg: (k) => sky(k, '#2a1f4a', '#5a3f8a') + [[10, 120, 10, 70, '#9ff0ff'], [22, 120, 28, 82, '#ffc4ec'], [98, 120, 104, 66, '#d3b8ff'], [112, 120, 116, 84, '#9ff0ff'], [60, 120, 66, 100, '#ffc4ec']].map(([x1, y1, x2, y2, c], i) => `<path class="lg-glow" style="animation-delay:${i * 0.5}s" d="M${x1 - 7} ${y1}L${x2} ${y2}L${x1 + 7} ${y1}Z" fill="${c}" opacity=".85"/>`).join('') +
        [[20, 30, '#ffffff'], [96, 24, '#ffc4ec'], [60, 14, '#9ff0ff'], [104, 50, '#ffffff'], [14, 56, '#d3b8ff']].map(([x, y, c], i) => sparkle(x, y, 4, c, i)).join('') },
      { id: 'sun', art: 'dr_sun', name: 'The Sun Dragon', bg: (k) => sky(k, '#ffb547', '#fff3c4') + `<g class="lg-spin" style="transform-origin:60px 70px">${U.range(0, 11).map((j) => { const a = (j * Math.PI) / 6; return `<path d="M60 70L${f1(60 + 90 * Math.cos(a - 0.08))} ${f1(70 + 90 * Math.sin(a - 0.08))}L${f1(60 + 90 * Math.cos(a + 0.08))} ${f1(70 + 90 * Math.sin(a + 0.08))}Z" fill="#ffffff" opacity=".22"/>`; }).join('')}</g>` +
        '<g class="lg-drift">' + cloud(20, 22, 1) + cloud(100, 16, 0.8) + '</g>' + hill(100, '#ffd27a', 8) },
    ],
    mythic: [
      { id: 'genie', art: 'genie', name: 'The Genie', bg: (k) => sky(k, '#1d1a4a', '#7a3a8a') + '<circle cx="96" cy="22" r="10" fill="#fff3c4"/>' + tw(STARS.slice(0, 8), 0.9, '#ffffff') + hill(98, '#c98a4a', 8) + hill(108, '#a86a3a', 6) +
        '<path d="M8 98V70Q8 62 14 62Q20 62 20 70V98Z" fill="#5a3a8a"/><circle cx="14" cy="58" r="5" fill="#ffd23f"/>' + [[30, 40, '#ffd23f'], [92, 52, '#ff8fe0'], [18, 30, '#9ff0ff']].map(([x, y, c], i) => sparkle(x, y, 4, c, i)).join('') },
      { id: 'merlin', art: 'merlin', name: 'Merlin the Wizard', bg: (k) => sky(k, '#14214a', '#3a4f8a') + tw(STARS, 1, '#ffffff') + '<rect x="94" y="40" width="22" height="80" fill="#3a3a6a"/><path d="M90 40L105 14L120 40Z" fill="#5a4aa8"/><rect x="101" y="56" width="8" height="10" rx="4" fill="#ffe14d"/>' +
        [[18, 30, '#9ff0ff'], [30, 62, '#ff8fe0'], [76, 22, '#ffe14d']].map(([x, y, c], i) => `<circle class="lg-float" style="animation-delay:${i * 0.6}s" cx="${x}" cy="${y}" r="4" fill="${c}" opacity=".85"/>`).join('') + hill(104, '#24305a', 6) },
      { id: 'kraken', art: 'kraken', name: 'The Kraken', bg: (k) => sky(k, '#2a3a5a', '#5a7a9a') + '<g fill="#3a4a6a"><ellipse cx="30" cy="12" rx="32" ry="11"/><ellipse cx="96" cy="16" rx="30" ry="10"/></g><path class="lg-flash" d="M100 20L94 36H100L96 50L108 30H102L106 20Z" fill="#ffe14d"/>' +
        '<path d="M6 60L14 46L22 60Z" fill="#8a5526"/><path d="M14 46V34L24 40Z" fill="#ffffff"/>' + '<g class="lg-wave"><path d="M-10 92Q5 84 20 92T50 92T80 92T110 92T140 92V120H-10Z" fill="#2a6a9a"/></g><g class="lg-wave" style="animation-delay:-1s"><path d="M-10 102Q5 94 20 102T50 102T80 102T110 102T140 102V120H-10Z" fill="#1d4f7a"/></g>' },
      { id: 'turtle', art: 'worldturtle', name: 'The World Turtle', bg: (k) => sky(k, '#7fcfff', '#e6f7ff') + '<circle cx="18" cy="20" r="9" fill="#fff0a0"/>' + '<g class="lg-drift">' + cloud(84, 16, 1) + cloud(30, 40, 0.7) + '</g>' +
        '<g class="lg-wave"><path d="M-10 96Q5 90 20 96T50 96T80 96T110 96T140 96V120H-10Z" fill="#3fa9e0"/></g>' + [[100, 40], [108, 46]].map(([x, y], i) => `<path class="lg-float" style="animation-delay:${i * 0.4}s" d="M${x - 4} ${y}Q${x} ${y - 4} ${x + 4} ${y}" fill="none" stroke="#22304f" stroke-width="1"/>`).join('') },
      { id: 'moonwolf', art: 'moonwolf', name: 'The Moon Wolf', bg: (k) => sky(k, '#0f1a3a', '#2a3f7a') + '<path class="lg-glow" d="M-10 40Q30 20 60 34T130 30V54Q90 44 60 56T-10 60Z" fill="#5ef0b0" opacity=".35"/><path class="lg-glow" style="animation-delay:1s" d="M-10 50Q40 34 70 46T130 42V60Q90 54 60 64T-10 66Z" fill="#7ab8ff" opacity=".3"/>' +
        '<circle cx="96" cy="20" r="12" fill="#fff3c4"/>' + tw(STARS.slice(2), 1, '#ffffff') + hill(98, '#1d2a4a', 8) },
    ],
  };
  SH.legendArt = (p) => {
    const L = p.legend;
    const art = MQ.art(L.art, { stage: L.art.startsWith('dr_') ? 3 : undefined }).replace('<svg class="art"', '<svg x="14" y="20" width="92" height="92"');
    return L.bg(id()) + `<g class="lg-hero">${art}</g>` + '<rect x="1" y="1" width="118" height="118" rx="4" fill="none" stroke="#ffd23f" stroke-width="2.4"/><rect x="3.5" y="3.5" width="113" height="113" rx="3" fill="none" stroke="#fff3c4" stroke-width=".8"/>';
  };

  // ---------------------------------------------------------------- register everything with the rules
  for (const p of SH.PICS) p.pack = 'free';
  for (const P of PACKS) {
    for (const [sid, name, bg, hero, extras, lay = 'c', tint = 0] of E[P.id] || []) SH.PICS.push({ id: P.id + '-' + sid, name, bg, hero, extras: extras.split(' '), lay, tint, pack: P.id, kind: 'emoji' });
    for (const L of LEGENDS[P.id] || []) SH.PICS.push({ id: 'lg-' + L.id, name: L.name, pack: P.id, kind: 'legend', legend: L, hero: '' });
  }
  SH.PACKS = [{ id: 'free', icon: '🐉', name: 'Hatchery Pictures', price: 0, about: 'Creatures from the Hatchery in their homes.' }, ...PACKS];
  SH.reindex();
})();
