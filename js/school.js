// School lessons: practice by the lessons of the class's math program, and what the class is on this week (rules and data, no DOM).
// A program is a school's math curriculum, written as data: units (modules) made of parts (lesson ranges), and each
// part lists the skills to practice, from easier to harder, and the big ideas it teaches (teach: short lines a child
// can read, each with an example). A skill is 'topic/level' (a topic of js/generators.js) or 'kind/level' (a class
// strategy, MQ.KINDS). A class that follows another curriculum needs only another entry in PROGRAMS;
// the 'topics' program works for any class: the grown-up picks the topics being taught.
// The choice lives in st.settings.school (see DEFAULT below). The child can open any unit unless a grown-up limits them.
// A lesson group is worked through as a lesson (SC.lesson): 💡 How it works, one practice step per skill, then a
// lesson check that mixes them all. The child's stars are in st.school (see SC.progress).
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const SC = {};

  SC.PROGRAMS = {
    eureka: {
      name: 'Eureka Math (A Story of Units)', short: 'Eureka Math', unitName: 'Module',
      how: 'The top of a homework page says which lesson it is: “Lesson 12 Homework 2•3” is Module 3, Lesson 12.',
      grades: {
        g2: [
          { n: 1, title: 'Adding and subtracting to 100', parts: [
            { from: 1, to: 2, title: 'Make ten and the next ten', skills: ['add20/2', 'add20/3', 'add_bond/2', 'add100/1'], teach: ['Make a ten: 8 + 5 → 8 + 2 = 10, and 3 more is 13.', 'Jump to the next ten first: 38 + 5 → 38 + 2 = 40, then 40 + 3 = 43.', 'Adding 10 changes only the tens: 46 + 10 = 56.'] },
            { from: 3, to: 8, title: 'Make a ten, take from a ten', skills: ['add100/1', 'sub100/1', 'add_bond/2', 'sub_bond/2', 'sub_bond/3', 'add20/2'], learn: 'maketen', teach: ['Take from the ten: 13 − 8 → 10 − 8 = 2, then 2 + 3 = 5.', 'It works with bigger numbers too: 50 − 6 → 10 − 6 = 4, and 4 + 40 = 44.', 'Taking away 10 changes only the tens: 64 − 10 = 54.', 'Stuck? Think addition: 12 − 5 is the same as 5 + ? = 12.'] },
          ] },
          { n: 2, title: 'Measuring length', parts: [
            { from: 1, to: 3, title: 'Centimeters and rulers', skills: ['measure/2'], teach: ['A centimeter is about as wide as your fingernail.', 'Put one end at 0 on the ruler. The number at the other end tells how long it is.', 'Not starting at 0? Count the spaces from one end to the other.'] },
            { from: 4, to: 5, title: 'Centimeters, meters, estimating', skills: ['measure/2', 'measure/3', 'len_about/2'], teach: ['1 meter is 100 centimeters. A meter is about one big step.', 'Small things (a crayon, an eraser) are measured in centimeters, big things (a car, a room) in meters.', 'To estimate, think of something you know: a door is about 2 meters tall.'] },
            { from: 6, to: 7, title: 'Comparing lengths', skills: ['measure/3', 'words/2', 'len_units/3', 'len_line/3'], teach: ['To compare, line up the ends. How much longer? Subtract: 26 − 20 = 6.', 'Smaller units fit more times: a rug is more centimeters long than meters long.', 'A ruler is a number line: count up to find how much more.'] },
            { from: 8, to: 10, title: 'Length word problems', skills: ['measure/3', 'len_line/4', 'words/3', 'words_tape/3'], teach: ['Read the story and draw it: a tape or a number line with the lengths.', 'Lengths put together: add. How much longer or how much more: subtract or count up.', 'Say the unit with your answer: 16 inches, 40 yards.'] },
          ] },
          { n: 3, title: 'Place value to 1,000', parts: [
            { from: 1, to: 4, title: 'Ones, tens and hundreds', skills: ['place/2', 'pv_units/3', 'place/3'], teach: ['10 ones make 1 ten. 10 tens make 1 hundred.', '352 is 3 hundreds, 5 tens and 2 ones.', 'From the right, the places are ones, tens, hundreds.', '11 tens is 110: ten of the tens make a hundred.'] },
            { from: 5, to: 7, title: 'Expanded form and number names', skills: ['pv_words/2', 'pv_words/3', 'place/3'], teach: ['One number, three ways: 352 = 300 + 50 + 2 = three hundred fifty-two.', 'Expanded form shows what each digit is worth.', 'Zero holds a place: four hundred seven is 407, four hundred seventy is 470.'] },
            { from: 8, to: 10, title: '$1, $10 and $100 bills', skills: ['pv_bills/2', 'pv_bills/3', 'pv_bills/4'], teach: ['A $100 bill is like a hundred, a $10 bill a ten, a $1 bill a one.', 'Count the $100 bills, then the $10 bills, then the $1 bills: $200 + $30 + $3 = $233.', '10 ten-dollar bills make $100, so $580 is 58 ten-dollar bills.'] },
            { from: 11, to: 15, title: 'More than 9 tens or ones', skills: ['pv_units/3', 'pv_units/4'], teach: ['A place can hold more than 9 for a moment: 13 ones is 1 ten and 3 ones.', 'Bundle: 10 ones make a new ten, 10 tens make a new hundred.', '683 is 68 tens and 3 ones, because every hundred is 10 tens.'] },
            { from: 16, to: 18, title: 'Comparing and ordering', skills: ['pv_compare/3', 'pv_compare/4', 'place/4'], teach: ['Compare the hundreds first. The same? Compare the tens, then the ones.', 'Write both numbers the same way first: 98 tens 5 ones is 985.', '> means greater than, < means less than. The open side faces the bigger number.'] },
            { from: 19, to: 21, title: '1, 10 and 100 more or less', skills: ['pv_more/3', 'pv_more/4'], teach: ['10 more changes the tens: 245 → 255. 100 more changes the hundreds: 245 → 345.', 'Watch for a new ten or hundred: 10 more than 795 is 805.', 'Find the rule by looking at the digit that changes: 214, 204, 194 is 10 less each time.'] },
          ] },
          { n: 4, title: 'Adding and subtracting to 200', parts: [
            { from: 1, to: 5, title: 'Mental math with tens and arrows', skills: ['pv_more/2', 'add_arrow/2', 'sub_arrow/2', 'add_simpler/3', 'sub_simpler/3', 'words/3'], learn: 'addtens', teach: ['Arrows: 38 + 21 → 38 +20→ 58 +1→ 59. Jump the tens, then the ones.', 'Use a friendly number: 48 − 19 → 48 − 20 = 28, then add 1 back: 29.', 'Make it easier: 29 + 46 = 30 + 45. For take-away, add the same to both: 32 − 19 = 33 − 20.'] },
            { from: 6, to: 10, title: 'Adding: bundle a new ten', skills: ['add_bundle/3', 'add100/3', 'add_arrow/3', 'add_200/4'], learn: 'bundle', teach: ['Add the ones first: 47 + 26 → 7 + 6 = 13 ones.', '13 ones is 1 new ten and 3 ones. Bundle the new ten!', 'Then the tens: 4 + 2 + 1 = 7 tens. So 47 + 26 = 73.'] },
            { from: 11, to: 16, title: 'Subtracting: unbundle a ten', skills: ['sub_unbundle/3', 'sub100/3', 'sub_arrow/3', 'sub_200/4', 'words_tape/3'], learn: 'unbundle', teach: ['Get ready first: 52 − 27 has only 2 ones, not enough to take away 7.', 'Unbundle a ten: 52 is 4 tens and 12 ones.', 'Now subtract: 12 − 7 = 5 ones, 4 − 2 = 2 tens. So 52 − 27 = 25.', 'Or count up: 27 → 30 → 52 is 3 + 22 = 25.'] },
            { from: 17, to: 22, title: 'Adding to 200: new tens and hundreds', skills: ['add_bundle/4', 'add_200/4', 'add_200/5', 'add_arrow/4', 'add100/5'], teach: ['10 tens make a new hundred: 74 + 60 → 7 tens + 6 tens = 13 tens = 134.', 'Ones first, then tens, then hundreds. Bundle whenever a place has 10 or more.', 'Adding 3 or 4 numbers? Look for pairs that make a ten: 19 + 31 + 29 + 11.'] },
            { from: 23, to: 28, title: 'Subtracting from 200', skills: ['sub_bond/4', 'sub_unbundle/4', 'sub_200/4', 'sub_200/5', 'sub_arrow/4'], teach: ['Take from the hundred: 150 − 60 → 100 − 60 = 40, and 40 + 50 = 90.', 'Not enough tens? Unbundle a hundred: 1 hundred is 10 tens.', 'Count up to subtract: 200 − 185 → 185 +5→ 190 +10→ 200, so 15.'] },
            { from: 29, to: 31, title: 'Two-step word problems', skills: ['words_tape/4', 'words/4', 'add_200/4', 'sub_200/4'], teach: ['Two steps! First find what you do not know yet, then answer the question.', 'Draw a tape: one bar for each person or each part.', '“Together” or “in all” means add the parts. “Left” means take away.'] },
          ] },
          { n: 5, title: 'Adding and subtracting to 1,000', parts: [
            { from: 1, to: 7, title: 'Hundreds and tens: arrows, easier problems', skills: ['pv_more/3', 'big/1', 'big_arrow/2', 'big_arrow/3', 'big_simpler/3', 'big_bond/3'], teach: ['Think in hundreds: 500 + 300 is 5 hundreds + 3 hundreds = 800.', 'Arrows: 340 + 280 → 340 +300→ 640 −20→ 620.', 'Make a hundred: 690 + 95 → 690 + 10 = 700, then 700 + 85 = 785.', 'Make it easier: 199 + 48 = 200 + 47 = 247.'] },
            { from: 8, to: 12, title: 'Adding: new tens and hundreds', skills: ['big/2', 'big/3', 'big/4', 'big_bond/4'], learn: 'hundreds', teach: ['Line up the hundreds, tens and ones. Add the ones first.', '365 + 248: ones 5 + 8 = 13, that is 1 new ten and 3 ones.', 'Tens 6 + 4 + 1 = 11: 1 new hundred and 1 ten. Hundreds 3 + 2 + 1 = 6. So 613.'] },
            { from: 13, to: 20, title: 'Subtracting: unbundle tens and hundreds', skills: ['big/2', 'big/3', 'big/4', 'big_simpler/4', 'big_arrow/4', 'big_check/3', 'big_check/4'], learn: 'zeros', teach: ['Get ready first: look at every place. Not enough? Unbundle from the next place.', '400 − 247: 400 is 3 hundreds, 9 tens and 10 ones. Now subtract: 153.', 'Shortcut: 400 − 247 = 399 − 246. Nothing to unbundle!', 'Check with addition: 153 + 247 = 400.'] },
          ] },
          { n: 6, title: 'Equal groups, arrays, odd and even', parts: [
            { from: 1, to: 4, title: 'Equal groups', skills: ['mult/1', 'arr_tape/2', 'arr_tape/3', 'arrays/3'], learn: 'groups', teach: ['Equal groups have the same number in every group.', '3 groups of 4 is 4 + 4 + 4 = 12. Skip-count: 4, 8, 12.', 'A tape diagram shows equal groups as equal parts of one bar.'] },
            { from: 5, to: 9, title: 'Arrays: rows and columns', skills: ['arr_rowscols/2', 'arr_rowscols/3', 'arrays/2', 'arrays/3'], learn: 'arrays', teach: ['An array has things in rows and columns.', 'Rows go across, like a line of chairs. Columns go up and down, like a tower.', '3 rows of 5 is 5 + 5 + 5 = 15: add one number for each row.'] },
            { from: 10, to: 16, title: 'Rectangles made of squares', skills: ['arr_rowscols/3', 'arrays/4', 'shapes/4'], teach: ['A rectangle can be cut into rows and columns of equal squares.', 'Count one row, then skip-count by rows: 5 rows of 3 is 3, 6, 9, 12, 15.', 'Take away a column: take away the squares or dots in that column.'] },
            { from: 17, to: 20, title: 'Odd and even', skills: ['arrays/1', 'arrays/2', 'arrays/4'], teach: ['Even numbers make pairs with none left over: 8 is 4 pairs.', 'Odd numbers have 1 left over: 7 is 3 pairs and 1 more.', 'Look at the ones digit: 0, 2, 4, 6, 8 are even. 1, 3, 5, 7, 9 are odd.', 'Even + even = even, odd + odd = even, odd + even = odd.'] },
          ] },
          { n: 7, title: 'Graphs, money and measuring', parts: [
            { from: 1, to: 5, title: 'Tables, picture graphs and bar graphs', skills: ['data_tally/2', 'data_tally/3', 'data/2', 'data/3', 'data/4'], teach: ['Read the title and the labels first.', 'Tally marks come in bundles of 5: count 5, 10, then count on.', 'Bar graph: go to the top of the bar, then look across to the number.', '“How many more” or “how many fewer”: find both numbers, then subtract.'] },
            { from: 6, to: 13, title: 'Coins and bills', skills: ['money/2', 'money/3', 'money_bills/3', 'money_bills/4', 'money_ways/3', 'money_ways/4', 'money_to100/3', 'money_to100/4', 'money/5'], teach: ['Quarter 25¢, dime 10¢, nickel 5¢, penny 1¢. 100¢ is $1.', 'Count the coins worth the most first, then count on: 25, 35, 40, 41¢.', 'Bills: $20, $10, $5, $1. Start with the biggest bill.', 'To make $1, count up: 77¢ → 80¢ → 100¢ is 3¢ + 20¢ = 23¢.'] },
            { from: 14, to: 15, title: 'Inch rulers', skills: ['measure/1'], teach: ['An inch is about as long as a paper clip.', 'Put one end at 0 on the ruler.', 'The number at the other end tells how many inches long it is.'] },
            { from: 16, to: 19, title: 'Inches, feet and yards', skills: ['measure/3', 'measure/4', 'len_about/3', 'len_units/3'], teach: ['12 inches = 1 foot. 3 feet = 1 yard. 1 yard = 36 inches.', 'A foot is about as long as a ruler, a yard is about one big step.', 'Bigger units, smaller number: a hallway is more inches long than feet.'] },
            { from: 20, to: 22, title: 'Length word problems', skills: ['len_line/3', 'len_line/4', 'words_tape/3', 'words/3'], teach: ['Draw a number line or a tape with the lengths.', 'How many more to make 1 yard? Count up to 36 inches.', 'Hops forward are plus, hops back are minus.'] },
            { from: 23, to: 26, title: 'Line plots', skills: ['data_lineplot/3', 'data_lineplot/4'], teach: ['A line plot is a number line with an × for every thing measured.', 'How many have one length? Count the ×s above that number.', 'The tallest stack of ×s is the most common length.', 'Count every × to find how many things were measured.'] },
          ] },
          { n: 8, title: 'Shapes, fractions and time', parts: [
            { from: 1, to: 5, title: 'Shapes, angles and cubes', skills: ['shape_quads/2', 'shape_quads/3', 'shapes/1', 'shapes/2', 'shapes/4'], teach: ['Count the sides: triangle 3, quadrilateral 4, pentagon 5, hexagon 6.', 'A shape has as many angles (corners) as sides.', 'Square: 4 equal sides and 4 square corners. Rectangle: 4 square corners. Rhombus: 4 equal sides.', 'A cube has 6 faces, 12 edges and 8 vertices.'] },
            { from: 6, to: 12, title: 'Halves, thirds and fourths', skills: ['shapes/3', 'frac_whole/3', 'frac_whole/4'], teach: ['Fractions are equal parts: 2 halves, 3 thirds, 4 fourths.', 'The parts must all be the same size.', '2 halves, 3 thirds or 4 fourths make 1 whole.', '1 fourth is shaded? You need 3 more fourths to make 1 whole.'] },
            { from: 13, to: 16, title: 'Telling time, a.m. and p.m.', skills: ['time_quarter/2', 'time_quarter/3', 'time/3', 'time/4', 'time_elapsed/4', 'time_elapsed/5'], teach: ['The short hand shows the hour. The long hand shows the minutes: count by 5s.', 'Quarter past is :15, half past is :30, quarter to is 15 minutes before the next hour.', 'a.m. is from midnight to noon, p.m. is from noon to midnight.', 'How long? Count the hours: 9 a.m. to 1 p.m. is 4 hours.'] },
          ] },
        ],
      },
    },
  };
  // Any other program: the grown-up picks the topics the class is on (up to 3).
  SC.TOPIC_MAX = 3;

  // program: '' (never set: the grade's program, if there is one), a program id, 'topics' or 'off';
  // unit/part: the lessons in class this week (unit 0 = not set); open: 'all' or 'chosen' (only the units in allowed);
  // at: when a grown-up last changed anything; weekAt: when this week's lessons were last set.
  const DEFAULT = { program: '', unit: 0, part: 0, topics: [], at: '', weekAt: '', open: 'all', allowed: [] };
  SC.settings = (st) => Object.assign({}, DEFAULT, (st.settings || {}).school);
  SC.units = (program, grade) => (SC.PROGRAMS[program] && SC.PROGRAMS[program].grades[grade]) || [];
  SC.programsFor = (grade) => Object.keys(SC.PROGRAMS).filter((id) => SC.units(id, grade).length);
  // The program in use: the grown-up's choice, or, until a grown-up chooses, the grade's program (Eureka for 2nd grade).
  SC.program = (st) => {
    const c = SC.settings(st);
    if (c.program === 'off') return '';
    if (c.program === 'topics') return 'topics';
    if (SC.units(c.program, st.grade).length) return c.program;
    return c.at ? '' : SC.programsFor(st.grade)[0] || '';
  };

  // 'place/3' → { topic, d } ; 'pv_words/2' → { kind, topic, d }
  SC.skill = (s) => {
    const [id, lv] = s.split('/'), d = +lv;
    if (MQ.KINDS && MQ.KINDS[id]) return { kind: id, topic: MQ.KINDS[id].topic, d };
    return { topic: id, d };
  };
  SC.skillName = (sk) => (sk.kind ? MQ.KINDS[sk.kind].name : MQ.TOPICS[sk.topic] ? MQ.TOPICS[sk.topic].name : sk.topic);

  // This week's lessons in class, when a grown-up set them: { unit, part } or null.
  SC.week = (st) => {
    const c = SC.settings(st), pid = SC.program(st);
    if (!pid || pid === 'topics' || !c.at || c.program !== pid || !(c.unit >= 1)) return null;
    const unit = SC.units(pid, st.grade).find((u) => u.n === c.unit);
    return unit ? { unit: unit.n, part: MQ.U.clamp(c.part || 0, 0, unit.parts.length - 1) } : null;
  };
  // Practice for one lesson group: its skills (weight 3) and, as review, the earlier groups of the same unit (weight 1).
  SC.focusFor = (st, n, pi) => {
    const pid = SC.program(st), unit = SC.units(pid, st.grade).find((u) => u.n === n);
    if (!unit || pid === 'topics') return null;
    pi = MQ.U.clamp(pi || 0, 0, unit.parts.length - 1);
    const part = unit.parts[pi], skills = [];
    unit.parts.slice(0, pi + 1).forEach((p, i) => p.skills.forEach((s) => skills.push(Object.assign(SC.skill(s), { w: i === pi ? 3 : 1 }))));
    const wk = SC.week(st);
    return { program: pid, unit, part, pi, title: part.title, sub: `${SC.PROGRAMS[pid].unitName} ${unit.n} · Lessons ${part.from}–${part.to}`, skills, learn: part.learn || '', now: !!(wk && wk.unit === n && wk.part === pi) };
  };
  // What the class is on now (this week's lessons, or the topics a grown-up picked); null when nothing is set.
  SC.focus = (st) => {
    const c = SC.settings(st);
    if (SC.program(st) === 'topics') {
      const tr = MQ.track(st.grade), ids = (c.topics || []).filter((t) => tr.core.includes(t) || tr.ahead.includes(t));
      if (!ids.length) return null;
      const [lo, hi] = tr.daily;
      const skills = ids.flatMap((t) => MQ.U.range(lo, hi).map((d) => ({ topic: t, d, w: 1 })));
      return { program: 'topics', title: ids.map((t) => MQ.TOPICS[t].name).join(' · '), sub: 'Topics from class', skills, learn: '', now: true };
    }
    const wk = SC.week(st);
    return wk ? SC.focusFor(st, wk.unit, wk.part) : null;
  };
  // Can the child open this unit? Every unit, unless a grown-up chose which ones (this week's unit is always open).
  SC.isOpen = (st, n, preview = false) => {
    const c = SC.settings(st), wk = SC.week(st);
    return preview || c.open !== 'chosen' || (c.allowed || []).includes(n) || !!(wk && wk.unit === n);
  };
  SC.pick = (skills) => {
    let r = Math.random() * skills.reduce((s, k) => s + (k.w || 1), 0);
    for (const k of skills) if ((r -= k.w || 1) < 0) return k;
    return skills[skills.length - 1];
  };
  SC.make = (sk) => (sk.kind ? MQ.makeKind(sk.kind, sk.d) : MQ.makeProblem(sk.topic, sk.d));
  // This week's lessons were set a while ago: ask whether the class has moved on.
  SC.stale = (st, today = MQ.U.dateKey()) => { const c = SC.settings(st), at = c.weekAt || c.at; return !!(SC.week(st) && at && MQ.U.daysBetween(at, today) >= 21); };
  // The next lessons after this week's (the next part, or the first part of the next unit).
  SC.next = (st) => {
    const wk = SC.week(st);
    if (!wk) return null;
    const units = SC.units(SC.program(st), st.grade), ui = units.findIndex((u) => u.n === wk.unit);
    if (wk.part + 1 < units[ui].parts.length) return { unit: wk.unit, part: wk.part + 1 };
    return units[ui + 1] ? { unit: units[ui + 1].n, part: 0 } : null;
  };

  // ---- a lesson group as a lesson: 💡 How it works (big ideas and solved examples), one practice step for every skill
  // (in the program's order, easier to harder), then a lesson check that mixes them all with earlier lessons as review.
  // id: 'unit:part' ('3:1' = Module 3, its second lesson group), or 'now' for the topics a grown-up picked.
  SC.STEP_GOAL = 8; // right answers in a practice step
  SC.CHECK_GOAL = 10; // right answers in a lesson check
  SC.MASTER_GEMS = 5; // crystals for a lesson mastered: ★★★ on every step and the check
  SC.stars = (mistakes) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1); // like a level of the map
  SC.lesson = (st, id) => {
    if (id === 'now') { // another program: a step for each topic the class is on, at the grade's Daily Quest levels
      const f = SC.focus(st);
      if (!f || f.program !== 'topics') return null;
      const ids = [...new Set(f.skills.map((k) => k.topic))];
      const steps = ids.map((t, i) => ({ i, id: t, name: MQ.TOPICS[t].name, d: 0, skills: f.skills.filter((k) => k.topic === t) }));
      return Object.assign(f, { id, key: 'topics:' + ids.slice().sort().join('+'), teach: ids.flatMap((t) => ((MQ.TIPS || {})[t] || []).slice(0, 2)), steps, check: f.skills, next: null });
    }
    const [n, pi] = String(id).split(':').map(Number), f = SC.focusFor(st, n, pi);
    if (!f) return null;
    const steps = f.part.skills.map((s, i) => { const sk = SC.skill(s); return { i, id: s, name: SC.skillName(sk), d: sk.d, skills: [Object.assign(sk, { w: 1 })] }; });
    const units = SC.units(f.program, st.grade), ui = units.indexOf(f.unit);
    const next = f.pi + 1 < f.unit.parts.length ? `${n}:${f.pi + 1}` : units[ui + 1] ? `${units[ui + 1].n}:0` : null;
    return Object.assign(f, { id: `${n}:${f.pi}`, key: `${f.program}:${n}:${f.pi}`, teach: f.part.teach || [], steps, check: f.skills, next });
  };
  // Progress in a lesson (st.school[lesson key]): How it works seen, the best stars of every step (by skill) and of the check.
  // Only goes up, so two devices merge by keeping the higher of each (js/store.js).
  SC.progress = (st, L) => {
    const p = (st.school || {})[L.key] || {}, steps = L.steps.map((s) => (p.steps || {})[s.id] || 0), check = p.check || 0;
    const earned = steps.reduce((a, b) => a + b, 0) + check, total = (steps.length + 1) * 3;
    return { learn: !!p.learn, steps, check, earned, total, done: check > 0, mastered: earned === total };
  };
  // what: 'learn', 'check' or a step index. Returns true when the lesson became mastered just now.
  SC.save = (st, L, what, stars = 0) => {
    const was = SC.progress(st, L).mastered, all = (st.school = st.school || {});
    const p = (all[L.key] = Object.assign({ learn: 0, steps: {}, check: 0 }, all[L.key]));
    if (what === 'learn') p.learn = 1;
    else if (what === 'check') p.check = Math.max(p.check || 0, stars);
    else if (L.steps[what]) p.steps = Object.assign({}, p.steps, { [L.steps[what].id]: Math.max(p.steps[L.steps[what].id] || 0, stars) });
    return !was && SC.progress(st, L).mastered;
  };
  // What to do next: How it works, then every step in order, then the check; after that the steps and check not at ★★★.
  SC.upNext = (st, L) => {
    const p = SC.progress(st, L);
    if (!p.learn) return 'learn';
    const i = p.steps.indexOf(0);
    if (i >= 0) return i;
    if (!p.check) return 'check';
    const w = p.steps.findIndex((s) => s < 3);
    return w >= 0 ? w : p.check < 3 ? 'check' : null;
  };
  // A module's lesson groups: how many have their check done, and how many are mastered.
  SC.unitProgress = (st, n) => {
    const unit = SC.units(SC.program(st), st.grade).find((u) => u.n === n), ps = unit ? unit.parts.map((_, i) => SC.progress(st, SC.lesson(st, `${n}:${i}`))) : [];
    return { parts: ps.length, done: ps.filter((p) => p.done).length, mastered: ps.filter((p) => p.mastered).length };
  };
  // A solved example: a fresh question of the skill, not the one on screen (avoid), and when it can be,
  // asked the same way as it (like: a question's text; the first words must match).
  const opening = (t) => t.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
  SC.example = (sk, avoid = '', like = '') => {
    let first = null;
    for (let i = 0; i < 30; i++) {
      const p = SC.make(sk);
      if (p.text + (p.visual || '') === avoid) continue;
      if (!like || opening(p.text) === opening(like)) return p;
      first = first || p;
    }
    return first || SC.make(sk);
  };

  MQ.school = SC;
})();
