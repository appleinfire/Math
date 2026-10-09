# Math Expedition 🧭

A math trainer for kids in California, built for a kindergartner and a 2nd grader sharing one iPad. Each child explores their own map of worlds, solves problems, and discovers real animals with surprising science facts. Problems follow the California Common Core math standards for the child's grade, and every topic has harder levels that go ahead into the next grade.

## Several children, one device

- **Who's exploring?** On launch the app asks who is playing (with one profile it opens straight to that child). Each card shows the child's name, grade, level, crystals and creatures.
- **Separate profiles.** Every child has their own grade, world map, creatures, crystals, badges, daily streak, training settings and statistics. Nothing is shared between profiles.
- **Grade tracks.** A profile follows one grade track: **Kindergarten** (7 worlds, baby animals) or **2nd grade** (8 worlds, wild animals). A grown-up can move a child to another grade; progress in the old grade is kept.
- **Switching.** Tap the buddy avatar on the home screen (or the small avatar in the top bar) to go back to the picker.
- **Grown-ups page** shows the report for the current child and lists every explorer on the device: change grade, delete, add a new one.
- Progress from the first single-player version is moved into a 2nd-grade profile automatically.

## How to open it

- **Online (main way):** **https://appleinfire.github.io/Math/** — works on any phone, tablet or computer. On an iPad, open it in Safari, then Share → *Add to Home Screen* to get a full-screen app icon. It keeps working offline.
- **Same progress everywhere:** on the first device choose *Create a family* (family code + PIN). On every other device choose *I already have a family* and type the same code and PIN. Explorers, levels, creatures and crystals then stay in sync across all devices.
- **Updates:** every push to `main` is tested and published automatically by GitHub Actions in about a minute. See [docs/DEPLOY.md](docs/DEPLOY.md) for the setup and how sync works.
- **Offline single file:** `dist/math-expedition.html` still works on its own (progress stays on that device).

## How the game works

| Part | What happens |
|---|---|
| **Expedition Map** | 8 worlds × 6 levels. A level asks for 5 correct answers (7 for the Guardian). Finishing a level discovers a creature for the Field Journal. Stars depend on mistakes: 0 → ★★★, 1–2 → ★★, more → ★. Beating a world's Guardian opens the next world. |
| **Endless Training** | Pick any topics, a difficulty (or **Auto**, which goes up after 4 first-try answers in a row and down after 2 misses), and a mode: Endless, Lightning 60 s or Lightning 2 min. Problems never run out. +1 💎 per first-try answer, a 🎁 chest every 5 in a row. |
| **Daily Quest** | 5 mixed problems from the worlds she has opened. Gives crystals plus a bonus for each day in a row. |
| **Hatchery** | Spend 30 💎 on an egg, tap it 3 times, and hatch one of 14 rare creatures that only come from eggs. |
| **Badges & ranks** | 17 badges (streaks, collections, daily habit, lightning rounds, challenge problems). Explorer level grows with XP. |
| **Hints** | A wrong answer gets a strategy hint and one more try ("make a ten", "count up", "break a ten"). A second miss shows the answer with an explanation. |
| **Voice** | After each answer a voice says "Great job!" or a gentle "Oops! Try again." The next problem waits until the voice has finished; the **Next →** button skips the wait. Questions can be read aloud with 🔊 (automatic for kindergarten). Both can be turned off per child in *For grown-ups*. |
| **Navigation** | Every screen has a back button; result screens have Home. **👥 Switch** on the home screen (or the small avatar in the top bar) changes the child without reloading. The browser's back gesture moves between screens and asks before leaving a game. |
| **For grown-ups** | Protected by a multiplication question. Shows accuracy per topic with the standard code, activity for the last 14 days, recent mistakes, Placement Check history, settings (sound, *unlock all worlds*), save codes and reset. |

## Test Prep

Practice for the tests used in California schools. The app is not affiliated with these tests; all questions are original, written in the same formats and for the same standards.

- **Placement Check (in the style of i-Ready Diagnostic)** — both grades. About 30 questions for 2nd grade and 20 for kindergarten, across the four i-Ready domains: Number & Operations, Algebra & Algebraic Thinking, Measurement & Data, Geometry. The check is adaptive: every next question is chosen near the child's current estimated level (one ladder from *Early K* to *3rd grade+*), and like i-Ready the first check starts one grade below. No hints or feedback during the check. Questions include i-Ready style formats: **select all that apply**, **put in order**, and **tap the number line**.
  - Results: an estimated grade level for each domain and overall, compared with where most kids are at that time of year; a review of every answer; a practice plan that starts Endless Training on the two weakest domains at the right difficulty.
  - History with a growth chart is kept per child and synced across devices. i-Ready runs three times a year at school (fall, winter, spring); a check a week before is a good rhythm.
  - The level is the app's own estimate, not an official i-Ready scale score.
- **Math Kangaroo** — 2nd grade. The contest is held every March; levels 1–2 take the same test: 24 puzzles, 75 minutes, answers A–E, 8 puzzles each worth 3, 4 and 5 points (96 in all), no penalty for a wrong answer.
  - **Mock contest** with the same structure, with or without the 75-minute clock: an answer sheet A–E, a number strip to jump to any question, flags, a warning about blanks before finishing, then the score by section and a review with explanations.
  - **Practice by type**: 12 kinds of puzzles in contest style (counting shapes, balance scales, who is taller, calendar, coins, paths on a grid, flip and turn, cube towers, what comes next, hidden digits, age puzzles, and a hand-written bank of classics), each adapting its difficulty and explaining every answer.
  - Original puzzles in the contest's style; official past papers are sold by Math Kangaroo USA.
- **Joey Puzzles** — kindergarten (Math Kangaroo starts in 1st grade): 12 picture puzzles with 5 answers, read aloud, no clock.
- Coming next: CogAT practice for the GATE screening that Eureka Union gives every 2nd grader.

## Kindergarten track

Made for kids who are just starting to read: problems are mostly pictures, answer buttons can be emoji or shapes, and every question can be **read aloud** (🔊 button, or automatically for kindergarten profiles, using the browser's built-in speech).

| World | Topics | Standards |
|---|---|---|
| 🌻 Sunny Meadow | Counting objects to 20, numbers in order, count by tens | K.CC.1–5 |
| 🪷 Lily Pond | More, fewer, the same; comparing numbers | K.CC.6–7 |
| 🍎 Apple Orchard | Adding within 10 with pictures, story problems | K.OA.1–2, K.OA.5 |
| 🍂 Maple Woods | Taking away within 10 | K.OA.1–2, K.OA.5 |
| 🐚 Shell Beach | Ten-frames, making 10, teen numbers as 10 + ones | K.OA.4, K.NBT.1 |
| 💎 Crystal Caves | Flat and solid shapes, longer/taller/heavier, sorting, patterns | K.G, K.MD |
| 🌠 Star Bridge | Challenge zone: 1st-grade math (to 20, tens and ones, measuring with units) | 1.OA, 1.NBT, 1.MD |

Difficulty for kindergarten: 🌱 Sprout and 🧭 Explorer = core K, 🏕️ Ranger = strong K, 🏔️ Expert = end of K / start of 1st, 🐉 Legend = 1st grade. Endless Training works the same way as for 2nd grade, including **Auto** difficulty, which keeps raising the level while she gets answers right.

## 2nd-grade worlds and topics

| World | Topics | Standards |
|---|---|---|
| 🏖️ Tide Pools | Facts to 20, missing numbers, the equal sign | 2.OA.1–2 |
| 🌿 Rainforest | Place value, expanded form, compare, skip counting, rounding (challenge) | 2.NBT.1–4, 2.NBT.8 |
| 🌾 Savanna | Add and subtract within 100, with and without regrouping | 2.NBT.5–6, 2.NBT.9 |
| 🌙 Night Forest | Time to 5 minutes, a.m./p.m., elapsed time (challenge); coins, dollars, change | 2.MD.7–8 |
| 🏜️ Fossil Desert | Odd and even, arrays, shapes, halves/thirds/fourths, cubes | 2.OA.3–4, 2.G.1–3 |
| ❄️ Arctic | Rulers (in/cm), units, conversions; picture and bar graphs; perimeter and area (challenge) | 2.MD.1–6, 2.MD.9–10 |
| 🌊 Deep Ocean | Add and subtract within 1000; one- and two-step word problems | 2.NBT.7, 2.OA.1 |
| ☁️ Sky Kingdom | Challenge zone: multiplication, division, number puzzles, pyramids, magic squares | 3.OA, logic |

Difficulty: 🌱 Sprout (warm-up) · 🧭 Explorer and 🏕️ Ranger (core 2nd grade) · 🏔️ Expert (end of 2nd / start of 3rd) · 🐉 Legend (ahead of grade level).

## Project layout

```
index.html            app shell
css/style.css         all styles
js/util.js            helpers
js/visuals.js         SVG pictures: clocks, coins, base-ten blocks, rulers, graphs, shapes
js/generators.js      2nd-grade problem generators, 14 topics × 5 difficulties
js/generators-k.js    kindergarten problem generators, 10 topics × 5 difficulties
js/content.js         2nd-grade worlds and creatures, grade tracks, badges, buddy phrases
js/content-k.js       kindergarten worlds and baby animals
js/store.js           one saved profile per child (localStorage), stats, merging copies from two devices
js/cloud.js           family sync through Firebase (code + PIN, live updates, offline queue)
js/cloud-config.js    Firebase project settings (public identifiers)
js/vendor/            Firebase JS SDK 10.14.1 (compat builds), served with the app
js/testprep.js        Placement Check (grade ladder, adaptive questions, level estimate, practice plan) and mock contests
js/puzzles.js         Math Kangaroo style puzzle generators, hand-written puzzle bank, Joey puzzles
js/fx.js              sounds (Web Audio), read-aloud (Web Speech), confetti
js/app.js             screens and game logic
tools/build.py        bundles everything into dist/math-expedition.html (local-only copy)
.github/workflows/    automatic deploy to GitHub Pages
firestore.rules       Firestore security rules (paste into the Firebase console)
tests/                generator test (node) and browser smoke test (Playwright)
```

No build step or dependencies are needed to run it. After changing code, run:

```
node tests/generators.test.js      # 144,000 generated problems checked
node tests/store.test.js           # merging progress from two devices, family keys
node tests/testprep.test.js        # Placement Check accuracy on simulated children
node tests/smoke.mjs               # two children, both grades, played in Chromium (needs Playwright)
node tests/cloud-e2e.mjs           # two devices syncing through the real Firebase project
python3 tools/build.py             # refresh the single-file version in dist/
```
