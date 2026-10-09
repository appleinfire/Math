// Game content: expedition worlds, creatures to discover, hatchery eggs, badges, ranks, companion lines.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  // Each world = one biome + a cluster of math topics.
  // Each level: topics, difficulty range [min,max], goal (correct answers needed), type, creature reward.
  const L = (MQ.L = (topics, d, creature, type = 'normal', goal) => ({
    topics, d: Array.isArray(d) ? d : [d, d], creature, type, goal: goal || (type === 'boss' ? 7 : 5),
  }));

  MQ.WORLDS = [
    {
      id: 'tide', name: 'Tide Pools', emoji: '🏖️', color: '#2bb3a3', tint: '#d9f4ef', blurb: 'Addition & subtraction facts to 20',
      levels: [
        L(['add20'], 1, 'hermit'), L(['add20'], 2, 'puffer'), L(['add20'], 3, 'mantis'), L(['add20'], 4, 'nautilus'),
        L(['add20'], 5, 'lobster', 'challenge'), L(['add20', 'logic'], [4, 5], 'otter', 'boss'),
      ],
    },
    {
      id: 'rain', name: 'Rainforest', emoji: '🌿', color: '#3f9d4b', tint: '#def2d9', blurb: 'Place value: ones, tens, hundreds',
      levels: [
        L(['place'], 1, 'dartfrog'), L(['place'], 2, 'sloth'), L(['place'], 3, 'macaw'), L(['place'], 4, 'chameleon'),
        L(['place'], 5, 'jaguar', 'challenge'), L(['place'], [3, 5], 'orangutan', 'boss'),
      ],
    },
    {
      id: 'savanna', name: 'Savanna', emoji: '🌾', color: '#e09a2b', tint: '#fbecd2', blurb: 'Adding & subtracting within 100',
      levels: [
        L(['add100'], [1, 2], 'zebra'), L(['sub100'], [1, 2], 'giraffe'), L(['add100'], 3, 'rhino'), L(['sub100'], 3, 'hippo'),
        L(['add100', 'sub100'], [4, 5], 'elephant', 'challenge'), L(['add100', 'sub100', 'words'], [3, 4], 'lion', 'boss'),
      ],
    },
    {
      id: 'night', name: 'Night Forest', emoji: '🌙', color: '#5b63c9', tint: '#e2e4fa', blurb: 'Telling time & counting money',
      levels: [
        L(['time'], 1, 'owl'), L(['money'], 1, 'bat'), L(['time'], [2, 3], 'raccoon'), L(['money'], [2, 3], 'fox'),
        L(['time', 'money'], [4, 5], 'hedgehog', 'challenge'), L(['time', 'money'], [3, 4], 'wolf', 'boss'),
      ],
    },
    {
      id: 'desert', name: 'Fossil Desert', emoji: '🏜️', color: '#d4703a', tint: '#fae1d3', blurb: 'Odd & even, arrays, shapes, fractions',
      levels: [
        L(['arrays'], 1, 'scorpion'), L(['shapes'], [1, 2], 'camel'), L(['arrays'], [2, 3], 'sidewinder'), L(['shapes'], 3, 'kangaroo'),
        L(['arrays', 'shapes'], [4, 5], 'brachio', 'challenge'), L(['arrays', 'shapes'], [3, 4], 'trex', 'boss'),
      ],
    },
    {
      id: 'arctic', name: 'Arctic', emoji: '❄️', color: '#3a8fd1', tint: '#dbecf9', blurb: 'Measuring length & reading graphs',
      levels: [
        L(['measure'], 1, 'penguin'), L(['data'], [1, 2], 'seal'), L(['measure'], [2, 3], 'reindeer'), L(['data'], 3, 'hare'),
        L(['measure', 'data'], [4, 5], 'mammoth', 'challenge'), L(['measure', 'data'], [3, 4], 'polarbear', 'boss'),
      ],
    },
    {
      id: 'ocean', name: 'Deep Ocean', emoji: '🌊', color: '#1f6fb2', tint: '#d6e6f5', blurb: 'Numbers to 1000 & word problems',
      levels: [
        L(['big'], 1, 'octopus'), L(['words'], [1, 2], 'dolphin'), L(['big'], [2, 3], 'turtle'), L(['words'], 3, 'squid'),
        L(['big', 'words'], [4, 5], 'shark', 'challenge'), L(['big', 'words'], [4, 5], 'bluewhale', 'boss'),
      ],
    },
    {
      id: 'sky', name: 'Sky Kingdom', emoji: '☁️', color: '#b0569e', tint: '#f6dff1', blurb: 'Challenge zone: multiplication & logic puzzles',
      levels: [
        L(['mult'], 1, 'bee'), L(['logic'], [1, 2], 'monarch'), L(['mult'], [2, 3], 'flamingo'), L(['logic'], 3, 'peacock'),
        L(['mult', 'logic'], 4, 'eagle', 'challenge'), L(['mult', 'logic'], 5, 'dragon', 'boss'),
      ],
    },
  ];

  const C = (MQ.C = (id, emoji, name, fact, rarity = 'common') => ({ id, emoji, name, fact, rarity }));
  MQ.CREATURES = {
    // Tide Pools
    hermit: C('hermit', '🦀', 'Hermit Crab', 'When a hermit crab finds a bigger shell, crabs sometimes line up from biggest to smallest and all swap shells at once — like a housing chain!'),
    puffer: C('puffer', '🐡', 'Pufferfish', 'A pufferfish gulps water fast to blow itself up into a spiky ball several times bigger than normal.'),
    mantis: C('mantis', '🦐', 'Mantis Shrimp', 'A mantis shrimp punches faster than a blink. It also has 12 kinds of color sensors in its eyes. You have only 3!'),
    nautilus: C('nautilus', '🐚', 'Nautilus', 'A nautilus shell grows in a spiral. Each time it grows, it builds a new, bigger room and moves into it.'),
    lobster: C('lobster', '🦞', 'Lobster', 'Lobsters can taste with their legs and smell with tiny hairs on their antennae.', 'rare'),
    otter: C('otter', '🦦', 'Sea Otter', 'Sea otters hold paws while they sleep so they don’t drift apart. Each one keeps a favorite rock in a skin pocket under its arm to crack shells.', 'legendary'),
    // Rainforest
    dartfrog: C('dartfrog', '🐸', 'Poison Dart Frog', 'Its bright colors are a warning sign that says: “Don’t eat me!” Some are smaller than a paper clip.'),
    sloth: C('sloth', '🦥', 'Sloth', 'Sloths move so slowly that tiny green algae grows in their fur — free camouflage!'),
    macaw: C('macaw', '🦜', 'Macaw', 'Macaws gather at riverbanks to nibble clay. Scientists think the clay gives them salt they can’t get from fruit.'),
    chameleon: C('chameleon', '🦎', 'Chameleon', 'A chameleon’s tongue can be twice as long as its body, and it shoots out in a fraction of a second.'),
    jaguar: C('jaguar', '🐆', 'Jaguar', 'Unlike most big cats, jaguars love water. They are strong swimmers and even catch fish and caimans.', 'rare'),
    orangutan: C('orangutan', '🦧', 'Orangutan', 'When it rains, orangutans hold big leaves over their heads like umbrellas.', 'legendary'),
    // Savanna
    zebra: C('zebra', '🦓', 'Zebra', 'No two zebras have the same stripes — each pattern is as unique as a fingerprint.'),
    giraffe: C('giraffe', '🦒', 'Giraffe', 'A giraffe’s neck has 7 bones — the same number as yours! Each bone is just much, much longer.'),
    rhino: C('rhino', '🦏', 'Rhinoceros', 'A rhino’s horn is made of keratin, the same stuff as your fingernails.'),
    hippo: C('hippo', '🦛', 'Hippo', 'Hippos can’t really swim. They walk and bounce along the bottom of the river.'),
    elephant: C('elephant', '🐘', 'Elephant', 'Elephants can feel rumbles from other elephants through the ground with their feet, from miles away.', 'rare'),
    lion: C('lion', '🦁', 'Lion', 'A lion’s roar can be heard about 5 miles (8 km) away.', 'legendary'),
    // Night Forest
    owl: C('owl', '🦉', 'Owl', 'Owls can’t move their eyes, so they turn their heads instead — up to 270 degrees, three-quarters of a full circle!'),
    bat: C('bat', '🦇', 'Bat', 'Bats are the only mammals that truly fly. Many “see” in the dark by listening to the echoes of their own calls.'),
    raccoon: C('raccoon', '🦝', 'Raccoon', 'Raccoons have super-sensitive fingers. They can open jars, latches and even some doors.'),
    fox: C('fox', '🦊', 'Red Fox', 'Red foxes seem to use Earth’s magnetic field to aim their high pounces onto mice hiding under the snow.'),
    hedgehog: C('hedgehog', '🦔', 'Hedgehog', 'A hedgehog has about 5,000 to 7,000 spines. Each spine lasts about a year before it falls out and regrows.', 'rare'),
    wolf: C('wolf', '🐺', 'Gray Wolf', 'When wolves howl together, each one picks a different note, so a small pack sounds much bigger.', 'legendary'),
    // Fossil Desert
    scorpion: C('scorpion', '🦂', 'Scorpion', 'Scorpions glow bright blue-green under ultraviolet light. Nobody is completely sure why!'),
    camel: C('camel', '🐫', 'Camel', 'A camel’s hump stores fat, not water. A thirsty camel can drink about 30 gallons of water in 15 minutes.'),
    sidewinder: C('sidewinder', '🐍', 'Sidewinder', 'Sidewinder snakes move sideways in loops so only two small parts of their body touch the hot sand.'),
    kangaroo: C('kangaroo', '🦘', 'Red Kangaroo', 'A red kangaroo can cover about 25 feet in a single hop — longer than a school bus is wide… times three!'),
    brachio: C('brachio', '🦕', 'Brachiosaurus', 'Brachiosaurus was as tall as a 4-story building and could peek over the top of trees.', 'rare'),
    trex: C('trex', '🦖', 'Tyrannosaurus rex', 'A T. rex tooth, root included, could be as long as a banana. It had the strongest bite of any land animal ever found.', 'legendary'),
    // Arctic
    penguin: C('penguin', '🐧', 'Emperor Penguin', 'Emperor penguin dads balance the egg on their feet for about 2 months, through the winter, without eating.'),
    seal: C('seal', '🦭', 'Harbor Seal', 'Seals can nap underwater and float up to breathe without fully waking up.'),
    reindeer: C('reindeer', '🦌', 'Reindeer', 'Reindeer eyes change color with the seasons: golden in summer and blue in the dark winter.'),
    hare: C('hare', '🐇', 'Arctic Hare', 'Arctic hares can run almost 40 miles per hour, sometimes hopping on just their back legs like a kangaroo.'),
    mammoth: C('mammoth', '🦣', 'Woolly Mammoth', 'A few woolly mammoths were still alive on an Arctic island when the Egyptian pyramids were being built!', 'rare'),
    polarbear: C('polarbear', '🐻‍❄️', 'Polar Bear', 'Polar bear fur is actually see-through, not white, and the skin underneath is black to soak up sunlight.', 'legendary'),
    // Deep Ocean
    octopus: C('octopus', '🐙', 'Octopus', 'An octopus has 3 hearts, 8 arms, blue blood, and a mini-brain in every arm. Count it: 9 brains in all!'),
    dolphin: C('dolphin', '🐬', 'Dolphin', 'Each dolphin has its own signature whistle — it works like a name that friends use to call it.'),
    turtle: C('turtle', '🐢', 'Sea Turtle', 'Sea turtles swim thousands of miles, then come back to the very beach where they hatched to lay their eggs.'),
    squid: C('squid', '🦑', 'Giant Squid', 'A giant squid’s eye can be as big as a dinner plate — one of the largest eyes of any animal.'),
    shark: C('shark', '🦈', 'Shark', 'Sharks are older than trees! They have been swimming in the oceans for over 400 million years.', 'rare'),
    bluewhale: C('bluewhale', '🐋', 'Blue Whale', 'The blue whale is the biggest animal that has ever lived. Its heart is about as big as a bumper car.', 'legendary'),
    // Sky Kingdom
    bee: C('bee', '🐝', 'Honeybee', 'Bees build their honeycomb out of hexagons — the shape that holds the most honey using the least wax.'),
    monarch: C('monarch', '🦋', 'Monarch Butterfly', 'Monarchs fly up to 3,000 miles to Mexico. No single butterfly has made the trip before — they just know the way.'),
    flamingo: C('flamingo', '🦩', 'Flamingo', 'Flamingos are born gray. They turn pink from the tiny shrimp and algae they eat.'),
    peacock: C('peacock', '🦚', 'Peacock', 'A peacock’s tail has about 200 shimmering feathers, each with an “eye” pattern made by light, not paint.'),
    eagle: C('eagle', '🦅', 'Golden Eagle', 'An eagle can spot a rabbit from about 2 miles away. Its eyes are bigger than a human’s, even though its head is tiny.', 'rare'),
    dragon: C('dragon', '🐉', 'Sky Dragon', 'Guardian of the Sky Kingdom! Real-life fact: the Komodo dragon is a lizard that can grow 10 feet long.', 'legendary'),
  };

  // Rare creatures that only hatch from eggs in the Hatchery.
  MQ.EGG_CREATURES = [
    C('unicorn', '🦄', 'Unicorn', 'The real “unicorn of the sea” is the narwhal. Its long tusk is actually a tooth that grows through its lip!', 'mythic'),
    C('dodo', '🦤', 'Dodo', 'Dodos lived on the island of Mauritius. They disappeared about 350 years ago, so nobody alive has ever seen one.', 'mythic'),
    C('beaver', '🦫', 'Beaver', 'Beaver teeth are orange because they contain iron, which makes them extra strong for chewing trees.'),
    C('skunk', '🦨', 'Spotted Skunk', 'Before spraying, a spotted skunk does a handstand as a final warning.'),
    C('squirrel', '🐿️', 'Squirrel', 'Squirrels bury thousands of nuts and forget some of them — so they plant lots of new trees!'),
    C('panda', '🐼', 'Giant Panda', 'Pandas spend around 12 hours a day eating bamboo.'),
    C('koala', '🐨', 'Koala', 'Koalas have fingerprints so much like ours that they could confuse a detective.'),
    C('badger', '🦡', 'Honey Badger', 'Honey badgers are famously fearless and have thick, loose skin that helps protect them from bee stings.'),
    C('snail', '🐌', 'Snail', 'A snail’s tongue is covered with thousands of tiny teeth.'),
    C('ladybug', '🐞', 'Ladybug', 'One ladybug can eat about 5,000 aphids in its life. Gardeners love them!'),
    C('croc', '🐊', 'Crocodile', 'Crocodiles can’t stick out their tongues. They also swallow stones to help them dive.'),
    C('llama', '🦙', 'Llama', 'Llamas hum to talk to each other, especially mothers to their babies.'),
    C('swan', '🦢', 'Swan', 'A swan can have more than 25,000 feathers.', 'rare'),
    C('crowned', '🦚', 'White Peacock', 'Some peacocks are pure white. They are not albino — they just don’t make color in their feathers.', 'mythic'),
  ];
  MQ.EGG_PRICE = 30;

  // A track = one grade: its own world map, topics, and creatures. Each child's profile follows one track.
  MQ.TRACKS = {
    g2: {
      id: 'g2', label: '2nd grade', short: '2nd', worlds: MQ.WORLDS,
      core: ['add20', 'place', 'add100', 'sub100', 'arrays', 'time', 'money', 'shapes', 'measure', 'data', 'big', 'words'],
      ahead: ['mult', 'logic'], aheadLabel: 'Challenge — ahead of 2nd grade',
      dLabels: ['', 'warm-up', '2nd grade', 'strong 2nd', 'end of 2nd', '3rd grade!'],
      daily: [2, 4], paper: '#eef5f2',
      school: 'Problems follow the California Common Core standards for 2nd grade. Difficulty: 🌱 Sprout = warm-up, 🧭 Explorer and 🏕️ Ranger = core 2nd grade, 🏔️ Expert = end of 2nd / start of 3rd, 🐉 Legend = challenge problems from 3rd grade and beyond. Each world ends with a ⚡ Challenge level and a 👑 Guardian level that mixes topics. The Sky Kingdom is all 3rd-grade challenge material: multiplication, division and logic puzzles.',
    },
  };
  MQ.track = (grade) => MQ.TRACKS[grade] || MQ.TRACKS.g2;
  MQ.trackWorlds = (s) => MQ.track(s.grade).worlds;
  MQ.trackCreatures = (grade) => [...MQ.track(grade).worlds.flatMap((w) => w.levels.map((l) => MQ.CREATURES[l.creature])), ...MQ.EGG_CREATURES];
  // Call after a track's worlds and creatures are registered.
  MQ.linkCreatures = () => {
    Object.values(MQ.TRACKS).forEach((t) => t.worlds.forEach((w) => w.levels.forEach((l) => (MQ.CREATURES[l.creature].world = w.id))));
    MQ.EGG_CREATURES.forEach((c) => (c.world = 'egg'));
    MQ.ALL_CREATURES = [...Object.values(MQ.CREATURES), ...MQ.EGG_CREATURES];
  };
  MQ.linkCreatures();
  MQ.creatureById = (id) => MQ.ALL_CREATURES.find((c) => c.id === id);
  MQ.worldById = (id) => Object.values(MQ.TRACKS).flatMap((t) => t.worlds).find((w) => w.id === id);

  MQ.COMPANIONS = [
    { e: '🦊', n: 'Fox' }, { e: '🐙', n: 'Octopus' }, { e: '🦉', n: 'Owl' },
    { e: '🐉', n: 'Dragon' }, { e: '🦦', n: 'Otter' }, { e: '🐢', n: 'Turtle' },
  ];

  // Explorer level from XP: level L needs 50·L·(L−1) XP (0, 100, 300, 600, 1000, …).
  MQ.levelFromXp = (xp) => {
    let L = 1;
    while (50 * (L + 1) * L <= xp) L++;
    return { level: L, from: 50 * L * (L - 1), to: 50 * (L + 1) * L };
  };
  MQ.rankTitle = (L) =>
    L < 3 ? 'Rookie Explorer' : L < 6 ? 'Trail Scout' : L < 10 ? 'Field Naturalist' : L < 15 ? 'Expedition Leader' : L < 20 ? 'Master Explorer' : 'Legendary Explorer';

  MQ.BADGES = [
    { id: 'first', icon: '🎒', name: 'First Steps', desc: 'Finish your first level', test: (s) => Object.keys(s.levels).length >= 1 },
    { id: 'boss', icon: '🛡️', name: 'Guardian Friend', desc: 'Beat a world guardian (boss level)', test: (s) => MQ.trackWorlds(s).some((w) => s.levels[w.id + '-5']) },
    { id: 'col10', icon: '📔', name: 'Naturalist', desc: 'Discover 10 creatures', test: (s) => Object.keys(s.creatures).length >= 10 },
    { id: 'col30', icon: '🔭', name: 'Field Scientist', desc: 'Discover 25 creatures', test: (s) => Object.keys(s.creatures).length >= 25 },
    { id: 'colall', icon: '🌍', name: 'Living Encyclopedia', desc: 'Discover every creature', test: (s) => Object.keys(s.creatures).length >= MQ.trackCreatures(s.grade).length },
    { id: 'streak10', icon: '🔥', name: 'On Fire', desc: '10 right in a row', test: (s) => s.stats.bestStreak >= 10 },
    { id: 'streak25', icon: '☄️', name: 'Unstoppable', desc: '25 right in a row', test: (s) => s.stats.bestStreak >= 25 },
    { id: 'solve100', icon: '💯', name: 'Century', desc: 'Solve 100 problems', test: (s) => s.stats.correct >= 100 },
    { id: 'solve500', icon: '🏔️', name: 'Mountain of Math', desc: 'Solve 500 problems', test: (s) => s.stats.correct >= 500 },
    { id: 'solve1000', icon: '🚀', name: 'Thousand Club', desc: 'Solve 1,000 problems', test: (s) => s.stats.correct >= 1000 },
    { id: 'perfect', icon: '🌟', name: 'Star Collector', desc: 'Get 3 stars on every level in a world', test: (s) => MQ.trackWorlds(s).some((w) => w.levels.every((_, i) => (s.levels[w.id + '-' + i] || {}).stars === 3)) },
    { id: 'daily3', icon: '📅', name: 'Habit Builder', desc: 'Daily Quest 3 days in a row', test: (s) => s.daily.best >= 3 },
    { id: 'daily7', icon: '🗓️', name: 'Week Warrior', desc: 'Daily Quest 7 days in a row', test: (s) => s.daily.best >= 7 },
    { id: 'light15', icon: '⚡', name: 'Lightning Brain', desc: '15 right in a 60-second Lightning Round', test: (s) => (s.stats.lightning60 || 0) >= 15 },
    { id: 'egg', icon: '🥚', name: 'Hatchling', desc: 'Hatch your first egg', test: (s) => s.eggsHatched >= 1 },
    { id: 'ahead', icon: '🧠', name: 'Big Brain', desc: 'Solve 25 challenge-level problems', test: (s) => (s.stats.d5 || 0) >= 25 },
    { id: 'sky', icon: '🌠', name: 'Summit Explorer', desc: 'Befriend the guardian of the last world', test: (s) => { const w = MQ.trackWorlds(s); return !!s.levels[w[w.length - 1].id + '-5']; } },
  ];

  MQ.SAY = {
    hello: ['Ready for an adventure?', 'Let’s discover something amazing today!', 'Your brain is a muscle. Let’s train it!', 'I packed snacks and a magnifying glass!'],
    correct: ['Brilliant!', 'You nailed it!', 'Super sharp!', 'Exactly right!', 'Spot on!', 'Wow, great thinking!', 'Math wizard!', 'Nice work!', 'Yes! 🎉', 'Perfect!'],
    retry: ['Not quite. Peek at the hint and try again!', 'Almost! Mistakes help your brain grow.', 'Take another look — you can do it.', 'Hmm, try a different way.'],
    reveal: ['That one was tricky. Now you know the trick!', 'Let’s remember this one together.', 'Every explorer gets lost sometimes. On to the next!'],
    // Spoken out loud after an answer (short and gentle).
    voiceRight: ['Great job!', 'Yes! That’s right!', 'Awesome!', 'You got it!', 'Well done!', 'Super!', 'Perfect!', 'Way to go!'],
    voiceRetry: ['Oops! Try again.', 'Almost! Let’s try again.', 'Not quite. You can do it!', 'Hmm, try one more time.'],
    voiceReveal: ['That’s okay!', 'Good try!', 'Nice effort!'],
    streak: { 3: 'Three in a row! 🔥', 5: 'Five in a row! You’re on fire! 🔥', 10: 'TEN in a row! Incredible! ☄️', 15: '15 in a row! Unstoppable!', 20: '20 in a row! Legendary!' },
  };
})();
