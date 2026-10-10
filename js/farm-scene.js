// Sunny Farm pictures: the farm scene (sky, garden beds, pens with animals walking around, a yard with the stand and
// decorations), the market stall above each customer, and small animations (things flying to the basket, coins
// flying to the money, a night passing). Made of emoji, CSS and a few inline SVGs: no image files.
// Everything moving is turned off when the device asks for reduced motion.
(function () {
  const MQ = globalThis.MQ, F = MQ.farm, U = MQ.U;
  const esc = U.esc;
  const S = {};
  const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  S.reduced = reduced;

  // ---------------------------------------------------------------- sprites without a good emoji
  const SVG = {
    windmill: `<svg class="sp windmill" viewBox="0 0 60 92" aria-hidden="true"><polygon points="22,40 38,40 45,90 15,90" fill="#f1e4c6" stroke="#8a6b46" stroke-width="2"/><rect x="25" y="70" width="10" height="20" rx="4" fill="#8a6b46"/><rect x="26" y="52" width="8" height="8" fill="#9fd3f0" stroke="#8a6b46" stroke-width="1.5"/><g class="blades">${[0, 90, 180, 270].map((r) => `<g transform="rotate(${r} 30 40)"><rect x="28.5" y="4" width="3" height="36" fill="#7a5532"/><rect x="31.5" y="6" width="9" height="26" fill="#fffaf0" stroke="#7a5532" stroke-width="1.2"/></g>`).join('')}</g><circle cx="30" cy="40" r="3.5" fill="#5b3d22"/></svg>`,
    barn: `<svg class="sp barn" viewBox="0 0 80 66" aria-hidden="true"><polygon points="2,28 40,3 78,28" fill="#8e2b23"/><rect x="8" y="26" width="64" height="38" fill="#cf4330" stroke="#8e2b23" stroke-width="2"/><rect x="28" y="36" width="24" height="28" fill="#fff4e6" stroke="#8e2b23" stroke-width="2"/><path d="M28 36 L52 64 M52 36 L28 64" stroke="#8e2b23" stroke-width="2.5"/><rect x="34" y="13" width="12" height="9" fill="#fff4e6" stroke="#8e2b23" stroke-width="2"/></svg>`,
    hive: `<svg class="sp hive" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="31" rx="15" ry="7" fill="#e9a425"/><ellipse cx="20" cy="22" rx="12.5" ry="6.5" fill="#f2b83a"/><ellipse cx="20" cy="14" rx="9" ry="5.5" fill="#f7c95a"/><ellipse cx="20" cy="7.5" rx="5" ry="4" fill="#fad77a"/><ellipse cx="20" cy="31" rx="4" ry="3.5" fill="#6b4210"/></svg>`,
  };
  // The shop and the scene use these pictures for the windmill and the barn.
  S.icon = (id, e) => (SVG[id] ? `<span class="spi">${SVG[id]}</span>` : e);

  // Animals that are drawn from the side (they turn around when they walk the other way).
  const SIDE = new Set(['🐔', '🐐', '🐑', '🐄', '🦆', '🐖', '🦙', '🐎', '🐓']);
  const WALK = { pony: '🐎' }; // a whole pony instead of the 🐴 head
  // Where each decoration stands: sky (floats), hill (on the horizon, left %), yard (in front, left %).
  const SPOTS = {
    rainbow: ['sky'], balloon: ['sky'], birdhouse: ['sky'],
    tree: ['hill', 3], greenhouse: ['hill', 24], barn: ['hill', 58], cat: ['hill', 66], windmill: ['hill', 82],
    fence: ['fence'], scarecrow: ['bed'],
    flowers: ['yard', 30], pond: ['yard', 46], fountain: ['yard', 64], golden: ['yard', 78], dog: ['run'], tractor: ['drive'],
  };

  // ---------------------------------------------------------------- the farm scene
  function bedHtml(b, i) {
    const s = F.cropStage(b);
    if (s === 'empty') return `<button class="fbed soil empty" data-act="fBed" data-arg="${i}" aria-label="Empty garden bed: plant seeds"><span class="plus">＋</span><span class="flabel">Plant</span></button>`;
    const c = F.CROPS[b.c], it = F.ITEMS[b.c], left = c.days - b.g;
    const n = Math.min(c.yield, 4);
    const sprite = s === 'ready' ? it.e : s === 'seed' ? '🌱' : '🌿';
    const plants = Array.from({ length: s === 'ready' ? n : 3 }, (_, k) => `<i style="--k:${k}">${sprite}</i>`).join('');
    const label = s === 'ready' ? `Pick ${c.yield}!` : `${left} ${left === 1 ? 'day' : 'days'}`;
    return `<button class="fbed soil ${s}" data-act="fBed" data-arg="${i}" aria-label="${esc(it.many)}: ${s === 'ready' ? 'ripe, tap to pick' : `ready in ${label}`}"><span class="plants">${plants}</span><span class="flabel">${s === 'ready' ? label : it.e + ' ' + label}</span></button>`;
  }
  function penHtml(p, i) {
    if (!p.a) return `<button class="fpen pasture empty" data-act="go" data-arg="farm:shop" aria-label="Empty pen: buy an animal in the shop"><span class="plus">＋</span><span class="flabel">Buy an animal</span></button>`;
    const a = F.ANIMALS[p.a], sg = F.animalStage(p), it = F.ITEMS[a.item];
    const state = p.ready ? 'ready' : p.fed ? 'fed' : 'hungry';
    const age = ['Baby', 'Young', 'Grown-up'][sg];
    const chip = p.ready ? `${it.e}×${p.ready}` : p.fed ? '❤️' : `🌾 ${a.eat}`;
    const loot = p.ready ? `<span class="loot">${Array.from({ length: Math.min(p.ready, 5) }, (_, k) => `<i style="--k:${k}">${it.e}</i>`).join('')}</span>` : '';
    let who;
    if (p.a === 'bees') {
      who = `<span class="hivebox">${SVG.hive}</span>${Array.from({ length: sg + 1 }, (_, k) => `<span class="bee" style="--k:${k}">🐝</span>`).join('')}`;
    } else {
      const e = sg === 0 ? a.baby : WALK[p.a] || a.e;
      const t = 7 + ((i * 3) % 5); // each animal walks at its own pace
      who = `<span class="walker ${SIDE.has(e) ? 'side' : ''}" style="--t:${t}s;--dl:-${(i * 2.3) % t}s"><span class="bob">${e}</span></span>`;
    }
    const label = `${a.name}, ${age.toLowerCase()}: ${p.ready ? `${p.ready} ${it.many} to collect` : p.fed ? 'fed' : `hungry, eats ${a.eat} feed`}`;
    return `<button class="fpen pasture ${state} s${sg} a-${p.a}" data-act="fPen" data-arg="${i}" aria-label="${esc(label)}">${who}${loot}<span class="trough ${p.fed ? 'full' : ''}"></span><span class="pchip">${chip}</span><span class="flabel">${age}</span></button>`;
  }
  S.farm = (fm, grade) => {
    const has = (id) => !!fm.owned[id];
    const at = (zone) => Object.keys(fm.owned).filter((id) => F.DECOR[id] && (SPOTS[id] || [])[0] === zone);
    const sky = [];
    if (has('rainbow')) sky.push('<span class="rainbow">🌈</span>');
    if (has('balloon')) sky.push('<span class="balloon">🎈</span>');
    if (has('birdhouse')) sky.push('<span class="bird">🐦</span>');
    const hill = at('hill').map((id) => `<span class="deco d-${id}" style="left:${SPOTS[id][1]}%" title="${esc(F.DECOR[id].name)}">${S.icon(id, F.DECOR[id].e)}</span>`).join('');
    const yard = at('yard').map((id) => `<span class="deco d-${id}" style="left:${SPOTS[id][1]}%" title="${esc(F.DECOR[id].name)}">${F.DECOR[id].e}</span>`).join('');
    const stand = F.STANDS[fm.stand], n = F.basketCount(fm);
    return `<section class="scene" aria-label="Your farm">
      <div class="sky">
        <span class="sun">☀️</span><span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>${sky.join('')}
        <div class="hills"></div>${hill}${has('fence') ? '<div class="hfence"></div>' : ''}
      </div>
      <div class="land">
        <div class="beds">${fm.beds.map(bedHtml).join('')}${has('scarecrow') ? '<span class="scarecrow" title="Scarecrow">🧑‍🌾</span>' : ''}</div>
        <div class="pens">${fm.pens.map(penHtml).join('')}</div>
        <div class="yard">
          <button class="ystand st${fm.stand}" data-act="fMarket" aria-label="${esc(stand.name)}: open the stand (${n} to sell)"><span class="awn"></span><span class="ye">${stand.e}</span>${n ? `<b class="badge">${n}</b>` : ''}</button>
          ${yard}${has('dog') ? '<span class="dog">🐕</span>' : ''}${has('tractor') ? '<span class="tractor">🚜</span>' : ''}
        </div>
      </div>
    </section>`;
  };

  // ---------------------------------------------------------------- the stall above a customer
  // mode: market (your stand), jobs (the big market), pay (the farm shop, where the child is the buyer).
  S.stall = ({ mode, stand = 0, seller, shopper, goods = '', vip = false }) => `<div class="stall st${stand} m-${mode} ${vip ? 'vip' : ''}" aria-hidden="true">
      <div class="awning"></div>
      <div class="stall-in">
        <span class="seller">${seller}</span>
        <div class="counter"><span class="goods" id="goods">${goods}</span><span class="cashbox" id="cashbox">💰</span></div>
        <span class="shopper ${vip ? 'vip' : ''}" id="shopper"><span>${shopper}</span></span>
      </div>
    </div>`;
  S.goods = (sale) => Object.entries(sale || {}).map(([id, n]) => Array.from({ length: Math.min(n, 6) }, () => `<i>${F.ITEMS[id].e}</i>`).join('')).join('');

  // ---------------------------------------------------------------- animations
  const box = (x) => (!x ? null : x.getBoundingClientRect ? x.getBoundingClientRect() : x);
  // Something flies from one place to another along an arc (a harvested carrot to the basket, coins to the money).
  S.fly = (html, from, to, { delay = 0, dur = 650, size = '1.9rem', land } = {}) => {
    const a = box(from), b = box(typeof to === 'string' ? document.querySelector(to) : to);
    if (reduced() || !a || !b || !document.body.animate) { if (land) land(); return; }
    const el = document.createElement('div');
    el.className = 'flyer';
    el.style.fontSize = size;
    el.innerHTML = html;
    el.style.left = a.left + a.width / 2 + 'px';
    el.style.top = a.top + a.height / 2 + 'px';
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = el.animate([
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1, offset: 0.1 },
      { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 - 70}px)) scale(1.25)`, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`, opacity: 0.9 },
    ], { duration: dur, delay, easing: 'ease-in-out', fill: 'both' });
    anim.onfinish = () => { el.remove(); if (land) land(); };
  };
  // A few things fly one after another.
  S.flyMany = (html, n, from, to, opts = {}) => { for (let k = 0; k < n; k++) S.fly(html, from, to, Object.assign({}, opts, { delay: (opts.delay || 0) + k * 110 })); };
  // Hearts (or anything) float up from a spot.
  S.burst = (el, html = '❤️', n = 3) => {
    const r = box(el);
    if (reduced() || !r || !document.body.animate) return;
    for (let k = 0; k < n; k++) {
      const d = document.createElement('div');
      d.className = 'flyer';
      d.innerHTML = html;
      d.style.left = r.left + r.width * (0.3 + 0.2 * k) + 'px';
      d.style.top = r.top + r.height * 0.4 + 'px';
      document.body.appendChild(d);
      d.animate([{ transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 }, { transform: 'translate(-50%, -20px) scale(1)', opacity: 1, offset: 0.25 }, { transform: `translate(calc(-50% + ${(k - 1) * 14}px), -70px) scale(1.1)`, opacity: 0 }], { duration: 900, delay: k * 120, easing: 'ease-out', fill: 'both' }).onfinish = () => d.remove();
    }
  };
  // A number counts up (or down) to its new value: the money pill after a sale.
  S.roll = (el, from, to, show, dur = 650) => {
    if (!el) return;
    if (reduced() || from === to || typeof requestAnimationFrame === 'undefined') { el.textContent = show(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = show(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // The night passes: the screen goes dark with a moon and stars, then the sun comes up.
  // dark() runs in the middle (redraw the farm there), done() at the end.
  S.night = (dark, done) => {
    if (reduced() || !document.body.animate) { dark(); done(); return; }
    const o = document.createElement('div');
    o.className = 'nightfx';
    o.innerHTML = '<span class="moon">🌙</span>' + Array.from({ length: 14 }, (_, k) => `<i style="left:${(k * 37) % 100}%;top:${(k * 23) % 60 + 5}%;animation-delay:${(k % 5) * 0.15}s">✦</i>`).join('') + '<span class="zzz">Z z z</span><span class="sunup">☀️</span>';
    document.body.appendChild(o);
    o.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 2400, easing: 'ease-in-out', fill: 'both' }).onfinish = () => { o.remove(); done(); };
    setTimeout(dark, 900);
  };

  MQ.farmScene = S;
})();
