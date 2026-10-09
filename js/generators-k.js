// Kindergarten problem generators (California Common Core, grade K).
//   1-3 = kindergarten standards (K.CC, K.OA, K.NBT, K.MD, K.G)
//   4   = end of kindergarten / start of 1st grade
//   5   = 1st grade material (1.OA, 1.NBT, 1.MD) — room to grow
// Problems lean on pictures, and each has a `say` line so it can be read aloud to kids who don't read yet.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U, V = MQ.V;
  const { N, C, E, BLANK } = MQ.G;
  const { rnd, pick, chance, shuffle } = U;

  const THINGS = [
    ['🐞', 'ladybug', 'ladybugs'], ['🍎', 'apple', 'apples'], ['🐟', 'fish', 'fish'], ['⭐', 'star', 'stars'],
    ['🐸', 'frog', 'frogs'], ['🌸', 'flower', 'flowers'], ['🐥', 'chick', 'chicks'], ['🍓', 'strawberry', 'strawberries'],
    ['🦋', 'butterfly', 'butterflies'], ['🐚', 'shell', 'shells'], ['🍪', 'cookie', 'cookies'], ['🐝', 'bee', 'bees'],
    ['🎈', 'balloon', 'balloons'], ['🐢', 'turtle', 'turtles'], ['🍄', 'mushroom', 'mushrooms'], ['🥕', 'carrot', 'carrots'],
  ];
  const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Kai', 'Ivy', 'Max', 'Lily', 'Ben', 'Nora', 'Eli'];
  const who = () => (MQ.playerName && chance(0.25) ? MQ.playerName : pick(NAMES));
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const numChoices = (ans, lo, hi, n = 4) => U.numChoices(ans, U.range(Math.max(lo, ans - 3), Math.min(hi, ans + 3)), n).sort((a, b) => a - b);

  // ---------------- Counting (K.CC.4-5; 1.NBT.1 as challenge)
  function k_count(d) {
    const [e, , pl] = pick(THINGS);
    if (d === 1) {
      const n = rnd(1, 5);
      return C(`How many ${e}?`, n, numChoices(n, 1, 6), { visual: V.emojis(e, n), say: `How many ${pl}?`, hint: 'Touch each one and count out loud: one, two, three…' });
    }
    if (d === 2) {
      const n = rnd(4, 10);
      return N(`How many ${e}?`, n, { visual: V.emojis(e, n), say: `How many ${pl}?`, hint: 'Count the top row, then keep counting the next row.' });
    }
    if (d === 3) {
      const n = rnd(10, 20);
      return N(`How many ${e}?`, n, { visual: V.emojis(e, n), say: `How many ${pl}? Count carefully!`, hint: 'Each row has 5. Count by fives, then count on: 5, 10, 15…' });
    }
    if (d === 4) {
      const t = rnd(2, 4), o = rnd(0, 9);
      return N(`Each box has 10 ${e}. How many in all?`, t * 10 + o, { visual: V.tenGroups(e, t, o), say: `Each box has ten ${pl}. How many ${pl} in all?`, hint: 'Count the boxes by tens: 10, 20, 30… then count the extra ones.', explain: `${t} tens and ${o} ones = ${t * 10 + o}` });
    }
    const t = rnd(3, 9), o = rnd(0, 9);
    return N('How many cubes? Each long rod is 10.', t * 10 + o, { visual: V.blocks(0, t, o), say: 'How many cubes? Each long rod is ten.', hint: 'Count the rods by tens, then count on the little cubes.', explain: `${t} tens and ${o} ones = ${t * 10 + o}` });
  }

  // ---------------- Number order (K.CC.1-3; 1.NBT.1, 1.NBT.5 as challenge)
  function k_numbers(d) {
    const seqQ = (seq, gap, say, hint) => N(`What number is missing?<div class="seq">${seq.map((v, i) => (i === gap ? BLANK : v)).join(', ')}</div>`, seq[gap], { say, hint });
    if (d === 1) {
      if (chance(0.5)) { const s = rnd(1, 6); const seq = [s, s + 1, s + 2, s + 3]; return seqQ(seq, 3, `What comes next? ${seq.slice(0, 3).join(', ')}, and then?`, 'Count up by one.'); }
      const n = rnd(1, 9);
      return C(`What number comes <b>after</b> ${n}?`, n + 1, numChoices(n + 1, 1, 10), { say: `What number comes after ${n}?`, hint: `Count: ${n}… what is next?` });
    }
    if (d === 2) {
      switch (rnd(1, 3)) {
        case 1: { const n = rnd(2, 19); return N(`What number comes <b>before</b> ${n}?`, n - 1, { say: `What number comes before ${n}?`, hint: 'Count backwards by one.' }); }
        case 2: { const n = rnd(5, 19); return N(`What is <b>one more</b> than ${n}?`, n + 1, { say: `What is one more than ${n}?`, hint: 'One more means the next number when you count.' }); }
        default: { const s = rnd(8, 16), gap = rnd(1, 3); return seqQ([s, s + 1, s + 2, s + 3, s + 4], gap, 'Which number is missing?', 'Count from the first number.'); }
      }
    }
    if (d === 3) {
      switch (rnd(1, 3)) {
        case 1: { const k = rnd(1, 6), seq = [k, k + 1, k + 2, k + 3].map((x) => x * 10); return seqQ(seq, 3, `Count by tens: ${seq.slice(0, 3).join(', ')}, and then?`, 'Count by tens: 10, 20, 30, 40…'); }
        case 2: {
          const n = rnd(11, 20), t = Math.floor(n / 10), o = n % 10;
          const opts = U.strChoices(String(n), [String(o * 10 + t), String(n + 10), String(o || n + 1), String(n - 1)].filter((x) => x !== String(n) && x !== '0'), 4);
          return C(`Which number is <b>${WORDS[n]}</b>?`, n, opts, { say: `Which number is ${n}?`, hint: 'Teen numbers start with a 1.' });
        }
        default: { const n = rnd(20, 49); return N(`What number comes <b>after</b> ${n}?`, n + 1, { say: `What number comes after ${n}?`, hint: 'Count on by one.' }); }
      }
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: { const n = rnd(30, 99); return N(`What number comes <b>after</b> ${n}?`, n + 1, { say: `What number comes after ${n}?`, hint: n % 10 === 9 ? 'After 9 ones comes a new ten!' : 'Count on by one.' }); }
        case 2: { const n = rnd(21, 100); return N(`What is <b>one less</b> than ${n}?`, n - 1, { say: `What is one less than ${n}?`, hint: 'One less means count back one.' }); }
        default: { const s = rnd(8, 30), seq = [s, s - 1, s - 2, s - 3]; return seqQ(seq, 3, `Count back: ${seq.slice(0, 3).join(', ')}, and then?`, 'Count backwards by one.'); }
      }
    }
    switch (rnd(1, 3)) {
      case 1: { const step = pick([2, 5]), s = rnd(1, 8) * step, seq = [s, s + step, s + 2 * step, s + 3 * step]; return seqQ(seq, 3, `Skip count by ${step}s. What comes next?`, `Count by ${step}s.`); }
      case 2: { const n = rnd(11, 89); return N(`What is <b>10 more</b> than ${n}?`, n + 10, { say: `What is ten more than ${n}?`, hint: 'Ten more: the tens digit goes up by one.' }); }
      default: { const n = rnd(20, 99); return N(`What is <b>10 less</b> than ${n}?`, n - 10, { say: `What is ten less than ${n}?`, hint: 'Ten less: the tens digit goes down by one.' }); }
    }
  }

  // ---------------- Comparing (K.CC.6-7; 1.NBT.3 as challenge)
  function k_compare(d) {
    if (d <= 2) {
      const [[ea, , pa], [eb, , pb]] = U.sample(THINGS, 2);
      const max = d === 1 ? 5 : 10;
      let a = rnd(1, max), b = rnd(1, max);
      if (d === 1) while (a === b) b = rnd(1, max);
      if (d === 2 && chance(0.2)) b = a;
      const askMore = d === 1 || chance(0.5);
      const opts = d === 2 ? [ea, eb, '= same'] : [ea, eb];
      const ans = a === b ? '= same' : (a > b) === askMore ? ea : eb;
      return C(`Are there <b>${askMore ? 'more' : 'fewer'}</b> ${ea} or ${eb}?`, ans, opts, { visual: V.compareRows(a, ea, b, eb), say: `Are there ${askMore ? 'more' : 'fewer'} ${pa} or ${pb}?${d === 2 ? ' Or the same?' : ''}`, hint: 'Match them up one to one. Which row has some left over?' });
    }
    if (d === 3) {
      const [a, b] = U.sample(U.range(1, 10), 2);
      const big = chance(0.6);
      return C(`Which number is <b>${big ? 'bigger' : 'smaller'}</b>?`, big ? Math.max(a, b) : Math.min(a, b), [a, b], { say: `Which number is ${big ? 'bigger' : 'smaller'}: ${a} or ${b}?`, hint: 'Which one do you say first when you count? That one is smaller.' });
    }
    if (d === 4) {
      const ns = U.sample(U.range(1, 20), 3);
      const big = chance(0.5);
      return C(`Which number is the <b>${big ? 'biggest' : 'smallest'}</b>?`, big ? Math.max(...ns) : Math.min(...ns), ns, { say: `Which number is the ${big ? 'biggest' : 'smallest'}: ${ns.join(', ')}?`, hint: 'Look at the tens first. Teen numbers are bigger than 1 to 9.' });
    }
    let a = rnd(10, 99), b = chance(0.15) ? a : rnd(10, 99);
    const ans = a > b ? '>' : a < b ? '<' : '=';
    return C(`Which sign goes in the box?<div class="eqline">${a} ${BLANK} ${b}</div>`, ans, ['<', '>', '='], { say: `Is ${a} greater than, less than, or equal to ${b}?`, hint: 'The open mouth eats the bigger number! Compare the tens first.', explain: `${a} ${ans} ${b}` });
  }

  // ---------------- Addition (K.OA.1-5; 1.OA.2, 1.OA.6 as challenge)
  function k_add(d) {
    const [e, , pl] = pick(THINGS);
    if (d === 1) {
      const a = rnd(1, 3), b = rnd(1, 5 - a);
      return N(`How many ${e} in all?`, a + b, { visual: V.emojiSum(e, a, b), say: `${a} and ${b} more. How many ${pl} in all?`, hint: 'Count all of them together.' });
    }
    if (d === 2) {
      const a = rnd(1, 6), b = rnd(1, Math.min(4, 10 - a));
      return N(E(`${a} + ${b} = ?`), a + b, { big: true, visual: V.emojiSum(e, a, b), say: `${a} plus ${b} equals what?`, hint: 'Count the first group, then keep counting the second group.' });
    }
    if (d === 3) {
      const a = rnd(1, 9), b = rnd(1, 10 - a);
      return N(E(`${a} + ${b} = ?`), a + b, { big: true, say: `${a} plus ${b} equals what?`, hint: `Start at ${Math.max(a, b)} and count up ${Math.min(a, b)} on your fingers.` });
    }
    if (d === 4) {
      if (chance(0.6)) {
        const a = rnd(1, 9);
        return N(E(`${a} + ? = 10`), 10 - a, { big: true, visual: V.tenFrames(a), say: `${a} plus what makes 10?`, hint: 'Count the empty boxes in the ten frame.', explain: `${a} + ${10 - a} = 10` });
      }
      const n = rnd(4, 9), a = rnd(1, n - 1);
      return N(E(`${n} = ${a} + ?`), n - a, { big: true, say: `${n} equals ${a} plus what?`, hint: `Start at ${a} and count up to ${n}.` });
    }
    if (chance(0.6)) {
      const a = rnd(4, 9), b = rnd(Math.max(2, 11 - a), 9);
      return N(E(`${a} + ${b} = ?`), a + b, { big: true, say: `${a} plus ${b} equals what?`, hint: `Make a ten first: ${Math.max(a, b)} + ${10 - Math.max(a, b)} = 10, then add the rest.` });
    }
    const a = rnd(1, 6), b = rnd(1, 6), c = rnd(1, 6);
    return N(E(`${a} + ${b} + ${c} = ?`), a + b + c, { big: true, say: `${a} plus ${b} plus ${c} equals what?`, hint: 'Add two numbers first, then add the last one.' });
  }

  // ---------------- Subtraction (K.OA.1-2, K.OA.5; 1.OA.6 as challenge)
  function k_sub(d) {
    const [e, , pl] = pick(THINGS);
    if (d === 1) {
      const a = rnd(2, 5), b = rnd(1, a - 1);
      return N(`${a} ${e}. ${b} ${b === 1 ? 'goes' : 'go'} away. How many are left?`, a - b, { visual: V.emojis(e, a, { gone: b }), say: `There are ${a} ${pl}. ${b} ${b === 1 ? 'goes' : 'go'} away. How many are left?`, hint: 'Count only the ones that are not crossed out.' });
    }
    if (d === 2) {
      const a = rnd(3, 10), b = rnd(1, Math.min(5, a - 1));
      return N(E(`${a} − ${b} = ?`), a - b, { big: true, visual: V.emojis(e, a, { gone: b }), say: `${a} minus ${b} equals what?`, hint: 'Cross out, then count what is left.' });
    }
    if (d === 3) {
      const a = rnd(3, 10), b = rnd(1, a);
      return N(E(`${a} − ${b} = ?`), a - b, { big: true, say: `${a} minus ${b} equals what?`, hint: `Hold up ${a} fingers. Put ${b} down.` });
    }
    if (d === 4) {
      const a = rnd(4, 10), r = rnd(1, a - 1);
      if (chance(0.5)) return N(E(`${a} − ? = ${r}`), a - r, { big: true, say: `${a} minus what equals ${r}?`, hint: `Count up from ${r} to ${a}.`, explain: `${a} − ${a - r} = ${r}` });
      return N(E(`10 − ${10 - r} = ?`), r, { big: true, visual: V.tenFrames(10), say: `10 minus ${10 - r} equals what?`, hint: 'Cover some dots in the ten frame. How many are still showing?' });
    }
    const a = rnd(11, 18), b = rnd(a - 9, 9);
    if (chance(0.3)) return N(E(`${a} − ? = ${a - b}`), b, { big: true, say: `${a} minus what equals ${a - b}?`, hint: `Count up from ${a - b} to ${a}.` });
    return N(E(`${a} − ${b} = ?`), a - b, { big: true, say: `${a} minus ${b} equals what?`, hint: `Take away ${a - 10} to get to 10 first, then take away the rest.` });
  }

  // ---------------- Ten-frames & teen numbers (K.NBT.1, K.OA.4; 1.NBT.2 as challenge)
  function k_teen(d) {
    if (d === 1) { const n = rnd(3, 10); return N('How many dots?', n, { visual: V.tenFrames(n), say: 'How many dots are in the ten frame?', hint: 'The top row has 5 boxes. Count on from 5.' }); }
    if (d === 2) { const n = rnd(2, 9); return N('How many more dots to fill the ten-frame?', 10 - n, { visual: V.tenFrames(n), say: 'How many more dots do we need to fill the ten frame?', hint: 'Count the empty boxes.', explain: `${n} + ${10 - n} = 10` }); }
    if (d === 3) {
      const o = rnd(1, 9);
      if (chance(0.5)) return N('How many dots?', 10 + o, { visual: V.tenFrames(10 + o, '#8c9cff'), say: 'How many dots? One ten frame is full.', hint: 'A full ten-frame is 10. Count on from 10.' });
      return N(E(`10 + ${o} = ?`), 10 + o, { big: true, visual: V.tenFrames(10 + o, '#8c9cff'), say: `10 plus ${o} equals what?`, hint: '10 and some more make a teen number.' });
    }
    if (d === 4) {
      const o = rnd(1, 9), n = 10 + o;
      if (chance(0.5)) return N(E(`${n} = 10 + ?`), o, { big: true, say: `${n} equals 10 plus what?`, hint: `${n} is one ten and some ones. Look at the last digit.` });
      return C(`Which number is <b>1 ten and ${o} ones</b>?`, n, U.strChoices(String(n), [String(o * 10 + 1), String(10 + o + 1), String(o), String(n + 10)].filter((x) => x !== String(n)), 4), { visual: V.tenFrames(n, '#8c9cff'), say: `Which number is one ten and ${o} ones?`, hint: 'One ten is 10. Then add the ones.' });
    }
    const t = rnd(2, 9), o = rnd(0, 9);
    switch (rnd(1, 3)) {
      case 1: return N('How many cubes?', t * 10 + o, { visual: V.blocks(0, t, o), say: 'How many cubes? Each rod is ten.', hint: 'Count rods by tens, then count the ones.' });
      case 2: return N(E(`${t} tens and ${o} ones = ?`), t * 10 + o, { say: `${t} tens and ${o} ones equals what?`, hint: `${t} tens is ${t * 10}.` });
      default: return N(`How many <b>tens</b> are in ${t * 10 + o}?`, t, { say: `How many tens are in ${t * 10 + o}?`, hint: 'The first digit tells the tens.' });
    }
  }

  // ---------------- Shapes (K.G.1-6; 1.G as challenge)
  const FLAT = ['circle', 'square', 'triangle', 'rectangle'];
  const SOLIDS = { sphere: ['⚽', '🏀', '🌍', '🍊'], cube: ['🎲', '🧊', '🎁'], cone: ['🍦', '🎉'], cylinder: ['🥫', '🔋', '🥁'] };
  function k_shapes(d) {
    if (d === 1) {
      const s = pick(FLAT);
      return C('What shape is this?', s, FLAT, { visual: V.shape(s, { rotate: chance(0.3) }), say: 'What shape is this?', hint: 'Count the sides. A circle has none!' });
    }
    if (d === 2) {
      const pool = [...FLAT, 'hexagon'];
      const s = pick(pool);
      const opts = U.sample(pool.filter((x) => x !== s), 3).concat(s);
      const order = shuffle(opts);
      return C(`Tap the <b>${s}</b>.`, s, order, { choiceHtml: order.map((k) => V.mini(k, 70)), say: `Tap the ${s}.`, hint: s === 'hexagon' ? 'A hexagon has 6 sides, like a honeycomb.' : 'Think about how many sides it has.' });
    }
    if (d === 3) {
      const s = pick(Object.keys(SOLIDS)), obj = pick(SOLIDS[s]);
      return C(`What 3D shape is this? <span class="bigemoji-inline">${obj}</span>`, s, ['sphere', 'cube', 'cone', 'cylinder'], { say: 'What solid shape is this? Sphere, cube, cone, or cylinder?', hint: 'A sphere is a ball. A cube is a box. A cone has a point. A cylinder is like a can.' });
    }
    if (d === 4) {
      const [s, n] = pick([['triangle', 3], ['square', 4], ['rectangle', 4], ['hexagon', 6], ['pentagon', 5]]);
      const what = chance(0.5) ? 'sides' : 'corners';
      return N(`How many <b>${what}</b>?`, n, { visual: V.shape(s, { rotate: true }), say: `How many ${what} does this shape have?`, hint: 'Touch each one as you count.' });
    }
    const kinds = Array.from({ length: rnd(6, 9) }, () => pick(['circle', 'square', 'triangle', 'hexagon']));
    const target = pick(kinds), n = kinds.filter((k) => k === target).length;
    return N(`How many <b>${target}s</b>?`, n, { visual: `<div class="vis shaperow">${kinds.map((k) => V.mini(k, 46)).join('')}</div>`, say: `How many ${target}s can you find?`, hint: `Look for the ${target}s only. Touch each one.` });
  }

  // ---------------- Measure & sort (K.MD.1-3; 1.MD.2 as challenge)
  const COLORS = [['🟥 red', '#ff6b5b'], ['🟦 blue', '#5b8cff'], ['🟩 green', '#5ccf7a'], ['🟨 yellow', '#ffc94d'], ['🟪 purple', '#a678f0']];
  const HEAVY = [['🐘', '🐭'], ['🍉', '🍒'], ['🚗', '🚲'], ['🐋', '🐟'], ['🎃', '🍓'], ['🪨', '🪶'], ['🐻', '🐝']];
  function k_measure(d) {
    if (d <= 2) {
      const k = d === 1 ? 2 : 3;
      const cols = U.sample(COLORS, k), lens = U.sample(U.range(3, 12), k);
      const list = cols.map(([label, color], i) => ({ label, color, len: lens[i] }));
      const vertical = d === 2 && chance(0.5);
      const word = vertical ? pick(['taller', 'shorter', 'tallest', 'shortest']) : d === 1 ? pick(['longer', 'shorter']) : pick(['longest', 'shortest']);
      const big = /long|tall/.test(word) && !/short/.test(word);
      const ans = list.reduce((a, b) => (big ? (b.len > a.len ? b : a) : b.len < a.len ? b : a));
      return C(`Which ${vertical ? 'tower' : 'ribbon'} is <b>${word}</b>?`, ans.label, list.map((x) => x.label), { visual: V.ribbons(list, vertical), say: `Which ${vertical ? 'tower' : 'ribbon'} is ${word}?`, hint: vertical ? 'They all stand on the same line. Look at the tops.' : 'They all start at the same place. Look at the ends.' });
    }
    if (d === 3) {
      const [h, l] = pick(HEAVY), heavy = chance(0.5);
      return C(`Which is <b>${heavy ? 'heavier' : 'lighter'}</b>?`, heavy ? h : l, shuffle([h, l]), { say: `Which one is ${heavy ? 'heavier' : 'lighter'}?`, hint: 'Imagine holding each one in your hands.' });
    }
    if (d === 4) {
      if (chance(0.5)) {
        const dots = [['🔴', 'red'], ['🔵', 'blue'], ['🟡', 'yellow']];
        const items = Array.from({ length: rnd(7, 11) }, () => pick(dots));
        const [te, tn] = pick(dots), n = items.filter((x) => x[0] === te).length;
        return N(`How many <b>${tn}</b> circles?`, n, { visual: V.strip(items.map((x) => x[0])), say: `How many ${tn} circles are there?`, hint: `Count only the ${tn} ones.` });
      }
      const fruit = ['🍎', '🍌', '🍇', '🍓', '🍐'], animals = ['🐶', '🐱', '🐰', '🐸', '🐤'];
      const items = Array.from({ length: rnd(7, 10) }, () => (chance(0.5) ? pick(fruit) : pick(animals)));
      const askFruit = chance(0.5), n = items.filter((x) => (askFruit ? fruit : animals).includes(x)).length;
      return N(`How many are <b>${askFruit ? 'fruits' : 'animals'}</b>?`, n, { visual: V.strip(items), say: `Sort them! How many are ${askFruit ? 'fruits' : 'animals'}?`, hint: `Count only the ${askFruit ? 'fruits' : 'animals'}.` });
    }
    const len = rnd(3, 10);
    return N('How many cubes long is the ribbon?', len, { visual: V.cubeMeasure(len, pick(COLORS)[1]), say: 'How many cubes long is the ribbon?', hint: 'Count the cubes under the ribbon, from one end to the other.' });
  }

  // ---------------- Story problems (K.OA.2; 1.OA.1-2 as challenge)
  function k_words(d) {
    const [e, one, pl] = pick(THINGS), p = who();
    const story = (text, ans, extra = {}) => N(text, ans, Object.assign({ wordy: true, say: text.replace(/<[^>]+>/g, ''), hint: 'Act it out with your fingers or draw circles.' }, extra));
    if (d === 1) {
      const a = rnd(1, 3), b = rnd(1, 5 - a);
      return story(`${p} has ${a} ${a === 1 ? one : pl}. ${p} gets ${b} more. How many ${pl} now?`, a + b, { visual: V.emojiSum(e, a, b) });
    }
    if (d === 2) {
      if (chance(0.5)) { const a = rnd(2, 6), b = rnd(1, 10 - a); return story(`There are ${a} ${pl} on a leaf. ${b} more ${b === 1 ? "comes" : "come"}. How many ${pl} now?`, a + b, { visual: V.emojiSum(e, a, b) }); }
      const a = rnd(3, 9), b = rnd(1, a - 1);
      return story(`There are ${a} ${pl}. ${b} ${b === 1 ? 'runs' : 'run'} away. How many are left?`, a - b, { visual: V.emojis(e, a, { gone: b }) });
    }
    if (d === 3) {
      if (chance(0.5)) { const a = rnd(2, 7), b = rnd(1, 10 - a); return story(`${p} picks ${a} ${pl} and then ${b} more. How many ${pl} does ${p} have?`, a + b); }
      const a = rnd(4, 10), b = rnd(1, a - 1);
      return story(`${p} has ${a} ${pl} and gives ${b} away. How many ${pl} are left?`, a - b);
    }
    if (d === 4) {
      if (chance(0.5)) { const c = rnd(5, 10), a = rnd(1, c - 1); return story(`${p} needs ${c} ${pl}. ${p} has ${a}. How many more does ${p} need?`, c - a, { hint: `Count up from ${a} to ${c}.` }); }
      const kids = rnd(4, 10), hats = rnd(2, kids - 1);
      return story(`There are ${kids} kids and ${hats} hats. How many kids do not get a hat?`, kids - hats, { hint: 'Give each hat to one kid. How many kids are left?' });
    }
    const a = rnd(3, 9), b = rnd(2, 6), c = rnd(1, a + b - 1);
    if (chance(0.5)) return story(`${a} birds sit on a fence. ${b} more land. Then ${c} fly away. How many birds are on the fence now?`, a + b - c, { hint: 'Two steps: first add, then take away.' });
    const x = rnd(3, 8), y = rnd(3, 8), z = rnd(2, 5);
    return story(`${p} has ${x} red ${pl}, ${y} blue ${pl}, and ${z} yellow ${pl}. How many ${pl} in all?`, x + y + z, { hint: 'Add two colors first, then add the third.' });
  }

  // ---------------- Patterns (enrichment, K.MD.3 / 1.OA.5)
  const PAT = ['🍎', '🍌', '🍇', '⭐', '🌙', '☀️', '🐸', '🐟', '🌸', '🔴', '🔵', '🟡'];
  function k_patterns(d) {
    if (d <= 3) {
      const unit = d === 1 ? 'AB' : d === 2 ? pick(['AAB', 'ABB']) : pick(['ABC', 'AABB']);
      const syms = U.sample(PAT, 4);
      const map = { A: syms[0], B: syms[1], C: syms[2] };
      const full = Array.from({ length: unit.length * 3 }, (_, i) => map[unit[i % unit.length]]);
      const len = Math.min(full.length, unit.length * 2 + rnd(1, unit.length));
      const gap = d === 3 && chance(0.4) ? rnd(1, len - 2) : len - 1;
      const items = full.slice(0, len).map((x, i) => (i === gap ? null : x));
      const ans = full[gap];
      const opts = U.strChoices(ans, [map.A, map.B, map.C, syms[3]].filter(Boolean), 3);
      return C(gap === len - 1 ? 'What comes next?' : 'What is missing?', ans, opts, { visual: V.strip(items), say: gap === len - 1 ? 'Look at the pattern. What comes next?' : 'Look at the pattern. What is missing?', hint: 'Say the pattern out loud. Find the part that repeats.' });
    }
    if (d === 4) {
      const step = pick([1, 2, 10]), s = step === 10 ? 10 * rnd(1, 5) : rnd(0, 10), seq = [s, s + step, s + 2 * step, s + 3 * step];
      return N(`What comes next?<div class="seq">${seq.join(', ')}, ${BLANK}</div>`, s + 4 * step, { say: `What comes next? ${seq.join(', ')}`, hint: 'How much bigger does each number get?' });
    }
    if (chance(0.5)) {
      const [e, , pl] = pick(THINGS), a = rnd(1, 6);
      return N(`<div class="emojieq">${e} + ${e} = ${2 * a}</div>How much is one ${e}?`, a, { say: `Two of the same ${pl} make ${2 * a}. How much is one?`, hint: 'Split the number into two equal parts.' });
    }
    const s = rnd(1, 3), seq = [s, s + 1, s + 3, s + 6];
    return N(`What comes next?<div class="seq">${seq.join(', ')}, ${BLANK}</div>`, s + 10, { say: `What comes next? ${seq.join(', ')}`, hint: 'Look at the jumps: +1, +2, +3… what is the next jump?' });
  }

  Object.assign(MQ.TOPICS, {
    k_count: { name: 'Counting', icon: '🔢', std: 'K.CC.4–5', gen: k_count, track: 'k' },
    k_numbers: { name: 'Number Order', icon: '➡️', std: 'K.CC.1–3', gen: k_numbers, track: 'k' },
    k_compare: { name: 'More or Fewer', icon: '⚖️', std: 'K.CC.6–7', gen: k_compare, track: 'k' },
    k_add: { name: 'Adding', icon: '➕', std: 'K.OA.1–5', gen: k_add, track: 'k' },
    k_sub: { name: 'Taking Away', icon: '➖', std: 'K.OA.1–5', gen: k_sub, track: 'k' },
    k_teen: { name: 'Ten Frames & Teens', icon: '🔟', std: 'K.NBT.1', gen: k_teen, track: 'k' },
    k_shapes: { name: 'Shapes', icon: '🔺', std: 'K.G.1–6', gen: k_shapes, track: 'k' },
    k_measure: { name: 'Size & Sorting', icon: '📏', std: 'K.MD.1–3', gen: k_measure, track: 'k' },
    k_words: { name: 'Story Problems', icon: '📖', std: 'K.OA.2', gen: k_words, track: 'k' },
    k_patterns: { name: 'Patterns', icon: '🧩', std: 'Patterns (ahead)', gen: k_patterns, track: 'k', ahead: true },
  });
})();
