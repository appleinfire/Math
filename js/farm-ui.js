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
  function tipLine() { return `<div class="buddy small"><span class="buddy-e">${MQ.face(st())}</span><div class="bubble">${esc(MQ.buddyName(st()))}: ${tipText()}</div></div>`; }
  function tipText() {
    const f = fm();
    const cheapest = Math.min(...Object.entries(F.CROPS).filter(([, c]) => c.lv <= F.level(f.xp).level).map(([id]) => F.seedPrice(id, grade())));
    const all = F.allPens(f), hungry = all.filter((p) => p.a && !p.fed);
    // a crop an order still needs that isn't growing anywhere: [order, crop]
    const next = F.wxTomorrow(f), spNext = next && next.sp;
    const needCrop = F.orderStatus(f).flatMap(({ o, have }) => Object.keys(o.items).filter((id) => F.CROPS[id] && have[id] < o.items[id] && !f.beds.some((b) => b.c === id)).map((id) => [o, id]))[0];
    let t;
    if (f.mgr.pend) t = `${F.MANAGER.name} sold things for you last night! Tap her card to get your money. ${F.MANAGER.e}`;
    else if (F.bankDue(f) > 0) t = 'It’s bank day! Your savings grew. Go to the bank to collect the interest.';
    else if (F.depositReady(f)) t = 'Your locked deposit unlocked! Go to the bank to collect it. 🔓';
    else if (F.canBuild(f, grade())) t = 'You saved enough in the bank for your Big Dream! Pay the builders 🏗️';
    else if (F.merchantHas(f) && F.merchantNights(f.day) <= 1) t = `${F.MERCHANT.name} the traveling merchant leaves ${F.merchantNights(f.day) ? 'tomorrow night' : 'tonight'}! Tap his wagon.`;
    else if (F.ordersReady(f).length) t = `${F.ordersReady(f)[0].who[1]}’s order is ready! Tap it in 📋 Orders to deliver it.`;
    else if (Object.values(f.works).some((w) => w.ready)) t = 'Something is ready in your workshop! Tap it to take it.';
    else if (f.beds.some((b) => F.cropStage(b) === 'ready')) t = 'Your crops are ripe! Tap them to pick them.';
    else if (all.some((p) => F.penReady(p))) t = all.some((p) => p.rare) ? 'Your mythic animals made something rare! Tap them to collect it. 🌟' : 'Your animals made something! Tap them to collect it.';
    else if (hungry.length && f.feed >= F.penEat(hungry[0])) t = 'Feed your animals before bed, so they grow and make things to sell.';
    else if (hungry.length) t = 'Out of feed! Buy feed 🌾 in the shop.';
    else if (Object.entries(f.works).some(([id, w]) => w.r === null && F.WORKS[id].recipes.some((r, i) => F.canMake(f, id, i)))) t = 'You have what a workshop needs. Make something worth more!';
    else if (needCrop && f.beds.some((b) => !b.c) && f.money >= F.seedPrice(needCrop[1], grade())) t = `${needCrop[0].who[1]}’s order needs ${F.ITEMS[needCrop[1]].e} ${F.ITEMS[needCrop[1]].many}. Plant some in an empty bed!`;
    else if (spNext && F.forSale(f)[spNext] && F.mgrTonight(f)) t = `Tomorrow ${F.ITEMS[spNext].e} ${F.ITEMS[spNext].many} are the ⭐ special: they sell for more. Keep them for tomorrow? Tap “Keep it” on ${F.MANAGER.name}’s card.`;
    else if (F.mgrCan(f) && !F.mgrTonight(f) && next && next.w === 'storm') t = `A storm comes tomorrow night! Let ${F.MANAGER.name} sell the rest tonight. ⛈️`;
    else if (F.mgrCan(f) && !F.mgrTonight(f)) t = `Great shift! ${F.MANAGER.name} can sell the rest of your basket tonight. ${F.MANAGER.e}`;
    else if (F.saleCount(f) && !F.mgrTonight(f)) t = F.mgrHired(f) && !F.shiftDone(f) ? `Your basket is full of good things. Open the stand: after ${F.shiftLen(f)} customers, ${F.MANAGER.name} can sell the rest.` : 'Your basket is full of good things. Open the stand and sell them!';
    else if (f.beds.some((b) => !b.c) && f.money >= cheapest) t = 'An empty garden bed! Tap it to plant seeds.';
    else if (f.beds.some((b) => b.c) || all.some((p) => p.a && p.fed)) t = 'All done for today. Tap 🌙 Sleep to start a new day.';
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
    if (g.treasure) { // a rare treasure from the merchant: he brings it on his next treasure visit
      const here = F.merchantNow(fm()) === g.treasure, day = F.merchantNext(fm(), true);
      const when = here ? `${esc(F.MERCHANT.name)} is here with it now!` : `${esc(F.MERCHANT.name)} brings it on farm day ${day}`;
      return `<button class="fgoal rare" data-act="${here ? 'fMerchant' : 'go'}" data-arg="farm" aria-label="Saving goal">
        <span class="fgoal-e">${g.e}</span><span class="fgoal-t"><b>Saving for: ✨ ${esc(g.name)}</b>
        <span class="fbar"><span style="width:${pctv}%"></span></span>
        <small>${left > 0 ? `${fmt(total)} of ${fmt(g.price)}${fm().bank.bal ? ' (with the bank)' : ''} · ${fmt(left)} to go · ${when}` : fm().money >= g.price ? `You have enough! ${when}` : `You have enough with your bank savings! ${when}`}</small></span></button>`;
    }
    return `<button class="fgoal" data-act="go" data-arg="farm:shop" aria-label="Saving goal">
      <span class="fgoal-e">${g.e}</span><span class="fgoal-t"><b>Saving for: ${esc(g.name)}</b>
      <span class="fbar"><span style="width:${pctv}%"></span></span>
      <small>${left > 0 ? `${fmt(total)} of ${fmt(g.price)}${fm().bank.bal ? ' (with the bank)' : ''} · ${fmt(left)} to go` : g.locked ? `You have enough! It opens at farm level ${g.lv}.` : fm().money >= g.price ? 'You have enough! Buy it in the shop 🎉' : 'You have enough with your bank savings! Take money out of the bank to buy it.'}${left > 0 && g.locked ? ` · opens at level ${g.lv}` : ''}</small></span></button>`;
  }
  function main() {
    const f = fm(), g = grade();
    const lv = F.level(f.xp), pctv = Math.round(((f.xp - lv.from) / (lv.to - lv.from)) * 100);
    const tier = F.tiers(g)[F.tierNow(f, g) - 1];
    const n = F.saleCount(f), all = F.basketCount(f), kept = F.kept(f);
    const basket = Object.entries(f.basket).filter(([, c]) => c > 0).map(([id, c]) => `<span class="fchip ${F.ITEMS[id].myth ? 'myth' : ''}">${F.ie(id)} ${c} <small>× ${fmt(F.price(id, g))}</small>${kept[id] ? `<small class="fkept" title="${kept[id]} kept for your orders">📋 ${kept[id]}</small>` : ''}</span>`).join('') || '<span class="muted">Empty. Pick crops and collect from animals.</span>';
    const hungry = F.allPens(f).some((p) => p.a && !p.fed), ready = F.allPens(f).some((p) => F.penReady(p));
    const ripe = f.beds.filter((b) => F.cropStage(b) === 'ready').length, empty = F.emptyBeds(f).length;
    const bankDay = F.bankDue(f) > 0, nights = F.nightsToBankDay(f.day);
    K().render(header('🌻 Sunny Farm') + `<main class="farm">
      <section class="flevel">
        <div class="flv"><b>Farm level ${lv.level} · ${esc(F.title(lv.level))}</b><span>Farm day ${f.day} · ${F.STANDS[f.stand].e} ${esc(F.STANDS[f.stand].name)}</span></div>
        <div class="fbar xp" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pctv}%"></span></div>
        <small class="muted">${f.xp - lv.from} / ${lv.to - lv.from} XP to level ${lv.level + 1} · Money problems: ${tier.ahead ? '⭐ ' : ''}${esc(tier.name)}</small>
      </section>
      ${MQ.store.preview ? pvTiers() : ''}
      ${wxBar()}
      ${goalBar()}
      ${dreamCard()}
      ${merchantCard()}
      ${charmStrip()}
      ${bankDay ? `<button class="fbankday" data-act="go" data-arg="farm:bank">🏦 <b>Bank day!</b> Your savings earned interest. Tap to collect it.</button>` : ''}
      ${mgrCard()}
      ${orderStrip()}
      ${tipLine()}
      <button class="btn big fstand" data-act="fMarket" ${n ? '' : 'disabled'}>🏪 Open the stand ${n ? `· ${n} to sell` : all ? '· all kept for orders' : '· basket is empty'}</button>
      <div class="fbtns">
        <button class="tile" data-act="go" data-arg="farm:shop"><span class="ti">🛒</span><b>Shop</b><small>Animals, feed, more</small></button>
        ${lv.level >= F.BANK_LV ? `<button class="tile ${bankDay ? 'hot' : ''}" data-act="go" data-arg="farm:bank"><span class="ti">🏦</span><b>Bank</b><small>${bankDay ? '🏦 Bank day today!' : F.depositReady(f) ? '🔓 Deposit unlocked!' : f.bank.bal ? `${fmt(f.bank.bal)} · 🏦 in ${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Save and earn'}</small></button>` : `<button class="tile locked" disabled><span class="ti">🏦</span><b>Bank</b><small>🔒 Level ${F.BANK_LV}</small></button>`}
        <button class="tile" data-act="fJobs"><span class="ti">🧹</span><b>Odd jobs</b><small>Earn at the big market</small></button>
        <button class="tile" data-act="fSleep"><span class="ti">🌙</span><b>Sleep</b><small>Start farm day ${f.day + 1}</small></button>
      </div>
      ${SC.farm(f, g)}
      ${f.helper.hired ? `<div class="fhelp">🧑‍🌾 <span>Farmhand ${F.HELPER.name} ${f.helper.on ? `feeds the animals at night and collects in the morning · ${fmt(F.HELPER.wage[g === 'k' ? 0 : 1])} a day` : 'is taking a break'}</span><button class="btn ghost" data-act="fHelper">${f.helper.on ? 'Pause' : 'Back to work'}</button></div>` : ''}
      <h2>🧺 Basket</h2>
      <div class="fbasket" id="fbasket">${basket}</div>
      ${Object.keys(kept).length ? '<p class="muted small">📋 = kept for your orders: customers at the stand don’t buy it.</p>' : ''}
      <p class="muted center">Sold ${f.stats.sold} things · earned ${fmt(f.stats.earned)} in all</p>
    </main>
    <nav class="fdock" aria-label="Farm resources and quick actions"><div class="fdock-in">
      <div class="fdock-row">
        <span class="fstat" id="fdmoney" title="Money">💰 <b>${fmt(f.money)}</b></span>
        <span class="fstat" id="fdbasket" title="In the basket">🧺 <b>${all}</b></span>
        <span class="fstat" id="ffeed" title="Feed">🌾 <b>${f.feed}</b></span>
        <button class="btn fsell" data-act="fMarket" ${n ? '' : 'disabled'}>🏪 Sell</button>
      </div>
      ${bankDay || ripe || empty >= 2 || hungry || ready ? `<div class="fdock-acts">
        ${bankDay ? '<button class="btn ghost" data-act="go" data-arg="farm:bank">🏦 Collect interest</button>' : ''}
        ${ripe ? '<button class="btn ghost" data-act="fPickAll">🧺 Pick all</button>' : ''}
        ${ready ? '<button class="btn ghost" data-act="fCollectAll">🥚 Collect all</button>' : ''}
        ${hungry ? '<button class="btn ghost" data-act="fFeedAll">🌾 Feed all</button>' : ''}
        ${empty >= 2 ? '<button class="btn ghost" data-act="fPlantAll">🌱 Plant all</button>' : ''}
      </div>` : ''}
    </div></nav>`, 'is-farm' + wxClass(f));
    K().setCur('farm');
    dockChanges({ money: f.money, basket: all, feed: f.feed });
    if (F.dreamOpen(f) && !f.dream.seen && !MQ.store.preview) setTimeout(() => { if (!$('#modal') && $('.fdream')) dreamIntro(); }, 500);
    else if (F.ordersOpen(f) && !f.orders.seen && !MQ.store.preview) setTimeout(() => { if (!$('#modal') && $('.scene') && !fs) orderIntro(); }, 500);
    else if (F.wxToday(f) && !f.wx.seen && !MQ.store.preview) setTimeout(() => { if (!$('#modal') && $('.scene') && !fs) wxIntro(); }, 500);
  }
  // The dock numbers bump and show "+3" / "−2" when they change (after the things have flown there).
  let lastDock = null;
  function dockChanges(now) {
    const before = lastDock;
    lastDock = now;
    if (!before) return;
    const ids = { money: '#fdmoney', basket: '#fdbasket', feed: '#ffeed' };
    for (const k of Object.keys(ids)) {
      const d = now[k] - before[k];
      if (!d) continue;
      setTimeout(() => {
        const el = $(ids[k]);
        if (!el) return;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        const t = document.createElement('i');
        t.className = 'delta ' + (d > 0 ? 'up' : 'down');
        t.textContent = (d > 0 ? '+' : '−') + (k === 'money' ? fmt(Math.abs(d)) : Math.abs(d));
        el.appendChild(t);
        setTimeout(() => t.remove(), 1400);
      }, SC.reduced() ? 0 : 600);
    }
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
      SC.flyMany(F.ITEMS[crop].e, Math.min(n, 5), from, '#fdbasket');
      SC.floatText(from, `+${n} ${F.ITEMS[crop].e}`);
      return;
    }
    if (s !== 'empty') {
      const left = F.cropDays(b) - b.g;
      return K().modal(`<div class="bigemoji">${s === 'seed' ? '🌱' : '🌿'}</div><div class="mtitle">${esc(cap(F.ITEMS[b.c].many))}</div><p>Ready in ${left} ${left === 1 ? 'day' : 'days'}: ${F.cropYield(b, f)} ${F.ITEMS[b.c].e}${b.again ? ' (the second harvest)' : ''}. Tap 🌙 Sleep to make the night pass.</p>${b.rent ? `<p class="muted">🚜 A rented bed: it goes back on farm day ${f.boosts.field.until}.</p>` : bedUps(b)}<div class="row">${b.rent ? '' : '<button class="btn ghost" data-act="fUpgrades">⬆️ Upgrades</button>'}<button class="btn" data-act="closeModal">OK</button></div>`);
    }
    plantPicker(i);
  }
  function plantPicker(i) {
    const f = fm(), g = grade(), L = F.level(f.xp).level, rent = f.beds[i].rent && f.boosts.field;
    const rows = Object.entries(F.CROPS).map(([id, c]) => {
      const it = F.ITEMS[id], price = F.seedPrice(id, g), locked = c.lv > L, poor = f.money < price, late = !locked && !F.canPlant(f, i, id);
      return `<button class="fseed" data-act="fPlant" data-arg="${i}:${id}" ${locked || poor || late ? 'disabled' : ''}>
        <span class="fe">${locked ? '🔒' : it.e}</span><span class="fseed-t"><b>${esc(it.many)}</b>
        <small>${locked ? `Opens at farm level ${c.lv}` : late ? 'Not ready before the field goes back' : `${c.yield} in ${c.days} ${c.days === 1 ? 'day' : 'days'} · sell ${fmt(F.price(id, g))} each`}</small></span>
        <span class="fprice">${fmt(price)}</span></button>`;
    }).join('');
    K().modal(`<div class="mtitle">Plant seeds</div><p class="muted">You have ${fmt(f.money)}.</p>${rent ? `<p class="fmove">🚜 A rented bed: it goes back on farm day ${rent.until}. Plant a crop that is ready by then, and the farmer picks it for you if you don’t.</p>` : bedUps(f.beds[i])}<div class="fseeds">${rows}</div><div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrade beds</button><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
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
      const it = F.ITEMS[id], price = F.seedPrice(id, g), nc = F.emptyBeds(f, id).length, poor = f.money < nc * price; // a rented bed takes only quick crops
      return `<button class="fseed" data-act="fPlantAllCrop" data-arg="${id}" ${poor || nc < 1 ? 'disabled' : ''}>
        <span class="fe">${it.e}</span><span class="fseed-t"><b>${esc(it.many)}</b><small>${poor ? 'Not enough money for all the beds' : `${nc} ${nc === 1 ? 'packet' : 'packets'} · ${fmt(price)} each${nc < n ? ' (too slow for the rented field)' : ''}`}</small></span>
        <span class="fprice">${fmt(price)}</span></button>`;
    }).join('');
    K().modal(`<div class="mtitle">Plant all ${n} empty beds</div><p class="muted">One packet of seeds for each bed. You have ${fmt(f.money)}.</p><div class="fseeds">${rows}</div><div class="row"><button class="btn ghost" data-act="closeModal">Not now</button></div>`);
  }
  function plantAll(crop) {
    const f = fm(), g = grade(), n = F.emptyBeds(f, crop).length, one = F.seedPrice(crop, g), it = F.ITEMS[crop];
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
    got.forEach(([r, e, n], k) => { SC.flyMany(e, Math.min(n, 4), r, '#fdbasket', { delay: k * 150 }); SC.floatText(r, `+${n} ${e}`, { delay: k * 150 }); });
  }
  const penEl = (i) => document.querySelector(`.fpen[data-arg="${i}"]`);
  const houseEl = (a) => document.querySelector(`.fhouse[data-arg="${a}"]`);
  // Every pen and house with animals, with how to find it on the screen: [{ p, el, i (a pen) or a (a house) }]
  const animalPlaces = () => { const f = fm(); return f.pens.map((p, i) => ({ p, i, el: () => penEl(i) })).concat(Object.entries(f.yard || {}).map(([a, p]) => ({ p, a, el: () => houseEl(a) }))).filter((x) => x.p && x.p.a); };
  function pen(i, el) {
    const p = fm().pens[i];
    if (p && p.a) animals({ p, i, el: () => penEl(i) }, el);
  }
  function house(a, el) {
    const p = (fm().yard || {})[a];
    if (p) animals({ p, a, el: () => houseEl(a) }, el);
  }
  // A tap on a pen or a house: collect what the animals made, or feed them, or see how they are doing.
  function animals(w, el) {
    const f = fm(), p = w.p, where = w.a ? `this ${F.HOUSES[w.a].name.toLowerCase()}` : 'this pen';
    if (F.penReady(p)) {
      const loot = F.penLoot(p), ic = F.ie(loot[0][0]), n = F.collectPen(f, p), from = el && el.getBoundingClientRect();
      MQ.sfx(p.a && loot[0][0] !== F.ANIMALS[p.a].item ? 'shimmer' : 'correct');
      xp(1);
      save();
      redraw();
      SC.flyMany(ic, Math.min(n, 5), from, '#fdbasket');
      SC.floatText(from, `+${n} ${ic}`);
      return;
    }
    const eat = F.penEat(p);
    const r = F.feedPen(f, p);
    if (r === 'ok') {
      MQ.sfx('tap');
      const from = $('#ffeed') && $('#ffeed').getBoundingClientRect();
      save();
      redraw();
      SC.fly('🌾', from, w.el(), { land: () => { MQ.sfx('correct'); SC.burst(w.el()); hop(w.el()); SC.floatText(w.el(), `−${eat} 🌾`, { minus: true }); } });
      return;
    }
    const sell = w.a ? '' : `<button class="btn ghost" data-act="fSellAsk" data-arg="${w.i}">💰 Sell</button>`;
    if (r === 'nofeed') return K().modal(`<div class="bigemoji">🌾</div><div class="mtitle">Not enough feed</div><p>${F.penCount(p) > 1 ? F.penCount(p) + ' × ' : ''}${esc(F.ANIMALS[p.a].name)} ${F.penCount(p) > 1 ? 'eat' : 'eats'} ${F.penEat(p)} 🌾 a day. You have ${f.feed}.</p><div class="row"><button class="btn ghost" data-act="closeModal">Later</button>${sell}<button class="btn" data-act="go" data-arg="farm:shop">Buy feed</button></div>`);
    const a = F.ANIMALS[p.a], sg = F.animalStage(p);
    const k = F.penMakes(p), cnt = F.penCount(p);
    if (F.mythOn(f, p.a)) { // a Mythic Feed week
      const M = F.MYTHS[p.a], left = f.charms.myth.until - f.day;
      return K().modal(`<div class="tcard c-myth"><div class="dbuilt-rays"></div><div class="tpic">${MQ.mythArt(p.a)}</div><div class="mtitle">🌟 ${cnt > 1 ? cnt + ' × ' : ''}${esc(cnt > 1 ? M.many : M.name)}</div>
        <p>${sg < 2 ? `Grows up after ${a.grow[1] - p.g} more fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}. Then ${where} gives ${k} ${F.ITEMS[M.item].e} ${esc(F.ITEMS[M.item].many)} every day it is fed.` : `${cap(where)} gives ${k} ${F.ITEMS[M.item].e} ${esc(k === 1 ? F.ITEMS[M.item].name : F.ITEMS[M.item].many)} every morning after a day it was fed: ${fmt(F.price(M.item, grade()))} each!`}</p>
        <p class="muted">The Mythic Feed works ${left === 1 ? 'one more night' : `${left} more nights`}. Already fed today: tap 🌙 Sleep.</p></div><div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
    }
    const room = w.a && cnt < 1 + F.YARD_ROOM ? `<p class="muted">Room for ${cnt + 1}: ⬆️ Upgrades in the shop.</p>` : '';
    K().modal(`<div class="bigemoji">${sg ? a.e : a.baby}</div><div class="mtitle">${w.a ? `${esc(F.HOUSES[w.a].name)} · ` : ''}${cnt > 1 ? cnt + ' × ' : ''}${esc(a.name)}</div><p>${sg < 2 ? `Grows up after ${a.grow[1] - p.g} more fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}. Then ${where} gives ${k} ${F.ITEMS[a.item].e} every day it is fed.` : `${cap(where)} gives ${k} ${F.ITEMS[a.item].e} every morning after a day it was fed.`}</p>${room}<p class="muted">Already fed today. Tap 🌙 Sleep for a new day.</p><div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrades</button>${sell}<button class="btn" data-act="closeModal">OK</button></div>`);
  }
  // a quick happy jump of the animal in a pen or a house
  function hop(el) {
    const w = el && el.querySelector('.bob, .bee');
    if (!w) return;
    w.classList.remove('hop');
    void w.offsetWidth;
    w.classList.add('hop');
  }
  function feedAll() {
    const f = fm(), from = $('#ffeed') && $('#ffeed').getBoundingClientRect(), fedNow = [];
    let short = 0;
    animalPlaces().forEach((w) => { if (w.p.fed) return; F.feedPen(f, w.p) === 'ok' ? fedNow.push(w) : short++; });
    if (fedNow.length) MQ.sfx('tap');
    if (short) K().toast(`Not enough feed for ${short} more ${short === 1 ? 'animal' : 'animals'}: buy 🌾 in the shop.`);
    save();
    redraw();
    fedNow.forEach((w, k) => SC.fly('🌾', from, w.el(), { delay: k * 140, land: () => { SC.burst(w.el(), '❤️', 2); hop(w.el()); SC.floatText(w.el(), `−${F.penEat(w.p)} 🌾`, { minus: true }); } }));
  }
  function collectAll() {
    const f = fm(), got = [];
    animalPlaces().forEach((w) => { if (F.penReady(w.p)) { const r = w.el().getBoundingClientRect(), e = F.ie(F.penLoot(w.p)[0][0]); got.push([r, e, F.collectPen(f, w.p)]); } });
    const n = U.sum(got.map((x) => x[2]));
    MQ.sfx('correct');
    xp(n);
    save();
    redraw();
    got.forEach(([r, e, c], k) => { SC.flyMany(e, Math.min(c, 5), r, '#fdbasket', { delay: k * 200 }); SC.floatText(r, `+${c} ${e}`, { delay: k * 200 }); });
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
    if (news.bankDay) lines.push('🏦 It’s bank day! Your savings earned interest: go to the bank to collect it.');
    if (news.depReady) lines.push(`🔓 Your locked deposit unlocked: <b>${fmt(news.depReady)}</b> is waiting at the bank!`);
    if (news.depNew) lines.push(`<span class="mline">🏦 New at the bank: a <b>locked deposit</b>. Your savings are above ${fmt(F.bankTop(f.bank.acct, grade()))}: lock some, and every $5 comes back as $6!</span>`);
    lines.push(...wxNews(news.wx));
    if (news.mgr) lines.unshift(`<span class="mline">${F.MANAGER.e} <b>${esc(F.MANAGER.name)}</b> sold ${news.mgr.n} ${news.mgr.n === 1 ? 'thing' : 'things'} from your basket last night. Your money is waiting!</span>`);
    lines.push(...orderLines(news.orders));
    if (news.gold) lines.push(`🪿 The Golden Goose laid a golden egg: <b>+${fmt(news.gold)}</b> in your wallet!`);
    if (news.rainbow) lines.push('🐑 The Rainbow Sheep gave a ball of 🌈 rainbow wool. It is in your basket.');
    if (news.fairy) lines.push(`🧚 The Feed Fairy fed your hungry ${esc(news.fairy.map((a) => F.ANIMALS[a].name.toLowerCase()).join(' and '))}.`);
    const mc = news.merchant;
    if (mc) {
      const m = mc[1], t = m.item && F.TREASURES[m.item], wares = (m.charms || []).map((c) => `${F.CHARMS[c].e} <b>${esc(F.charmName(c, m.a))}</b>`).join(' and ');
      lines.unshift(mc[0] === 'came' ? `<span class="mline">🧳 <b>${esc(F.MERCHANT.name)}</b>, the traveling merchant, is here with ${wares}${t ? `, and a ✨ rare treasure: ${t.e} <b>${esc(t.name)}</b>` : ''}! He stays ${F.merchantNights(f.day) + 1} days.</span>`
        : mc[0] === 'last' ? `<span class="mline">🧳 ${esc(F.MERCHANT.name)} leaves <b>tonight</b>! Tap his wagon to see what he still has.</span>`
          : `🧳 ${esc(F.MERCHANT.name)} left. He comes back on farm day ${F.merchantNext(f)} with new week charms.`);
    }
    const h = news.helper;
    if (h && h.unpaid) lines.push(`🧑‍🌾 ${F.HELPER.name} didn’t work last night: there wasn’t ${fmt(h.wage)} in your wallet for the wage.`);
    else if (h) lines.push(`🧑‍🌾 ${F.HELPER.name} was paid ${fmt(h.wage)}, fed ${h.fed} ${h.fed === 1 ? 'pen' : 'pens'}${h.houses ? ` and ${h.houses} barnyard ${h.houses === 1 ? 'house' : 'houses'}` : ''}${h.collected ? `, collected ${h.collected}` : ''}${h.picked ? `, picked ${h.picked}` : ''}.${h.short ? ` Not enough feed for ${h.short}!` : ''}`);
    for (const it of news.cooked) lines.push(`${F.ITEMS[it].e} Your ${esc(F.ITEMS[it].name)} is ready in the workshop!`);
    for (const [a, sg] of news.grew) lines.push(`${F.ANIMALS[a].e} Your ${esc(F.ANIMALS[a].name.toLowerCase())} ${sg === 2 ? 'is all grown up!' : 'got bigger'}`);
    for (const [a, n] of Object.entries(count(news.hungry))) lines.push(`${F.ANIMALS[a].e} ${n > 1 ? n + ' ' : ''}${esc(F.ANIMALS[a].name.toLowerCase())}${n > 1 ? 's were' : ' was'} hungry and didn’t grow. Feed animals before bed!`);
    for (const x of news.boostEnd || []) if (x.id === 'field') lines.push(`🚜 The rented field went back today${x.picked ? `: the farmer picked your last ${x.picked} crops for you. They are in your basket` : ''}.`);
    const b = news.built, ends = (charmEnds = (news.charmEnd || []).concat((news.boostEnd || []).map((x) => Object.assign({ boost: true }, x))));
    const wx = F.wxToday(f), next = F.wxTomorrow(f);
    K().modal(`${b ? builtBlock(b) : `<div class="bigemoji">${wx ? F.WX[wx.w].e : '☀️'}</div>`}<div class="mtitle">Good morning! Farm day ${f.day}</div>
      ${wxBlock(f)}
      ${lines.length ? `<ul class="funlocks">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : b || ends.length || wx ? '' : '<p>A quiet night on the farm.</p>'}
      ${ends.map(charmEndBlock).join('')}
      <div class="row">${fm().mgr.pend ? `<button class="btn ghost" data-act="fMgrCollect">${F.MANAGER.e} Get ${esc(F.MANAGER.name)}’s money</button>` : ''}<button class="btn" data-act="closeModal">Let’s go!</button>${b && !F.dreamDone(fm()) ? '<button class="btn ghost" data-act="go" data-arg="farm:dreams">🏗️ Big Dreams</button>' : ''}</div>`);
    if (b) {
      MQ.sfx('fanfare');
      MQ.confetti(b.done ? 240 : 150, b.d.castle ? { colors: ['#ffd23f', '#ff8fe0', '#9d7bff', '#ffffff'], shape: 'star', rain: b.done } : b.done ? { colors: ['#ffd23f', '#ffe066', '#ff8a5a', '#7ed957'], shape: 'star' } : {});
      if (st().settings.voice !== false) MQ.speak(b.done ? `Your ${b.d.name} is finished!` : `The builders finished the ${b.st.name.toLowerCase()}!`);
      K().checkBadges();
    } else {
      MQ.sfx('reward');
      if (wx && st().settings.readAloud) MQ.speak(`Today: ${F.WX[wx.w].name}.${next ? ` Tomorrow: ${F.WX[next.w].name}.` : ''}`);
    }
  }
  // The morning after the builders worked: the new stage, glowing (a finished dream gets the golden treatment).
  function builtBlock(b) {
    const g = grade(), pay = b.st.pay[g === 'k' ? 0 : 1], k = F.DREAMS.indexOf(b.d), next = F.DREAMS[k + 1];
    const all = U.sum(F.dreamIncome(fm(), g).map((x) => x[2]));
    return `<div class="dbuilt t-${b.d.id} ${b.done ? 'done' : ''}"><div class="dbuilt-rays"></div><div class="dpic">${MQ.dreamArt(b.d.id, b.done ? b.d.stages.length : b.i + 1)}</div>
      <div class="dbuilt-t">${b.done ? `🎉 Your <b>${esc(b.d.name)}</b> is finished!` : `🏗️ The builders finished: <b>${b.st.e} ${esc(b.st.name)}</b>!`}</div>
      ${pay ? `<p>It earns <b>${fmt(pay)}</b> every bank day${all > pay ? `. All your buildings: <b>${fmt(all)}</b> every bank day` : ''}.</p>` : b.d.castle ? `<p>${b.done ? '👑 You built a castle! You are a true Farm Royal.' : 'The castle is growing. Keep saving!'}</p>` : ''}
      ${b.done && next ? `<p class="muted">Next Big Dream: ${next.e} <b>${esc(next.name)}</b></p>` : ''}</div>`;
  }
  // Redraw the farm after a tap without moving the page (the app's render scrolls to the top).
  function redraw() { if (fs) return; keepY(main); }
  function keepY(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
  let backY = null; // where the farm was scrolled before the stand, odd jobs or paying, to come back to the same spot

  // ---------------------------------------------------------------- Big Dreams
  // On the farm: the dream being built, with the next stage and how much of it is saved in the bank.
  function dreamCard() {
    const f = fm(), g = grade();
    if (!F.dreamOpen(f)) return '';
    if (F.dreamDone(f)) return `<button class="fdream t-castle done" data-act="go" data-arg="farm:dreams"><span class="fdream-pic">${MQ.dreamArt('castle', 5)}</span><span class="fdream-t"><b>👑 Every Big Dream is built!</b><small>Your buildings earn ${fmt(U.sum(F.dreamIncome(f, g).map((x) => x[2])))} every bank day</small></span></button>`;
    const n = F.dreamNext(f, g), have = Math.min(f.bank.bal, n.cost), ready = F.canBuild(f, g);
    const line = f.dream.b ? `🏗️ Builders at work tonight: ${n.st.e} ${esc(n.st.name)}. Tap 🌙 Sleep!`
      : ready ? `🎉 Saved! Pay the builders for ${n.st.e} ${esc(n.st.name)}`
        : `${n.st.e} ${esc(n.st.name)}: ${fmt(f.bank.bal)} of ${fmt(n.cost)} in the bank`;
    return `<button class="fdream t-${n.d.id} ${ready ? 'hot' : ''}" data-act="go" data-arg="farm:dreams" aria-label="Big Dream: ${esc(n.d.name)}">
      <span class="fdream-pic">${MQ.dreamArt(n.d.id, f.dream.s, { building: f.dream.b })}</span>
      <span class="fdream-t"><b>🏗️ Big Dream: ${esc(n.d.name)}</b>${f.dream.b || ready ? '' : `<span class="fbar"><span style="width:${Math.round((have / n.cost) * 100)}%"></span></span>`}<small>${line}</small></span></button>`;
  }
  // ---------------------------------------------------------------- the traveling merchant
  // On the farm while he is here: what he brought and when he leaves (tap: his wagon opens).
  function merchantCard() {
    const f = fm(), g = grade(), m = F.merchantHere(f), w = F.merchantWares(f);
    if (!m || (!w.item && !w.charms.length)) return '';
    const n = F.merchantNights(f.day);
    const things = w.charms.map((c) => `${F.CHARMS[c].e} ${esc(F.CHARMS[c].name)} · ${fmt(m.cost[c])}`).concat(w.item ? [`✨ ${F.TREASURES[w.item].e} ${esc(F.TREASURES[w.item].name)} · ${fmt(F.TREASURES[w.item].cost[g === 'k' ? 0 : 1])}`] : []);
    const pic = w.item ? MQ.treasureArt(w.item) : w.charms.includes('myth') ? MQ.mythArt(m.a) : MQ.charmArt(w.charms[0]);
    return `<button class="fmerchant" data-act="fMerchant" aria-label="${esc(F.MERCHANT.name)}, the traveling merchant">
      <span class="fm-wagon">${MQ.wagonArt()}</span>
      <span class="fdream-t"><b>🧳 ${esc(F.MERCHANT.name)} is here!</b><small>${things.join('<br>')}</small><small>${n ? `Leaves in ${n} ${n === 1 ? 'night' : 'nights'}` : '<b>Leaves tonight!</b>'}</small></span>
      <span class="fm-gem">${pic}</span></button>`;
  }
  const charmPic = (id, a) => (id === 'myth' && a ? MQ.mythArt(a) : MQ.charmArt(id));
  // What a week charm could bring this farm, in a line (the Golden Piggy: worked out from the savings right now).
  function charmHelp(id, m) {
    const f = fm(), g = grade(), cost = m.cost[id];
    if (id === 'piggy') {
      const x = F.interest(f.bank.bal, g, f.bank.acct);
      if (!x) return '<p class="mc-help">💡 You have nothing saved in the bank yet, so double interest would be nothing too.</p>';
      return `<p class="mc-help">💡 With <b>${fmt(f.bank.bal)}</b> in the bank, the interest is about <b>${fmt(x)}</b>. Doubled, that is <b>+${fmt(x)}</b> more${x > cost ? `, and the piggy costs ${fmt(cost)}.` : `. The piggy costs ${fmt(cost)}: save more first, or it doesn’t pay off!`}</p>`;
    }
    const gain = F.charmGain(id, f, g, m.a);
    return `<p class="mc-help">💡 It can bring about <b>+${fmt(gain)}</b> in its week${id === 'myth' ? ' if you feed them every day' : id === 'clover' ? ' if you sell a lot at the stand' : ' if you keep your beds planted'}.</p>`;
  }
  function merchant() {
    const f = fm(), g = grade(), m = F.merchantHere(f);
    if (!m) return K().toast(`${F.MERCHANT.name} has left`);
    const w = F.merchantWares(f), n = F.merchantNights(f.day), bank = f.bank.bal;
    const charms = (m.charms || []).map((id) => {
      const c = F.CHARMS[id], cost = m.cost[id], got = (m.got || {})[id];
      const btn = got ? '<span class="fown">✓ Working!</span>' : f.money >= cost ? `<button class="btn" data-act="fBuyCharm" data-arg="${id}">Buy · ${fmt(cost)}</button>` : `<span class="flock">${fmt(cost)} · ${fmt(cost - f.money)} more</span>`;
      return `<div class="mcharm c-${id} ${got ? 'got' : ''}"><span class="mc-pic">${charmPic(id, m.a)}</span><span class="mc-t"><b>${c.e} ${esc(F.charmName(id, m.a))}</b><small>${esc(F.charmNote(id, g, fmt, m.a))}</small>${got ? '' : charmHelp(id, m)}</span><span class="mc-buy">${btn}</span></div>`;
    }).join('');
    let rare = '';
    if (w.item) {
      const t = F.TREASURES[w.item], cost = t.cost[g === 'k' ? 0 : 1];
      let plan;
      if (f.money >= cost) plan = `<button class="btn big tbuy" data-act="fBuyTreasure">Buy it · ${fmt(cost)}</button>`;
      else if (f.money + bank >= cost) plan = `<p>You have <b>${fmt(f.money)}</b> in your wallet and <b>${fmt(bank)}</b> in the bank. Take <b>${fmt(cost - f.money)}</b> out of the bank, and it’s yours!</p><button class="btn" data-act="go" data-arg="farm:bank">🏦 Go to the bank</button>`;
      else {
        const need = cost - f.money - bank, per = F.perDayToSave(need, n, g), goal = f.goal === 'treasure:' + w.item;
        plan = `<p>You have <b>${fmt(f.money)}</b>${bank ? ` + <b>${fmt(bank)}</b> in the bank` : ''}. You need <b>${fmt(need)}</b> more.</p>
          <p class="tplan">📅 ${per <= F.goodDay(F.level(f.xp).level, g).total ? `Save about <b>${fmt(per)}</b> ${n ? 'a day' : 'today'} to buy it before he leaves. Or save` : 'Save'} up for it: he brings it again on farm day <b>${F.merchantNext(f, true)}</b>.</p>
          ${goal ? '<span class="fown">⭐ Your saving goal</span>' : `<button class="btn ghost" data-act="fTreasureGoal" data-arg="${w.item}">⭐ Save up for it</button>`}`;
      }
      rare = `<div class="tcard t-${w.item}"><div class="dbuilt-rays"></div><div class="tpic">${MQ.treasureArt(w.item)}</div>
        <div class="ttag">✨ Rare treasure · stays on your farm for good</div><div class="mtitle">${t.e} ${esc(t.name)}</div>
        <p>${esc(F.treasureNote(w.item, g, fmt))}</p><div class="tprice">${fmt(cost)}</div></div>${plan}`;
    } else if (!m.item || (f.treasure || {})[m.item]) {
      const next = F.nextTreasure(f);
      if (next) { const t = F.TREASURES[next]; rare = `<p class="mrare-next">✨ Rare treasures come every 2nd visit. Next: ${t.e} <b>${esc(t.name)}</b> (${fmt(t.cost[g === 'k' ? 0 : 1])}) on farm day ${F.merchantNext(f, true)}.${f.goal === 'treasure:' + next ? ' ⭐ Your saving goal.' : ` <button class="btn ghost" data-act="fTreasureGoal" data-arg="${next}">⭐ Save up</button>`}</p>`; }
    }
    K().modal(`<div class="mhead"><span class="mh-wagon">${MQ.wagonArt()}</span><span><span class="mtitle">${esc(F.MERCHANT.name)}</span><small class="muted">The traveling merchant · ${n ? `leaves in ${n} ${n === 1 ? 'night' : 'nights'}` : '<b>leaves tonight!</b>'}</small></span></div>
      <h3 class="mh3">✨ Week charms</h3><p class="muted small">Magic for ${F.CHARM_NIGHTS} days. Used well, it brings back more than it costs.</p>
      <div class="mcharms">${charms}</div>
      ${rare}
      <p class="muted">You have <b>${fmt(f.money)}</b> in your wallet. He comes back on farm day ${F.merchantNext(f)}.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Maybe later</button></div>`);
    MQ.sfx('shimmer');
  }
  function buyTreasure() {
    const f = fm(), g = grade(), id = F.merchantNow(f), t = id && F.TREASURES[id];
    K().closeModal();
    if (!t || f.money < t.cost[g === 'k' ? 0 : 1]) return;
    startPay(t.cost[g === 'k' ? 0 : 1], `the ${t.e} ${esc(t.name)}`, () => {
      const x = F.buyTreasure(fm(), grade());
      if (!x) return 'He already left.';
      MQ.confetti(200, { colors: ['#ffd23f', '#ff8fe0', '#9ff0ff', '#7ed957'], shape: 'star' });
      MQ.sfx('fanfare');
      return `✨ The ${x.e} <b>${esc(x.name)}</b> is yours, for good! ${esc(F.treasureNote(id, grade(), fmt))}`;
    }, MQ.treasureArt(id));
  }
  function buyCharm(id) {
    const f = fm(), m = F.merchantHere(f), cost = m && m.cost[id];
    K().closeModal();
    if (!m || !F.merchantWares(f).charms.includes(id) || f.money < cost) return;
    startPay(cost, `the ${F.CHARMS[id].e} ${esc(F.charmName(id, m.a))}`, () => {
      const x = F.buyCharm(fm(), grade(), id);
      if (!x) return 'He already left.';
      MQ.confetti(140, { colors: id === 'clover' ? ['#7ed957', '#ffd23f', '#ffffff'] : id === 'sun' ? ['#ffd23f', '#ff9a2e', '#fff3a6'] : id === 'piggy' ? ['#ffd23f', '#ffe066', '#ff8fb3'] : ['#ff8fe0', '#9d7bff', '#ffd23f', '#9ff0ff'], shape: 'star' });
      MQ.sfx('fanfare');
      return id === 'myth' ? `🌟 Your ${esc(F.MYTHS[x.a].of)} are <b>${esc(F.MYTHS[x.a].many)}</b> now, for ${F.CHARM_NIGHTS} nights! Feed them every day.`
        : id === 'piggy' ? '🐷 The Golden Piggy is waiting for bank day: the bank will pay your interest twice!'
          : `${x.e} The <b>${esc(x.name)}</b> works for ${F.CHARM_NIGHTS} days, starting now!`;
    }, charmPic(id, m.a));
  }
  // The charms working now, on the farm: how long they work and what they brought so far.
  function charmStrip() {
    const f = fm(), g = grade(), on = Object.keys(f.charms || {}).filter((id) => id !== 'piggy' && F.charmOn(f, id));
    const chip = (id) => {
      const c = f.charms[id], left = c.until - f.day;
      return `<button class="fcharm c-${id}" data-act="fCharm" data-arg="${id}"><span class="fc-pic">${id === 'myth' ? MQ.mythArt(c.a, { aura: false }) : MQ.charmArt(id)}</span><span class="fc-t"><b>${esc(id === 'myth' ? F.MYTHS[c.a].many : F.CHARMS[id].name)}</b><small>${left === 1 ? 'Last day!' : `${left} days left`} · +${fmt(F.charmGot(c, g))}</small></span></button>`;
    };
    const piggy = F.piggyWaiting(f) ? `<button class="fcharm c-piggy" data-act="fCharm" data-arg="piggy"><span class="fc-pic">${MQ.charmArt('piggy')}</span><span class="fc-t"><b>Golden Piggy</b><small>Bank day: interest × 2</small></span></button>` : '';
    // the farm supplies working now (plain, not magic: an emoji instead of a picture)
    const boosts = Object.keys(f.boosts || {}).filter((id) => F.boostOn(f, id)).map((id) => { const b = f.boosts[id], left = b.until - f.day; return `<button class="fcharm c-boost" data-act="fBoost" data-arg="${id}"><span class="fc-pic fc-e">${F.BOOSTS[id].e}</span><span class="fc-t"><b>${esc(F.BOOSTS[id].name)}</b><small>${left === 1 ? 'Last day!' : `${left} days left`} · ${b.gain ? '+' + fmt(b.gain) : 'just started'}</small></span></button>`; }).join('');
    return on.length || piggy || boosts ? `<div class="fcharms">${on.map(chip).join('')}${piggy}${boosts}</div>` : '';
  }
  function charmInfo(id) {
    const f = fm(), g = grade(), c = (f.charms || {})[id];
    if (id === 'piggy') return K().modal(`<div class="tcard c-piggy"><div class="dbuilt-rays"></div><div class="tpic">${MQ.charmArt('piggy')}</div><div class="mtitle">🐷 Golden Piggy</div><p>On the next bank day the bank pays your interest twice. Save more before bank day, and the piggy brings more!</p></div><div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
    if (!c || !F.charmOn(f, id)) return;
    const left = c.until - f.day, got = F.charmGot(c, g);
    K().modal(`<div class="tcard c-${id}"><div class="dbuilt-rays"></div><div class="tpic">${charmPic(id, c.a)}</div><div class="mtitle">${F.CHARMS[id].e} ${esc(id === 'myth' ? F.MYTHS[c.a].many : F.CHARMS[id].name)}</div>
      <p>${esc(F.charmNote(id, g, fmt, c.a))}</p></div>
      <p>It works ${left === 1 ? '<b>today only</b> (its last day)' : `<b>${left} more days</b>`}. It cost <b>${fmt(c.cost)}</b>, and so far it brought <b>+${fmt(got)}</b>${got > c.cost ? ': it already paid for itself! 🎉' : '.'}</p>
      <div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  // The morning a charm's week is over: what it cost and what it brought, and a question: did it pay off?
  let charmEnds = [];
  const USE_MORE = { myth: 'feed the animals every day', clover: 'sell a lot at the stand', sun: 'plant every bed', grow: 'plant crops that take a few days', treat: 'feed every grown-up animal every day', oven: 'keep every workshop making something', field: 'plant both rented beds right away' };
  // a week charm or a farm supply (x.boost): its name, its icon, and what it brought more of
  const endName = (x) => (x.boost ? F.BOOSTS[x.id].name : x.id === 'myth' ? F.charmName('myth', x.a) : F.CHARMS[x.id].name);
  const endIcon = (x) => (x.boost ? F.BOOSTS[x.id].e : F.CHARMS[x.id].e);
  function charmEndBlock(x, k) {
    const what = x.boost ? F.BOOSTS[x.id].what : x.id === 'myth' ? `in ${esc(F.ITEMS[F.MYTHS[x.a].item].many)}` : x.id === 'clover' ? 'in tips' : 'in crops';
    const pic = x.boost ? `<span class="mc-pic fc-e">${F.BOOSTS[x.id].e}</span>` : `<span class="mc-pic">${charmPic(x.id, x.a)}</span>`;
    return `<div class="mcend c-${x.boost ? 'boost' : x.id}">${pic}<span class="mc-t"><b>${endIcon(x)} ${esc(endName(x))} is over.</b><small>It cost ${fmt(x.cost)} and brought ${fmt(x.got)} more ${what}.</small></span><button class="btn" data-act="fProfit" data-arg="${k}">🧮 Did it pay off?</button></div>`;
  }
  function startProfit(k) {
    const x = charmEnds[k], g = grade();
    K().closeModal();
    if (!x) return;
    const name = endName(x), win = x.got - x.cost;
    fs = { mode: 'profit', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm',
      done: () => (win > 0 ? `💰 That is your <b>profit</b>: the ${esc(name)} brought ${fmt(win)} more than it cost.` : `It brought ${fmt(-win)} ${win ? 'less than it cost' : 'just what it cost'}. Next time, use it more: ${USE_MORE[x.id] || 'plant every bed'}!`) };
    const p = win > 0
      ? { type: 'profit', text: `The ${endIcon(x)} <b>${esc(name)}</b> cost <b>${fmt(x.cost)}</b>. It brought <b>${fmt(x.got)}</b> more. How much more did it bring than it cost? That is the <b>profit</b>.`, hint: `Take away what it cost: ${fmt(x.got)} − ${fmt(x.cost)}.`, explain: `${fmt(x.got)} − ${fmt(x.cost)} = ${fmt(win)}`, sale: {}, total: 0 }
      : { type: 'profit', text: `The ${endIcon(x)} <b>${esc(name)}</b> cost <b>${fmt(x.cost)}</b>. It brought <b>${fmt(x.got)}</b> more. <b>Did it pay off?</b>`, hint: `Is ${fmt(x.got)} more than ${fmt(x.cost)}?`, explain: `${fmt(x.got)} is ${win ? 'less than' : 'the same as'} ${fmt(x.cost)}, so it didn’t pay off`, sale: {}, total: 0, kind: 'choice', answer: 'No, it didn’t', choices: ['Yes, it did', 'No, it didn’t'] };
    if (win > 0) Object.assign(p, win < 100 || g === 'k' ? { kind: 'num', answer: win, unit: '¢' } : { kind: 'choice', answer: fmt(win), choices: F.moneyChoices(win, g, [x.got + x.cost, x.got, x.cost]) });
    show(p);
  }

  // ---------------------------------------------------------------- the market shift and Mila, the market manager
  // Today's shift as dots: one for each customer of the shift, filled when served.
  function shiftDots(f) {
    const s = F.shiftToday(f), len = F.shiftLen(f);
    return `<span class="fslots" role="img" aria-label="Shift: ${Math.min(s.n, len)} of ${len} customers">${U.range(1, len).map((i) => `<i class="${i <= s.n ? 'on' : ''}"></i>`).join('')}</span>`;
  }
  const things = (n) => `${n} ${n === 1 ? 'thing' : 'things'}`;
  // On the farm (when Mila works here): her money waiting, the rest she sells tonight, or how far today's shift is.
  function mgrCard() {
    const f = fm(), g = grade(), M = F.MANAGER, p = f.mgr.pend, n = F.saleCount(f), stars = F.shiftStars(f);
    // her money from a night waits even if a grown-up turned her off since
    if (p) return `<button class="fmgr hot" data-act="fMgrCollect"><span class="fmgr-e">${M.e}</span><span class="fmgr-t"><b>${esc(M.name)} sold ${things(p.n)} for you!</b><small>Tap to get your money</small></span></button>`;
    if (!F.mgrHired(f)) return '';
    const card = (b, small, btn = '', hot = false) => `<div class="fmgr ${hot ? 'hot' : ''}"><span class="fmgr-e">${M.e}</span><span class="fmgr-t"><b>${b}</b><small>${small}</small></span>${btn}</div>`;
    if (F.wxIs(f, 'storm') && n) return card(`⛈️ A stormy night: ${esc(M.name)} stays home`, 'Your basket waits for tomorrow. Nothing is lost!');
    if (F.mgrTonight(f)) return card(`${esc(M.name)} sells the rest tonight`, `${things(n)} · she keeps ${F.keepText(f.mgr.keep, g)}. Tap 🌙 Sleep!`, '<button class="btn ghost" data-act="fMgrStay">Keep it</button>');
    if (!n) return '';
    if (stars) return card(`Shift done ${F.starText(stars)}`, `${esc(M.name)} can sell the other ${things(n)} tonight and keep ${F.keepText(F.KEEP[stars - 1], g)}.`, `<button class="btn" data-act="fMgrSell">${M.e} Sell it</button>`, true);
    const left = F.shiftLeft(f);
    return card(`Today’s shift ${shiftDots(f)}`, `${left} more ${left === 1 ? 'customer' : 'customers'} at your stand, then ${esc(M.name)} can sell the rest tonight.`);
  }
  // After the stand closes: what Mila can do with the rest.
  function mgrBlock() {
    const f = fm(), g = grade(), M = F.MANAGER, n = F.saleCount(f), stars = F.shiftStars(f), name = esc(M.name);
    if (!n || !F.mgrOpen(f)) return '';
    const box = (t, btns = '') => `<section class="fmgrbox"><span class="fmgr-e">${M.e}</span><div><p>${t}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></section>`;
    if (!f.mgr.hired) return box(`<b>${name}</b>, the market manager, can sell what is left after your shift. Hire her in the shop (🏡 Farm).`);
    if (F.wxIs(f, 'storm')) return box(`⛈️ A stormy night: <b>${name}</b> stays home tonight. Your basket waits for tomorrow, and nothing is lost.`);
    if (F.mgrTonight(f)) return box(`✓ <b>${name} sells the other ${things(n)} tonight</b> and keeps ${F.keepText(f.mgr.keep, g)} for her work.`, '<button class="btn ghost" data-act="fMgrStay">Keep it in the basket</button>');
    if (!stars) {
      const left = F.shiftLeft(f);
      return box(`Today’s shift ${shiftDots(f)}<br>Serve <b>${left} more ${left === 1 ? 'customer' : 'customers'}</b>, and ${name} can sell the rest tonight.`, '<button class="btn" data-act="fMarket">🏪 Back to the stand</button>');
    }
    const better = stars < 3 ? ` After a ${F.starText(stars + 1)} shift she keeps ${F.keepText(F.KEEP[stars], g)}.` : '';
    return box(`Shift done ${F.starText(stars)}! ${name} can sell the other <b>${things(n)}</b> tonight. She keeps <b>${F.keepText(F.KEEP[stars - 1], g)}</b> for her work.${better}`, `<button class="btn ghost" data-act="go" data-arg="farm">Keep it in the basket</button><button class="btn" data-act="fMgrSell">${M.e} ${name}, sell the rest</button>`);
  }
  // The morning after: her money waits for one question.
  function startMgr() {
    const f = fm(), p = f.mgr.pend, M = F.MANAGER;
    K().closeModal();
    if (!p) return;
    fs = { mode: 'mgr', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm',
      done: () => { const got = F.mgrCollect(fm()); return got ? `${M.e} ${esc(M.name)} gave you <b>${fmt(got)}</b>. Now you have <b>${fmt(fm().money)}</b>.` : 'You already have this money.'; } };
    show(F.mgrQuestion(p, grade(), F.tierNow(f, grade())));
  }
  function mgrSell() {
    if (!F.mgrSell(fm())) return;
    save();
    MQ.sfx('reward');
    if ($('.scene')) redraw(); else K().go('farm');
    K().toast(`${F.MANAGER.e} ${F.MANAGER.name} sells the rest tonight. Tap 🌙 Sleep!`);
  }
  function mgrStay() {
    F.mgrStay(fm());
    save();
    MQ.sfx('tap');
    if ($('.scene')) redraw(); else K().go('farm');
    K().toast('🧺 It stays in your basket');
  }

  // ---------------------------------------------------------------- the order board
  // How long an order stays: days left, counting today (its last farm day: "Last day!").
  const daysLeft = (o) => o.end - fm().day + 1;
  const leftText = (o) => { const d = daysLeft(o); return d <= 1 ? 'Last day!' : `${d} days left`; };
  const itemWord = (id, n) => esc(n === 1 ? F.ITEMS[id].name : F.ITEMS[id].many);
  // On the farm: the orders, small, with how much of each thing is in the basket (tap: the board opens).
  function orderStrip() {
    const f = fm();
    if (!F.ordersOpen(f) || !f.orders.seen) return '';
    const all = F.orderStatus(f);
    const card = ({ o, have, ready }) => `<button class="forder ${ready ? 'ready' : ''} ${o.big ? 'big' : ''}" data-act="fOrders" aria-label="${esc(o.who[1])}'s order${ready ? ': ready to deliver' : ''}">
      <span class="fo-who">${o.who[0]}</span>
      <span class="fo-need">${Object.entries(o.items).map(([id, n]) => `<span class="${have[id] >= n ? 'have' : ''}">${F.ie(id)} ${have[id]}/${n}</span>`).join('')}</span>
      <span class="fo-foot"><b>${fmt(o.pay)}</b><small>${ready ? '📦 Deliver!' : leftText(o)}</small></span></button>`;
    return `<section class="forders" aria-label="Order board"><div class="fo-head"><b>📋 Orders</b><small>${all.some((x) => x.ready) ? 'Ready to deliver! Tap it.' : 'They pay more than your stand'}</small></div>
      ${all.length ? `<div class="fo-row">${all.map(card).join('')}</div>` : '<p class="muted">No orders now. A new one comes tomorrow morning.</p>'}</section>`;
  }
  // Where a missing thing comes from on this farm.
  function fromWhere(id) {
    const x = F.orderGoods(fm())[id];
    if (!x) return 'your farm doesn’t make this now';
    if (x.kind === 'crop') return `🌱 plant ${esc(F.ITEMS[id].many)}`;
    if (x.kind === 'animal') return `from your ${F.ANIMALS[x.a].e} ${esc(F.ANIMALS[x.a].name.toLowerCase())} pen`;
    return `${F.WORKS[x.work].e} make it in the ${esc(F.WORKS[x.work].name.toLowerCase())}`;
  }
  function orders() {
    const f = fm(), all = F.orderStatus(f);
    const cards = all.map(({ o, have, ready }) => `<div class="ocard ${ready ? 'ready' : ''} ${o.big ? 'big' : ''}">
      <div class="oc-head"><span class="oc-who">${o.who[0]}</span><span class="oc-t"><b>${esc(o.who[1])}</b><small>${esc(o.why)}</small></span><span class="oc-left ${daysLeft(o) <= 1 ? 'last' : ''}">📅 ${leftText(o)}</span></div>
      ${o.big ? '<div class="oc-big">⭐ Big order: pays double!</div>' : ''}
      <ul class="oc-items">${Object.entries(o.items).map(([id, n]) => `<li class="${have[id] >= n ? 'have' : ''}"><span class="oc-e">${F.ie(id)}</span><span>${n} ${itemWord(id, n)}${have[id] >= n ? '' : `<small>${fromWhere(id)}</small>`}</span><b>${have[id] >= n ? '✓' : `${have[id]} / ${n}`}</b></li>`).join('')}</ul>
      <div class="oc-pay">Pays <b>${fmt(o.pay)}</b><small>At your stand: ${fmt(o.stand)} · until farm day ${o.end}</small></div>
      <div class="oc-acts">${ready ? `<button class="btn" data-act="fDeliver" data-arg="${o.n}">📦 Deliver</button>` : `<span class="flock">Collect ${Object.entries(o.items).filter(([id, n]) => have[id] < n).map(([id, n]) => `${n - have[id]} more ${F.ie(id)}`).join(' and ')}</span>`}<button class="btn ghost small" data-act="fOrderNo" data-arg="${o.n}">No, thanks</button></div></div>`).join('');
    K().modal(`<div class="mhead"><span class="bigemoji">📋</span><span><span class="mtitle">Order board</span><small class="muted">Farm day ${f.day} · orders pay more than your stand</small></span></div>
      ${cards ? `<div class="ocards">${cards}</div>` : '<p>No orders now. A new one comes tomorrow morning!</p>'}
      <p class="muted small">📋 Things for your orders stay in your basket: customers at the stand don’t buy them. When there is room on the board (${F.ORDER_SLOTS} orders), a new order comes each morning.</p>
      <div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
    MQ.sfx('tap');
  }
  function orderNo(n) {
    const o = fm().orders.list.find((x) => x.n === n);
    if (!o) return orders();
    K().modal(`<div class="bigemoji">${o.who[0]}</div><div class="mtitle">No to ${esc(o.who[1])}’s order?</div>
      <p>That’s OK! ${esc(o.who[1])} will ask another farm. A new order comes tomorrow morning.</p>
      <div class="row"><button class="btn ghost" data-act="fOrders">Keep it</button><button class="btn" data-act="fOrderDrop" data-arg="${n}">No, thanks</button></div>`);
  }
  function orderIntro() {
    const f = fm();
    F.ordersStart(f, grade());
    save();
    redraw();
    K().modal(`<div class="bigemoji">📋</div><div class="mtitle">✨ New: the Order board!</div>
      <p>People in town want things from <b>your</b> farm!</p>
      <ul class="funlocks"><li>🧺 Collect what an order needs. It stays in your basket: customers at the stand don’t buy it.</li><li>📦 Deliver it, and the order pays <b>more than your stand</b>.</li><li>📅 Each order has a few days. A new one comes every morning.</li></ul>
      <div class="row"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn" data-act="fOrders">📋 See the orders</button></div>`);
    MQ.sfx('streak');
  }
  // ---------------------------------------------------------------- weather, today's special and market day
  // The farm page takes the day's colors (sky, grass and a light tint around it): #app gets wx-rain, wx-market…
  const wxClass = (f) => { const x = F.wxToday(f); return x ? ` wx-${x.w}${x.market ? ' wx-market' : ''}` : ''; };
  const wxName = (x) => `${F.WX[x.w].e} ${esc(F.WX[x.w].name)}`;
  // Today and tomorrow at a glance, on the farm (tap for the week).
  function wxBar() {
    const f = fm(), now = F.wxToday(f), next = F.wxTomorrow(f);
    if (!now) return '';
    const sp = now.sp ? `<span class="fwx-sp">⭐ ${F.ie(now.sp)} ${fmt(F.specialPrice(now.sp, grade()))}</span>` : '';
    return `<button class="fwxbar k-${F.WX[now.w].kind || 'sun'}" data-act="fWeather" aria-label="Farm weather">
      <span class="fwx-now">${now.market ? '🎪 <b>Market day</b> · ' : ''}<b>Today</b> ${wxName(now)}</span>${sp}
      ${next ? `<span class="fwx-next ${F.WX[next.w].kind === 'bad' ? 'warn' : ''}">Tomorrow ${wxName(next)}${next.market ? ' · 🎪' : ''}</span>` : ''}</button>`;
  }
  // How safe this farm is from a bad day: beds with a sprinkler, pens with a cozy barn, or what to do.
  function wxSafe(f, w) {
    const gd = F.wxGuard(f, w), what = w === 'heat' ? ['beds', 'a 💧 sprinkler'] : ['pens', 'a 🛖 cozy barn'];
    if (gd && gd[1]) return gd[0] === gd[1] ? `All your ${what[0]} have ${what[1]}: they are safe!` : `${gd[0]} of your ${gd[1]} ${what[0]} ${gd[0] === 1 ? 'has' : 'have'} ${what[1]}. ${esc(F.WX[w].safe)}`;
    return esc(F.WX[w].safe || '');
  }
  // A day's weather card (today or tomorrow).
  function wxDay(f, x, when) {
    const W = F.WX[x.w];
    return `<div class="fwx-day k-${W.kind || 'sun'}"><small class="fwx-when">${when}</small><span class="fwx-e">${W.e}</span><b>${esc(W.name)}</b>
      <small>${esc(W.note)}</small>${W.kind === 'bad' && (when === 'Tomorrow' || F.wxGuard(f, x.w)) ? `<small class="fwx-safe">🛡️ ${wxSafe(f, x.w)}</small>` : ''}</div>`;
  }
  // Today and tomorrow with the specials and market day (the morning card and the weather card).
  function wxBlock(f) {
    const now = F.wxToday(f), next = F.wxTomorrow(f), g = grade();
    if (!now) return '';
    const special = (x, day) => x.sp ? `<li>⭐ ${day} special: ${F.ie(x.sp)} <b>${esc(F.ITEMS[x.sp].many)}</b> sell for <b>${fmt(F.specialPrice(x.sp, g))}</b> (usually ${fmt(F.price(x.sp, g))}).</li>` : '';
    const lines = [now.market ? '<li>🎪 <b>Market day!</b> Every customer brings a friend who buys the same.</li>' : '', special(now, 'Today’s'),
      next && next.market ? '<li>🎪 Tomorrow is <b>market day</b>: fill your basket today!</li>' : '', next ? special(next, 'Tomorrow’s') : ''].join('');
    return `<div class="fwx2">${wxDay(f, now, 'Today')}${next ? wxDay(f, next, 'Tomorrow') : ''}</div>${lines ? `<ul class="funlocks fwx-lines">${lines}</ul>` : ''}`;
  }
  // The morning card: what last night's weather did.
  function wxNews(x) {
    if (!x) return [];
    const M = esc(F.MANAGER.name), out = [], n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    if (x.w === 'rain' && x.got) out.push('🌧️ The warm rain watered your beds: they grew 2 days last night!');
    if (x.w === 'happy' && x.more) out.push(`🌞 Happy animals in the warm sunshine: ${n(x.more, 'pen', 'pens and houses')} made 1 more!`);
    if (x.w === 'heat') out.push(x.rested ? `🔥 It was hot: ${n(x.rested, 'bed', 'beds')} without a 💧 sprinkler rested, so ${x.rested === 1 ? 'it is' : 'they are'} ready a day later.${x.safe ? ` ${n(x.safe, 'bed', 'beds')} with a sprinkler kept growing.` : ''}` : x.safe ? '🔥 It was hot, but your 💧 sprinklers kept every bed growing!' : '');
    if (x.w === 'wind') out.push(x.less ? `🌬️ It was windy: ${n(x.less, 'pen', 'pens')} without a 🛖 cozy barn made 1 less.` : x.safe ? '🌬️ It was windy, but your 🛖 cozy barns kept every pen safe!' : '');
    if (x.storm) out.push(`⛈️ It was stormy, so ${M} stayed home. Your basket waited for you.`);
    return out.filter(Boolean);
  }
  // The weather card: this bank week day by day (the days gone by, today, tomorrow), today and tomorrow, the rules.
  function weather() {
    const f = fm(), now = F.wxToday(f), next = F.wxTomorrow(f);
    if (!now) return;
    const log = new Map((f.wx.log || []).map((x) => [x[0], x[1]]));
    const week = F.bankWeek(f.day).map((d) => {
      const w = d === f.day ? now.w : next && d === next.day ? next.w : log.get(d);
      const mark = F.isMarketDay(d) ? '🎪' : F.isBankDay(d) ? '🏦' : '';
      return `<li class="${d < f.day ? 'past' : d === f.day ? 'now' : ''} ${mark ? 'bank' : ''}" title="${w ? esc(F.WX[w].name) : 'Not known yet'}"><small>Day</small><b>${d}</b><i>${w ? F.WX[w].e : '❔'}</i><small>${mark || '&nbsp;'}</small></li>`;
    }).join('');
    K().modal(`<div class="mtitle">🌦️ Farm weather</div>
      <section class="bweek fwxweek"><ol>${week}</ol><small class="muted">🎪 market day · 🏦 bank day · ❔ not known yet</small></section>
      ${wxBlock(f)}
      <p class="muted small">Good weather comes much more often than bad. Bad weather is always on the forecast the day before, and it never takes your things or your money.</p>
      <div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  function wxIntro() {
    const f = fm();
    f.wx.seen = true;
    save();
    K().modal(`<div class="bigemoji">🌦️</div><div class="mtitle">✨ New: Farm weather!</div>
      <ul class="funlocks"><li>☀️ Every morning you see <b>today’s weather and tomorrow’s</b>.</li><li>🌧️ Good weather helps your farm: warm rain, sunshine, rainbows.</li>
      ${F.level(f.xp).level >= F.WX_BAD_LV ? '<li>🔥 Sometimes a little bad weather comes. You see it the day before, so you can get ready.</li>' : ''}
      <li>⭐ Every day one thing is the <b>special</b>: it sells for more.</li><li>🎪 Every week there is a <b>market day</b> (day ${F.MARKET_DAY}, ${F.MARKET_DAY + 7}, ${F.MARKET_DAY + 14}…): customers bring friends!</li></ul>
      <div class="row"><button class="btn ghost" data-act="closeModal">OK</button><button class="btn" data-act="fWeather">🌦️ See the weather</button></div>`);
    MQ.sfx('streak');
  }
  function startDeliver(n) {
    const f = fm(), s = F.orderStatus(f).find((x) => x.o.n === n);
    K().closeModal();
    if (!s || !s.ready) return orders();
    const o = s.o;
    fs = { mode: 'order', order: o, n: 0, earned: 0, tips: 0, xp: 0, back: 'farm', xpBonus: F.orderXp(o),
      done: () => {
        const x = F.deliver(fm(), o.n);
        if (!x) return 'This order is gone.';
        MQ.confetti(o.big ? 160 : 90, o.big ? { colors: ['#ffd23f', '#ff8fe0', '#9d7bff', '#ffffff'], shape: 'star' } : {});
        return `📦 Delivered! ${esc(x.who[1])} paid <b>${fmt(x.pay)}</b>: that is <b>${fmt(x.pay - x.stand)}</b> more than your stand.`;
      } };
    show(F.orderQuestion(o, grade(), F.tierNow(f, grade())));
  }
  // The morning card's lines about orders: a new one, the ones that end tonight, the ones that ended.
  function orderLines(x) {
    if (!x) return [];
    const out = [];
    const list = (o) => Object.entries(o.items).map(([id, n]) => `${n} ${F.ie(id)} ${itemWord(id, n)}`).join(' and ');
    if (x.added && fm().orders.seen) out.push(`📋 New order${x.added.big ? ' ⭐' : ''}: ${x.added.who[0]} <b>${esc(x.added.who[1])}</b> wants ${list(x.added)} by farm day ${x.added.end}.`);
    for (const o of x.last) out.push(`📅 ${esc(o.who[1])}’s order ends tonight${F.orderStatus(fm()).some((s) => s.o === o && s.ready) ? ': it is ready, deliver it today!' : '.'}`);
    for (const o of x.gone) out.push(`📋 ${esc(o.who[1])}’s order ended. That’s OK: new orders keep coming.`);
    return out;
  }

  function dreamIntro() {
    const f = fm(), d = F.dreamNow(f);
    f.dream.seen = true;
    save();
    if (!d) return;
    const n = F.dreamNext(f, grade());
    K().modal(`<div class="dbuilt t-${d.id}"><div class="dbuilt-rays"></div><div class="dpic">${MQ.dreamArt(d.id, d.stages.length)}</div><div class="dbuilt-t">✨ New: <b>Big Dreams</b></div></div>
      <p>Save money <b>in the bank</b> and build big things, one stage at a time. The first one is a ${d.e} <b>${esc(d.name)}</b>.</p>
      <ul class="funlocks"><li>🏦 The builders are paid <b>from the bank</b>, so save money there.</li><li>🌙 They build at night. In the morning the new part is on your farm.</li><li>💰 Every built stage <b>earns money every bank day</b>, straight into the bank.</li></ul>
      <p class="muted">First stage: ${n.st.e} ${esc(n.st.name)} for <b>${fmt(n.cost)}</b>.</p>
      <div class="row"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn" data-act="go" data-arg="farm:dreams">🏗️ See my Big Dream</button></div>`);
    MQ.sfx('streak');
  }
  let dreamView = null; // which dream the Big Dreams screen shows (null = the one being built)
  function dreams() {
    const f = fm(), g = grade(), gi = g === 'k' ? 0 : 1, cur = f.dream.p;
    const k = dreamView === null ? Math.min(cur, F.DREAMS.length - 1) : dreamView, d = F.DREAMS[k];
    const built = F.dreamBuilt(f, k), isCur = k === cur, building = isCur && f.dream.b;
    const tab = (x, i) => {
      const nb = F.dreamBuilt(f, i), done = nb >= x.stages.length, now = i === cur;
      return `<button class="dtab t-${x.id} ${i === k ? 'sel' : ''} ${done ? 'done' : now ? 'now' : 'later'}" data-act="fDreamView" data-arg="${i}"><span class="dtab-pic">${MQ.dreamArt(x.id, i > cur ? x.stages.length : nb)}</span><b>${esc(x.name)}</b><small>${done ? '✓ Built' : now ? `${nb} / ${x.stages.length} built` : '🔒 Later'}</small></button>`;
    };
    const stages = d.stages.map((x, i) => {
      const state = i < built ? 'built' : isCur && i === built ? (building ? 'work' : 'next') : 'later';
      const pay = x.pay[gi];
      return `<li class="${state}"><span class="dst-e">${state === 'built' ? '✅' : state === 'work' ? '🏗️' : x.e}</span><span class="dst-t"><b>${esc(x.name)}</b><small>${pay ? `earns ${fmt(pay)} every bank day` : d.castle ? 'part of your castle' : ''}</small></span><span class="dst-p">${state === 'built' ? 'Built' : fmt(x.cost[gi])}</span></li>`;
    }).join('');
    let action = '', lesson = '';
    if (!isCur) action = k < cur ? `<p class="dnote ok">✓ Built! ${d.stages[0].pay[gi] ? `It earns ${fmt(U.sum(d.stages.map((x) => x.pay[gi])))} every bank day.` : 'Your very own castle 👑'}</p>` : `<p class="dnote">🔒 Opens when you finish ${esc(F.DREAMS[k - 1].name)}.</p>`;
    else {
      const n = F.dreamNext(f, g), left = n.cost - f.bank.bal;
      if (building) action = `<p class="dnote work">🏗️ The builders are working on <b>${n.st.e} ${esc(n.st.name)}</b>. Tap 🌙 Sleep on the farm to make the night pass!</p>`;
      else if (left <= 0) action = `<button class="btn big dbuild" data-act="fBuild">🏗️ Pay the builders · ${fmt(n.cost)} from the bank</button><p class="muted center">You have ${fmt(f.bank.bal)} in the bank.</p>`;
      else action = `<div class="dsave"><span class="fbar"><span style="width:${Math.round((f.bank.bal / n.cost) * 100)}%"></span></span>
          <p>In the bank: <b>${fmt(f.bank.bal)}</b> of <b>${fmt(n.cost)}</b> · <b>${fmt(left)}</b> more to save</p>
          <p class="muted">The builders are paid from the bank, not from your wallet.${f.money ? ` You have ${fmt(f.money)} in your wallet: put it in the bank!` : ''}${f.dep && f.dep.amt ? ` Your locked deposit (${fmt(F.depositBack(f.dep.amt))}) comes back on farm day ${f.dep.until}.` : ''}</p>
          <button class="btn" data-act="go" data-arg="farm:bank">🏦 Go to the bank</button></div>`;
      if (n.pay) {
        // the same money kept in the bank, at the bank's usual interest (10¢ a dollar; kindergarten 1¢ for every 10¢):
        // a simple comparison, without the account limits
        const [per, add] = F.bankRule(g), inBank = Math.floor(n.cost / per) * add;
        lesson = `<section class="dlesson"><b>💡 Bank or building?</b>
          <p>${n.st.e} ${esc(n.st.name)} earns <b>${fmt(n.pay)}</b> every bank day. It pays for itself in <b>${F.payback(n.cost, n.pay)} bank days</b>, and after that it is all profit.</p>
          <p>Kept in the bank, ${fmt(n.cost)} would earn <b>${fmt(inBank)}</b> a bank day (${g === 'k' ? '1¢ for every 10¢' : '10¢ for every dollar'}), and you could take it out any time. Spent on the building, the money is gone, but the building earns every bank day.</p></section>`;
      } else if (d.castle) lesson = '<section class="dlesson castle"><b>👑 The biggest dream</b><p>The castle doesn’t earn money. Your orchard, cottage and railway help you save for it. Build it because it is amazing!</p></section>';
    }
    const inc = F.dreamIncome(f, g), all = U.sum(inc.map((x) => x[2]));
    K().render(header('🏗️ Big Dreams', 'farm') + `<main class="farm fdreams">
      <div class="dpath">${F.DREAMS.map(tab).join('')}</div>
      <section class="dbig t-${d.id} ${built >= d.stages.length ? 'done' : ''}">
        <div class="dpic ${k > cur ? 'later' : ''}">${MQ.dreamArt(d.id, k > cur ? d.stages.length : built, { building })}</div>
        <h2>${d.e} ${esc(d.name)}</h2>
        <p class="muted">${esc(d.blurb)}</p>
        <ol class="dstages">${stages}</ol>
        ${action}
      </section>
      ${lesson}
      ${all ? `<section class="flevel dincome"><b>💰 Your buildings earn ${fmt(all)} every bank day</b><ul>${inc.map(([e, nm, x]) => `<li>${e} ${esc(nm)} <b>${fmt(x)}</b></li>`).join('')}</ul><small class="muted">It goes into the bank on bank day. Next bank day: in ${F.nightsToBankDay(f.day)} ${F.nightsToBankDay(f.day) === 1 ? 'night' : 'nights'}.</small></section>` : ''}
    </main>`, 'is-farm');
    K().setCur('farm:dreams');
  }
  // Paying the builders is a bank transfer: how much will be left in the bank?
  function startBuild() {
    const f = fm(), g = grade();
    if (!F.canBuild(f, g)) return dreams();
    const n = F.dreamNext(f, g), bal = f.bank.bal, left = bal - n.cost;
    fs = { mode: 'build', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:dreams',
      done: () => { const x = F.payBuilders(fm(), grade()); return x ? `🏗️ The builders got <b>${fmt(x.cost)}</b> from the bank. They will build ${x.st.e} ${esc(x.st.name)} tonight. Tap 🌙 Sleep on the farm!` : 'The builders are already working.'; } };
    const p = { type: 'build', text: `The builders want <b>${fmt(n.cost)}</b> for ${n.st.e} <b>${esc(n.st.name)}</b>. You have <b>${fmt(bal)}</b> in the bank. How much will be <b>left in the bank</b> after you pay them?`,
      hint: g === 'k' ? 'Take away the builders’ money: count back.' : 'Take away the dollars first, then the cents.', explain: `${fmt(bal)} − ${fmt(n.cost)} = ${fmt(left)}`, sale: {}, total: 0 };
    Object.assign(p, left < 100 ? { kind: 'num', answer: left, unit: '¢' } : { kind: 'choice', answer: fmt(left), choices: F.moneyChoices(left, g, [bal + n.cost, Math.max(0, left - 100), left + 100]) });
    show(p);
  }

  // ---------------------------------------------------------------- shop
  const TABS = [['animals', '🐔 Animals & feed'], ['up', '⬆️ Upgrades'], ['supply', '🧪 Supplies'], ['farm', '🏡 Farm'], ['decor', '✨ Decorations']];
  // The Supplies tab: small helpers for a few farm days, always for sale (one of each at a time).
  function supplies() {
    const f = fm(), g = grade(), L = F.level(f.xp).level;
    if (L < F.BOOST_LV) return `<p class="muted">🔒 Farm supplies open at farm level ${F.BOOST_LV}.</p>`;
    return `<div class="mcharms">${Object.entries(F.BOOSTS).map(([id, B]) => {
      const on = (f.boosts || {})[id], need = F.boostNeeds(f, id), locked = L < B.lv, cost = F.boostCost(id, f, g);
      let btn;
      if (on) btn = `<span class="fown">✓ Working · ${on.until - f.day === 1 ? 'last day' : `${on.until - f.day} days left`}</span>`;
      else if (locked) btn = `<span class="flock">🔒 Level ${B.lv}</span>`;
      else if (need) btn = `<span class="flock">${esc(need)}</span>`;
      else if (f.money >= cost) btn = `<button class="btn" data-act="fBuyBoost" data-arg="${id}">Buy · ${fmt(cost)}</button>`;
      else btn = `<span class="flock">${fmt(cost)} · ${fmt(cost - f.money)} more</span>`;
      const help = on || locked || need ? '' : `<p class="mc-help">💡 It can bring about <b>+${fmt(F.boostGain(id, f, g))}</b> if you ${USE_MORE[id]}.</p>`;
      return `<div class="mcharm c-boost ${on ? 'got' : ''}"><span class="mc-pic fc-e">${B.e}</span><span class="mc-t"><b>${esc(B.name)}</b><small>${esc(B.note)}</small>${help}</span><span class="mc-buy">${btn}</span></div>`;
    }).join('')}</div>`;
  }
  function buyBoost(id) {
    const f = fm(), B = F.BOOSTS[id], cost = F.boostCost(id, f, grade());
    if (f.money < cost || F.boostNeeds(f, id) || (f.boosts || {})[id]) return;
    startPay(cost, `the ${B.e} ${esc(B.name)}`, () => {
      const x = F.buyBoost(fm(), grade(), id);
      if (!x) return 'It is already working.';
      MQ.confetti(70, { colors: ['#7ed957', '#ffd23f', '#9ff0ff'] });
      return id === 'field' ? `🚜 You rented a field: <b>${F.FIELD_BEDS} more garden beds</b> for ${B.nights} days. Plant them on your farm!` : `${B.e} The <b>${esc(B.name)}</b> works for ${B.nights} nights, starting tonight!`;
    }, B.e);
    fs.back = 'farm:shop';
  }
  function boostInfo(id) {
    const f = fm(), b = (f.boosts || {})[id], B = F.BOOSTS[id];
    if (!b || !F.boostOn(f, id)) return;
    const left = b.until - f.day;
    K().modal(`<div class="bigemoji">${B.e}</div><div class="mtitle">${esc(B.name)}</div><p>${esc(B.note)}</p>
      <p>It works ${left === 1 ? '<b>today only</b> (its last day)' : `<b>${left} more days</b>`}. It cost <b>${fmt(b.cost)}</b>, and so far it brought <b>+${fmt(b.gain)}</b>${b.gain > b.cost ? ': it already paid for itself! 🎉' : '.'}</p>
      <p class="muted">💡 To get the most from it: ${USE_MORE[id]}.</p>
      <div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  function shop() {
    const f = fm(), list = tab === 'supply' ? [] : F.shop(f, grade()).filter((x) => x.tab === tab);
    const row = (x) => {
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
    };
    // the animals tab: feed, then your pens (sell to make room), then the animals to buy
    const feed = tab === 'animals' ? list.filter((x) => x.id.startsWith('feed:')) : [];
    const yard = tab === 'animals' ? list.filter((x) => x.id.startsWith('house:')) : [];
    // the barnyard shows a few levels before its first house opens (a goal to save for)
    const yardHtml = yard.length && (F.level(f.xp).level >= F.YARD_LV - 4 || Object.keys(f.yard || {}).length)
      ? `<h2 class="fyard">🐣 Barnyard</h2><p class="muted">Little houses for small animals. They don’t need a pen, so your ${F.PENS.length} pens stay free for big animals. Up to ${1 + F.YARD_ROOM} animals in each house (⬆️ Upgrades).</p><div class="fitems">${yard.map(row).join('')}</div>` : '';
    const rows = tab === 'supply' ? '' : feed.length ? `${feed.map(row).join('')}</div>${myPens()}${yardHtml}<h2>🐾 Animals</h2><div class="fitems">${list.filter((x) => !feed.includes(x) && !yard.includes(x)).map(row).join('')}` : list.map(row).join('');
    K().render(header('🛒 Farm Shop', 'farm') + `<main class="farm">
      <div class="ftabs" role="tablist">${TABS.map(([id, n]) => `<button class="chip ${tab === id ? 'sel' : ''}" role="tab" aria-selected="${tab === id}" data-act="fTab" data-arg="${id}">${n}</button>`).join('')}</div>
      ${goalBar()}
      ${tab === 'supply' ? `<p class="muted">Small helpers for a few farm days, always here (one of each at a time). Like ${esc(F.MERCHANT.name)}’s charms, but smaller. When one is over, you find out if it paid off.</p>${supplies()}` : ''}
      <p class="muted" ${tab === 'supply' ? 'hidden' : ''}>${tab === 'up' ? 'Your farm has room for 6 garden beds and 6 pens. Make them better: more crops, faster growth, more animals in each pen and each barnyard house.' : 'You pay with coins and bills, like in a real store. Tap ⭐ Save up to make something your goal.'}</p>
      <div class="fitems">${rows}</div>
    </main>`, 'is-farm');
    K().setCur('farm:shop');
  }

  // Your pens, to sell animals and make room for another kind.
  function myPens() {
    const f = fm(), g = grade(), full = f.pens.filter((p) => p.a);
    if (!full.length) return '';
    const rows = f.pens.map((p, i) => {
      if (!p.a) return '';
      const a = F.ANIMALS[p.a], n = F.penCount(p), r = F.resale(p, g);
      return `<div class="fitem"><span class="fe">${a.e}</span>
        <span class="fitem-t"><b>Pen ${i + 1}: ${n > 1 ? n + ' × ' : ''}${esc(a.name)}</b><small>${esc(F.NEIGHBOR[1])} pays half the shop price</small></span>
        <span class="fside"><span class="fprice">${fmt(r.total)}</span><button class="btn ghost" data-act="fSellAsk" data-arg="${i}">💰 Sell</button></span></div>`;
    }).join('');
    return `<h2>🏡 Your pens</h2><p class="muted">Want another kind of animal? Sell the animals in a pen to ${esc(F.NEIGHBOR[1])} next door, and the pen is empty for new ones.</p><div class="fitems">${rows}</div>`;
  }
  function sellAsk(i) {
    const f = fm(), p = f.pens[i];
    if (!p || !p.a) return;
    const a = F.ANIMALS[p.a], n = F.penCount(p), ups = (p.u || 0) ? F.PEN_UP.slice(0, p.u).map((u) => u.name) : [];
    K().modal(`<div class="bigemoji">${F.NEIGHBOR[0]}${a.e}</div><div class="mtitle">${F.canMove(f, i) ? 'Move or sell' : 'Sell'} ${n > 1 ? n + ' × ' : 'your '}${esc(a.name.toLowerCase())}?</div>
      <p>${esc(F.NEIGHBOR[1])} next door would love ${n > 1 ? 'them' : 'it'}! She pays half of the shop price. The pen will be empty, ready for any animal.</p>
      ${ups.length ? `<p class="muted">The pen’s upgrades (${esc(ups.join(', '))}) go with the animals.</p>` : ''}
      ${F.penReady(p) ? `<p class="muted">The things they made go to your basket first.</p>` : ''}
      ${sellNotes(i)}
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep ${n > 1 ? 'them' : 'it'}</button>${F.canMove(f, i) ? `<button class="btn" data-act="fMove" data-arg="${i}">🐣 Move</button><button class="btn ghost" data-act="fSell" data-arg="${i}">💰 Sell</button>` : `<button class="btn" data-act="fSell" data-arg="${i}">💰 Sell</button>`}</div>`);
  }
  // Before selling: a house in the barnyard they could move to (or could be built), and an order that needs them.
  function sellNotes(i) {
    const f = fm(), p = f.pens[i], H = F.HOUSES[p.a], h = (f.yard || {})[p.a], them = F.penCount(p) > 1 ? 'them' : 'it', out = [];
    if (F.canMove(f, i)) out.push(`<p class="fmove">🐣 Or <b>move ${them}</b> to your ${esc(H.name.toLowerCase())} in the barnyard: no pen needed, and ${them === 'it' ? 'it keeps' : 'they keep'} making ${F.ITEMS[F.ANIMALS[p.a].item].e}. The pen is free for another animal.</p>`);
    else if (h) out.push(`<p class="muted">Your ${esc(H.name.toLowerCase())} has room for ${1 + F.YARD_ROOM - F.penCount(h)} more, not for ${F.penCount(p)}.</p>`);
    else if (H && H.lv <= F.level(f.xp).level) out.push(`<p class="fmove">💡 Build a <b>${esc(H.name.toLowerCase())}</b> in the shop (🐣 Barnyard): ${esc(F.MYTHS[p.a].of)} live there without a pen. Then move ${them} instead of selling.</p>`);
    const item = F.ANIMALS[p.a].item, others = F.allPens(f).some((x) => x !== p && x.a === p.a);
    const need = !others && F.orderStatus(f).find(({ o, have }) => o.items[item] && have[item] < o.items[item]);
    if (need) out.push(`<p class="fwarn">📋 ${esc(need.o.who[1])}’s order needs ${F.ITEMS[item].e} ${esc(F.ITEMS[item].many)}, and ${them === 'it' ? 'this is the only animal' : 'these are the only animals'} on your farm that make${them === 'it' ? 's' : ''} them.</p>`);
    return out.join('');
  }
  function moveToHouse(i) {
    const f = fm(), p = f.pens[i];
    K().closeModal();
    if (!p || !F.canMove(f, i)) return;
    const h = f.yard[p.a], hungry = p.fed !== h.fed, x = F.moveToHouse(f, i), H = F.HOUSES[x.a], A = F.ANIMALS[x.a];
    save();
    if (document.querySelector('.ftabs')) shop(); else redraw();
    MQ.sfx('reward');
    K().modal(`<div class="bigemoji">🐣${A.e}</div><div class="mtitle">Moved to the ${esc(H.name.toLowerCase())}!</div>
      <p>${x.n > 1 ? `${x.n} ${esc(F.MYTHS[x.a].of)} moved` : `Your ${esc(A.name.toLowerCase())} moved`} to the barnyard. Now ${x.count} ${x.count === 1 ? 'lives' : 'live'} in the ${esc(H.name.toLowerCase())}. Pen ${i + 1} is empty: buy any animal for it in the shop.</p>
      ${hungry ? '<p class="muted">The feed for today came back to you: feed them in the house once more.</p>' : ''}
      <div class="row"><button class="btn" data-act="closeModal">OK</button></div>`);
  }
  function startSell(i) {
    const f = fm(), p = f.pens[i];
    K().closeModal();
    if (!p || !p.a) return;
    const a = F.ANIMALS[p.a], n = F.penCount(p), back = document.querySelector('.ftabs') ? 'farm:shop' : 'farm';
    fs = { mode: 'sell', animal: p.a, n: 0, earned: 0, tips: 0, xp: 0, back,
      done: () => { const got = F.sellPen(fm(), grade(), i); return `${esc(F.NEIGHBOR[1])} paid <b>${fmt(got)}</b> for your ${n > 1 ? n + ' × ' : ''}${a.e} ${esc(a.name.toLowerCase())}. Pen ${i + 1} is empty now: buy any animal for it in the shop.`; } };
    show(F.sellQuestion(p, grade()));
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
    if (!F.saleCount(fm())) return K().toast(F.basketCount(fm()) ? '📋 Everything in the basket is kept for your orders' : 'The basket is empty');
    fs = { mode: 'market', n: 0, earned: 0, tips: 0, xp: 0, sold: {}, start: F.forSale(fm()) };
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
    const truck = !jobs && !vip && (f.customers + 1) % F.TRUCK_EVERY === 0;
    const warm = !jobs && F.shiftToday(f).n < F.WARM; // an easy start to the shift
    const p = F.customer(f, grade(), { stock: jobs ? F.jobStock(f) : F.forSale(f), vip, jobs, truck, warm }); // what the orders keep isn't for sale
    if (!p) return summary(true);
    show(p);
  }
  // At the stand: what was in the basket when the stand opened, how much is sold and how much is left, per thing.
  // The things this customer wants are marked.
  function basketBar() {
    if (!fs || fs.mode !== 'market' || !fs.start) return '';
    const f = fm(), ids = Object.keys(fs.start).filter((id) => fs.start[id] > 0), sale = F.forSale(f);
    const want = new Set(fs.locked || !fs.p ? [] : Object.keys(fs.p.sale || {}));
    const left = U.sum(ids.map((id) => sale[id] || 0)), sold = U.sum(ids.map((id) => fs.sold[id] || 0));
    const chips = ids.map((id) => {
      const l = sale[id] || 0, n = fs.sold[id] || 0;
      return `<li class="${l ? '' : 'out'} ${want.has(id) ? 'want' : ''}" title="${esc(F.ITEMS[id].many)}: ${n} sold, ${l} left"><i>${F.ie(id)}</i><b>${l ? l : '✓'}</b>${n ? `<small>${n} sold</small>` : ''}</li>`;
    }).join('');
    const stars = F.shiftStars(f);
    return `<section class="fbbar" id="fbbar" aria-label="Basket: ${sold} sold, ${left} left">
      <div class="fbbar-t"><span>${stars ? `🏪 Shift done ${F.starText(stars)}` : `🏪 Shift ${shiftDots(f)}`}</span><span>🧺 <b>${left}</b> left</span></div>
      <ul>${chips}</ul></section>`;
  }
  const redrawBasket = () => { const el = $('#fbbar'); if (el) el.outerHTML = basketBar(); };
  function show(p) {
    if ($('.scene')) backY = window.scrollY;
    Object.assign(fs, { p, tries: 0, input: '', tray: [], locked: false, step: 'main', pick: null, pause: false });
    const f = fm(), tiers = F.tiers(grade()), tier = tiers[(p.tier || f.tier) - 1];
    const status = STATUS[fs.mode] ? STATUS[fs.mode]() : fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : standStatus(false);
    const sp = fs.mode === 'market' && p.type !== 'special' && p.sale && p.sale[F.special(f)] ? F.special(f) : null; // today's special in this sale
    const spLine = sp ? `<div class="fspecial">⭐ Today’s special: ${F.ie(sp)} ${esc(F.ITEMS[sp].many)} are <b>${fmt(F.specialPrice(sp, grade()))}</b> today (usually ${fmt(F.price(sp, grade()))}).</div>` : '';
    const sale = p.friend ? Object.fromEntries(Object.entries(p.sale).map(([id, n]) => [id, 2 * n])) : p.sale; // market day: the friend's things too
    const label = fs.label ? fs.label : LABEL[fs.mode] ? LABEL[fs.mode] : p.vip ? '⭐ Challenge customer · big tip' : p.truck ? '🚚 Buys a lot at once' : `🧮 ${esc(tier.name)}${tier.ahead ? ' ⭐' : ''}`;
    const intro = fs.mode === 'jobs' ? '<small class="muted">At the big Farmers’ Market:</small><br>' : '';
    const stall = fs.mode === 'pay'
      ? SC.stall({ mode: 'pay', seller: '🧑‍🌾', shopper: MQ.face(st()), goods: fs.icon || '🛍️' })
      : fs.mode === 'make' ? SC.stall({ mode: 'make', seller: MQ.face(st()), shopper: F.WORKS[fs.work].e, goods: Object.entries(fs.recipe.in).map(([id, n]) => `<i>${F.ITEMS[id].e}</i>`.repeat(Math.min(n, 4))).join('') })
      : fs.mode === 'sell' ? SC.stall({ mode: 'sell', seller: MQ.face(st()), shopper: F.NEIGHBOR[0], goods: `<i>${F.ANIMALS[fs.animal].e}</i>` })
      : BANKISH.has(fs.mode) ? SC.stall({ mode: 'bank', seller: '🦉', shopper: MQ.face(st()), goods: '<i>🏦</i>' })
      : fs.mode === 'build' ? SC.stall({ mode: 'bank', seller: '👷', shopper: MQ.face(st()), goods: '<i>🏗️</i>' })
      : fs.mode === 'profit' ? SC.stall({ mode: 'pay', seller: F.MERCHANT.e, shopper: MQ.face(st()), goods: '<i>🧮</i>' })
      : fs.mode === 'mgr' ? SC.stall({ mode: 'mgr', stand: f.stand, seller: MQ.face(st()), shopper: F.MANAGER.e, goods: '<i>💰</i>' })
      : fs.mode === 'order' ? SC.stall({ mode: 'market', stand: f.stand, seller: MQ.face(st()), shopper: p.who[0], goods: SC.goods(fs.order.items), vip: fs.order.big })
      : SC.stall({ mode: fs.mode, stand: fs.mode === 'jobs' ? 9 : f.stand, seller: MQ.face(st()), shopper: p.who[0] + (p.friend ? p.friend[0] : ''), goods: SC.goods(sale), vip: p.vip, market: fs.mode === 'market' && F.marketOn(f) });
    K().render(`<div class="play fplay" style="--wc:${p.vip ? '#b0569e' : '#e0a21b'}">
      <header class="playbar"><button class="iconbtn" data-act="fQuit" aria-label="Stop">✕</button><div class="pstatus">${status}</div>${moneyPill()}</header>
      ${basketBar()}
      ${stall}
      <section class="pcard enter ${p.vip ? 'vip' : ''}" id="pcard">
        <div class="pmeta"><span>${label}</span><span class="pmeta-r">${MQ.canSpeak() ? '<button class="speak" data-act="fSpeak" aria-label="Read the question aloud">🔊</button>' : ''}</span></div>
        <div class="fcust"><div class="ptext wordy">${intro}${p.who ? `<b>${esc(p.who[1])}</b> ` : ''}${p.text}</div></div>
        ${spLine}
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
  const BANKISH = new Set(['deposit', 'withdraw', 'interest', 'lock', 'unlock']);
  const STATUS = {
    pay: () => '🛒 Paying',
    make: () => `${F.WORKS[fs.work].e} ${esc(F.WORKS[fs.work].name)}`,
    sell: () => `${F.NEIGHBOR[0]} Selling to ${esc(F.NEIGHBOR[1])}`,
    deposit: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    withdraw: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    interest: () => `🏦 Bank day · ${fs.n + 1} of ${fs.weeks}`, // fs.n counts the questions done
    build: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    lock: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    unlock: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    profit: () => '🧳 A week charm',
    order: () => '📋 Order board',
    mgr: () => `${F.MANAGER.e} ${esc(F.MANAGER.name)}, the market manager`,
  };
  // At the stand: how far today's shift is (after: this customer was just served).
  const standStatus = (after) => {
    const f = fm(), s = F.shiftToday(f), money = `+${fmt(fs.earned + fs.tips)}`, ic = F.marketOn(f) ? '🎪' : '🏪'; // market day
    return F.shiftDone(f) ? `${ic} Shift done ${F.starText(F.shiftStars(f))} · ${money}` : `${ic} Shift: customer ${after ? s.n : s.n + 1} of ${F.shiftLen(f)} · ${money}`;
  };
  const LABEL = { pay: '🛒 Farm Shop', make: '🧮 Is it worth making?', sell: '💰 Selling animals', deposit: '🏦 Put money in the bank', withdraw: '🏦 Take money out', interest: '🏦 Bank day: interest', build: '🏗️ Pay the builders', lock: '🔒 Locked deposit', unlock: '🔓 Your deposit is back', profit: '🧮 Did it pay off?', order: '📦 Delivering an order', mgr: `${F.MANAGER.e} Your money from the market` };
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
  const NEXT = { pay: 'Back to the farm', make: 'Back to the farm', sell: 'Done', deposit: 'Back to the bank', withdraw: 'Back to the bank', build: 'Back to Big Dreams', lock: 'Back to the bank', unlock: 'Back to the bank', profit: 'Back to the farm', order: 'Back to the farm', mgr: 'Back to the farm' };
  // after the shift's last customer (and when a tired seller misses twice after it): stop here, or go on
  const lockedHtml = () => fs.mode === 'market' && fs.pause && F.saleCount(fm()) ? '<div class="row"><button class="btn ghost big" data-act="fQuit">✓ Close the stand</button><button class="btn big" data-act="fNext">Next customer →</button></div>' : `<div class="row"><button class="btn big" data-act="fNext">${fs.mode === 'interest' ? (fs.n < fs.weeks ? 'Next' : 'Back to the bank') : NEXT[fs.mode] || 'Next customer'} →</button></div>`;
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
    // the shift: its last customer pauses the stand (stop or go on); after it, two misses in a row offer a rest (once)
    let shiftMsg = '';
    if (fs.mode === 'market') {
      const M = F.MANAGER, mila = F.mgrHired(f) && F.saleCount(f);
      fs.missRow = first ? 0 : (fs.missRow || 0) + 1;
      if (r.shift === 'done') {
        fs.pause = true;
        shiftMsg = `<br>🎉 <b>Shift done!</b> ${F.starText(F.shiftStars(f))} ${mila ? `${esc(M.name)} can sell the rest tonight, or keep selling!` : 'Keep selling, or close the stand.'}`;
        MQ.confetti(F.shiftStars(f) === 3 ? 140 : 80, F.shiftStars(f) === 3 ? { colors: ['#ffd23f', '#ffe066', '#ff8a5a'], shape: 'star' } : {});
        MQ.sfx('streak');
      } else if (F.shiftDone(f) && fs.missRow >= 2 && !fs.nudged && F.saleCount(f)) {
        fs.pause = fs.nudged = true;
        shiftMsg = `<br>${MQ.face(st())} You worked hard today! You can stop now${mila ? `: ${esc(M.name)} can sell the rest` : ''}.`;
      }
    }
    const move = MQ.store.preview ? null : F.adapt(f, grade(), first); // in the preview the chosen level stays
    fs.n++;
    fs.earned += r.paid;
    fs.tips += r.tip;
    fs.xp += r.xp;
    if (!p.jobs && !p.noPay) for (const [id, n] of Object.entries(p.sale)) fs.sold[id] = (fs.sold[id] || 0) + n * (p.friend ? 2 : 1);
    save();
    fs.locked = true;
    redrawBasket();
    const thanks = p.noPay ? `${esc(p.who[1])} will come back with more money.` : p.jobs ? `You earned <b>${fmt(r.paid)}</b>.` : `${esc(p.who[1])}${p.friend ? ` and ${esc(p.friend[1])}` : ''} paid <b>${fmt(r.paid)}</b>${r.tip ? ` and tipped <b>${fmt(r.tip)}</b>${r.clover ? ' 🍀' : ''}` : ''}.`;
    if (solved) feedback(`${first ? U.pick(['Great job!', 'Thank you, farmer!', 'Perfect!', 'You got it!']) : 'Got it!'} ${thanks}${move === 'up' ? '<br>⬆️ Harder money problems unlocked!' : ''}${shiftMsg}`, 'ok');
    else feedback(`${shown}<br>${thanks}${shiftMsg}`, 'reveal');
    drawAnswer();
    // the customer takes the things and pays: goods fly to them, coins fly to the money
    const shopper = $('#shopper');
    if (shopper) shopper.classList.add(p.noPay ? 'sad' : 'happy');
    if (!p.jobs && !p.noPay && $('#goods')) { $('#goods').querySelectorAll(':scope > i').forEach((g, k) => SC.fly(g.innerHTML, g, shopper, { delay: k * 90, dur: 500 })); $('#goods').classList.add('gone'); }
    if (r.paid + r.tip) {
      const coins = Math.min(5, 2 + Math.floor((r.paid + r.tip) / (grade() === 'k' ? 3 : 30)));
      SC.flyMany('🪙', coins, p.jobs ? $('#cashbox') : shopper, '#fmoney', { delay: 350, size: '1.5rem' });
      setTimeout(() => { bumpMoney(before); MQ.sfx('coin'); }, SC.reduced() ? 0 : 900);
    }
    const s = $('.pstatus');
    if (s) s.textContent = fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : standStatus(true);
    if (r.ups.length) levelUp(r.ups);
    else if (solved && !fs.pause) autoNext = setTimeout(() => { if (fs && fs.locked && !$('#modal') && $('.fplay')) next(); }, 1700);
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
  const TASKS = new Set(['make', 'deposit', 'interest', 'sell', 'build', 'lock', 'unlock', 'profit', 'order', 'mgr']);
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
    if (fs.mode === 'order' && $('#goods')) { // the things go to the customer, the money to the wallet
      $('#goods').querySelectorAll(':scope > i').forEach((g, k) => SC.fly(g.innerHTML, g, sh, { delay: k * 90, dur: 500 }));
      $('#goods').classList.add('gone');
      SC.flyMany('🪙', 4, sh, '#fmoney', { delay: 350, size: '1.5rem' });
    }
    if (fs.mode === 'mgr') SC.flyMany('🪙', 5, sh, '#fmoney', { delay: 200, size: '1.5rem' });
    feedback(solved ? `${first ? 'Perfect!' : 'Got it!'} ${msg}` : `${shown}<br>${msg}`, solved ? 'ok' : 'reveal');
    drawAnswer();
    const ups = xp((solved ? (first ? 3 : 1) : 0) + (fs.xpBonus || 0)); // an order brings more XP
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
    if (fs.mode === 'market' && !F.saleCount(fm())) return summary(true);
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
    const stars = s.mode === 'market' ? F.shiftStars(fm()) : 0;
    const title = s.mode === 'jobs' ? 'Odd jobs done!' : soldOut ? 'Sold out! 🎉' : stars ? `Shift done! ${F.starText(stars)}` : 'Stand closed';
    K().render(`<main class="result">
      <div class="bigemoji">${s.mode === 'jobs' ? '🧹' : '🏪'}</div>
      <h1 class="title">${title}</h1>
      <p class="lead">${s.mode === 'jobs' ? `${s.n} ${s.n === 1 ? 'job' : 'jobs'}` : `${s.n} ${s.n === 1 ? 'customer' : 'customers'}`} · earned <b>${fmt(s.earned + s.tips)}</b>${s.tips ? ` (tips ${fmt(s.tips)})` : ''} · +${s.xp} XP</p>
      ${sold ? `<p class="muted">Sold: ${sold}</p>` : ''}
      ${s.mode === 'market' && F.saleCount(fm()) ? `<p class="muted">Still in the basket: ${Object.entries(F.forSale(fm())).map(([id, n]) => `${F.ITEMS[id].e} ${n}`).join(' · ')}</p>` : ''}
      ${s.mode === 'market' && Object.keys(F.kept(fm())).length ? `<p class="muted">📋 Kept for your orders: ${Object.entries(F.kept(fm())).map(([id, n]) => `${F.ITEMS[id].e} ${n}`).join(' · ')}</p>` : ''}
      <p>Money now: <b>${fmt(fm().money)}</b></p>
      ${s.mode === 'market' ? mgrBlock() : ''}
      <div class="row"><button class="btn ghost" data-act="go" data-arg="farm:shop">🛒 Shop</button><button class="btn" data-act="go" data-arg="farm">Back to the farm</button></div>
    </main>`);
    MQ.sfx('reward');
    if (soldOut) MQ.confetti(80);
    K().checkBadges();
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
      SC.flyMany(F.ITEMS[out].e, n, from, '#fdbasket');
      SC.floatText(from, `+${n} ${F.ITEMS[out].e}`);
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
    const f = fm(), g = grade(), b = f.bank, due = F.bankDue(f), nights = F.nightsToBankDay(f.day);
    if (F.depositCheck(f, g)) save();
    const nextBank = f.day + nights;
    const proj = F.project(b.bal, g, 6, b.acct), top = Math.max(1, ...proj);
    const bars = proj.map((v, k) => `<div class="bbar"><span class="bv">${fmt(v)}</span><span class="bfill" style="height:${Math.max(4, Math.round((v / top) * 100))}%"></span><small>${k === 0 ? 'Now' : 'Day ' + (nextBank + (k - 1) * F.BANK_WEEK)}</small></div>`).join('');
    // this bank week: 7 farm days, the last one is bank day
    const week = F.bankWeek(f.day).map((d) => `<li class="${d < f.day ? 'past' : d === f.day ? 'now' : ''} ${F.isBankDay(d) ? 'bank' : ''}"><small>Day</small><b>${d}</b>${F.isBankDay(d) ? '<i>🏦</i>' : d < f.day ? '<i>✓</i>' : F.wxOpen(f) && F.isMarketDay(d) ? '<i title="Market day">🎪</i>' : '<i></i>'}</li>`).join('');
    const status = due ? `✨ Bank day! The interest is waiting for you.` : F.isBankDay(f.day) ? `Today was bank day. The next one is farm day ${nextBank}.` : `${nights} more ${nights === 1 ? 'night' : 'nights'} until bank day (farm day ${nextBank}). Tap 🌙 Sleep on the farm to make a night pass.`;
    const LOG = { in: ['⬇️', 'Saved'], out: ['⬆️', 'Took out'], interest: ['✨', 'Interest'], piggy: ['🐷', 'Golden Piggy: interest again'], build: ['🏗️', 'Paid the builders'], dream: ['🏡', 'Your buildings earned'], lock: ['🔒', 'Locked in a deposit'], unlock: ['🔓', 'Deposit came back'] };
    const minus = new Set(['out', 'build', 'lock']);
    const log = b.log.filter((x) => LOG[x.kind]).map((x) => `<li><span>${LOG[x.kind][0]} ${LOG[x.kind][1]}</span><small>${x.day ? 'Farm day ' + x.day : esc(x.d || '')}</small><b class="${x.kind}">${minus.has(x.kind) ? '−' : '+'}${fmt(x.amt)}</b></li>`).join('');
    const inc = b.pend.some((x) => x.inc && x.inc.length);
    K().render(header('🏦 Farm Bank', 'farm') + `<main class="farm fbank">
      <section class="bankcard">
        <div class="bk"><small>In the bank</small><b id="fbankbal">${fmt(b.bal)}</b>${f.dep && f.dep.amt ? `<small class="bk-lock">🔒 + ${fmt(f.dep.amt)} locked</small>` : ''}</div>
        <div class="bk"><small>In your wallet</small><b>${fmt(f.money)}</b></div>
      </section>
      <section class="bweek" aria-label="This bank week"><div class="bweek-t"><b>🏦 This bank week</b><small>Bank day is every ${F.BANK_WEEK}th farm day</small></div><ol>${week}</ol><p class="${due ? 'due' : ''}">${status}</p>${F.piggyWaiting(f) ? '<p class="bpiggy">🐷 The <b>Golden Piggy</b> is waiting: the next interest is paid twice! Save more before bank day, and it brings more.</p>' : ''}</section>
      ${due > 0 ? `<button class="btn big fstand" data-act="fInterest">✨ Collect your interest${inc ? ' and what your buildings earned' : ''}${due > 1 ? ` (${due} bank days)` : ''}</button>` : ''}
      <div class="row"><button class="btn" data-act="fDeposit" ${f.money ? '' : 'disabled'}>⬇️ Save money</button><button class="btn ghost" data-act="fWithdraw" ${b.bal ? '' : 'disabled'}>⬆️ Take money out</button></div>
      ${dreamJar()}
      ${depositCard()}
      ${accountCard()}
      <section class="flevel"><b>How the bank works</b>
        <p>${esc(F.ruleText(g, b.acct))} The money is safe in the bank, and you can take it out any time to spend it.</p>
        <p class="muted">On the morning of bank day the bank looks at what you have saved, and the interest is for that money. If you miss bank days, up to ${F.BANK_MISSED} wait for you.</p></section>
      ${b.bal ? `<h2>📈 If you keep it in the bank</h2><div class="bchart" role="img" aria-label="Savings growing week by week">${bars}</div><p class="muted">Each bank day the bank adds interest, and next time the interest earns interest too.</p>` : ''}
      ${bankSummary()}
      ${log ? `<h2>🧾 My bank book</h2><ul class="blog">${log}</ul>` : ''}
    </main>`, 'is-farm');
    K().setCur('farm:bank');
  }
  // The locked deposit (2nd grade): lock savings in $5 steps for 4 bank weeks; every $5 comes back as $6.
  let depAmt = 0;
  function depositCard() {
    const f = fm(), g = grade(), d = f.dep;
    if (!F.depositOn(f, g)) return '';
    const D = F.DEPOSIT, top = F.bankTop(f.bank.acct, g), ready = F.depositReady(f);
    let body;
    if (ready) body = `<p>Unlocked! You locked <b>${fmt(d.amt)}</b> and <b>${fmt(F.depositBack(d.amt))}</b> comes back to your savings.</p><button class="btn big fdep-go" data-act="fDepCollect">🔓 Collect ${fmt(F.depositBack(d.amt))}</button>`;
    else if (d.amt) {
      const left = d.until - f.day, passed = D.weeks - Math.ceil(left / F.BANK_WEEK);
      body = `<p><b>${fmt(d.amt)}</b> is locked. On bank day, farm day ${d.until} (in ${left} ${left === 1 ? 'night' : 'nights'}), you get <b>${fmt(F.depositBack(d.amt))}</b> back.</p>
        <div class="fdep-weeks" aria-label="${passed} of ${D.weeks} bank weeks">${Array.from({ length: D.weeks }, (_, i) => `<i class="${i < passed ? 'on' : ''}">🏦</i>`).join('')}</div>
        <p class="muted">It can’t be taken out early. Then it goes back to your savings.</p>`;
    } else {
      const max = Math.floor(f.bank.bal / D.step) * D.step;
      if (max < D.step) body = `<p>Lock savings for ${D.weeks} bank weeks: for every <b>${fmt(D.step)}</b>, the bank gives back <b>${fmt(D.back)}</b>.</p><p class="muted">Save at least ${fmt(D.step)} in the bank to start one.</p>`;
      else {
        if (!depAmt || depAmt > max) depAmt = Math.min(max, Math.max(D.step, Math.floor((f.bank.bal - top) / D.step) * D.step));
        const keep = f.bank.bal - depAmt;
        body = `<p>Lock savings for <b>${D.weeks} bank weeks</b>. For every <b>${fmt(D.step)}</b> you lock, the bank gives back <b>${fmt(D.back)}</b>. You can’t take it out early.</p>
          <div class="fdep-pick"><button class="iconbtn" data-act="fDepAmt" data-arg="-1" ${depAmt <= D.step ? 'disabled' : ''} aria-label="Less">−</button><b>${fmt(depAmt)}</b><button class="iconbtn" data-act="fDepAmt" data-arg="1" ${depAmt + D.step > max ? 'disabled' : ''} aria-label="More">+</button></div>
          ${keep < top ? `<p class="fdep-tip">💡 Savings up to ${fmt(top)} already earn 10¢ for every dollar each week, more than a deposit. Lock only what is above ${fmt(top)}: that part earns just 1¢.</p>` : ''}
          <button class="btn big fdep-go" data-act="fDepLock">🔒 Lock ${fmt(depAmt)} for ${D.weeks} bank weeks</button>`;
      }
    }
    return `<section class="fdep ${ready ? 'ready' : d.amt ? 'locked' : ''}"><div class="fdep-pic">${MQ.vaultArt(ready)}</div><div class="fdep-t"><b>${ready ? '🔓' : '🔒'} Locked deposit</b>${body}</div></section>`;
  }
  function startLock() {
    const f = fm(), g = grade(), amt = depAmt, back = F.depositBack(amt), n = amt / F.DEPOSIT.step;
    if (!F.depositOn(f, g) || f.dep.amt || amt > f.bank.bal) return bank();
    fs = { mode: 'lock', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank',
      done: () => (F.lockDeposit(fm(), grade(), amt) ? `🔒 <b>${fmt(amt)}</b> is locked until bank day, farm day ${fm().dep.until}. Then you get <b>${fmt(back)}</b> back!` : 'It is already locked.') };
    show({ type: 'deposit', kind: 'choice', answer: fmt(back), choices: F.moneyChoices(back, g, [amt + 100, amt, back + F.DEPOSIT.step]),
      text: `You lock <b>${fmt(amt)}</b> for ${F.DEPOSIT.weeks} bank weeks. For every <b>${fmt(F.DEPOSIT.step)}</b>, the bank gives back <b>${fmt(F.DEPOSIT.back)}</b>. <b>How much do you get back?</b>`,
      hint: `How many ${fmt(F.DEPOSIT.step)} are in ${fmt(amt)}? Each one comes back as ${fmt(F.DEPOSIT.back)}.`,
      explain: `${fmt(amt)} is ${n} × ${fmt(F.DEPOSIT.step)}, so you get ${n} × ${fmt(F.DEPOSIT.back)} = ${fmt(back)}`, sale: {}, total: 0 });
  }
  function startUnlock() {
    const f = fm(), g = grade();
    if (!F.depositReady(f)) return bank();
    const back = F.depositBack(f.dep.amt), bal = f.bank.bal, ans = bal + back;
    fs = { mode: 'unlock', n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank',
      done: () => { const x = F.collectDeposit(fm()); MQ.confetti(140, { colors: ['#ffd23f', '#ffe066', '#9d7bff'], shape: 'star' }); return x ? `🔓 <b>${fmt(x.back)}</b> is back in your savings: <b>${fmt(x.back - x.amt)}</b> more than you locked! Now you have <b>${fmt(fm().bank.bal)}</b>.` : ''; } };
    show(Object.assign({ type: 'deposit', text: `Your locked deposit unlocked! <b>${fmt(back)}</b> goes back to your savings. You have <b>${fmt(bal)}</b> in the bank now. <b>How much will you have?</b>`,
      hint: `Add ${fmt(back)} to ${fmt(bal)}.`, explain: `${fmt(bal)} + ${fmt(back)} = ${fmt(ans)}`, sale: {}, total: 0 }, ans < 100 ? { kind: 'num', answer: ans, unit: '¢' } : { kind: 'choice', answer: fmt(ans), choices: F.moneyChoices(ans, g, [bal, back]) }));
  }
  // The bank is the Big Dream's piggy bank: how much of the next stage is saved.
  function dreamJar() {
    const f = fm(), g = grade(), n = F.dreamOpen(f) && F.dreamNext(f, g);
    if (!n) return '';
    const left = n.cost - f.bank.bal;
    return `<button class="fdreamjar t-${n.d.id}" data-act="go" data-arg="farm:dreams"><span>🏗️</span><span><b>Saving for: ${n.st.e} ${esc(n.st.name)}</b> (${esc(n.d.name)})<small>${f.dream.b ? 'The builders are working on it tonight.' : left > 0 ? `${fmt(n.cost)} · ${fmt(left)} to go` : `${fmt(n.cost)} · you have enough! Pay the builders 🎉`}</small></span></button>`;
  }
  // All time: how much the child saved and took out, how much the bank added, and what the money in the bank is made of.
  function bankSummary() {
    const s = F.bankSummary(fm());
    if (!s.saved) return '';
    const tile = (cls, label, v) => `<div class="${cls}"><small>${label}</small><b>${fmt(v)}</b></div>`;
    return `<h2>📊 My savings, all time</h2><section class="bsum">
      <div class="bsum-k">${tile('in', '⬇️ Saved', s.saved)}${tile('int', '✨ Interest', s.interest)}${s.dreamIn ? tile('in', '🏡 Buildings earned', s.dreamIn) : ''}${s.tookOut ? tile('out', '⬆️ Took out', s.tookOut) : ''}${s.built ? tile('out', '🏗️ Paid builders', s.built) : ''}</div>
      ${s.bal ? `<div class="bsum-bar" aria-hidden="true">${s.own ? `<span class="own" style="flex-grow:${s.own}"></span>` : ''}${s.fromInterest ? `<span class="int" style="flex-grow:${s.fromInterest}"></span>` : ''}</div>
      <p class="bsum-t">In the bank now: <b>${fmt(s.bal)}</b> = <b class="own">${fmt(s.own)}</b> your money + <b class="int">${fmt(s.fromInterest)}</b> interest</p>` : ''}
      <p class="muted">${s.interest ? `The bank added ${fmt(s.interest)} in ${s.days} bank ${s.days === 1 ? 'day' : 'days'}, just because you saved.` : 'On bank day the bank adds interest to what you saved.'}</p></section>`;
  }
  // Your bank account: how much of the savings earns the big interest, and the next, better account.
  function accountCard() {
    const f = fm(), g = grade(), a = F.account(f), parts = F.interestParts(f.bank.bal, g, f.bank.acct);
    const big = grade() === 'k' ? '1¢ for every 10¢' : '10¢ for every dollar', small = grade() === 'k' ? '1¢ for every 100¢' : '1¢ for every dollar';
    const over = f.bank.bal > parts.top;
    const x = F.shopItem(f, g, 'acct');
    let up = '';
    if (x) {
      const btn = x.locked ? `<span class="flock">🔒 Level ${x.lv}</span>` : f.money >= x.price ? `<button class="btn" data-act="fBuy" data-arg="acct">Upgrade · ${fmt(x.price)}</button>` : f.goal === 'acct' ? '<span class="fown">⭐ Goal</span>' : `<button class="btn ghost" data-act="fGoal" data-arg="acct">⭐ Save up · ${fmt(x.price)}</button>`;
      const nx = F.ACCOUNTS[(f.bank.acct || 0) + 1];
      up = `<div class="bacct-next"><span class="fe">${nx.e}</span><span class="fitem-t"><b>${esc(nx.name)}</b><small>${big} up to ${fmt(nx.top[g === 'k' ? 0 : 1])}</small></span><span class="fside">${btn}</span></div>`;
    }
    return `<section class="flevel bacct"><b>${a.e} Your account: ${esc(a.name)}</b>
      <p>${big} up to <b>${fmt(parts.top)}</b>, then ${small}.</p>
      ${over ? `<p class="muted">You have ${fmt(f.bank.bal - parts.top)} above ${fmt(parts.top)}: that part only earns ${small}.${x ? ' A better account makes more of your savings earn the big interest.' : ''}</p>` : ''}
      ${up || '<p class="muted">👑 The best account in the bank!</p>'}</section>`;
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
    const f = fm(), weeks = f.bank.pend.reduce((n, p) => n + (p.paid ? 0 : 1) + (p.inc && p.inc.length ? 1 : 0), 0);
    if (!weeks) return bank();
    fs = { mode: 'interest', weeks, n: 0, earned: 0, tips: 0, xp: 0, back: 'farm:bank' };
    interestQuestion();
  }
  // One bank day: work out this week's interest, then it is added.
  function interestQuestion() {
    const f = fm(), g = grade(), pend = f.bank.pend[0];
    if (!pend) return next();
    if (pend.paid) return incomeQuestion(pend);
    fs.label = '';
    const bal = pend.bal, { top, per, add, big, small, x } = F.interestParts(bal, g, f.bank.acct);
    fs.done = () => {
      const got = F.payInterest(fm(), g);
      if (!got.bonus) return `The bank added <b>${fmt(got.x)}</b>. Now you have <b>${fmt(fm().bank.bal)}</b> saved.`;
      MQ.confetti(120, { colors: ['#ffd23f', '#ffe066', '#ff8fb3'], shape: 'star' });
      return `The bank added <b>${fmt(got.x)}</b>, and 🐷 the <b>Golden Piggy</b> doubled it: <b>+${fmt(got.bonus)}</b> more (it cost ${fmt(got.cost)})! Now you have <b>${fmt(fm().bank.bal)}</b> saved.`;
    };
    const unit = per === 100 ? 'whole dollar' : fmt(per), units = per === 100 ? 'whole dollars' : 'tens';
    const lowUnit = g === 'k' ? '100¢' : 'whole dollar', over = bal > top, rest = bal - top;
    const p = over
      ? { type: 'interest', text: `Bank day, farm day ${pend.day}: that morning you had <b>${fmt(bal)}</b> in the bank. The bank adds <b>${fmt(add)} for every ${unit}</b> up to <b>${fmt(top)}</b>, and <b>1¢ for every ${lowUnit}</b> above ${fmt(top)}. How much interest do you get this week?`,
        hint: `Split it into two parts. The first ${fmt(top)}: ${per === 100 ? 'each whole dollar brings 10¢' : 'each ten brings 1¢'}. The rest above ${fmt(top)}: each ${lowUnit} brings 1¢. Then add the two parts.`,
        explain: `First ${fmt(top)}: ${big} × ${fmt(add)} = ${fmt(big * add)}. Above it: ${fmt(bal)} − ${fmt(top)} = ${fmt(rest)}, that is ${small} × 1¢ = ${fmt(small)}. ${fmt(big * add)} + ${fmt(small)} = ${fmt(x)}`, sale: {}, total: 0 }
      : { type: 'interest', text: `Bank day, farm day ${pend.day}: that morning you had <b>${fmt(bal)}</b> in the bank. The bank adds <b>${fmt(add)} for every ${unit}</b> (up to ${fmt(top)}). How much interest do you get this week?`,
        hint: per === 100 ? `How many whole dollars are in ${fmt(bal)}? Each one brings 10¢.` : `How many tens are in ${bal}? Each ten brings 1¢.`,
        explain: `${fmt(bal)} has ${big} ${units}: ${big} × ${fmt(add)} = ${fmt(x)}`, sale: {}, total: 0 };
    // likely slips on two-part interest: forgetting the part above the limit, or the big rate on all of it
    const traps = over ? [big * add, Math.floor(bal / per) * add] : [];
    Object.assign(p, g === 'k' || x < 100 ? { kind: 'num', answer: x, unit: '¢' } : { kind: 'choice', answer: fmt(x), choices: F.moneyChoices(x, g, traps) });
    if (!x) { F.payInterest(f, g); fs.n++; save(); return next(); } // nothing to work out on a tiny balance
    show(p);
  }
  // What the Big Dreams' buildings earned that bank day goes into the bank: add it up.
  function incomeQuestion(pend) {
    const f = fm(), g = grade(), inc = pend.inc, x = F.incomeOf(pend), bal = f.bank.bal;
    fs.label = '🏗️ Bank day: your buildings';
    fs.done = () => { const got = F.payIncome(fm()); return `Your buildings earned <b>${fmt(got.x)}</b>. It went into the bank: now you have <b>${fmt(fm().bank.bal)}</b> saved.`; };
    const list = inc.map(([e, nm, a]) => `${e} ${esc(nm)} <b>${fmt(a)}</b>`).join(', ');
    const p = inc.length > 1
      ? { type: 'income', text: `Bank day, farm day ${pend.day}: your buildings earned money! ${list}. <b>How much did they earn in all?</b>`, hint: 'Add them up: the dollars first, then the cents.', explain: `${inc.map((y) => fmt(y[2])).join(' + ')} = ${fmt(x)}`, sale: {}, total: 0 }
      : { type: 'income', text: `Bank day, farm day ${pend.day}: your ${inc[0][0]} ${esc(inc[0][1])} earned <b>${fmt(x)}</b>! It goes into the bank. You have <b>${fmt(bal)}</b> in the bank. <b>How much will you have then?</b>`, hint: `Add ${fmt(x)} to ${fmt(bal)}.`, explain: `${fmt(bal)} + ${fmt(x)} = ${fmt(bal + x)}`, sale: {}, total: 0 };
    const ans = inc.length > 1 ? x : bal + x;
    Object.assign(p, ans < 100 ? { kind: 'num', answer: ans, unit: '¢' } : { kind: 'choice', answer: fmt(ans), choices: F.moneyChoices(ans, g, inc.length > 1 ? [] : [bal, x]) });
    show(p);
  }

  // ---------------------------------------------------------------- routing
  function show_(arg, quiet = false) {
    clearTimeout(autoNext);
    fs = null;
    if (arg === 'shop') return shop();
    if (arg === 'bank') { if (!quiet) depAmt = 0; return F.level(fm().xp).level >= F.BANK_LV ? (quiet ? keepY(bank) : bank()) : main(); }
    if (arg === 'dreams') return F.dreamOpen(fm()) ? (quiet ? keepY(dreams) : (dreamView = null, dreams())) : main();
    if (quiet) return keepY(main); // another device changed something: redraw in place
    lastDock = null;
    main();
    if (backY !== null) { window.scrollTo(0, backY); backY = null; }
    if (!quiet && st().settings.readAloud) MQ.speak(tipText());
  }
  const A = {
    fBed: (a, el) => bed(+a, el),
    fPen: (a, el) => pen(+a, el),
    fHouse: (a, el) => house(a, el),
    fYardShop: () => { tab = 'animals'; K().go('farm:shop'); setTimeout(() => { const el = $('.fyard'); if (el) el.scrollIntoView({ block: 'start' }); }, 50); },
    fHouseLater: (a) => K().toast(`${F.ANIMALS[a].e} The ${F.HOUSES[a].name.toLowerCase()} opens at farm level ${F.HOUSES[a].lv}`),
    fMove: (a) => moveToHouse(+a),
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
    fSellAsk: (a) => sellAsk(+a),
    fSell: (a) => startSell(+a),
    fDeposit: () => startDeposit(),
    fWithdraw: () => startWithdraw(),
    fInterest: () => startInterest(),
    fBuild: () => startBuild(),
    fDepAmt: (a) => { depAmt += +a * F.DEPOSIT.step; MQ.sfx('tap'); keepY(bank); },
    fDepLock: () => startLock(),
    fDepCollect: () => startUnlock(),
    fMerchant: () => merchant(),
    fOrders: () => orders(),
    fWeather: () => weather(),
    fDeliver: (a) => startDeliver(+a),
    fOrderNo: (a) => orderNo(+a),
    fOrderDrop: (a) => { F.dropOrder(fm(), +a); save(); redraw(); orders(); },
    fBuyTreasure: () => buyTreasure(),
    fBuyCharm: (a) => buyCharm(a),
    fCharm: (a) => charmInfo(a),
    fBoost: (a) => boostInfo(a),
    fBuyBoost: (a) => buyBoost(a),
    fProfit: (a) => startProfit(+a),
    fMgrSell: () => mgrSell(),
    fMgrStay: () => mgrStay(),
    fMgrCollect: () => startMgr(),
    fTreasureGoal: (a) => { fm().goal = 'treasure:' + a; save(); MQ.sfx('tap'); K().toast('⭐ Saving goal set'); if ($('#modal')) merchant(); },
    fDreamView: (a) => { dreamView = +a === fm().dream.p ? null : +a; MQ.sfx('tap'); keepY(dreams); },
    fJobs: () => startJobs(),
    fTab: (a) => { tab = a; shop(); },
    fGoal: (a) => { fm().goal = a; save(); MQ.sfx('tap'); K().toast('⭐ Saving goal set'); if (document.querySelector('.fbank')) bank(); else shop(); },
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
      startPay(x.price, `${x.e} ${esc(x.name)}`, () => { F.buy(fm(), grade(), a); return a === 'acct' ? `${x.e} ${esc(x.name.replace('Bank: ', ''))} is yours! More of your savings earn the big interest.` : a.startsWith('house:') ? `${x.e} The ${esc(x.name.toLowerCase())} is yours, with one ${esc(F.ANIMALS[a.slice(6)].name.toLowerCase())}! Feed it in the barnyard on your farm.` : a === 'mgr' ? `${x.e} ${esc(F.MANAGER.name)} works on your farm now! After your shift at the stand, she can sell the rest overnight.` : `${x.e} ${esc(x.name)} is yours!`; }, icon);
      fs.back = a === 'acct' ? 'farm:bank' : 'farm:shop'; // a new account: see it at the bank
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
