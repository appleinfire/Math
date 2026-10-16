// Shape Puzzles screens: the album page with the three kinds of puzzles, and the puzzle in play.
//   ⭐ Shape Puzzle  every right answer flies a jigsaw piece into a smiling shape
//   🏠 Build It      every right answer gives a shape; the child drags it into its outline
//   ✏️ Dot to Dot    every right answer draws the line to the next dot; the last one closes the surprise shape
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
    shape: { icon: '⭐', title: 'Shape Puzzle', blurb: 'Every right answer brings a puzzle piece. Make a shape!' },
    build: { icon: '🏠', title: 'Build It', blurb: 'Every right answer gives you a shape. Put it in its place!' },
    dots: { icon: '✏️', title: 'Dot to Dot', blurb: 'Every right answer draws a line to the next dot. What will it be?' },
  };
  let G = null; // the puzzle in play
  let lastDots = '';
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

  // ---------------------------------------------------------------- the album page
  function hub() {
    G = null;
    const s = st(), pz = SH.ensure(s), done = pz.done;
    const thumb = (key, art, label) => `<button class="pz-thumb ${done[key] ? 'got' : ''}" data-act="pzPlay" data-arg="${key}" aria-label="${esc(label)}${done[key] ? ' (done)' : ''}">${svgBox(art)}${done[key] ? '<i aria-hidden="true">✓</i>' : ''}</button>`;
    const card = (mode, body) => `<section class="pzcard pz-${mode}"><div class="pzc-h"><span class="pzc-i" aria-hidden="true">${MODES[mode].icon}</span><div><h2>${MODES[mode].title}</h2><p>${MODES[mode].blurb}</p></div></div>${body}</section>`;
    const found = SH.DOTS.map((d) => (done['dots:' + d.id] ? `<span class="pz-thumb got" role="img" aria-label="${d.name}">${svgBox(SH.dotArt(d))}<i aria-hidden="true">✓</i></span>` : '<span class="pz-thumb mystery" role="img" aria-label="not found yet">?</span>')).join('');
    K().render(header('🧩 Shape Puzzles', 'home') + `<main class="pzhub">
      <p class="pz-intro">Solve short problems to build shapes. Your album: <b>${SH.count(s)} of ${SH.total()}</b></p>
      ${card('shape', `<div class="pz-thumbs">${SH.SHAPES.map((x) => thumb('shape:' + x.id, SH.shapeArt(x), x.name)).join('')}</div>
        <div class="pz-size"><span>Pieces</span><div class="chips">${Object.keys(SH.GRID).map((n) => `<button class="chip ${+n === pz.n ? 'sel' : ''}" data-act="pzSize" data-arg="${n}" aria-pressed="${+n === pz.n}">${n}</button>`).join('')}</div></div>`)}
      ${card('build', `<div class="pz-thumbs">${SH.FIGS.map((f) => thumb('build:' + f.id, SH.figArt(f), f.name)).join('')}</div>`)}
      ${card('dots', `<div class="pz-thumbs">${found}</div><button class="btn" data-act="pzPlay" data-arg="dots">Start a surprise ✏️</button>`)}
    </main>`);
    K().setCur('shapes');
  }

  // ---------------------------------------------------------------- a puzzle
  function start(key) {
    const s = st();
    let mode = String(key).split(':')[0], item = null;
    if (mode === 'dots' && !String(key).includes(':')) item = SH.nextDots(s, lastDots);
    else { const f = SH.find(key); if (!f || !f.item) return hub(); mode = f.mode; item = f.item; }
    G = { mode, item, key: mode + ':' + item.id, prob: null, tries: 0, given: undefined, busy: false, done: false, earn: -1, miss: 0 };
    if (mode === 'shape') { G.pz = SH.cut(SH.ensure(s).n, item); G.left = G.pz.pieces.map((p) => p.i); }
    else if (mode === 'build') G.left = item.parts.map((_, i) => i);
    else { G.left = item.pts.map((_, i) => i); lastDots = item.id; }
    G.total = G.left.length;
    const M = MODES[mode];
    K().render(header(`${M.icon} ${M.title}`, 'shapes') + `<main class="pzplay pz-${mode}">
      <div class="pz-board" id="pzboard"></div><section class="pz-panel" id="pzpanel" aria-live="polite"></section></main>`, 'is-pz');
    drawBoard();
    next();
  }

  function drawBoard() {
    const el = $('#pzboard');
    let svg;
    if (G.mode === 'shape') {
      const k = 'pzb' + ++boards, sh = G.item, ps = G.pz.pieces;
      const clipped = (s) => `<g clip-path="url(#${k}sh)">${s}</g>`;
      svg = `<defs><g id="${k}p">${SH.shapeArt(sh)}</g><clipPath id="${k}sh"><path d="${sh.d}"/></clipPath>${ps.map((p) => `<clipPath id="${k}c${p.i}"><path d="${p.clip}"/></clipPath>`).join('')}</defs>` +
        clipped('<rect width="120" height="120" class="pz-bg"/>' + ps.map((p) => `<path class="pz-slot" d="${p.d}"/>`).join('')) +
        `<path class="pz-edge" d="${sh.d}"/>` +
        ps.map((p) => `<g class="pz-pc off" data-i="${p.i}" style="transform-origin:${f1(p.cx)}px ${f1(p.cy)}px">` + clipped(`<g clip-path="url(#${k}c${p.i})"><use href="#${k}p"/></g><path class="pz-seam" d="${p.d}"/>`) + '</g>').join('') +
        `<use class="pz-full" href="#${k}p"/>`;
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
    el.innerHTML = `<svg class="pz-svg" viewBox="0 0 120 120" role="img" aria-label="${esc(MODES[G.mode].title)}">${svg}</svg>`;
    G.svg = el.firstElementChild;
  }

  const placed = () => G.total - G.left.length - (G.earn >= 0 ? 1 : 0);
  const takeRandom = () => G.left.splice(Math.floor(Math.random() * G.left.length), 1)[0];
  const sayQ = () => (G.mode === 'build' && G.earn >= 0 ? `You got a ${G.item.parts[G.earn].kind}! Where does it go?` : G.prob ? G.prob.say : '');

  function next() {
    G.prob = SH.problem(st().grade, G.prob);
    G.tries = 0;
    G.given = undefined;
    panel();
    if (st().settings.readAloud) later(() => speak(G.prob.say), 250);
  }

  const progHtml = () => `<div class="pz-prog" role="img" aria-label="${placed()} of ${G.total} done">${U.range(1, G.total).map((i) => `<i class="${i <= placed() ? 'on' : ''}"></i>`).join('')}</div>`;
  const sayBtn = '<button class="pz-say" data-act="pzSay" aria-label="Read it to me">🔊</button>';
  const frames = (p) => {
    const cells = SH.cells(p, st().grade), out = [];
    for (let i = 0; i < cells.length; i += 10) out.push(`<div class="pz-frame" aria-hidden="true">${cells.slice(i, i + 10).map((c) => `<i class="${c}"></i>`).join('')}</div>`);
    return `<div class="pz-frames">${out.join('')}</div>`;
  };
  function panel() {
    if (G.mode === 'build' && G.earn >= 0) return earned();
    const p = G.prob;
    $('#pzpanel').innerHTML = progHtml() +
      `<div class="pz-q">${p.t === 'count' ? '<div class="pz-lead">How many dots?</div>' : `<div class="pz-eq">${p.eq} = ?</div>`}${sayBtn}</div>` +
      (p.t === 'count' ? frames(p) : '') + '<div id="pzhint"></div>' +
      `<div class="pz-answers">${p.opts.map((v) => `<button class="pz-ans" data-act="pzAns" data-arg="${v}">${v}</button>`).join('')}</div>`;
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

  function answer(arg, btn) {
    if (!G || G.busy || G.done) return;
    const v = +arg, p = G.prob;
    if (v !== p.answer) {
      G.tries++;
      if (G.given === undefined) G.given = v;
      btn.disabled = true;
      btn.classList.add('nope');
      MQ.sfx('wrong');
      if (G.tries === 1) { hint(); speak('Oops! Try again.'); }
      else { const c = $(`.pz-ans[data-arg="${p.answer}"]`); if (c) c.classList.add('show'); speak(`It's ${p.answer}. Tap ${p.answer}.`); }
      return;
    }
    G.busy = true;
    btn.classList.add('right');
    document.querySelectorAll('.pz-ans').forEach((b) => { b.disabled = true; });
    MQ.sfx('correct');
    solved();
    if (G.mode === 'build') {
      G.earn = takeRandom();
      later(() => { G.busy = false; earned(); }, 650);
      return;
    }
    if (G.mode === 'shape') flyIn(takeRandom(), btn);
    else drawSeg(G.left.shift());
    speak(U.pick(['Great job!', 'Yes!', 'You got it!', 'Awesome!', 'Super!']));
    later(() => { G.busy = false; if (!G.left.length) finish(); else next(); }, 1000);
  }

  function updateProg() {
    document.querySelectorAll('.pz-prog i').forEach((el, i) => el.classList.toggle('on', i < placed()));
  }
  const toUser = (x, y) => new DOMPoint(x, y).matrixTransform(G.svg.getScreenCTM().inverse());
  const toScreen = (x, y) => new DOMPoint(x, y).matrixTransform(G.svg.getScreenCTM());

  // ⭐ a piece flies from the answer button into its place
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

  // 🏠 the shape just won waits in the tray: drag it into its outline (a tap puts it there)
  function earned() {
    const pt = G.item.parts[G.earn], bb = SH.partBB(pt, 2), big = Math.max(bb[2], bb[3]);
    $('#pzpanel').innerHTML = progHtml() + `<div class="pz-q"><div class="pz-lead">You got a ${pt.kind}!</div>${sayBtn}</div>` +
      '<div class="pz-tray" id="pztray"></div><p class="pz-tip">Drag it to its place in the picture, or just tap it.</p>';
    const sc = Math.max(64 / big, Math.min(G.svg.getBoundingClientRect().width / 120, 150 / big));
    $('#pztray').innerHTML = `<div class="pz-tp" tabindex="0" role="button" aria-label="${pt.kind}: put it in its place" style="width:${f1(bb[2] * sc)}px;height:${f1(bb[3] * sc)}px">` +
      `<svg viewBox="${bb.join(' ')}" width="100%" height="100%" aria-hidden="true">${SH.partShape(pt, `fill="${pt.col}" stroke="rgba(34,48,79,.55)" stroke-width="${f1(2 / sc)}" stroke-linejoin="round"`)}</svg></div>`;
    G.miss = 0;
    bindDrag($('#pztray .pz-tp'), partBox, (el, dx, dy, hit) => (hit ? placePart(el, dx, dy) : missPart(el)));
    speak(`Yes! You got a ${pt.kind}! Where does it go?`);
  }
  function partBox() {
    const [x, y, w, h] = SH.partBB(G.item.parts[G.earn]), a = toScreen(x, y), b = toScreen(x + w, y + h);
    return { l: a.x, t: a.y, r: b.x, b: b.y };
  }
  const near = (x, y, h, m) => x > h.l - m && x < h.r + m && y > h.t - m && y < h.b + m;
  // Drag with a finger or the mouse. onDrop(el, dx, dy, hit): hit is a tap, or a drop near the target box.
  function bindDrag(el, box, onDrop) {
    el.addEventListener('pointerdown', (e) => {
      if (!G || G.busy || G.done || e.button > 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine without */ }
      const sx = e.clientX, sy = e.clientY, target = box();
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
        onDrop(el, dx, dy, !moved || near(ev.clientX, ev.clientY, target, 30));
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrop(el, 0, 0, true); } });
  }
  function placePart(el, dx, dy) {
    if (G.busy || G.done) return;
    G.busy = true;
    const i = G.earn, pt = G.item.parts[i], [bx, by, bw, bh] = SH.partBB(pt, 2);
    // fly onto the outline at the outline's size
    const r = el.getBoundingClientRect(), a = toScreen(bx, by), b = toScreen(bx + bw, by + bh);
    const nx = f1(dx + (a.x + b.x) / 2 - (r.left + r.width / 2)), ny = f1(dy + (a.y + b.y) / 2 - (r.top + r.height / 2));
    el.style.transition = 'transform .32s cubic-bezier(.3,.9,.4,1)';
    el.style.transform = `translate(${nx}px, ${ny}px) scale(${f1((b.x - a.x) / el.offsetWidth)})`;
    later(() => {
      el.style.visibility = 'hidden';
      const g = $(`.pz-part[data-i="${i}"]`, G.svg);
      g.classList.remove('hint');
      g.innerHTML = SH.partShape(pt, `class="pz-pfill" fill="${pt.col}"`);
      if (!reduced()) g.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
      MQ.sfx('tap');
      G.earn = -1;
      updateProg();
      speak(U.pick(['It fits!', 'Great job!', 'Perfect!']));
      later(() => { G.busy = false; if (!G.left.length) finish(); else next(); }, 900);
    }, 340);
  }
  function missPart(el) {
    MQ.sfx('wrong');
    el.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)';
    el.style.transform = '';
    if (++G.miss >= 2) {
      const g = $(`.pz-part[data-i="${G.earn}"]`, G.svg);
      if (g) g.classList.add('hint');
      speak('It goes here. Look for the glowing outline!');
    } else speak(`Not there. Find the ${G.item.parts[G.earn].kind} outline!`);
  }

  // ---------------------------------------------------------------- finished
  function finish() {
    G.done = true;
    G.svg.classList.add('done');
    const s = st(), fresh = SH.finish(s, G.key), gems = SH.REWARD.done + (fresh ? SH.REWARD.fresh : 0);
    K().addGems(gems);
    MQ.store.save();
    let art, title, fact;
    if (G.mode === 'shape') { art = SH.shapeArt(G.item); title = `You made a ${G.item.name}!`; fact = G.item.fact; }
    else if (G.mode === 'build') { art = SH.figArt(G.item); title = `You built ${G.item.name}!`; fact = SH.shapeCount(G.item); }
    else { art = SH.dotArt(G.item); title = `It's a ${G.item.name}!`; fact = G.item.fact; }
    $('#pzpanel').innerHTML = `<div class="pz-win">${svgBox(art, 'pz-winart')}<b>${esc(title)}</b><p>${esc(fact)}</p>
      <p class="pz-gems">+${gems} 💎${fresh ? ' · new in your album!' : ''}</p>
      <div class="row"><button class="btn ghost" data-act="go" data-arg="shapes">All puzzles</button><button class="btn" data-act="pzNext">Next puzzle →</button></div></div>`;
    MQ.sfx('reward');
    MQ.confetti(120);
    later(() => speak(`Hooray! ${title} ${fact}`), 300);
    setTimeout(() => { if (st() === s) K().checkBadges(); }, 1600); // even if the child has already left the puzzle
  }
  function nextKey() {
    const list = G.mode === 'shape' ? SH.SHAPES : G.mode === 'build' ? SH.FIGS : null;
    if (!list) return 'dots';
    const k = list.findIndex((x) => x.id === G.item.id);
    return G.mode + ':' + list[(k + 1) % list.length].id;
  }

  const A = {
    pzPlay: (a) => K().go('shapes:' + a), // through go(), so the back gesture returns to the album page
    pzNext: () => K().go(G ? 'shapes:' + nextKey() : 'shapes'),
    pzSize: (a) => { if (SH.GRID[a]) { SH.ensure(st()).n = +a; MQ.store.save(); } hub(); },
    pzAns: (a, el) => answer(a, el),
    pzSay: () => { if (G) MQ.speak(sayQ()); },
  };
  // show(): the album page; show('shape:star') starts that puzzle (used by links and the browser test)
  const show = (arg) => (arg ? start(arg) : hub());
  MQ.shapesUI = { show, actions: A, playing: () => G };
})();
