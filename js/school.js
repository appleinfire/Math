// School lessons: practice by the lessons of the class's math program, and what the class is on this week (rules and data, no DOM).
// A program is a school's math curriculum, written as data: units (modules) made of parts (lesson ranges), and each
// part lists the skills to practice. A skill is 'topic/level' (a topic of js/generators.js) or 'kind/level' (a class
// strategy, MQ.KINDS). A class that follows another curriculum needs only another entry in PROGRAMS;
// the 'topics' program works for any class: the grown-up picks the topics being taught.
// The choice lives in st.settings.school (see DEFAULT below). The child can open any unit unless a grown-up limits them.
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
            { from: 1, to: 2, title: 'Make ten and the next ten', skills: ['add20/2', 'add20/3', 'add_bond/2', 'add100/1'] },
            { from: 3, to: 8, title: 'Make a ten, take from a ten', skills: ['add100/1', 'sub100/1', 'add_bond/2', 'sub_bond/2', 'sub_bond/3', 'add20/2'] },
          ] },
          { n: 2, title: 'Measuring length', parts: [
            { from: 1, to: 3, title: 'Centimeters and rulers', skills: ['measure/2'] },
            { from: 4, to: 5, title: 'Centimeters, meters, estimating', skills: ['measure/2', 'measure/3', 'len_about/2'] },
            { from: 6, to: 7, title: 'Comparing lengths', skills: ['measure/3', 'words/2', 'len_units/3', 'len_line/3'] },
            { from: 8, to: 10, title: 'Length word problems', skills: ['measure/3', 'len_line/4', 'words/3', 'words_tape/3'] },
          ] },
          { n: 3, title: 'Place value to 1,000', parts: [
            { from: 1, to: 4, title: 'Ones, tens and hundreds', skills: ['place/2', 'pv_units/3', 'place/3'] },
            { from: 5, to: 7, title: 'Expanded form and number names', skills: ['pv_words/2', 'pv_words/3', 'place/3'] },
            { from: 8, to: 10, title: '$1, $10 and $100 bills', skills: ['pv_bills/2', 'pv_bills/3', 'pv_bills/4'] },
            { from: 11, to: 15, title: 'More than 9 tens or ones', skills: ['pv_units/3', 'pv_units/4'] },
            { from: 16, to: 18, title: 'Comparing and ordering', skills: ['pv_compare/3', 'pv_compare/4', 'place/4'] },
            { from: 19, to: 21, title: '1, 10 and 100 more or less', skills: ['pv_more/3', 'pv_more/4'] },
          ] },
          { n: 4, title: 'Adding and subtracting to 200', parts: [
            { from: 1, to: 5, title: 'Mental math with tens and arrows', skills: ['pv_more/2', 'add_arrow/2', 'sub_arrow/2', 'add_simpler/3', 'sub_simpler/3', 'words/3'] },
            { from: 6, to: 10, title: 'Adding: bundle a new ten', skills: ['add_bundle/3', 'add100/3', 'add_arrow/3', 'add_200/4'] },
            { from: 11, to: 16, title: 'Subtracting: unbundle a ten', skills: ['sub_unbundle/3', 'sub100/3', 'sub_arrow/3', 'sub_200/4', 'words_tape/3'] },
            { from: 17, to: 22, title: 'Adding to 200: new tens and hundreds', skills: ['add_bundle/4', 'add_200/4', 'add_200/5', 'add_arrow/4', 'add100/5'] },
            { from: 23, to: 28, title: 'Subtracting from 200', skills: ['sub_bond/4', 'sub_unbundle/4', 'sub_200/4', 'sub_200/5', 'sub_arrow/4'] },
            { from: 29, to: 31, title: 'Two-step word problems', skills: ['words_tape/4', 'words/4', 'add_200/4', 'sub_200/4'] },
          ] },
          { n: 5, title: 'Adding and subtracting to 1,000', parts: [
            { from: 1, to: 7, title: 'Hundreds and tens: arrows, easier problems', skills: ['pv_more/3', 'big/1', 'big_arrow/2', 'big_arrow/3', 'big_simpler/3', 'big_bond/3'] },
            { from: 8, to: 12, title: 'Adding: new tens and hundreds', skills: ['big/2', 'big/3', 'big/4', 'big_bond/4'] },
            { from: 13, to: 20, title: 'Subtracting: unbundle tens and hundreds', skills: ['big/2', 'big/3', 'big/4', 'big_simpler/4', 'big_arrow/4', 'big_check/3', 'big_check/4'] },
          ] },
          { n: 6, title: 'Equal groups, arrays, odd and even', parts: [
            { from: 1, to: 4, title: 'Equal groups', skills: ['mult/1', 'arr_tape/2', 'arr_tape/3', 'arrays/3'], learn: 'groups' },
            { from: 5, to: 9, title: 'Arrays: rows and columns', skills: ['arr_rowscols/2', 'arr_rowscols/3', 'arrays/2', 'arrays/3'], learn: 'arrays' },
            { from: 10, to: 16, title: 'Rectangles made of squares', skills: ['arr_rowscols/3', 'arrays/4', 'shapes/4'] },
            { from: 17, to: 20, title: 'Odd and even', skills: ['arrays/1', 'arrays/2', 'arrays/4'] },
          ] },
          { n: 7, title: 'Graphs, money and measuring', parts: [
            { from: 1, to: 5, title: 'Tables, picture graphs and bar graphs', skills: ['data_tally/2', 'data_tally/3', 'data/2', 'data/3', 'data/4'] },
            { from: 6, to: 13, title: 'Coins and bills', skills: ['money/2', 'money/3', 'money_bills/3', 'money_bills/4', 'money_ways/3', 'money_ways/4', 'money_to100/3', 'money_to100/4', 'money/5'] },
            { from: 14, to: 15, title: 'Inch rulers', skills: ['measure/1'] },
            { from: 16, to: 19, title: 'Inches, feet and yards', skills: ['measure/3', 'measure/4', 'len_about/3', 'len_units/3'] },
            { from: 20, to: 22, title: 'Length word problems', skills: ['len_line/3', 'len_line/4', 'words_tape/3', 'words/3'] },
            { from: 23, to: 26, title: 'Line plots', skills: ['data_lineplot/3', 'data_lineplot/4'] },
          ] },
          { n: 8, title: 'Shapes, fractions and time', parts: [
            { from: 1, to: 5, title: 'Shapes, angles and cubes', skills: ['shape_quads/2', 'shape_quads/3', 'shapes/1', 'shapes/2', 'shapes/4'] },
            { from: 6, to: 12, title: 'Halves, thirds and fourths', skills: ['shapes/3', 'frac_whole/3', 'frac_whole/4'] },
            { from: 13, to: 16, title: 'Telling time, a.m. and p.m.', skills: ['time_quarter/2', 'time_quarter/3', 'time/3', 'time/4', 'time_elapsed/4', 'time_elapsed/5'] },
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

  MQ.school = SC;
})();
