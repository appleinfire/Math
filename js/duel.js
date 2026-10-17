// Card Duels: the creatures a child collected battle with their stats (js/stats.js), Top Trumps style, against a
// rival in three leagues. A duel has 5 rounds, and the child holds three cards from their collection each round.
// Rounds 1 and 3: the child picks a card and one of its stats. Rounds 2 and 4: the rival plays a card and picks the
// stat, and the child picks the card with the most of it. Round 5 is the Power round: the sum of the stats. Then the
// cards are turned over, and the child answers a question about the two numbers (kindergarten: which is bigger;
// 2nd grade: how much more). The numbers decide who wins the round, so reading the stats well is the strategy; the
// math earns crystals and XP (and counts in the day's answers), and winning the duel earns the league's prize.
// Balance (checked by simulations in tests/duel.test.js): the Meadow League rival plays animals from the child's own
// map and picks stats at random, so a beginner with a few animals wins most duels; the Crystal and Dragon League
// rivals play magical creatures and pick their best stat, so winning there takes Crystal, Legendary and Dragon cards.
// MQ.duel holds the rules (no screens, so it runs in the tests); MQ.duelUI draws them with the app's kit.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const D = {};
  D.ROUNDS = 5;
  D.HAND = 3;
  D.MIN_CARDS = 3;
  D.RIGHT_GEMS = 1; // a first-try right answer
  // Each league's rival plays with creatures of these rarities from the child's map (map: only map animals) and the
  // Hatchery (dragons as grown-ups); a smart rival picks its card's best stat. A league opens after `need` wins in the
  // one before. prize: crystals for a won duel (a draw: 1).
  D.LEAGUES = [
    { id: 'meadow', icon: '🌿', name: 'Meadow League', rival: ['🦝', 'Rocky'], rar: ['common', 'rare'], map: true, smart: false, prize: 3, need: 0, color: '#4caf50' },
    { id: 'crystal', icon: '💎', name: 'Crystal League', rival: ['🦉', 'Professor Hoot'], rar: ['legendary', 'mythic', 'crystal'], smart: true, prize: 5, need: 3, color: '#8b6fe0' },
    { id: 'dragon', icon: '🐉', name: 'Dragon League', rival: ['🧙‍♀️', 'Queen Aurora'], rar: ['legend', 'dragon'], smart: true, prize: 8, need: 3, color: '#e0453c' },
  ];
  D.ensure = (st) => (st.duels = st.duels || { wins: {}, played: 0 });
  D.wins = (st, li) => D.ensure(st).wins[D.LEAGUES[li].id] || 0;
  D.open = (st, li) => li === 0 || D.wins(st, li - 1) >= D.LEAGUES[li].need;
  // The child's cards: every creature in the collection that has stats, strongest first.
  D.cards = (st) => Object.keys(st.creatures || {}).map((id) => MQ.creatureById(id)).filter((c) => c && MQ.STATS[c.id]).map((c) => [c, MQ.stats(c, st).power]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  D.canPlay = (st) => D.cards(st).length >= D.MIN_CARDS;
  // the rival's cards in league li for a child in this grade
  const pools = {};
  D.pool = (li, grade) => {
    const key = li + grade, L = D.LEAGUES[li], worlds = new Set(MQ.track(grade).worlds.map((w) => w.id));
    return pools[key] || (pools[key] = MQ.ALL_CREATURES.filter((c) => L.rar.includes(c.rarity) && MQ.STATS[c.id] && (worlds.has(c.world) || (!L.map && !!c.egg))));
  };
  // stats in a duel: the child's own (a dragon at its stage), the rival's (dragons grown-up)
  D.mine = (st, c) => MQ.stats(c, st);
  D.theirs = (c) => MQ.stats(c, null, c.dragon ? 2 : undefined);
  D.value = (s, stat) => (stat < 0 ? s.power : s.list[stat]);
  D.powerRound = (round) => round === D.ROUNDS;
  D.rivalTurn = (round) => round % 2 === 0 && !D.powerRound(round); // the rival picks the stat
  // the Power range of a league's rival cards, for the lobby (rounded to tens)
  D.range = (li, grade) => { const p = D.pool(li, grade).map((c) => D.theirs(c).power); return [Math.floor(Math.min(...p) / 10) * 10, Math.ceil(Math.max(...p) / 10) * 10]; };

  const pickOne = (list, rnd) => list[Math.floor(rnd() * list.length)];
  const sample = (list, n, rnd) => { const a = list.slice(), out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
  // A new duel in league li.
  D.start = (st, li) => ({ league: li, grade: st.grade, cards: D.cards(st).map((c) => c.id), round: 1, me: 0, rival: 0, used: [], rused: [], log: [], gems: 0, xp: 0, right: 0 });
  // Three cards for this round, from the cards not played yet in this duel (all of them again when fewer are left).
  D.deal = (st, du, rnd = Math.random) => {
    const fresh = du.cards.filter((id) => !du.used.includes(id));
    return sample(fresh.length >= D.HAND ? fresh : du.cards, D.HAND, rnd);
  };
  D.rivalCard = (du, rnd = Math.random) => {
    const pool = D.pool(du.league, du.grade).map((c) => c.id), fresh = pool.filter((id) => !du.rused.includes(id));
    return pickOne(fresh.length ? fresh : pool, rnd);
  };
  // On the rival's turn: its card and the stat it picks ({ id, stat }): its best stat, or (Meadow League) any stat.
  D.rivalChoose = (du, rnd = Math.random) => {
    const id = D.rivalCard(du, rnd), s = D.theirs(MQ.creatureById(id)).list;
    return { id, stat: D.LEAGUES[du.league].smart ? s.indexOf(Math.max(...s)) : Math.floor(rnd() * 4) };
  };
  // Play a round: the child's card and stat (-1: Power) against the rival's card. Returns { a, b, win: 'me' | 'rival' | 'tie' }.
  D.play = (st, du, mineId, stat, rivalId) => {
    const a = D.value(D.mine(st, MQ.creatureById(mineId)), stat), b = D.value(D.theirs(MQ.creatureById(rivalId)), stat);
    const win = a > b ? 'me' : a < b ? 'rival' : 'tie';
    if (win === 'me') du.me++;
    if (win === 'rival') du.rival++;
    du.used.push(mineId);
    du.rused.push(rivalId);
    du.log.push({ mine: mineId, rival: rivalId, stat, a, b, win });
    du.round++;
    return { a, b, win };
  };
  D.over = (du) => du.round > D.ROUNDS;
  D.outcome = (du) => (du.me > du.rival ? 'win' : du.me < du.rival ? 'lose' : 'draw');
  // The duel is over: count it, and the prize (crystals) for a win or a draw.
  D.finish = (st, du) => {
    const d = D.ensure(st), out = D.outcome(du), L = D.LEAGUES[du.league];
    d.played = (d.played || 0) + 1;
    if (out === 'win') d.wins[L.id] = (d.wins[L.id] || 0) + 1;
    return { out, prize: out === 'win' ? L.prize : out === 'draw' ? 1 : 0 };
  };
  // The question about the two numbers (null for a tie). me / them: { name, e, v }.
  // Kindergarten: which number is bigger (tap it). 2nd grade: how much more (subtract, within 100; the Power round within 1000).
  D.question = (grade, me, them, stat) => {
    if (me.v === them.v) return null;
    const [big, small] = me.v > them.v ? [me, them] : [them, me];
    const name = stat < 0 ? 'Power' : MQ.STAT_KEYS[stat][2];
    if (grade === 'k') {
      const choices = [`${me.e} ${me.v}`, `${them.e} ${them.v}`];
      return { kind: 'choice', answer: `${big.e} ${big.v}`, choices, text: `Who has more <b>${name}</b>? Tap the bigger number.`, hint: `Look at the first digit: ${Math.floor(me.v / 10)} tens or ${Math.floor(them.v / 10)} tens?`, explain: `${big.v} is bigger than ${small.v}` };
    }
    const d = big.v - small.v;
    return { kind: 'num', answer: d, text: `<b>${big.name}</b> has ${name} <b>${big.v}</b>. <b>${small.name}</b> has <b>${small.v}</b>. How much more ${name} does ${big.name} have?`,
      hint: `Count up from ${small.v} to ${big.v}, or take away: ${big.v} − ${small.v}.`, explain: `${big.v} − ${small.v} = ${d}` };
  };
  D.isRight = (q, given) => String(given) === String(q.answer);
  MQ.duel = D;

  // ---------------------------------------------------------------- screens
  if (typeof document === 'undefined') return;
  const U = MQ.U, esc = U.esc;
  const K = () => MQ.app.kit;
  const st = () => K().state();
  const $ = (sel) => document.querySelector(sel);
  let du = null; // the duel being played: D.start(...) plus stage, hand, pick, stat, rcard, q, tries, input, done, res
  let autoNext = null;

  const pic = (c, mine) => (mine ? MQ.look(st(), c) : MQ.look(st(), c, { stage: c.dragon ? 2 : undefined }));
  const dragonStyle = (c) => (c.dragon ? ` style="--el:${MQ.DRAGON_LOOK[c.id].el}"` : '');
  const shown = (c, mine) => (mine && c.dragon && st().dragons[c.id] ? st().dragons[c.id].name : c.name);
  // A duel card: picture, name, the four stats and Power. opts: { mine, tap (action for the whole card), stats (stat
  // buttons), hi (the stat in play: 0–3, -1 Power), cls }
  function card(c, o = {}) {
    const s = o.mine ? D.mine(st(), c) : D.theirs(c);
    const rows = MQ.STAT_KEYS.map(([k, e, name], i) => {
      const inner = `<span>${e} ${name}</span><i><b style="width:${s.list[i]}%"></b></i><em>${s.list[i]}</em>`;
      return o.stats ? `<button class="du-st s-${k}" data-act="duelStat" data-arg="${i}">${inner}</button>` : `<div class="du-st s-${k} ${o.hi === i ? 'hi' : ''}">${inner}</div>`;
    }).join('');
    const body = `<span class="du-pic">${pic(c, o.mine)}</span><b class="du-name">${esc(shown(c, o.mine))}</b><div class="du-stats">${rows}</div><div class="du-pow ${o.hi === -1 ? 'hi' : ''}">Power <b>${s.power}</b></div>`;
    return o.tap ? `<button class="du-card r-${c.rarity} ${o.cls || ''}"${dragonStyle(c)} data-act="${o.tap}" data-arg="${c.id}">${body}</button>` : `<div class="du-card r-${c.rarity} ${o.cls || ''}"${dragonStyle(c)}>${body}</div>`;
  }

  // ---- the lobby: the leagues and the strongest cards
  function lobby() {
    du = null;
    const s = st(), cards = D.cards(s), d = D.ensure(s);
    const leagues = D.LEAGUES.map((L, i) => {
      const open = D.open(s, i), w = D.wins(s, i), [lo, hi] = D.range(i, s.grade), next = D.LEAGUES[i + 1];
      const goal = next ? `<span class="lg-goal">${Array.from({ length: next.need }, (_, k) => `<i class="${k < w ? 'on' : ''}">⭐</i>`).join('')}<small>${w >= next.need ? `${next.icon} ${next.name} is open!` : `Win ${next.need - w} more to open the ${next.name}`}</small></span>` : '';
      return `<section class="league l-${L.id} ${open ? '' : 'locked'}" style="--lc:${L.color}">
        <span class="lg-rival">${open ? L.rival[0] : '🔒'}</span>
        <div class="lg-t"><b>${L.icon} ${L.name}</b><small>Rival: ${L.rival[0]} ${esc(L.rival[1])} · cards with Power ${lo}–${hi}</small>
          <small>${open ? `Win a duel: <b>+${L.prize} 💎</b> · wins: ${w}` : `Win ${L.need} duels in the ${D.LEAGUES[i - 1].name} to open it (${D.wins(s, i - 1)} / ${L.need})`}</small>${open ? goal : ''}</div>
        ${open ? `<button class="btn" data-act="duelStart" data-arg="${i}" ${cards.length >= D.MIN_CARDS ? '' : 'disabled'}>Duel!</button>` : ''}</section>`;
    }).join('');
    K().render(K().header('⚔️ Card Duels') + `<main class="duels">
      <p class="lead">Your creatures battle with their stats! You and the rival take turns picking the stat, and the bigger number wins the round. Then do the math. ${D.ROUNDS} rounds: whoever wins more rounds wins the duel.</p>
      ${cards.length < D.MIN_CARDS ? `<p class="du-note">Collect ${D.MIN_CARDS} creatures to play: finish levels on the map, or hatch eggs in the Hatchery. You have ${cards.length}.</p>` : `<h2>Your strongest cards</h2><div class="du-top">${cards.slice(0, 3).map((c) => card(c, { mine: true })).join('')}</div>`}
      <div class="leagues">${leagues}</div>
      <p class="muted center">Every first-try right answer: +${D.RIGHT_GEMS} 💎. Duels played: ${d.played || 0}.</p>
    </main>`);
    K().setCur('duel');
  }

  // ---- a duel
  function start(li) {
    const s = st();
    if (!D.canPlay(s) || !D.open(s, li)) return lobby();
    du = D.start(s, li);
    round();
    MQ.sfx('whoosh');
    view();
  }
  // A new round: three cards in hand; on the rival's turn its card and stat are chosen now.
  function round() {
    Object.assign(du, { stage: 'pick', pick: null, stat: null, rcard: null, q: null, res: null, done: false });
    du.hand = D.deal(st(), du);
    if (D.rivalTurn(du.round)) { const r = D.rivalChoose(du); du.rcard = r.id; du.stat = r.stat; }
  }
  const L = () => D.LEAGUES[du.league];
  function view() {
    clearTimeout(autoNext);
    const s = st(), power = D.powerRound(du.round), rv = L().rival;
    let arena = '';
    if (du.stage === 'pick') {
      const rturn = D.rivalTurn(du.round), sk = rturn && MQ.STAT_KEYS[du.stat];
      arena = `${rturn ? `<div class="du-rival"><span class="du-rcard">${rv[0]}</span><span><b>${esc(rv[1])}</b> plays a card and picks <b class="s-${sk[0]}">${sk[1]} ${sk[2]}</b>!</span></div>` : ''}
        <p class="du-prompt">${power ? '⚡ <b>Power round!</b> Pick the card with the most Power.' : rturn ? `Pick your card with the most <b>${sk[2]}</b>.` : 'Your turn: pick a card, then a stat.'}</p>
        <div class="du-hand">${du.hand.map((id) => card(MQ.creatureById(id), { mine: true, tap: 'duelPick', hi: power ? -1 : rturn ? du.stat : undefined })).join('')}</div>`;
    } else if (du.stage === 'stat') {
      arena = `<p class="du-prompt">Pick a stat to battle with</p><div class="du-big">${card(MQ.creatureById(du.pick), { mine: true, stats: true })}</div>
        <div class="row"><button class="btn ghost" data-act="duelBack">← Another card</button></div>`;
    } else {
      const hi = du.stat;
      arena = `<div class="du-vs">${card(MQ.creatureById(du.pick), { mine: true, hi, cls: du.res && du.res.win === 'me' ? 'won' : du.res && du.res.win === 'rival' ? 'lost' : '' })}<span class="vs">VS</span>${card(MQ.creatureById(du.rcard), { hi, cls: 'flip ' + (du.res && du.res.win === 'rival' ? 'won' : du.res && du.res.win === 'me' ? 'lost' : '') })}</div>
        <section class="pcard du-q" id="pcard">${du.q ? `<div class="ptext wordy">${du.q.text}</div>${MQ.canSpeak() ? '<button class="speak" data-act="duelSpeak" aria-label="Read the question aloud">🔊</button>' : ''}` : '<div class="ptext">It’s a tie! Both have the same number.</div>'}
          <div id="dstep"></div><div class="feedback" id="feedback" aria-live="polite"></div></section>
        <div class="answer" id="danswer"></div>`;
    }
    K().render(`<div class="play duel-play" style="--lc:${L().color}">
      <header class="playbar"><button class="iconbtn" data-act="duelQuit" aria-label="Stop">✕</button>
        <div class="pstatus">${L().icon} Round ${Math.min(du.round, D.ROUNDS)} of ${D.ROUNDS}${power ? ' ⚡' : ''}</div>
        <div class="du-score" aria-label="Score: you ${du.me}, ${esc(rv[1])} ${du.rival}"><span class="du-me">${MQ.face(s)} <b>${du.me}</b></span><i>:</i><span class="du-rv"><b>${du.rival}</b> ${rv[0]}</span></div></header>
      <main class="du-arena">${arena}</main></div>`, 'is-play');
    if (du.stage === 'battle') { drawAnswer(); if (du.q && !du.done && s.settings.readAloud) speak(); }
  }
  function pick(id) {
    if (!du || du.stage !== 'pick' || !du.hand.includes(id)) return;
    MQ.sfx('tap');
    du.pick = id;
    if (D.powerRound(du.round)) return battle(-1);
    if (D.rivalTurn(du.round)) return battle(du.stat);
    du.stage = 'stat';
    view();
  }
  // The rival's card is turned over, and the question comes.
  function battle(stat) {
    const s = st();
    du.stat = stat;
    if (!du.rcard) du.rcard = D.rivalCard(du);
    const mine = MQ.creatureById(du.pick), theirs = MQ.creatureById(du.rcard);
    const a = D.value(D.mine(s, mine), stat), b = D.value(D.theirs(theirs), stat);
    du.q = D.question(s.grade, { name: shown(mine, true), e: mine.emoji, v: a }, { name: theirs.name, e: theirs.emoji, v: b }, stat);
    Object.assign(du, { stage: 'battle', tries: 0, input: '', done: false, res: null });
    MQ.sfx('whoosh');
    if (!du.q) return settle(true, false); // a tie: nothing to work out
    view();
  }
  function drawAnswer() {
    const box = $('#danswer'), q = du.q;
    if (!box) return;
    if (du.done) {
      box.innerHTML = `<div class="row"><button class="btn big" data-act="duelNext">${D.over(du) ? 'See who won! 🏆' : 'Next round →'}</button></div>`;
      return;
    }
    if (q.kind === 'num') {
      $('#dstep').innerHTML = `<div class="display"><span class="dval ${du.input ? 'filled' : ''}" id="dval">${du.input || '?'}</span></div>`;
      box.innerHTML = `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="key" data-act="duelKey" data-arg="${k}">${k}</button>`).join('')}<button class="key alt" data-act="duelKey" data-arg="back" aria-label="Delete">⌫</button><button class="key" data-act="duelKey" data-arg="0">0</button><button class="key go" data-act="duelCheck">Check</button></div>`;
    } else box.innerHTML = `<div class="choices n2">${q.choices.map((c, i) => `<button class="choice" data-act="duelChoose" data-arg="${i}">${esc(c)}</button>`).join('')}</div>`;
  }
  const feedback = (html, cls) => { const el = $('#feedback'); if (el) el.innerHTML = `<div class="fb ${cls}">${html}</div>`; };
  function key(k) {
    if (!du || du.done || !du.q || du.q.kind !== 'num') return;
    if (k === 'back') du.input = du.input.slice(0, -1);
    else if (du.input.length < 4) du.input = (du.input + k).replace(/^0+(?=\d)/, '');
    MQ.sfx('tap');
    const d = $('#dval');
    if (d) { d.textContent = du.input || '?'; d.classList.toggle('filled', !!du.input); }
  }
  function check(given) {
    if (!du || du.done || !du.q) return;
    if (D.isRight(du.q, given)) return settle(du.tries === 0, true);
    du.tries++;
    MQ.sfx('wrong');
    const c = $('#pcard');
    if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
    if (du.tries < 2) { feedback(`💡 ${du.q.hint}`, 'hint'); du.input = ''; return drawAnswer(); }
    settle(false, false);
  }
  // The round is decided by the numbers; a first-try right answer earns a crystal.
  function settle(first, solved) {
    const s = st(), q = du.q;
    du.res = D.play(s, du, du.pick, du.stat, du.rcard);
    du.done = true;
    if (q) {
      MQ.farm.record(s, first); // counts in the day's answers, like every problem
      if (first) { K().addGems(D.RIGHT_GEMS); du.gems += D.RIGHT_GEMS; du.right++; }
      const x = first ? 10 : solved ? 5 : 0;
      if (x) { K().addXp(x); du.xp += x; }
    }
    MQ.store.save();
    const rv = L().rival[1], mine = shown(MQ.creatureById(du.pick), true);
    const verdict = du.res.win === 'me' ? `🎉 <b>${esc(mine)}</b> wins this round!` : du.res.win === 'rival' ? `${esc(rv)}’s <b>${esc(MQ.creatureById(du.rcard).name)}</b> wins this round.` : '🤝 A tie: nobody gets a point.';
    const said = !q ? '' : first ? `✓ Right! +${D.RIGHT_GEMS} 💎 ` : solved ? '✓ Got it! ' : `The answer is <b>${esc(String(q.answer))}</b>. <span class="explain">${esc(q.explain)}</span><br>`;
    view();
    feedback(`<span>${said}${verdict}</span>`, !q || solved ? 'ok' : 'reveal');
    MQ.sfx(du.res.win === 'me' ? 'correct' : du.res.win === 'rival' ? 'tick' : 'tap');
    if (du.res.win === 'me') MQ.confetti(40);
    K().checkBadges();
  }
  function next() {
    if (!du || !du.done) return;
    if (D.over(du)) return finish();
    round();
    view();
  }
  function finish() {
    const s = st(), { out, prize } = D.finish(s, du), Lg = L(), rv = Lg.rival;
    if (prize) { K().addGems(prize); du.gems += prize; }
    MQ.store.save();
    K().checkBadges();
    const nextL = D.LEAGUES[du.league + 1], opened = out === 'win' && nextL && D.wins(s, du.league) === nextL.need;
    const title = out === 'win' ? `You won the duel ${du.me} : ${du.rival}!` : out === 'lose' ? `${esc(rv[1])} won ${du.rival} : ${du.me}` : `A draw, ${du.me} : ${du.rival}`;
    const li = du.league;
    K().render(`<main class="result duel-result" style="--lc:${Lg.color}">
      <div class="bigemoji">${out === 'win' ? '🏆' : out === 'draw' ? '🤝' : rv[0]}</div>
      <h1 class="title">${title}</h1>
      <p class="lead">${out === 'win' ? `Prize: <b>+${prize} 💎</b>` : out === 'draw' ? `A draw prize: <b>+1 💎</b>` : 'So close! Pick your strongest stats and try again.'}</p>
      <p>Right answers: <b>${du.right}</b> · crystals: <b>+${du.gems} 💎</b> · <b>+${du.xp} XP</b></p>
      ${opened ? `<p class="du-note">🎉 New: the <b>${nextL.icon} ${nextL.name}</b> is open!</p>` : ''}
      <ul class="du-log">${du.log.map((r, k) => { const m = MQ.creatureById(r.mine), t = MQ.creatureById(r.rival), n = r.stat < 0 ? '⚡ Power' : MQ.STAT_KEYS[r.stat][1] + ' ' + MQ.STAT_KEYS[r.stat][2]; return `<li class="${r.win}"><span>${k + 1}.</span> ${m.emoji} ${r.a} <small>${n}</small> ${r.b} ${t.emoji} <b>${r.win === 'me' ? '✓' : r.win === 'rival' ? '✗' : '='}</b></li>`; }).join('')}</ul>
      <div class="row"><button class="btn ghost" data-act="go" data-arg="duel">Leagues</button><button class="btn" data-act="duelStart" data-arg="${li}">⚔️ Duel again</button></div>
    </main>`);
    MQ.sfx(out === 'win' ? 'fanfare' : 'reward');
    if (out === 'win') MQ.confetti(160, { colors: ['#ffd23f', Lg.color, '#ffffff'], shape: 'star' });
    du = null;
  }
  function speak() { if (du && du.q) MQ.speak(MQ.toSpeech(du.q.text)); }
  function quit() {
    if (du && du.round > 1 && !$('#modal')) return K().modal(`<div class="mtitle">Stop the duel?</div><p>The rounds played so far won’t count.</p><div class="row"><button class="btn ghost" data-act="closeModal">Keep playing</button><button class="btn" data-act="duelLeave">Stop</button></div>`);
    du = null;
    K().go('duel');
  }
  const A = {
    duelStart: (a) => start(+a),
    duelPick: (a) => pick(a),
    duelStat: (a) => { if (du && du.stage === 'stat') { MQ.sfx('tap'); battle(+a); } },
    duelBack: () => { if (du && du.stage === 'stat') { du.stage = 'pick'; du.pick = null; view(); } },
    duelKey: (a) => key(a),
    duelCheck: () => { if (du && du.input) check(du.input); },
    duelChoose: (a) => { if (du && du.q && !du.done) check(du.q.choices[+a]); },
    duelNext: () => next(),
    duelQuit: () => quit(),
    duelLeave: () => { K().closeModal(); du = null; K().go('duel'); },
    duelSpeak: () => speak(),
  };
  document.addEventListener('keydown', (e) => {
    if (!du || du.stage !== 'battle' || du.done || !du.q || $('#modal')) return;
    if (du.q.kind === 'num') {
      if (/^[0-9]$/.test(e.key)) key(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'Enter') A.duelCheck();
    } else if (/^[12]$/.test(e.key)) check(du.q.choices[+e.key - 1]);
  });
  MQ.duelUI = { show: () => lobby(), actions: A, playing: () => du };
})();
