// Sunny Farm screens: the farm, the shop, the stand (customers bring money problems), odd jobs and paying with coins.
// Rules and problems are in js/farm.js. The app shell (js/app.js) lends render, toast, modal and routing via MQ.app.kit.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, F = MQ.farm, V = MQ.V;
  const esc = U.esc;
  const K = () => MQ.app.kit;
  const st = () => K().state();
  const fm = () => F.ensure(st());
  const grade = () => st().grade;
  const fmt = (c) => F.fmt(c, grade());
  const $ = (sel) => document.querySelector(sel);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const save = () => { fm().t = Date.now(); MQ.store.save(); };
  let fs = null; // the stand, odd jobs or a payment in progress
  let tab = 'animals'; // shop tab
  let autoNext = null;

  const moneyPill = () => `<span class="pill money" aria-label="farm money">💰 <b id="fmoney">${fmt(fm().money)}</b></span>`;
  function header(title, back = 'home') {
    return `<header class="bar"><button class="iconbtn" data-act="go" data-arg="${back}" aria-label="Back">←</button><h1>${title}</h1>${moneyPill()}</header>`;
  }
  function bumpMoney() {
    const m = $('#fmoney');
    if (!m) return;
    m.textContent = fmt(fm().money);
    m.parentNode.classList.remove('bump');
    void m.offsetWidth;
    m.parentNode.classList.add('bump');
  }
  // XP for farm work; a new farm level shows what it opened.
  function xp(n) {
    const ups = F.addXp(fm(), n, grade());
    if (ups.length) levelUp(ups);
    return ups;
  }
  function levelUp(ups) {
    const L = ups[ups.length - 1];
    const got = ups.flatMap((x) => F.unlocksAt(x, grade()));
    const gift = U.sum(ups.map((x) => F.gift(x, grade())));
    MQ.sfx('streak');
    MQ.confetti(90);
    K().modal(`<div class="bigemoji">🎉</div><div class="mtitle">Farm level ${L}!</div>
      <p>Gift: <b>+${fmt(gift)}</b></p>
      ${got.length ? `<p class="muted">New on your farm:</p><ul class="funlocks">${got.map((x) => `<li><span>${x.e}</span> ${esc(x.name)}</li>`).join('')}</ul>` : `<p class="muted">Keep going: something new opens at level ${nextUnlockLevel(L)}.</p>`}
      <div class="row"><button class="btn" data-act="closeModal">Yay!</button></div>`);
    if (st().settings.voice !== false) MQ.speak(`Farm level ${L}!`);
    K().checkBadges();
  }
  const nextUnlockLevel = (L) => { for (let x = L + 1; x < L + 60; x++) if (F.unlocksAt(x, grade()).length) return x; return L + 1; };

  // ---------------------------------------------------------------- the farm
  function tipLine() { return `<div class="buddy small"><span class="buddy-e">${st().companion}</span><div class="bubble">${esc(st().buddyName)}: ${tipText()}</div></div>`; }
  function tipText() {
    const f = fm();
    const cheapest = Math.min(...Object.entries(F.CROPS).filter(([, c]) => c.lv <= F.level(f.xp).level).map(([id]) => F.seedPrice(id, grade())));
    const hungry = f.pens.filter((p) => p.a && !p.fed);
    let t;
    if (f.beds.some((b) => F.cropStage(b) === 'ready')) t = 'Your crops are ripe! Tap them to pick them.';
    else if (f.pens.some((p) => p.ready)) t = 'Your animals made something! Tap them to collect it.';
    else if (hungry.length && f.feed >= F.ANIMALS[hungry[0].a].eat) t = 'Feed your animals before bed, so they grow and make things to sell.';
    else if (hungry.length) t = 'Out of feed! Buy feed 🌾 in the shop.';
    else if (F.basketCount(f)) t = 'Your basket is full of good things. Open the stand and sell them!';
    else if (f.beds.some((b) => !b.c) && f.money >= cheapest) t = 'An empty garden bed! Tap it to plant seeds.';
    else if (f.beds.some((b) => b.c) || f.pens.some((p) => p.a && p.fed)) t = 'All done for today. Tap 🌙 Sleep to start a new day.';
    else t = 'Need money? Do odd jobs at the big market.';
    return t;
  }
  function goalBar() {
    const g = F.goalItem(fm(), grade());
    if (!g) return '';
    const have = Math.min(fm().money, g.price), pctv = g.price ? Math.round((have / g.price) * 100) : 100;
    const left = g.price - fm().money;
    return `<button class="fgoal" data-act="go" data-arg="farm:shop" aria-label="Saving goal">
      <span class="fgoal-e">${g.e}</span><span class="fgoal-t"><b>Saving for: ${esc(g.name)}</b>
      <span class="fbar"><span style="width:${pctv}%"></span></span>
      <small>${left > 0 ? `${fmt(fm().money)} of ${fmt(g.price)} · ${fmt(left)} to go` : g.locked ? `You have enough! It opens at farm level ${g.lv}.` : 'You have enough! Buy it in the shop 🎉'}${left > 0 && g.locked ? ` · opens at level ${g.lv}` : ''}</small></span></button>`;
  }
  function bedTile(b, i) {
    const s = F.cropStage(b);
    if (s === 'empty') return `<button class="fbed empty" data-act="fBed" data-arg="${i}"><span class="fe">🟫</span><small>Plant</small></button>`;
    const c = F.CROPS[b.c], it = F.ITEMS[b.c];
    if (s === 'ready') return `<button class="fbed ready" data-act="fBed" data-arg="${i}"><span class="fe">${it.e}</span><small>Pick ${c.yield}!</small></button>`;
    const left = c.days - b.g;
    return `<button class="fbed" data-act="fBed" data-arg="${i}"><span class="fe">${s === 'seed' ? '🌱' : '🌿'}</span><small>${it.e} in ${left} ${left === 1 ? 'day' : 'days'}</small></button>`;
  }
  function penTile(p, i) {
    if (!p.a) return `<button class="fpen empty" data-act="go" data-arg="farm:shop"><span class="fe">🏡</span><small>Empty pen</small></button>`;
    const a = F.ANIMALS[p.a], sg = F.animalStage(p), it = F.ITEMS[a.item];
    const look = sg === 0 ? a.baby : a.e;
    const age = ['Baby', 'Young', 'Grown-up'][sg];
    const status = p.ready ? `<b>${it.e} × ${p.ready}</b> Collect!` : p.fed ? 'Fed ✓' : `Hungry · ${a.eat} 🌾`;
    const growNote = sg < 2 ? ` · grown in ${a.grow[1] - p.g} fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}` : '';
    return `<button class="fpen ${p.ready ? 'ready' : p.fed ? 'fed' : 'hungry'} s${sg}" data-act="fPen" data-arg="${i}" title="${age}${growNote}"><span class="fe">${look}</span><small>${status}</small><i class="fage">${age}</i></button>`;
  }
  function main() {
    const f = fm(), g = grade();
    const lv = F.level(f.xp), pctv = Math.round(((f.xp - lv.from) / (lv.to - lv.from)) * 100);
    const tiers = F.tiers(g), tier = tiers[Math.min(f.tier, tiers.length) - 1];
    const n = F.basketCount(f);
    const basket = Object.entries(f.basket).filter(([, c]) => c > 0).map(([id, c]) => `<span class="fchip">${F.ITEMS[id].e} ${c} <small>× ${fmt(F.price(id, g))}</small></span>`).join('') || '<span class="muted">Empty. Pick crops and collect from animals.</span>';
    const decor = Object.keys(f.owned).filter((id) => F.DECOR[id]).map((id) => `<span title="${esc(F.DECOR[id].name)}">${F.DECOR[id].e}</span>`).join('');
    const hungry = f.pens.some((p) => p.a && !p.fed), ready = f.pens.some((p) => p.ready);
    K().render(header('🌻 Sunny Farm') + `<main class="farm">
      <section class="flevel">
        <div class="flv"><b>Farm level ${lv.level}</b><span>Day ${f.day} · ${F.STANDS[f.stand].e} ${esc(F.STANDS[f.stand].name)}</span></div>
        <div class="fbar xp" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pctv}%"></span></div>
        <small class="muted">${f.xp - lv.from} / ${lv.to - lv.from} XP to level ${lv.level + 1} · Money problems: ${tier.ahead ? '⭐ ' : ''}${esc(tier.name)}</small>
      </section>
      ${goalBar()}
      ${tipLine()}
      <button class="btn big fstand" data-act="fMarket" ${n ? '' : 'disabled'}>🏪 Open the stand ${n ? `· ${n} to sell` : '· basket is empty'}</button>
      <div class="fbtns">
        <button class="tile" data-act="go" data-arg="farm:shop"><span class="ti">🛒</span><b>Shop</b><small>Animals, feed, more</small></button>
        <button class="tile" data-act="fJobs"><span class="ti">🧹</span><b>Odd jobs</b><small>Earn at the big market</small></button>
        <button class="tile" data-act="fSleep"><span class="ti">🌙</span><b>Sleep</b><small>Start day ${f.day + 1}</small></button>
      </div>
      <h2>🌱 Garden</h2>
      <div class="fgrid">${f.beds.map(bedTile).join('')}</div>
      <div class="fhead"><h2>🐾 Animals</h2><span class="pill">🌾 ${f.feed} feed</span></div>
      <div class="fgrid">${f.pens.map(penTile).join('')}</div>
      <div class="row left">${hungry ? '<button class="btn ghost" data-act="fFeedAll">🌾 Feed all</button>' : ''}${ready ? '<button class="btn ghost" data-act="fCollectAll">🧺 Collect all</button>' : ''}</div>
      <h2>🧺 Basket</h2>
      <div class="fbasket">${basket}</div>
      ${decor ? `<h2>✨ My farm</h2><div class="fdecor">${decor}</div>` : ''}
      <p class="muted center">Sold ${f.stats.sold} things · earned ${fmt(f.stats.earned)} in all</p>
    </main>`, 'is-farm');
    K().setCur('farm');
  }

  function bed(i) {
    const f = fm(), b = f.beds[i];
    if (!b) return;
    const s = F.cropStage(b);
    if (s === 'ready') {
      const crop = b.c, n = F.harvest(f, i);
      MQ.sfx('correct');
      K().toast(`${F.ITEMS[crop].e} +${n} in the basket`);
      xp(1);
      save();
      return redraw();
    }
    if (s !== 'empty') {
      const c = F.CROPS[b.c];
      return K().modal(`<div class="bigemoji">${s === 'seed' ? '🌱' : '🌿'}</div><div class="mtitle">${esc(F.ITEMS[b.c].many)}</div><p>Ready in ${c.days - b.g} ${c.days - b.g === 1 ? 'day' : 'days'}. Tap 🌙 Sleep to make the night pass.</p><div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
    }
    plantPicker(i);
  }
  function plantPicker(i) {
    const f = fm(), g = grade(), L = F.level(f.xp).level;
    const rows = Object.entries(F.CROPS).map(([id, c]) => {
      const it = F.ITEMS[id], price = F.seedPrice(id, g), locked = c.lv > L, poor = f.money < price;
      return `<button class="fseed" data-act="fPlant" data-arg="${i}:${id}" ${locked || poor ? 'disabled' : ''}>
        <span class="fe">${locked ? '🔒' : it.e}</span><span class="fseed-t"><b>${esc(it.many)}</b>
        <small>${locked ? `Opens at farm level ${c.lv}` : `${c.yield} in ${c.days} ${c.days === 1 ? 'day' : 'days'} · sell ${fmt(F.price(id, g))} each`}</small></span>
        <span class="fprice">${fmt(price)}</span></button>`;
    }).join('');
    K().modal(`<div class="mtitle">Plant seeds</div><p class="muted">You have ${fmt(f.money)}.</p><div class="fseeds">${rows}</div><div class="row"><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
  }
  function pen(i) {
    const f = fm(), p = f.pens[i];
    if (!p || !p.a) return;
    if (p.ready) {
      const it = F.ITEMS[F.ANIMALS[p.a].item], n = F.collect(f, i);
      MQ.sfx('correct');
      K().toast(`${it.e} +${n} in the basket`);
      xp(1);
      save();
      return redraw();
    }
    const r = F.feed(f, i);
    if (r === 'ok') { MQ.sfx('tap'); K().toast(`${F.ANIMALS[p.a].e} Yum! Fed.`); save(); return redraw(); }
    if (r === 'nofeed') return K().modal(`<div class="bigemoji">🌾</div><div class="mtitle">Not enough feed</div><p>${esc(F.ANIMALS[p.a].name)} eats ${F.ANIMALS[p.a].eat} 🌾 a day. You have ${f.feed}.</p><div class="row"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn" data-act="go" data-arg="farm:shop">Buy feed</button></div>`);
    const a = F.ANIMALS[p.a], sg = F.animalStage(p);
    K().modal(`<div class="bigemoji">${sg ? a.e : a.baby}</div><div class="mtitle">${esc(a.name)}</div><p>${sg < 2 ? `Grows up after ${a.grow[1] - p.g} more fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}. Then it gives ${a.per} ${F.ITEMS[a.item].e} every day it is fed.` : `Gives ${a.per} ${F.ITEMS[a.item].e} every morning after a day it was fed.`}</p><p class="muted">Already fed today. Tap 🌙 Sleep for a new day.</p><div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  function feedAll() {
    const f = fm();
    let fed = 0, short = 0;
    f.pens.forEach((p, i) => { if (!p.a || p.fed) return; F.feed(f, i) === 'ok' ? fed++ : short++; });
    if (fed) MQ.sfx('tap');
    K().toast(short ? `Fed ${fed}. Not enough feed for ${short} more: buy 🌾 in the shop.` : `Fed ${fed} ${fed === 1 ? 'animal' : 'animals'} 🌾`);
    save();
    redraw();
  }
  function collectAll() {
    const f = fm();
    let n = 0;
    f.pens.forEach((_, i) => { n += F.collect(f, i); });
    MQ.sfx('correct');
    K().toast(`🧺 +${n} in the basket`);
    xp(n);
    save();
    redraw();
  }
  function sleep() {
    const f = fm(), news = F.nextDay(f);
    save();
    const lines = [];
    const count = (arr) => { const m = {}; arr.forEach((x) => (m[x] = (m[x] || 0) + 1)); return m; };
    for (const [c, n] of Object.entries(count(news.ripe))) lines.push(`${F.ITEMS[c].e} ${n > 1 ? n + ' beds of ' + esc(F.ITEMS[c].many) : esc(cap(F.ITEMS[c].many))} are ripe`);
    const made = {};
    news.made.forEach(([it, n]) => (made[it] = (made[it] || 0) + n));
    for (const [it, n] of Object.entries(made)) lines.push(`${F.ITEMS[it].e} +${n} ${esc(n === 1 ? F.ITEMS[it].name : F.ITEMS[it].many)} to collect`);
    for (const [a, sg] of news.grew) lines.push(`${F.ANIMALS[a].e} Your ${esc(F.ANIMALS[a].name.toLowerCase())} ${sg === 2 ? 'is all grown up!' : 'got bigger'}`);
    for (const [a, n] of Object.entries(count(news.hungry))) lines.push(`${F.ANIMALS[a].e} ${n > 1 ? n + ' ' : ''}${esc(F.ANIMALS[a].name.toLowerCase())}${n > 1 ? 's were' : ' was'} hungry and didn’t grow. Feed animals before bed!`);
    MQ.sfx('reward');
    redraw();
    K().modal(`<div class="bigemoji">☀️</div><div class="mtitle">Good morning! Day ${f.day}</div>
      ${lines.length ? `<ul class="funlocks">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : '<p>A quiet night on the farm.</p>'}
      <div class="row"><button class="btn" data-act="closeModal">Let’s go!</button></div>`);
  }
  function redraw() { if (fs) return; main(); }

  // ---------------------------------------------------------------- shop
  const TABS = [['animals', '🐔 Animals & feed'], ['farm', '🏡 Farm'], ['decor', '✨ Decorations']];
  function shop() {
    const f = fm(), list = F.shop(f, grade()).filter((x) => x.tab === tab);
    const rows = list.map((x) => {
      // things to save up for: too expensive now, or not open yet (a goal for later levels)
      const goal = f.goal === x.id ? '<span class="fown">⭐ Goal</span>' : `<button class="btn ghost" data-act="fGoal" data-arg="${x.id}">⭐ Save up</button>`;
      let btn;
      if (x.owned) btn = '<span class="fown">✓ Yours</span>';
      else if (x.locked) btn = `<span class="flock">🔒 Level ${x.lv}</span>${x.tab === 'animals' && x.id.startsWith('feed') ? '' : goal}`;
      else if (x.blocked) btn = `<span class="flock">${esc(x.blocked)}</span>`;
      else if (f.money >= x.price) btn = `<button class="btn" data-act="fBuy" data-arg="${x.id}">Buy</button>`;
      else btn = goal;
      return `<div class="fitem ${x.locked ? 'locked' : ''}"><span class="fe">${x.e}</span>
        <span class="fitem-t"><b>${esc(x.name)}</b>${x.note ? `<small>${esc(x.note)}</small>` : ''}</span>
        <span class="fside"><span class="fprice">${x.owned ? '' : fmt(x.price)}</span>${btn}</span></div>`;
    }).join('');
    K().render(header('🛒 Farm Shop', 'farm') + `<main class="farm">
      <div class="ftabs" role="tablist">${TABS.map(([id, n]) => `<button class="chip ${tab === id ? 'sel' : ''}" role="tab" aria-selected="${tab === id}" data-act="fTab" data-arg="${id}">${n}</button>`).join('')}</div>
      ${goalBar()}
      <p class="muted">You pay with coins and bills, like in a real store. Tap ⭐ Save up to make something your goal.</p>
      <div class="fitems">${rows}</div>
    </main>`, 'is-farm');
    K().setCur('farm:shop');
  }

  // ---------------------------------------------------------------- playing: stand, odd jobs, paying
  // Money to tap when paying: kindergarten pennies, nickels, dimes (and quarters for big prices); 2nd grade
  // coins and $1 bills, plus $5, $10, $20 bills for big prices.
  function payKinds(price) {
    if (grade() === 'k') return price >= 25 ? ['q', 'd', 'n', 'p'] : ['d', 'n', 'p'];
    const k = ['b', 'q', 'd', 'n', 'p'];
    if (price >= 300) k.unshift('f');
    if (price >= 1000) k.unshift('t', 'w');
    return k;
  }
  function startPay(price, what, done) {
    fs = { mode: 'pay', what, done, n: 0, earned: 0, tips: 0, xp: 0 };
    const p = { kind: 'coins', pay: true, target: price, coinKinds: payKinds(price), text: `Pay <b>${fmt(price)}</b> for ${what}. Tap your coins${grade() === 'k' ? '' : ' and bills'}, then tap Pay.`, hint: 'Start with the biggest money that fits, then add smaller coins.', explain: `One way: ${F.fewest(price, payKinds(price)).map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(price)}`, total: price };
    show(p);
  }
  function startMarket() {
    if (!F.basketCount(fm())) return K().toast('The basket is empty');
    fs = { mode: 'market', n: 0, earned: 0, tips: 0, xp: 0, sold: {} };
    nextCustomer();
  }
  function startJobs() {
    fs = { mode: 'jobs', n: 0, earned: 0, tips: 0, xp: 0 };
    nextCustomer();
  }
  function nextCustomer() {
    clearTimeout(autoNext);
    const f = fm(), jobs = fs.mode === 'jobs';
    const vip = !jobs && (f.customers + 1) % F.VIP_EVERY === 0;
    const p = F.customer(f, grade(), { stock: jobs ? F.jobStock(f) : f.basket, vip, jobs });
    if (!p) return summary(true);
    show(p);
  }
  function show(p) {
    Object.assign(fs, { p, tries: 0, input: '', tray: [], locked: false, step: 'main', pick: null });
    const f = fm(), tiers = F.tiers(grade()), tier = tiers[(p.tier || f.tier) - 1];
    const status = fs.mode === 'pay' ? '🛒 Paying' : fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : `🏪 Customer ${fs.n + 1} · +${fmt(fs.earned + fs.tips)}`;
    const label = fs.mode === 'pay' ? '🛒 Farm Shop' : p.vip ? '⭐ Challenge customer · big tip' : `🧮 ${esc(tier.name)}${tier.ahead ? ' ⭐' : ''}`;
    const who = p.who ? `<span class="fwho" aria-hidden="true">${p.who[0]}</span>` : '';
    const intro = fs.mode === 'jobs' ? '<small class="muted">At the big Farmers’ Market:</small><br>' : '';
    K().render(`<div class="play fplay" style="--wc:${p.vip ? '#b0569e' : '#e0a21b'}">
      <header class="playbar"><button class="iconbtn" data-act="fQuit" aria-label="Stop">✕</button><div class="pstatus">${status}</div>${moneyPill()}</header>
      <section class="pcard enter ${p.vip ? 'vip' : ''}" id="pcard">
        <div class="pmeta"><span>${label}</span><span class="pmeta-r">${MQ.canSpeak() ? '<button class="speak" data-act="fSpeak" aria-label="Read the question aloud">🔊</button>' : ''}</span></div>
        <div class="fcust">${who}<div class="ptext wordy">${intro}${p.who ? `<b>${esc(p.who[1])}</b> ` : ''}${p.text}</div></div>
        ${p.visual ? `<div class="pvis">${p.visual}</div>` : ''}
        <div id="fstep"></div>
        <div class="feedback" id="feedback" aria-live="polite"></div>
      </section>
      <div class="answer" id="fanswer"></div>
    </div>`, 'is-play is-farmplay');
    drawAnswer();
    if (st().settings.readAloud) speakIt();
  }
  const speakIt = () => { const p = fs && fs.p; if (p) MQ.speak(((p.who ? p.who[1] + ' ' : '') + MQ.toSpeech(p.text)).replace(/\$(\d+)\.(\d\d)/g, (_, d, c) => F.spoken(+d * 100 + +c, 'g2')).replace(/(\d+)¢/g, '$1 cents')); };
  // the problem being answered now (paying too much asks for the change)
  const cur = () => (fs.step === 'change' ? fs.change : fs.p);
  function drawAnswer() {
    const p = cur(), box = $('#fanswer'), step = $('#fstep');
    if (!box) return;
    let top = fs.step === 'change' ? `<div class="fchange">${fs.change.text}</div>` : '';
    if (p.kind === 'num') {
      top += `<div class="display"><span class="dval ${fs.input ? 'filled' : ''}" id="dval">${fs.input || '?'}</span><span class="unit">¢</span></div>`;
      box.innerHTML = fs.locked ? lockedHtml() : `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="key" data-act="fKey" data-arg="${k}">${k}</button>`).join('')}<button class="key alt" data-act="fKey" data-arg="back" aria-label="Delete">⌫</button><button class="key" data-act="fKey" data-arg="0">0</button><button class="key go" data-act="fCheck">Check</button></div>`;
    } else if (p.kind === 'choice') {
      box.innerHTML = fs.locked ? lockedHtml() : `<div class="choices n${p.choices.length}">${p.choices.map((c, i) => `<button class="choice" data-act="fChoose" data-arg="${i}">${esc(c)}</button>`).join('')}</div>`;
    } else {
      const tray = fs.tray.length ? fs.tray.map((k, i) => `<button class="fcoin" data-act="fUncoin" data-arg="${i}" aria-label="Take back ${V.COIN[k].name}" ${fs.locked ? 'disabled' : ''}>${V.coins([k], true)}</button>`).join('') : `<span class="muted">${p.pay ? 'Your money goes here' : 'Tap coins below'}</span>`;
      top += `<div class="ftray" aria-label="Picked money">${tray}</div>`;
      box.innerHTML = fs.locked ? lockedHtml() : `<div class="fpalette">${p.coinKinds.map((k) => `<button class="fcoin big" data-act="fCoin" data-arg="${k}" aria-label="${V.COIN[k].name}">${V.coins([k], true)}</button>`).join('')}</div>
        <div class="row"><button class="btn ghost" data-act="fClear" ${fs.tray.length ? '' : 'disabled'}>Clear</button><button class="btn" data-act="fCheck" ${fs.tray.length ? '' : 'disabled'}>${p.pay ? 'Pay' : 'Done'} ✓</button></div>`;
    }
    step.innerHTML = top;
  }
  const lockedHtml = () => `<div class="row"><button class="btn big" data-act="fNext">${fs.mode === 'pay' ? 'Back to the farm' : 'Next customer'} →</button></div>`;
  function feedback(html, cls) {
    const el = $('#feedback');
    if (el) el.innerHTML = `<div class="fb ${cls}">${html}</div>`;
  }
  function check(given) {
    if (!fs || fs.locked) return;
    const p = cur();
    // Paying: too much money is fine in 2nd grade (then: how much change?); kindergarten pays the exact amount.
    if (p.pay && p.kind === 'coins') {
      const sum = F.sumCoins(given);
      if (sum > p.target && grade() !== 'k' && fs.tries < 2) {
        const C = sum - p.target;
        fs.paid = sum;
        fs.change = Object.assign({ text: `You gave <b>${fmt(sum)}</b>. How much <b>change</b> do you get back?`, hint: `Count up from ${fmt(p.target)} to ${fmt(sum)}.`, explain: `${fmt(sum)} − ${fmt(p.target)} = ${fmt(C)}` }, C < 100 ? { kind: 'num', answer: C } : { kind: 'choice', answer: fmt(C), choices: F.moneyChoices(C, grade()) });
        fs.step = 'change';
        fs.input = '';
        MQ.sfx('coin');
        return drawAnswer();
      }
    }
    if (F.isRight(p, given)) return right();
    fs.tries++;
    MQ.sfx('wrong');
    const card = $('#pcard');
    if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
    if (fs.tries < 2) {
      let h = p.hint;
      if (p.kind === 'coins') h = (F.sumCoins(given) > p.target ? 'That’s too much. ' : 'Not enough yet. ') + h;
      feedback(`💡 ${h}`, 'hint');
      fs.input = '';
      if (p.kind === 'coins') fs.tray = [];
      return drawAnswer();
    }
    reveal();
  }
  function right() {
    const first = fs.tries === 0;
    MQ.sfx('correct');
    if (fs.mode === 'pay') return paid(first, true);
    finish(first, true, '');
  }
  function reveal() {
    const p = cur();
    const ans = p.kind === 'coins' ? '' : `The answer is <b>${esc(String(p.kind === 'num' ? p.answer + '¢' : p.answer))}</b>. `;
    if (fs.mode === 'pay') return paid(false, false, `${ans}${esc(p.explain)}`);
    finish(false, false, `${ans}<span class="explain">${esc(p.explain)}</span>`);
  }
  // A customer or an odd job is done.
  function finish(first, solved, shown) {
    const f = fm(), p = fs.p;
    const r = F.serve(f, grade(), p, first, solved);
    F.record(st(), first);
    const move = F.adapt(f, grade(), first);
    fs.n++;
    fs.earned += r.paid;
    fs.tips += r.tip;
    fs.xp += r.xp;
    if (!p.jobs && !p.noPay) for (const [id, n] of Object.entries(p.sale)) fs.sold[id] = (fs.sold[id] || 0) + n;
    save();
    fs.locked = true;
    const thanks = p.noPay ? `${esc(p.who[1])} will come back with more money.` : p.jobs ? `You earned <b>${fmt(r.paid)}</b>.` : `${esc(p.who[1])} paid <b>${fmt(r.paid)}</b>${r.tip ? ` and tipped <b>${fmt(r.tip)}</b>` : ''}.`;
    if (solved) feedback(`${first ? U.pick(['Great job!', 'Thank you, farmer!', 'Perfect!', 'You got it!']) : 'Got it!'} ${thanks}${move === 'up' ? '<br>⬆️ Harder money problems unlocked!' : ''}`, 'ok');
    else feedback(`${shown}<br>${thanks}`, 'reveal');
    bumpMoney();
    if (r.tip || r.paid) MQ.sfx('coin');
    drawAnswer();
    const s = $('.pstatus');
    if (s) s.textContent = fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : `🏪 Customer ${fs.n} · +${fmt(fs.earned + fs.tips)}`;
    if (r.ups.length) levelUp(r.ups);
    else if (solved) autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1700);
    K().checkBadges();
  }
  // A payment is done (after a hint or with the answer shown it still goes through: the lesson is in the reveal).
  function paid(first, solved, shown) {
    const f = fm();
    F.record(st(), first);
    F.adapt(f, grade(), first);
    const done = fs.done;
    fs.locked = true;
    const thing = done();
    save();
    bumpMoney();
    MQ.sfx('reward');
    feedback(solved ? `${first ? 'Perfect payment!' : 'Paid!'} ${thing}` : `${shown}<br>${thing}`, solved ? 'ok' : 'reveal');
    drawAnswer();
    const ups = xp(solved ? (first ? 3 : 1) : 0);
    save();
    if (!ups.length && solved) autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1500);
    K().checkBadges();
  }
  function next() {
    clearTimeout(autoNext);
    if (!fs) return main();
    if (fs.mode === 'pay') { const back = fs.back || 'farm'; fs = null; return K().go(back); }
    if (fs.mode === 'market' && !F.basketCount(fm())) return summary(true);
    nextCustomer();
  }
  function quit() {
    clearTimeout(autoNext);
    if (!fs) return main();
    if (fs.mode === 'pay' || !fs.n) { const back = fs.back || 'farm'; fs = null; return K().go(back); }
    summary(false);
  }
  function summary(soldOut) {
    clearTimeout(autoNext);
    const s = fs;
    fs = null;
    if (!s || !s.n) return main();
    const sold = Object.entries(s.sold || {}).map(([id, n]) => `${F.ITEMS[id].e} ${n}`).join(' · ');
    const title = s.mode === 'jobs' ? 'Odd jobs done!' : soldOut ? 'Sold out! 🎉' : 'Stand closed';
    K().render(`<main class="result">
      <div class="bigemoji">${s.mode === 'jobs' ? '🧹' : '🏪'}</div>
      <h1 class="title">${title}</h1>
      <p class="lead">${s.mode === 'jobs' ? `${s.n} ${s.n === 1 ? 'job' : 'jobs'}` : `${s.n} ${s.n === 1 ? 'customer' : 'customers'}`} · earned <b>${fmt(s.earned + s.tips)}</b>${s.tips ? ` (tips ${fmt(s.tips)})` : ''} · +${s.xp} XP</p>
      ${sold ? `<p class="muted">Sold: ${sold}</p>` : ''}
      <p>Money now: <b>${fmt(fm().money)}</b></p>
      <div class="row"><button class="btn ghost" data-act="go" data-arg="farm:shop">🛒 Shop</button><button class="btn" data-act="go" data-arg="farm">Back to the farm</button></div>
    </main>`);
    MQ.sfx('reward');
    if (soldOut) MQ.confetti(80);
  }
  function key(k) {
    if (!fs || fs.locked || cur().kind !== 'num') return;
    if (k === 'back') fs.input = fs.input.slice(0, -1);
    else if (fs.input.length < 5) fs.input = (fs.input + k).replace(/^0+(?=\d)/, '');
    MQ.sfx('tap');
    const d = $('#dval');
    if (d) { d.textContent = fs.input || '?'; d.classList.toggle('filled', !!fs.input); }
  }

  // ---------------------------------------------------------------- routing
  function show_(arg, quiet = false) {
    clearTimeout(autoNext);
    fs = null;
    if (arg === 'shop') return shop();
    main();
    if (!quiet && st().settings.readAloud) MQ.speak(tipText());
  }
  const A = {
    fBed: (a) => bed(+a),
    fPen: (a) => pen(+a),
    fFeedAll: () => feedAll(),
    fCollectAll: () => collectAll(),
    fSleep: () => sleep(),
    fMarket: () => startMarket(),
    fJobs: () => startJobs(),
    fTab: (a) => { tab = a; shop(); },
    fGoal: (a) => { fm().goal = a; save(); MQ.sfx('tap'); K().toast('⭐ Saving goal set'); shop(); },
    fPlant: (a) => {
      const [i, crop] = a.split(':'), price = F.seedPrice(crop, grade());
      K().closeModal();
      if (fm().money < price) return K().toast('Not enough money yet');
      startPay(price, `${F.ITEMS[crop].e} ${esc(F.ITEMS[crop].many)} seeds`, () => {
        F.buySeed(fm(), grade(), +i, crop);
        return `${F.ITEMS[crop].e} planted! Ready in ${F.CROPS[crop].days} ${F.CROPS[crop].days === 1 ? 'day' : 'days'}.`;
      });
    },
    fBuy: (a) => {
      const x = F.shopItem(fm(), grade(), a);
      if (!x || fm().money < x.price) return;
      startPay(x.price, `${x.e} ${esc(x.name)}`, () => { F.buy(fm(), grade(), a); return `${x.e} ${esc(x.name)} is yours!`; });
      fs.back = 'farm:shop';
    },
    fKey: (a) => key(a),
    fCheck: () => {
      if (!fs || fs.locked) return;
      const p = cur();
      if (p.kind === 'num') { if (!fs.input) return; return check(fs.input); }
      if (p.kind === 'coins') { if (!fs.tray.length) return; return check(fs.tray.slice()); }
    },
    fChoose: (a) => { if (fs && !fs.locked) check(cur().choices[+a]); },
    fCoin: (a) => {
      if (!fs || fs.locked) return;
      const p = cur();
      if (p.pay && F.sumCoins(fs.tray) + F.COINV[a] > fm().money) return K().toast(`You only have ${fmt(fm().money)}`);
      if (fs.tray.length >= 30) return;
      fs.tray.push(a);
      MQ.sfx('coin');
      drawAnswer();
    },
    fUncoin: (a) => { if (!fs || fs.locked) return; fs.tray.splice(+a, 1); MQ.sfx('tap'); drawAnswer(); },
    fClear: () => { if (!fs || fs.locked) return; fs.tray = []; drawAnswer(); },
    fNext: () => next(),
    fQuit: () => quit(),
    fSpeak: () => speakIt(),
  };
  document.addEventListener('keydown', (e) => {
    if (!fs || fs.locked || $('#modal') || !document.getElementById('app').classList.contains('is-farmplay')) return;
    const p = cur();
    if (p.kind === 'num') {
      if (/^[0-9]$/.test(e.key)) key(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'Enter') A.fCheck();
    } else if (p.kind === 'choice' && /^[1-4]$/.test(e.key) && p.choices[+e.key - 1]) check(p.choices[+e.key - 1]);
  });

  MQ.farmUI = { show: show_, redraw: (arg) => show_(arg, true), actions: A, playing: () => fs };
})();
