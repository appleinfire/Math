// Sunny Farm screens: the farm, the shop, the stand (customers bring money problems), odd jobs and paying with coins.
// Rules and problems are in js/farm.js. The app shell (js/app.js) lends render, toast, modal and routing via MQ.app.kit.
(function () {
  const MQ = globalThis.MQ, U = MQ.U, F = MQ.farm, V = MQ.V, SC = MQ.farmScene;
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
  function bumpMoney(from) {
    const m = $('#fmoney');
    if (!m) return;
    SC.roll(m, from === undefined ? fm().money : from, fm().money, fmt);
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
    if (F.bankDue(f) > 0 && F.interest(f.bank.bal, grade()) > 0) t = 'It’s bank day! Your savings grew. Go to the bank to collect the interest.';
    else if (Object.values(f.works).some((w) => w.ready)) t = 'Something is ready in your workshop! Tap it to take it.';
    else if (f.beds.some((b) => F.cropStage(b) === 'ready')) t = 'Your crops are ripe! Tap them to pick them.';
    else if (f.pens.some((p) => p.ready)) t = 'Your animals made something! Tap them to collect it.';
    else if (hungry.length && f.feed >= F.penEat(hungry[0])) t = 'Feed your animals before bed, so they grow and make things to sell.';
    else if (hungry.length) t = 'Out of feed! Buy feed 🌾 in the shop.';
    else if (Object.entries(f.works).some(([id, w]) => w.r === null && F.WORKS[id].recipes.some((r, i) => F.canMake(f, id, i)))) t = 'You have what a workshop needs. Make something worth more!';
    else if (F.basketCount(f)) t = 'Your basket is full of good things. Open the stand and sell them!';
    else if (f.beds.some((b) => !b.c) && f.money >= cheapest) t = 'An empty garden bed! Tap it to plant seeds.';
    else if (f.beds.some((b) => b.c) || f.pens.some((p) => p.a && p.fed)) t = 'All done for today. Tap 🌙 Sleep to start a new day.';
    else t = 'Need money? Do odd jobs at the big market.';
    return t;
  }
  // Grown-up preview: choose which money problems the customers bring (the level stays where it is set).
  function pvTiers() {
    const ts = F.tiers(grade()), cur = Math.min(fm().tier, ts.length);
    return `<div class="pvlevels"><span>👀 Money problems customers bring:</span><div class="chips">${ts.map((t, i) => `<button class="chip ${cur === i + 1 ? 'sel' : ''}" data-act="fPvTier" data-arg="${i + 1}" aria-pressed="${cur === i + 1}">${i + 1}. ${esc(t.name)}${t.ahead ? ' ⭐' : ''}</button>`).join('')}</div><small class="muted">⭐ = ahead of the grade. Every 5th customer brings one level more.</small></div>`;
  }
  function goalBar() {
    const g = F.goalItem(fm(), grade());
    if (!g) return '';
    const total = fm().money + fm().bank.bal; // savings in the bank count toward the goal
    const have = Math.min(total, g.price), pctv = g.price ? Math.round((have / g.price) * 100) : 100;
    const left = g.price - total;
    return `<button class="fgoal" data-act="go" data-arg="farm:shop" aria-label="Saving goal">
      <span class="fgoal-e">${g.e}</span><span class="fgoal-t"><b>Saving for: ${esc(g.name)}</b>
      <span class="fbar"><span style="width:${pctv}%"></span></span>
      <small>${left > 0 ? `${fmt(total)} of ${fmt(g.price)}${fm().bank.bal ? ' (with the bank)' : ''} · ${fmt(left)} to go` : g.locked ? `You have enough! It opens at farm level ${g.lv}.` : fm().money >= g.price ? 'You have enough! Buy it in the shop 🎉' : 'You have enough with your bank savings! Take money out of the bank to buy it.'}${left > 0 && g.locked ? ` · opens at level ${g.lv}` : ''}</small></span></button>`;
  }
  function main() {
    const f = fm(), g = grade();
    const lv = F.level(f.xp), pctv = Math.round(((f.xp - lv.from) / (lv.to - lv.from)) * 100);
    const tiers = F.tiers(g), tier = tiers[Math.min(f.tier, tiers.length) - 1];
    const n = F.basketCount(f);
    const basket = Object.entries(f.basket).filter(([, c]) => c > 0).map(([id, c]) => `<span class="fchip">${F.ITEMS[id].e} ${c} <small>× ${fmt(F.price(id, g))}</small></span>`).join('') || '<span class="muted">Empty. Pick crops and collect from animals.</span>';
    const hungry = f.pens.some((p) => p.a && !p.fed), ready = f.pens.some((p) => p.ready);
    const ripe = f.beds.filter((b) => F.cropStage(b) === 'ready').length, empty = F.emptyBeds(f).length;
    const bankDay = F.bankDue(f) > 0 && F.interest(f.bank.bal, g) > 0;
    K().render(header('🌻 Sunny Farm') + `<main class="farm">
      <section class="flevel">
        <div class="flv"><b>Farm level ${lv.level} · ${esc(F.title(lv.level))}</b><span>Day ${f.day} · ${F.STANDS[f.stand].e} ${esc(F.STANDS[f.stand].name)}</span></div>
        <div class="fbar xp" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pctv}%"></span></div>
        <small class="muted">${f.xp - lv.from} / ${lv.to - lv.from} XP to level ${lv.level + 1} · Money problems: ${tier.ahead ? '⭐ ' : ''}${esc(tier.name)}</small>
      </section>
      ${MQ.store.preview ? pvTiers() : ''}
      ${goalBar()}
      ${bankDay ? `<button class="fbankday" data-act="go" data-arg="farm:bank">🏦 <b>Bank day!</b> Your savings earned interest. Tap to collect it.</button>` : ''}
      ${tipLine()}
      <button class="btn big fstand" data-act="fMarket" ${n ? '' : 'disabled'}>🏪 Open the stand ${n ? `· ${n} to sell` : '· basket is empty'}</button>
      <div class="fbtns">
        <button class="tile" data-act="go" data-arg="farm:shop"><span class="ti">🛒</span><b>Shop</b><small>Animals, feed, more</small></button>
        ${lv.level >= F.BANK_LV ? `<button class="tile ${bankDay ? 'hot' : ''}" data-act="go" data-arg="farm:bank"><span class="ti">🏦</span><b>Bank</b><small>${f.bank.bal ? fmt(f.bank.bal) + ' saved' : 'Save and earn'}</small></button>` : `<button class="tile locked" disabled><span class="ti">🏦</span><b>Bank</b><small>🔒 Level ${F.BANK_LV}</small></button>`}
        <button class="tile" data-act="fJobs"><span class="ti">🧹</span><b>Odd jobs</b><small>Earn at the big market</small></button>
        <button class="tile" data-act="fSleep"><span class="ti">🌙</span><b>Sleep</b><small>Start day ${f.day + 1}</small></button>
      </div>
      ${SC.farm(f, g)}
      <div class="fquick">
        <span class="pill" id="ffeed">🌾 ${f.feed} feed</span>
        ${ripe >= 2 ? '<button class="btn ghost" data-act="fPickAll">🧺 Pick all</button>' : ''}
        ${empty >= 2 ? '<button class="btn ghost" data-act="fPlantAll">🌱 Plant all</button>' : ''}
        ${hungry ? '<button class="btn ghost" data-act="fFeedAll">🌾 Feed all</button>' : ''}${ready ? '<button class="btn ghost" data-act="fCollectAll">🥚 Collect all</button>' : ''}
      </div>
      ${f.helper.hired ? `<div class="fhelp">🧑‍🌾 <span>Farmhand ${F.HELPER.name} ${f.helper.on ? `feeds the animals at night and collects in the morning · ${fmt(F.HELPER.wage[g === 'k' ? 0 : 1])} a day` : 'is taking a break'}</span><button class="btn ghost" data-act="fHelper">${f.helper.on ? 'Pause' : 'Back to work'}</button></div>` : ''}
      <h2>🧺 Basket</h2>
      <div class="fbasket" id="fbasket">${basket}</div>
      <p class="muted center">Sold ${f.stats.sold} things · earned ${fmt(f.stats.earned)} in all</p>
    </main>`, 'is-farm');
    K().setCur('farm');
  }

  function bed(i, el) {
    const f = fm(), b = f.beds[i];
    if (!b) return;
    const s = F.cropStage(b);
    if (s === 'ready') {
      const crop = b.c, n = F.harvest(f, i), from = el && el.getBoundingClientRect();
      MQ.sfx('correct');
      xp(1);
      save();
      redraw();
      SC.flyMany(F.ITEMS[crop].e, n, from, '#fbasket');
      return;
    }
    if (s !== 'empty') {
      const left = F.cropDays(b) - b.g;
      return K().modal(`<div class="bigemoji">${s === 'seed' ? '🌱' : '🌿'}</div><div class="mtitle">${esc(cap(F.ITEMS[b.c].many))}</div><p>Ready in ${left} ${left === 1 ? 'day' : 'days'}: ${F.cropYield(b)} ${F.ITEMS[b.c].e}${b.again ? ' (the second harvest)' : ''}. Tap 🌙 Sleep to make the night pass.</p>${bedUps(b)}<div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrades</button><button class="btn" data-act="closeModal">OK</button></div>`);
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
    K().modal(`<div class="mtitle">Plant seeds</div><p class="muted">You have ${fmt(f.money)}.</p>${bedUps(f.beds[i])}<div class="fseeds">${rows}</div><div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrade beds</button><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
  }
  // What a bed's upgrades do, in a short line (nothing for a bed without upgrades).
  function bedUps(b) {
    const x = [];
    if (F.bedStars(b)) x.push(`${'★'.repeat(F.bedStars(b))} +${F.bedStars(b)} ${F.bedStars(b) === 1 ? 'crop' : 'crops'}`);
    if (F.bedWater(b)) x.push('💧 1 day sooner');
    if (F.bedGlass(b)) x.push('🏠 two harvests');
    return x.length ? `<p class="muted">This bed: ${x.join(' · ')}</p>` : '';
  }
  // Plant the same crop in all the empty beds, for one payment (how many packets × the price of one).
  function plantAllPicker() {
    const f = fm(), g = grade(), L = F.level(f.xp).level, n = F.emptyBeds(f).length;
    const rows = Object.entries(F.CROPS).filter(([, c]) => c.lv <= L).map(([id, c]) => {
      const it = F.ITEMS[id], price = F.seedPrice(id, g), poor = f.money < n * price;
      return `<button class="fseed" data-act="fPlantAllCrop" data-arg="${id}" ${poor ? 'disabled' : ''}>
        <span class="fe">${it.e}</span><span class="fseed-t"><b>${esc(it.many)}</b><small>${poor ? 'Not enough money for all the beds' : `${n} packets · ${fmt(price)} each`}</small></span>
        <span class="fprice">${fmt(price)}</span></button>`;
    }).join('');
    K().modal(`<div class="mtitle">Plant all ${n} empty beds</div><p class="muted">One packet of seeds for each bed. You have ${fmt(f.money)}.</p><div class="fseeds">${rows}</div><div class="row"><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
  }
  function plantAll(crop) {
    const f = fm(), g = grade(), n = F.emptyBeds(f).length, one = F.seedPrice(crop, g), it = F.ITEMS[crop];
    K().closeModal();
    if (n < 1 || f.money < n * one) return K().toast('Not enough money yet');
    startPay(n * one, '', () => {
      F.plantAll(fm(), g, crop, n);
      return `${it.e} ${n} beds planted! Ready in ${F.CROPS[crop].days} ${F.CROPS[crop].days === 1 ? 'day' : 'days'} (sooner with a sprinkler).`;
    }, '🌱'.repeat(Math.min(n, 4)), {
      text: `Seeds for <b>${n} beds</b>: ${n} packets of ${it.e} ${esc(it.many)} at <b>${fmt(one)} each</b>. Work out the total, then tap your coins${g === 'k' ? '' : ' and bills'} and Pay.`,
      hint: `${n} × ${fmt(one)}: add ${fmt(one)} ${n} times (${Array(n).fill(one).join(' + ')}).`,
      explain: `${n} × ${fmt(one)} = ${fmt(n * one)}`,
    });
  }
  function pickAll() {
    const f = fm(), got = [];
    f.beds.forEach((b, i) => { if (F.cropStage(b) === 'ready') { const el = document.querySelector(`.fbed[data-arg="${i}"]`), c = b.c; got.push([el && el.getBoundingClientRect(), F.ITEMS[c].e, F.harvest(f, i)]); } });
    if (!got.length) return;
    MQ.sfx('correct');
    xp(got.length);
    save();
    redraw();
    got.forEach(([r, e, n], k) => SC.flyMany(e, Math.min(n, 4), r, '#fbasket', { delay: k * 150 }));
  }
  const penEl = (i) => document.querySelector(`.fpen[data-arg="${i}"]`);
  function pen(i, el) {
    const f = fm(), p = f.pens[i];
    if (!p || !p.a) return;
    if (p.ready) {
      const it = F.ITEMS[F.ANIMALS[p.a].item], n = F.collect(f, i), from = el && el.getBoundingClientRect();
      MQ.sfx('correct');
      xp(1);
      save();
      redraw();
      SC.flyMany(it.e, n, from, '#fbasket');
      return;
    }
    const r = F.feed(f, i);
    if (r === 'ok') {
      MQ.sfx('tap');
      const from = $('#ffeed') && $('#ffeed').getBoundingClientRect();
      save();
      redraw();
      const to = penEl(i);
      SC.fly('🌾', from, to, { land: () => { MQ.sfx('correct'); SC.burst(penEl(i)); hop(i); } });
      return;
    }
    if (r === 'nofeed') return K().modal(`<div class="bigemoji">🌾</div><div class="mtitle">Not enough feed</div><p>${F.penCount(p) > 1 ? F.penCount(p) + ' × ' : ''}${esc(F.ANIMALS[p.a].name)} ${F.penCount(p) > 1 ? 'eat' : 'eats'} ${F.penEat(p)} 🌾 a day. You have ${f.feed}.</p><div class="row"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn" data-act="go" data-arg="farm:shop">Buy feed</button></div>`);
    const a = F.ANIMALS[p.a], sg = F.animalStage(p);
    const k = F.penMakes(p), cnt = F.penCount(p);
    K().modal(`<div class="bigemoji">${sg ? a.e : a.baby}</div><div class="mtitle">${cnt > 1 ? cnt + ' × ' : ''}${esc(a.name)}</div><p>${sg < 2 ? `Grows up after ${a.grow[1] - p.g} more fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}. Then this pen gives ${k} ${F.ITEMS[a.item].e} every day it is fed.` : `This pen gives ${k} ${F.ITEMS[a.item].e} every morning after a day it was fed.`}</p><p class="muted">Already fed today. Tap 🌙 Sleep for a new day.</p><div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrades</button><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  // a quick happy jump of the animal in pen i
  function hop(i) {
    const w = penEl(i) && penEl(i).querySelector('.bob, .bee');
    if (!w) return;
    w.classList.remove('hop');
    void w.offsetWidth;
    w.classList.add('hop');
  }
  function feedAll() {
    const f = fm(), from = $('#ffeed') && $('#ffeed').getBoundingClientRect(), fedNow = [];
    let short = 0;
    f.pens.forEach((p, i) => { if (!p.a || p.fed) return; F.feed(f, i) === 'ok' ? fedNow.push(i) : short++; });
    if (fedNow.length) MQ.sfx('tap');
    if (short) K().toast(`Not enough feed for ${short} more ${short === 1 ? 'animal' : 'animals'}: buy 🌾 in the shop.`);
    save();
    redraw();
    fedNow.forEach((i, k) => SC.fly('🌾', from, penEl(i), { delay: k * 140, land: () => { SC.burst(penEl(i), '❤️', 2); hop(i); } }));
  }
  function collectAll() {
    const f = fm(), got = [];
    f.pens.forEach((p, i) => { if (p.ready) { const r = penEl(i).getBoundingClientRect(), e = F.ITEMS[F.ANIMALS[p.a].item].e; got.push([r, e, F.collect(f, i)]); } });
    const n = U.sum(got.map((x) => x[2]));
    MQ.sfx('correct');
    xp(n);
    save();
    redraw();
    got.forEach(([r, e, c], k) => SC.flyMany(e, c, r, '#fbasket', { delay: k * 200 }));
  }
  function sleep() {
    if ($('.nightfx')) return;
    const f = fm(), news = F.nextDay(f, grade());
    save();
    MQ.sfx('tick');
    SC.night(() => redraw(), () => morning(f, news));
  }
  function morning(f, news) {
    if (fs || !$('.scene')) return; // left the farm during the night
    const lines = [];
    const count = (arr) => { const m = {}; arr.forEach((x) => (m[x] = (m[x] || 0) + 1)); return m; };
    for (const [c, n] of Object.entries(count(news.ripe))) lines.push(`${F.ITEMS[c].e} ${n > 1 ? n + ' beds of ' + esc(F.ITEMS[c].many) : esc(cap(F.ITEMS[c].many))} are ripe`);
    const made = {};
    news.made.forEach(([it, n]) => (made[it] = (made[it] || 0) + n));
    for (const [it, n] of Object.entries(made)) lines.push(`${F.ITEMS[it].e} +${n} ${esc(n === 1 ? F.ITEMS[it].name : F.ITEMS[it].many)} to collect`);
    const h = news.helper;
    if (h && h.unpaid) lines.push(`🧑‍🌾 ${F.HELPER.name} didn’t work last night: there wasn’t ${fmt(h.wage)} in your wallet for the wage.`);
    else if (h) lines.push(`🧑‍🌾 ${F.HELPER.name} was paid ${fmt(h.wage)}, fed ${h.fed} ${h.fed === 1 ? 'pen' : 'pens'}${h.collected ? `, collected ${h.collected}` : ''}${h.picked ? `, picked ${h.picked}` : ''}.${h.short ? ` Not enough feed for ${h.short}!` : ''}`);
    for (const it of news.cooked) lines.push(`${F.ITEMS[it].e} Your ${esc(F.ITEMS[it].name)} is ready in the workshop!`);
    for (const [a, sg] of news.grew) lines.push(`${F.ANIMALS[a].e} Your ${esc(F.ANIMALS[a].name.toLowerCase())} ${sg === 2 ? 'is all grown up!' : 'got bigger'}`);
    for (const [a, n] of Object.entries(count(news.hungry))) lines.push(`${F.ANIMALS[a].e} ${n > 1 ? n + ' ' : ''}${esc(F.ANIMALS[a].name.toLowerCase())}${n > 1 ? 's were' : ' was'} hungry and didn’t grow. Feed animals before bed!`);
    MQ.sfx('reward');
    K().modal(`<div class="bigemoji">☀️</div><div class="mtitle">Good morning! Day ${f.day}</div>
      ${lines.length ? `<ul class="funlocks">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : '<p>A quiet night on the farm.</p>'}
      <div class="row"><button class="btn" data-act="closeModal">Let’s go!</button></div>`);
  }
  function redraw() { if (fs) return; main(); }

  // ---------------------------------------------------------------- shop
  const TABS = [['animals', '🐔 Animals & feed'], ['up', '⬆️ Upgrades'], ['farm', '🏡 Farm'], ['decor', '✨ Decorations']];
  function shop() {
    const f = fm(), list = F.shop(f, grade()).filter((x) => x.tab === tab);
    const rows = list.map((x) => {
      // things to save up for: too expensive now, or not open yet (a goal for later levels)
      const goal = f.goal === x.id ? '<span class="fown">⭐ Goal</span>' : `<button class="btn ghost" data-act="fGoal" data-arg="${x.id}">⭐ Save up</button>`;
      let btn;
      if (x.owned && x.id === 'helper') btn = `<button class="btn ghost" data-act="fHelper">${f.helper.on ? 'Pause' : 'Back to work'}</button>`;
      else if (x.owned) btn = '<span class="fown">✓ Yours</span>';
      else if (x.locked) btn = `<span class="flock">🔒 Level ${x.lv}</span>${x.tab === 'animals' && x.id.startsWith('feed') ? '' : goal}`;
      else if (x.blocked) btn = `<span class="flock">${esc(x.blocked)}</span>`;
      else if (f.money >= x.price) btn = `<button class="btn" data-act="fBuy" data-arg="${x.id}">Buy</button>`;
      else btn = goal;
      return `<div class="fitem ${x.locked ? 'locked' : ''}"><span class="fe">${x.id.startsWith('decor:') ? SC.icon(x.id.slice(6), x.e) : x.e}</span>
        <span class="fitem-t"><b>${esc(x.name)}</b>${x.note ? `<small>${esc(x.note)}</small>` : ''}</span>
        <span class="fside"><span class="fprice">${x.owned ? '' : fmt(x.price)}</span>${btn}</span></div>`;
    }).join('');
    K().render(header('🛒 Farm Shop', 'farm') + `<main class="farm">
      <div class="ftabs" role="tablist">${TABS.map(([id, n]) => `<button class="chip ${tab === id ? 'sel' : ''}" role="tab" aria-selected="${tab === id}" data-act="fTab" data-arg="${id}">${n}</button>`).join('')}</div>
      ${goalBar()}
      <p class="muted">${tab === 'up' ? 'Your farm has room for 6 garden beds and 6 pens. Make them better: more crops, faster growth, more animals in each pen.' : 'You pay with coins and bills, like in a real store. Tap ⭐ Save up to make something your goal.'}</p>
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
  function startPay(price, what, done, icon = '', words = null) {
    fs = { mode: 'pay', what, done, icon, n: 0, earned: 0, tips: 0, xp: 0 };
    const way = `One way: ${F.fewest(price, payKinds(price)).map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(price)}`;
    const p = { kind: 'coins', pay: true, target: price, coinKinds: payKinds(price), text: `Pay <b>${fmt(price)}</b> for ${what}. Tap your coins${grade() === 'k' ? '' : ' and bills'}, then tap Pay.`, hint: 'Start with the biggest money that fits, then add smaller coins.', explain: way, total: price };
    if (words) Object.assign(p, { text: words.text, hint: words.hint, explain: `${words.explain}. ${way}` });
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
    const status = STATUS[fs.mode] ? STATUS[fs.mode]() : fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : `🏪 Customer ${fs.n + 1} · +${fmt(fs.earned + fs.tips)}`;
    const label = LABEL[fs.mode] ? LABEL[fs.mode] : p.vip ? '⭐ Challenge customer · big tip' : `🧮 ${esc(tier.name)}${tier.ahead ? ' ⭐' : ''}`;
    const intro = fs.mode === 'jobs' ? '<small class="muted">At the big Farmers’ Market:</small><br>' : '';
    const stall = fs.mode === 'pay'
      ? SC.stall({ mode: 'pay', seller: '🧑‍🌾', shopper: st().companion, goods: fs.icon || '🛍️' })
      : fs.mode === 'make' ? SC.stall({ mode: 'make', seller: st().companion, shopper: F.WORKS[fs.work].e, goods: Object.entries(fs.recipe.in).map(([id, n]) => `<i>${F.ITEMS[id].e}</i>`.repeat(Math.min(n, 4))).join('') })
      : BANKISH.has(fs.mode) ? SC.stall({ mode: 'bank', seller: '🦉', shopper: st().companion, goods: '<i>🏦</i>' })
      : SC.stall({ mode: fs.mode, stand: fs.mode === 'jobs' ? 9 : f.stand, seller: st().companion, shopper: p.who[0], goods: SC.goods(p.sale), vip: p.vip });
    K().render(`<div class="play fplay" style="--wc:${p.vip ? '#b0569e' : '#e0a21b'}">
      <header class="playbar"><button class="iconbtn" data-act="fQuit" aria-label="Stop">✕</button><div class="pstatus">${status}</div>${moneyPill()}</header>
      ${stall}
      <section class="pcard enter ${p.vip ? 'vip' : ''}" id="pcard">
        <div class="pmeta"><span>${label}</span><span class="pmeta-r">${MQ.canSpeak() ? '<button class="speak" data-act="fSpeak" aria-label="Read the question aloud">🔊</button>' : ''}</span></div>
        <div class="fcust"><div class="ptext wordy">${intro}${p.who ? `<b>${esc(p.who[1])}</b> ` : ''}${p.text}</div></div>
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
  const BANKISH = new Set(['deposit', 'withdraw', 'interest']);
  const STATUS = {
    pay: () => '🛒 Paying',
    make: () => `${F.WORKS[fs.work].e} ${esc(F.WORKS[fs.work].name)}`,
    deposit: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    withdraw: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    interest: () => `🏦 Bank day ${fs.n + 1} of ${fs.weeks}`,
  };
  const LABEL = { pay: '🛒 Farm Shop', make: '🧮 Is it worth making?', deposit: '🏦 Put money in the bank', withdraw: '🏦 Take money out', interest: '🏦 Bank day: interest' };
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
      const tray = fs.tray.length ? fs.tray.map((k, i) => `<button class="fcoin" data-act="fUncoin" data-arg="${i}" aria-label="Take back ${V.COIN[k].name}" ${fs.locked ? 'disabled' : ''}>${V.coins([k], true)}</button>`).join('') : `<span class="muted">${p.pay || p.free ? 'Your money goes here' : 'Tap coins below'}</span>`;
      top += `<div class="ftray" aria-label="Picked money">${tray}</div>`;
      box.innerHTML = fs.locked ? lockedHtml() : `<div class="fpalette">${p.coinKinds.map((k) => `<button class="fcoin big" data-act="fCoin" data-arg="${k}" aria-label="${V.COIN[k].name}">${V.coins([k], true)}</button>`).join('')}</div>
        <div class="row"><button class="btn ghost" data-act="fClear" ${fs.tray.length ? '' : 'disabled'}>Clear</button><button class="btn" data-act="fCheck" ${fs.tray.length ? '' : 'disabled'}>${p.go || (p.pay ? 'Pay' : 'Done')} ✓</button></div>`;
    }
    step.innerHTML = top;
  }
  const NEXT = { pay: 'Back to the farm', make: 'Back to the farm', deposit: 'Back to the bank', withdraw: 'Back to the bank' };
  const lockedHtml = () => `<div class="row"><button class="btn big" data-act="fNext">${fs.mode === 'interest' ? (fs.n < fs.weeks ? 'Next bank day' : 'Back to the bank') : NEXT[fs.mode] || 'Next customer'} →</button></div>`;
  function feedback(html, cls) {
    const el = $('#feedback');
    if (el) el.innerHTML = `<div class="fb ${cls}">${html}</div>`;
  }
  function check(given) {
    if (!fs || fs.locked) return;
    const p = cur();
    // The bank: any amount the child picks (up to what they have). Saving asks to count it first.
    if (p.free && p.kind === 'coins' && fs.step === 'main') {
      const sum = F.sumCoins(given);
      if (!sum || sum > p.limit) return K().toast(`You can use up to ${fmt(p.limit)}`);
      fs.amount = sum;
      if (fs.mode === 'withdraw') return withdrawn();
      fs.change = Object.assign({ text: `How much money are you putting in the bank?`, hint: 'Start with the money worth the most, then count on.', explain: `${given.slice().sort((a, b) => F.COINV[b] - F.COINV[a]).map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(sum)}` }, grade() === 'k' || sum < 100 ? { kind: 'num', answer: sum } : { kind: 'choice', answer: fmt(sum), choices: F.moneyChoices(sum, grade()) });
      fs.step = 'change';
      fs.input = '';
      MQ.sfx('coin');
      return drawAnswer();
    }
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
    if (TASKS.has(fs.mode)) return doneTask(first, true, '');
    finish(first, true, '');
  }
  function reveal() {
    const p = cur();
    const ans = p.kind === 'coins' ? '' : `The answer is <b>${esc(String(p.kind === 'num' ? p.answer + '¢' : p.answer))}</b>. `;
    if (fs.mode === 'pay') return paid(false, false, `${ans}${esc(p.explain)}`);
    if (TASKS.has(fs.mode)) return doneTask(false, false, `${ans}<span class="explain">${esc(p.explain)}</span>`);
    finish(false, false, `${ans}<span class="explain">${esc(p.explain)}</span>`);
  }
  // A customer or an odd job is done.
  function finish(first, solved, shown) {
    const f = fm(), p = fs.p, before = f.money;
    const r = F.serve(f, grade(), p, first, solved);
    F.record(st(), first);
    const move = MQ.store.preview ? null : F.adapt(f, grade(), first); // in the preview the chosen level stays
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
    drawAnswer();
    // the customer takes the things and pays: goods fly to them, coins fly to the money
    const shopper = $('#shopper');
    if (shopper) shopper.classList.add(p.noPay ? 'sad' : 'happy');
    if (!p.jobs && !p.noPay && $('#goods')) { $('#goods').querySelectorAll('i').forEach((g, k) => SC.fly(g.textContent, g, shopper, { delay: k * 90, dur: 500 })); $('#goods').classList.add('gone'); }
    if (r.paid + r.tip) {
      const coins = Math.min(5, 2 + Math.floor((r.paid + r.tip) / (grade() === 'k' ? 3 : 30)));
      SC.flyMany('🪙', coins, p.jobs ? $('#cashbox') : shopper, '#fmoney', { delay: 350, size: '1.5rem' });
      setTimeout(() => { bumpMoney(before); MQ.sfx('coin'); }, SC.reduced() ? 0 : 900);
    }
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
    if (!MQ.store.preview) F.adapt(f, grade(), first);
    const done = fs.done, before = f.money;
    document.querySelectorAll('.ftray .fcoin').forEach((c, k) => SC.fly(c.innerHTML, c, '#cashbox', { delay: k * 80, dur: 550, size: '1rem' }));
    fs.locked = true;
    const thing = done();
    save();
    bumpMoney(before);
    MQ.sfx('reward');
    const sh = $('#shopper');
    if (sh) sh.classList.add('happy');
    feedback(solved ? `${first ? 'Perfect payment!' : 'Paid!'} ${thing}` : `${shown}<br>${thing}`, solved ? 'ok' : 'reveal');
    drawAnswer();
    const ups = xp(solved ? (first ? 3 : 1) : 0);
    save();
    if (!ups.length && solved) autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1500);
    K().checkBadges();
  }
  // A workshop question, a deposit or a bank day is done: fs.done applies it and says what happened.
  const TASKS = new Set(['make', 'deposit', 'interest']);
  function doneTask(first, solved, shown) {
    const f = fm(), before = f.money;
    F.record(st(), first);
    fs.locked = true;
    fs.n++;
    const msg = fs.done(first, solved);
    save();
    bumpMoney(before);
    MQ.sfx('reward');
    const sh = $('#shopper');
    if (sh) sh.classList.add('happy');
    if (fs.mode === 'deposit') document.querySelectorAll('.ftray .fcoin').forEach((c, k) => SC.fly(c.innerHTML, c, '#goods', { delay: k * 80, dur: 550, size: '1rem' }));
    feedback(solved ? `${first ? 'Perfect!' : 'Got it!'} ${msg}` : `${shown}<br>${msg}`, solved ? 'ok' : 'reveal');
    drawAnswer();
    const ups = xp(solved ? (first ? 3 : 1) : 0);
    save();
    if (!ups.length && solved) autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1700);
    K().checkBadges();
  }
  function withdrawn() {
    const f = fm(), before = f.money, amt = fs.amount;
    F.withdraw(f, amt);
    save();
    document.querySelectorAll('.ftray .fcoin').forEach((c, k) => SC.fly(c.innerHTML, c, '#fmoney', { delay: k * 80, dur: 550, size: '1rem' }));
    fs.locked = true;
    bumpMoney(before);
    MQ.sfx('coin');
    feedback(`You took <b>${fmt(amt)}</b> out of the bank. It is in your wallet now.`, 'ok');
    drawAnswer();
    autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1500);
  }
  function next() {
    clearTimeout(autoNext);
    if (!fs) return main();
    if (fs.mode === 'interest' && fs.n < fs.weeks) return interestQuestion();
    if (fs.mode === 'pay' || TASKS.has(fs.mode) || fs.mode === 'withdraw') { const back = fs.back || 'farm'; fs = null; return K().go(back); }
    if (fs.mode === 'market' && !F.basketCount(fm())) return summary(true);
    nextCustomer();
  }
  function quit() {
    clearTimeout(autoNext);
    if (!fs) return main();
    if (fs.mode === 'pay' || TASKS.has(fs.mode) || fs.mode === 'withdraw' || !fs.n) { const back = fs.back || 'farm'; fs = null; return K().go(back); }
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

  // ---------------------------------------------------------------- workshops
  function work(id, el) {
    const f = fm(), w = f.works[id], W = F.WORKS[id];
    if (!w) return;
    if (w.ready) {
      const out = w.out, n = F.takeMade(f, id), from = el && el.getBoundingClientRect();
      MQ.sfx('correct');
      xp(2);
      save();
      redraw();
      SC.flyMany(F.ITEMS[out].e, n, from, '#fbasket');
      K().checkBadges();
      return;
    }
    if (w.r !== null && w.r !== undefined) {
      const r = W.recipes[w.r], left = r.days - w.g;
      return K().modal(`<div class="bigemoji">${F.ITEMS[r.out].e}</div><div class="mtitle">Making ${esc(F.ITEMS[r.out].name)}</div><p>Ready after ${left} more ${left === 1 ? 'night' : 'nights'}. Tap 🌙 Sleep.</p><div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
    }
    const L = F.level(f.xp).level, g = grade();
    const rows = W.recipes.map((r, i) => {
      const it = F.ITEMS[r.out], val = F.worth(r, g), locked = r.lv > L, ok = F.canMake(f, id, i);
      const need = Object.entries(r.in).map(([x, n]) => `<span class="${(f.basket[x] || 0) >= n ? 'have' : 'miss'}">${n} ${F.ITEMS[x].e} <small>(${f.basket[x] || 0})</small></span>`).join(' + ');
      return `<div class="fitem ${locked ? 'locked' : ''}"><span class="fe">${it.e}</span>
        <span class="fitem-t"><b>${esc(cap(it.name))}</b><small class="need">${need}</small><small>${r.days} ${r.days === 1 ? 'night' : 'nights'} · sells for ${fmt(val.outVal)}</small></span>
        <span class="fside">${locked ? `<span class="flock">🔒 Level ${r.lv}</span>` : `<button class="btn" data-act="fMake" data-arg="${id}:${i}" ${ok ? '' : 'disabled'}>Make</button>`}</span></div>`;
    }).join('');
    K().modal(`<div class="bigemoji">${W.e}</div><div class="mtitle">${esc(W.name)}</div><p class="muted">Turn what your farm makes into something worth more. The numbers in ( ) are what you have in the basket.</p><div class="fitems">${rows}</div><div class="row"><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
  }
  function startMake(id, i) {
    const r = F.WORKS[id].recipes[i];
    if (!F.canMake(fm(), id, i)) return K().toast('Not enough in the basket yet');
    K().closeModal();
    fs = { mode: 'make', work: id, recipe: r, n: 0, earned: 0, tips: 0, xp: 0, back: 'farm',
      done: () => { F.startMake(fm(), id, i); return `${F.WORKS[id].e} The ${esc(F.WORKS[id].name.toLowerCase())} is making ${F.ITEMS[r.out].e} ${esc(F.ITEMS[r.out].name)}. Ready after ${r.days} ${r.days === 1 ? 'night' : 'nights'}.`; } };
    show(F.makeQuestion(r, grade()));
  }

  // ---------------------------------------------------------------- the bank
  function bank() {
    const f = fm(), g = grade(), b = f.bank, due = F.bankDue(f), interest = F.interest(b.bal, g);
    const proj = F.project(b.bal, g, 6), top = Math.max(1, ...proj);
    const bars = proj.map((v, k) => `<div class="bbar"><span class="bv">${fmt(v)}</span><span class="bfill" style="height:${Math.max(4, Math.round((v / top) * 100))}%"></span><small>${k === 0 ? 'Now' : 'Week ' + k}</small></div>`).join('');
    const nextDay = F.nextBankDay(f);
    const LOG = { in: ['⬇️', 'Saved'], out: ['⬆️', 'Took out'], interest: ['✨', 'Interest'] };
    const log = b.log.map((x) => `<li><span>${LOG[x.kind][0]} ${LOG[x.kind][1]}</span><small>${x.d}</small><b class="${x.kind}">${x.kind === 'out' ? '−' : '+'}${fmt(x.amt)}</b></li>`).join('');
    K().render(header('🏦 Farm Bank', 'farm') + `<main class="farm fbank">
      <section class="bankcard">
        <div class="bk"><small>In the bank</small><b id="fbankbal">${fmt(b.bal)}</b></div>
        <div class="bk"><small>In your wallet</small><b>${fmt(f.money)}</b></div>
      </section>
      ${due > 0 && interest > 0 ? `<button class="btn big fstand" data-act="fInterest">✨ Bank day! Collect your interest${due > 1 ? ` (${due} weeks)` : ''}</button>` : ''}
      <div class="row"><button class="btn" data-act="fDeposit" ${f.money ? '' : 'disabled'}>⬇️ Save money</button><button class="btn ghost" data-act="fWithdraw" ${b.bal ? '' : 'disabled'}>⬆️ Take money out</button></div>
      <section class="flevel"><b>How the bank works</b>
        <p>${esc(F.ruleText(g))} The money is safe in the bank, and you can take it out any time to spend it.</p>
        <p class="muted">${b.bal ? (due > 0 ? 'Interest is waiting for you!' : `Next bank day in ${nextDay} ${nextDay === 1 ? 'day' : 'days'} (every 7 days).`) : 'Save some money to start your first bank week.'} The bank pays at most ${fmt(F.BANK_CAP[g === 'k' ? 0 : 1])} a week.</p></section>
      ${b.bal ? `<h2>📈 If you keep it in the bank</h2><div class="bchart" role="img" aria-label="Savings growing week by week">${bars}</div><p class="muted">Each week the bank adds interest, and next week the interest earns interest too.</p>` : ''}
      ${log ? `<h2>🧾 My bank book</h2><ul class="blog">${log}</ul>` : ''}
    </main>`, 'is-farm');
    K().setCur('farm:bank');
  }
  function bankKinds(max) {
    if (grade() === 'k') return max >= 25 ? ['q', 'd', 'n', 'p'] : ['d', 'n', 'p'];
    return payKinds(max);
  }
  function startDeposit() {
    const f = fm();
    if (!f.money) return;
    fs = { mode: 'deposit', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank',
      done: () => { F.deposit(fm(), fs.amount); return `<b>${fmt(fs.amount)}</b> is in the bank now. You have <b>${fmt(fm().bank.bal)}</b> saved.`; } };
    show({ kind: 'coins', free: true, limit: f.money, go: 'Put in the bank', coinKinds: bankKinds(f.money), text: `Tap the coins${grade() === 'k' ? '' : ' and bills'} you want to save. You have <b>${fmt(f.money)}</b> in your wallet.`, hint: 'Start with the money worth the most, then count on.', explain: '' });
  }
  function startWithdraw() {
    const f = fm();
    if (!f.bank.bal) return;
    fs = { mode: 'withdraw', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank' };
    show({ kind: 'coins', free: true, limit: f.bank.bal, go: 'Take out', coinKinds: bankKinds(f.bank.bal), text: `Tap the coins${grade() === 'k' ? '' : ' and bills'} you want to take out. You have <b>${fmt(f.bank.bal)}</b> in the bank.`, hint: '', explain: '' });
  }
  function startInterest() {
    const f = fm(), weeks = F.bankDue(f);
    if (!weeks) return bank();
    fs = { mode: 'interest', weeks, n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank' };
    interestQuestion();
  }
  // One bank day: work out this week's interest, then it is added.
  function interestQuestion() {
    const f = fm(), g = grade(), bal = f.bank.bal, [per, add] = F.bankRule(g), x = F.interest(bal, g), n = Math.floor(bal / per);
    const capped = x < n * add;
    fs.done = () => { const got = F.payInterest(fm(), g); return `The bank added <b>${fmt(got)}</b>. Now you have <b>${fmt(fm().bank.bal)}</b> saved.`; };
    const unit = per === 100 ? 'whole dollar' : fmt(per);
    const p = { type: 'interest', text: `You have <b>${fmt(bal)}</b> in the bank. The bank adds <b>${fmt(add)} for every ${unit}</b>${capped ? `, but at most <b>${fmt(x)}</b> a week` : ''}. How much interest do you get this week?`,
      hint: per === 100 ? `How many whole dollars are in ${fmt(bal)}? Each one brings 10¢.` : `How many tens are in ${bal}? Each ten brings 1¢.`,
      explain: `${fmt(bal)} has ${n} ${per === 100 ? 'whole dollars' : 'tens'}: ${n} × ${fmt(add)} = ${fmt(n * add)}${capped ? `, and the most is ${fmt(x)}` : ''}`, sale: {}, total: 0 };
    Object.assign(p, g === 'k' || x < 100 ? { kind: 'num', answer: x, unit: '¢' } : { kind: 'choice', answer: fmt(x), choices: F.moneyChoices(x, g) });
    if (!x) { F.payInterest(f, g); fs.n++; save(); return next(); } // nothing to work out on a tiny balance
    show(p);
  }

  // ---------------------------------------------------------------- routing
  function show_(arg, quiet = false) {
    clearTimeout(autoNext);
    fs = null;
    if (arg === 'shop') return shop();
    if (arg === 'bank') return F.level(fm().xp).level >= F.BANK_LV ? bank() : main();
    main();
    if (!quiet && st().settings.readAloud) MQ.speak(tipText());
  }
  const A = {
    fBed: (a, el) => bed(+a, el),
    fPen: (a, el) => pen(+a, el),
    fFeedAll: () => feedAll(),
    fCollectAll: () => collectAll(),
    fSleep: () => sleep(),
    fMarket: () => startMarket(),
    fWork: (a, el) => work(a, el),
    fPickAll: () => pickAll(),
    fPvTier: (a) => { if (!MQ.store.preview) return; Object.assign(fm(), { tier: +a, streak: 0, miss: 0 }); main(); },
    fPlantAll: () => plantAllPicker(),
    fPlantAllCrop: (a) => plantAll(a),
    fUpgrades: () => { tab = 'up'; K().go('farm:shop'); },
    fHelper: () => { const h = fm().helper; h.on = !h.on; save(); K().toast(h.on ? `🧑‍🌾 ${F.HELPER.name} is back to work` : `🧑‍🌾 ${F.HELPER.name} is taking a break (no wage)`); K().state() && (document.querySelector('.fitems') ? shop() : redraw()); },
    fMake: (a) => { const [id, i] = a.split(':'); startMake(id, +i); },
    fDeposit: () => startDeposit(),
    fWithdraw: () => startWithdraw(),
    fInterest: () => startInterest(),
    fJobs: () => startJobs(),
    fTab: (a) => { tab = a; shop(); },
    fGoal: (a) => { fm().goal = a; save(); MQ.sfx('tap'); K().toast('⭐ Saving goal set'); shop(); },
    fPlant: (a) => {
      const [i, crop] = a.split(':'), price = F.seedPrice(crop, grade());
      K().closeModal();
      if (fm().money < price) return K().toast('Not enough money yet');
      startPay(price, `seeds to grow ${F.ITEMS[crop].e} ${esc(F.ITEMS[crop].many)}`, () => {
        F.buySeed(fm(), grade(), +i, crop);
        return `${F.ITEMS[crop].e} planted! Ready in ${F.CROPS[crop].days} ${F.CROPS[crop].days === 1 ? 'day' : 'days'}.`;
      }, '🌱');
    },
    fBuy: (a) => {
      const x = F.shopItem(fm(), grade(), a);
      if (!x || fm().money < x.price) return;
      const icon = a.startsWith('decor:') ? SC.icon(a.slice(6), x.e) : x.e;
      startPay(x.price, `${x.e} ${esc(x.name)}`, () => { F.buy(fm(), grade(), a); return `${x.e} ${esc(x.name)} is yours!`; }, icon);
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
    fCoin: (a, el) => {
      if (!fs || fs.locked) return;
      const p = cur();
      if (p.pay && F.sumCoins(fs.tray) + F.COINV[a] > fm().money) return K().toast(`You only have ${fmt(fm().money)}`);
      if (p.free && F.sumCoins(fs.tray) + F.COINV[a] > p.limit) return K().toast(`You only have ${fmt(p.limit)} ${fs.mode === 'withdraw' ? 'in the bank' : 'in your wallet'}`);
      if (fs.tray.length >= 30) return;
      fs.tray.push(a);
      MQ.sfx('coin');
      const from = el && el.getBoundingClientRect();
      drawAnswer();
      const last = document.querySelector('.ftray .fcoin:last-child');
      if (last && from && !SC.reduced()) { last.classList.add('landing'); SC.fly(V.coins([a], true), from, last, { dur: 380, size: '1rem', land: () => last.classList.remove('landing') }); }
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
