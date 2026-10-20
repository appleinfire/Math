// Learn: short, hands-on courses. Content and progression rules live here without DOM so they can be tested in Node.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const L = {};
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const STEPS = ['see', 'build', 'together', 'try', 'show'];
  const today = () => (MQ.U && MQ.U.dateKey ? MQ.U.dateKey() : new Date().toISOString().slice(0, 10));

  L.STEPS = STEPS;
  L.MODULES = [
    { id: 'groups', icon: '🍎', title: 'Equal groups', minutes: '5–8 min', d: 1, steps: STEPS.slice(),
      see: { title: 'Three groups of four', text: 'Each group has the same number.', lines: ['4 + 4 + 4 = 12', '3 groups of 4 = 12', '3 × 4 = 12', 'Groups of 2, 3, and 4 are not equal yet.'], visual: { kind: 'groups', a: 3, b: 4, emoji: '🍎' } },
      build: { title: 'Build 3 equal groups of 4', text: 'Tap a group to add an apple. Make every group equal.', kind: 'groups', goal: 12 },
      together: { title: 'Solve it together', text: 'First count how many equal groups. Then count how many are in each group.', prompt: 'What is 4 groups of 3?' },
      alternate: { title: "Let's look at it another way", text: 'Jump by 4 on the number line: 0, 4, 8, 12.', visual: { kind: 'line', a: 0, b: 12, step: 4 } } },
    { id: 'arrays', icon: '🔵', title: 'Arrays', minutes: '5–8 min', d: 1, steps: STEPS.slice(),
      see: { title: 'Rows and columns', text: 'This array has 3 rows and 5 columns.', lines: ['3 × 5 = 15', 'Turn it: 5 × 3 = 15', 'Both arrays have 15 dots.'], visual: { kind: 'array', a: 3, b: 5 } },
      build: { title: 'Build, turn, and split', text: 'Tap every dot. Then turn the array and add a cut.', kind: 'array', goal: 15 },
      together: { title: 'Solve it together', text: 'Count the rows. Count the dots in each row. Multiply.', prompt: 'How many dots are in 4 rows of 3?' },
      alternate: { title: "Let's look at it another way", text: 'Think of each row as an equal group.', visual: { kind: 'groups', a: 3, b: 5, emoji: '🔵' } } },
    { id: 'facts2', icon: '✌️', title: 'Facts ×2, ×5, ×10', minutes: '5–8 min', d: 2, steps: STEPS.slice(),
      see: { title: 'Use a pattern', text: 'Facts are easier when you use a pattern.', lines: ['×2: double the number', '×5: count 5, 10, 15…', '×10: add a zero'], visual: { kind: 'line', a: 0, b: 30, step: 5 } },
      build: { title: 'Make jumps', text: 'Tap to make five jumps of 2.', kind: 'jumps', goal: 5 },
      together: { title: 'Solve it together', text: 'Choose the pattern. Then count the jumps.', prompt: 'What is 6 × 5?' },
      alternate: { title: "Let's look at it another way", text: 'Make equal groups and count every object.', visual: { kind: 'groups', a: 5, b: 2, emoji: '⭐' } } },
    { id: 'facts34', icon: '🧠', title: 'Facts ×3 and ×4', minutes: '5–8 min', d: 2, steps: STEPS.slice(),
      see: { title: 'Build from facts you know', text: 'Use a fact you know to make a new fact.', lines: ['3 × 6 = 2 × 6 + 6', '4 × 6: double 6, then double 12', 'Strategies beat guessing.'], visual: { kind: 'groups', a: 3, b: 6, emoji: '🟣' } },
      build: { title: 'Double, then double again', text: 'Tap twice: double 4, then double 8.', kind: 'double', goal: 2 },
      together: { title: 'Solve it together', text: 'For ×3, find ×2 and add one more group.', prompt: 'What is 3 × 7?' },
      alternate: { title: "Let's look at it another way", text: 'Split the array into a part you know and one more row.', visual: { kind: 'array', a: 3, b: 7 } } },
    { id: 'division', icon: '➗', title: 'Meaning of division', minutes: '5–8 min', d: 4, steps: STEPS.slice(),
      see: { title: 'Division has two meanings', text: 'Both stories use 12 ÷ 3.', lines: ['Sharing: 12 shared among 3 kids', 'Grouping: how many groups of 3?', 'Both answers are 4.'], visual: { kind: 'groups', a: 3, b: 4, emoji: '🍓' } },
      build: { title: 'Share 12 equally', text: 'Tap the kids one at a time. Give each kid the same number.', kind: 'share', goal: 12 },
      together: { title: 'Solve it together', text: 'Ask: am I sharing into groups, or making groups of a size?', prompt: 'How many groups of 4 are in 16?' },
      alternate: { title: "Let's look at it another way", text: 'Use jumps: how many jumps of 3 reach 12?', visual: { kind: 'line', a: 0, b: 12, step: 3 } } },
    { id: 'families', icon: '🏠', title: 'Fact families', minutes: '5–8 min', d: 4, steps: STEPS.slice(),
      see: { title: 'Four facts belong together', text: 'The same three numbers make a fact family.', lines: ['3 × 4 = 12', '4 × 3 = 12', '12 ÷ 3 = 4', '12 ÷ 4 = 3'], visual: { kind: 'array', a: 3, b: 4 } },
      build: { title: 'Open the fact family', text: 'Tap all four fact cards.', kind: 'family', goal: 4 },
      together: { title: 'Solve it together', text: 'Find the two factors and their product. Turn each multiplication fact into division.', prompt: 'If 5 × 4 = 20, what is 20 ÷ 5?' },
      alternate: { title: "Let's look at it another way", text: 'Cover one number. Use the other two to find the missing number.', visual: { kind: 'groups', a: 4, b: 3, emoji: '🔷' } } },
  ];
  const byId = (id) => L.MODULES.find((m) => m.id === id);
  L.module = byId;
  L.ensure = (st) => (st.lessons = st.lessons || {});
  L.progress = (st, id) => (L.ensure(st)[id] || { step: 0, done: false, stars: 0, at: '' });
  L.isOpen = (st, id, preview = false) => {
    const i = L.MODULES.findIndex((m) => m.id === id);
    return i === 0 || preview || (i > 0 && L.progress(st, L.MODULES[i - 1].id).done);
  };
  L.markStep = (st, id, step) => {
    const old = L.progress(st, id), p = (L.ensure(st)[id] = Object.assign({}, old));
    p.step = Math.max(p.step || 0, Math.max(0, Math.min(4, step)));
    p.at = today();
    return p;
  };
  L.finish = (st, id) => {
    const first = !L.progress(st, id).done, p = L.markStep(st, id, 4);
    p.done = true; p.stars = Math.max(1, p.stars || 0); p.at = today();
    return { progress: p, first };
  };
  L.completed = (st) => L.MODULES.filter((m) => L.progress(st, m.id).done).length;
  L.practiceDifficulty = (id) => { const i = L.MODULES.findIndex((m) => m.id === id); return i < 2 ? 1 : i < 4 ? 2 : 4; };
  L.assessmentPath = (firstTry) => firstTry.length === 2 && firstTry.every(Boolean) ? 'done' : 'another';

  function options(answer, likely = []) {
    const out = [answer];
    for (const n of likely) if (Number.isFinite(n) && n >= 0 && n !== answer && !out.includes(n)) out.push(n);
    for (let gap = 1; out.length < 4; gap++) for (const n of [answer - gap, answer + gap]) if (n >= 0 && !out.includes(n)) out.push(n);
    return shuffle(out.slice(0, 4));
  }
  const Q = (module, text, answer, likely, explain, hint, visual, d) => ({
    module, topic: 'mult', d: d || byId(module).d, kind: 'choice', text, say: text.replace(/<[^>]+>/g, ' '), answer,
    choices: options(answer, likely), explain, visual: visual || null, hint,
  });
  const countHint = (a, b, answer) => (given) => {
    if (+given === a + b) return `You added ${a} + ${b}. ${a} × ${b} means ${a} groups of ${b}.`;
    if (+given === answer - b || +given === answer + b) return 'Count the groups again. Keep the same number in every group.';
    return `Count ${b}, ${a} times. Touch each group as you count.`;
  };
  const divisionHint = (total, divisor, answer, sharing) => (given) => {
    if (+given === total - divisor) return `You took away ${divisor}. ${total} ÷ ${divisor} means ${sharing ? `${total} shared into ${divisor} equal groups` : `how many groups of ${divisor} fit in ${total}`}.`;
    if (+given === divisor) return sharing ? `There are ${divisor} groups, but the answer tells how many are in each group.` : `Each group has ${divisor}. Count how many groups you can make.`;
    return sharing ? `Share all ${total} one at a time. Make ${divisor} equal groups.` : `Circle groups of ${divisor} until all ${total} are used.`;
  };

  L.problem = (id, phase = 'try', alternate = false) => {
    const hard = phase === 'show' || phase === 'another';
    if (id === 'groups') {
      const a = rnd(2, hard ? 6 : 5), b = rnd(2, hard ? 6 : 5), answer = a * b;
      return Q(id, `${a} equal groups have ${b} in each group. How many in all?`, answer, [a + b, answer - b, answer + b], `${a} × ${b} = ${answer}. ${Array(a).fill(b).join(' + ')} = ${answer}.`, countHint(a, b, answer), alternate ? { kind: 'line', a: 0, b: answer, step: b } : { kind: 'groups', a, b, emoji: pick(['🍎', '⭐', '🐞']) });
    }
    if (id === 'arrays') {
      const a = rnd(2, hard ? 7 : 5), b = rnd(2, hard ? 7 : 5), answer = a * b, split = rnd(1, a - 1);
      const text = alternate ? `${a} groups have ${b} dots each. How many dots?` : `An array has ${a} rows and ${b} dots in each row. How many dots?`;
      return Q(id, text, answer, [a + b, (a - 1) * b, answer + b], `${a} × ${b} = ${answer}. You can split it: ${split} × ${b} + ${a - split} × ${b} = ${answer}.`, countHint(a, b, answer), alternate ? { kind: 'groups', a, b, emoji: '🔵' } : { kind: 'array', a, b });
    }
    if (id === 'facts2') {
      const b = pick([2, 5, 10]), a = rnd(2, 10), answer = a * b;
      const hint = (given) => +given === a + b ? `You added ${a} + ${b}. Make ${a} jumps of ${b}.` : b === 2 ? `Double ${a}: ${a} + ${a}.` : b === 5 ? `Count by fives ${a} times.` : `For ×10, put one zero after ${a}.`;
      return Q(id, `What is ${a} × ${b}?`, answer, [a + b, (a - 1) * b, (a + 1) * b], `${a} × ${b} = ${answer}. ${b === 2 ? `${a} + ${a} = ${answer}` : `Count: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(', ')}.`}`, hint, alternate ? { kind: 'groups', a, b: Math.min(b, 5), emoji: '⭐' } : { kind: 'line', a: 0, b: answer, step: b });
    }
    if (id === 'facts34') {
      const a = pick([3, 4]), b = rnd(2, 10), answer = a * b;
      const hint = (given) => +given === a + b ? `You added ${a} + ${b}. ${a} × ${b} has ${a} groups of ${b}.` : a === 3 ? `Find 2 × ${b}, then add one more ${b}.` : `Double ${b}, then double ${b * 2}.`;
      const explain = a === 3 ? `2 × ${b} = ${2 * b}; add ${b}: ${2 * b} + ${b} = ${answer}.` : `Double ${b} = ${2 * b}; double again = ${answer}.`;
      return Q(id, `What is ${a} × ${b}?`, answer, [a + b, (a - 1) * b, (a + 1) * b], explain, hint, { kind: alternate ? 'array' : 'groups', a, b, emoji: '🟣' });
    }
    if (id === 'division') {
      const divisor = rnd(2, 5), answer = rnd(2, hard ? 8 : 6), total = divisor * answer, sharing = alternate ? false : Math.random() < 0.5;
      const text = sharing ? `${total} berries are shared equally among ${divisor} kids. How many berries does each kid get?` : `There are ${total} shells. Make groups of ${divisor}. How many groups?`;
      return Q(id, text, answer, [total - divisor, divisor, answer + 1], `${total} ÷ ${divisor} = ${answer}. ${sharing ? `${divisor} equal groups have ${answer} in each.` : `${answer} groups of ${divisor} use all ${total}.`}`, divisionHint(total, divisor, answer, sharing), sharing ? { kind: 'groups', a: divisor, b: answer, emoji: '🍓' } : { kind: 'line', a: 0, b: total, step: divisor });
    }
    if (id === 'families') {
      const a = rnd(2, 6), b = rnd(2, 8), total = a * b, division = Math.random() < 0.6, answer = division ? (Math.random() < 0.5 ? a : b) : total;
      const text = division ? (answer === b ? `Use the fact ${a} × ${b} = ${total}. What is ${total} ÷ ${a}?` : `Use the fact ${a} × ${b} = ${total}. What is ${total} ÷ ${b}?`) : `Complete the fact family: ${b} × ${a} = ?`;
      const hint = (given) => +given === total - (answer === a ? b : a) ? 'Division is not subtraction. Use the multiplication fact in the question.' : `The family uses only ${a}, ${b}, and ${total}. Which number is missing?`;
      return Q(id, text, answer, [a, b, total].filter((n) => n !== answer).concat([answer + 1]), `${a} × ${b} = ${total}, ${b} × ${a} = ${total}, ${total} ÷ ${a} = ${b}, and ${total} ÷ ${b} = ${a}.`, hint, alternate ? { kind: 'groups', a, b, emoji: '🔷' } : { kind: 'array', a, b });
    }
    throw new Error('Unknown lesson module: ' + id);
  };

  L.hint = (p, given) => p.hint(given);
  L.newBuild = (id) => ({ id, n: 0, counts: [0, 0, 0], filled: {}, turned: false, cut: false, done: false });
  L.buildTap = (state, action = 'tap') => {
    const m = byId(state.id), next = Object.assign({}, state);
    if (!m) return next;
    if (m.build.kind === 'groups' || m.build.kind === 'share') {
      next.counts = (state.counts || [0, 0, 0]).slice();
      const named = /^group:(\d+)$/.exec(action), i = named ? +named[1] : next.counts.indexOf(Math.min(...next.counts));
      if (i >= 0 && i < 3 && next.counts[i] < 4) next.counts[i]++;
      next.n = next.counts.reduce((n, x) => n + x, 0);
      next.done = next.n === m.build.goal && next.counts.every((n) => n === 4);
      return next;
    }
    if (m.build.kind === 'array') {
      next.filled = Object.assign({}, state.filled || {});
      if (action === 'turn') next.turned = true;
      else if (action === 'cut') next.cut = true;
      else { const named = /^dot:(\d+)$/.exec(action), i = named ? +named[1] : Array.from({ length: m.build.goal }, (_, k) => k).find((k) => !next.filled[k]); if (i >= 0 && i < m.build.goal) next.filled[i] = true; }
      next.n = Object.keys(next.filled).length;
      next.done = next.n >= m.build.goal && next.turned && next.cut;
      return next;
    }
    if (m.build.kind === 'family') {
      next.filled = Object.assign({}, state.filled || {});
      const named = /^card:(\d+)$/.exec(action), i = named ? +named[1] : Array.from({ length: 4 }, (_, k) => k).find((k) => !next.filled[k]);
      if (i >= 0 && i < 4) next.filled[i] = true;
      next.n = Object.keys(next.filled).length; next.done = next.n === 4;
      return next;
    }
    next.n = Math.min(m.build.goal, next.n + 1); next.done = next.n >= m.build.goal;
    return next;
  };

  MQ.lessons = L;
})();
