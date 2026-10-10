// Logic Lab: reasoning puzzles that school math topics do not cover, and that Math Kangaroo and CogAT reward.
//   lg_order      who is tallest / where everyone stands in a line, from clues
//   lg_whois      who has which pet (or fruit, shirt, sport): cross out what is impossible
//   lg_truth      Yes / No / Can't tell: all, some, none, if…then, only
//   lg_situation  everyday situations: what happens next, why, what must be true, best plan
//   lg_count      counting all the ways and "to be sure" (worst case) puzzles
//   lg_liars      truth-tellers and fibbers
// Every puzzle is a choice question with an explanation. Clue puzzles are built from a hidden answer and
// checked by trying every possibility, so each one has exactly one solution.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U;
  const { C } = MQ.G;
  const { rnd, pick, chance, shuffle } = U;

  const KIDS = ['Ann', 'Ben', 'Cara', 'Dan', 'Eva', 'Finn', 'Gia', 'Hugo', 'Iris', 'Jack', 'Kira', 'Liam', 'Mia', 'Noah', 'Owen', 'Pia'];
  const kids = (n) => U.sample(KIDS, n);
  const list = (clues) => `<ol class="clues">${clues.map((c) => `<li>${c}</li>`).join('')}</ol>`;
  const speech = (...parts) => parts.join(' ');
  // All orderings of an array (n ≤ 5).
  function perms(a) {
    if (a.length <= 1) return [a.slice()];
    const out = [];
    a.forEach((x, i) => { for (const p of perms([...a.slice(0, i), ...a.slice(i + 1)])) out.push([x, ...p]); });
    return out;
  }
  // Keep adding true clues until exactly one world fits, then drop clues that are not needed.
  function enough(worlds, clues, holds, minClues = 1) {
    const fit = (cs) => worlds.filter((w) => cs.every((c) => holds(c, w)));
    const used = [];
    for (const c of clues) {
      if (fit(used).length === 1) break;
      if (fit([...used, c]).length < fit(used).length) used.push(c);
    }
    if (fit(used).length !== 1) return null;
    for (let i = used.length - 1; i >= 0; i--) {
      if (used.length <= minClues) break;
      const less = used.filter((_, k) => k !== i);
      if (fit(less).length === 1) used.splice(i, 1);
    }
    return used;
  }
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];

  // ---------------- 1. Order from clues ----------------
  const SCALES = [
    { more: 'taller', less: 'shorter', most: 'tallest', least: 'shortest', kind: 'tall' },
    { more: 'older', less: 'younger', most: 'oldest', least: 'youngest', kind: 'old' },
    { more: 'faster', less: 'slower', most: 'fastest', least: 'slowest', kind: 'fast' },
    { more: 'heavier', less: 'lighter', most: 'heaviest', least: 'lightest', kind: 'heavy' },
  ];
  function lg_order(d) {
    if (d <= 3) { // compare: rank 0 is the most
      const n = d === 3 ? 4 : 3, sc = d === 1 ? SCALES[0] : pick(SCALES), names = kids(n);
      const worlds = perms(names);
      const truth = names; // names[0] is the most
      const pairs = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([truth[i], truth[j]]);
      const cands = shuffle(pairs).map(([a, b]) => (d === 1 || chance(0.5) ? { a, b, t: `${a} is ${sc.more} than ${b}.` } : { a, b, t: `${b} is ${sc.less} than ${a}.` }));
      const used = enough(worlds, cands, (c, w) => w.indexOf(c.a) < w.indexOf(c.b), n - 1);
      if (!used) return lg_order(d);
      let q, ans;
      const r = d === 1 ? pick([0, n - 1]) : d === 2 ? rnd(0, 2) : rnd(0, 3);
      if (r === 0) { q = `Who is the ${sc.most}?`; ans = truth[0]; }
      else if (r === n - 1) { q = `Who is the ${sc.least}?`; ans = truth[n - 1]; }
      else { q = n === 3 ? `Who is in the middle (not the ${sc.most} and not the ${sc.least})?` : `Who is the ${ORD[r]} ${sc.most}?`; ans = truth[r]; }
      const order = truth.join(', ');
      return C(`${list(used.map((c) => c.t))}${q}`, ans, shuffle(names), {
        wordy: true, say: speech(...used.map((c) => c.t), q),
        hint: `Put the names in a row from ${sc.most} to ${sc.least}, one clue at a time.`,
        explain: `From ${sc.most} to ${sc.least}: ${order}.`,
      });
    }
    // standing in a line, front to back
    const n = d === 4 ? 4 : 5, names = kids(n), truth = shuffle(names), worlds = perms(names);
    const pos = (w, x) => w.indexOf(x);
    const cands = [];
    for (const a of names) for (const b of names) {
      if (a === b) continue;
      if (pos(truth, a) === pos(truth, b) + 1) cands.push({ t: `${a} is right behind ${b}.`, f: (w) => pos(w, a) === pos(w, b) + 1 });
      if (pos(truth, a) < pos(truth, b)) cands.push({ t: `${a} is somewhere in front of ${b}.`, f: (w) => pos(w, a) < pos(w, b) });
    }
    for (const a of names) {
      if (pos(truth, a) !== 0) cands.push({ t: `${a} is not first.`, f: (w) => pos(w, a) !== 0 });
      if (pos(truth, a) !== n - 1) cands.push({ t: `${a} is not last.`, f: (w) => pos(w, a) !== n - 1 });
    }
    if (chance(0.6)) { const a = truth[0]; cands.push({ t: `${a} is first in line.`, f: (w) => w[0] === a, first: a }); }
    if (d === 5) for (let i = 1; i < n - 1; i++) {
      const [x, m, y] = [truth[i - 1], truth[i], truth[i + 1]];
      cands.push({ t: `${m} stands between ${x} and ${y}.`, f: (w) => Math.abs(pos(w, x) - pos(w, y)) === 2 && pos(w, m) === (pos(w, x) + pos(w, y)) / 2 });
    }
    const used = enough(worlds, shuffle(cands), (c, w) => c.f(w), 3);
    if (!used || used.length > (d === 4 ? 5 : 6)) return lg_order(d);
    const named = used.filter((c) => c.first).map((c) => c.first);
    const r = pick(U.range(1, n - 1).filter((i) => !named.includes(truth[i])));
    const q = `Who is ${ORD[r]} in line?`;
    return C(`${n} kids stand in a line, one behind the other.${list(used.map((c) => c.t))}${q}`, truth[r], shuffle(names), {
      wordy: true, say: speech(`${n} kids stand in a line.`, ...used.map((c) => c.t), q),
      hint: 'Draw the line with empty spots. Start with the clue that tells you the most.',
      explain: `From front to back: ${truth.join(', ')}.`,
    });
  }

  // ---------------- 2. Who has what ----------------
  const SETS = [
    { items: [['cat', '🐱'], ['dog', '🐶'], ['fish', '🐟'], ['bird', '🐦']], intro: 'Each kid has a different pet.', pos: (p, i) => `${p} has the ${i}.`, neg: (p, i) => `${p} does not have the ${i}.`, who: (i) => `Who has the ${i}?`, what: (p) => `Which pet does ${p} have?` },
    { items: [['apple', '🍎'], ['banana', '🍌'], ['pear', '🍐'], ['orange', '🍊']], intro: 'Each kid eats a different fruit.', pos: (p, i) => `${p} eats the ${i}.`, neg: (p, i) => `${p} does not eat the ${i}.`, who: (i) => `Who eats the ${i}?`, what: (p) => `Which fruit does ${p} eat?` },
    { items: [['red shirt', '🔴'], ['blue shirt', '🔵'], ['green shirt', '🟢'], ['yellow shirt', '🟡']], intro: 'Each kid wears a different shirt.', pos: (p, i) => `${p} wears the ${i}.`, neg: (p, i) => `${p} does not wear the ${i}.`, who: (i) => `Who wears the ${i}?`, what: (p) => `Which shirt does ${p} wear?` },
    { items: [['soccer', '⚽'], ['tennis', '🎾'], ['basketball', '🏀'], ['baseball', '⚾']], intro: 'Each kid plays a different sport.', pos: (p, i) => `${p} plays ${i}.`, neg: (p, i) => `${p} does not play ${i}.`, who: (i) => `Who plays ${i}?`, what: (p) => `Which sport does ${p} play?` },
  ];
  function lg_whois(d) {
    const n = d <= 3 ? 3 : 4, set = pick(SETS), names = kids(n), items = U.sample(set.items, n);
    const truth = shuffle(items.map((_, i) => i)); // truth[k] = item index of kid k
    const worlds = perms(items.map((_, i) => i));
    const cands = [];
    names.forEach((p, k) => items.forEach(([it, em], i) => {
      if (truth[k] === i) cands.push({ t: `${em} ${set.pos(p, it)}`, pos: true, k, i });
      else cands.push({ t: `${em} ${set.neg(p, it)}`, pos: false, k, i });
    }));
    const pool = shuffle(cands), posOk = d <= 3 ? 1 : 0; // harder levels give only "does not" clues
    const ordered = [...pool.filter((c) => c.pos).slice(0, posOk), ...pool.filter((c) => !c.pos)];
    const used = enough(worlds, ordered, (c, w) => (w[c.k] === c.i) === c.pos, 2);
    if (!used || used.length > (n === 3 ? 4 : 7)) return lg_whois(d);
    const told = new Set(used.filter((c) => c.pos).map((c) => c.k));
    const k = pick(names.map((_, i) => i).filter((i) => !told.has(i)));
    const [it, em] = items[truth[k]];
    const solved = names.map((p, i) => `${p}: ${items[truth[i]][1]} ${items[truth[i]][0]}`).join(', ');
    const clueText = shuffle(used).map((c) => c.t);
    const base = { wordy: true, hint: 'Make a little table: kids down the side, things across the top. Cross out every "does not".', explain: solved + '.' };
    if (chance(0.5)) {
      const q = set.who(it);
      return C(`${set.intro}${list(clueText)}${em} ${q}`, names[k], shuffle(names), Object.assign(base, { say: speech(set.intro, ...clueText, q) }));
    }
    const q = set.what(names[k]);
    const labels = items.map(([x, e]) => `${e} ${x}`);
    return C(`${set.intro}${list(clueText)}${q}`, `${em} ${it}`, shuffle(labels), Object.assign(base, { say: speech(set.intro, ...clueText, q) }));
  }

  // ---------------- 3. Yes / No / Can't tell ----------------
  const YNC = ['Yes', 'No', "Can't tell"];
  const yn = (text, ans, explain, hint) => C(text, ans, YNC, { wordy: true, explain, hint: hint || 'Use only what the sentences say, not what usually happens.' });
  const THINGS = [['balls', 'ball'], ['marbles', 'marble'], ['socks', 'sock'], ['cookies', 'cookie'], ['crayons', 'crayon'], ['blocks', 'block'], ['buttons', 'button'], ['shells', 'shell']];
  const BOXES = ['box', 'bag', 'basket', 'jar', 'drawer'];
  const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'white'];
  const RULES = [
    { rule: 'If it rains, {N} takes an umbrella.', isIf: 'It is raining.', notIf: 'It is not raining.', isThen: '{N} took an umbrella.', notThen: '{N} did not take an umbrella.', qIf: 'Is it raining?', qThen: 'Does {N} take an umbrella?' },
    { rule: 'If the bell rings, the robot dances.', isIf: 'The bell is ringing.', notIf: 'The bell is not ringing.', isThen: 'The robot is dancing.', notThen: 'The robot is not dancing.', qIf: 'Is the bell ringing?', qThen: 'Does the robot dance?' },
    { rule: 'If {N} wears the blue cap, {N} plays soccer.', isIf: '{N} is wearing the blue cap.', notIf: '{N} is not wearing the blue cap.', isThen: '{N} is playing soccer.', notThen: '{N} is not playing soccer.', qIf: 'Is {N} wearing the blue cap?', qThen: 'Does {N} play soccer?' },
    { rule: 'If it is Tuesday, {N} goes swimming.', isIf: 'Today is Tuesday.', notIf: 'Today is not Tuesday.', isThen: '{N} went swimming today.', notThen: '{N} did not go swimming today.', qIf: 'Is today Tuesday?', qThen: 'Does {N} go swimming today?' },
    { rule: 'If the parrot sees a banana, it sings.', isIf: 'The parrot sees a banana.', notIf: 'The parrot does not see a banana.', isThen: 'The parrot is singing.', notThen: 'The parrot is not singing.', qIf: 'Does the parrot see a banana?', qThen: 'Does the parrot sing?' },
    { rule: 'If {N} plays the drum, the baby wakes up.', isIf: '{N} is playing the drum.', notIf: '{N} is not playing the drum.', isThen: 'The baby woke up.', notThen: 'The baby did not wake up.', qIf: 'Is {N} playing the drum?', qThen: 'Does the baby wake up?' },
    { rule: 'If it snows, the school is closed.', isIf: 'It is snowing.', notIf: 'It is not snowing.', isThen: 'The school is closed.', notThen: 'The school is open.', qIf: 'Is it snowing?', qThen: 'Is the school closed?' },
    { rule: 'If the green light is on, the toy train moves.', isIf: 'The green light is on.', notIf: 'The green light is off.', isThen: 'The toy train is moving.', notThen: 'The toy train is not moving.', qIf: 'Is the green light on?', qThen: 'Does the toy train move?' },
    { rule: 'If {N} finds a shell, {N} puts it in a bucket.', isIf: '{N} found a shell.', notIf: '{N} did not find a shell.', isThen: 'There is a shell in the bucket.', notThen: 'The bucket is empty.', qIf: 'Did {N} find a shell?', qThen: 'Is there a shell in the bucket?' },
  ];
  const WORDS = ['bloops', 'zibs', 'razzles', 'fips', 'gloms', 'wugs', 'snorks', 'tazzles', 'mibs', 'quorps', 'dax', 'blicks'];
  const CREATURES = ['Zog', 'Mip', 'Tib', 'Quark', 'Bix', 'Lulu', 'Pim', 'Rook'];
  const one = (w) => (w.endsWith('x') ? w : w.slice(0, -1)); // bloops → bloop, dax → dax
  function lg_truth(d) {
    const N = pick(KIDS), [pl, sg] = pick(THINGS), box = pick(BOXES), [p, p2] = U.sample(COLORS, 2);
    const f = (s) => s.replace(/\{N\}/g, N);
    const forms = [];
    if (d <= 2) { // all / none
    forms.push(() => yn(`All the ${pl} in the ${box} are ${p}. ${N} takes a ${sg} from the ${box}. Is it ${p}?`, 'Yes', `Every ${sg} in the ${box} is ${p}, so this one is too.`));
    forms.push(() => yn(`None of the ${pl} in the ${box} are ${p}. ${N} takes a ${sg} from the ${box}. Is it ${p}?`, 'No', `No ${sg} in the ${box} is ${p}.`));
    forms.push(() => yn(`All the ${pl} in the ${box} are ${p}. Is there a ${p2} ${sg} in the ${box}?`, 'No', `They are all ${p}, so none can be ${p2}.`));
    }
    if (d === 2) { // some, and turning a sentence around
      forms.push(() => yn(`Some of the ${pl} in the ${box} are ${p}. ${N} takes a ${sg} from the ${box}. Is it ${p}?`, "Can't tell", `Only some are ${p}: ${N} may have picked a ${p} one or a different one.`));
      forms.push(() => yn(`All the ${pl} in the ${box} are ${p}. ${N} has a ${p} ${sg}. Did it come from the ${box}?`, "Can't tell", `${p[0].toUpperCase() + p.slice(1)} ${pl} can be in other places too.`));
      forms.push(() => yn(`The ${box} has only ${p} ${pl} and ${p2} ${pl}. ${N} takes one that is not ${p}. Is it ${p2}?`, 'Yes', `There are only two colors. Not ${p} means ${p2}.`));
    }
    if (d === 3) { // if… then
      const r = pick(RULES), rule = f(r.rule);
      forms.push(() => yn(`${rule} ${f(r.isIf)} ${f(r.qThen)}`, 'Yes', `The rule says exactly this: ${rule}`, 'Read the "if" part and the "then" part separately.'));
      forms.push(() => yn(`${rule} ${f(r.notThen)} ${f(r.qIf)}`, 'No', `If the "if" part were true, the "then" part would have happened. It did not, so the "if" part is not true.`, 'Read the "if" part and the "then" part separately.'));
      forms.push(() => yn(`${rule} ${f(r.isThen)} ${f(r.qIf)}`, "Can't tell", `The rule does not say this is the only reason. It could have happened for another reason.`, 'Read the "if" part and the "then" part separately.'));
      forms.push(() => yn(`${rule} ${f(r.notIf)} ${f(r.qThen)}`, "Can't tell", `The rule only tells what happens when the "if" part is true. Here it is not, so we don't know.`, 'Read the "if" part and the "then" part separately.'));
    }
    if (d === 4) { // made-up words, so only the sentences count
      const [A, B, Cw] = U.sample(WORDS, 3), Z = pick(CREATURES);
      const art = (w) => ('aeiou'.includes(w[0]) ? 'an ' : 'a ') + one(w);
      const H = 'These are made-up words. Use only the sentences: draw circles inside circles if it helps.';
      forms.push(() => yn(`All ${A} are ${B}. All ${B} are ${Cw}. Is every ${one(A)} ${art(Cw)}?`, 'Yes', `${A} are inside ${B}, and ${B} are inside ${Cw}.`, H));
      forms.push(() => yn(`All ${A} are ${B}. All ${B} are ${Cw}. Is every ${one(Cw)} ${art(A)}?`, "Can't tell", `There may be ${Cw} that are not ${A}.`, H));
      forms.push(() => yn(`All ${A} are ${B}. No ${B} are ${Cw}. Can ${art(A)} be ${art(Cw)}?`, 'No', `Every ${one(A)} is ${art(B)}, and no ${one(B)} is ${art(Cw)}.`, H));
      forms.push(() => yn(`All ${A} are ${B}. ${Z} is ${art(A)}. Is ${Z} ${art(B)}?`, 'Yes', `${Z} is ${art(A)}, and all ${A} are ${B}.`, H));
      forms.push(() => yn(`All ${A} are ${B}. ${Z} is ${art(B)}. Is ${Z} ${art(A)}?`, "Can't tell", `Some ${B} may not be ${A}.`, H));
      forms.push(() => yn(`No ${A} are ${B}. ${Z} is ${art(B)}. Is ${Z} ${art(A)}?`, 'No', `${Z} is ${art(B)}, and no ${one(B)} can be ${art(A)}.`, H));
      forms.push(() => yn(`Some ${A} are ${B}. All ${B} are ${Cw}. Is every ${one(A)} ${art(Cw)}?`, "Can't tell", `Only the ${A} that are ${B} must be ${Cw}. We know nothing about the other ${A}.`, H));
    }
    if (d === 5) { // only, except, either… or, longer chains
      const [A, B, Cw, D] = U.sample(WORDS, 4), Z = pick(CREATURES), M = pick(KIDS.filter((k) => k !== N));
      const art = (w) => ('aeiou'.includes(w[0]) ? 'an ' : 'a ') + one(w);
      forms.push(() => yn(`Only kids with a ticket can ride the train. ${N} is riding the train. Does ${N} have a ticket?`, 'Yes', 'Nobody without a ticket can ride, so a rider must have one.'));
      forms.push(() => yn(`Only kids with a ticket can ride the train. ${N} has a ticket. Is ${N} riding the train?`, "Can't tell", `A ticket lets ${N} ride, but ${N} may not be riding.`));
      forms.push(() => yn(`Every kid in the club has a cat or a dog, or both. ${N} is in the club and has no cat. Does ${N} have a dog?`, 'Yes', `${N} must have one of them, and it is not a cat.`));
      forms.push(() => yn(`Not all ${A} are ${B}. ${Z} is ${art(A)}. Is ${Z} ${art(B)}?`, "Can't tell", `Some ${A} are ${B} and some are not. ${Z} could be either.`));
      forms.push(() => yn(`All ${A} are ${B}, except ${Z}. ${Z} is ${art(A)}. Is ${Z} ${art(B)}?`, 'No', `${Z} is the one ${one(A)} that is not ${art(B)}.`));
      forms.push(() => yn(`All ${A} are ${B}. All ${B} are ${Cw}. All ${Cw} are ${D}. ${Z} is ${art(A)}. Is ${Z} ${art(D)}?`, 'Yes', `${A} → ${B} → ${Cw} → ${D}: each one is inside the next.`));
      forms.push(() => yn(`No ${A} are ${B}. All ${Cw} are ${A}. Can ${art(Cw)} be ${art(B)}?`, 'No', `Every ${one(Cw)} is ${art(A)}, and no ${one(A)} is ${art(B)}.`));
      forms.push(() => yn(`${N} always wins at checkers against ${M}. ${M} always wins against Pat. Did ${N} play Pat today?`, "Can't tell", `The sentences say nothing about a game today between ${N} and Pat.`));
      forms.push(() => yn(`Everyone who finished the puzzle got a star. ${M} did not get a star. Did ${M} finish the puzzle?`, 'No', `If ${M} had finished, ${M} would have a star.`));
    }
    return pick(forms)();
  }

  // ---------------- 4. Everyday situations ----------------
  // [question, answer, three wrong answers, explanation]. {N} and {M} are kids' names.
  const SIT = {
    1: [
      ['{N} leaves an ice cream in the hot sun. What will happen to it?', 'It will melt', ['It will grow bigger', 'It will turn into a cake', 'It will get colder'], 'Heat makes ice cream melt.'],
      ['{N} plants a seed and waters it every day. What will happen?', 'A plant will grow', ['The seed will fly away', 'The seed will turn into a rock', 'The seed will get smaller every day'], 'Seeds need water to grow into plants.'],
      ['It is raining hard. {N} wants to go outside. What should {N} take?', 'An umbrella', ['Sunglasses', 'A sled', 'A swimsuit'], 'An umbrella keeps you dry in the rain.'],
      ['{N} drops a glass cup on a hard floor. What will most likely happen?', 'It will break', ['It will bounce like a ball', 'It will float up', 'It will grow'], 'Glass is hard but breaks easily.'],
      ['{N} sees the sun going down and the sky getting dark. What comes next?', 'Night', ['Morning', 'Lunch time', 'Noon'], 'After the sun goes down, it is night.'],
      ['{N} puts on a coat, a hat and mittens. What is the weather most likely like?', 'Cold', ['Hot', 'Warm', 'Very sunny and hot'], 'We wear warm clothes when it is cold.'],
      ['{N}’s puppy has an empty bowl and keeps looking at it. What does the puppy most likely want?', 'Food', ['A bath', 'A book', 'A hat'], 'An empty food bowl means the puppy is hungry.'],
      ['{N} has wet hands after washing them. What should {N} use?', 'A towel', ['A pillow', 'A spoon', 'A crayon'], 'A towel dries your hands.'],
      ['The ground is wet and there are puddles everywhere. What most likely happened?', 'It rained', ['It was very hot and dry', 'The wind blew the puddles in', 'Nothing happened'], 'Rain makes the ground wet and leaves puddles.'],
      ['{N} lets go of a balloon filled with helium. Where will it go?', 'Up into the sky', ['Down to the ground', 'Into a hole', 'Under the table'], 'Helium balloons float up.'],
      ['{N} is the last one in line. How many kids are behind {N}?', 'None', ['One', 'Two', 'All of them'], 'Last means nobody is behind.'],
      ['{N} forgot to put the milk back in the fridge, and it stayed out all day. What is most likely true?', 'The milk is warm now', ['The milk is frozen', 'The milk turned into juice', 'The milk is colder than before'], 'Things left out of the fridge warm up.'],
    ],
    2: [
      ['{N} put on socks, then shoes. Then {N} tied the laces. What did {N} do first?', 'Put on socks', ['Put on shoes', 'Tied the laces', 'Took off the shoes'], 'The first thing in the story was putting on socks.'],
      ['{N} wakes up, brushes teeth, eats breakfast, then goes to school. What does {N} do just before going to school?', 'Eats breakfast', ['Wakes up', 'Brushes teeth', 'Goes to bed'], 'Breakfast is the step right before school.'],
      ['A cake needs 30 minutes in the oven. {N} took it out after 5 minutes. What is most likely true?', 'The cake is not ready yet', ['The cake is burnt', 'The cake is baked just right', 'The cake is frozen'], '5 minutes is much less than 30 minutes.'],
      ['{N}’s toy car runs on batteries. The batteries are empty. What happens when {N} turns it on?', 'It does not move', ['It goes faster', 'It flies', 'It plays music'], 'Without power the car cannot move.'],
      ['{N}’s shoes are muddy and wet. Where has {N} most likely been?', 'Outside in the rain', ['Reading in the library', 'Sleeping in bed', 'Sitting on the couch'], 'Mud and water are outside, especially after rain.'],
      ['The library opens at 10 o’clock. {N} gets there at 9 o’clock. What will {N} have to do?', 'Wait 1 hour', ['Go in right away', 'Wait 10 hours', 'Wait 9 hours'], 'From 9 to 10 o’clock is 1 hour.'],
      ['{N} and {M} sit on a seesaw. {N} is much heavier. What will happen?', '{N}’s side goes down', ['{M}’s side goes down', 'It stays flat', 'Both sides go up'], 'The heavier side of a seesaw goes down.'],
      ['{N} fills a cup to the very top with water and then drops in a big ice cube. What happens?', 'Some water spills over', ['The cup gets emptier', 'Nothing changes', 'The water gets hot'], 'The ice cube takes up room, so water spills.'],
      ['{N} has 3 cookies and gives all of them away. How many cookies does {N} have now?', 'None', ['3', '6', '1'], 'Giving all of them away leaves none.'],
      ['A store is closed on Sundays. Today is Sunday. Can {N} buy milk at that store today?', 'No, the store is closed', ['Yes, any time', 'Only in the morning', 'Only if it rains'], 'Closed on Sundays means no shopping today.'],
      ['{N} sees fresh footprints in the snow going to the front door. What can {N} tell?', 'Someone walked to the door', ['It is summer', 'Nobody has been there', 'The door is made of snow'], 'Footprints show that someone walked there.'],
      ['{N} is in bed with a cold and a high fever. What is the best thing to do?', 'Rest and see a doctor', ['Run a race', 'Go swimming in a cold lake', 'Stay up all night'], 'When you are sick, your body needs rest and a doctor’s help.'],
    ],
    3: [
      ['{N} is older than {M}. {M} is 7 years old. Which could be {N}’s age?', '9', ['5', '6', '7'], 'Older than 7 means more than 7. Only 9 is more than 7.'],
      ['Every kid in {N}’s class has a backpack. {M} is in {N}’s class. What must be true?', '{M} has a backpack', ['{M} has two backpacks', '{M} has no backpack', '{M}’s backpack is red'], 'Every kid in the class has one, and {M} is in the class.'],
      ['{N} must be at school at 8:00. The walk takes 20 minutes. What is the latest time {N} can leave home?', '7:40', ['8:20', '8:00', '7:50'], '20 minutes before 8:00 is 7:40.'],
      ['{N} had a red, a blue and a green crayon. {N} lost the red one and gave away the blue one. Which crayon does {N} have now?', 'Green', ['Red', 'Blue', 'None'], 'Red is lost, blue is given away, green is left.'],
      ['A bus comes every 15 minutes. One just left as {N} arrived. What is the longest {N} will wait?', '15 minutes', ['1 hour', '5 minutes', 'No time at all'], 'The next bus comes 15 minutes after the last one.'],
      ['{N} is on page 20 of a book. Yesterday {N} was on page 10. What happened?', '{N} read 10 pages since yesterday', ['{N} read 30 pages', '{N} went backwards', '{N} did not read'], 'From page 10 to page 20 is 10 pages.'],
      ['There are 4 chairs and 6 kids. Everyone wants to sit. What is the problem?', '2 kids will have no chair', ['There are 2 extra chairs', 'Everyone has a chair', '4 kids will have no chair'], '6 kids − 4 chairs = 2 kids without a chair.'],
      ['{N} wants to make a sandwich. What should {N} do first?', 'Get the bread', ['Eat the sandwich', 'Wash the plate after eating', 'Cut the sandwich in half'], 'You need bread before you can make the sandwich.'],
      ['People outside have umbrellas and the street is wet. What should {N} wear to go out?', 'A raincoat', ['A swimsuit', 'Shorts and sandals', 'Only sunglasses'], 'Umbrellas and a wet street mean it is raining.'],
      ['{N} has $5. A toy costs $8. What can {N} do to buy it?', 'Save $3 more', ['Buy it now', 'Save $8 more', 'Give away the $5'], '$8 − $5 = $3 more is needed.'],
      ['{N} turns on a lamp, but it does not light. The lamp is plugged in. What is a good next step?', 'Check the light bulb', ['Paint the lamp', 'Close the window', 'Water the lamp'], 'A burnt-out bulb is a common reason a plugged-in lamp does not light.'],
      ['{N}’s birthday is in 3 days. Today is Monday. On which day is the birthday?', 'Thursday', ['Wednesday', 'Friday', 'Tuesday'], 'Tuesday, Wednesday, Thursday: 3 days after Monday.'],
    ],
    4: [
      ['{N} and {M} each picked a number. {N}’s number is 2 more than {M}’s. Together they make 10. What is {N}’s number?', '6', ['4', '5', '8'], '6 + 4 = 10, and 6 is 2 more than 4.'],
      ['Three friends sit on a bench. {N} is not on the left end. {M} is in the middle. Where is {N}?', 'On the right end', ['On the left end', 'In the middle', 'Not on the bench'], '{M} takes the middle and {N} is not on the left, so {N} is on the right.'],
      ['{N} only eats apples that are red. {N} is eating an apple. What color is it?', 'Red', ['Green', 'Yellow', 'It could be any color'], '{N} eats only red apples.'],
      ['{N} walks 5 blocks north, then 5 blocks south. Where is {N} now?', 'Back where {N} started', ['10 blocks north', '5 blocks south of the start', '5 blocks east'], 'Walking back the same distance brings you to the start.'],
      ['A frog climbs 3 steps up a ladder, then slides 1 step down. It does this twice. On which step is it now?', 'Step 4', ['Step 6', 'Step 2', 'Step 5'], 'Each time it gets 3 − 1 = 2 steps higher: 2 + 2 = 4.'],
      ['{N}’s team played 9 games, with no ties, and won more games than it lost. Which could be true?', 'They won 5 games', ['They won 4 games', 'They lost 5 games', 'They won 3 games'], 'Won 5 and lost 4: more wins than losses. The others have more losses.'],
      ['In a race {N} finished before {M} but after Pat. Who won of the three?', 'Pat', ['{N}', '{M}', 'Nobody'], 'Pat was before {N}, and {N} was before {M}.'],
      ['A box has only red and blue balls, and it is not empty. {N} says truthfully: “There is no red ball in the box.” What do we know?', 'All the balls are blue', ['All the balls are red', 'Some are red and some are blue', 'The box is empty'], 'No red balls, and only red or blue are possible.'],
      ['Yesterday was Friday. What day will it be tomorrow?', 'Sunday', ['Saturday', 'Monday', 'Thursday'], 'Yesterday Friday → today Saturday → tomorrow Sunday.'],
      ['{N} stands in a line with 3 kids in front and 3 kids behind. How many kids are in the line?', '7', ['6', '3', '8'], '3 in front + {N} + 3 behind = 7. Don’t forget {N}!'],
      ['A cat, a dog and a bird are in three different rooms: the kitchen, the hall and the garden. The bird is not in the garden and not in the hall. Where is the bird?', 'The kitchen', ['The garden', 'The hall', 'We can’t tell'], 'The only room left for the bird is the kitchen.'],
      ['{N} is taller than {M}, and {M} is taller than Pat. Is Pat taller than {N}?', 'No, Pat is the shortest', ['Yes', 'They are the same height', 'We can’t tell'], '{N} > {M} > Pat, so Pat is shorter than {N}.'],
    ],
    5: [
      ['It takes 5 minutes to boil 1 egg. How long does it take to boil 3 eggs in the same pot at the same time?', '5 minutes', ['15 minutes', '10 minutes', '3 minutes'], 'They all boil together, so it still takes 5 minutes.'],
      ['A log is cut into 4 pieces. Each cut takes 2 minutes. How long does all the cutting take?', '6 minutes', ['8 minutes', '4 minutes', '2 minutes'], '4 pieces need only 3 cuts: 3 × 2 = 6 minutes.'],
      ['{N} has 2 brothers and 2 sisters. How many children are in the family?', '5', ['4', '6', '3'], '2 brothers + 2 sisters + {N} = 5.'],
      ['The day before yesterday was Monday. What day is it today?', 'Wednesday', ['Tuesday', 'Thursday', 'Saturday'], 'Monday → Tuesday (yesterday) → Wednesday (today).'],
      ['There are 10 kids in a room. 6 like soccer and 7 like basketball. Everyone likes at least one. How many like both?', '3', ['1', '13', '4'], '6 + 7 = 13, but there are only 10 kids, so 3 were counted twice.'],
      ['A snail climbs a 5-foot wall. Every day it goes up 2 feet, and every night it slides down 1 foot. On which day does it reach the top?', 'Day 4', ['Day 5', 'Day 3', 'Day 2'], 'Mornings it starts at 0, 1, 2, 3 feet. On day 4 it climbs from 3 to 5 feet.'],
      ['{N} is 6. {M} is twice as old as {N}. How old will {M} be in 2 years?', '14', ['12', '16', '8'], '{M} is 12 now, and 12 + 2 = 14.'],
      ['Which is heavier: a pound of feathers or a pound of rocks?', 'They weigh the same', ['The rocks', 'The feathers', 'We can’t tell'], 'A pound is a pound!'],
      ['At the first bus stop, 3 people got off and 2 got on. Now there are 9 people on the bus. How many were on it before the stop?', '10', ['9', '8', '14'], 'Go backwards: 9 − 2 + 3 = 10.'],
      ['In a photo there are 2 dads and 2 sons, but only 3 people. How can that be?', 'Grandpa, dad and son', ['Two dads and one son', 'It is impossible', 'Two sons and one baby'], 'The dad in the middle is also a son of the grandpa.'],
      ['Eight kids stand in a circle. Each kid holds hands with the kid on each side. How many pairs of hands are joined?', '8', ['16', '7', '4'], 'In a circle there are as many joins as kids: 8.'],
      ['{N} wrote all the numbers from 1 to 20. How many times did {N} write the digit 1?', '12', ['11', '10', '2'], '1, 10, 11 (twice), 12–19 (8 times): 1 + 1 + 2 + 8 = 12.'],
    ],
  };
  function lg_situation(d) {
    const [N, M] = kids(2);
    const f = (s) => s.replace(/\{N\}/g, N).replace(/\{M\}/g, M);
    const [q, ans, wrong, ex] = pick(SIT[d]);
    const text = f(q), choices = shuffle([ans, ...wrong].map(f));
    return C(text, f(ans), choices, { wordy: true, say: text, hint: 'Picture it in your head. What makes the most sense?', explain: f(ex) });
  }

  // ---------------- 5. Counting the ways, and "to be sure" ----------------
  const PAIRS = [
    ['shirts', 'pairs of shorts', 'outfit of one shirt and one pair of shorts'],
    ['hats', 'scarves', 'set of one hat and one scarf'],
    ['kinds of bread', 'kinds of cheese', 'sandwich with one bread and one cheese'],
    ['ice cream flavors', 'kinds of cones', 'ice cream with one flavor in one cone'],
    ['cups', 'straws', 'drink with one cup and one straw'],
  ];
  const nc = (text, ans, near, o) => C(text, ans, U.numChoices(ans, near, 4).sort((a, b) => a - b), Object.assign({ wordy: true, say: text }, o));
  const games = (n) => (n * (n - 1)) / 2;
  function lg_count(d) {
    const N = pick(KIDS);
    const outfits = (lo, hi) => {
      const [a1, b1, what] = pick(PAIRS), a = rnd(lo, hi), b = rnd(lo, hi);
      return nc(`${N} has ${a} ${a1} and ${b} ${b1}. How many different kinds of ${what} can ${N} make?`, a * b, [a + b, a * b + 1, a * b - 1, a + b + 1], { hint: `For each one of the ${a1}, count how many ${b1} go with it.`, explain: `${a} × ${b} = ${a * b}: each of the ${a} ${a1} goes with ${b} ${b1}.` });
    };
    const shake = (n) => nc(`${n} friends meet, and every two of them shake hands once. How many handshakes are there?`, games(n), [n, n * (n - 1), games(n) + 1, n + 1], { hint: 'Let the first friend shake everyone’s hand, then the second friend shakes hands with the rest…', explain: `${U.range(1, n - 1).reverse().join(' + ')} = ${games(n)}.` });
    const lineup = (n) => { const names = kids(n), ans = [1, 1, 2, 6, 24][n]; return nc(`${names.join(', ')} line up for a photo. In how many different orders can they stand?`, ans, [n * n, n + 1, ans - 1, ans + 2, ans * 2], { hint: 'How many kids can be first? Then how many can be second?', explain: `${U.range(1, n).reverse().join(' × ')} = ${ans}.` }); };
    const digits = (k, rep) => {
      const ds = U.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], k).sort((a, b) => a - b), ans = rep ? k * k : k * (k - 1);
      return nc(`Use the digits ${ds.join(', ')} to make two-digit numbers${rep ? ' (a digit may be used twice, like ' + ds[0] + ds[0] + ')' : ' (each digit at most once in a number)'}. How many different numbers can you make?`, ans, [k * k, k * (k - 1), k * 2, ans + 1], { hint: 'Pick the tens digit first, then count the ones digits that can go with it.', explain: `${k} choices for the tens × ${rep ? k : k - 1} for the ones = ${ans}.` });
    };
    const league = (n) => nc(`${n} teams play a tournament. Every team plays every other team once. How many games are played?`, games(n), [n, n * (n - 1), games(n) + 1, games(n) - 1], { hint: 'Count the games of the first team, then the new games of the second team…', explain: `${U.range(1, n - 1).reverse().join(' + ')} = ${games(n)}.` });
    if (d === 1) return outfits(2, 3);
    if (d === 2) return pick([() => outfits(2, 4), () => shake(3), () => nc(`${N} has a red, a blue and a green balloon and gives one balloon to each of 2 friends. How many balloons are left?`, 1, [0, 2, 3], { explain: '3 − 2 = 1.' })])();
    if (d === 3) return pick([() => lineup(3), () => shake(4), () => digits(3, false), () => digits(3, true), () => {
      const n = 2;
      return nc(`${N} has ${n} hats, ${n} shirts and ${n} pairs of pants. How many different outfits of a hat, a shirt and pants can ${N} make?`, 8, [6, 4, 9, 7], { explain: '2 × 2 × 2 = 8.', hint: 'First count hat-and-shirt sets, then add the pants.' });
    }])();
    const socks = () => {
      const r = rnd(3, 9), b = rnd(3, 9), [c1, c2] = U.sample(['red', 'blue', 'green', 'black', 'white'], 2), kind = rnd(1, 3);
      const intro = `A drawer has ${r} ${c1} socks and ${b} ${c2} socks. ${N} takes socks without looking.`;
      if (kind === 1) return nc(`${intro} How many must ${N} take to be sure to have 2 socks of the same color?`, 3, [2, 4, r + 1, b + 1], { hint: 'Think of the unluckiest way it could go.', explain: 'The first 2 could be different colors. The 3rd always matches one of them.' });
      if (kind === 2) return nc(`${intro} How many must ${N} take to be sure to get a ${c1} sock?`, b + 1, [b, r, r + 1, b + 2], { hint: 'Think of the unluckiest way it could go.', explain: `Unluckiest: all ${b} ${c2} socks come first. The next one must be ${c1}: ${b} + 1 = ${b + 1}.` });
      return nc(`${intro} How many must ${N} take to be sure to get 2 ${c1} socks?`, b + 2, [b + 1, 2, r + 2, b + 3], { hint: 'Think of the unluckiest way it could go.', explain: `Unluckiest: all ${b} ${c2} socks come first, then 2 ${c1}: ${b} + 2 = ${b + 2}.` });
    };
    if (d === 4) return pick([socks, () => shake(5), () => league(rnd(4, 6)), () => digits(4, false)])();
    const colors3 = () => {
      const k = rnd(1, 2), cs = U.sample(['red', 'blue', 'green', 'yellow'], 3), ns = [rnd(4, 8), rnd(4, 8), rnd(4, 8)];
      const intro = `A bag has ${ns[0]} ${cs[0]}, ${ns[1]} ${cs[1]} and ${ns[2]} ${cs[2]} marbles. ${N} takes marbles without looking.`;
      if (k === 1) return nc(`${intro} How many must ${N} take to be sure to have 3 marbles of the same color?`, 7, [3, 4, 6, 9], { hint: 'Unluckiest: as many as possible without 3 of one color.', explain: '2 of each color is 6 marbles with no 3 the same. The 7th makes 3 of one color.' });
      const sorted = ns.slice().sort((a, b) => b - a), ans = sorted[0] + sorted[1] + 1;
      return nc(`${intro} How many must ${N} take to be sure to have at least one marble of every color?`, ans, [3, ans - 1, ans + 1, sorted[0] + 1], { hint: 'Unluckiest: the two biggest colors come out first.', explain: `${sorted[0]} + ${sorted[1]} marbles could miss one color. One more: ${ans}.` });
    };
    return pick([colors3, () => lineup(4), () => {
      const a = rnd(2, 3), b = rnd(2, 3), c = rnd(2, 4);
      return nc(`A café has ${a} kinds of soup, ${b} kinds of sandwiches and ${c} kinds of juice. A lunch is one soup, one sandwich and one juice. How many different lunches are there?`, a * b * c, [a + b + c, a * b + c, a * b * c + 1, a * b * c - 1], { explain: `${a} × ${b} × ${c} = ${a * b * c}.`, hint: 'Count soup-and-sandwich pairs, then multiply by the juices.' });
    }, () => league(rnd(5, 7))])();
  }

  // ---------------- 6. Truth-tellers and fibbers ----------------
  const FACTS = [['I have a dog.', 'Does {N} have a dog?'], ['I ate an apple today.', 'Did {N} eat an apple today?'], ['My bike is red.', 'Is {N}’s bike red?'], ['I can whistle.', 'Can {N} whistle?'], ['I have a sister.', 'Does {N} have a sister?'], ['I saw a rainbow.', 'Did {N} see a rainbow?'], ['My hat is new.', 'Is {N}’s hat new?']];
  const PLACES = ['under the bed', 'in the box', 'in the closet', 'behind the couch'];
  const YN = ['Yes', 'No', "Can't tell"];
  // Statements a person can make about the group; truth(w) tells whether it is true in world w (true = truth-teller).
  function statements(names, s) {
    const out = [], o = names.map((_, i) => i).filter((i) => i !== s);
    for (const x of o) {
      out.push({ t: `“${names[x]} tells the truth.”`, f: (w) => w[x] });
      out.push({ t: `“${names[x]} is a fibber.”`, f: (w) => !w[x] });
      out.push({ t: `“${names[x]} and I are the same kind.”`, f: (w) => w[x] === w[s] });
      out.push({ t: `“${names[x]} and I are different kinds.”`, f: (w) => w[x] !== w[s] });
    }
    if (names.length === 2) {
      out.push({ t: '“We are both fibbers.”', f: (w) => !w[0] && !w[1] });
      out.push({ t: '“At least one of us is a fibber.”', f: (w) => !w[0] || !w[1] });
    } else {
      for (let k = 0; k <= 3; k++) out.push({ t: `“Exactly ${k} of us ${k === 1 ? 'tells' : 'tell'} the truth.”`, f: (w) => w.filter(Boolean).length === k });
      out.push({ t: '“At least one of us is a fibber.”', f: (w) => w.some((x) => !x) });
    }
    return out;
  }
  const RULE_TF = 'A truth-teller always tells the truth. A fibber always fibs.';
  function lg_liars(d) {
    const [N, M] = kids(2);
    if (d === 1) {
      const [fact, q] = pick(FACTS), honest = chance(0.5), qq = q.replace('{N}', N);
      const text = `${N} ${honest ? 'always tells the truth' : 'always fibs (never tells the truth)'}. ${N} says: “${fact}” ${qq}`;
      return C(text, honest ? 'Yes' : 'No', YN, { wordy: true, say: text, hint: honest ? 'If someone always tells the truth, what they say is true.' : 'If someone always fibs, the opposite of what they say is true.', explain: honest ? `${N} tells the truth, so it is true.` : `${N} always fibs, so it is not true.` });
    }
    if (d === 2) {
      if (chance(0.5)) {
        const [p1, p2] = U.sample(PLACES, 2), honest = chance(0.5);
        const text = `The ball is either ${p1} or ${p2}. ${N} ${honest ? 'always tells the truth' : 'always fibs'}. ${N} says: “The ball is ${p1}.” Where is the ball?`;
        const ans = honest ? p1 : p2;
        return C(text, ans.replace(/^./, (c) => c.toUpperCase()), PLACES.map((x) => x.replace(/^./, (c) => c.toUpperCase())), { wordy: true, say: text, hint: 'There are only two places. Is what was said true or false?', explain: honest ? `${N} tells the truth: ${p1}.` : `${N} fibs, so it is not ${p1}. It must be ${p2}.` });
      }
      // One of them ate the cookie; work out who from one sentence.
      const speakerHonest = chance(0.5), speaker = speakerHonest ? N : M, other = speakerHonest ? M : N;
      const claims = [[`I ate it.`, (e) => e === speaker], [`I did not eat it.`, (e) => e !== speaker], [`${other} ate it.`, (e) => e === other], [`${other} did not eat it.`, (e) => e !== other]];
      const [claim, holds] = pick(claims);
      const eater = [N, M].find((e) => holds(e) === speakerHonest);
      const text = `${N} always tells the truth and ${M} always fibs. One of them ate the cookie. ${speaker} says: “${claim}” Who ate the cookie?`;
      return C(text, eater, [N, M, 'Both', 'Nobody'], { wordy: true, say: text, hint: `Does ${speaker} tell the truth or fib? Then what really happened?`, explain: speakerHonest ? `${N} tells the truth, so “${claim}” is true: ${eater} ate it.` : `${M} fibs, so “${claim}” is false: ${eater} ate it.` });
    }
    // d3–5: find the only possible truth-tellers
    const n = d === 5 ? 3 : 2, names = kids(n);
    for (let tries = 0; tries < 200; tries++) {
      const truth = names.map(() => chance(0.5));
      const worlds = [];
      for (let m = 0; m < 1 << n; m++) worlds.push(names.map((_, i) => !!(m & (1 << i))));
      const said = names.map((_, s) => {
        return pick(statements(names, s).filter((st) => st.f(truth) === truth[s]));
      });
      if (d === 3 || (d === 5 && chance(0.4))) said[rnd(0, n - 1)] = null; // someone says nothing
      const fits = worlds.filter((w) => said.every((st, s) => !st || st.f(w) === w[s]));
      if (fits.length !== 1) continue;
      const lines = names.map((p, s) => (said[s] ? `${p} says: ${said[s].t}` : `${p} says nothing.`));
      const check = names.map((p, s) => (said[s] ? `${p} ${truth[s] ? 'tells the truth, and' : 'fibs, and'} ${said[s].t} is ${truth[s] ? 'true' : 'false'}.` : `${p} ${truth[s] ? 'tells the truth' : 'fibs'}.`)).join(' ');
      const intro = `${RULE_TF} ${names.join(n === 2 ? ' and ' : ', ')} are each a truth-teller or a fibber.`;
      if (n === 2) {
        const label = (w) => (w[0] && w[1] ? 'Both' : !w[0] && !w[1] ? 'Neither' : w[0] ? `Only ${names[0]}` : `Only ${names[1]}`);
        const q = 'Who tells the truth?';
        return C(`${intro}${list(lines)}${q}`, label(truth), [`Only ${names[0]}`, `Only ${names[1]}`, 'Both', 'Neither'], { wordy: true, say: speech(intro, ...lines, q), hint: 'Try it: suppose the first one tells the truth. Does everything fit? Then try the other way.', explain: check });
      }
      const k = truth.filter(Boolean).length, q = 'How many of them tell the truth?';
      return C(`${intro}${list(lines)}${q}`, k, [0, 1, 2, 3], { wordy: true, say: speech(intro, ...lines, q), hint: 'Try each possibility and look for the one where nobody breaks their rule.', explain: check });
    }
    return lg_liars(4);
  }

  const T = (name, icon, gen, desc) => ({ name, icon, std: 'Logic', gen, track: 'prep', logic: true, desc });
  Object.assign(MQ.TOPICS, {
    lg_order: T('Who is first?', '🥇', lg_order, 'Put kids in order from clues: tallest to shortest, or front to back in a line.'),
    lg_whois: T('Who has what?', '🕵️', lg_whois, 'Each kid has a different thing. Cross out what is impossible to find out who has what.'),
    lg_truth: T('Yes, No or Can’t tell', '🤔', lg_truth, 'Use only what the sentences say: all, some, none, if… then.'),
    lg_situation: T('Think it through', '💭', lg_situation, 'Everyday situations: what happens next, why it happened, what must be true.'),
    lg_count: T('Count the ways', '🔀', lg_count, 'Count all the outfits, handshakes or orders, and “how many to be sure” puzzles.'),
    lg_liars: T('Truth or fib?', '🤥', lg_liars, 'Some people always tell the truth, others always fib. Work out who is who.'),
  });
  MQ.LOGIC_TOPICS = ['lg_order', 'lg_whois', 'lg_truth', 'lg_situation', 'lg_count', 'lg_liars'];
  MQ.LOGIC_K = ['lg_order', 'lg_whois', 'lg_truth', 'lg_situation']; // kindergarten: levels 1–2, read aloud
})();
