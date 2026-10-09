// Run: node tests/generators.test.js
// Generates thousands of problems for every topic and difficulty and checks they are well-formed.
const path = require('path');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'content', 'content-k']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ;

const RUNS = 1200;
let failures = 0;
const fail = (topic, d, msg, p) => {
  failures++;
  if (failures <= 25) console.error(`✗ ${topic} d${d}: ${msg}\n   ${JSON.stringify({ text: p && p.text, answer: p && p.answer, choices: p && p.choices }).slice(0, 400)}`);
};

for (const topic of Object.keys(MQ.TOPICS)) {
  for (let d = 1; d <= 5; d++) {
    const seen = new Set();
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
        if (!Array.isArray(p.choices) || p.choices.length < 2 || p.choices.length > 4) fail(topic, d, 'choice count', p);
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
    }
    if (seen.size < 8) fail(topic, d, `only ${seen.size} distinct problems`);
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
console.log(`OK — ${Object.keys(MQ.TOPICS).length} topics × 5 levels × ${RUNS} problems each look valid.`);
