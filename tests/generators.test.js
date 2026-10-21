// Run: node tests/generators.test.js
// Generates thousands of problems for every topic and difficulty and checks they are well-formed.
const path = require('path');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'puzzles', 'cogat', 'logic', 'content', 'content-k']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;

const RUNS = 1200;
let failures = 0;
const fail = (topic, d, msg, p) => {
  failures++;
  if (failures <= 25) console.error(`✗ ${topic} d${d}: ${msg}\n   ${JSON.stringify({ text: p && p.text, answer: p && p.answer, choices: p && p.choices }).slice(0, 400)}`);
};

for (const topic of Object.keys(MQ.TOPICS)) {
  for (let d = 1; d <= 5; d++) {
    const seen = new Set(), questions = new Set();
    for (let i = 0; i < RUNS; i++) {
      let p;
      try {
        p = MQ.makeProblem(topic, d);
      } catch (e) {
        fail(topic, d, 'threw ' + e.stack.split('\n').slice(0, 3).join(' | '));
        continue;
      }
      const blob = [p.text, p.visual || '', p.hint || '', p.explain || '', (p.choices || []).join('|')].join(' ');
      if (/NaN|undefined|null|Infinity|\[object/.test(blob)) fail(topic, d, 'bad token in text', p);
      if (!p.text) fail(topic, d, 'empty text', p);
      if (p.kind === 'num') {
        if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer > 9999) fail(topic, d, 'answer not a whole number 0..9999', p);
      } else if (p.kind === 'choice') {
        const maxChoices = MQ.TOPICS[topic].kangaroo || MQ.TOPICS[topic].logic ? 5 : 4; // contest puzzles always have A–E, CogAT always 4, logic up to 5 names
        if (!Array.isArray(p.choices) || p.choices.length < 2 || p.choices.length > maxChoices || (MQ.TOPICS[topic].kangaroo && p.choices.length !== 5) || (MQ.TOPICS[topic].cogat && p.choices.length !== 4)) fail(topic, d, 'choice count', p);
        else if (!p.choices.includes(p.answer)) fail(topic, d, 'answer missing from choices', p);
        else if (new Set(p.choices).size !== p.choices.length) fail(topic, d, 'duplicate choices', p);
      } else if (p.kind === 'multi') {
        if (!Array.isArray(p.choices) || p.choices.length < 3 || p.choices.length > 6) fail(topic, d, 'multi: choice count', p);
        else if (new Set(p.choices).size !== p.choices.length) fail(topic, d, 'multi: duplicate choices', p);
        else if (!Array.isArray(p.answer) || !p.answer.length || p.answer.length === p.choices.length) fail(topic, d, 'multi: needs some right and some wrong choices', p);
        else if (!p.answer.every((a) => p.choices.includes(a))) fail(topic, d, 'multi: answer not among choices', p);
        else if (p.choiceHtml && p.choiceHtml.length !== p.choices.length) fail(topic, d, 'multi: pictures do not match choices', p);
      } else if (p.kind === 'order') {
        if (!Array.isArray(p.items) || p.items.length < 3 || p.items.length > 5) fail(topic, d, 'order: item count', p);
        else if (new Set(p.items).size !== p.items.length) fail(topic, d, 'order: duplicate items', p);
        else if ([...p.items].sort().join('|') !== [...p.answer].sort().join('|')) fail(topic, d, 'order: answer is not the same items', p);
        else if (p.items.join('|') === p.answer.join('|')) fail(topic, d, 'order: items already in order', p);
      } else if (p.kind === 'line') {
        const l = p.line;
        if (!l || !(l.min < l.max) || !Number.isInteger(p.answer) || p.answer < l.min || p.answer > l.max || (p.answer - l.min) % l.step) fail(topic, d, 'line: answer not on a tick', p);
      } else fail(topic, d, 'unknown kind', p);
      seen.add(p.text + (p.visual || '') + (p.choices || p.items || []).join('|'));
      questions.add(p.text + (p.visual || ''));
    }
    // Picture puzzles have fewer possible layouts; still, a contest must never feel repetitive.
    const minDistinct = MQ.TOPICS[topic].kangaroo || MQ.TOPICS[topic].cogat ? 5 : 8;
    if (MQ.TOPICS[topic].logic && !MQ.TOPICS[topic].desc) fail(topic, d, 'logic topic without a description');
    if (seen.size < minDistinct) fail(topic, d, `only ${seen.size} distinct problems`);
    // Test prep is taken again and again: every level needs plenty of different questions (answer order aside).
    // The hand-written sets (sentence questions, puzzle bank) have 20 per level.
    if (MQ.TOPICS[topic].track === 'prep' && questions.size < (['cg_sentence', 'kg_bank'].includes(topic) ? 20 : 25)) fail(topic, d, `only ${questions.size} different questions for retakes`);
  }
}

// Spot-check some answers with independent math.
for (let i = 0; i < 2000; i++) {
  const p = MQ.makeProblem('add20', 2);
  const m = p.text.match(/(\d+) ([+−]) (\d+)/);
  const v = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
  if (v !== p.answer) fail('add20', 2, 'wrong arithmetic', p);
  if (v > 20 || v < 0) fail('add20', 2, 'out of range', p);
}
for (let i = 0; i < 2000; i++) {
  const p = MQ.makeProblem('mult', 3);
  const m = p.text.match(/(\d+) × (\d+)/);
  if (+m[1] * +m[2] !== p.answer) fail('mult', 3, 'wrong product', p);
}

// Class strategy kinds (number names, bills, arrows, number bonds, the place value chart, tape diagrams):
// every kind at every level it supports is well-formed and its answer is right by independent math.
const U = MQ.U;
const W = {};
for (let n = 0; n <= 1000; n++) W[U.words(n)] = n;
const wordsOk = { 7: 'seven', 15: 'fifteen', 40: 'forty', 92: 'ninety-two', 100: 'one hundred', 407: 'four hundred seven', 470: 'four hundred seventy', 999: 'nine hundred ninety-nine', 1000: 'one thousand' };
for (const [n, w] of Object.entries(wordsOk)) if (U.words(+n) !== w) fail('words', 0, `U.words(${n}) = ${U.words(+n)}`);
const strip = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/ ([.,:])/g, '$1').replace(/([a-z0-9]) \?$/i, '$1?');
// The value of a number written any way a 2nd grader meets it: 342, 3 hundreds 4 tens 2 ones, 34 tens 2 ones, 300 + 40 + 2, three hundred forty-two.
const valueOf = (s) => {
  s = s.trim();
  if (W[s] !== undefined) return W[s];
  if (/^\d+( \+ \d+)*$/.test(s)) return s.split(' + ').reduce((a, b) => a + +b, 0);
  let v = 0, rest = s.replace(/(\d+) (hundred|ten|one)s?/g, (_, k, u) => { v += +k * { hundred: 100, ten: 10, one: 1 }[u]; return ''; });
  return rest.trim() ? NaN : v;
};
const arrowsOf = (html) => { // [start, [op, to|null]…] from V.arrows
  const nums = [...html.matchAll(/class="anum[^"]*">([^<]*)</g)].map((m) => m[1]), ops = [...html.matchAll(/<small>([^<]*)</g)].map((m) => m[1].replace('−', '-'));
  return { start: +nums[0], steps: ops.map((op, i) => ({ op, to: nums[i + 1] === '?' ? null : +nums[i + 1] })) };
};
// Read a picture the way a child does: the clock's hands, the arrow on a number line.
const clockTime = (html) => {
  const hands = [...html.matchAll(/<line x1="100" y1="100" x2="([\d.]+)" y2="([\d.]+)" stroke="[^"]+" stroke-width="([\d.]+)"/g)].map((x) => ({ deg: ((Math.atan2(+x[1] - 100, 100 - +x[2]) * 180) / Math.PI + 360) % 360, w: +x[3] }));
  const min = Math.round(hands.find((h) => h.w < 6).deg / 6) % 60;
  return [Math.round((hands.find((h) => h.w >= 6).deg - min / 2) / 30) % 12 || 12, min];
};
const arrowAt = (html) => {
  const [, lo, hi] = html.match(/number line from (\d+) to (\d+)/).map(Number);
  const ticks = [...html.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)" y2="[\d.]+" stroke="#22304f"/g)].filter((x) => x[1] === x[2]).map((x) => +x[1]);
  const x0 = Math.min(...ticks), x1 = Math.max(...ticks), mk = +html.match(/<line x1="([\d.]+)" y1="[\d.]+" x2="[\d.]+" y2="[\d.]+" stroke="#ff6b5b"/)[1];
  return { value: lo + Math.round(((mk - x0) / (x1 - x0)) * (hi - lo)), step: (hi - lo) / (ticks.length - 1) };
};
const CENTS = { quarter: 25, dime: 10, nickel: 5, penny: 1 }, DOLLARS = { twenty: 20, ten: 10, five: 5, one: 1 };
const coinsIn = (s) => [...s.matchAll(/(\d+) (quarter|dime|nickel|penn)(?:s|ies|y)?\b/g)].reduce((a, x) => a + +x[1] * CENTS[x[2] === 'penn' ? 'penny' : x[2]], 0);
const billsIn = (s) => [...s.matchAll(/(\d+) (twenty|ten|five|one)-dollar bills?/g)].reduce((a, x) => a + +x[1] * DOLLARS[x[2]], 0);
const SIZE = { centimeter: 1, inch: 2.54, foot: 30.48, yard: 91.44, meter: 100 };
const one = (u) => ({ feet: 'foot', inches: 'inch' }[u] || u.replace(/s$/, ''));
const many = (n, u) => (n === 1 ? u : { foot: 'feet', inch: 'inches' }[u] || u + 's');
const minutesOf = (s) => [...s.matchAll(/(\d+):(\d\d) (a|p)\.m\./g)].map((x) => ((+x[1] % 12) + (x[3] === 'p' ? 12 : 0)) * 60 + +x[2]);
const PARTS = { 1: ['whole', 'wholes'], 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'] };
const QUAD = { '4 equal sides and 4 square corners': 'square', '4 square corners, but its sides are not all equal': 'rectangle', '4 equal sides, but no square corners': 'rhombus', '4 sides and exactly 1 pair of parallel sides': 'trapezoid' };
const ANG = { triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, quadrilateral: 4, pentagon: 5, hexagon: 6 };
// Kinds from Modules 2 and 5–8: each check returns false when it does not recognize the question.
const CHECKS = {
  big_check: (t, p, ok) => {
    let m;
    if ((m = t.match(/^If (\d+) − (\d+) = (\d+), then (\d+) \+ (\d+) = \?$/))) return ok(+m[1] - +m[2] === +m[3] && +m[4] + +m[5] === p.answer && p.answer === +m[1], 'add back');
    if ((m = t.match(/^Which addition checks (\d+) − (\d+) = (\d+)\?$/))) { const [x, y, z] = p.answer.replace(/,/g, '').match(/\d+/g).map(Number); return ok(x + y === z && z === +m[1] && x === +m[3] && y === +m[2], 'which addition'); }
    if ((m = t.match(/says (\d+) − (\d+) = (\d+)\. Is that right/))) return ok((+m[1] - +m[2] === +m[3] ? 'Yes' : 'No') === p.answer, 'is it right');
    return false;
  },
  len_about: (t, p, ok) => {
    let m;
    const B = MQ.BENCHMARKS;
    if ((m = t.match(/^(.+) is about (\d+) ___\. Which unit fits\?$/))) { const e = B.find(([th, n]) => th.toLowerCase() === m[1].toLowerCase() && n === +m[2]); return ok(e && p.answer === many(e[1], e[2]), 'unit that fits'); }
    if ((m = t.match(/^About how long is (.+)\?$/))) { const right = B.filter(([th]) => th === m[1]).map(([, n, u]) => `${n} ${many(n, u)}`); return ok(right.includes(p.answer) && p.choices.filter((c) => right.includes(c)).length === 1, 'about how long'); }
    return false;
  },
  len_units: (t, p, ok) => {
    let m;
    if ((m = t.match(/^(\w+) measures a \w+ in (\w+)\. (\w+) measures the same \w+ in (\w+)\. Who gets the bigger number\?$/))) return ok(p.answer === (SIZE[one(m[2])] < SIZE[one(m[4])] ? m[1] : m[3]), 'who gets more');
    if ((m = t.match(/^A \w+ is (\d+) (\w+) long\. Measured in (\w+), the number is…$/))) return ok(p.answer === `${SIZE[one(m[3])] > SIZE[one(m[2])] ? 'less' : 'more'} than ${m[1]}`, 'more or less');
    return false;
  },
  len_line: (t, p, ok) => {
    let m;
    if ((m = t.match(/^Each mark is (\d+) more\. What number is at the arrow\?$/))) { const a = arrowAt(p.visual); return ok(a.value === p.answer && a.step === +m[1], 'arrow on the line'); }
    if ((m = t.match(/^Each mark is (\d+) more\. Tap (\d+)\.$/))) return ok(p.answer === +m[2] && p.line.step === +m[1], 'tap the line');
    if ((m = t.match(/^(\d+) (cm|inches) \+ \? (?:cm|inches) = 1 (m|foot|yard)$/))) return ok(+m[1] + p.answer === { m: 100, foot: 12, yard: 36 }[m[3]], 'to a whole unit');
    if ((m = t.match(/sits at (\d+) on a centimeter ruler\. It hops (\d+) cm forward, then (\d+) cm back\./))) return ok(+m[1] + +m[2] - +m[3] === p.answer, 'hops');
    if ((m = t.match(/has run (\d+) yards/))) return ok(100 - +m[1] === p.answer, 'race');
    if ((m = t.match(/has knitted (\d+) inches/))) return ok(36 - +m[1] === p.answer, 'scarf');
    return false;
  },
  arr_rowscols: (t, p, ok) => {
    const [, r, c] = p.visual.match(/aria-label="(\d+) rows of (\d+)"/).map(Number);
    let m;
    if (t === 'How many rows?') return ok(p.answer === r, 'rows');
    if (t === 'How many columns?') return ok(p.answer === c, 'columns');
    if ((m = t.match(/^(\d+) rows of \? = (\d+)$/))) return ok(+m[1] === r && p.answer === c && +m[2] === r * c, 'rows of');
    if ((m = t.match(/^\? columns of (\d+) = (\d+)$/))) return ok(+m[1] === r && p.answer === c && +m[2] === r * c, 'columns of');
    if (t === 'Add 1 more row. How many dots now?') return ok(p.answer === (r + 1) * c, 'one more row');
    if (t === 'Take away 1 column. How many dots now?') return ok(p.answer === r * (c - 1), 'one less column');
    return false;
  },
  arr_tape: (t, p, ok) => {
    const m = t.match(/^The tape shows (\d+) groups of (\d+)\. (Add 1 more group of \d+\. )?What is the total( now)?\?$/);
    if (!m) return false;
    const parts = (p.visual.match(/fill-opacity="0.55"/g) || []).length;
    return ok(parts === +m[1] && p.answer === (+m[1] + (m[3] ? 1 : 0)) * +m[2], 'tape total');
  },
  money_bills: (t, p, ok) => {
    let m;
    if (t === 'How many dollars is this?') return ok([20, 10, 5, 1].reduce((a, v) => a + v * (p.visual.match(new RegExp('>\\$' + v + '<', 'g')) || []).length, 0) === p.answer, 'counting bills');
    if ((m = t.match(/has \$(\d+)\. \w+ gives (.+) to \w+\. How many dollars are left\?$/))) return ok(+m[1] - billsIn(m[2]) === p.answer && billsIn(m[2]) > 0, 'bills given away');
    if (/in a wallet and .+ in a pocket\. How many dollars in all\?$/.test(t)) return ok(billsIn(t) === p.answer, 'bills in all');
    return false;
  },
  money_ways: (t, p, ok) => {
    const m = t.match(/^Select all the ways to make (\d+)¢\.$/);
    return m ? ok(p.choices.filter((c) => coinsIn(c) === +m[1]).sort().join('|') === p.answer.join('|'), 'ways to make') : false;
  },
  money_to100: (t, p, ok) => {
    let m;
    if ((m = t.match(/^Count up to make \$1: (\d+)¢ \+ \? = 100¢$/))) { const { start, steps } = arrowsOf(p.visual); return ok(100 - +m[1] === p.answer && start === +m[1] && steps[steps.length - 1].to === 100 && steps.reduce((a, s) => a + +s.op, 0) === p.answer, 'count up to $1'); }
    if ((m = t.match(/has (.+)\. A notepad costs \$1\./))) return ok(100 - coinsIn(m[1]) === p.answer, 'notepad');
    if ((m = t.match(/saved (\d+)¢ on Friday and (\d+)¢ on Monday/))) return ok(100 - +m[1] - +m[2] === p.answer, 'saving up');
    return false;
  },
  data_tally: (t, p, ok) => {
    const n = Object.fromEntries([...p.visual.matchAll(/<tr data-n="(\d+)"><th>\S+ ([^<]+)<\/th>/g)].map((x) => [x[2], +x[1]])), total = Object.values(n).reduce((a, b) => a + b, 0);
    // every mark is one line; each bundle of 5 is 4 lines and 1 across
    const tallies = [...p.visual.matchAll(/<tr data-n="(\d+)">.*?<\/tr>/g)].every((x) => (x[0].match(/<line /g) || []).length === +x[1] && (x[0].match(/y1="21" x2="[\d.]+" y2="7"/g) || []).length === Math.floor(+x[1] / 5));
    let m;
    if (!tallies) return ok(false, 'tally marks do not match the numbers');
    if ((m = t.match(/^How many more would be needed to have (\d+) in all\?$/))) return ok(+m[1] - total === p.answer, 'to have in all');
    if ((m = t.match(/^How many fewer (.+) than (.+) and (.+) together\?$/))) return ok(n[m[2]] + n[m[3]] - n[m[1]] === p.answer, 'fewer than together');
    if ((m = t.match(/^How many more (.+) than (.+)\?$/))) return ok(n[m[1]] - n[m[2]] === p.answer, 'how many more');
    if ((m = t.match(/^How many (.+) and (.+) in all\?$/))) return ok(n[m[1]] + n[m[2]] === p.answer, 'in all');
    if ((m = t.match(/^How many (.+)\?$/))) return ok(n[m[1]] === p.answer, 'read a row');
    return false;
  },
  data_lineplot: (t, p, ok) => {
    const c = Object.fromEntries(p.visual.match(/data-plot="([^"]+)"/)[1].split(',').map((x) => x.split(':').map(Number)));
    const marks = (p.visual.match(/>×</g) || []).length, vals = Object.keys(c).map(Number), used = vals.filter((v) => c[v]);
    let m;
    if (marks !== Object.values(c).reduce((a, b) => a + b, 0)) return ok(false, 'marks do not match the data');
    if ((m = t.match(/^How many \w+ are (\d+) \w+ (?:long|tall)\?$/))) return ok(c[m[1]] === p.answer, 'read a column');
    if ((m = t.match(/are (?:longer|taller) than (\d+) /))) return ok(vals.filter((v) => v > +m[1]).reduce((a, v) => a + c[v], 0) === p.answer, 'more than');
    if (/is the most common\?$/.test(t)) { const top = Math.max(...Object.values(c)); return ok(vals.filter((v) => c[v] === top).length === 1 && +p.answer.split(' ')[0] === vals.find((v) => c[v] === top), 'most common'); }
    if (/were measured\?$/.test(t)) return ok(marks === p.answer, 'how many measured');
    if (/difference between the (?:longest|tallest) and the shortest/.test(t)) return ok(Math.max(...used) - Math.min(...used) === p.answer, 'longest − shortest');
    return false;
  },
  time_quarter: (t, p, ok) => {
    let m;
    const words = (h, mm) => (mm === 15 ? `quarter past ${h}` : mm === 30 ? `half past ${h}` : mm === 45 ? `quarter to ${(h % 12) + 1}` : '');
    if ((m = t.match(/^What time is (quarter past|half past|quarter to) (\d+)\?$/))) { const h = +m[2], [hh, mm] = m[1] === 'quarter to' ? [h === 1 ? 12 : h - 1, 45] : [h, m[1] === 'half past' ? 30 : 15]; return ok(p.answer === `${hh}:${mm}`, 'words to time'); }
    if (t === 'Which words tell this time?') { const [h, mm] = clockTime(p.visual); return ok(p.answer === words(h, mm), 'clock to words'); }
    return false;
  },
  time_elapsed: (t, p, ok) => {
    let m;
    const [a, b] = minutesOf(t), between = (b - a + 1440) % 1440;
    if (/starts at .+ and ends at .+\. How many hours is that\?$/.test(t)) return ok(between / 60 === p.answer, 'hours between');
    if ((m = t.match(/lasted (\d+) hours\. It ended at .+\. When did it start\?$/))) return ok((a - minutesOf(p.answer)[0] + 1440) % 1440 === +m[1] * 60, 'start time');
    if (/left at .+ and came back at .+\. How long was that\?$/.test(t)) { const [h, mm] = [Math.floor(between / 60), between % 60]; return ok(p.answer === `${h} hour${h === 1 ? '' : 's'}${mm ? ' 30 minutes' : ''}` && (mm === 0 || mm === 30), 'how long'); }
    return false;
  },
  shape_quads: (t, p, ok) => {
    let m;
    if ((m = t.match(/^A shape has (.+)\. What is it\?$/))) return ok(QUAD[m[1]] === p.answer && p.choices.filter((c) => QUAD[m[1]] === c).length === 1, 'quadrilateral');
    if (t === 'How many angles does this shape have?') return ok(ANG[p.visual.match(/aria-label="(\w+)"/)[1]] === p.answer, 'angles');
    if ((m = t.match(/^Which shape has (\d+) more angles? than a (\w+)\?$/))) return ok(ANG[p.answer] === ANG[m[2]] + +m[1] && p.choices.filter((c) => ANG[c] === ANG[m[2]] + +m[1]).length === 1, 'more angles');
    return false;
  },
  frac_whole: (t, p, ok) => {
    let m;
    const word = (k, n) => `${k} ${PARTS[n][k === 1 ? 0 : 1]}`;
    if (t === 'How much more do you need to shade to make 1 whole?') { const [, k, n] = p.visual.match(/(\d+) of (\d+) parts shaded/).map(Number); return ok(p.answer === word(n - k, n), 'shade the rest'); }
    if ((m = t.match(/^How many (halves|thirds|fourths) make 1 whole\?$/))) return ok(p.answer === { halves: 2, thirds: 3, fourths: 4 }[m[1]], 'parts in a whole');
    if ((m = t.match(/^(\d) (halves|thirds|fourths) is the same as…$/))) { const n = { halves: 2, thirds: 3, fourths: 4 }[m[2]], k = +m[1]; return ok(p.answer === (k === n ? '1 whole' : k * 2 === n ? '1 half' : '?'), 'the same as'); }
    if ((m = t.match(/^(\d) friends share a pizza equally/))) return ok(p.answer === word(1, +m[1]), 'share a pizza');
    return false;
  },
};
const checkKind = (id, d, p) => {
  const t = strip(p.text);
  if (CHECKS[id]) return CHECKS[id](t, p, (good, what) => { if (!good) fail(id, d, what, p); return true; });
  let m;
  if (id === 'pv_words') {
    if ((m = t.match(/^Which number is (.+)\?$/))) { if (W[m[1]] !== +p.answer) fail(id, d, 'words → number', p); }
    else if ((m = t.match(/^Which words name (\d+)\?$/))) { if (p.answer !== U.words(+m[1])) fail(id, d, 'number → words', p); }
    else if ((m = t.match(/^Write the number: (.+)$/))) { if (W[m[1]] !== p.answer) fail(id, d, 'write the number', p); }
    else fail(id, d, 'unknown question', p);
  } else if (id === 'pv_compare') {
    const [l, r] = p.text.match(/class="eqline long">(.*)<\/div>/)[1].split('<span class="blank">?</span>').map(strip);
    const a = valueOf(l), b = valueOf(r), sign = a < b ? '<' : a > b ? '>' : '=';
    if (Number.isNaN(a) || Number.isNaN(b) || sign !== p.answer) fail(id, d, `compare ${l} | ${r} → ${a}, ${b}`, p);
  } else if (id === 'pv_units') {
    if ((m = t.match(/^(.+) = \?$/))) { if (valueOf(m[1]) !== p.answer) fail(id, d, 'unit form', p); }
    else if ((m = t.match(/^(\d+) = \? tens( (\d+) ones?)?$/))) { if (p.answer * 10 + (+m[3] || 0) !== +m[1]) fail(id, d, 'tens of a number', p); }
    else if ((m = t.match(/^(\d+) = (\d+) hundreds \? ones$/))) { if (+m[2] * 100 + p.answer !== +m[1]) fail(id, d, 'hundreds and ones', p); }
    else if ((m = p.visual && p.visual.match(/place value chart: (\d+) hundreds, (\d+) tens, (\d+) ones/))) { if (+m[1] * 100 + +m[2] * 10 + +m[3] !== p.answer) fail(id, d, 'chart value', p); }
    else if ((m = t.match(/^How many hundreds are the same as (\d+) tens\?$/))) { if (p.answer * 10 !== +m[1]) fail(id, d, 'tens to hundreds', p); }
    else if ((m = t.match(/^How many tens are in (\d+) hundreds\?$/))) { if (p.answer !== +m[1] * 10) fail(id, d, 'hundreds to tens', p); }
    else return false;
  } else if (id === 'add_arrow' || id === 'sub_arrow' || id === 'big_arrow') {
    const { start, steps } = arrowsOf(p.visual);
    let v = start;
    for (const s of steps) { if (s.op.includes('?')) break; v += +s.op; if (s.to !== null && s.to !== v) fail(id, d, 'arrow step adds up wrong', p); }
    if ((m = t.match(/solve (\d+) ([+−]) (\d+)/))) {
      const want = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
      if (want !== p.answer) fail(id, d, 'arrow answer', p);
      if (!t.startsWith('Count up') && v !== want) fail(id, d, 'arrows do not reach the answer', p);
      if (t.startsWith('Count up') && v !== +m[1]) fail(id, d, 'counting up does not reach the top', p);
    } else if (t === 'Find the missing jump.') {
      if (Math.abs(steps[1].to - steps[0].to) !== p.answer) fail(id, d, 'missing jump', p);
    } else fail(id, d, 'unknown question', p);
  } else if ((m = t.match(/(\d+) ([+−]) (\d+) = (\?|\d+) ([+−]) (\?|\d+)$/))) { // make it easier: both sides are worth the same
    const left = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3], x = m[4] === '?' ? p.answer : +m[4], y = m[6] === '?' ? p.answer : +m[6];
    if ((m[5] === '+' ? x + y : x - y) !== left) fail(id, d, 'easier problem is not equal', p);
  } else if ((m = t.match(/(?:solve |Make it easier: )(\d+) ([+−]) (\d+)[ .]/)) || (m = t.match(/^(\d+) ([+−]) (\d+)(?: [+−] \d+)* = \?$/))) {
    const nums = t.match(/^(\d+(?: [+−] \d+)+) = \?$/);
    const want = nums ? nums[1].split(' ').reduce((acc, x, i, arr) => (i % 2 ? acc : i === 0 ? +x : arr[i - 1] === '+' ? acc + +x : acc - +x), 0) : m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
    if (want !== p.answer) fail(id, d, 'wrong answer', p);
  } else if (/^(Add|Subtract)\.$/.test(t)) {
    const nums = [...p.visual.matchAll(/class="num">\s*(\d+)/g)].map((x) => +x[1]);
    if ((t === 'Add.' ? nums.reduce((a, b) => a + b, 0) : nums[0] - nums[1]) !== p.answer) fail(id, d, 'column answer', p);
  } else if ((m = t.match(/^To (?:add|solve) (\d+) ([+−]) (\d+)/))) {
    const a = +m[1], b = +m[3], o1 = a % 10, o2 = b % 10, t1 = Math.floor(a / 10) % 10, t2 = Math.floor(b / 10) % 10;
    const want = m[2] === '+'
      ? (o1 + o2 >= 10 ? (t1 + t2 + 1 >= 10 ? 'a new ten and a new hundred' : 'a new ten') : t1 + t2 >= 10 ? 'a new hundred' : 'no new ten or hundred')
      : (o1 < o2 ? (t1 - 1 < t2 ? 'a ten and a hundred' : 'a ten') : t1 < t2 ? 'a hundred' : 'nothing');
    if (want !== p.answer) fail(id, d, 'bundling', p);
  } else if (id === 'pv_bills') {
    const bills = (v) => (p.visual.match(new RegExp('>\\$' + v + '<', 'g')) || []).length;
    if (t === 'How many dollars is this?') { if (bills(100) * 100 + bills(10) * 10 + bills(1) !== p.answer) fail(id, d, 'counting bills', p); }
    else if ((m = t.match(/has (\d+) hundred-dollar bills, (\d+) ten-dollar bills and (\d+) one-dollar/))) { if (+m[1] * 100 + +m[2] * 10 + +m[3] !== p.answer) fail(id, d, 'bills in words', p); }
    else if ((m = t.match(/^How many \$(\d+) bills make \$([\d,]+)\?$/))) { if (p.answer * +m[1] !== +m[2].replace(',', '')) fail(id, d, 'bills to make', p); }
    else if ((m = t.match(/^Make \$(\d+) with the fewest/))) { if (Math.floor(+m[1] / 10) % 10 !== p.answer) fail(id, d, 'fewest bills', p); }
    else if ((m = t.match(/^(\d+) ten-dollar bills and (\d+) one-dollar bills/))) { if (+m[1] * 10 + +m[2] !== p.answer) fail(id, d, 'many bills', p); }
    else return false;
  } else if (id === 'pv_more') {
    const by = (k, w) => (w === 'more' ? +k : -k);
    if ((m = t.match(/^What is (\d+) (more|less) than (\d+)\?$/))) { if (+m[3] + by(m[1], m[2]) !== p.answer) fail(id, d, 'more or less', p); }
    else if ((m = t.match(/^(\d+) (more|less) than \? is (\d+)$/))) { if (p.answer + by(m[1], m[2]) !== +m[3]) fail(id, d, 'unknown start', p); }
    else if ((m = t.match(/^\? (more|less) than (\d+) is (\d+)$/))) { if (+m[2] + by(p.answer, m[1]) !== +m[3]) fail(id, d, 'unknown change', p); }
    else if ((m = t.match(/^(\d+) is ___ than (\d+)\.$/))) { const [k, w] = p.answer.split(' '); if (+m[2] + by(k, w) !== +m[1]) fail(id, d, 'which change', p); }
    else if ((m = t.match(/^What is the rule\? ([\d, ]+)$/))) { const seq = m[1].split(', ').map(Number); if (seq.some((x, i) => i && x - seq[i - 1] !== +p.answer.replace('−', '-'))) fail(id, d, 'pattern rule', p); }
    else return false;
  } else if (id === 'words_tape') {
    const n = (t.match(/\d+/g) || []).map(Number);
    let want;
    if (/took .* took .* left\?$/.test(t)) want = n[0] - n[1] - n[2];
    else if (/That is \d+ more than/.test(t)) want = /together\?$/.test(t) ? n[0] + n[0] - n[1] : n[0] - n[1];
    else if (/That is \d+ fewer than/.test(t)) want = /together\?$/.test(t) ? n[0] + n[0] + n[1] : n[0] + n[1];
    else if (/How many more/.test(t)) want = n[0] - n[1];
    else return false;
    if (want !== p.answer || !p.visual.includes('tape')) fail(id, d, 'tape word problem', p);
  } else if ((m = t.match(/^The chart shows (\d+) \+ (\d+)/))) {
    if (+m[1] + +m[2] !== p.answer) fail(id, d, 'chart total', p);
  } else return false;
  return true; // the answer was checked
};
for (const [id, K] of Object.entries(MQ.KINDS)) {
  if (!MQ.TOPICS[K.topic] || !K.name || !K.ds.length) fail(id, 0, 'kind needs a real topic, a name and levels');
  for (const d of K.ds) {
    const seen = new Set();
    let checked = 0;
    for (let i = 0; i < 1500; i++) {
      let p;
      try { p = MQ.makeKind(id, d); } catch (e) { fail(id, d, 'threw ' + e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
      if (p.topic !== K.topic || p.d !== d || p.kindId !== id) fail(id, d, 'topic, level or kind not set', p);
      const blob = [p.text, p.visual || '', p.hint || '', p.explain || '', (p.choices || []).join('|')].join(' ');
      if (/NaN|undefined|null|Infinity|\[object/.test(blob)) fail(id, d, 'bad token in text', p);
      if (p.kind === 'choice' && (!p.choices.includes(p.answer) || new Set(p.choices).size !== p.choices.length || p.choices.length < 2)) fail(id, d, 'bad choices', p);
      if (p.kind === 'num' && (!Number.isInteger(p.answer) || p.answer < 0)) fail(id, d, 'answer not a whole number', p);
      if (checkKind(id, d, p)) checked++;
      seen.add(p.text + (p.visual || '') + (p.choices || []).join('|'));
    }
    if (seen.size < 30) fail(id, d, `only ${seen.size} different questions`);
    if (checked < 1500) fail(id, d, `${1500 - checked} of 1500 questions have no independent check: add one here`);
  }
  if (MQ.makeKind(id, 9).d !== Math.max(...K.ds) || MQ.makeKind(id, 0).d !== Math.min(...K.ds)) fail(id, 0, 'a level out of range should use the nearest level');
}

// Every topic has a strategy tip, and every test-prep type a one-line description.
for (const [t, T] of Object.entries(MQ.TOPICS)) {
  if (!MQ.TIPS[t] || !MQ.TIPS[t].length) fail(t, 0, 'no strategy tip');
  if (T.track === 'prep' && !T.desc) fail(t, 0, 'no description for Practice by type');
}

// Content sanity: every level references real topics, creature ids are unique.
const ids = new Set();
for (const c of MQ.ALL_CREATURES) {
  if (ids.has(c.id)) fail('content', 0, 'duplicate creature ' + c.id);
  ids.add(c.id);
}
const worldIds = new Set();
for (const tr of Object.values(MQ.TRACKS)) {
  const used = new Set();
  for (const w of tr.worlds) {
    if (worldIds.has(w.id)) fail('content', 0, 'duplicate world id ' + w.id);
    worldIds.add(w.id);
    if (w.levels.length !== 6) fail('content', 0, `world ${w.id} needs 6 levels`);
    for (const l of w.levels) {
      if (!MQ.CREATURES[l.creature]) fail('content', 0, `world ${w.id} has unknown creature ${l.creature}`);
      else if (used.has(MQ.CREATURES[l.creature].emoji)) fail('content', 0, `track ${tr.id} repeats creature emoji ${MQ.CREATURES[l.creature].emoji}`);
      else used.add(MQ.CREATURES[l.creature].emoji);
      for (const t of l.topics) if (!MQ.TOPICS[t] || MQ.TOPICS[t].track !== tr.id) fail('content', 0, `world ${w.id} uses topic ${t} from another track`);
    }
  }
  for (const t of [...tr.core, ...tr.ahead]) if (!MQ.TOPICS[t]) fail('content', 0, `track ${tr.id} lists unknown topic ${t}`);
}

if (failures) {
  console.error(`\n${failures} problem(s) failed.`);
  process.exit(1);
}
console.log(`OK — ${Object.keys(MQ.TOPICS).length} topics × 5 levels × ${RUNS} problems each look valid; ${Object.keys(MQ.KINDS).length} class strategy kinds check out.`);
