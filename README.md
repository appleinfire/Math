# Math Expedition 🧭

A math trainer for a 2nd grader in California. She explores eight worlds, solves problems, and discovers real animals with surprising science facts. Everything follows the California Common Core math standards for 2nd grade, and every topic also has harder levels that go ahead into 3rd grade.

## How to open it

- **Simplest:** open `dist/math-expedition.html` in any browser. It is one file, so you can AirDrop or email it to an iPad and open it in Safari. It works offline.
- **As an app on the iPad:** host the folder with GitHub Pages (Settings → Pages → deploy from this branch, folder `/`), open the link in Safari, then Share → *Add to Home Screen*. It then opens full screen and works offline.

Progress is saved in the browser on that device. To move it to another device, use **For grown-ups → Move progress to another device**.

## How the game works

| Part | What happens |
|---|---|
| **Expedition Map** | 8 worlds × 6 levels. A level asks for 5 correct answers (7 for the Guardian). Finishing a level discovers a creature for the Field Journal. Stars depend on mistakes: 0 → ★★★, 1–2 → ★★, more → ★. Beating a world's Guardian opens the next world. |
| **Endless Training** | Pick any topics, a difficulty (or **Auto**, which goes up after 4 first-try answers in a row and down after 2 misses), and a mode: Endless, Lightning 60 s or Lightning 2 min. Problems never run out. +1 💎 per first-try answer, a 🎁 chest every 5 in a row. |
| **Daily Quest** | 5 mixed problems from the worlds she has opened. Gives crystals plus a bonus for each day in a row. |
| **Hatchery** | Spend 30 💎 on an egg, tap it 3 times, and hatch one of 14 rare creatures that only come from eggs. |
| **Badges & ranks** | 17 badges (streaks, collections, daily habit, lightning rounds, challenge problems). Explorer level grows with XP. |
| **Hints** | A wrong answer gets a strategy hint and one more try ("make a ten", "count up", "break a ten"). A second miss shows the answer with an explanation. |
| **For grown-ups** | Protected by a multiplication question. Shows accuracy per topic with the standard code, activity for the last 14 days, recent mistakes, settings (sound, *unlock all worlds*), save codes and reset. |

## Worlds and topics

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
js/generators.js      problem generators, 14 topics × 5 difficulties
js/content.js         worlds, creatures and facts, badges, buddy phrases
js/store.js           saving progress (localStorage) and stats
js/fx.js              sounds (Web Audio) and confetti
js/app.js             screens and game logic
tools/build.py        bundles everything into dist/math-expedition.html
tests/                generator test (node) and browser smoke test (Playwright)
```

No build step or dependencies are needed to run it. After changing code, run:

```
node tests/generators.test.js      # 105,000 generated problems checked
node tests/smoke.mjs               # plays through the app in Chromium (needs Playwright)
python3 tools/build.py             # refresh the single-file version in dist/
```
