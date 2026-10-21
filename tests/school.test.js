// Run: node tests/school.test.js
// Checks "In class now": every program's units and lessons, the skills they name, what gets practiced, and the settings.
const path = require('path');
const assert = require('assert');
for (const f of ['util', 'visuals', 'generators', 'generators-k', 'lessons', 'content', 'content-k', 'school', 'store']) require(path.join(__dirname, '..', 'js', f + '.js'));
const MQ = globalThis.MQ, SC = MQ.school, U = MQ.U;

// ---- program data: lessons in order with no gaps, every skill real and at a level it has
assert.deepStrictEqual(SC.programsFor('g2'), ['eureka'], 'Eureka Math for 2nd grade');
assert.deepStrictEqual(SC.programsFor('k'), [], 'no program data for kindergarten yet (the topics choice works there)');
for (const [pid, P] of Object.entries(SC.PROGRAMS)) {
  assert.ok(P.name && P.short && P.unitName && P.how, pid + ': names and how to find the lesson');
  for (const [grade, units] of Object.entries(P.grades)) {
    assert.ok(MQ.TRACKS[grade], `${pid}: ${grade} is a real grade`);
    units.forEach((u, i) => {
      assert.strictEqual(u.n, i + 1, `${pid} ${grade}: units are numbered 1, 2, 3…`);
      assert.ok(u.title && u.parts.length, `${pid} unit ${u.n}: title and parts`);
      let next = 1;
      for (const p of u.parts) {
        assert.strictEqual(p.from, next, `${pid} unit ${u.n}: lessons ${p.from}–${p.to} follow without a gap`);
        assert.ok(p.to >= p.from && p.title && p.skills.length, `${pid} unit ${u.n}: a part needs lessons, a title and skills`);
        next = p.to + 1;
        if (p.learn) assert.ok(MQ.lessons.module(p.learn), `${pid} unit ${u.n}: Learn module ${p.learn} exists`);
        for (const s of p.skills) {
          const sk = SC.skill(s);
          assert.ok(MQ.TOPICS[sk.topic], `${s}: a real topic`);
          assert.strictEqual(MQ.TOPICS[sk.topic].track, grade, `${s}: a topic of ${grade}`);
          if (sk.kind) assert.ok(MQ.KINDS[sk.kind].ds.includes(sk.d), `${s}: the kind works at level ${sk.d}`);
          else assert.ok(sk.d >= 1 && sk.d <= (MQ.TOPICS[sk.topic].maxD || 5), `${s}: a real level`);
          for (let i = 0; i < 60; i++) {
            const q = SC.make(sk);
            assert.strictEqual(q.topic, sk.topic, `${s}: recorded under its topic`);
            assert.strictEqual(q.d, sk.d, `${s}: recorded at its level`);
            assert.ok(q.text && !/undefined|NaN/.test(q.text + (q.visual || '')), `${s}: a well-formed question`);
          }
        }
      }
    });
  }
}
// The Eureka Grade 2 modules and their lesson counts (A Story of Units student workbooks).
assert.deepStrictEqual(SC.units('eureka', 'g2').map((u) => u.parts[u.parts.length - 1].to), [8, 10, 21, 31, 20, 20, 26, 16], 'lessons per module');

// ---- what gets practiced
const profile = (grade, school) => { const st = JSON.parse(JSON.stringify({ grade, settings: { school } })); return st; };
assert.strictEqual(SC.focus(profile('g2', { program: '' })), null, 'off: nothing to practice');
assert.strictEqual(SC.focus({ grade: 'g2', settings: {} }), null, 'an old save without the setting is off');
assert.strictEqual(SC.focus(profile('k', { program: 'eureka', unit: 3, part: 0 })), null, 'Eureka 2nd grade does not apply to kindergarten');
assert.strictEqual(SC.focus(profile('g2', { program: 'eureka', unit: 12, part: 0 })), null, 'a unit that does not exist');
const f = SC.focus(profile('g2', { program: 'eureka', unit: 3, part: 2, at: '2026-10-21' }));
assert.strictEqual(f.title, '$1, $10 and $100 bills');
assert.strictEqual(f.sub, 'Module 3 · Lessons 8–10');
assert.ok(f.skills.filter((k) => k.w === 3).every((k) => k.kind === 'pv_bills'), 'this week’s lessons weigh the most');
assert.ok(f.skills.some((k) => k.w === 1 && k.kind === 'pv_words'), 'earlier lessons of the module come back as review');
assert.ok(!f.skills.some((k) => k.kind === 'pv_compare'), 'later lessons are not practiced yet');
assert.strictEqual(SC.focus(profile('g2', { program: 'eureka', unit: 3, part: 99 })).part.from, 19, 'a part past the end means the last lessons');
// weighted pick: the current part comes up about 3 times as often per skill
const counts = { now: 0, before: 0 };
for (let i = 0; i < 6000; i++) counts[SC.pick(f.skills).w === 3 ? 'now' : 'before']++;
const wNow = f.skills.filter((k) => k.w === 3).length * 3, wBefore = f.skills.filter((k) => k.w === 1).length;
assert.ok(Math.abs(counts.now / 6000 - wNow / (wNow + wBefore)) < 0.04, 'pick follows the weights');
// Learn link in Module 6
assert.strictEqual(SC.focus(profile('g2', { program: 'eureka', unit: 6, part: 0 })).learn, 'groups');

// ---- any other program: the topics the class is on
const t = SC.focus(profile('g2', { program: 'topics', topics: ['place', 'k_count', 'nope', 'big'] }));
assert.deepStrictEqual([...new Set(t.skills.map((k) => k.topic))], ['place', 'big'], 'only topics of the child’s grade');
assert.deepStrictEqual([...new Set(t.skills.map((k) => k.d))], U.range(...MQ.track('g2').daily), 'at the Daily Quest levels of the grade');
assert.strictEqual(t.title, 'Place Value · Add & Subtract to 1000');
assert.strictEqual(SC.focus(profile('g2', { program: 'topics', topics: [] })), null, 'no topics chosen: nothing to practice');
const tk = SC.focus(profile('k', { program: 'topics', topics: [MQ.track('k').core[0]] }));
assert.ok(tk && tk.skills.every((k) => MQ.TOPICS[k.topic].track === 'k'), 'kindergarten can follow its class by topic');
for (const k of tk.skills) assert.ok(SC.make(k).text, 'kindergarten topic questions');

// ---- moving on
assert.deepStrictEqual(SC.next(profile('g2', { program: 'eureka', unit: 3, part: 1 })), { unit: 3, part: 2 }, 'next lessons in the module');
assert.deepStrictEqual(SC.next(profile('g2', { program: 'eureka', unit: 3, part: 6 })), { unit: 4, part: 0 }, 'after the last lessons, the next module');
assert.strictEqual(SC.next(profile('g2', { program: 'eureka', unit: 8, part: 2 })), null, 'the end of the year');
assert.strictEqual(SC.stale(profile('g2', { program: 'eureka', unit: 3, part: 0, at: '2026-10-01' }), '2026-10-21'), false, 'set 20 days ago: fine');
assert.strictEqual(SC.stale(profile('g2', { program: 'eureka', unit: 3, part: 0, at: '2026-09-30' }), '2026-10-21'), true, 'set 3 weeks ago: ask the grown-up');
assert.strictEqual(SC.stale(profile('g2', { program: '', at: '2026-01-01' }), '2026-10-21'), false, 'off is never stale');

// ---- saved profiles: a default for new and old saves, and it syncs like other settings (newest copy wins)
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const S = MQ.store;
S.init();
const kid = S.create({ name: 'Mia', grade: 'g2', companion: '🦊', buddyName: 'Pip' });
assert.deepStrictEqual(kid.settings.school, { program: '', unit: 1, part: 0, topics: [], at: '' }, 'new profiles start with In class now off');
const old = JSON.parse(store['math-expedition-p-' + kid.id]);
delete old.settings.school;
store['math-expedition-p-' + kid.id] = JSON.stringify(old);
assert.strictEqual(S.open(kid.id).settings.school.program, '', 'an old save gets the default');
const a = JSON.parse(JSON.stringify(S.open(kid.id))), b = JSON.parse(JSON.stringify(a));
a.settings.school = { program: 'eureka', unit: 3, part: 4, topics: [], at: '2026-10-21' }; a.rev = 20;
b.settings.school = { program: 'eureka', unit: 2, part: 0, topics: [], at: '2026-09-15' }; b.rev = 10;
assert.strictEqual(S.mergeProfiles(a, b).settings.school.unit, 3, 'the newest choice wins after a sync');
assert.strictEqual(S.mergeProfiles(b, a).settings.school.part, 4, 'in either order');

console.log(`OK — In class now: ${Object.keys(SC.PROGRAMS).length} program(s), ${SC.units('eureka', 'g2').length} modules, ${SC.units('eureka', 'g2').reduce((n, u) => n + u.parts.length, 0)} lesson groups checked.`);
