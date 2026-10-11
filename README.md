# Math Expedition 🧭

A math trainer for kids in California, built for a kindergartner and a 2nd grader sharing one iPad. Each child explores their own map of worlds, solves problems, and discovers real animals with surprising science facts. Problems follow the California Common Core math standards for the child's grade, and every topic has harder levels that go ahead into the next grade.

## Several children, one device

- **Who's exploring?** On launch the app asks who is playing (with one profile it opens straight to that child). Each card shows the child's name, grade, level, crystals and creatures.
- **Separate profiles.** Every child has their own grade, world map, creatures, crystals, badges, daily streak, training settings and statistics. Nothing is shared between profiles.
- **Grade tracks.** A profile follows one grade track: **Kindergarten** (7 worlds, baby animals) or **2nd grade** (8 worlds, wild animals). A grown-up can move a child to another grade; progress in the old grade is kept.
- **Switching.** Tap the buddy avatar on the home screen (or the small avatar in the top bar) to go back to the picker.
- **Our other apps.** The picker and the home screen link to our other apps (WritingPower); each app keeps its own profiles and progress. From a child's home screen the link opens the same child in the other app. One family code + PIN works in all our apps, and an app offers *Use family …* with one tap when another of our apps on the device is already connected. The list is `MQ.APPS` in `js/content.js`.
- **Grown-ups page** shows the report for the current child and lists every explorer on the device: change grade, delete, add a new one.
- Progress from the first single-player version is moved into a 2nd-grade profile automatically.

## How to open it

- **Online (main way):** **https://appleinfire.github.io/Math/** — works on any phone, tablet or computer. On an iPad, open it in Safari, then Share → *Add to Home Screen* to get a full-screen app icon. It keeps working offline.
- **Same progress everywhere:** on the first device choose *Create a family* (family code + PIN). On every other device choose *I already have a family* and type the same code and PIN. Explorers, levels, creatures and crystals then stay in sync across all devices.
- **Updates:** every push to `main` is tested and published automatically by GitHub Actions in about a minute. See [docs/DEPLOY.md](docs/DEPLOY.md) for the setup and how sync works.
- **New apps on the same shell:** [docs/NEW-APP-GUIDE.md](docs/NEW-APP-GUIDE.md) (in Russian) has the steps and a prompt for a new chat; the shell itself is in `templates/app-shell/`.
- **Offline single file:** `dist/math-expedition.html` still works on its own (progress stays on that device).

## How the game works

| Part | What happens |
|---|---|
| **Expedition Map** | 8 worlds × 6 levels. A level asks for 5 correct answers (7 for the Guardian). Finishing a level discovers a creature for the Field Journal. Stars depend on mistakes: 0 → ★★★, 1–2 → ★★, more → ★. Beating a world's Guardian opens the next world. |
| **Endless Training** | Pick any topics, a difficulty (or **Auto**, which goes up after 4 first-try answers in a row and down after 2 misses), and a mode: Endless, Lightning 60 s or Lightning 2 min. Problems never run out. +1 💎 per first-try answer, a 🎁 chest every 5 in a row. |
| **Daily Quest** | 5 mixed problems from the worlds she has opened (2 of them are review questions when there are mistakes to practice). Gives crystals plus a bonus for each day in a row. |
| **Mistakes come back** | Every first-try mistake, in games and in tests, is saved as a skill to practice (topic + difficulty). A fresh question of that skill comes back as every 4th question in levels (only topics of that world and earlier), Endless Training and Practice by type, in 2 of the 5 Daily Quest questions, and in the next Math Kangaroo or Logic challenge (up to 3 puzzles, in the matching point section). They are marked 🔁 Review. Never in the Placement Check (it would change the level) or in Lightning rounds. A skill is **fixed** after a right first answer on 3 different days (today, then 1 day later, then 3 days later); a new mistake starts it over. |
| **🛠️ Fix-it Lab** | Lists the skills in repair with their progress (●●○) and plays up to 10 that are due today, with a strategy tip. Fixing a skill gives +3 💎. Badges for 10 and 50 fixes. |
| **📈 My Progress** | Accuracy (right on the first try) by week, or by month for long ranges and for a single topic, over 1, 3 or 6 months or all time, with a trend line and a plain verdict ("Getting better: +8 points over 3 months"). Problems per week, right / not yet counts, days practiced. A **skill map** shows every topic as 🌱 started → 🌿 practicing → ⭐ solid → 🏆 mastered (80% right on 5+ tries at that difficulty); tap a skill to practice it. Charts of every practice test over time. Daily totals are kept for two years and per-topic monthly totals for three. |
| **Strategy tips** | After two misses of the same kind of problem in one session, the next question of that kind starts with a short tip ("Make a ten: 8 + 5 → 8 + 2 + 3"). Every topic has tips, at most one a day per topic. |
| **Daily goal** | A grown-up can set problems per day (10–50) and goal days per week. The home screen shows a ring for today and the days of the week; a badge for a week that reaches the goal. |
| **Hatchery** | Spend 30 💎 on an egg, tap it 3 times, and hatch one of 14 rare creatures that only come from eggs. |
| **Badges & ranks** | 29 badges (streaks, collections, daily habit, lightning rounds, challenge problems, Sunny Farm). Explorer level grows with XP. |
| **Hints** | A wrong answer gets a strategy hint and one more try ("make a ten", "count up", "break a ten"). A second miss shows the answer with an explanation. |
| **Voice** | After each answer a voice says "Great job!" or a gentle "Oops! Try again." The next problem waits until the voice has finished; the **Next →** button skips the wait. Questions can be read aloud with 🔊 (automatic for kindergarten). Both can be turned off per child in *For grown-ups*. |
| **Navigation** | Every screen has a back button; result screens have Home. **👥 Switch** on the home screen (or the small avatar in the top bar) changes the child without reloading. The browser's back gesture moves between screens and asks before leaving a game. |
| **For grown-ups** | Protected by a multiplication question. Shows progress over time (the same charts as My Progress), accuracy per topic with the standard code, activity for the last 14 days, recent mistakes and how many are in repair, test history, the daily goal, settings (sound, *unlock all worlds*), save codes and reset. **👀 Look at every level** starts a grown-up preview: every world and level is open, Practice by type can start at any level 1–5, and nothing is saved (no stars, crystals, statistics, mistakes or test results, nothing unlocked for the child, nothing synced). A purple bar shows it is on; **Exit**, opening For grown-ups again, switching explorer or reloading ends it. |

## 🌻 Sunny Farm

A mini-game about real money (pretend money, no real purchases). The child runs a small farm, sells what it makes at their own stand and spends the money on the farm. Every sale and every purchase is a money problem with US coins and bills. The rules and problems are in `js/farm.js`, the screens in `js/farm-ui.js`.

- **The farm.** Garden beds grow crops (plant seeds → wait a few days → pick). Animals in pens grow up when they are fed (baby → young → grown-up); a fed grown-up gives eggs, honey, milk, wool… the next morning. Animals never get sick or leave: an animal that wasn't fed just doesn't grow that night. **🌙 Sleep** starts the next day whenever the child wants; there is no real-time waiting and no limit on how much they play.
- **The stand.** Customers come while there is something in the basket. Each one brings a problem: count the coins they pay with, the total for 3 eggs, the change from $1, tap coins to give change, do they have enough, money left after buying two things. A first-try right answer earns a tip (bigger with a nicer stand) and XP; after a hint or a shown answer the customer still buys, so nothing is lost. Every 5th customer is a **⭐ challenge customer** with a problem one tier above the child's (a big tip for a first-try right answer).
- **Paying.** In the shop the child pays with coins and bills from a tray. Kindergarten pays the exact amount; a 2nd grader may pay more (a quarter for 15¢ seeds) and then works out the change.
- **The shop.** Seeds for 12 crops, feed, 14 animals (from chickens to a unicorn), more beds and pens (up to 10 each), 8 workshops, 7 stands (table → royal market, bigger tips) and 28 decorations up to a dragon friend. Anything can be set as a **⭐ saving goal**, even before it opens, with a progress bar on the farm.
- **A living farm.** The farm is drawn as a scene (emoji, CSS and a few SVGs, no image files): sky with clouds, garden beds where seedlings grow into crops, pens where animals walk around (babies are small), eggs and milk lying in the grass, a yard with the stand. Picked crops fly into the basket, feed flies to the animal and hearts pop up, coins fly from the customer to the money and the number counts up, a customer walks up to the stall, the night passes with a moon and stars. Bought decorations appear on the farm: a barn and a turning windmill on the hill, a rainbow, a balloon, a pond with a swan, a running dog, a tractor driving by, a helicopter, a UFO and a dragon in the sky, a fun park with a carousel and a Ferris wheel. Workshops stand in a row with smoke while they work; fish swim in the fish pond, silkworms crawl on leaves, the unicorn sparkles. With *Reduce motion* turned on in the device settings nothing moves.
- **Workshops.** A jam kitchen, bakery, cheese dairy, knitting room, juice bar, tailor shop, restaurant and sweet shop turn what the farm makes into things worth more: 4 strawberries → a jar of jam, 3 glasses of milk → cheese, cheese + tomatoes + a pineapple → pizza. A batch is ready after one or two nights. Before each batch the child answers *is it worth it?*: the inputs sell for 80¢, the jam for $1.20, how much more? Every recipe brings more than its inputs (checked by the tests).
- **The bank** (from farm level 10). The child saves money from the wallet by tapping coins and bills, then counts how much they put in. Every 7 real days is a bank day: the bank adds 10¢ for every whole dollar saved (kindergarten: 1¢ for every 10¢), at most $5 (50¢) a week, and the child works out the interest before it is added. At most 4 missed weeks are paid. The bank page shows a bank book and a chart of how the savings grow week by week if they stay in the bank. Money can be taken out any time; savings count toward the saving goal.
- **Odd jobs** at the big market pay a small wage per problem, so a child is never stuck with no money.
- **Growing for a long time.** Farm level has no top (level 10 ≈ 650 XP, level 50 ≈ 13,000 XP, level 60 ≈ 19,000 XP, about 3,500 problems). Every level up to 60 opens something (a crop, an animal, a workshop or recipe, a bed, a pen, a stand, a decoration, the bank or new money problems; checked by the tests), and decorations keep coming after 60. Each level pays a money gift, and the farmer's title grows: little farmer → farm helper → farmer → rancher → farm boss → market master → farm tycoon → farm legend (60) → farm hero → farm superstar.
- **Money problems by tier.** A tier opens with the farm level, and the child climbs the open tiers by answering (4 first-try right in a row → up, 2 misses → down).
  - Kindergarten (prices in cents, read aloud): pennies to 10¢ → nickels to 20¢ and change from a dime → ⭐ dimes to 50¢ → ⭐ quarters to 99¢ → ⭐ dollars and saving (interest, how much more something made is worth).
  - 2nd grade: coins to 50¢ → quarters to 99¢, change from $1 → dollars → change from $5, budgets → ⭐ big orders (3 × 85¢, change from $10/$20) → ⭐ deals (2 for $1.70) and profit (seeds cost vs. harvest sold) → ⭐ interest and adding value.
  - ⭐ tiers are ahead of the grade's standards: challenges to grow into.
- **With the rest of the app.** Farm problems count in the daily totals (daily goal, My Progress). The Daily Quest also brings 5 bags of feed. 8 farm badges. *For grown-ups* shows the farm level, money, accuracy and the tier being practiced. The farm syncs with the family; when two devices changed it, the one changed last wins.

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
- **CogAT practice** — 2nd grade. Eureka Union School District gives the CogAT to every 2nd grader as one part of GATE screening (ask the school for the date). The 2nd-grade test is all pictures with spoken directions, in three parts, and the app practices all nine question types:
  - Verbal: picture analogies, sentence completion (spoken question, picture answers), picture classification;
  - Quantitative: number analogies with groups of pictures, number puzzles with picture equations, number series on an abacus;
  - Nonverbal: figure matrices, figure classification, paper folding.
  - Practice by type (gets harder as she gets them right, every answer explained) or a 45-question practice test: 15 per part, 4 answers each, with a clock that shows time used but never stops the test. Results show how many were right in each part and each question type.
  - Original questions in the CogAT style; not affiliated with the publisher. Real CogAT percentiles cannot be estimated from practice, so the app doesn't show any.
- **Brain Games** — kindergarten: 18 easy CogAT-style picture questions (2 of each type), read aloud, no clock.
- **Logic Lab** — both grades. Word logic that school topics don't cover, and that Math Kangaroo and CogAT reward. Six types, each at 5 levels (levels 4–5 are the Advanced section): **Who is first?** (order from clues, standing in a line), **Who has what?** (cross out the impossible), **Yes, No or Can't tell** (all / some / none, if…then, only, made-up words), **Think it through** (everyday situations: what happens next, why, what must be true, best plan), **Count the ways** (outfits, handshakes, orders, "how many to be sure"), **Truth or fib?** (truth-tellers and fibbers). Clue puzzles are built from a hidden answer and checked by trying every possibility, so each has exactly one solution; every answer is explained. Practice by type, or a 12-puzzle Advanced challenge (levels 4 and 5). Kindergarten gets 4 of the types at levels 1–2, read aloud, and an 8-puzzle set.
- **ⓘ What is this test?** Every test card has an ⓘ button: what the test is, where and when it is used (school, contest, GATE screening), what it checks, and how to practice with the app. Every Practice-by-type tile has a one-line description.
- **Take a break any time.** An unfinished Placement Check or practice test is saved after every answer and when the page is closed. The test card then offers **Continue** (same questions, same answers; a running clock waits) or **Start over**. Unfinished tests are kept on the device where they were started.
- **Retakes bring new questions.** Every test and practice set is built fresh from generators and hand-written sets (20+ different questions per level for every type). The app remembers the last 80 questions each child saw per type (synced across devices) and only repeats one when nothing new is left, starting with the one seen longest ago.

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
js/cogat.js           CogAT style question generators (Verbal, Quantitative, Nonverbal)
js/logic.js           Logic Lab generators (order, who has what, yes/no/can't tell, situations, counting, truth-tellers)
js/farm.js            Sunny Farm rules: prices, crops, animals, shop, levels, money problems for customers
js/farm-ui.js         Sunny Farm screens: farm, shop, stand, odd jobs, paying with coins
js/farm-scene.js      Sunny Farm pictures and animations: farm scene, market stall, flying coins, night
js/fx.js              sounds (Web Audio), read-aloud (Web Speech), confetti
js/app.js             screens and game logic
tools/build.py        bundles everything into dist/math-expedition.html (local-only copy)
.github/workflows/    automatic deploy to GitHub Pages
firestore.rules       Firestore security rules (paste into the Firebase console)
tests/                generator test (node) and browser smoke test (Playwright)
templates/app-shell/   the same shell (profiles, family sync, grown-ups page, preview, deploy) without the math, for new apps
```

No build step or dependencies are needed to run it. After changing code, run:

```
node tests/generators.test.js      # 312,000 generated problems checked
node tests/store.test.js           # merging progress from two devices, mistakes to practice, family keys
node tests/testprep.test.js        # Placement Check accuracy on simulated children, mock tests with review questions
node tests/farm.test.js            # Sunny Farm economy, days, shop, and thousands of customer problems for both grades
node tests/smoke.mjs               # two children, both grades, played in Chromium (needs Playwright)
node tests/farm-smoke.mjs          # Sunny Farm played by a 2nd grader and a kindergartner in Chromium
node tests/cloud-e2e.mjs           # two devices syncing through the real Firebase project
python3 tools/build.py             # refresh the single-file version in dist/
```
