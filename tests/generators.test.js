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
const checkKind = (id, d, p) => {
  const t = strip(p.text);
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
      seen.add(p.text + (p.visual || ''));
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
