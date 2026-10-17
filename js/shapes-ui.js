// Puzzle Time screens: the album page, and the puzzle in play. Six kinds of puzzles:
//   🧲 Snap!           every right answer snaps a piece of a creature's picture into place
//   ✋ Find the piece  the problem is written in the hole; the child drags in the piece with the answer
//   ☁️ Who's hiding?   every right answer blows a cloud off a picture; guessing early earns crystals
//   ⭐ Shape Puzzle    every right answer flies a jigsaw piece into a smiling shape
//   🏠 Build It        every right answer gives a shape; the child drags it into its outline
//   ✏️ Dot to Dot      every right answer draws the line to the next dot; the last one closes the surprise shape
// Shapes, pictures, the cut and the problems are in js/shapes.js. The app shell (js/app.js) lends render, toast,
// rewards and answer recording via MQ.app.kit, like Sunny Farm.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, SH = MQ.shapes;
  const esc = U.esc;
  const K = () => MQ.app.kit;
  const st = () => K().state();
  const $ = (sel, el = document) => el.querySelector(sel);
  const f1 = (x) => +(+x).toFixed(2);
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const MODES = {
    snap: { icon: '🧲', title: 'Snap!', blurb: 'Every right answer snaps a piece of the picture into place.' },
    find: { icon: '✋', title: 'Find the piece', blurb: 'The problem is in the hole. Drag in the piece with the answer!' },
    hide: { icon: '☁️', title: 'Who’s hiding?', blurb: 'Every right answer blows a cloud away. Guess who is under them!' },
    shape: { icon: '⭐', title: 'Shape Puzzle', blurb: 'Every right answer brings a puzzle piece. Make a shape!' },
    build: { icon: '🏠', title: 'Build It', blurb: 'Every right answer gives you a shape. Put it in its place!' },
    dots: { icon: '✏️', title: 'Dot to Dot', blurb: 'Every right answer draws a line to the next dot. What will it be?' },
  };
  const PIC = ['snap', 'find', 'hide']; // the picture puzzles
  let G = null; // the puzzle in play
  const last = { dots: '', pic: '' };
  let boards = 0; // makes the board's ids unique

  // Timers of a puzzle only fire while that puzzle is still on screen.
  const later = (fn, ms) => { const g = G; setTimeout(() => { if (g && G === g && g.svg && g.svg.isConnected) fn(); }, reduced() ? Math.min(ms, 60) : ms); };
  const voiceOn = () => st().settings.voice !== false && MQ.canSpeak();
  const speak = (t) => { if (voiceOn() && t) MQ.speak(t); };
  const gemPill = () => `<span class="pill gem" aria-label="crystals">💎 <b id="gems">${st().crystals}</b></span>`;
  function header(title, back) {
    return `<header class="bar"><button class="iconbtn" data-act="go" data-arg="${back}" aria-label="Back">←</button><h1>${title}</h1>${gemPill()}</header>`;
  }
  const svgBox = (inner, cls = '') => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${inner}</svg>`;
  const creature = (pic) => (MQ.EGG_CREATURES || []).find((c) => c.id === pic.id) || {};

  // ---------------------------------------------------------------- the album page, packs, the gallery
  const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  const mmdd = (s) => MONTHS[+s.slice(0, 2) - 1] + ' ' + +s.slice(3);
  const starStr = (n) => (n ? `<span class="pz-stars" role="img" aria-label="${n} of 3 stars">${'★'.repeat(n)}<s>${'★'.repeat(3 - n)}</s></span>` : '');
  const tick = (on) => (on ? '<i aria-hidden="true">✓</i>' : '');
  // A picture to tap and play (in Snap! or Find the piece); a locked one is dimmed with a lock.
  function picThumb(p, o = {}) {
    const pz = SH.ensure(st()), key = 'pic:' + p.id, got = !!pz.done[key];
    const cls = `pz-thumb ${got ? 'got' : ''} ${pz.gold[key] ? 'gold' : ''} ${p.kind === 'legend' ? 'legend' : ''} ${o.locked ? 'locked' : ''}`;
    const inner = svgBox(SH.picArt(p)) + tick(got) + starStr(pz.stars[key]) + (o.locked ? '<b class="pz-lock" aria-hidden="true">🔒</b>' : '');
    return o.locked ? `<span class="${cls}" role="img" aria-label="${esc(SH.picName(p))} (locked)">${inner}</span>`
      : `<button class="${cls}" data-act="pzPlay" data-arg="${o.as || 'snap'}:${p.id}" aria-label="${esc(SH.picName(p))}${got ? ' (done)' : ''}">${inner}</button>`;
  }
  function packStatus(P) {
    const s = st(), bought = SH.ensure(s).packs[P.id];
    if (!P.price) return '<span class="pz-tag free">Free</span>';
    if (bought) return '<span class="pz-tag own">✓ Yours</span>';
    if (SH.inSeason(P)) return `<span class="pz-tag free">Free until ${mmdd(P.season[1])}</span>`;
    return `<span class="pz-tag price">${P.price} 💎</span>`;
  }
  function packCard(P) {
    const s = st(), pics = SH.packPics(P.id), made = pics.filter((p) => SH.ensure(s).done['pic:' + p.id]).length;
    return `<button class="pz-pack ${P.legend ? 'legend' : ''} ${SH.hasPack(s, P) ? '' : 'locked'}" data-act="pzPack" data-arg="${P.id}">
      ${svgBox(SH.picArt(pics[0]), 'pz-cover')}<span class="pz-pack-t"><b>${P.icon} ${esc(P.name)}</b><small>${made} of ${pics.length} made</small>${packStatus(P)}</span></button>`;
  }
  // Packs in the order a child wants them: free, seasonal ones in their season, the rest, Legendary last.
  const packOrder = () => {
    const rank = (P) => (!P.price ? 0 : SH.inSeason(P) ? 1 : P.legend ? 3 : 2);
    return SH.PACKS.slice().sort((a, b) => rank(a) - rank(b));
  };
  function hub() {
    G = null;
    const s = st(), pz = SH.ensure(s), done = pz.done;
    const thumb = (key, art, label) => `<button class="pz-thumb ${done[key] ? 'got' : ''}" data-act="pzPlay" data-arg="${key}" aria-label="${esc(label)}${done[key] ? ' (done)' : ''}">${svgBox(art)}${tick(done[key])}${starStr(pz.stars[key])}</button>`;
    const mystery = '<span class="pz-thumb mystery" role="img" aria-label="not found yet">?</span>';
    const head = (mode) => `<div class="pzc-h"><span class="pzc-i" aria-hidden="true">${MODES[mode].icon}</span><div><h2>${MODES[mode].title}</h2><p>${MODES[mode].blurb}</p></div></div>`;
    const card = (mode, body) => `<section class="pzcard pz-${mode}">${head(mode)}${body}</section>`;
    const dots = SH.DOTS.map((d) => (done['dots:' + d.id] ? `<span class="pz-thumb got" role="img" aria-label="${d.name}">${svgBox(SH.dotArt(d))}${tick(true)}</span>` : mystery)).join('');
    const d = SH.daily(s), dDone = SH.dailyDone(s), streak = pz.daily.streak;
    const daily = `<section class="pzcard pz-daily ${dDone ? 'done' : ''}"><span class="pzc-i" aria-hidden="true">${dDone ? '✅' : '🌞'}</span>
      <div class="pz-daily-t"><h2>Puzzle of the day</h2><p>${dDone ? `Done! A new one comes tomorrow.${streak ? ` 🔥 ${streak} ${streak === 1 ? 'day' : 'days'} in a row` : ''}`
        : `Today: ${MODES[d.mode].icon} ${MODES[d.mode].title} with a surprise picture · +${SH.REWARD.daily} 💎${streak ? ` · 🔥 ${streak}` : ''}`}</p></div>
      ${dDone ? '' : '<button class="btn" data-act="pzPlay" data-arg="daily">Play ▶</button>'}</section>`;
    const onWall = SH.ITEMS.filter((k) => done[k]).length;
    K().render(header('🧩 Puzzle Time', 'home') + `<main class="pzhub">
      <div class="pz-top"><p class="pz-intro">Solve short problems to make pictures and shapes. Puzzles made: <b>${SH.count(s)}</b></p>
        <div class="pz-size"><span>Pieces</span><div class="chips">${Object.keys(SH.GRID).map((n) => `<button class="chip ${+n === pz.n ? 'sel' : ''}" data-act="pzSize" data-arg="${n}" aria-pressed="${+n === pz.n}">${n}</button>`).join('')}</div></div>
        <p class="pz-tip left">${starStr(1)} 4–6 pieces · ${starStr(2)} 9–12 · ${starStr(3)} 16–20</p></div>
      ${daily}
      <button class="pz-wallbtn" data-act="go" data-arg="shapes:gallery">🖼️ <b>My Gallery</b><small>${onWall} ${onWall === 1 ? 'picture' : 'pictures'} on the wall</small></button>
      <h2 class="pz-group">Picture puzzles</h2>
      <div class="pz-modes">${PIC.map((m) => `<section class="pzcard pz-mode pz-${m}">${head(m)}<button class="btn" data-act="pzPlay" data-arg="${m}">Play ▶</button></section>`).join('')}</div>
      <h2 class="pz-group">Picture collections</h2>
      <p class="pz-tip left">Get new collections with your crystals. Legendary pictures come alive when you finish them!</p>
      <div class="pz-packs">${packOrder().map(packCard).join('')}</div>
      <h2 class="pz-group">Shape puzzles</h2>
      ${card('shape', `<div class="pz-thumbs">${SH.SHAPES.map((x) => thumb('shape:' + x.id, SH.shapeArt(x), x.name)).join('')}</div>`)}
      ${card('build', `<div class="pz-thumbs">${SH.FIGS.map((f) => thumb('build:' + f.id, SH.figArt(f), f.name)).join('')}</div>`)}
      ${card('dots', `<div class="pz-thumbs">${dots}</div><button class="btn" data-act="pzPlay" data-arg="dots">Start a surprise ✏️</button>`)}
    </main>`);
    K().setCur('shapes');
  }

  // One collection: its pictures (dimmed until it is yours) and how to get it.
  let curPack = '';
  function packPage(id) {
    G = null;
    const s = st(), P = SH.PACKS.find((x) => x.id === id);
    if (!P) return hub();
    curPack = id;
    const pz = SH.ensure(s), own = SH.hasPack(s, P), pics = SH.packPics(id), as = pz.as === 'find' ? 'find' : 'snap';
    const made = pics.filter((p) => pz.done['pic:' + p.id]).length;
    const buyBtn = (label) => (s.crystals >= P.price ? `<button class="btn" data-act="pzBuy" data-arg="${id}">${label}</button>`
      : `<p class="pz-need">You need <b>${P.price - s.crystals}</b> more 💎. Solve problems to earn crystals!</p>`);
    let top = `<p class="pz-intro">${esc(P.about || '')}</p>`;
    if (own) {
      top += `<p class="pz-intro"><b>${made} of ${pics.length}</b> made.</p><div class="pz-size"><span>Play as</span><div class="chips">${['snap', 'find'].map((m) => `<button class="chip ${m === as ? 'sel' : ''}" data-act="pzAs" data-arg="${m}" aria-pressed="${m === as}">${MODES[m].icon} ${MODES[m].title}</button>`).join('')}</div></div>`;
      if (P.legend) top += `<p class="pz-tip left">🌟 Legendary pictures have at least ${SH.LEGEND_MIN} pieces and come alive when you finish them!</p>`;
      if (P.price && !pz.packs[id]) top += `<div class="pz-buy"><p>${P.icon} Free until ${mmdd(P.season[1])}. Keep it for the whole year for <b>${P.price} 💎</b>.</p>${buyBtn(`Keep it for ${P.price} 💎`)}</div>`;
    } else {
      top += `<div class="pz-buy"><p><b>${pics.length} puzzles</b> for <b>${P.price} 💎</b> · you have <b>${s.crystals} 💎</b></p>${buyBtn(`Get it for ${P.price} 💎`)}
        ${P.season ? `<p class="pz-tip left">${P.icon} Free from ${mmdd(P.season[0])} to ${mmdd(P.season[1])}.</p>` : ''}</div>`;
    }
    K().render(header(`${P.icon} ${esc(P.name)}`, 'shapes') + `<main class="pzhub pz-packpage ${P.legend ? 'legend' : ''}"><section class="pzcard">${top}</section>
      <div class="pz-thumbs big">${pics.map((p) => picThumb(p, { locked: !own, as })).join('')}</div></main>`);
  }
  function buy(id) {
    const s = st(), P = SH.PACKS.find((x) => x.id === id);
    if (!P) return;
    K().modal(`<div class="bigemoji">${P.icon}</div><div class="mtitle">${esc(P.name)}</div>
      <p>Get <b>${SH.packPics(id).length} new puzzles</b> for <b>${P.price} 💎</b>?</p><p class="muted">You have ${s.crystals} 💎.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Not now</button><button class="btn" data-act="pzBuyYes" data-arg="${id}">Yes, get it!</button></div>`);
  }
  function bought(id) {
    const s = st(), P = SH.PACKS.find((x) => x.id === id);
    K().closeModal();
    if (!P || !SH.buy(s, id)) return packPage(id);
    K().addGems(0); // shows the new crystal count
    MQ.store.save();
    MQ.sfx('reward');
    MQ.confetti(140);
    K().toast(`🎉 <b>${esc(P.name)}</b> is yours! ${SH.packPics(id).length} new puzzles`, 'gold');
    packPage(id);
    setTimeout(() => { if (st() === s) K().checkBadges(); }, 1200);
  }

  // Everything finished hangs on the wall; a tap shows it big (Legendary ones move).
  const itemArt = (key) => {
    const [kind, id] = key.split(':');
    if (kind === 'pic') { const p = SH.picById[id]; return p && { art: SH.picArt(p), name: SH.picName(p), play: 'snap:' + id, legend: p.kind === 'legend' }; }
    const f = SH.find(key);
    if (!f || !f.item) return null;
    const x = f.item, art = kind === 'shape' ? SH.shapeArt(x) : kind === 'build' ? SH.figArt(x) : SH.dotArt(x);
    return { art, name: x.name, play: key };
  };
  function gallery() {
    G = null;
    const pz = SH.ensure(st()), done = pz.done;
    const frame = (key) => { const a = itemArt(key); return a ? `<button class="pz-framed ${pz.gold[key] ? 'gold' : ''} ${a.legend ? 'legend' : ''}" data-act="pzView" data-arg="${key}" aria-label="${esc(a.name)}">${svgBox(a.art)}${starStr(pz.stars[key])}</button>` : ''; };
    const groups = SH.PACKS.map((P) => [P.icon + ' ' + esc(P.name), SH.packPics(P.id).map((p) => 'pic:' + p.id).filter((k) => done[k])])
      .concat([['⭐ Shapes, pictures of shapes and dot-to-dots', SH.ITEMS.filter((k) => !k.startsWith('pic:') && done[k])]]).filter(([, l]) => l.length);
    const total = groups.reduce((n, [, l]) => n + l.length, 0);
    K().render(header('🖼️ My Gallery', 'shapes') + `<main class="pzhub">
      <p class="pz-intro">${total ? `<b>${total}</b> ${total === 1 ? 'picture' : 'pictures'} on your wall. Tap one to look closer.` : 'Your wall is empty. Finish a puzzle and it hangs here!'}</p>
      ${groups.map(([title, l]) => `<h2 class="pz-group">${title}</h2><div class="pz-wall">${l.map(frame).join('')}</div>`).join('')}</main>`);
  }
  function view(key) {
    const a = itemArt(key), pz = SH.ensure(st());
    if (!a) return;
    K().modal(`<div class="pz-view">${svgBox(a.art, 'pz-viewart alive' + (pz.gold[key] ? ' gold' : ''))}<div class="mtitle">${esc(a.name)}</div>${starStr(pz.stars[key])}
      ${pz.gold[key] ? '<p class="pz-gems">✨ Golden</p>' : ''}<div class="row"><button class="btn ghost" data-act="closeModal">Close</button><button class="btn" data-act="pzReplay" data-arg="${a.play}">Play again ▶</button></div></div>`);
  }

  // ---------------------------------------------------------------- a puzzle
  function start(key) {
    const s = st(), k = String(key);
    let mode = k.split(':')[0], item = null, daily = false, from = '';
    if (k === 'daily') {
      if (SH.dailyDone(s)) return hub();
      const d = SH.daily(s);
      mode = d.mode; item = d.pic; daily = true;
    } else if (mode === 'dots' && !k.includes(':')) item = SH.nextDots(s, last.dots);
    else if (PIC.includes(mode) && (!k.includes(':') || mode === 'hide')) item = SH.nextPic(s, last.pic); // who is hiding is always a surprise
    else { const f = SH.find(k); item = f && f.item; if (item && PIC.includes(mode)) from = item.pack || 'free'; }
    if (!MODES[mode] || !item) return hub();
    const pic = PIC.includes(mode);
    if (pic && !daily && !SH.owns(s, item)) return packPage(item.pack);
    const legend = pic && item.kind === 'legend', n = legend ? Math.max(SH.ensure(s).n, SH.LEGEND_MIN) : SH.ensure(s).n;
    G = { mode, item, pic, legend, daily, from, n, gold: pic && !legend && Math.random() < SH.GOLD_CHANCE,
      key: (pic ? 'pic' : mode) + ':' + item.id, prob: null, tries: 0, given: undefined, busy: false, done: false, earn: -1, miss: 0, target: -1, locked: true };
    if (pic || mode === 'shape') { G.pz = SH.cut(n, pic ? null : item); G.left = G.pz.pieces.map((p) => p.i); }
    else if (mode === 'build') G.left = item.parts.map((_, i) => i);
    else G.left = item.pts.map((_, i) => i);
    if (mode === 'dots') last.dots = item.id;
    if (pic) last.pic = item.id;
    G.total = G.left.length;
    const M = MODES[mode];
    K().render(header(daily ? `🌞 Puzzle of the day · ${M.icon} ${M.title}` : `${M.icon} ${M.title}`, from && from !== 'free' ? 'shapes:pack:' + from : 'shapes') +
      `<main class="pzplay pz-${mode}${G.gold ? ' is-gold' : ''}${legend ? ' is-legend' : ''}">
      <div class="pz-board" id="pzboard"></div><section class="pz-panel" id="pzpanel" aria-live="polite"></section></main>`, 'is-pz');
    drawBoard();
    next();
    if (G.gold) { MQ.sfx('shimmer'); speak('Wow, a golden puzzle! Double crystals!'); }
  }
  // ✨ a golden puzzle: the picture shines and its sparkles twinkle
  const goldLayer = () => '<rect width="120" height="120" fill="#ffd23f" opacity=".16"/>' + [[16, 16], [104, 22], [96, 100], [20, 96], [60, 10]].map(([x, y], i) =>
    `<path class="lg-twinkle" style="animation-delay:${i * 0.4}s" d="M${x} ${y - 5}Q${x} ${y} ${x + 5} ${y}Q${x} ${y} ${x} ${y + 5}Q${x} ${y} ${x - 5} ${y}Q${x} ${y} ${x} ${y - 5}Z" fill="#fff3a6"/>`).join('');

  function drawBoard() {
    const el = $('#pzboard'), k = 'pzb' + ++boards;
    let svg;
    if (G.pz) { // a jigsaw: a picture (Snap, Find the piece, Who's hiding) or a shape
      const sh = G.mode === 'shape' ? G.item : null, ps = G.pz.pieces;
      const clipped = (s) => (sh ? `<g clip-path="url(#${k}sh)">${s}</g>` : s);
      const defs = `<defs><g id="${k}p">${sh ? SH.shapeArt(sh) : SH.picArt(G.item) + (G.gold ? goldLayer() : '')}</g><clipPath id="${k}all"><rect width="120" height="120" rx="4"/></clipPath>` +
        (sh ? `<clipPath id="${k}sh"><path d="${sh.d}"/></clipPath>` : '') + ps.map((p) => `<clipPath id="${k}c${p.i}"><path d="${p.clip}"/></clipPath>`).join('') + '</defs>';
      if (G.mode === 'hide') svg = defs + `<g clip-path="url(#${k}all)"><use href="#${k}p"/>${ps.map(cloud).join('')}</g>`;
      else {
        svg = defs + clipped(`<rect width="120" height="120" rx="4" class="pz-bg"/>` + ps.map((p) => `<path class="pz-slot" d="${p.d}"/>`).join('')) +
          (sh ? `<path class="pz-edge" d="${sh.d}"/>` : '') +
          ps.map((p) => `<g class="pz-pc off" data-i="${p.i}" style="transform-origin:${f1(p.cx)}px ${f1(p.cy)}px">` + clipped(`<g clip-path="url(#${k}c${p.i})"><use href="#${k}p"/></g><path class="pz-seam" d="${p.d}"/>`) + '</g>').join('') +
          (sh ? `<use class="pz-full" href="#${k}p"/>` : `<g clip-path="url(#${k}all)"><use class="pz-full" href="#${k}p"/></g>`) + '<g class="pz-hole"></g>';
      }
    } else if (G.mode === 'build') {
      svg = G.item.parts.map((pt, i) => { const [x, y, w, h] = SH.partBB(pt);
        return `<g class="pz-part" data-i="${i}" style="transform-origin:${f1(x + w / 2)}px ${f1(y + h / 2)}px">${SH.partShape(pt, 'class="pz-pslot"')}</g>`; }).join('');
    } else {
      const d = G.item, pts = d.pts, n = pts.length;
      const cx = U.sum(pts.map((p) => p[0])) / n, cy = U.sum(pts.map((p) => p[1])) / n;
      const clamp = (v) => Math.max(4, Math.min(116, v));
      svg = `<g class="pz-dfill">${SH.dotArt(d)}</g><g class="pz-segs"></g>` + pts.map((p, i) => {
        const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1;
        return `<g class="pz-dot${i === 0 ? ' cur' : ''}" data-i="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="2.6"/><text class="pz-dnum" x="${f1(clamp(p[0] + (dx / L) * 8))}" y="${f1(clamp(p[1] + (dy / L) * 8))}">${i + 1}</text></g>`;
      }).join('');
    }
    el.innerHTML = `<svg class="pz-svg" viewBox="0 0 120 120" role="img" aria-label="${esc(MODES[G.mode].title)}">${svg}</svg>` +
      (G.gold ? '<p class="pz-goldnote">✨ A golden puzzle! Double crystals</p>' : G.legend ? '<p class="pz-goldnote">🌟 Legendary! It comes alive when you finish it</p>' : '');
    G.svg = el.firstElementChild;
  }
  // ☁️ a puffy cloud over one cell; its puffs reach over the edges so no gap shows between clouds
  function cloud(p) {
    const { x0, y0, W, H, cx, cy } = p, R = Math.min(W, H);
    const puffs = [[x0, y0], [cx, y0], [x0 + W, y0], [x0, cy], [x0 + W, cy], [x0, y0 + H], [cx, y0 + H], [x0 + W, y0 + H]].map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * 0.2)}"/>`).join('');
    return `<g class="pz-cloud" data-i="${p.i}" style="transform-origin:${f1(cx)}px ${f1(cy)}px"><g fill="#f1f5ff"><rect x="${f1(x0 - 0.5)}" y="${f1(y0 - 0.5)}" width="${f1(W + 1)}" height="${f1(H + 1)}"/>${puffs}</g>` +
      `<circle cx="${f1(cx + R * 0.16)}" cy="${f1(cy + R * 0.1)}" r="${f1(R * 0.2)}" fill="#e2e9fb"/><circle cx="${f1(cx - R * 0.1)}" cy="${f1(cy - R * 0.08)}" r="${f1(R * 0.24)}" fill="#ffffff"/>` +
      `<text class="pz-qm" x="${f1(cx)}" y="${f1(cy)}" font-size="${f1(R * 0.3)}">?</text></g>`;
  }

  const placed = () => G.total - G.left.length - (G.earn >= 0 ? 1 : 0);
  const takeRandom = () => G.left.splice(Math.floor(Math.random() * G.left.length), 1)[0];
  const sayQ = () => {
    if (G.mode === 'build' && G.earn >= 0) return `You got a ${G.item.parts[G.earn].kind}! Where does it go?`;
    return G.prob ? G.prob.say + (G.mode === 'find' ? ' Find the piece that fits!' : '') : '';
  };

  function next() {
    G.prob = SH.problem(st().grade, G.prob);
    G.tries = 0;
    G.given = undefined;
    if (G.mode === 'find') G.target = U.pick(G.left);
    panel();
    if (st().settings.readAloud) later(() => speak(sayQ()), 250);
  }

  const progHtml = () => `<div class="pz-prog" role="img" aria-label="${placed()} of ${G.total} done">${U.range(1, G.total).map((i) => `<i class="${i <= placed() ? 'on' : ''}"></i>`).join('')}</div>`;
  const sayBtn = '<button class="pz-say" data-act="pzSay" aria-label="Read it to me">🔊</button>';
  const frames = (p) => {
    const cells = SH.cells(p, st().grade), out = [];
    for (let i = 0; i < cells.length; i += 10) out.push(`<div class="pz-frame" aria-hidden="true">${cells.slice(i, i + 10).map((c) => `<i class="${c}"></i>`).join('')}</div>`);
    return `<div class="pz-frames">${out.join('')}</div>`;
  };
  const smallHole = () => G.pz.pieces[G.target].W < 38; // a ten-frame doesn't fit in a narrow hole: it goes on the card
  function panel() {
    if (G.mode === 'build' && G.earn >= 0) return earned();
    const p = G.prob;
    if (G.mode === 'find') {
      $('#pzpanel').innerHTML = progHtml() + `<div class="pz-q"><div class="pz-lead">Which piece fits the hole?</div>${sayBtn}</div>` +
        (p.t === 'count' && smallHole() ? frames(p) : '') + '<div id="pzhint"></div><div class="pz-tray" id="pztray"></div><p class="pz-tip">Drag a piece into the hole, or just tap it.</p>';
      hole();
      tray();
      return;
    }
    $('#pzpanel').innerHTML = progHtml() +
      `<div class="pz-q">${p.t === 'count' ? '<div class="pz-lead">How many dots?</div>' : `<div class="pz-eq">${p.eq} = ?</div>`}${sayBtn}</div>` +
      (p.t === 'count' ? frames(p) : '') + '<div id="pzhint"></div>' +
      `<div class="pz-answers">${p.opts.map((v) => `<button class="pz-ans" data-act="pzAns" data-arg="${v}">${v}</button>`).join('')}</div>` +
      (G.mode === 'hide' ? `<button class="pz-guess" data-act="pzGuess"${G.locked ? ' disabled' : ''}>🙋 I know who it is!</button>` : '');
  }
  function hint() {
    const p = G.prob, h = $('#pzhint');
    if (!h) return;
    const text = p.t === 'count' ? 'Touch each dot and count.' : p.t === 'add' ? 'Count all the dots together!' : 'Count the dots that are left!';
    h.innerHTML = `<div class="pz-hint">${p.t === 'count' ? '' : frames(p)}<p>💡 ${text}</p></div>`;
  }

  // One problem is recorded once, when it is finally solved: right on the first try, or not (with the first wrong answer).
  function solved() {
    const first = G.tries === 0;
    K().record(G.prob, first, G.given);
    K().addXp(first ? 10 : 5);
    if (first) K().addGems(SH.REWARD.right);
    MQ.store.save();
  }
  function missed(v) {
    G.tries++;
    if (G.given === undefined) G.given = v;
    MQ.sfx('wrong');
    if (G.tries === 1) { hint(); speak(G.mode === 'find' ? 'Oops! That one does not fit. Try again.' : 'Oops! Try again.'); return false; }
    speak(G.mode === 'find' ? `Look for ${G.prob.answer}.` : `It's ${G.prob.answer}. Tap ${G.prob.answer}.`);
    return true; // second miss: show the answer
  }
  const moveOn = (ms = 1000) => later(() => { G.busy = false; if (!G.left.length) finish(0); else next(); }, ms);

  function answer(arg, btn) {
    if (!G || G.busy || G.done) return;
    const v = +arg, p = G.prob;
    if (v !== p.answer) {
      btn.disabled = true;
      btn.classList.add('nope');
      if (missed(v)) { const c = $(`.pz-ans[data-arg="${p.answer}"]`); if (c) c.classList.add('show'); }
      return;
    }
    G.busy = true;
    btn.classList.add('right');
    document.querySelectorAll('.pz-ans, .pz-guess').forEach((b) => { b.disabled = true; });
    MQ.sfx('correct');
    solved();
    if (G.mode === 'build') {
      G.earn = takeRandom();
      later(() => { G.busy = false; earned(); }, 650);
      return;
    }
    if (G.mode === 'dots') drawSeg(G.left.shift());
    else if (G.mode === 'hide') blow(takeRandom());
    else flyIn(takeRandom(), btn);
    speak(U.pick(['Great job!', 'Yes!', 'You got it!', 'Awesome!', 'Super!']));
    moveOn();
  }

  function updateProg() {
    document.querySelectorAll('.pz-prog i').forEach((el, i) => el.classList.toggle('on', i < placed()));
  }
  const toUser = (x, y) => new DOMPoint(x, y).matrixTransform(G.svg.getScreenCTM().inverse());
  const toScreen = (x, y) => new DOMPoint(x, y).matrixTransform(G.svg.getScreenCTM());
  const screenBox = ([x, y, w, h]) => { const a = toScreen(x, y), b = toScreen(x + w, y + h); return { l: a.x, t: a.y, r: b.x, b: b.y }; };

  // 🧲 ⭐ a piece flies from the answer button into its place
  function flyIn(i, from) {
    const p = G.pz.pieces[i], g = $(`.pz-pc[data-i="${i}"]`, G.svg);
    g.classList.remove('off');
    const r = from.getBoundingClientRect(), u = toUser(r.left + r.width / 2, r.top + r.height / 2);
    if (!reduced()) {
      g.animate([
        { transform: `translate(${f1(u.x - p.cx)}px, ${f1(u.y - p.cy)}px) scale(.35) rotate(-30deg)`, opacity: 0.3 },
        { transform: 'translate(0px, 0px) scale(1.1) rotate(4deg)', opacity: 1, offset: 0.78 },
        { transform: 'none', opacity: 1 },
      ], { duration: 750, easing: 'cubic-bezier(.25,.8,.35,1)' });
    }
    later(() => { MQ.sfx('tap'); updateProg(); }, 620);
  }

  // ☁️ a cloud blows away; after the first one the child may guess
  function blow(i) {
    const c = $(`.pz-cloud[data-i="${i}"]`, G.svg);
    G.locked = false;
    MQ.sfx('chime');
    updateProg();
    if (!c) return;
    if (reduced()) return c.remove();
    c.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${U.pick([-8, 8])}px, -10px) scale(1.5)`, opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' }).onfinish = () => c.remove();
  }
  function chooser() {
    if (!G || G.busy || G.done || G.locked) return;
    // two other pictures with a different hero (a puppy is not hiding behind a puppy)
    const pool = G.daily ? SH.PICS.filter((p) => p.kind !== 'legend') : SH.pool(st());
    const others = U.shuffle(pool.filter((p) => p.id !== G.item.id && (!p.hero || p.hero !== G.item.hero))).slice(0, 2);
    $('#pzpanel').innerHTML = progHtml() + '<div class="pz-q"><div class="pz-lead">Who is hiding?</div></div>' +
      `<div class="pz-choices">${U.shuffle([G.item, ...others]).map((p) => `<button class="pz-choice" data-act="pzWho" data-arg="${p.id}">${p.kind === 'emoji' ? svgBox(SH.heroArt(p)) : MQ.art(p.id, { stage: p.stage })}<span>${esc(SH.picName(p))}</span></button>`).join('')}</div>` +
      '<button class="linkbtn pz-back" data-act="pzBack">← Back to the problem</button>';
    speak('Who is hiding?');
  }
  function guess(id, btn) {
    if (!G || G.busy || G.done) return;
    G.busy = true;
    if (id === G.item.id) {
      btn.classList.add('right');
      MQ.sfx('correct');
      const bonus = G.left.length * SH.REWARD.guess;
      G.left.splice(0).forEach((i, n) => setTimeout(() => blow(i), reduced() ? 0 : n * 90));
      later(() => { G.busy = false; finish(bonus); }, 500 + bonus * 90);
    } else {
      btn.classList.add('nope');
      MQ.sfx('wrong');
      G.locked = true; // one guess per cloud
      speak('Not this one! Solve more to see more.');
      later(() => { G.busy = false; panel(); }, 1300);
    }
  }

  // ✋ the problem in the hole, three pieces in the tray
  function hole() {
    const p = G.pz.pieces[G.target], pr = G.prob;
    let inner;
    if (pr.t === 'count' && !smallHole()) {
      const s = Math.min((p.W * 0.8) / 5, (p.H * 0.7) / 2);
      inner = `<rect x="${f1(p.cx - 2.6 * s)}" y="${f1(p.cy - 1.1 * s)}" width="${f1(5.2 * s)}" height="${f1(2.2 * s)}" rx="${f1(s * 0.3)}" fill="#ffffff" stroke="#22304f" stroke-width=".8"/>` +
        U.range(0, 9).map((i) => `<circle cx="${f1(p.cx - 2 * s + (i % 5) * s)}" cy="${f1(p.cy - s / 2 + Math.floor(i / 5) * s)}" r="${f1(s * 0.36)}" ${i < pr.n ? 'fill="#ff6b5b"' : 'fill="none" stroke="#c7d1e8" stroke-width=".5"'}/>`).join('');
    } else {
      const text = pr.t === 'count' ? '?' : pr.eq, fs = pr.t === 'count' ? p.T * 0.45 : Math.min((p.W * 0.8) / (text.length * 0.55), p.H * 0.38);
      inner = `<text class="pz-heq" x="${f1(p.cx)}" y="${f1(p.cy)}" font-size="${f1(fs)}">${text}</text>`;
    }
    const h = $('.pz-hole', G.svg);
    h.classList.remove('bad');
    h.innerHTML = `<path class="pz-holet" d="${p.d}"/>` + inner;
  }
  const TRAY = [['#ffd27a', '#c98f1f'], ['#8fe0d4', '#1f8f80'], ['#ffb9ae', '#d0604f']];
  function tray() {
    const p = G.pz.pieces[G.target], [, , bw, bh] = p.bb, box = $('#pztray');
    const avail = Math.max(240, box.clientWidth);
    const sc = Math.min(G.svg.getBoundingClientRect().width / 120, (avail - 40) / (3 * bw), 150 / bh);
    box.innerHTML = G.prob.opts.map((v, j) => `<div class="pz-tp" data-v="${v}" tabindex="0" role="button" aria-label="Piece ${v}" style="width:${f1(bw * sc)}px;height:${f1(bh * sc)}px">` +
      `<svg viewBox="${p.bb.join(' ')}" width="100%" height="100%" aria-hidden="true"><path d="${p.d}" fill="${TRAY[j][0]}" stroke="${TRAY[j][1]}" stroke-width="${f1(2.4 / sc)}" stroke-linejoin="round"/>` +
      `<text class="pz-tnum" x="${f1(p.cx)}" y="${f1(p.cy)}" font-size="${f1(p.T * 0.5)}">${v}</text></svg></div>`).join('');
    box.querySelectorAll('.pz-tp').forEach((el) => bindDrag(el, (el2, dx, dy, at) => (!at || near(at, screenBox(p.bb), 30) ? tryPiece(el2, dx, dy) : bounce(el2))));
  }
  function tryPiece(el, dx, dy) {
    if (G.busy || G.done) return;
    G.busy = true;
    const v = +el.dataset.v, p = G.pz.pieces[G.target];
    flyTo(el, dx, dy, p.bb, (nx, ny, sc) => {
      if (v !== G.prob.answer) {
        const h = $('.pz-hole', G.svg);
        h.classList.add('bad');
        bounce(el);
        el.classList.add('out');
        later(() => { h.classList.remove('bad'); G.busy = false; }, 500);
        if (missed(v)) { const c = $(`.pz-tp[data-v="${G.prob.answer}"]`); if (c) c.classList.add('show'); }
        return;
      }
      el.style.transition = 'transform .16s ease-in'; // the piece turns over and shows its picture
      el.style.transform = `translate(${nx}px, ${ny}px) scale(.02, ${sc})`;
      later(() => {
        el.style.visibility = 'hidden';
        $('.pz-hole', G.svg).innerHTML = '';
        const g = $(`.pz-pc[data-i="${p.i}"]`, G.svg);
        g.classList.remove('off');
        if (!reduced()) g.animate([{ transform: 'scaleX(0)' }, { transform: 'scale(1.08)', offset: 0.7 }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
        MQ.sfx('correct');
        solved();
        G.left.splice(G.left.indexOf(p.i), 1);
        updateProg();
        speak(U.pick(['Great job!', 'It fits!', 'You got it!', 'Awesome!']));
        moveOn();
      }, 170);
    });
  }

  // ✏️ the line to the next dot
  function drawSeg(i) {
    const pts = G.item.pts, n = pts.length, a = pts[i], b = pts[(i + 1) % n];
    $('.pz-segs', G.svg).insertAdjacentHTML('beforeend', `<line class="pz-seg" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" pathLength="1"/>`);
    const dots = G.svg.querySelectorAll('.pz-dot');
    dots[i].classList.remove('cur');
    dots[i].classList.add('past');
    if (G.left.length) dots[(i + 1) % n].classList.add('cur');
    later(() => MQ.sfx('tap'), 450);
    updateProg();
  }

  // 🏠 the shape just won waits in the tray: drag it into its outline (a tap puts it there).
  // A shape fits every empty outline of the same shape and size (either wheel, either tower).
  const twins = () => { const sig = SH.sig(G.item.parts[G.earn]); return [G.earn, ...G.left.filter((j) => SH.sig(G.item.parts[j]) === sig)]; };
  function earned() {
    const pt = G.item.parts[G.earn], bb = SH.partBB(pt, 2), big = Math.max(bb[2], bb[3]);
    $('#pzpanel').innerHTML = progHtml() + `<div class="pz-q"><div class="pz-lead">You got a ${pt.kind}!</div>${sayBtn}</div>` +
      '<div class="pz-tray" id="pztray"></div><p class="pz-tip">Drag it to its place in the picture, or just tap it.</p>';
    const sc = Math.max(64 / big, Math.min(G.svg.getBoundingClientRect().width / 120, 150 / big));
    $('#pztray').innerHTML = `<div class="pz-tp" tabindex="0" role="button" aria-label="${pt.kind}: put it in its place" style="width:${f1(bb[2] * sc)}px;height:${f1(bb[3] * sc)}px">` +
      `<svg viewBox="${bb.join(' ')}" width="100%" height="100%" aria-hidden="true">${SH.partShape(pt, `fill="${pt.col}" stroke="rgba(34,48,79,.55)" stroke-width="${f1(2 / sc)}" stroke-linejoin="round"`)}</svg></div>`;
    G.miss = 0;
    bindDrag($('#pztray .pz-tp'), (el, dx, dy, at) => {
      if (!at) return placePart(el, dx, dy);
      const hits = twins().map((j) => [j, screenBox(SH.partBB(G.item.parts[j]))]).filter(([, b]) => near(at, b, 30))
        .sort((a, b) => dist(at, a[1]) - dist(at, b[1]));
      if (!hits.length) return missPart(el);
      const j = hits[0][0];
      if (j !== G.earn) { G.left[G.left.indexOf(j)] = G.earn; G.earn = j; } // dropped on its twin's outline: it goes there
      placePart(el, dx, dy);
    });
    speak(`Yes! You got a ${pt.kind}! Where does it go?`);
  }
  const near = (at, h, m) => at.x > h.l - m && at.x < h.r + m && at.y > h.t - m && at.y < h.b + m;
  const dist = (at, h) => Math.hypot(at.x - (h.l + h.r) / 2, at.y - (h.t + h.b) / 2);
  // Drag with a finger or the mouse. onDrop(el, dx, dy, at): at is where it was dropped, or null for a tap (or Enter).
  function bindDrag(el, onDrop) {
    el.addEventListener('pointerdown', (e) => {
      if (!G || G.busy || G.done || e.button > 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine without */ }
      const sx = e.clientX, sy = e.clientY;
      let dx = 0, dy = 0, moved = false;
      el.classList.add('drag');
      const mv = (ev) => {
        dx = ev.clientX - sx; dy = ev.clientY - sy;
        if (Math.hypot(dx, dy) > 8) moved = true;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      };
      const up = (ev) => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        if (ev.type === 'pointercancel') { el.style.transform = ''; return; }
        onDrop(el, dx, dy, moved ? { x: ev.clientX, y: ev.clientY } : null);
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrop(el, 0, 0, null); } });
  }
  function bounce(el) {
    el.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)';
    el.style.transform = '';
  }
  // Fly a tray piece onto the board so its box lands on bb (board units) at the board's size; then done(nx, ny, scale).
  function flyTo(el, dx, dy, bb, done) {
    const r = el.getBoundingClientRect(), b = screenBox(bb);
    const nx = f1(dx + (b.l + b.r) / 2 - (r.left + r.width / 2)), ny = f1(dy + (b.t + b.b) / 2 - (r.top + r.height / 2)), sc = f1((b.r - b.l) / el.offsetWidth);
    el.style.transition = 'transform .32s cubic-bezier(.3,.9,.4,1)';
    el.style.transform = `translate(${nx}px, ${ny}px) scale(${sc})`;
    later(() => { el.style.transition = ''; done(nx, ny, sc); }, 330);
  }
  function placePart(el, dx, dy) {
    if (G.busy || G.done) return;
    G.busy = true;
    const i = G.earn, pt = G.item.parts[i];
    flyTo(el, dx, dy, SH.partBB(pt, 2), () => {
      el.style.visibility = 'hidden';
      G.svg.querySelectorAll('.pz-part.hint').forEach((g) => g.classList.remove('hint'));
      const g = $(`.pz-part[data-i="${i}"]`, G.svg);
      g.innerHTML = SH.partShape(pt, `class="pz-pfill" fill="${pt.col}"`);
      if (!reduced()) g.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
      MQ.sfx('tap');
      G.earn = -1;
      updateProg();
      speak(U.pick(['It fits!', 'Great job!', 'Perfect!']));
      moveOn(900);
    });
  }
  function missPart(el) {
    MQ.sfx('wrong');
    bounce(el);
    if (++G.miss >= 2) {
      twins().forEach((j) => { const g = $(`.pz-part[data-i="${j}"]`, G.svg); if (g) g.classList.add('hint'); });
      speak('It goes here. Look for the glowing outline!');
    } else speak(`Not there. Find the ${G.item.parts[G.earn].kind} outline!`);
  }

  // ---------------------------------------------------------------- finished
  function finish(bonus) {
    G.done = true;
    G.svg.classList.add('done');
    if (G.pic) { // the whole picture on top, not a copy: so a Legendary one can come alive
      G.svg.insertAdjacentHTML('beforeend', `<g class="pz-live">${SH.picArt(G.item)}${G.gold ? goldLayer() : ''}</g>`);
      G.svg.classList.add('alive');
    }
    const s = st(), r = SH.finish(s, G.key, { n: G.pz ? G.n : 0, gold: G.gold });
    let gems = SH.REWARD.done + (r.fresh ? SH.REWARD.fresh : 0);
    if (G.gold) gems *= 2;
    gems += bonus;
    const daily = G.daily && SH.finishDaily(s);
    if (daily) gems += SH.REWARD.daily;
    K().addGems(gems);
    MQ.store.save();
    let art, title, fact;
    if (G.pic) {
      // "You made Birthday Party!", "You made the Pegasus!", "It's the Royal Dragon!"
      const name = G.item.kind === 'emoji' ? SH.picName(G.item) : 'the ' + SH.picName(G.item).replace(/^The /, '');
      art = SH.picArt(G.item);
      title = G.mode === 'hide' ? `It's ${name}!` : `You made ${name}!`;
      fact = G.item.kind ? '' : creature(G.item).fact || '';
    } else if (G.mode === 'shape') { art = SH.shapeArt(G.item); title = `You made a ${G.item.name}!`; fact = G.item.fact; }
    else if (G.mode === 'build') { art = SH.figArt(G.item); title = `You built ${G.item.name}!`; fact = SH.shapeCount(G.item); }
    else { art = SH.dotArt(G.item); title = `It's a ${G.item.name}!`; fact = G.item.fact; }
    const more = r.stars && r.stars < 3 ? `<p class="pz-tip">Make it with ${r.stars === 1 ? 9 : 16} pieces or more for ${starStr(r.stars + 1)}</p>` : '';
    const P = G.pic && SH.pack(G.item.pack), taste = G.daily && P && !SH.owns(s, G.item);
    $('#pzpanel').innerHTML = `<div class="pz-win">${svgBox(art, 'pz-winart alive')}<b>${esc(title)}</b>${fact ? `<p>${esc(fact)}</p>` : ''}
      ${r.stars ? `<p class="pz-gems">${starStr(r.stars)}${r.more && !r.fresh ? ' New best!' : ''}</p>${more}` : ''}
      ${G.gold ? '<p class="pz-gems">✨ Golden puzzle: double crystals!</p>' : ''}
      ${bonus ? `<p class="pz-gems">You guessed early: +${bonus} 💎</p>` : ''}
      ${daily ? `<p class="pz-gems">🌞 Puzzle of the day: +${SH.REWARD.daily} 💎 · 🔥 ${SH.ensure(s).daily.streak} ${SH.ensure(s).daily.streak === 1 ? 'day' : 'days'} in a row</p>` : ''}
      <p class="pz-gems">+${gems} 💎${r.fresh ? ' · new in your gallery!' : ''}</p>
      ${taste ? `<p class="pz-tip">This picture is from ${P.icon} <b>${esc(P.name)}</b>: ${SH.packPics(P.id).length - 1} more like it for ${P.price} 💎.</p>` : ''}
      <div class="row"><button class="btn ghost" data-act="go" data-arg="shapes">All puzzles</button>${taste ? `<button class="btn ghost" data-act="pzPack" data-arg="${P.id}">See the pack</button>` : ''}${G.daily ? '' : '<button class="btn" data-act="pzNext">Next puzzle →</button>'}</div></div>`;
    MQ.sfx(G.legend ? 'fanfare' : 'reward');
    MQ.confetti(G.legend || G.gold ? 220 : 120, G.gold || G.legend ? { colors: ['#ffd23f', '#ffb547', '#fff3a6', '#ff8fe0'] } : {});
    later(() => speak(`Hooray! ${title}`), 300);
    setTimeout(() => { if (st() === s) K().checkBadges(); }, 1600); // even if the child has already left the puzzle
  }
  function nextKey() {
    if (G.from) { // made from a collection: the next picture of that collection
      const list = SH.packPics(G.from), k = list.findIndex((x) => x.id === G.item.id);
      return G.mode + ':' + list[(k + 1) % list.length].id;
    }
    if (G.pic || G.mode === 'dots') return G.mode; // the next one not made yet
    const list = G.mode === 'shape' ? SH.SHAPES : SH.FIGS, k = list.findIndex((x) => x.id === G.item.id);
    return G.mode + ':' + list[(k + 1) % list.length].id;
  }

  const A = {
    pzPlay: (a) => K().go('shapes:' + a), // through go(), so the back gesture returns to the album page
    pzNext: () => K().go(G ? 'shapes:' + nextKey() : 'shapes'),
    pzSize: (a) => { if (SH.GRID[a]) { SH.ensure(st()).n = +a; MQ.store.save(); } hub(); },
    pzAns: (a, el) => answer(a, el),
    pzSay: () => { if (G) MQ.speak(sayQ()); },
    pzGuess: () => chooser(),
    pzWho: (a, el) => guess(a, el),
    pzBack: () => { if (G && !G.done) panel(); },
    pzPack: (a) => K().go('shapes:pack:' + a),
    pzAs: (a) => { SH.ensure(st()).as = a === 'find' ? 'find' : 'snap'; MQ.store.save(); packPage(curPack); },
    pzBuy: (a) => buy(a),
    pzBuyYes: (a) => bought(a),
    pzView: (a) => view(a),
    pzReplay: (a) => { K().closeModal(); K().go('shapes:' + a); },
  };
  // show(): the album page; show('pack:ocean'), show('gallery'); show('shape:star'), show('snap'), show('daily') start a puzzle
  const show = (arg) => {
    if (!arg) return hub();
    if (arg === 'gallery') return gallery();
    if (arg.startsWith('pack:')) return packPage(arg.slice(5));
    return start(arg);
  };
  MQ.shapesUI = { show, actions: A, playing: () => G };
})();
