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
    const hungry = f.pens.filter((p) => p.a && !p.fed);
    let t;
    if (F.bankDue(f) > 0) t = 'It’s bank day! Your savings grew. Go to the bank to collect the interest.';
    else if (F.canBuild(f, grade())) t = 'You saved enough in the bank for your Big Dream! Pay the builders 🏗️';
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
    const bankDay = F.bankDue(f) > 0, nights = F.nightsToBankDay(f.day);
    K().render(header('🌻 Sunny Farm') + `<main class="farm">
      <section class="flevel">
        <div class="flv"><b>Farm level ${lv.level} · ${esc(F.title(lv.level))}</b><span>Farm day ${f.day} · ${F.STANDS[f.stand].e} ${esc(F.STANDS[f.stand].name)}</span></div>
        <div class="fbar xp" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pctv}%"></span></div>
        <small class="muted">${f.xp - lv.from} / ${lv.to - lv.from} XP to level ${lv.level + 1} · Money problems: ${tier.ahead ? '⭐ ' : ''}${esc(tier.name)}</small>
      </section>
      ${MQ.store.preview ? pvTiers() : ''}
      ${goalBar()}
      ${dreamCard()}
      ${bankDay ? `<button class="fbankday" data-act="go" data-arg="farm:bank">🏦 <b>Bank day!</b> Your savings earned interest. Tap to collect it.</button>` : ''}
      ${tipLine()}
      <button class="btn big fstand" data-act="fMarket" ${n ? '' : 'disabled'}>🏪 Open the stand ${n ? `· ${n} to sell` : '· basket is empty'}</button>
      <div class="fbtns">
        <button class="tile" data-act="go" data-arg="farm:shop"><span class="ti">🛒</span><b>Shop</b><small>Animals, feed, more</small></button>
        ${lv.level >= F.BANK_LV ? `<button class="tile ${bankDay ? 'hot' : ''}" data-act="go" data-arg="farm:bank"><span class="ti">🏦</span><b>Bank</b><small>${bankDay ? '🏦 Bank day today!' : f.bank.bal ? `${fmt(f.bank.bal)} · 🏦 in ${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Save and earn'}</small></button>` : `<button class="tile locked" disabled><span class="ti">🏦</span><b>Bank</b><small>🔒 Level ${F.BANK_LV}</small></button>`}
        <button class="tile" data-act="fJobs"><span class="ti">🧹</span><b>Odd jobs</b><small>Earn at the big market</small></button>
        <button class="tile" data-act="fSleep"><span class="ti">🌙</span><b>Sleep</b><small>Start farm day ${f.day + 1}</small></button>
      </div>
      ${SC.farm(f, g)}
      ${f.helper.hired ? `<div class="fhelp">🧑‍🌾 <span>Farmhand ${F.HELPER.name} ${f.helper.on ? `feeds the animals at night and collects in the morning · ${fmt(F.HELPER.wage[g === 'k' ? 0 : 1])} a day` : 'is taking a break'}</span><button class="btn ghost" data-act="fHelper">${f.helper.on ? 'Pause' : 'Back to work'}</button></div>` : ''}
      <h2>🧺 Basket</h2>
      <div class="fbasket" id="fbasket">${basket}</div>
      <p class="muted center">Sold ${f.stats.sold} things · earned ${fmt(f.stats.earned)} in all</p>
    </main>
    <nav class="fdock" aria-label="Farm resources and quick actions"><div class="fdock-in">
      <div class="fdock-row">
        <span class="fstat" id="fdmoney" title="Money">💰 <b>${fmt(f.money)}</b></span>
        <span class="fstat" id="fdbasket" title="In the basket">🧺 <b>${n}</b></span>
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
    </div></nav>`, 'is-farm');
    K().setCur('farm');
    dockChanges({ money: f.money, basket: n, feed: f.feed });
    if (F.dreamOpen(f) && !f.dream.seen && !MQ.store.preview) setTimeout(() => { if (!$('#modal') && $('.fdream')) dreamIntro(); }, 500);
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
    got.forEach(([r, e, n], k) => { SC.flyMany(e, Math.min(n, 4), r, '#fdbasket', { delay: k * 150 }); SC.floatText(r, `+${n} ${e}`, { delay: k * 150 }); });
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
      SC.flyMany(it.e, Math.min(n, 5), from, '#fdbasket');
      SC.floatText(from, `+${n} ${it.e}`);
      return;
    }
    const eat = F.penEat(p);
    const r = F.feed(f, i);
    if (r === 'ok') {
      MQ.sfx('tap');
      const from = $('#ffeed') && $('#ffeed').getBoundingClientRect();
      save();
      redraw();
      const to = penEl(i);
      SC.fly('🌾', from, to, { land: () => { MQ.sfx('correct'); SC.burst(penEl(i)); hop(i); SC.floatText(penEl(i), `−${eat} 🌾`, { minus: true }); } });
      return;
    }
    if (r === 'nofeed') return K().modal(`<div class="bigemoji">🌾</div><div class="mtitle">Not enough feed</div><p>${F.penCount(p) > 1 ? F.penCount(p) + ' × ' : ''}${esc(F.ANIMALS[p.a].name)} ${F.penCount(p) > 1 ? 'eat' : 'eats'} ${F.penEat(p)} 🌾 a day. You have ${f.feed}.</p><div class="row"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn ghost" data-act="fSellAsk" data-arg="${i}">💰 Sell</button><button class="btn" data-act="go" data-arg="farm:shop">Buy feed</button></div>`);
    const a = F.ANIMALS[p.a], sg = F.animalStage(p);
    const k = F.penMakes(p), cnt = F.penCount(p);
    K().modal(`<div class="bigemoji">${sg ? a.e : a.baby}</div><div class="mtitle">${cnt > 1 ? cnt + ' × ' : ''}${esc(a.name)}</div><p>${sg < 2 ? `Grows up after ${a.grow[1] - p.g} more fed ${a.grow[1] - p.g === 1 ? 'day' : 'days'}. Then this pen gives ${k} ${F.ITEMS[a.item].e} every day it is fed.` : `This pen gives ${k} ${F.ITEMS[a.item].e} every morning after a day it was fed.`}</p><p class="muted">Already fed today. Tap 🌙 Sleep for a new day.</p><div class="row"><button class="btn ghost" data-act="fUpgrades">⬆️ Upgrades</button><button class="btn ghost" data-act="fSellAsk" data-arg="${i}">💰 Sell</button><button class="btn" data-act="closeModal">OK</button></div>`);
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
    fedNow.forEach((i, k) => SC.fly('🌾', from, penEl(i), { delay: k * 140, land: () => { SC.burst(penEl(i), '❤️', 2); hop(i); SC.floatText(penEl(i), `−${F.penEat(f.pens[i])} 🌾`, { minus: true }); } }));
  }
  function collectAll() {
    const f = fm(), got = [];
    f.pens.forEach((p, i) => { if (p.ready) { const r = penEl(i).getBoundingClientRect(), e = F.ITEMS[F.ANIMALS[p.a].item].e; got.push([r, e, F.collect(f, i)]); } });
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
    const h = news.helper;
    if (h && h.unpaid) lines.push(`🧑‍🌾 ${F.HELPER.name} didn’t work last night: there wasn’t ${fmt(h.wage)} in your wallet for the wage.`);
    else if (h) lines.push(`🧑‍🌾 ${F.HELPER.name} was paid ${fmt(h.wage)}, fed ${h.fed} ${h.fed === 1 ? 'pen' : 'pens'}${h.collected ? `, collected ${h.collected}` : ''}${h.picked ? `, picked ${h.picked}` : ''}.${h.short ? ` Not enough feed for ${h.short}!` : ''}`);
    for (const it of news.cooked) lines.push(`${F.ITEMS[it].e} Your ${esc(F.ITEMS[it].name)} is ready in the workshop!`);
    for (const [a, sg] of news.grew) lines.push(`${F.ANIMALS[a].e} Your ${esc(F.ANIMALS[a].name.toLowerCase())} ${sg === 2 ? 'is all grown up!' : 'got bigger'}`);
    for (const [a, n] of Object.entries(count(news.hungry))) lines.push(`${F.ANIMALS[a].e} ${n > 1 ? n + ' ' : ''}${esc(F.ANIMALS[a].name.toLowerCase())}${n > 1 ? 's were' : ' was'} hungry and didn’t grow. Feed animals before bed!`);
    const b = news.built;
    K().modal(`${b ? builtBlock(b) : '<div class="bigemoji">☀️</div>'}<div class="mtitle">Good morning! Farm day ${f.day}</div>
      ${lines.length ? `<ul class="funlocks">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : b ? '' : '<p>A quiet night on the farm.</p>'}
      <div class="row"><button class="btn" data-act="closeModal">Let’s go!</button>${b && !F.dreamDone(fm()) ? '<button class="btn ghost" data-act="go" data-arg="farm:dreams">🏗️ Big Dreams</button>' : ''}</div>`);
    if (b) {
      MQ.sfx('fanfare');
      MQ.confetti(b.done ? 240 : 150, b.d.castle ? { colors: ['#ffd23f', '#ff8fe0', '#9d7bff', '#ffffff'], shape: 'star', rain: b.done } : b.done ? { colors: ['#ffd23f', '#ffe066', '#ff8a5a', '#7ed957'], shape: 'star' } : {});
      if (st().settings.voice !== false) MQ.speak(b.done ? `Your ${b.d.name} is finished!` : `The builders finished the ${b.st.name.toLowerCase()}!`);
      K().checkBadges();
    } else MQ.sfx('reward');
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
          <p class="muted">The builders are paid from the bank, not from your wallet.${f.money ? ` You have ${fmt(f.money)} in your wallet: put it in the bank!` : ''}</p>
          <button class="btn" data-act="go" data-arg="farm:bank">🏦 Go to the bank</button></div>`;
      if (n.pay) {
        // the same money kept in the bank: what it would add to this bank day's interest
        const base = Math.max(f.bank.bal, n.cost), inBank = F.interest(base, g, f.bank.acct) - F.interest(base - n.cost, g, f.bank.acct);
        lesson = `<section class="dlesson"><b>💡 Bank or building?</b>
          <p>${n.st.e} ${esc(n.st.name)} earns <b>${fmt(n.pay)}</b> every bank day. It pays for itself in <b>${F.payback(n.cost, n.pay)} bank days</b>, and after that it is all profit.</p>
          <p>Kept in the bank, ${fmt(n.cost)} would earn about <b>${fmt(inBank)}</b> a bank day${base > F.bankTop(f.bank.acct, g) ? ` (savings above ${fmt(F.bankTop(f.bank.acct, g))} earn only the small interest)` : ''}, and you could take it out any time. Spent on the building, the money is gone, but the building earns every bank day.</p></section>`;
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
  const TABS = [['animals', '🐔 Animals & feed'], ['up', '⬆️ Upgrades'], ['farm', '🏡 Farm'], ['decor', '✨ Decorations']];
  function shop() {
    const f = fm(), list = F.shop(f, grade()).filter((x) => x.tab === tab);
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
    const rows = feed.length ? `${feed.map(row).join('')}</div>${myPens()}<h2>🐾 Animals</h2><div class="fitems">${list.filter((x) => !feed.includes(x)).map(row).join('')}` : list.map(row).join('');
    K().render(header('🛒 Farm Shop', 'farm') + `<main class="farm">
      <div class="ftabs" role="tablist">${TABS.map(([id, n]) => `<button class="chip ${tab === id ? 'sel' : ''}" role="tab" aria-selected="${tab === id}" data-act="fTab" data-arg="${id}">${n}</button>`).join('')}</div>
      ${goalBar()}
      <p class="muted">${tab === 'up' ? 'Your farm has room for 6 garden beds and 6 pens. Make them better: more crops, faster growth, more animals in each pen.' : 'You pay with coins and bills, like in a real store. Tap ⭐ Save up to make something your goal.'}</p>
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
    K().modal(`<div class="bigemoji">${F.NEIGHBOR[0]}${a.e}</div><div class="mtitle">Sell ${n > 1 ? n + ' × ' : 'your '}${esc(a.name.toLowerCase())}?</div>
      <p>${esc(F.NEIGHBOR[1])} next door would love ${n > 1 ? 'them' : 'it'}! She pays half of the shop price. The pen will be empty, ready for any animal.</p>
      ${ups.length ? `<p class="muted">The pen’s upgrades (${esc(ups.join(', '))}) go with the animals.</p>` : ''}
      ${p.ready ? `<p class="muted">The ${esc(F.ITEMS[a.item].many)} they made go to your basket first.</p>` : ''}
      <div class="row"><button class="btn ghost" data-act="closeModal">Keep ${n > 1 ? 'them' : 'it'}</button><button class="btn" data-act="fSell" data-arg="${i}">💰 Sell</button></div>`);
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
    if (!F.basketCount(fm())) return K().toast('The basket is empty');
    fs = { mode: 'market', n: 0, earned: 0, tips: 0, xp: 0, sold: {}, start: Object.assign({}, fm().basket) };
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
    const p = F.customer(f, grade(), { stock: jobs ? F.jobStock(f) : f.basket, vip, jobs, truck });
    if (!p) return summary(true);
    show(p);
  }
  // At the stand: what was in the basket when the stand opened, how much is sold and how much is left, per thing.
  // The things this customer wants are marked.
  function basketBar() {
    if (!fs || fs.mode !== 'market' || !fs.start) return '';
    const f = fm(), ids = Object.keys(fs.start).filter((id) => fs.start[id] > 0);
    const want = new Set(fs.locked || !fs.p ? [] : Object.keys(fs.p.sale || {}));
    const left = U.sum(ids.map((id) => f.basket[id] || 0)), sold = U.sum(ids.map((id) => fs.sold[id] || 0)), all = left + sold;
    const chips = ids.map((id) => {
      const l = f.basket[id] || 0, n = fs.sold[id] || 0;
      return `<li class="${l ? '' : 'out'} ${want.has(id) ? 'want' : ''}" title="${esc(F.ITEMS[id].many)}: ${n} sold, ${l} left"><i>${F.ITEMS[id].e}</i><b>${l ? l : '✓'}</b>${n ? `<small>${n} sold</small>` : ''}</li>`;
    }).join('');
    return `<section class="fbbar" id="fbbar" aria-label="Basket: ${sold} sold, ${left} left">
      <div class="fbbar-t"><span>🧺 Sold <b>${sold}</b> of ${all}</span><span><b>${left}</b> left to sell</span></div>
      <span class="fbar"><span style="width:${all ? Math.round((sold / all) * 100) : 0}%"></span></span>
      <ul>${chips}</ul></section>`;
  }
  const redrawBasket = () => { const el = $('#fbbar'); if (el) el.outerHTML = basketBar(); };
  function show(p) {
    if ($('.scene')) backY = window.scrollY;
    Object.assign(fs, { p, tries: 0, input: '', tray: [], locked: false, step: 'main', pick: null });
    const f = fm(), tiers = F.tiers(grade()), tier = tiers[(p.tier || f.tier) - 1];
    const status = STATUS[fs.mode] ? STATUS[fs.mode]() : fs.mode === 'jobs' ? `🧹 Odd jobs · ${fs.n} done · +${fmt(fs.earned)}` : `🏪 Customer ${fs.n + 1} · +${fmt(fs.earned + fs.tips)}`;
    const label = fs.label ? fs.label : LABEL[fs.mode] ? LABEL[fs.mode] : p.vip ? '⭐ Challenge customer · big tip' : p.truck ? '🚚 Buys a lot at once' : `🧮 ${esc(tier.name)}${tier.ahead ? ' ⭐' : ''}`;
    const intro = fs.mode === 'jobs' ? '<small class="muted">At the big Farmers’ Market:</small><br>' : '';
    const stall = fs.mode === 'pay'
      ? SC.stall({ mode: 'pay', seller: '🧑‍🌾', shopper: MQ.face(st()), goods: fs.icon || '🛍️' })
      : fs.mode === 'make' ? SC.stall({ mode: 'make', seller: MQ.face(st()), shopper: F.WORKS[fs.work].e, goods: Object.entries(fs.recipe.in).map(([id, n]) => `<i>${F.ITEMS[id].e}</i>`.repeat(Math.min(n, 4))).join('') })
      : fs.mode === 'sell' ? SC.stall({ mode: 'sell', seller: MQ.face(st()), shopper: F.NEIGHBOR[0], goods: `<i>${F.ANIMALS[fs.animal].e}</i>` })
      : BANKISH.has(fs.mode) ? SC.stall({ mode: 'bank', seller: '🦉', shopper: MQ.face(st()), goods: '<i>🏦</i>' })
      : fs.mode === 'build' ? SC.stall({ mode: 'bank', seller: '👷', shopper: MQ.face(st()), goods: '<i>🏗️</i>' })
      : SC.stall({ mode: fs.mode, stand: fs.mode === 'jobs' ? 9 : f.stand, seller: MQ.face(st()), shopper: p.who[0], goods: SC.goods(p.sale), vip: p.vip });
    K().render(`<div class="play fplay" style="--wc:${p.vip ? '#b0569e' : '#e0a21b'}">
      <header class="playbar"><button class="iconbtn" data-act="fQuit" aria-label="Stop">✕</button><div class="pstatus">${status}</div>${moneyPill()}</header>
      ${basketBar()}
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
    sell: () => `${F.NEIGHBOR[0]} Selling to ${esc(F.NEIGHBOR[1])}`,
    deposit: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    withdraw: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
    interest: () => `🏦 Bank day · ${fs.n + 1} of ${fs.weeks}`, // fs.n counts the questions done
    build: () => `🏦 Bank: ${fmt(fm().bank.bal)}`,
  };
  const LABEL = { pay: '🛒 Farm Shop', make: '🧮 Is it worth making?', sell: '💰 Selling animals', deposit: '🏦 Put money in the bank', withdraw: '🏦 Take money out', interest: '🏦 Bank day: interest', build: '🏗️ Pay the builders' };
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
  const NEXT = { pay: 'Back to the farm', make: 'Back to the farm', sell: 'Done', deposit: 'Back to the bank', withdraw: 'Back to the bank', build: 'Back to Big Dreams' };
  const lockedHtml = () => `<div class="row"><button class="btn big" data-act="fNext">${fs.mode === 'interest' ? (fs.n < fs.weeks ? 'Next' : 'Back to the bank') : NEXT[fs.mode] || 'Next customer'} →</button></div>`;
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
    redrawBasket();
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
  const TASKS = new Set(['make', 'deposit', 'interest', 'sell', 'build']);
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
      ${s.mode === 'market' && F.basketCount(fm()) ? `<p class="muted">Still in the basket: ${Object.entries(fm().basket).filter(([, n]) => n > 0).map(([id, n]) => `${F.ITEMS[id].e} ${n}`).join(' · ')}</p>` : ''}
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
    const nextBank = f.day + nights;
    const proj = F.project(b.bal, g, 6, b.acct), top = Math.max(1, ...proj);
    const bars = proj.map((v, k) => `<div class="bbar"><span class="bv">${fmt(v)}</span><span class="bfill" style="height:${Math.max(4, Math.round((v / top) * 100))}%"></span><small>${k === 0 ? 'Now' : 'Day ' + (nextBank + (k - 1) * F.BANK_WEEK)}</small></div>`).join('');
    // this bank week: 7 farm days, the last one is bank day
    const week = F.bankWeek(f.day).map((d) => `<li class="${d < f.day ? 'past' : d === f.day ? 'now' : ''} ${F.isBankDay(d) ? 'bank' : ''}"><small>Day</small><b>${d}</b>${F.isBankDay(d) ? '<i>🏦</i>' : d < f.day ? '<i>✓</i>' : '<i></i>'}</li>`).join('');
    const status = due ? `✨ Bank day! The interest is waiting for you.` : F.isBankDay(f.day) ? `Today was bank day. The next one is farm day ${nextBank}.` : `${nights} more ${nights === 1 ? 'night' : 'nights'} until bank day (farm day ${nextBank}). Tap 🌙 Sleep on the farm to make a night pass.`;
    const LOG = { in: ['⬇️', 'Saved'], out: ['⬆️', 'Took out'], interest: ['✨', 'Interest'], build: ['🏗️', 'Paid the builders'], dream: ['🏡', 'Your buildings earned'] };
    const log = b.log.filter((x) => LOG[x.kind]).map((x) => `<li><span>${LOG[x.kind][0]} ${LOG[x.kind][1]}</span><small>${x.day ? 'Farm day ' + x.day : esc(x.d || '')}</small><b class="${x.kind}">${x.kind === 'out' || x.kind === 'build' ? '−' : '+'}${fmt(x.amt)}</b></li>`).join('');
    const inc = b.pend.some((x) => x.inc && x.inc.length);
    K().render(header('🏦 Farm Bank', 'farm') + `<main class="farm fbank">
      <section class="bankcard">
        <div class="bk"><small>In the bank</small><b id="fbankbal">${fmt(b.bal)}</b></div>
        <div class="bk"><small>In your wallet</small><b>${fmt(f.money)}</b></div>
      </section>
      <section class="bweek" aria-label="This bank week"><div class="bweek-t"><b>🏦 This bank week</b><small>Bank day is every ${F.BANK_WEEK}th farm day</small></div><ol>${week}</ol><p class="${due ? 'due' : ''}">${status}</p></section>
      ${due > 0 ? `<button class="btn big fstand" data-act="fInterest">✨ Collect your interest${inc ? ' and what your buildings earned' : ''}${due > 1 ? ` (${due} bank days)` : ''}</button>` : ''}
      <div class="row"><button class="btn" data-act="fDeposit" ${f.money ? '' : 'disabled'}>⬇️ Save money</button><button class="btn ghost" data-act="fWithdraw" ${b.bal ? '' : 'disabled'}>⬆️ Take money out</button></div>
      ${dreamJar()}
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
    fs.done = () => { const got = F.payInterest(fm(), g); return `The bank added <b>${fmt(got.x)}</b>. Now you have <b>${fmt(fm().bank.bal)}</b> saved.`; };
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
    if (arg === 'bank') return F.level(fm().xp).level >= F.BANK_LV ? bank() : main();
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
      startPay(x.price, `${x.e} ${esc(x.name)}`, () => { F.buy(fm(), grade(), a); return a === 'acct' ? `${x.e} ${esc(x.name.replace('Bank: ', ''))} is yours! More of your savings earn the big interest.` : `${x.e} ${esc(x.name)} is yours!`; }, icon);
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
