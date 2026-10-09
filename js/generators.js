// Problem generators. One generator per topic, each takes a difficulty 1..5:
//   1-3  = California 2nd grade standards (CCSS-M as adopted by CA)
//   4    = upper 2nd grade / start of 3rd grade
//   5    = challenge, ahead of grade level
// A problem: { kind:'num'|'choice', text, answer, choices?, visual?, hint?, explain?, unit?, big? }
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U, V = MQ.V;
  const { rnd, pick, chance, shuffle } = U;

  const BLANK = '<span class="blank">?</span>';
  const E = (s) => s.replace(/\?/g, BLANK); // equation text: ? becomes an answer box

  const NAMES = ['Maya', 'Leo', 'Ava', 'Noah', 'Zoe', 'Kai', 'Mila', 'Ethan', 'Lucia', 'Sam', 'Aria', 'Omar', 'Ivy', 'Theo', 'Nora', 'Diego', 'Emma', 'Ravi', 'Lily', 'Max', 'Hana', 'Felix', 'Rosa', 'Jin'];
  const who = () => (MQ.playerName && chance(0.2) ? MQ.playerName : pick(NAMES));
  const two = () => {
    const a = who();
    let b = pick(NAMES);
    while (b === a) b = pick(NAMES);
    return [a, b];
  };

  function N(text, answer, o = {}) {
    return Object.assign({ kind: 'num', text, answer }, o);
  }
  function C(text, answer, choices, o = {}) {
    return Object.assign({ kind: 'choice', text, answer: String(answer), choices: choices.map(String) }, o);
  }

  // ======================================================================
  // 1. Add & subtract within 20  (2.OA.2 fluency, 2.OA.1)
  // ======================================================================
  function makeTenHint(a, b) {
    const big = Math.max(a, b), small = Math.min(a, b), need = 10 - big;
    return `Make a ten: ${big} + ${need} = 10. Then add the ${small - need} that is left.`;
  }
  function add20(d) {
    if (d === 1) {
      if (chance(0.5)) {
        const a = rnd(1, 9), b = rnd(1, 10 - a);
        return N(E(`${a} + ${b} = ?`), a + b, { big: true, hint: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.` });
      }
      const a = rnd(3, 10), b = rnd(1, a);
      return N(E(`${a} − ${b} = ?`), a - b, { big: true, hint: `Start at ${a} and count back ${b}.` });
    }
    if (d === 2) {
      if (chance(0.5)) {
        const a = rnd(2, 9), b = rnd(Math.max(2, 11 - a), 9);
        return N(E(`${a} + ${b} = ?`), a + b, { big: true, hint: makeTenHint(a, b), explain: `${a} + ${b} = ${a + b}` });
      }
      const c = rnd(11, 18), b = rnd(c - 9, 9);
      return N(E(`${c} − ${b} = ?`), c - b, {
        big: true,
        hint: `Think addition: ${b} + what = ${c}? Or take away ${c - 10} first to get to 10.`,
        explain: `${b} + ${c - b} = ${c}, so ${c} − ${b} = ${c - b}`,
      });
    }
    if (d === 3) {
      const c = rnd(9, 20), a = rnd(1, c - 1), b = c - a;
      switch (rnd(1, 4)) {
        case 1: return N(E(`${a} + ? = ${c}`), b, { big: true, hint: `Count up from ${a} to ${c}.`, explain: `${a} + ${b} = ${c}` });
        case 2: return N(E(`? + ${b} = ${c}`), a, { big: true, hint: `What plus ${b} makes ${c}? Try ${c} − ${b}.`, explain: `${a} + ${b} = ${c}` });
        case 3: return N(E(`${c} − ? = ${a}`), b, { big: true, hint: `How far is it from ${a} up to ${c}?`, explain: `${c} − ${b} = ${a}` });
        default: return N(E(`? − ${b} = ${a}`), c, { big: true, hint: `Work backwards: put the ${b} back. ${a} + ${b} = ?`, explain: `${c} − ${b} = ${a}` });
      }
    }
    if (d === 4) {
      if (chance(0.6)) {
        let a, b, c;
        if (chance(0.6)) { a = rnd(1, 9); b = 10 - a; c = rnd(1, 9); } // hidden ten pair
        else do { a = rnd(2, 9); b = rnd(2, 9); c = rnd(2, 9); } while (a + b + c > 20);
        const t = shuffle([a, b, c]);
        return N(E(`${t[0]} + ${t[1]} + ${t[2]} = ?`), a + b + c, { big: true, hint: 'Look for two numbers that make 10, then add the third.' });
      }
      let a, b, c;
      do { a = rnd(5, 15); b = rnd(2, 9); c = rnd(2, 9); } while (a + b > 20 || a + b - c < 0);
      return N(E(`${a} + ${b} − ${c} = ?`), a + b - c, { big: true, hint: `Go left to right: first ${a} + ${b}, then take away ${c}.`, explain: `${a} + ${b} = ${a + b}, ${a + b} − ${c} = ${a + b - c}` });
    }
    // d5: the equal sign means "same value" + longer chains
    const kind = rnd(1, 3);
    if (kind === 1) {
      const s = rnd(11, 20), a = rnd(2, s - 2), b = s - a;
      let c = rnd(2, s - 2);
      while (c === a || c === b) c = rnd(2, s - 2);
      return N(E(`${a} + ${b} = ? + ${c}`), s - c, { big: true, hint: `Both sides must be worth the same. What is ${a} + ${b}?`, explain: `${a} + ${b} = ${s} and ${s - c} + ${c} = ${s}` });
    }
    if (kind === 2) {
      const a = rnd(2, 8), c = rnd(2, 8), b = rnd(2, 20 - a - c > 2 ? 20 - a - c : 2);
      return N(E(`? − ${b} = ${a} + ${c}`), a + c + b, { big: true, hint: `First find ${a} + ${c}. Then which number minus ${b} gives that?`, explain: `${a + c + b} − ${b} = ${a + c}` });
    }
    let a, b, c, e;
    do { a = rnd(10, 20); b = rnd(2, 9); c = rnd(2, 9); e = rnd(2, 9); } while (a - b + c > 20 || a - b + c - e < 0 || a - b < 0);
    return N(E(`${a} − ${b} + ${c} − ${e} = ?`), a - b + c - e, { big: true, hint: 'Work left to right, one step at a time.', explain: `${a} − ${b} = ${a - b}, + ${c} = ${a - b + c}, − ${e} = ${a - b + c - e}` });
  }

  // ======================================================================
  // 2. Place value  (2.NBT.1-4, 2.NBT.8; 3.NBT.1 rounding as challenge)
  // ======================================================================
  const digits = (n) => ({ h: Math.floor(n / 100) % 10, t: Math.floor(n / 10) % 10, o: n % 10 });
  function place(d) {
    if (d === 1) {
      const n = rnd(12, 99), { t, o } = digits(n);
      switch (rnd(1, 3)) {
        case 1: return N('What number do the blocks show?', n, { visual: V.blocks(0, t, o), hint: 'Count the tens rods by 10s, then count on the ones.', explain: `${t} tens and ${o} ones = ${n}` });
        case 2: return N(`How many <b>tens</b> are in ${n}?`, t, { hint: `${n} = ? tens and ${o} ones.`, explain: `${n} = ${t} tens and ${o} ones` });
        default: return N(E(`${t} tens and ${o} ones = ?`), n, { hint: `${t} tens is ${t * 10}.` });
      }
    }
    if (d === 2) {
      const n = rnd(101, 999), { h, t, o } = digits(n);
      switch (rnd(1, 3)) {
        case 1: return N('What number do the blocks show?', n, { visual: V.blocks(h, Math.min(t, 9), o), hint: 'Flats are 100, rods are 10, small cubes are 1.', explain: `${h} hundreds, ${t} tens, ${o} ones = ${n}` });
        case 2: {
          const pos = pick(['hundreds', 'tens', 'ones']);
          const ans = { hundreds: h, tens: t, ones: o }[pos];
          return N(`What digit is in the <b>${pos}</b> place of ${n}?`, ans, { hint: 'From the right: ones, tens, hundreds.', explain: `${n}: ${h} hundreds, ${t} tens, ${o} ones` });
        }
        default: {
          const opts = [[0, h * 100], [1, t * 10], [2, o]].filter((x) => x[1] > 0 && x[0] !== 2);
          const [i, val] = pick(opts);
          const s = String(n).split('').map((c, k) => (k === i ? `<u>${c}</u>` : c)).join('');
          return N(`What is the value of the underlined digit? <span class="bignum">${s}</span>`, val, { hint: 'Is the digit in the hundreds, tens, or ones place?', explain: `The ${String(n)[i]} is in the ${i === 0 ? 'hundreds' : 'tens'} place, so it is worth ${val}.` });
        }
      }
    }
    if (d === 3) {
      switch (rnd(1, 3)) {
        case 1: {
          const n = rnd(101, 999), { h, t, o } = digits(n);
          const parts = [h * 100, t * 10, o].filter((x) => x > 0);
          return N(E(`${parts.join(' + ')} = ?`), n, { big: true, hint: 'Put each part in its place: hundreds, tens, ones.' });
        }
        case 2: {
          const k = pick([['10 more', 10], ['10 less', -10], ['100 more', 100], ['100 less', -100]]);
          const n = rnd(120, 880);
          return N(`What number is <b>${k[0]}</b> than ${n}?`, n + k[1], { hint: `Only the ${Math.abs(k[1]) === 10 ? 'tens' : 'hundreds'} digit changes.` });
        }
        default: {
          const step = pick([5, 10, 100]);
          let start;
          if (step === 5) start = rnd(20, 180) * 5;
          else if (step === 10) start = rnd(100, 900);
          else start = rnd(11, 499);
          const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
          const gap = chance(0.6) ? 4 : rnd(1, 3);
          const shown = seq.map((v, i) => (i === gap ? BLANK : v)).join(', ');
          return N(`What number is missing?<div class="seq">${shown}</div>`, seq[gap], { hint: `Look at how much it grows each time. Skip count by ${step}s.` });
        }
      }
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: {
          let a = rnd(100, 999), b, left, right;
          const { h, t, o } = digits(a);
          const mode = rnd(1, 3);
          if (mode === 1) { b = h * 100 + o * 10 + t; if (b === a) b = a + 10 <= 999 ? a + 10 : a - 10; left = a; right = b; }
          else if (mode === 2) { b = a; left = `${h} hundreds ${t} tens ${o} ones`; right = a; }
          else { b = a + pick([-100, -10, -1, 1, 10, 100]); if (b < 100 || b > 999) b = a; left = a; right = b; }
          const va = a, vb = b;
          const ans = va < vb ? '<' : va > vb ? '>' : '=';
          return C(`Which sign makes it true?<div class="eqline">${left} ${BLANK} ${right}</div>`, ans, ['<', '>', '='], { hint: 'Compare the hundreds first. If they are the same, compare the tens.', explain: `${va} ${ans} ${vb}` });
        }
        case 2: {
          const h = rnd(1, 7), t = rnd(10, 19), o = rnd(0, 9);
          return N(E(`${h} hundreds + ${t} tens + ${o} ones = ?`), h * 100 + t * 10 + o, { hint: `${t} tens is ${t * 10}. That is more than 100!`, explain: `${h * 100} + ${t * 10} + ${o} = ${h * 100 + t * 10 + o}` });
        }
        default: {
          const ds = U.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
          const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => +p.map((i) => ds[i]).join(''));
          const opts = U.sample(perms, 4);
          const want = chance(0.5) ? 'greatest' : 'smallest';
          const ans = want === 'greatest' ? Math.max(...opts) : Math.min(...opts);
          return C(`Which number is the <b>${want}</b>?`, ans, opts, { hint: 'Look at the hundreds digit first.' });
        }
      }
    }
    // d5 challenge
    switch (rnd(1, 4)) {
      case 1: {
        const ds = U.sample(chance(0.4) ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
        const sorted = ds.slice().sort((a, b) => b - a);
        if (chance(0.5)) return N(`Use the digits <b>${ds.join(', ')}</b> once each. What is the <b>greatest</b> 3-digit number you can make?`, +sorted.join(''), { hint: 'Put the biggest digit in the hundreds place.' });
        const asc = ds.slice().sort((a, b) => a - b);
        if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
        return N(`Use the digits <b>${ds.join(', ')}</b> once each. What is the <b>smallest</b> 3-digit number you can make?`, +asc.join(''), { hint: 'Smallest digit in the hundreds place — but a number can’t start with 0!' });
      }
      case 2: {
        if (chance(0.5)) {
          const n = rnd(11, 989);
          if (n % 10 === 5) return place(5);
          return N(`Round <b>${n}</b> to the nearest <b>ten</b>.`, Math.round(n / 10) * 10, { hint: 'Look at the ones digit: 0–4 round down, 5–9 round up.' });
        }
        const n = rnd(110, 989);
        if (Math.floor(n / 10) % 10 === 5) return place(5);
        return N(`Round <b>${n}</b> to the nearest <b>hundred</b>.`, Math.round(n / 100) * 100, { hint: 'Look at the tens digit: 0–4 round down, 5–9 round up.' });
      }
      case 3: {
        const n = rnd(11, 99) * 10;
        return N(`How many <b>tens</b> make ${n}?`, n / 10, { hint: `100 is 10 tens. So ${Math.floor(n / 100) * 100} is ${Math.floor(n / 100) * 10} tens…`, explain: `${n} = ${n / 10} tens` });
      }
      default: {
        const n = rnd(1001, 9999), th = Math.floor(n / 1000), rest = n - th * 1000;
        return N(E(`${U.comma(th * 1000)} + ${rest} = ?`), n, { hint: 'The thousands digit comes first, then hundreds, tens, ones.', explain: `${U.comma(th * 1000)} + ${rest} = ${U.comma(n)}` });
      }
    }
  }

  // ======================================================================
  // 3. Add within 100  (2.NBT.5, 2.NBT.6)
  // ======================================================================
  function add100(d) {
    if (d === 1) {
      const a = rnd(11, 79);
      if (chance(0.5)) {
        const b = 10 * rnd(1, Math.floor((99 - a) / 10));
        return N(E(`${a} + ${b} = ?`), a + b, { big: true, hint: `Count on by tens from ${a}.` });
      }
      const o = a % 10;
      if (o === 9) return add100(1);
      const b = rnd(1, 9 - o);
      return N(E(`${a} + ${b} = ?`), a + b, { big: true, hint: 'Only the ones change.' });
    }
    if (d === 2 || d === 3) {
      let t1, t2, o1, o2;
      if (d === 2) { t1 = rnd(1, 7); t2 = rnd(1, 8 - t1); o1 = rnd(0, 9); o2 = rnd(0, 9 - o1); }
      else { t1 = rnd(1, 6); t2 = rnd(1, 7 - t1); o1 = rnd(2, 9); o2 = rnd(10 - o1, 9); }
      const a = t1 * 10 + o1, b = t2 * 10 + o2, s = a + b;
      const vis = chance(0.4) ? V.column([a, b], '+') : '';
      return N(vis ? 'Add.' : E(`${a} + ${b} = ?`), s, {
        big: !vis, visual: vis,
        hint: d === 3 ? `Ones: ${o1} + ${o2} is more than 10 — make a new ten!` : 'Add the tens, then add the ones.',
        explain: `Tens: ${t1 * 10} + ${t2 * 10} = ${(t1 + t2) * 10}. Ones: ${o1} + ${o2} = ${o1 + o2}. Total: ${s}.`,
      });
    }
    if (d === 4) {
      if (chance(0.5)) {
        let a, b, c;
        do { a = rnd(10, 49); b = rnd(10, 49); c = rnd(10, 39); } while (a + b + c > 100);
        return N(E(`${a} + ${b} + ${c} = ?`), a + b + c, { big: true, hint: 'Add two numbers first, then add the third. Or add all the tens, then all the ones.' });
      }
      const c = rnd(40, 100), a = rnd(11, c - 11);
      return N(E(`${a} + ? = ${c}`), c - a, { big: true, hint: `Count up from ${a}: first to the next ten, then by tens to ${c}.`, explain: `${a} + ${c - a} = ${c}` });
    }
    // d5: four 2-digit numbers (2.NBT.6), sums up to 200
    const nums = [rnd(11, 59), rnd(11, 59), rnd(11, 49), rnd(11, 49)];
    if (chance(0.5)) return N(E(`${nums.join(' + ')} = ?`), U.sum(nums), { big: true, hint: 'Look for friendly pairs that make a ten in the ones place.' });
    return N('Add.', U.sum(nums), { visual: V.column(nums, '+'), hint: 'Add the ones column first. How many tens can you carry?' });
  }

  // ======================================================================
  // 4. Subtract within 100  (2.NBT.5, 2.NBT.9)
  // ======================================================================
  function sub100(d) {
    if (d === 1) {
      const a = rnd(21, 99);
      if (chance(0.5)) {
        const b = 10 * rnd(1, Math.floor(a / 10) - 1 || 1);
        return N(E(`${a} − ${b} = ?`), a - b, { big: true, hint: `Count back by tens from ${a}.` });
      }
      const o = a % 10;
      if (o === 0) return sub100(1);
      const b = rnd(1, o);
      return N(E(`${a} − ${b} = ?`), a - b, { big: true, hint: 'Only the ones change.' });
    }
    if (d === 2 || d === 3) {
      let t1, t2, o1, o2;
      if (d === 2) { t1 = rnd(2, 9); t2 = rnd(1, t1 - 1); o1 = rnd(1, 9); o2 = rnd(0, o1); }
      else { t1 = rnd(3, 9); t2 = rnd(1, t1 - 1); o1 = rnd(0, 7); o2 = rnd(o1 + 1, 9); }
      const a = t1 * 10 + o1, b = t2 * 10 + o2;
      const vis = chance(0.4) ? V.column([a, b], '−') : '';
      return N(vis ? 'Subtract.' : E(`${a} − ${b} = ?`), a - b, {
        big: !vis, visual: vis,
        hint: d === 3 ? `Not enough ones (${o1} < ${o2})? Break one ten into 10 ones. Or count up from ${b} to ${a}.` : 'Subtract the tens, then subtract the ones.',
        explain: `${b} + ${a - b} = ${a}, so ${a} − ${b} = ${a - b}.`,
      });
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: { const b = rnd(11, 89); return N(E(`100 − ${b} = ?`), 100 - b, { big: true, hint: `Count up from ${b} to the next ten, then on to 100.`, explain: `${b} + ${100 - b} = 100` }); }
        case 2: { const a = rnd(40, 99), r = rnd(11, a - 11); return N(E(`${a} − ? = ${r}`), a - r, { big: true, hint: `How far is it from ${r} up to ${a}?`, explain: `${a} − ${a - r} = ${r}` }); }
        default: { const b = rnd(11, 49), r = rnd(11, 50); return N(E(`? − ${b} = ${r}`), b + r, { big: true, hint: `Work backwards: ${r} + ${b}.`, explain: `${b + r} − ${b} = ${r}` }); }
      }
    }
    if (chance(0.5)) {
      let a, b, c;
      do { a = rnd(60, 100); b = rnd(11, 39); c = rnd(11, 39); } while (a - b - c < 1);
      return N(E(`${a} − ${b} − ${c} = ?`), a - b - c, { big: true, hint: `Take away ${b} first, then take away ${c}. Or take away ${b + c} at once!` });
    }
    const a = rnd(110, 199), b = rnd(21, 99);
    return N('Subtract.', a - b, { visual: V.column([a, b], '−'), hint: 'Start with the ones column. Regroup if you need to.' });
  }

  // ======================================================================
  // 5. Odd, even & arrays  (2.OA.3, 2.OA.4; 3.OA.1 as challenge)
  // ======================================================================
  function arrays(d) {
    if (d === 1) {
      const n = rnd(3, 20);
      return C('Is this number of dots <b>odd</b> or <b>even</b>?', n % 2 ? 'odd' : 'even', ['odd', 'even'], { visual: V.pairs(n), hint: 'Pair up the dots. Is one left over?', explain: `${n} is ${n % 2 ? 'odd — one dot has no partner' : 'even — every dot has a partner'}.` });
    }
    if (d === 2) {
      if (chance(0.5)) {
        const n = rnd(21, 99);
        return C(`Is <b>${n}</b> odd or even?`, n % 2 ? 'odd' : 'even', ['odd', 'even'], { hint: 'Only the ones digit matters: 0, 2, 4, 6, 8 are even.', explain: `It ends in ${n % 10}, so ${n} is ${n % 2 ? 'odd' : 'even'}.` });
      }
      const r = rnd(2, 5), c = rnd(2, 5);
      return N(`How many dots are there in all?`, r * c, { visual: V.array(r, c), hint: `There are ${r} rows. Skip count by ${c}s.`, explain: U.range(1, r).map((i) => i * c).join(', ') });
    }
    if (d === 3) {
      if (chance(0.5)) {
        const r = rnd(2, 5), c = rnd(2, 5);
        const rep = (x, k) => Array(k).fill(x).join(' + ');
        const right = rep(c, r);
        const opts = U.strChoices(right, [`${r} + ${c}`, rep(c, r + 1), rep(c + 1, r), rep(c - 1, r)], 4);
        return C(`There are <b>${r} rows</b> with <b>${c}</b> in each row. Which addition matches?`, right, opts, { visual: V.array(r, c), hint: 'Add one number for each row.' });
      }
      const half = rnd(2, 10), n = half * 2;
      return N(E(`Make ${n} with two <b>equal</b> numbers: ${n} = ? + ?`), half, { hint: 'Doubles! Which number plus itself makes it?', explain: `${half} + ${half} = ${n}` });
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: {
          const a = rnd(11, 60), b = rnd(11, 39), s = a + b;
          return C(`Is <b>${a} + ${b}</b> odd or even?`, s % 2 ? 'odd' : 'even', ['odd', 'even'], { hint: 'odd + odd = even, even + even = even, odd + even = odd.', explain: `${a} + ${b} = ${s}, which is ${s % 2 ? 'odd' : 'even'}.` });
        }
        case 2: {
          const r = rnd(2, 5), c = rnd(3, 5), thing = pick([['chairs', 'rows'], ['muffins', 'rows'], ['stamps', 'rows'], ['seeds', 'rows']]);
          return N(`A garden has <b>${r} rows</b> of ${thing[0]} with <b>${c}</b> in each row. How many ${thing[0]} in all?`, r * c, { hint: `Add ${c} again for each of the ${r} rows.` });
        }
        default: {
          const ans = rnd(10, 49) * 2;
          const opts = [ans, ans + 1, ans + 3, ans - 1].map(Number);
          return C('Which number is <b>even</b>?', ans, opts, { hint: 'Look at the ones digit.' });
        }
      }
    }
    if (chance(0.5)) {
      const r = rnd(3, 6), c = rnd(4, 8);
      return N(`How many dots? (Hint: ${r} rows of ${c})`, r * c, { visual: V.array(r, c), hint: `Count by ${c}s ${r} times.`, explain: `${r} × ${c} = ${r * c}` });
    }
    const n = rnd(3, 9), k = 3;
    const s = n * k;
    return C(`Is <b>${n} + ${n} + ${n}</b> odd or even? (Try to decide without adding!)`, s % 2 ? 'odd' : 'even', ['odd', 'even'], { hint: n % 2 ? 'odd + odd = even. Then even + odd = ?' : 'even + even + even…', explain: `${n} + ${n} + ${n} = ${s}` });
  }

  // ======================================================================
  // 6. Time  (2.MD.7; elapsed time 3.MD.1 as challenge)
  // ======================================================================
  const tStr = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const norm = (h, m) => {
    while (m >= 60) { m -= 60; h++; }
    while (m < 0) { m += 60; h--; }
    h = (((h - 1) % 12) + 12) % 12 + 1;
    return [h, m];
  };
  function timeChoices(h, m, step) {
    const cands = [norm(h + 1, m), norm(h - 1, m), norm(h, m + step), norm(h, m - step), [m === 0 ? 12 : m / 5, (h % 12) * 5]]
      .filter(([hh, mm]) => Number.isInteger(hh) && hh >= 1 && hh <= 12 && mm >= 0 && mm < 60)
      .map(([hh, mm]) => tStr(hh, mm));
    if (m >= 35) cands.unshift(tStr(norm(h + 1, 0)[0], m)); // classic mistake: reading the next hour
    return U.strChoices(tStr(h, m), cands, 4);
  }
  function time(d) {
    if (d <= 3) {
      const h = rnd(1, 12);
      const m = d === 1 ? pick([0, 30]) : d === 2 ? pick([0, 15, 30, 45]) : rnd(0, 11) * 5;
      return C('What time does the clock show?', tStr(h, m), timeChoices(h, m, d === 1 ? 30 : d === 2 ? 15 : 5), {
        visual: V.clock(h, m),
        hint: 'The short hand shows the hour. The long hand shows minutes — count by 5s from the 12.',
        explain: `The short hand ${m === 0 ? 'points to' : 'is just past'} ${h}. The long hand points to ${m === 0 ? 12 : m / 5}, which means ${m} minutes.`,
      });
    }
    if (d === 4) {
      if (chance(0.35)) {
        const acts = [['You eat breakfast at 7:30.', 'a.m.'], ['You wake up for school at 6:45.', 'a.m.'], ['School starts at 8:15.', 'a.m.'], ['You watch the sunset at 7:00.', 'p.m.'], ['You eat dinner at 6:00.', 'p.m.'], ['You go to bed at 8:30.', 'p.m.'], ['You eat lunch at 12:30.', 'p.m.'], ['You see the sunrise at 6:50.', 'a.m.'], ['School ends at 2:45.', 'p.m.'], ['Morning recess starts at 10:00.', 'a.m.']];
        const [a, ans] = pick(acts);
        return C(`${a} Is that time <b>a.m.</b> or <b>p.m.</b>?`, ans, ['a.m.', 'p.m.'], { hint: 'a.m. is from midnight to noon. p.m. is from noon to midnight.' });
      }
      const h = rnd(1, 12), m = rnd(0, 11) * 5, add = pick([10, 15, 20, 30, 45]);
      const [h2, m2] = norm(h, m + add);
      return C(`What time will it be in <b>${add} minutes</b>?`, tStr(h2, m2), timeChoices(h2, m2, 5), { visual: V.clock(h, m), hint: `First read the clock: it is ${tStr(h, m)}. Then count on ${add} minutes by 5s.`, explain: `${tStr(h, m)} + ${add} minutes = ${tStr(h2, m2)}` });
    }
    const h = rnd(1, 10), m = rnd(0, 11) * 5, dur = rnd(4, 26) * 5;
    const [h2, m2] = norm(h, m + dur);
    const thing = pick(['A movie', 'A soccer game', 'A piano lesson', 'A train ride', 'A science show']);
    if (chance(0.5)) return N(`${thing} starts at <b>${tStr(h, m)}</b> and ends at <b>${tStr(h2, m2)}</b>. How many minutes long is it?`, dur, { unit: 'min', hint: `Count up from ${tStr(h, m)} to the next o'clock, then keep going.`, explain: `From ${tStr(h, m)} to ${tStr(h2, m2)} is ${dur} minutes.` });
    return C(`${thing} starts at <b>${tStr(h, m)}</b> and lasts <b>${dur} minutes</b>. When does it end?`, tStr(h2, m2), timeChoices(h2, m2, 5), { hint: 'Jump to the next hour first, then add the rest.' });
  }

  // ======================================================================
  // 7. Money  (2.MD.8)
  // ======================================================================
  const COINV = { q: 25, d: 10, n: 5, p: 1, b: 100 };
  const coinSum = (list) => U.sum(list.map((k) => COINV[k]));
  const sortCoins = (list) => list.slice().sort((a, b) => COINV[b] - COINV[a]);
  function randomCoins(kinds, maxCount, maxTotal) {
    for (;;) {
      const k = rnd(2, maxCount), list = [];
      for (let i = 0; i < k; i++) list.push(pick(kinds));
      if (coinSum(list) <= maxTotal) return sortCoins(list);
    }
  }
  function money(d) {
    if (d <= 2) {
      const list = d === 1 ? randomCoins(['d', 'n', 'p'], 7, 50) : randomCoins(['q', 'd', 'n', 'p'], 7, 99);
      return N('How much money is this?', coinSum(list), { unit: '¢', visual: V.coins(list, true), hint: 'Start with the coins worth the most and count on.', explain: list.map((k) => COINV[k] + '¢').join(' + ') + ` = ${coinSum(list)}¢` });
    }
    if (d === 3) {
      if (chance(0.5)) {
        const list = ['b', ...randomCoins(['q', 'd', 'n', 'p'], 5, 99)];
        if (chance(0.4)) list.unshift('b');
        const s = coinSum(list);
        const dist = [s + 10, s - 10, s + 5, s - 1, s + 25].filter((x) => x > 0).map(U.dollars);
        return C('How much money is this?', U.dollars(s), U.strChoices(U.dollars(s), dist, 4), { visual: V.coins(list, false), hint: 'A dollar is 100¢. Quarters are 25¢, dimes 10¢, nickels 5¢, pennies 1¢.', explain: `That is ${s}¢ = ${U.dollars(s)}.` });
      }
      const q = pick([['dimes', 10, 100, '$1'], ['nickels', 5, rnd(2, 9) * 5, null], ['quarters', 25, 100, '$1'], ['quarters', 25, 200, '$2'], ['dimes', 10, rnd(3, 9) * 10, null], ['nickels', 5, 100, '$1'], ['pennies', 1, 100, '$1']]);
      const [coin, v, total, label] = q;
      return N(`How many <b>${coin}</b> make <b>${label || total + '¢'}</b>?`, total / v, { hint: `Count by ${v}s until you reach ${total}.`, explain: `${total / v} × ${v}¢ = ${total}¢` });
    }
    if (d === 4) {
      if (chance(0.6)) {
        const have = pick([50, 75, 100, 100]), price = rnd(11, have - 3);
        const item = pick(['a pencil', 'a sticker', 'a juice box', 'a bouncy ball', 'a bookmark', 'a lollipop']);
        return N(`You have ${have === 100 ? '<b>$1</b>' : `<b>${have}¢</b>`}. You buy ${item} for <b>${price}¢</b>. How much change do you get?`, have - price, { unit: '¢', hint: `Count up from ${price}¢ to ${have}¢.`, explain: `${price}¢ + ${have - price}¢ = ${have}¢` });
      }
      const list = randomCoins(['q', 'd', 'n'], 4, 80);
      const s = coinSum(list), price = s + rnd(1, 4) * 5;
      return N(`A toy costs <b>${price}¢</b>. You have these coins. How much <b>more</b> money do you need?`, price - s, { unit: '¢', visual: V.coins(list, false), hint: 'First count your coins. Then count up to the price.', explain: `You have ${s}¢. ${price}¢ − ${s}¢ = ${price - s}¢` });
    }
    if (chance(0.5)) {
      const amt = rnd(11, 99);
      let r = amt, cnt = 0;
      for (const v of [25, 10, 5, 1]) { cnt += Math.floor(r / v); r %= v; }
      return N(`What is the <b>fewest</b> number of coins that make <b>${amt}¢</b>?`, cnt, { hint: 'Use as many quarters as you can, then dimes, then nickels, then pennies.' });
    }
    const a = rnd(1, 4) * 100 + rnd(1, 19) * 5, b = rnd(1, 3) * 100 + rnd(1, 15) * 5, s = a + b;
    const dist = [s + 100, s - 10, s + 10, s - 100, s + 5].filter((x) => x > 0).map(U.dollars);
    return C(E(`${U.dollars(a)} + ${U.dollars(b)} = ?`), U.dollars(s), U.strChoices(U.dollars(s), dist, 4), { hint: 'Add the dollars, then add the cents. 100¢ makes another dollar!' });
  }

  // ======================================================================
  // 8. Shapes & fractions  (2.G.1-3; 3.NF.1-3 as challenge)
  // ======================================================================
  const SHAPES = [['triangle', 3], ['square', 4], ['rectangle', 4], ['pentagon', 5], ['hexagon', 6], ['circle', 0], ['octagon', 8], ['rhombus', 4], ['trapezoid', 4]];
  function shapes(d) {
    if (d === 1) {
      const pool = SHAPES.slice(0, 6);
      const [name] = pick(pool);
      const others = pool.map((s) => s[0]).filter((s) => s !== name);
      return C('What is the name of this shape?', name, U.strChoices(name, others, 4), { visual: V.shape(name, { rotate: chance(0.5) }), hint: 'Count the sides and the corners.' });
    }
    if (d === 2) {
      if (chance(0.25)) {
        const [name, n] = pick([['triangle', 3], ['quadrilateral', 4], ['pentagon', 5], ['hexagon', 6]]);
        return C(`A shape with exactly <b>${n} sides</b> is called a…`, name, U.strChoices(name, ['triangle', 'quadrilateral', 'pentagon', 'hexagon', 'octagon'], 4), { hint: 'tri = 3, quad = 4, penta = 5, hexa = 6, octa = 8' });
      }
      const [name, n] = pick(SHAPES.filter((s) => s[1] > 0));
      const irregular = ['triangle', 'pentagon', 'hexagon'].includes(name) && chance(0.6);
      const what = chance(0.5) ? 'sides' : 'vertices (corners)';
      return N(`How many <b>${what}</b> does this shape have?`, n, { visual: V.shape(name, { irregular, rotate: true }), hint: 'Touch each one as you count. Start at the top.' , explain: `It is ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}: ${n} sides and ${n} vertices.` });
    }
    if (d === 3) {
      const n = pick([2, 3, 4]);
      const style = chance(0.5) ? 'bar' : 'circle';
      if (chance(0.35)) {
        const word = { 2: 'halves', 3: 'thirds', 4: 'fourths' }[n];
        return C('This shape is cut into equal parts called…', word, ['halves', 'thirds', 'fourths'], { visual: V.fraction(n, 0, style), hint: 'Count the equal parts: 2 = halves, 3 = thirds, 4 = fourths.' });
      }
      const k = rnd(1, n - 1);
      const ans = `${k}/${n}`;
      const dist = [`${n - k}/${n}`, `${k}/${n + 1}`, `${n}/${k}`, `${k}/${n - k}`, `${k + 1}/${n}`].filter((f) => {
        const [a, b] = f.split('/').map(Number);
        return b > 0 && Math.abs(a / b - k / n) > 1e-9;
      });
      return C('What fraction of the shape is shaded?', ans, U.strChoices(ans, dist, 4), { visual: V.fraction(n, k, style), hint: 'Bottom number: how many equal parts in all. Top number: how many are shaded.', explain: `${k} of ${n} equal parts are shaded: ${k}/${n}.` });
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: { const r = rnd(2, 5), c = rnd(2, 6); return N('This rectangle is split into equal squares. How many squares?', r * c, { visual: V.grid(r, c), hint: `There are ${r} rows. Count by ${c}s.` }); }
        case 2: {
          const q = pick([['faces', 6], ['edges', 12], ['vertices (corners)', 8]]);
          return N(`How many <b>${q[0]}</b> does a cube have?`, q[1], { visual: V.cube(), hint: q[0] === 'faces' ? 'Think of a dice: top, bottom, front, back, left, right.' : q[0] === 'edges' ? 'Count the edges on top, on the bottom, and the ones going up.' : '4 corners on top, and how many on the bottom?' });
        }
        default: {
          const a = pick(SHAPES.filter((s) => s[1] > 0)), b = pick(SHAPES.filter((s) => s[1] > 0 && s[0] !== a[0]));
          const ka = rnd(1, 3), kb = rnd(1, 2);
          const pl = (s, k) => (k === 1 ? `1 ${s}` : `${k} ${s}s`);
          return N(`How many sides in all: <b>${pl(a[0], ka)}</b> and <b>${pl(b[0], kb)}</b>?`, ka * a[1] + kb * b[1], { hint: `A ${a[0]} has ${a[1]} sides. A ${b[0]} has ${b[1]} sides.` });
        }
      }
    }
    switch (rnd(1, 3)) {
      case 1: {
        const [x, y] = U.sample([2, 3, 4, 6, 8], 2);
        const ans = `1/${Math.min(x, y)}`;
        return C(`Which piece is <b>bigger</b>: 1/${x} of a pizza or 1/${y} of the same pizza?`, ans, [`1/${x}`, `1/${y}`], { hint: 'More slices means each slice is smaller!' });
      }
      case 2: {
        const n = pick([2, 3, 4, 5]), each = rnd(2, 6), total = n * each;
        const thing = pick(['cookies', 'shells', 'stickers', 'marbles', 'acorns']);
        return N(`What is <b>1/${n}</b> of ${total} ${thing}?`, each, { hint: `Share ${total} ${thing} into ${n} equal groups.`, explain: `${total} ÷ ${n} = ${each}` });
      }
      default: {
        const [num, den, den2] = pick([[1, 2, 4], [1, 2, 6], [1, 2, 8], [1, 3, 6], [1, 4, 8], [2, 3, 6], [3, 4, 8]]);
        return N(E(`${num}/${den} = ?/${den2}`), (num * den2) / den, { big: true, hint: `Cut every part into ${den2 / den} smaller parts.`, visual: V.fraction(den, num, 'bar'), explain: `${num}/${den} = ${(num * den2) / den}/${den2}` });
      }
    }
  }

  // ======================================================================
  // 9. Measurement  (2.MD.1-6; perimeter & area 3.MD as challenge)
  // ======================================================================
  const UNIT_ITEMS = [
    ['the length of a crayon', 'inches', 'us'], ['the length of a ladybug', 'inches', 'us'], ['the length of a paper clip', 'inches', 'us'],
    ['the height of a door', 'feet', 'us'], ['the length of a car', 'feet', 'us'], ['the height of a grown-up', 'feet', 'us'],
    ['the length of a football field', 'yards', 'us'], ['the distance from Los Angeles to San Francisco', 'miles', 'us'],
    ['the length of a pencil', 'centimeters', 'm'], ['the width of a strawberry', 'centimeters', 'm'], ['the length of a key', 'centimeters', 'm'],
    ['the length of a swimming pool', 'meters', 'm'], ['the height of a giraffe', 'meters', 'm'], ['the length of a school hallway', 'meters', 'm'],
    ['the distance a car drives in an hour', 'kilometers', 'm'],
  ];
  function measure(d) {
    if (d === 1) {
      const len = rnd(1, 6);
      return N('How long is the crayon?', len, { unit: 'in', visual: V.ruler({ unit: 'in', max: 7, start: 0, len, color: pick(V.FILLS) }), hint: 'Look at the number on the ruler right under the tip.' });
    }
    if (d === 2) {
      const start = chance(0.6) ? rnd(1, 4) : 0, len = rnd(2, 8);
      return N('How long is the crayon?' + (start ? ' Careful — it does not start at 0!' : ''), len, { unit: 'cm', visual: V.ruler({ unit: 'cm', max: 13, start, len, guides: true, color: pick(V.FILLS) }), hint: start ? `It starts at ${start}. Count the spaces from ${start} to the tip.` : 'Look at the number under the tip.', explain: start ? `${start + len} − ${start} = ${len}` : '' });
    }
    if (d === 3) {
      if (chance(0.5)) {
        const [item, ans, sys] = pick(UNIT_ITEMS);
        const opts = sys === 'us' ? ['inches', 'feet', 'yards', 'miles'] : ['centimeters', 'meters', 'kilometers'];
        return C(`Which unit would you use to measure <b>${item}</b>?`, ans, opts, { hint: sys === 'us' ? 'inch = about a paper clip, foot = a ruler, yard = a big step, mile = a long walk' : 'centimeter = a fingernail wide, meter = a big step, kilometer = a long walk' });
      }
      const [n1, n2] = two(), a = rnd(9, 30), b = rnd(3, a - 2), u = pick(['cm', 'inches']);
      return N(`${n1}'s ribbon is <b>${a} ${u}</b> long. ${n2}'s ribbon is <b>${b} ${u}</b> long. How much longer is ${n1}'s ribbon?`, a - b, { unit: u === 'cm' ? 'cm' : 'in', hint: `Subtract: ${a} − ${b}.` });
    }
    if (d === 4) {
      const q = pick([
        () => { const f = rnd(2, 3); return [`How many inches are in <b>${f} feet</b>? (1 foot = 12 inches)`, f * 12, 'in', `Add 12 for each foot: ${Array(f).fill(12).join(' + ')}.`]; },
        () => { const y = rnd(2, 5); return [`How many feet are in <b>${y} yards</b>? (1 yard = 3 feet)`, y * 3, 'ft', `Count by 3s, ${y} times.`]; },
        () => { const m = rnd(2, 5); return [`How many centimeters are in <b>${m} meters</b>? (1 meter = 100 cm)`, m * 100, 'cm', `Count by 100s, ${m} times.`]; },
        () => { const i = rnd(1, 11); return [`<b>1 foot ${i} inches</b> = how many inches? (1 foot = 12 inches)`, 12 + i, 'in', `1 foot is 12 inches. Then add ${i} more.`]; },
        () => { const a = rnd(20, 60), b = rnd(10, 40); return [`A snail crawls <b>${a} cm</b>, rests, then crawls <b>${b} cm</b> more. How far did it crawl in all?`, a + b, 'cm', 'Put the two distances together.']; },
      ])();
      return N(q[0], q[1], { unit: q[2], hint: q[3] });
    }
    switch (rnd(1, 3)) {
      case 1: { const w = rnd(3, 12), h = rnd(2, 8); return N('What is the <b>perimeter</b> (distance all the way around)?', 2 * (w + h), { unit: 'cm', visual: V.rectSides(w, h, 'cm'), hint: 'Add all four sides.', explain: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)}` }); }
      case 2: { const sides = Array.from({ length: pick([3, 5]) }, () => rnd(2, 12)); return N('What is the <b>perimeter</b> of this shape?', U.sum(sides), { unit: 'in', visual: V.polySides(sides, 'in'), hint: 'Add up every side.', explain: sides.join(' + ') + ' = ' + U.sum(sides) }); }
      default: { const r = rnd(2, 6), c = rnd(3, 8); return N('Each square is 1 square centimeter. What is the <b>area</b>?', r * c, { unit: 'sq cm', visual: V.grid(r, c, '#a6e3d8'), hint: `Count the squares: ${r} rows of ${c}.` }); }
    }
  }

  // ======================================================================
  // 10. Graphs  (2.MD.10)
  // ======================================================================
  const THEMES = [
    { title: 'Animals seen on a hike', items: [['🦊', 'foxes'], ['🦉', 'owls'], ['🐿️', 'squirrels'], ['🦔', 'hedgehogs'], ['🦌', 'deer']] },
    { title: 'Favorite fruit in class', items: [['🍎', 'apples'], ['🍌', 'bananas'], ['🍓', 'berries'], ['🍇', 'grapes'], ['🍊', 'oranges']] },
    { title: 'Weather this month', items: [['☀️', 'sunny'], ['🌧️', 'rainy'], ['☁️', 'cloudy'], ['💨', 'windy']] },
    { title: 'Bugs in the garden', items: [['🐞', 'ladybugs'], ['🐝', 'bees'], ['🦋', 'butterflies'], ['🐛', 'caterpillars'], ['🐜', 'ants']] },
    { title: 'Things found at the beach', items: [['🐚', 'shells'], ['🦀', 'crabs'], ['⭐', 'sea stars'], ['🪨', 'rocks']] },
  ];
  function graphData(k, lo, hi, mult = 1) {
    const th = pick(THEMES);
    const items = U.sample(th.items, k);
    const vals = U.sample(U.range(lo, hi), k).map((v) => v * mult); // distinct values
    return { title: th.title, data: items.map(([emoji, label], i) => ({ emoji, label, value: vals[i] })) };
  }
  function data(d) {
    if (d === 1) {
      const g = graphData(3, 1, 8);
      const x = pick(g.data);
      return N(`How many <b>${x.label}</b>? ${x.emoji}`, x.value, { visual: V.picGraph(g.data, { title: g.title }), hint: `Count the ${x.emoji} in that row.` });
    }
    if (d === 2) {
      const g = graphData(4, 1, 10);
      if (chance(0.5)) {
        const x = pick(g.data);
        return N(`How many <b>${x.label}</b>?`, x.value, { visual: V.barGraph(g.data, { title: g.title }), hint: 'Go to the top of the bar, then look left to the number.' });
      }
      const most = chance(0.5);
      const ans = g.data.reduce((a, b) => ((most ? b.value > a.value : b.value < a.value) ? b : a));
      return C(`Which has the <b>${most ? 'most' : 'fewest'}</b>?`, ans.label, g.data.map((x) => x.label), { visual: V.barGraph(g.data, { title: g.title }), hint: `Find the ${most ? 'tallest' : 'shortest'} bar.` });
    }
    if (d === 3) {
      const g = graphData(4, 1, 12);
      const [a, b] = U.sample(g.data, 2).sort((x, y) => y.value - x.value);
      const vis = chance(0.5) ? V.barGraph(g.data, { title: g.title }) : V.picGraph(g.data, { title: g.title });
      if (chance(0.5)) return N(`How many <b>more</b> ${a.label} than ${b.label}?`, a.value - b.value, { visual: vis, hint: `Find both numbers: ${a.label} and ${b.label}. Then subtract.` });
      return N(`How many <b>fewer</b> ${b.label} than ${a.label}?`, a.value - b.value, { visual: vis, hint: 'Find both numbers, then subtract the smaller from the bigger.' });
    }
    if (d === 4) {
      if (chance(0.5)) {
        const g = graphData(3, 1, 8, 2);
        const x = pick(g.data);
        return N(`Look at the key! How many <b>${x.label}</b>?`, x.value, { visual: V.picGraph(g.data, { per: 2, title: g.title }), hint: 'Each symbol stands for 2. Count by 2s.' });
      }
      const g = graphData(4, 2, 12);
      return N('How many are there <b>in all</b>?', U.sum(g.data.map((x) => x.value)), { visual: V.barGraph(g.data, { title: g.title }), hint: 'Read every bar, then add them all.' });
    }
    if (chance(0.5)) {
      const step = pick([5, 10]);
      const g = graphData(4, 1, 9, step);
      const [a, b, c] = U.sample(g.data, 3);
      if (a.value + b.value <= c.value) return data(5);
      return N(`How many more <b>${a.label} and ${b.label} together</b> than ${c.label}?`, a.value + b.value - c.value, { visual: V.barGraph(g.data, { step, title: g.title }), hint: `Each line on the graph is ${step}. Add the first two, then subtract.` });
    }
    const g = graphData(3, 1, 7, 5);
    const x = pick(g.data);
    return N(`Each symbol means 5. How many <b>${x.label}</b>?`, x.value, { visual: V.picGraph(g.data, { per: 5, title: g.title }), hint: 'Count by 5s!' });
  }

  // ======================================================================
  // 11. Add & subtract within 1000  (2.NBT.7)
  // ======================================================================
  function big(d) {
    const add = chance(0.5);
    if (d === 1) {
      if (chance(0.5)) {
        const a = rnd(1, 8) * 100, b = add ? rnd(1, 9 - a / 100) * 100 : rnd(1, a / 100) * 100;
        return N(E(`${a} ${add ? '+' : '−'} ${b} = ?`), add ? a + b : a - b, { big: true, hint: `Think in hundreds: ${a / 100} ${add ? '+' : '−'} ${b / 100}.` });
      }
      const a = rnd(10, 89) * 10, t = Math.floor(a / 10) % 10;
      if (add) { if (t === 9) return big(1); const b = rnd(1, 9 - t) * 10; return N(E(`${a} + ${b} = ?`), a + b, { big: true, hint: 'Only the tens change.' }); }
      if (t === 0) return big(1);
      const b = rnd(1, t) * 10;
      return N(E(`${a} − ${b} = ?`), a - b, { big: true, hint: 'Only the tens change.' });
    }
    let a, b;
    const ds = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
    for (let guard = 0; guard < 500; guard++) {
      a = rnd(101, 899); b = rnd(101, 899);
      if (add && a + b > 999) continue;
      if (!add && b >= a) [a, b] = [b, a];
      if (!add && a === b) continue;
      const [ah, at, ao] = ds(a), [bh, bt, bo] = ds(b);
      const r1c = add ? ao + bo >= 10 : ao < bo;
      const r2c = add ? at + bt + (r1c ? 1 : 0) >= 10 : at - (r1c ? 1 : 0) < bt;
      const regroups = (r1c ? 1 : 0) + (r2c ? 1 : 0);
      if (d === 2 && regroups === 0) break;
      if (d === 3 && regroups === 1) break;
      if (d === 4 && regroups === 2) break;
      if (d === 5) break;
    }
    if (d === 4 && !add && chance(0.4)) { a = rnd(2, 9) * 100 + (chance(0.5) ? rnd(1, 9) : 0); b = rnd(101, a - 1); }
    if (d === 5) {
      if (chance(0.5)) { const c = rnd(5, 10) * 100, x = rnd(101, c - 101); return N(E(`${x} + ? = ${c}`), c - x, { big: true, hint: `Count up from ${x}: to the next ten, the next hundred, then to ${c}.`, explain: `${x} + ${c - x} = ${c}` }); }
      let x, y, z;
      do { x = rnd(101, 499); y = rnd(101, 399); z = rnd(50, 299); } while (x + y + z > 999);
      return N('Add.', x + y + z, { visual: V.column([x, y, z], '+'), hint: 'Add one column at a time, starting with the ones.' });
    }
    const op = add ? '+' : '−', ans = add ? a + b : a - b;
    const vis = chance(0.6) ? V.column([a, b], op) : '';
    return N(vis ? (add ? 'Add.' : 'Subtract.') : E(`${a} ${op} ${b} = ?`), ans, {
      big: !vis, visual: vis,
      hint: add ? 'Add ones, then tens, then hundreds. 10 ones make a ten; 10 tens make a hundred.' : 'Subtract ones, then tens, then hundreds. Regroup when the top digit is smaller.',
      explain: add ? `${a} + ${b} = ${ans}` : `${b} + ${ans} = ${a}`,
    });
  }

  // ======================================================================
  // 12. Word problems  (2.OA.1 one- and two-step, 2.MD.5)
  // ======================================================================
  const THINGS = ['shells', 'stickers', 'marbles', 'acorns', 'crayons', 'stamps', 'beads', 'cards', 'rocks', 'leaves'];
  const CRITTERS = ['frogs', 'ducks', 'turtles', 'birds', 'penguins', 'otters', 'ladybugs', 'fish'];
  function words(d) {
    const [p, q] = two();
    const th = pick(THINGS), cr = pick(CRITTERS);
    const T = {
      1: [
        () => { const a = rnd(3, 12), b = rnd(2, 20 - a); return [`${p} has ${a} ${th}. ${p} finds ${b} more. How many ${th} does ${p} have now?`, a + b, `${a} + ${b}`]; },
        () => { const a = rnd(8, 20), b = rnd(2, a - 1); return [`There are ${a} ${cr} by the pond. ${b} go away. How many are left?`, a - b, `${a} − ${b}`]; },
        () => { const a = rnd(3, 10), b = rnd(3, 10); return [`${a} red ${th} and ${b} blue ${th} are in a box. How many ${th} in all?`, a + b, `${a} + ${b}`]; },
        () => { const a = rnd(8, 20), b = rnd(2, a - 2); return [`${p} had ${a} ${th} and gave ${b} to ${q}. How many does ${p} have left?`, a - b, `${a} − ${b}`]; },
      ],
      2: [
        () => { const a = rnd(25, 90), b = rnd(10, a - 5); return [`${p} read ${a} pages. ${q} read ${b} pages. How many more pages did ${p} read?`, a - b, `${a} − ${b}`]; },
        () => { const a = rnd(15, 60), b = rnd(10, 39); return [`A sea otter ate ${a} clams on Monday and ${b} clams on Tuesday. How many clams in all?`, a + b, `${a} + ${b}`]; },
        () => { const a = rnd(40, 99), b = rnd(11, a - 10); return [`There were ${a} ${cr} on the island. ${b} swam away. How many stayed?`, a - b, `${a} − ${b}`]; },
        () => { const a = rnd(20, 60), b = rnd(10, 35); return [`${p} has ${a} ${th}. ${q} has ${b} more than ${p}. How many ${th} does ${q} have?`, a + b, `${a} + ${b}`]; },
      ],
      3: [
        () => { const a = rnd(10, 50), c = rnd(a + 5, 95); return [`${p} had ${a} ${th}. After getting some more, ${p} has ${c}. How many ${th} did ${p} get?`, c - a, `${c} − ${a}`]; },
        () => { const b = rnd(5, 30), r = rnd(5, 40); return [`Some ${cr} were on a log. ${b} jumped off. Now there are ${r}. How many were on the log at first?`, b + r, `${r} + ${b}`]; },
        () => { const a = rnd(30, 90), b = rnd(5, 25); return [`${q} has ${b} fewer ${th} than ${p}. ${p} has ${a}. How many ${th} does ${q} have?`, a - b, `${a} − ${b}`]; },
        () => { const c = rnd(40, 99), a = rnd(10, c - 10); return [`A class needs ${c} cups for a party. They have ${a}. How many more cups do they need?`, c - a, `${c} − ${a}`]; },
      ],
      4: [
        () => { const a = rnd(20, 50), b = rnd(5, a - 5), c = rnd(5, 30); return [`There were ${a} kids on a bus. At the first stop ${b} got off and ${c} got on. How many kids are on the bus now?`, a - b + c, `${a} − ${b} + ${c}`]; },
        () => { const a = rnd(20, 50), b = rnd(10, 30), c = rnd(5, a + b - 5); return [`${p} has ${a} ${th}. ${p} gets ${b} more, then uses ${c} for an art project. How many are left?`, a + b - c, `${a} + ${b} − ${c}`]; },
        () => { const a = rnd(10, 35), b = rnd(5, 20); return [`${p} has ${a} ${th}. ${q} has ${b} more than ${p}. How many ${th} do they have together?`, a + a + b, `${a} + ${a + b}`]; },
        () => { const a = rnd(10, 30), b = rnd(10, 30), c = rnd(10, 30); return [`A naturalist counted ${a} ${cr} in the morning, ${b} at noon, and ${c} in the evening. How many in all?`, a + b + c, `${a} + ${b} + ${c}`]; },
      ],
      5: [
        () => { const k = pick([6, 8, 10, 12]), g = rnd(2, 5), x = rnd(1, 9); return [`A box holds ${k} crayons. ${p} has ${g} full boxes and ${x} extra crayons. How many crayons in all?`, k * g + x, `${Array(g).fill(k).join(' + ')} + ${x}`]; },
        () => { const a = rnd(2, 6), b = rnd(2, 5); return [`On a farm there are ${a} ducks and ${b} goats. How many legs are there in all?`, a * 2 + b * 4, `${a} × 2 + ${b} × 4`]; },
        () => { const g = rnd(2, 5); return [`An octopus has 8 arms. How many arms do ${g} octopuses have?`, 8 * g, Array(g).fill(8).join(' + ')]; },
        () => { const a = rnd(300, 600), b = rnd(100, 300), c = rnd(50, 250); return [`A library had ${a} books. It got ${b} new books and lent out ${c}. How many books are on the shelves now?`, a + b - c, `${a} + ${b} − ${c}`]; },
        () => { const a = rnd(3, 6), b = rnd(2, a * 5 - 2); return [`${p} has ${a} bags with 5 marbles in each bag. ${p} gives ${b} marbles to ${q}. How many marbles does ${p} have left?`, a * 5 - b, `${Array(a).fill(5).join(' + ')} − ${b}`]; },
      ],
    };
    const [text, ans, expr] = pick(T[d])();
    return N(text, ans, { hint: d >= 4 ? 'Two steps! What happens first? What happens next?' : 'Act it out or draw a quick picture. Are things joining or leaving?', explain: `${expr} = ${ans}`, wordy: true });
  }

  // ======================================================================
  // 13. Multiply & divide  (challenge: 3.OA.1-7)
  // ======================================================================
  const GROUP_EMOJI = ['🍪', '🐞', '🌸', '🐟', '⭐', '🍓', '🐚'];
  function mult(d) {
    if (d === 1) {
      const g = rnd(2, 5), k = rnd(2, 5);
      if (chance(0.6)) return N(`<b>${g} groups of ${k}</b>. How many in all?`, g * k, { visual: V.groups(g, k, pick(GROUP_EMOJI)), hint: `Skip count by ${k}s, ${g} times.`, explain: `${Array(g).fill(k).join(' + ')} = ${g * k}` });
      const t = pick([2, 5, 10]), n = rnd(1, 5);
      return N(E(`${n} × ${t} = ?`), n * t, { big: true, hint: `Count by ${t}s, ${n} times.` });
    }
    if (d === 2) {
      const t = pick([2, 3, 4, 5, 10]), n = rnd(1, 10);
      const [x, y] = chance(0.5) ? [n, t] : [t, n];
      return N(E(`${x} × ${y} = ?`), x * y, { big: true, hint: `Count by ${t}s.` });
    }
    if (d === 3) {
      const x = rnd(2, 10), y = rnd(2, 10);
      return N(E(`${x} × ${y} = ?`), x * y, { big: true, hint: x === y ? 'A square number!' : `Do you know ${Math.min(x, y)} × ${Math.max(x, y)}? Turn it around if that helps.` });
    }
    if (d === 4) {
      const x = rnd(2, 10), y = rnd(2, 10), c = x * y;
      if (chance(0.5)) return N(E(`${c} ÷ ${x} = ?`), y, { big: true, hint: `Think: ${x} × what = ${c}?`, explain: `${x} × ${y} = ${c}` });
      return N(E(`? × ${y} = ${c}`), x, { big: true, hint: `Count by ${y}s until you reach ${c}.`, explain: `${x} × ${y} = ${c}` });
    }
    switch (rnd(1, 3)) {
      case 1: { const a = rnd(11, 25), b = rnd(2, 5); return N(E(`${a} × ${b} = ?`), a * b, { big: true, hint: `Split it: ${Math.floor(a / 10) * 10} × ${b} and ${a % 10} × ${b}, then add.`, explain: `${Math.floor(a / 10) * 10 * b} + ${(a % 10) * b} = ${a * b}` }); }
      case 2: { const a = rnd(2, 4), b = rnd(2, 5), c = rnd(2, 5); return N(E(`${a} × ${b} × ${c} = ?`), a * b * c, { big: true, hint: 'Multiply two numbers first, then the third.' }); }
      default: {
        const k = rnd(3, 6), each = rnd(3, 9), total = k * each;
        const [p] = two();
        return N(`${p} shares ${total} strawberries equally among ${k} friends. How many does each friend get?`, each, { hint: `Make ${k} equal groups. ${k} × what = ${total}?`, explain: `${total} ÷ ${k} = ${each}` });
      }
    }
  }

  // ======================================================================
  // 14. Patterns & logic  (challenge: algebraic thinking, number sense puzzles)
  // ======================================================================
  function riddle(maxN) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const n = rnd(10, maxN);
      const t = Math.floor(n / 10), o = n % 10;
      const lo = Math.max(10, n - rnd(3, 12)), hi = Math.min(maxN, n + rnd(3, 12));
      if (lo >= n || hi <= n) continue;
      const clues = [
        { s: `I am between ${lo} and ${hi}.`, f: (x) => x > lo && x < hi },
        { s: n % 2 ? 'I am odd.' : 'I am even.', f: (x) => x % 2 === n % 2 },
        { s: `My digits add up to ${t + o}.`, f: (x) => Math.floor(x / 10) + (x % 10) === t + o },
        o > t ? { s: 'My ones digit is bigger than my tens digit.', f: (x) => x % 10 > Math.floor(x / 10) } : o < t ? { s: 'My ones digit is smaller than my tens digit.', f: (x) => x % 10 < Math.floor(x / 10) } : { s: 'My two digits are the same.', f: (x) => x % 10 === Math.floor(x / 10) },
        n % 5 === 0 ? { s: 'You say me when you count by 5s.', f: (x) => x % 5 === 0 } : { s: 'You do NOT say me when you count by 5s.', f: (x) => x % 5 !== 0 },
        n % 3 === 0 ? { s: 'You say me when you count by 3s.', f: (x) => x % 3 === 0 } : null,
      ].filter(Boolean);
      const used = [clues[0]];
      const rest = shuffle(clues.slice(1));
      const cands = () => U.range(10, maxN).filter((x) => used.every((c) => c.f(x)));
      for (const c of rest) {
        if (cands().length === 1) break;
        const before = cands().length;
        used.push(c);
        if (cands().length === before) used.pop();
      }
      if (cands().length === 1 && used.length >= 2) {
        return N(`<b>Secret number riddle</b><ul class="clues">${used.map((c) => `<li>${c.s}</li>`).join('')}</ul>What number am I?`, n, { hint: 'List the numbers that fit the first clue, then cross out the ones that break the other clues.' });
      }
    }
    return logic(1);
  }
  const ANIMOJI = ['🦊', '🐙', '🦉', '🐸', '🦔', '🐢', '🦋', '🐝'];
  function logic(d) {
    const seq = (start, f, k = 5) => { const s = [start]; for (let i = 1; i < k; i++) s.push(f(s[i - 1], i)); return s; };
    const seqQ = (s, gap, hint) => N(`What number comes ${gap === s.length - 1 ? 'next' : 'in the gap'}?<div class="seq">${s.map((v, i) => (i === gap ? BLANK : v)).join(', ')}</div>`, s[gap], { hint });
    if (d === 1) {
      const step = pick([1, 2, 3, 5, 10]);
      const s = seq(rnd(0, 40), (x) => x + step);
      return seqQ(s, 4, 'How much does it grow each time?');
    }
    if (d === 2) {
      if (chance(0.5)) return riddle(50);
      const step = pick([2, 3, 4, 5, 10]);
      if (chance(0.5)) { const s = seq(rnd(step * 5, 80), (x) => x - step); return seqQ(s, 4, 'Is it getting bigger or smaller? By how much?'); }
      const s = seq(rnd(1, 30), (x) => x + step);
      return seqQ(s, rnd(1, 3), 'Find the jump between the numbers you can see.');
    }
    if (d === 3) {
      const [A, Bm] = U.sample(ANIMOJI, 2);
      const a = rnd(2, 9), b = rnd(1, 9);
      switch (rnd(1, 3)) {
        case 1: return N(`<div class="emojieq">${A} + ${A} = ${2 * a}</div>What is ${A} worth?`, a, { hint: 'Two of the same make that number. Half of it!' });
        case 2: return N(`<div class="emojieq">${A} + ${A} + ${A} = ${3 * a}</div>What is ${A} worth?`, a, { hint: 'Three of the same. Try counting by different numbers.' });
        default: return N(`<div class="emojieq">${A} + ${A} = ${2 * a}<br>${A} + ${Bm} = ${a + b}</div>What is ${Bm} worth?`, b, { hint: `First find ${A}. Then use the second line.`, explain: `${A} = ${a}, so ${Bm} = ${a + b} − ${a} = ${b}` });
      }
    }
    if (d === 4) {
      switch (rnd(1, 3)) {
        case 1: {
          const b = [rnd(1, 15), rnd(1, 15), rnd(1, 15)], m = [b[0] + b[1], b[1] + b[2]], top = m[0] + m[1];
          const rows = [[top], m.slice(), b.slice()];
          const which = rnd(1, 3);
          let ans, ask = 'the missing number';
          if (which === 1) { ans = top; rows[0] = [null]; }
          else if (which === 2) { ans = b[0]; rows[2] = [null, b[1], b[2]]; }
          else { ans = b[2]; rows[1] = [m[0], null]; rows[2] = [b[0], b[1], null]; ask = 'the number in the bottom-right block'; }
          return N(`<b>Number pyramid:</b> each block is the sum of the two blocks under it. What is ${ask}?`, ans, { visual: V.pyramid(rows), hint: 'Two blocks side by side add up to the block above them.' });
        }
        case 2: {
          const start = rnd(1, 10);
          const s = seq(start, (x, i) => x + i);
          return seqQ(s, 4, 'Look at the jumps: they grow too!');
        }
        default: {
          if (chance(0.5)) return riddle(99);
          const s = seq(rnd(1, 6), (x) => x * 2);
          return seqQ(s, 4, 'Each number is double the one before.');
        }
      }
    }
    switch (rnd(1, 3)) {
      case 1: {
        const base = [2, 7, 6, 9, 5, 1, 4, 3, 8];
        const tr = pick([(i) => i, (i) => [6, 3, 0, 7, 4, 1, 8, 5, 2][i], (i) => [2, 1, 0, 5, 4, 3, 8, 7, 6][i], (i) => [8, 7, 6, 5, 4, 3, 2, 1, 0][i]]);
        const k = rnd(0, 5);
        const grid = U.range(0, 8).map((i) => base[tr(i)] + k);
        const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        let ask, other;
        do { [ask, other] = U.sample(U.range(0, 8), 2); } while (!LINES.some((l) => l.includes(ask) && !l.includes(other)));
        // ask = highlighted box (null), other = a second hidden box ('') to make it a real puzzle
        const shown = grid.map((v, i) => (i === ask ? null : i === other ? '' : v));
        return N(`<b>Magic square:</b> every row, column and diagonal adds up to <b>${15 + 3 * k}</b>. What goes in the <b>orange</b> box?`, grid[ask], { visual: V.magic(shown), hint: 'Find a row, column or diagonal where the orange box is the only one missing.', explain: `The missing number is ${grid[ask]}.` });
      }
      case 2: {
        const [A, Bm, Cm] = U.sample(ANIMOJI, 3);
        const a = rnd(2, 6), b = rnd(2, 9), c = rnd(1, b - 1);
        return N(`<div class="emojieq">${A} + ${A} + ${A} = ${3 * a}<br>${A} + ${Bm} = ${a + b}<br>${Bm} − ${Cm} = ${b - c}</div>What is ${Cm} worth?`, c, { hint: 'Solve one line at a time, from the top.', explain: `${A} = ${a}, ${Bm} = ${b}, ${Cm} = ${c}` });
      }
      default: {
        const a = rnd(1, 3), b = rnd(1, 4);
        const s = [a, b];
        for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]);
        return seqQ(s, 6, 'Add the two numbers before to get the next one.');
      }
    }
  }

  MQ.TOPICS = {
    add20: { name: 'Facts to 20', icon: '🧮', std: '2.OA.2', gen: add20 },
    place: { name: 'Place Value', icon: '🔢', std: '2.NBT.1–4', gen: place },
    add100: { name: 'Add to 100', icon: '➕', std: '2.NBT.5–6', gen: add100 },
    sub100: { name: 'Subtract to 100', icon: '➖', std: '2.NBT.5', gen: sub100 },
    arrays: { name: 'Odd, Even & Arrays', icon: '🔵', std: '2.OA.3–4', gen: arrays },
    time: { name: 'Telling Time', icon: '🕒', std: '2.MD.7', gen: time },
    money: { name: 'Money', icon: '🪙', std: '2.MD.8', gen: money },
    shapes: { name: 'Shapes & Fractions', icon: '🔷', std: '2.G.1–3', gen: shapes },
    measure: { name: 'Measuring', icon: '📏', std: '2.MD.1–6', gen: measure },
    data: { name: 'Graphs', icon: '📊', std: '2.MD.10', gen: data },
    big: { name: 'Add & Subtract to 1000', icon: '🏔️', std: '2.NBT.7', gen: big },
    words: { name: 'Word Problems', icon: '📖', std: '2.OA.1', gen: words },
    mult: { name: 'Multiply & Divide', icon: '✖️', std: '3.OA (ahead)', gen: mult, ahead: true },
    logic: { name: 'Patterns & Logic', icon: '🧩', std: 'Puzzles (ahead)', gen: logic, ahead: true },
  };

  Object.values(MQ.TOPICS).forEach((t) => (t.track = 'g2'));
  MQ.G = { N, C, E, BLANK, NAMES }; // shared with generators-k.js

  MQ.makeProblem = (topic, d) => {
    const p = MQ.TOPICS[topic].gen(U.clamp(d, 1, 5));
    p.topic = topic;
    p.d = d;
    return p;
  };
})();
