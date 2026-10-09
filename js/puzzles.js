// Puzzles in the style of Math Kangaroo (levels 1–2) and simpler "Joey" puzzles for kindergarten.
// Every problem has 5 answer choices (A–E in a contest). Difficulty d maps to contest points:
//   d1–2 → 3-point questions, d3 → 4-point, d4–5 → 5-point.
// All problems are original; they follow the contest's style, not its actual questions.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U, V = MQ.V;
  const { C, E } = MQ.G;
  const { rnd, pick, chance, shuffle } = U;

  const KIDS = ['Ann', 'Ben', 'Cara', 'Dan', 'Eva', 'Finn', 'Gia', 'Hugo', 'Iris', 'Jack', 'Kira', 'Liam'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Five numeric choices around the answer, smallest first (like the contest sheets).
  const N5 = (text, ans, near, o = {}) => C(text, ans, U.numChoices(ans, near, 5).sort((a, b) => a - b), o);
  const dayChoices = (ans) => U.strChoices(ans, DAYS.filter((d) => d !== ans), 5);
  const plural = (n, one, many) => (n === 1 ? one : many);

  // ---------- 1. Count the shapes ----------
  function polyomino(n, size = 4) {
    const cells = [[rnd(0, size - 1), rnd(0, size - 1)]];
    const has = (r, c) => cells.some(([a, b]) => a === r && b === c);
    while (cells.length < n) {
      const [r, c] = pick(cells), [dr, dc] = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < size && nc < size && !has(nr, nc)) cells.push([nr, nc]);
    }
    const mr = Math.min(...cells.map((x) => x[0])), mc = Math.min(...cells.map((x) => x[1]));
    return cells.map(([r, c]) => [r - mr, c - mc]);
  }
  function kg_count(d) {
    if (d === 1) {
      const n = rnd(5, 9);
      return N5('How many little squares make this shape?', n, [n - 1, n + 1, n - 2, n + 2], { visual: V.cellShape(polyomino(n)), say: 'How many little squares make this shape?', hint: 'Count row by row and touch each square.' });
    }
    // Counting puzzles by size: squares or rectangles in an r×c grid, or triangles in a fan of m parts.
    const squaresIn = (r, c) => U.sum(U.range(1, Math.min(r, c)).map((k) => (r - k + 1) * (c - k + 1)));
    const rectsIn = (r, c) => ((r * (r + 1)) / 2) * ((c * (c + 1)) / 2);
    const tasks = {
      2: [['rect', 1, 3], ['rect', 1, 4], ['rect', 3, 1], ['sq', 2, 2], ['fan', 3]],
      3: [['fan', 3], ['fan', 4], ['rect', 1, 5], ['rect', 5, 1], ['sq', 2, 3], ['sq', 3, 2], ['rect', 2, 2]],
      4: [['sq', 3, 3], ['sq', 2, 4], ['sq', 4, 2], ['fan', 5], ['rect', 1, 6], ['rect', 2, 3], ['rect', 3, 2]],
      5: [['sq', 3, 4], ['sq', 4, 3], ['sq', 4, 4], ['rect', 2, 4], ['rect', 3, 3], ['fan', 6], ['rect', 4, 2]],
    }[d];
    const [kind, r, c] = pick(tasks);
    if (kind === 'fan') {
      const ans = (r * (r + 1)) / 2;
      return N5('How many triangles are in this picture?', ans, [r, r + 1, 2 * r, ans - 1, ans + r], { visual: V.fan(r), hint: 'Count triangles made of 1 piece, then 2 pieces next to each other, and so on.', explain: `${U.range(1, r).reverse().join(' + ')} = ${ans}` });
    }
    if (kind === 'sq') {
      const ans = squaresIn(r, c), parts = U.range(1, Math.min(r, c)).map((k) => (r - k + 1) * (c - k + 1));
      return N5('How many squares of any size are in this picture?', ans, [r * c, r * c + 1, ans - 1, ans + 1, ans + 2], { visual: V.grid(r, c, '#a6e3d8'), hint: 'Count 1×1 squares, then 2×2 squares, then bigger ones. Don’t forget the big ones!', explain: parts.map((n, i) => `${n} of size ${i + 1}×${i + 1}`).join(' + ') + ` = ${ans}` });
    }
    const ans = rectsIn(r, c);
    return N5('How many rectangles of any size are in this picture? (A square counts as a rectangle too.)', ans, [r * c, r * c + r + c, ans - 1, ans + 1, ans - 2], { visual: V.grid(r, c, '#a6e3d8'), hint: r === 1 || c === 1 ? 'Count the 1-piece ones, then 2-piece, then 3-piece…' : 'Count the rectangles in one row first, then the ones that use more rows.', explain: `${(r * (r + 1)) / 2} ways to choose the rows × ${(c * (c + 1)) / 2} ways to choose the columns = ${ans}` });
  }

  // ---------- 2. Balance scales ----------
  // Neutral toy shapes (fruit would look silly: "2 melons weigh as much as 1 banana").
  const FRUIT = [['🔴', 'red ball', 'red balls'], ['🟦', 'blue block', 'blue blocks'], ['🔺', 'pyramid', 'pyramids'], ['⭐', 'star', 'stars'], ['🟡', 'yellow ball', 'yellow balls'], ['🟩', 'green block', 'green blocks']];
  function kg_balance(d) {
    const [A, B, Cc] = U.sample(FRUIT, 3);
    if (d === 1) {
      const k = rnd(2, 3), m = 2;
      return N5(`The scale is balanced. How many ${A[0]} weigh the same as ${m} ${B[0]}?`, k * m, [k, k + 1, k * m + 1, k * m - 1], { visual: V.scale(Array(k).fill(A[0]), [B[0]]), say: `${k} ${A[2]} weigh the same as one ${B[1]}. How many ${A[2]} weigh the same as ${m} ${B[2]}?`, hint: `One ${B[1]} is worth ${k} ${A[2]}. Two of them?` });
    }
    if (d === 2) {
      const k = rnd(2, 3), m = 2;
      return N5(`One ${B[0]} weighs the same as ${k} ${A[0]}. One ${Cc[0]} weighs the same as ${m} ${B[0]}. How many ${A[0]} weigh the same as one ${Cc[0]}?`, k * m, [k, m, k + m, k * m + 2], { visual: V.scale(Array(m).fill(B[0]), [Cc[0]]), say: `One ${B[1]} weighs as much as ${k} ${A[2]}. One ${Cc[1]} weighs as much as ${m} ${B[2]}. How many ${A[2]} weigh as much as one ${Cc[1]}?`, hint: `Swap each ${B[1]} for ${k} ${A[2]}.`, explain: `${m} × ${k} = ${k * m}` });
    }
    if (d === 3) {
      const a = rnd(2, 5), b = rnd(a + 1, 9);
      return N5(`<div class="emojieq">${B[0]} = ${b} kg<br>${A[0]} + ${A[0]} + ${B[0]} = ${2 * a + b} kg</div>How heavy is one ${A[0]}?`, a, [a - 1, a + 1, b, 2 * a], { say: `A ${B[1]} weighs ${b} kilograms. Two ${A[2]} and a ${B[1]} weigh ${2 * a + b} kilograms. How heavy is one ${A[1]}?`, hint: `Take away the ${B[1]} first.`, explain: `${2 * a + b} − ${b} = ${2 * a}, and half of ${2 * a} is ${a}.` });
    }
    if (d === 4) {
      const a = rnd(2, 6), b = rnd(2, 8);
      return N5(`<div class="emojieq">${A[0]} + ${B[0]} = ${a + b}<br>${A[0]} + ${A[0]} + ${B[0]} = ${2 * a + b}</div>How much is ${B[0]}?`, b, [a, a + b, b + 1, b - 1], { hint: 'Compare the two lines: what is different?', explain: `The second line has one more ${A[0]}: ${A[0]} = ${2 * a + b} − ${a + b} = ${a}, so ${B[0]} = ${a + b} − ${a} = ${b}.` });
    }
    const x = rnd(2, 8), y = rnd(2, 8), z = rnd(2, 8);
    const ask = pick([0, 1, 2]), ans = [x, y, z][ask];
    return N5(`<div class="emojieq">${A[0]} + ${B[0]} = ${x + y}<br>${B[0]} + ${Cc[0]} = ${y + z}<br>${A[0]} + ${Cc[0]} = ${x + z}</div>How much is ${[A, B, Cc][ask][0]}?`, ans, [x + y + z, ans + 1, ans - 1, ans + 2], { hint: 'Add all three lines: you get every shape twice.', explain: `All three lines together: ${2 * (x + y + z)}, so one of each = ${x + y + z}. Then subtract the line without it.` });
  }

  // ---------- 3. Who is taller? ----------
  function kg_order(d) {
    if (d === 5) {
      const [p, q, r] = U.sample(KIDS, 3), c = rnd(6, 10), b = c - rnd(1, 3), a = b + rnd(2, 4);
      return N5(`${r} is ${c} years old. ${q} is ${c - b} ${plural(c - b, 'year', 'years')} younger than ${r}. ${p} is ${a - b} years older than ${q}. How old is ${p}?`, a, [b, c, a + 1, a - 1], { hint: `First find ${q}’s age.`, explain: `${q} is ${b}, so ${p} is ${b} + ${a - b} = ${a}.` });
    }
    const n = d <= 1 ? 3 : d <= 3 ? 4 : 5;
    const kids = U.sample(KIDS, n); // kids[0] is the tallest
    const facts = shuffle(kids.slice(0, -1).map((k, i) => (chance(0.5) ? `${k} is taller than ${kids[i + 1]}.` : `${kids[i + 1]} is shorter than ${k}.`)));
    const asks = [['the tallest', 0], ['the shortest', n - 1]];
    if (d >= 3) asks.push(['the second tallest', 1]);
    if (n === 5) asks.push(['in the middle', 2]);
    const [q, idx] = pick(asks);
    const extra = n === 3 ? ['They are all the same height', 'You can’t tell'] : n === 4 ? ['You can’t tell'] : [];
    return C(`${facts.join(' ')}<br><b>Who is ${q}?</b>`, kids[idx], shuffle(kids).concat(extra), { wordy: true, hint: 'Line them up from tallest to shortest, one fact at a time.', explain: `From tallest to shortest: ${kids.join(', ')}.` });
  }

  // ---------- 4. Calendar puzzles ----------
  function kg_calendar(d) {
    const t = rnd(0, 6);
    if (d === 1) { const k = rnd(1, 3); return C(`What day comes ${k} ${plural(k, 'day', 'days')} after ${DAYS[t]}?`, DAYS[(t + k) % 7], dayChoices(DAYS[(t + k) % 7]), { hint: 'Say the days of the week in order.' }); }
    if (d === 2) { const k = pick([7, 8, 9, 14]); return C(`Today is ${DAYS[t]}. What day will it be in ${k} days?`, DAYS[(t + k) % 7], dayChoices(DAYS[(t + k) % 7]), { hint: 'In 7 days it is the same day again.', explain: `${k} days = ${Math.floor(k / 7)} week${k >= 14 ? 's' : ''} and ${k % 7} more day${k % 7 === 1 ? '' : 's'}.` }); }
    if (d === 3) { const k = pick([3, 4, 6, 8, 10, 12]); const ans = DAYS[(((t - k) % 7) + 7) % 7]; return C(`Today is ${DAYS[t]}. What day was it ${k} days ago?`, ans, dayChoices(ans), { hint: 'Count backwards. 7 days ago was the same day.' }); }
    if (d === 4) { const date = pick([8, 10, 15, 20, 22, 29]); const ans = DAYS[(t + date - 1) % 7]; return C(`The 1st of the month is a ${DAYS[t]}. What day of the week is the ${date}${date === 22 ? 'nd' : 'th'}?`, ans, dayChoices(ans), { hint: 'The 8th, 15th, 22nd and 29th are the same day as the 1st.' }); }
    const first = rnd(0, 6), target = rnd(0, 6), nth = pick([2, 3]);
    let date = 1 + ((target - first + 7) % 7) + 7 * (nth - 1);
    return N5(`The 1st of the month is a ${DAYS[first]}. What date is the ${nth === 2 ? 'second' : 'third'} ${DAYS[target]} of the month?`, date, [date - 7, date + 7, date - 1, date + 1].filter((x) => x > 0), { hint: `Find the first ${DAYS[target]}, then add 7.`, explain: `The first ${DAYS[target]} is the ${date - 7 * (nth - 1)}, so the ${nth === 2 ? 'second' : 'third'} is the ${date}.` });
  }

  // ---------- 5. Coin puzzles ----------
  const fewest = (amt, coins) => { const best = Array(amt + 1).fill(Infinity); best[0] = 0; for (let a = 1; a <= amt; a++) for (const c of coins) if (c <= a) best[a] = Math.min(best[a], best[a - c] + 1); return best[amt]; };
  const ways = (amt, coins) => { const w = Array(amt + 1).fill(0); w[0] = 1; for (const c of coins) for (let a = c; a <= amt; a++) w[a] += w[a - c]; return w[amt]; };
  function kg_coins(d) {
    if (d <= 2) {
      const coins = d === 1 ? pick([[1, 2, 5], [1, 3, 5], [1, 2, 4]]) : pick([[1, 2, 5, 10], [1, 3, 5, 10], [2, 5, 10]]);
      const amt = d === 1 ? rnd(6, 15) : rnd(13, 29), ans = fewest(amt, coins);
      if (ans === Infinity) return kg_coins(d);
      return N5(`Kanga has lots of ${coins.map((c) => c + '¢').join(', ')} coins. What is the <b>fewest</b> coins she needs to pay exactly ${amt}¢?`, ans, [ans + 1, ans + 2, ans - 1], { hint: 'Use the biggest coins you can first.' });
    }
    if (d === 3) {
      const set = U.sample([1, 2, 3, 5, 10, 20], 3).sort((a, b) => a - b);
      const sums = new Set();
      for (let m = 1; m < 8; m++) sums.add(set.reduce((s, c, i) => s + (m & (1 << i) ? c : 0), 0));
      return N5(`Joey has three coins: ${set.map((c) => c + '¢').join(', ')}. How many different amounts can he pay exactly using one or more of them?`, sums.size, [3, 6, 8, 9], { hint: 'List them: each coin alone, two coins, all three.', explain: `${[...sums].sort((a, b) => a - b).join('¢, ')}¢ — that is ${sums.size} amounts.` });
    }
    const coins = d === 4 ? pick([[2, 5], [2, 3], [3, 5]]) : pick([[1, 2, 5], [1, 5, 10]]);
    let amt, ans;
    do { amt = d === 4 ? rnd(10, 24) : rnd(5, 14); ans = ways(amt, coins); } while (ans < 2 || ans > 15);
    return N5(`In how many different ways can you pay ${amt}¢ using only ${coins.map((c) => c + '¢').join(' and ')} coins? (The order of the coins does not matter.)`, ans, [ans - 1, ans + 1, ans + 2], { hint: `Try using 0 five-cent coins, then 1, then 2…`, explain: `There are ${ans} ways.` });
  }

  // ---------- 6. Paths on a grid ----------
  const choose = (n, k) => (k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k);
  function kg_paths(d) {
    if (d === 1) { const r = rnd(1, 3), c = rnd(2, 4); return N5('A bug walks along the lines from A to B. How many sides of little squares long is the shortest way?', r + c, [r * c, r + c + 1, r + c - 1, r + c + 2], { visual: V.pathGrid(r, c), hint: 'It must go up and to the right. Count each.' }); }
    const [r, c] = pick({
      2: [[1, 2], [2, 1], [1, 3], [3, 1], [1, 4]],
      3: [[2, 2], [1, 5], [5, 1], [1, 6], [6, 1]],
      4: [[2, 3], [3, 2], [1, 7], [2, 4]],
      5: [[3, 3], [4, 2], [2, 5], [3, 4], [4, 3]],
    }[d]);
    const ans = choose(r + c, r);
    return N5('The bug walks from A to B along the lines and only goes <b>up</b> or <b>right</b>. How many different ways can it go?', ans, [ans - 1, ans + 1, ans + 2, r * c, r + c].filter((x) => x !== ans), { visual: V.pathGrid(r, c), hint: 'At every corner, write how many ways lead there: add the ways from the left and from below.', explain: `Writing the number of ways at each corner gives ${ans} at B.` });
  }

  // ---------- 7. Flip and turn ----------
  const normCells = (cs) => { const mr = Math.min(...cs.map((x) => x[0])), mc = Math.min(...cs.map((x) => x[1])); return cs.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const keyOf = (cs) => normCells(cs).map((x) => x.join('-')).join(',');
  const flip = (cs) => { const m = Math.max(...cs.map((x) => x[1])); return cs.map(([r, c]) => [r, m - c]); };
  const turn = (cs) => { const m = Math.max(...cs.map((x) => x[0])); return cs.map(([r, c]) => [c, m - r]); }; // quarter turn clockwise
  function kg_mirror(d) {
    let cells, all;
    do {
      cells = polyomino(d <= 2 ? 4 : 5, 3);
      all = [];
      let t = cells;
      for (let i = 0; i < 4; i++) { all.push(t); all.push(flip(t)); t = turn(t); }
    } while (new Set(all.map(keyOf)).size < 8); // only shapes without any symmetry
    const tasks = [
      ['It is flipped over the dotted line, like in a mirror. What does it look like?', flip(cells), 'right'],
      ['It is turned a quarter turn clockwise (↻). What does it look like?', turn(cells), null],
      ['It is turned upside down (a half turn). What does it look like?', turn(turn(cells)), null],
      ['It is flipped over the dotted line and then turned a half turn. What does it look like?', turn(turn(flip(cells))), 'right'],
    ];
    const [q, target, line] = tasks[d <= 2 ? 0 : d === 3 ? 1 : d === 4 ? pick([1, 2]) : pick([2, 3])];
    const others = all.filter((x) => keyOf(x) !== keyOf(target));
    const opts = shuffle([target, ...U.sample(others.filter((x, i, a) => a.findIndex((y) => keyOf(y) === keyOf(x)) === i), 4)]);
    const values = opts.map((_, i) => 'picture ' + (i + 1));
    return C(`Here is a shape. ${q}`, values[opts.indexOf(target)], values, { visual: V.cellShape(cells, { line, fill: '#ffb547' }), choiceHtml: opts.map((o) => V.cellShape(normCells(o), { size: 18, fill: '#ffb547' })), say: `Here is a shape. ${q.replace('(↻)', '')}`, hint: line ? 'In a mirror, left and right swap places.' : 'Imagine turning the page.' });
  }

  // ---------- 8. Cube towers ----------
  function kg_cubes(d) {
    if (d <= 2) {
      const back = Array.from({ length: d === 1 ? 3 : 4 }, () => rnd(1, d === 1 ? 3 : 4)), ans = U.sum(back);
      return N5('How many cubes are in these towers?', ans, [ans - 1, ans + 1, ans + 2, ans - 2], { visual: V.towers(back), say: 'How many cubes are in these towers?', hint: 'Count each tower, then add.' });
    }
    const cols = d === 3 ? 2 : 3;
    const back = Array.from({ length: cols }, () => rnd(2, 4));
    const front = back.map((h) => rnd(1, h - 1));
    const ans = U.sum(back) + U.sum(front);
    if (d === 5) { // how many more cubes to fill every tower up to the tallest one
      const top = Math.max(...back), need = top * cols * 2 - ans;
      return N5(`These cubes stand in 2 rows. Every cube is on the table or on another cube. How many more cubes are needed so that <b>every</b> tower is ${top} cubes tall?`, need, [need - 1, need + 1, need + 2, ans], { visual: V.towers(back, front), hint: `First count the cubes. A full block would have ${top} × ${cols * 2} cubes.`, explain: `There are ${ans} cubes. ${cols * 2} towers of ${top} = ${top * cols * 2}. ${top * cols * 2} − ${ans} = ${need}.` });
    }
    return N5('These cubes stand in 2 rows. Every cube is on the table or on another cube. How many cubes are there?', ans, [ans - 1, ans + 1, ans + 2, ans - 2], { visual: V.towers(back, front), hint: 'Count the back row and the front row separately. Some back cubes are hidden!', explain: `Back row: ${back.join(' + ')} = ${U.sum(back)}. Front row: ${front.join(' + ')} = ${U.sum(front)}. Total: ${ans}.` });
  }

  // ---------- 9. What comes next? ----------
  function kg_pattern(d) {
    let seq, hint;
    if (d === 1) { const k = pick([2, 3, 5, 10]), s = rnd(1, 10); seq = U.range(0, 4).map((i) => s + i * k); hint = 'How much does it grow each time?'; }
    else if (d === 2) {
      if (chance(0.5)) { const a = rnd(1, 4), b = rnd(a + 1, 6), s = rnd(1, 10); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : b)); hint = `The jumps take turns: +${a}, +${b}, +${a}…`; }
      else { const st = rnd(0, 2); seq = [1, 3, 6, 10, 15, 21, 28].slice(st, st + 5); hint = 'Look at the jumps: they grow by one each time.'; }
    }
    else if (d === 3) { const s = rnd(1, 9), j = rnd(1, 3); seq = [s]; for (let i = 0; i < 4; i++) seq.push(seq[i] + j + i); hint = `The jumps are +${j}, +${j + 1}, +${j + 2}…`; }
    else if (d === 4) {
      const k = rnd(1, 3);
      seq = pick([[1, 4, 9, 16, 25, 36, 49].slice(k - 1, k + 4), [1, 2, 4, 8, 16, 32, 64].slice(k - 1, k + 4), [1, 3, 7, 15, 31], [2, 5, 4, 7, 6, 9], [3, 4, 6, 9, 13, 18], [20, 18, 15, 11, 6]]);
      hint = 'Compare each number with the one before it.';
    }
    else { seq = pick([[1, 1, 2, 3, 5, 8], [2, 3, 5, 8, 13, 21], [1, 3, 4, 7, 11, 18]]).slice(0, 6); hint = 'Each number comes from the two numbers before it.'; }
    const ans = seq[seq.length - 1], shown = seq.slice(0, -1);
    return N5(`What number comes next?<div class="seq">${shown.join(', ')}, <span class="blank">?</span></div>`, ans, [ans - 1, ans + 1, ans + 2, ans - 2, shown[shown.length - 1] + (shown[shown.length - 1] - shown[shown.length - 2])].filter((x) => x !== ans && x > 0), { hint, say: `What number comes next? ${shown.join(', ')}` });
  }

  // ---------- 10. Hidden digits ----------
  function kg_digits(d) {
    for (let tries = 0; tries < 200; tries++) {
      if (d === 1) { const x = rnd(2, 9); return N5(E(`? + ? = ${2 * x}`) + '<p>Both boxes hide the <b>same</b> number. What is it?</p>', x, [x - 1, x + 1, 2 * x, x + 2], { hint: 'Which number plus itself makes it?' }); }
      if (d === 2 || d === 3) {
        const add = d === 2;
        const a = rnd(2, 8), b = rnd(0, 9), x = rnd(0, 9), y = rnd(1, 9);
        const X = 10 * a + x, Y = 10 * y + b, S = add ? X + Y : X - Y;
        if (S < 10 || S > 99) continue;
        let sols = 0;
        for (let p = 0; p < 10; p++) for (let q = 1; q < 10; q++) if ((add ? 10 * a + p + 10 * q + b : 10 * a + p - 10 * q - b) === S) sols++;
        if (sols !== 1) continue;
        return N5(`<div class="eqline">${a}<span class="blank">?</span> ${add ? '+' : '−'} <span class="blank">?</span>${b} = ${S}</div>Each box hides one digit. What do the two hidden digits add up to?`, x + y, [x + y - 1, x + y + 1, x + y + 2, x, y].filter((v) => v !== x + y), { hint: add ? 'Start with the ones place.' : 'Check the ones place first: do you need to borrow?', explain: `${X} ${add ? '+' : '−'} ${Y} = ${S}, so the digits are ${x} and ${y}: ${x} + ${y} = ${x + y}.` });
      }
      const A = rnd(101, 499), B = rnd(101, 499), S = A + B;
      const ia = rnd(0, 2), ib = rnd(0, 2), is = rnd(0, 2);
      const hide = (n, i) => String(n).split('').map((c, k) => (k === i ? '<span class="blank">?</span>' : c)).join('');
      const dig = (n, i) => +String(n)[i];
      let sols = 0;
      for (let p = 0; p < 10; p++) for (let q = 0; q < 10; q++) for (let r = 0; r < 10; r++) {
        const set = (n, i, v) => +String(n).split('').map((c, k) => (k === i ? v : c)).join('');
        if ((ia === 0 && p === 0) || (ib === 0 && q === 0) || (is === 0 && r === 0)) continue;
        if (set(A, ia, p) + set(B, ib, q) === set(S, is, r)) sols++;
      }
      if (sols !== 1) continue;
      const ans = dig(A, ia) + dig(B, ib) + dig(S, is);
      return N5(`<div class="column-inline">${hide(A, ia)} + ${hide(B, ib)} = ${hide(S, is)}</div>Each box hides one digit. What do the three hidden digits add up to?`, ans, [ans - 1, ans + 1, ans + 2, ans - 2], { hint: 'Work one place at a time, starting with the ones.', explain: `${A} + ${B} = ${S}. Hidden digits: ${dig(A, ia)}, ${dig(B, ib)}, ${dig(S, is)} → ${ans}.` });
    }
    return kg_digits(1);
  }

  // ---------- 11. Age puzzles ----------
  function kg_age(d) {
    const [p, q] = U.sample(KIDS, 2);
    if (d === 1) { const a = rnd(4, 9), k = rnd(2, 5); return N5(`${p} is ${a} years old. How old will ${p} be in ${k} years?`, a + k, [a, k, a + k + 1, a + k - 1], { hint: 'Count on from today’s age.' }); }
    if (d === 2) { const a = rnd(6, 10), b = rnd(2, a - 2); return N5(`${p} is ${a} and ${q} is ${b}. How old will ${p} be when ${q} is ${a}?`, 2 * a - b, [a, a + b, 2 * a - b + 1, 2 * a - b - 1], { hint: `${p} is always ${a - b} years older.`, explain: `${a} − ${b} = ${a - b} years apart, so ${a} + ${a - b} = ${2 * a - b}.` }); }
    if (d === 3) { const b = rnd(3, 9), diff = rnd(1, 4), a = b + diff; return N5(`Together ${p} and ${q} are ${a + b} years old. ${p} is ${diff} ${plural(diff, 'year', 'years')} older than ${q}. How old is ${q}?`, b, [a, b + 1, b - 1, a + b - diff].filter((x) => x !== b), { hint: `Take away the ${diff} extra years first, then share equally.`, explain: `${a + b} − ${diff} = ${2 * b}, half is ${b}.` }); }
    if (d === 4) {
      let s, x, dad;
      do { s = rnd(4, 9); x = rnd(1, 6); dad = 3 * (s + x) - x; } while (dad < 25 || dad > 45);
      return N5(`Dad is ${dad} and his daughter is ${s}. In how many years will Dad be exactly 3 times as old as his daughter?`, x, [x - 1, x + 1, x + 2, x + 3].filter((v) => v > 0), { hint: 'Try 1 year, 2 years, 3 years… and check.', explain: `In ${x} years: Dad ${dad + x}, daughter ${s + x}, and ${dad + x} = 3 × ${s + x}.` });
    }
    const n = rnd(3, 4), sum = rnd(12, 24), k = rnd(2, 5);
    return N5(`The ages of ${n} brothers and sisters add up to ${sum} today. What will their ages add up to in ${k} years?`, sum + n * k, [sum + k, sum + n * k - k, sum + n * k + k, sum + n].filter((v) => v !== sum + n * k), { hint: `Every one of them gets ${k} years older.`, explain: `${sum} + ${n} × ${k} = ${sum + n * k}` });
  }

  // ---------- 12. Kangaroo classics: an original hand-written bank ----------
  // [tier, question, answer, choices, explanation, joey?]
  const BANK = [
    [3, 'A spider has 8 legs and a beetle has 6 legs. How many legs do 2 spiders and 1 beetle have together?', 22, [14, 20, 22, 24, 30], '8 + 8 + 6 = 22'],
    [3, 'Kanga hops 3 steps forward and then 1 step back. She does this 3 times. How far is she from the start?', 6, [3, 4, 6, 8, 9], 'Each time she gets 2 steps further: 2 + 2 + 2 = 6'],
    [3, 'A ribbon is cut into 5 pieces. How many cuts were made?', 4, [3, 4, 5, 6, 10], 'Each cut makes one more piece: 1 piece + 4 cuts = 5 pieces'],
    [3, 'A house number has two digits. Both digits are the same and they add up to 8. What is the number?', 44, [26, 35, 44, 53, 80], '4 + 4 = 8'],
    [3, 'A cat sleeps 14 hours a day. How many hours a day is it awake?', 10, [8, 10, 12, 14, 24], 'A day has 24 hours: 24 − 14 = 10'],
    [3, 'Which number is between 38 and 44 and is even?', 42, [37, 39, 41, 42, 45], 'Only 42 is even and between 38 and 44'],
    [3, 'A tricycle has 3 wheels. How many wheels do 4 tricycles have?', 12, [7, 9, 10, 12, 16], '3 + 3 + 3 + 3 = 12'],
    [3, 'Five birds sit on a fence. Each bird has 2 legs. How many legs are on the fence?', 10, [5, 7, 10, 12, 15], '2 + 2 + 2 + 2 + 2 = 10'],
    [4, 'In a row of children, Ella is 4th from the left and 3rd from the right. How many children are in the row?', 6, [5, 6, 7, 8, 9], '3 children to her left, Ella, 2 to her right: 3 + 1 + 2 = 6'],
    [4, 'A frog climbs a 10-step ladder. Every minute it climbs 3 steps and then slips back 1. In which minute does it first reach the top?', 5, [3, 4, 5, 6, 10], 'After 4 minutes it is on step 8. In minute 5 it climbs to step 11, past the top.'],
    [4, 'The pages of a book are numbered 1 to 20. How many times is the digit 1 printed?', 12, [10, 11, 12, 13, 20], '1, 10, 11 (twice), 12 to 19 → 1 + 1 + 2 + 8 = 12'],
    [4, 'Four friends meet. Each friend shakes hands with every other friend once. How many handshakes are there?', 6, [4, 6, 8, 12, 16], 'The first shakes 3 hands, the next 2 new ones, then 1: 3 + 2 + 1 = 6'],
    [4, 'A drawer has 5 red and 5 blue socks. In the dark, how many socks must you take to be sure you have two of the same color?', 3, [2, 3, 5, 6, 10], 'With 2 socks you might get one of each. The 3rd sock always matches one of them.'],
    [4, 'I think of a number. I add 5, then take away 3, and get 10. What was my number?', 8, [6, 7, 8, 12, 18], 'Work backwards: 10 + 3 = 13, 13 − 5 = 8'],
    [4, 'Tom has more marbles than Ann but fewer than Lee. Kim has more than Lee. Who has the fewest marbles?', 'Ann', ['Tom', 'Ann', 'Lee', 'Kim', 'You can’t tell'], 'From most to fewest: Kim, Lee, Tom, Ann'],
    [4, 'The sum of two numbers is 15. One number is 3 more than the other. What is the bigger number?', 9, [6, 7, 8, 9, 12], '6 and 9: 6 + 9 = 15 and 9 is 3 more than 6'],
    [4, 'A bus has 30 seats. 17 people are sitting. At a stop, 8 get off and 12 get on. How many seats are empty now?', 9, [5, 9, 12, 17, 21], '17 − 8 + 12 = 21 people, 30 − 21 = 9 empty seats'],
    [4, 'How many two-digit numbers have digits that add up to 3?', 3, [2, 3, 4, 5, 6], '12, 21 and 30'],
    [5, 'A snail is at the bottom of a 5-foot wall. Each day it climbs up 3 feet, and each night it slides down 2 feet. On which day does it reach the top?', 3, [2, 3, 4, 5, 6], 'End of night 1: 1 foot. Night 2: 2 feet. On day 3 it climbs to 5 feet — the top.'],
    [5, 'Using three of the digits 1, 4, 7, 9 (each once), what is the biggest even 3-digit number you can make?', 974, [794, 914, 947, 974, 749], 'An even number must end in 4. The biggest is 974.'],
    [5, 'In a family, each of the 3 brothers has 2 sisters. How many children are in the family?', 5, [5, 6, 8, 9, 12], 'All brothers share the same 2 sisters: 3 + 2 = 5'],
    [5, 'A box has 3 red, 4 green and 5 yellow balls. Without looking, how many balls must you take to be sure to get 2 of the same color?', 4, [2, 3, 4, 5, 6], 'You could get 3 different colors first. The 4th ball always matches one.'],
    [5, 'The year 2026 has digits that add up to 10. What is the next year whose digits also add up to 10?', 2035, [2035, 2044, 2053, 2062, 2107], '2 + 0 + 3 + 5 = 10, and no year from 2027 to 2034 works'],
    [5, 'Ann, Bea and Cal each have a different pet: a cat, a dog and a fish. Ann does not have the cat. Bea has the fish. Who has the cat?', 'Cal', ['Ann', 'Bea', 'Cal', 'Nobody', 'You can’t tell'], 'Bea has the fish, Ann not the cat, so Cal has the cat.'],
    [5, 'A rope ladder has 10 rungs, 30 cm apart. How far is it from the first rung to the last?', 270, [240, 270, 300, 330, 360], '10 rungs have 9 gaps: 9 × 30 = 270'],
    [5, 'Lily writes all the numbers from 1 to 30. How many times does she write the digit 2?', 13, [3, 10, 12, 13, 14], '2, 12, 20–29 (22 has two 2s): 1 + 1 + 10 + 1 = 13'],
    [5, 'Half of a number is 3 more than 4. What is the number?', 14, [7, 10, 12, 14, 16], 'Half is 7, so the number is 14'],
    [5, 'Mom is 30 and her son is 6. In how many years will Mom be exactly 3 times as old as her son?', 6, [2, 3, 4, 6, 8], 'In 6 years: 36 and 12, and 36 = 3 × 12'],
    [5, 'In a yard there are chickens and rabbits: 5 heads and 14 legs. How many rabbits are there?', 2, [1, 2, 3, 4, 5], 'If all 5 were chickens: 10 legs. Each rabbit adds 2 more legs: 14 − 10 = 4, so 2 rabbits.'],
    [3, 'How many fingers are on 3 hands?', 15, [10, 13, 15, 20, 30], '5 + 5 + 5 = 15', true],
    [3, 'Today is Monday. What day was it yesterday?', 'Sunday', ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'], 'The day before Monday is Sunday', true],
    [3, 'Ben is 6. His sister is 2 years older. How old is his sister?', 8, [4, 6, 7, 8, 10], '6 + 2 = 8', true],
    [3, 'Which animal is third in line? 🐶 🐱 🐰 🐸 🐵', '🐰', ['🐶', '🐱', '🐰', '🐸', '🐵'], 'Count from the left: dog, cat, bunny', true],
    [3, 'How many ears do 3 bunnies have? 🐰🐰🐰', 6, [3, 5, 6, 8, 9], '2 + 2 + 2 = 6', true],
    [3, 'Two chickens 🐔🐔 have 2 legs each. How many legs in all?', 4, [2, 3, 4, 6, 8], '2 + 2 = 4', true],
    [3, 'Which one is different? 🍎 🍎 🍌 🍎 🍎', '🍌', ['🍎', '🍌', '🍇', '🍐', '🍓'], 'All the others are apples', true],
    [3, 'Mia has 2 red balloons and 3 blue balloons. One balloon pops. How many balloons does she have now?', 4, [1, 3, 4, 5, 6], '2 + 3 = 5, then 5 − 1 = 4', true],
    [3, 'A ladybug has 6 legs. How many legs do 2 ladybugs have? 🐞🐞', 12, [6, 8, 10, 12, 14], '6 + 6 = 12', true],
    [3, 'There are 4 cookies 🍪🍪🍪🍪. Three friends each eat one. How many are left?', 1, [0, 1, 2, 3, 4], '4 − 3 = 1', true],
  ];
  const fromBank = (it) => {
    const [, q, a, opts, ex] = it;
    const sorted = typeof a === 'number' ? opts.slice().sort((x, y) => x - y) : opts;
    return C(q, a, sorted, { explain: ex, wordy: true, hint: 'Read it again slowly. Draw a little picture if it helps.', say: q.replace(/\p{Extended_Pictographic}|️/gu, '') });
  };
  function kg_bank(d) {
    const tier = d <= 2 ? 3 : d === 3 ? 4 : 5;
    return fromBank(pick(BANK.filter((b) => b[0] === tier && !b[5])));
  }
  // Joey puzzles (kindergarten): picture bank plus the easiest generated puzzles.
  function kg_joey(d) {
    if (chance(0.45)) return fromBank(pick(BANK.filter((b) => b[5])));
    return pick([kg_count, kg_balance, kg_cubes, kg_mirror, kg_pattern])(1);
  }

  const T = (name, icon, gen) => ({ name, icon, std: 'Math Kangaroo style', gen, track: 'prep', kangaroo: true });
  Object.assign(MQ.TOPICS, {
    kg_count: T('Count the shapes', '🔺', kg_count),
    kg_balance: T('Balance scales', '⚖️', kg_balance),
    kg_order: T('Who is taller?', '📏', kg_order),
    kg_calendar: T('Calendar puzzles', '📅', kg_calendar),
    kg_coins: T('Coin puzzles', '🪙', kg_coins),
    kg_paths: T('Paths on a grid', '🧭', kg_paths),
    kg_mirror: T('Flip and turn', '🪞', kg_mirror),
    kg_cubes: T('Cube towers', '🧊', kg_cubes),
    kg_pattern: T('What comes next?', '🔢', kg_pattern),
    kg_digits: T('Hidden digits', '🕵️', kg_digits),
    kg_age: T('Age puzzles', '🎂', kg_age),
    kg_bank: T('Kangaroo classics', '🦘', kg_bank),
    kg_joey: Object.assign(T('Joey puzzles', '🐣', kg_joey), { std: 'Puzzles for K' }),
  });
  MQ.KANGAROO_TOPICS = ['kg_count', 'kg_balance', 'kg_order', 'kg_calendar', 'kg_coins', 'kg_paths', 'kg_mirror', 'kg_cubes', 'kg_pattern', 'kg_digits', 'kg_age', 'kg_bank'];
  MQ.KANGAROO_BANK = BANK;
})();
