// Learn: short, hands-on courses. Content and progression rules live here without DOM so they can be tested in Node.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const L = {};
  const { rnd, pick, shuffle } = MQ.U;
  const STEPS = ['see', 'build', 'together', 'try', 'show'];
  const today = () => (MQ.U && MQ.U.dateKey ? MQ.U.dateKey() : new Date().toISOString().slice(0, 10));

  L.STEPS = STEPS;
  L.MODULES = [
    { id: 'groups', icon: '🍎', title: 'Equal groups', minutes: '5–8 min', d: 1, steps: STEPS.slice(),
      see: { title: 'Three groups of four', text: 'Each group has the same number.', lines: ['4 + 4 + 4 = 12', '3 groups of 4 = 12', '3 × 4 = 12'], visual: { kind: 'groups', a: 3, b: 4, emoji: '🍎' } },
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
      build: { title: 'Share, then make groups', text: 'First share 12 berries equally among 3 kids.', kind: 'share', goal: 12 },
      together: { title: 'Solve it together', text: 'Ask: am I sharing into groups, or making groups of a size?', prompt: 'How many groups of 4 are in 16?' },
      alternate: { title: "Let's look at it another way", text: 'Use jumps: how many jumps of 3 reach 12?', visual: { kind: 'line', a: 0, b: 12, step: 3 } } },
    { id: 'families', icon: '🏠', title: 'Fact families', minutes: '5–8 min', d: 4, steps: STEPS.slice(),
      see: { title: 'Four facts belong together', text: 'The same three numbers make a fact family.', lines: ['3 × 4 = 12', '4 × 3 = 12', '12 ÷ 3 = 4', '12 ÷ 4 = 3'], visual: { kind: 'array', a: 3, b: 4 } },
      build: { title: 'Open the fact family', text: 'Tap all four fact cards.', kind: 'family', goal: 4 },
      together: { title: 'Solve it together', text: 'Find the two factors and their product. Turn each multiplication fact into division.', prompt: 'If 5 × 4 = 20, what is 20 ÷ 5?' },
      alternate: { title: "Let's look at it another way", text: 'Cover one number. Use the other two to find the missing number.', visual: { kind: 'groups', a: 4, b: 3, emoji: '🔷' } } },
  ];
  // Multiply & Divide records under mult; Practice afterwards starts Endless Training at these levels.
  L.MODULES.forEach((m, i) => Object.assign(m, { course: 'muldiv', topic: 'mult', practice: { topic: 'mult', d: i < 2 ? 1 : i < 4 ? 2 : 4 } }));
  // Add & Subtract: the place value models a 2nd-grade class works with (Eureka Math Grade 2 Modules 1, 4 and 5).
  const another = "Let's look at it another way";
  const ADDSUB = [
    { id: 'maketen', icon: '🔟', title: 'Make a ten', d: 2, topic: 'add100', practice: { topic: 'add100', d: 2 },
      see: { title: 'Make a ten to add', text: 'Break apart the smaller number to fill up a ten.', lines: ['8 + 5: break 5 into 2 and 3', '8 + 2 = 10, then 10 + 3 = 13', '38 + 5 = 40 + 3 = 43'], visual: { kind: 'bond', whole: 5, a: 2, b: 3 } },
      build: { title: 'Fill the ten: 8 + 5', text: 'Tap a dot in the second frame to move it. Fill up the first ten.', kind: 'tenframe', goal: 2 },
      together: { title: 'Solve it together', text: 'How many more make the next ten? Take them from the other number, then add the rest.', prompt: 'What is 38 + 7?' },
      alternate: { title: another, text: 'Jump to the next ten first, then jump the rest.', visual: { kind: 'arrows', start: 38, steps: [{ op: '+2', to: 40 }, { op: '+3', to: 43 }] } } },
    { id: 'addtens', icon: '🧱', title: 'Add tens and ones', d: 2, topic: 'add100', practice: { topic: 'add100', d: 2 },
      see: { title: 'Tens with tens, ones with ones', text: 'Add the tens first, then the ones.', lines: ['34 + 25', '34 + 20 = 54', '54 + 5 = 59'], visual: { kind: 'arrows', start: 34, steps: [{ op: '+20', to: 54 }, { op: '+5', to: 59 }] } },
      build: { title: 'Build 34 + 25', text: 'The chart shows 34. Tap to add 2 tens and 5 ones.', kind: 'pvadd', goal: 7 },
      together: { title: 'Solve it together', text: 'Add the tens to the tens. Then add the ones to the ones.', prompt: 'What is 34 + 25?' },
      alternate: { title: another, text: 'Put the tens rods together and the ones cubes together.', visual: { kind: 'blocks', h: 0, t: 5, o: 9 } } },
    { id: 'bundle', icon: '📦', title: 'Make a new ten', d: 3, topic: 'add100', practice: { topic: 'add100', d: 3 },
      see: { title: '10 ones make 1 ten', text: 'When the ones make 10 or more, bundle 10 of them into a new ten.', lines: ['47 + 26', 'Ones: 7 + 6 = 13', '13 ones = 1 new ten and 3 ones', 'Tens: 4 + 2 + 1 = 7, so 73'], visual: { kind: 'chart', h: 0, t: 6, o: 13 } },
      build: { title: 'Bundle 10 ones: 47 + 26', text: '47 + 26 is on the chart. Tap 10 ones to bundle them into a ten.', kind: 'bundle', goal: 10 },
      together: { title: 'Solve it together', text: 'Add the ones first. 10 or more? Bundle a new ten and add it to the tens.', prompt: 'What is 47 + 26?' },
      alternate: { title: another, text: 'Jump to the next ten first: 47 + 3 = 50. Then add the rest: 50 + 23 = 73.', visual: { kind: 'arrows', start: 47, steps: [{ op: '+3', to: 50 }, { op: '+23', to: 73 }] } } },
    { id: 'unbundle', icon: '🔓', title: 'Unbundle a ten', d: 3, topic: 'sub100', practice: { topic: 'sub100', d: 3 },
      see: { title: 'Not enough ones? Unbundle a ten', text: 'Change 1 ten into 10 ones. Then subtract.', lines: ['52 − 27', '2 ones − 7 ones: not enough!', 'Unbundle a ten: 4 tens and 12 ones', '12 − 7 = 5 and 4 − 2 = 2, so 25'], visual: { kind: 'chart', h: 0, t: 4, o: 12 } },
      build: { title: 'Take 27 from 52', text: 'Unbundle a ten first. Then take away 7 ones and 2 tens.', kind: 'unbundle', goal: 10 },
      together: { title: 'Solve it together', text: 'Look at the ones. Not enough to take away? Unbundle a ten. Then subtract the ones and the tens.', prompt: 'What is 52 − 27?' },
      alternate: { title: another, text: 'Count up from the smaller number instead. The jumps add up to the answer: 3 + 22 = 25.', visual: { kind: 'arrows', start: 27, steps: [{ op: '+3', to: 30 }, { op: '+22', to: 52 }] } } },
    { id: 'hundreds', icon: '💯', title: 'Add to 1,000', d: 3, topic: 'big', practice: { topic: 'big', d: 3 },
      see: { title: 'Bundle ones, then tens', text: '10 ones make a ten. 10 tens make a hundred.', lines: ['365 + 248', 'Ones: 5 + 8 = 13: a new ten and 3 ones', 'Tens: 6 + 4 + 1 = 11: a new hundred and 1 ten', 'Hundreds: 3 + 2 + 1 = 6, so 613'], visual: { kind: 'chart', h: 5, t: 10, o: 13 } },
      build: { title: 'Bundle twice: 365 + 248', text: 'Bundle 10 ones into a ten. Then bundle 10 tens into a hundred.', kind: 'bundle2', goal: 2 },
      together: { title: 'Solve it together', text: 'Ones, then tens, then hundreds. Bundle whenever a place has 10 or more.', prompt: 'What is 365 + 248?' },
      alternate: { title: another, text: 'Use arrows: add the hundreds, then the tens, then the ones.', visual: { kind: 'arrows', start: 365, steps: [{ op: '+200', to: 565 }, { op: '+40', to: 605 }, { op: '+8', to: 613 }] } } },
    { id: 'zeros', icon: '0️⃣', title: 'Subtract across zeros', d: 4, topic: 'big', practice: { topic: 'big', d: 4 },
      see: { title: 'Unbundle a hundred, then a ten', text: 'No tens and no ones to take from? Unbundle twice.', lines: ['400 − 247', '4 hundreds = 3 hundreds and 10 tens', '10 tens = 9 tens and 10 ones', '3 hundreds 9 tens 10 ones − 247 = 153'], visual: { kind: 'chart', h: 3, t: 9, o: 10 } },
      build: { title: 'Get 400 ready', text: 'The chart shows 400. Unbundle a hundred, then a ten.', kind: 'zeros', goal: 2 },
      together: { title: 'Solve it together', text: 'Get ready first: unbundle where you need to. Then subtract the ones, the tens and the hundreds.', prompt: 'What is 400 − 247?' },
      alternate: { title: another, text: 'Make it easier: take 1 from both numbers. 400 − 247 = 399 − 246 = 153, and nothing needs unbundling.', visual: { kind: 'column', nums: [399, 246], op: '−' } } },
  ];
  ADDSUB.forEach((m) => Object.assign(m, { course: 'addsub', minutes: '5–8 min', steps: STEPS.slice() }));
  L.MODULES.push(...ADDSUB);
  L.COURSES = [
    { id: 'addsub', icon: '➕', title: 'Add & Subtract', intro: 'Make a ten, then bundle and unbundle tens and hundreds on the place value chart, the way your class does.' },
    { id: 'muldiv', icon: '✖️', title: 'Multiply & Divide', intro: 'Learn with pictures, build models, and practice one small step at a time.' },
  ];
  L.courseModules = (course) => L.MODULES.filter((m) => m.course === course);
  L.courseFor = (topic) => (L.MODULES.find((m) => m.topic === topic) || {}).course || '';
  const byId = (id) => L.MODULES.find((m) => m.id === id);
  L.module = byId;
  L.ensure = (st) => (st.lessons = st.lessons || {});
  L.progress = (st, id) => (L.ensure(st)[id] || { step: 0, done: false, stars: 0, at: '' });
  L.isOpen = (st, id, preview = false) => { // each course opens one module after another
    const m = byId(id), list = m ? L.courseModules(m.course) : [], i = list.indexOf(m);
    return i === 0 || preview || (i > 0 && L.progress(st, list[i - 1].id).done);
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
  L.completed = (st, course) => L.MODULES.filter((m) => (!course || m.course === course) && L.progress(st, m.id).done).length;
  L.practice = (id) => byId(id).practice;
  L.practiceDifficulty = (id) => byId(id).practice.d;
  L.assessmentPath = (firstTry) => firstTry.length === 2 && firstTry.every(Boolean) ? 'done' : 'another';

  function options(answer, likely = []) {
    const out = [answer];
    for (const n of likely) if (Number.isFinite(n) && n >= 0 && n !== answer && !out.includes(n)) out.push(n);
    for (let gap = 1; out.length < 4; gap++) for (const n of [answer - gap, answer + gap]) if (n >= 0 && !out.includes(n)) out.push(n);
    return shuffle(out.slice(0, 4));
  }
  const Q = (module, text, answer, likely, explain, hint, visual, d) => ({
    module, topic: byId(module).topic, d: d || byId(module).d, kind: 'choice', text, say: text.replace(/<[^>]+>/g, ' '), answer,
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
    // ---- Add & Subtract: each wrong choice is a mistake children make, and gets its own hint
    const dg = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
    const jumps = (start, parts) => { let v = start; return parts.filter(Boolean).map((x, i, all) => ({ op: (x < 0 ? '−' : '+') + Math.abs(x), to: i === all.length - 1 ? null : (v += x) })); };
    if (id === 'maketen') {
      let a, b;
      do { a = rnd(12, hard ? 88 : 78); b = rnd(hard ? 3 : 4, 9); } while (a % 10 === 0 || a % 10 + b < 11 || a + b > 99);
      const need = 10 - (a % 10), next = a + need, rest = b - need, answer = a + b;
      const hint = (given) => +given === answer - 10 ? `You forgot the new ten. ${a} + ${need} = ${next}, then ${next} + ${rest} = ${answer}.`
        : +given === next ? `That is only the next ten. Now add the ${rest} that is left.`
        : `Make a ten: ${a} + ${need} = ${next}. Then add the ${rest} that is left.`;
      return Q(id, `What is ${a} + ${b}?`, answer, [answer - 10, next, answer + 1], `${a} + ${need} = ${next}, ${next} + ${rest} = ${answer}.`, hint,
        alternate ? { kind: 'arrows', start: a, steps: jumps(a, [need, rest]) } : phase === 'show' ? null : { kind: 'bond', whole: b, a: need, b: rest });
    }
    if (id === 'addtens') {
      let a, b;
      do { a = rnd(12, 78); b = !hard && Math.random() < 0.4 ? rnd(1, 6) * 10 : rnd(11, 59); } while (a % 10 + b % 10 > 9 || a + b > 99);
      const [, t1, o1] = dg(a), [, t2, o2] = dg(b), answer = a + b;
      const hint = (given) => +given === a + t2 + o2 ? `${b} is ${t2} ten${t2 === 1 ? '' : 's'} and ${o2} one${o2 === 1 ? '' : 's'}. Add ${t2 * 10}, not ${t2}.`
        : +given === (t1 + t2) * 10 && o1 + o2 ? `Now add the ones too: ${o1} + ${o2} = ${o1 + o2}.`
        : +given === t1 + o1 + t2 + o2 ? 'Keep the places apart: tens with tens, ones with ones.'
        : `Tens: ${t1 * 10} + ${t2 * 10} = ${(t1 + t2) * 10}. Ones: ${o1} + ${o2} = ${o1 + o2}.`;
      return Q(id, `What is ${a} + ${b}?`, answer, [a + t2 + o2, (t1 + t2) * 10, t1 + o1 + t2 + o2, answer + 10], `Tens: ${t1 * 10} + ${t2 * 10} = ${(t1 + t2) * 10}. Ones: ${o1} + ${o2} = ${o1 + o2}. ${(t1 + t2) * 10} + ${o1 + o2} = ${answer}.`, hint,
        alternate ? { kind: 'blocks', h: 0, t: t1 + t2, o: o1 + o2 } : phase === 'show' ? null : { kind: 'arrows', start: a, steps: jumps(a, [t2 * 10, o2]) });
    }
    if (id === 'bundle') {
      let a, b;
      do { a = rnd(15, 79); b = rnd(12, 69); } while (a % 10 + b % 10 < (hard ? 10 : 11) || a + b > 99);
      const [, t1, o1] = dg(a), [, t2, o2] = dg(b), ones = o1 + o2, answer = a + b, glued = +`${t1 + t2}${ones}`;
      const hint = (given) => +given === answer - 10 ? `${o1} + ${o2} = ${ones} ones: that is 1 new ten and ${ones - 10} ones. Add the new ten to the tens.`
        : +given === glued ? `${ones} ones is too many for one place. Bundle 10 ones into a new ten.`
        : +given === answer + 10 ? `Only 1 new ten: ${ones} ones = 1 ten and ${ones - 10} ones.`
        : `Ones first: ${o1} + ${o2} = ${ones}. Bundle 10 ones into a ten, then add the tens.`;
      return Q(id, `What is ${a} + ${b}?`, answer, [answer - 10, glued, answer + 10], `Ones: ${o1} + ${o2} = ${ones}, that is 1 ten and ${ones - 10} ones. Tens: ${t1} + ${t2} + 1 = ${t1 + t2 + 1}. So ${answer}.`, hint,
        alternate ? { kind: 'arrows', start: a, steps: jumps(a, [10 - o1, b - 10 + o1]) } : phase === 'show' ? { kind: 'column', nums: [a, b], op: '+' } : { kind: 'chart', h: 0, t: t1 + t2, o: ones });
    }
    if (id === 'unbundle') {
      let a, b;
      do { a = rnd(31, 98); b = rnd(12, a - 5); } while (a % 10 >= b % 10 || Math.floor(a / 10) <= Math.floor(b / 10) || a - b <= 10 - (b % 10));
      const [, t1, o1] = dg(a), [, t2, o2] = dg(b), answer = a - b, flip = 10 * (t1 - t2) + (o2 - o1), up = 10 - o2;
      const hint = (given) => +given === flip ? `In the ones, ${o1} − ${o2} does not work, and you can't flip it to ${o2} − ${o1}. Unbundle a ten: ${o1 + 10} − ${o2} = ${o1 + 10 - o2}. Then only ${t1 - 1} tens are left.`
        : +given === a + b ? `This is take away: the answer is less than ${a}.`
        : +given === answer - 10 ? `You took away one ten too many. After unbundling there are ${t1 - 1} tens: ${t1 - 1} − ${t2} = ${t1 - 1 - t2}.`
        : `Unbundle a ten: ${t1 - 1} tens and ${o1 + 10} ones. Then ${o1 + 10} − ${o2} and ${t1 - 1} − ${t2}.`;
      return Q(id, `What is ${a} − ${b}?`, answer, [flip, answer - 10, a + b], `${a} = ${t1 - 1} tens and ${o1 + 10} ones. ${o1 + 10} − ${o2} = ${o1 + 10 - o2}, ${t1 - 1} − ${t2} = ${t1 - 1 - t2}. So ${answer}.`, hint,
        alternate ? { kind: 'arrows', start: b, steps: [{ op: '+' + up, to: b + up }, { op: '+' + (a - b - up), to: a }] } : phase === 'show' ? { kind: 'column', nums: [a, b], op: '−' } : { kind: 'chart', h: 0, t: t1, o: o1 });
    }
    if (id === 'hundreds') {
      let a, b, A, B, c1, c2;
      do { a = rnd(105, 789); b = rnd(hard ? 105 : 15, 489); A = dg(a); B = dg(b); c1 = A[2] + B[2] >= 10; c2 = A[1] + B[1] + (c1 ? 1 : 0) >= 10; } while (a + b > 999 || !(hard ? c1 && c2 : c1 !== c2));
      const answer = a + b, tens = A[1] + B[1] + (c1 ? 1 : 0);
      const hint = (given) => +given === answer - 110 ? 'There are two new bundles: a new ten from the ones and a new hundred from the tens.'
        : +given === answer - 10 ? `You forgot the new ten: ${A[2]} + ${B[2]} = ${A[2] + B[2]} ones.`
        : +given === answer - 100 ? `You forgot the new hundred: the tens make ${tens} tens.`
        : 'Add the ones, then the tens, then the hundreds. Bundle whenever a place has 10 or more.';
      return Q(id, `What is ${a} + ${b}?`, answer, [c1 && answer - 10, c2 && answer - 100, c1 && c2 && answer - 110, answer + 100].filter(Boolean), `Ones: ${A[2]} + ${B[2]} = ${A[2] + B[2]}. Tens: ${A[1]} + ${B[1]}${c1 ? ' + 1' : ''} = ${tens}. Hundreds: ${A[0]} + ${B[0]}${c2 ? ' + 1' : ''} = ${A[0] + B[0] + (c2 ? 1 : 0)}. So ${answer}.`, hint,
        alternate ? { kind: 'arrows', start: a, steps: jumps(a, [B[0] * 100, B[1] * 10, B[2]]) } : phase === 'show' ? { kind: 'column', nums: [a, b], op: '+' } : { kind: 'chart', h: A[0] + B[0], t: A[1] + B[1], o: A[2] + B[2] });
    }
    if (id === 'zeros') {
      let a, b, A, B;
      do { a = rnd(3, 9) * 100 + (hard && !alternate && Math.random() < 0.5 ? rnd(1, 8) : 0); b = rnd(111, a - 50); A = dg(a); B = dg(b); } while (B[2] <= A[2] || B[1] === 0);
      const answer = a - b, flip = 100 * Math.abs(A[0] - B[0]) + 10 * B[1] + Math.abs(A[2] - B[2]);
      const hint = (given) => +given === answer + 100 ? `You unbundled a hundred, so one hundred is gone: ${A[0] - 1} hundreds are left.`
        : +given === answer + 10 ? 'You unbundled a ten too, so 9 tens are left, not 10.'
        : +given === flip ? `You can't flip 0 − ${B[1]} into ${B[1]} − 0. Unbundle a hundred and a ten first.`
        : `Get ready: ${a} = ${A[0] - 1} hundreds, 9 tens and ${A[2] + 10} ones. Then subtract each place.`;
      return Q(id, `What is ${a} − ${b}?`, answer, [answer + 100, answer + 10, flip], `${a} = ${A[0] - 1} hundreds, 9 tens and ${A[2] + 10} ones. Ones: ${A[2] + 10} − ${B[2]} = ${A[2] + 10 - B[2]}. Tens: 9 − ${B[1]} = ${9 - B[1]}. Hundreds: ${A[0] - 1} − ${B[0]} = ${A[0] - 1 - B[0]}. So ${answer}.`, hint,
        alternate ? { kind: 'column', nums: [a - 1, b - 1], op: '−' } : phase === 'show' ? { kind: 'column', nums: [a, b], op: '−' } : { kind: 'chart', h: A[0] - 1, t: 9, o: A[2] + 10 });
    }
    throw new Error('Unknown lesson module: ' + id);
  };

  L.hint = (p, given) => p.hint(given);
  L.newBuild = (id) => ({ id, n: 0, counts: [0, 0, 0], filled: {}, turned: false, cut: false, part: id === 'division' ? 'sharing' : '', shareDone: false, groupingN: 0, t: 0, o: 0, unb: false, ones: 0, tens: 0, step: 0, msg: '', done: false });
  L.buildTap = (state, action = 'tap') => {
    const m = byId(state.id), next = Object.assign({}, state);
    if (!m) return next;
    if (m.build.kind === 'groups') {
      next.counts = (state.counts || [0, 0, 0]).slice();
      const named = /^group:(\d+)$/.exec(action), i = named ? +named[1] : next.counts.indexOf(Math.min(...next.counts));
      if (i >= 0 && i < 3 && next.counts[i] < 4) next.counts[i]++;
      next.n = next.counts.reduce((n, x) => n + x, 0);
      next.done = next.n === m.build.goal && next.counts.every((n) => n === 4);
      return next;
    }
    if (m.build.kind === 'share') {
      next.counts = (state.counts || [0, 0, 0]).slice();
      if (action === 'startGrouping' && state.shareDone) {
        next.part = 'grouping'; next.n = 0; next.groupingN = 0; next.done = false;
        return next;
      }
      if (state.part === 'grouping') {
        if (action === 'groupBerry' || action === 'tap') next.groupingN = Math.min(m.build.goal, (state.groupingN || 0) + 1);
        next.n = next.groupingN; next.done = next.groupingN === m.build.goal;
        return next;
      }
      const named = /^group:(\d+)$/.exec(action), i = named ? +named[1] : next.counts.indexOf(Math.min(...next.counts));
      if ((action === 'shareBerry' || action === 'tap' || named) && i >= 0 && i < 3 && next.counts[i] < 4) next.counts[i]++;
      next.n = next.counts.reduce((n, x) => n + x, 0);
      next.shareDone = next.n === m.build.goal && next.counts.every((n) => n === 4);
      next.done = false;
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
    next.msg = '';
    if (m.build.kind === 'pvadd') { // 34 + 25: add 2 tens and 5 ones to the chart
      if ((action === 'ten' || action === 'tap') && next.t < 2) next.t++;
      else if ((action === 'one' || action === 'tap') && next.o < 5) next.o++;
      next.n = next.t + next.o; next.done = next.n === m.build.goal;
      return next;
    }
    if (m.build.kind === 'unbundle') { // 52 − 27: unbundle a ten, then take away 7 ones and 2 tens
      if (!next.unb) {
        if (action === 'ten' || action === 'tap') next.unb = true;
        else if (action === 'one') next.msg = 'There are only 2 ones. Unbundle a ten first!';
      } else if ((action === 'one' || action === 'tap') && next.ones < 7) next.ones++;
      else if ((action === 'ten' || action === 'tap') && next.tens < 2) next.tens++;
      next.n = (next.unb ? 1 : 0) + next.ones + next.tens; next.done = next.n === m.build.goal;
      return next;
    }
    if (m.build.kind === 'bundle2' || m.build.kind === 'zeros') { // two steps in order: ones then tens (adding), a hundred then a ten (zeros)
      const [first, second] = m.build.kind === 'bundle2' ? ['ones', 'tens'] : ['hundred', 'ten'];
      if (next.step === 0 && (action === first || action === 'tap')) next.step = 1;
      else if (next.step === 1 && (action === second || action === 'tap')) next.step = 2;
      else if (next.step === 0 && action === second) next.msg = m.build.kind === 'bundle2' ? 'Start with the ones: bundle 10 ones first.' : 'There are no tens yet. Unbundle a hundred first.';
      next.n = next.step; next.done = next.step === 2;
      return next;
    }
    next.n = Math.min(m.build.goal, next.n + 1); next.done = next.n >= m.build.goal; // tenframe, bundle, jumps, double: one tap each
    return next;
  };

  MQ.lessons = L;
})();
