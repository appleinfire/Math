# Math Expedition: notes for coding agents

A math game for two children on one shared iPad: a kindergartner (grade track `k`) and a 2nd grader (`g2`), in
California (Common Core standards). It is a static web app (GitHub Pages) with optional family sync through Firebase.
**README.md is the full description of every part of the game: read it first.** This file is how to work on the code.

## Layout

- `index.html`, `css/style.css`, `js/*.js`: the app. Plain JavaScript, no framework, no npm dependencies, no build step
  for the site. Each `js/` file is an IIFE that adds to the global `MQ` namespace (`MQ.farm`, `MQ.shapes`, `MQ.U`…).
- Rules live apart from screens, so the tests can run them in Node: `js/farm.js` (rules) vs `js/farm-ui.js` (screens) and
  `js/farm-scene.js` / `js/farm-art.js` (pictures); `js/shapes.js` vs `js/shapes-ui.js`; and so on. README "Project
  layout" lists every file.
- All pictures are drawn in code (emoji, CSS, inline SVG). There are no image files besides the app icons.
- `dist/` is **generated** by `python3 tools/build.py` (a single-file offline copy). Never edit it by hand; on a merge
  conflict, rebuild it instead of merging it.
- `templates/app-shell/` is a reusable copy of the app shell for other apps; leave it alone unless asked.

## Before every commit

```sh
node tests/generators.test.js && node tests/store.test.js && node tests/hatchery.test.js && node tests/duel.test.js \
  && node tests/testprep.test.js && node tests/farm.test.js && node tests/nnat.test.js && node tests/shapes.test.js
python3 tools/build.py
```

- The deploy (`.github/workflows/pages.yml`, on every push to `main`) runs exactly those unit tests; a failing test
  means the site is not updated.
- Browser tests (need Playwright and Chromium): `node tests/smoke.mjs`, `node tests/farm-smoke.mjs`,
  `node tests/shapes-smoke.mjs`, `node tests/nnat-smoke.mjs`. Run the ones for the part you changed.
- When files the app loads change, bump the cache name in `sw.js` (`math-expedition-vNN`), so tablets get the update.
- New features come with tests: rules and balance in `tests/*.test.js`, the screens in the matching `*-smoke.mjs`.
- Update README.md when the game changes (it is written for the parents and describes every rule).

## Conventions

- Everything the children see is in **English**, short and simple (a kindergartner hears it read aloud). Code comments
  and commit messages are in English too.
- Match the surrounding code: dense one-line helpers, comments that say what a rule is for, no new libraries.
- Both grades everywhere: prices and amounts are `[kindergarten, 2nd grade]` pairs (kindergarten in small cents,
  2nd grade in dollars and cents). Check every feature in both grades.
- Every purchase, sale or bank move in Sunny Farm is a money problem with US coins and bills; a wrong answer gets a
  hint, then the answer is shown, and the action still goes through.
- Sunny Farm time is **farm days** (a night passes when the child taps Sleep), never real time, so nothing is lost
  while the child is away. Animals never get sick or leave; nothing the child owns is taken away.
- The farm fits on about one screen: at most 6 garden beds and 6 pens; it grows through upgrades and the barnyard.
- Economy changes are checked by tests against `F.goodDay(level, grade)` (what a good farm makes a day); keep them so.
- Progress syncs between devices: new state needs a default in `F.ensure` (old saves must keep working) and must be
  safe to merge (see `js/store.js`).

## Git

- Work on a branch and open a pull request into `main`; do not push to `main` directly.
- One task per branch. Big shared files (`js/farm.js`, `js/farm-ui.js`, `js/app.js`, `css/style.css`) conflict easily:
  keep changes focused.
