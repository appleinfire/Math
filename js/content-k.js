// Kindergarten track: seven gentle worlds and the baby animals that live there.
// The last world (Star Bridge) is 1st-grade material, so a strong kindergartner always has somewhere to grow.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const L = MQ.L, C = MQ.C;
  const boss = (topics, d, creature) => L(topics, d, creature, 'boss', 6);

  const K_WORLDS = [
    {
      id: 'meadow', name: 'Sunny Meadow', emoji: '🌻', color: '#e0a21b', tint: '#fdf0cc', blurb: 'Counting to 10 and 20, numbers in order',
      levels: [
        L(['k_count'], 1, 'k_chick'), L(['k_numbers'], 1, 'k_bunny'), L(['k_count'], 2, 'k_duckling'), L(['k_numbers'], 2, 'k_lamb'),
        L(['k_count', 'k_numbers'], [3, 4], 'k_foal', 'challenge'), boss(['k_count', 'k_numbers'], [2, 3], 'k_bearcub'),
      ],
    },
    {
      id: 'pond', name: 'Lily Pond', emoji: '🪷', color: '#2bb3a3', tint: '#d9f4ef', blurb: 'More, fewer, or the same?',
      levels: [
        L(['k_compare'], 1, 'k_tadpole'), L(['k_count'], [2, 3], 'k_fry'), L(['k_compare'], 2, 'k_turtle'), L(['k_compare'], 3, 'k_flamingo'),
        L(['k_compare', 'k_count'], [4, 5], 'k_hippo', 'challenge'), boss(['k_compare', 'k_count', 'k_numbers'], [2, 3], 'k_otter'),
      ],
    },
    {
      id: 'orchard', name: 'Apple Orchard', emoji: '🍎', color: '#e2574c', tint: '#fde0dc', blurb: 'Adding within 10',
      levels: [
        L(['k_add'], 1, 'k_piglet'), L(['k_add'], 2, 'k_calf'), L(['k_words'], [1, 2], 'k_kid'), L(['k_add'], 3, 'k_hoglet'),
        L(['k_add', 'k_words'], [4, 5], 'k_kitten', 'challenge'), boss(['k_add', 'k_words'], [2, 3], 'k_puppy'),
      ],
    },
    {
      id: 'woods', name: 'Maple Woods', emoji: '🍂', color: '#c4712f', tint: '#f9e3cf', blurb: 'Taking away within 10',
      levels: [
        L(['k_sub'], 1, 'k_fawn'), L(['k_sub'], 2, 'k_foxkit'), L(['k_words'], [2, 3], 'k_owlet'), L(['k_sub'], 3, 'k_raccoon'),
        L(['k_sub', 'k_words'], [4, 5], 'k_boar', 'challenge'), boss(['k_sub', 'k_add', 'k_words'], [2, 3], 'k_wolfpup'),
      ],
    },
    {
      id: 'shellbeach', name: 'Shell Beach', emoji: '🐚', color: '#3a8fd1', tint: '#dbecf9', blurb: 'Ten-frames, making 10, teen numbers',
      levels: [
        L(['k_teen'], 1, 'k_seal'), L(['k_teen'], 2, 'k_crab'), L(['k_teen'], 3, 'k_penguin'), L(['k_add'], 4, 'k_octopus'),
        L(['k_teen'], [4, 5], 'k_dolphin', 'challenge'), boss(['k_teen', 'k_add'], [3, 4], 'k_whale'),
      ],
    },
    {
      id: 'caves', name: 'Crystal Caves', emoji: '💎', color: '#7a5cc9', tint: '#e8e0fa', blurb: 'Shapes, sizes, sorting and patterns',
      levels: [
        L(['k_shapes'], 1, 'k_bat'), L(['k_measure'], [1, 2], 'k_spider'), L(['k_patterns'], [1, 2], 'k_snake'), L(['k_shapes'], [2, 3], 'k_gecko'),
        L(['k_shapes', 'k_measure', 'k_patterns'], 4, 'k_caterpillar', 'challenge'), boss(['k_shapes', 'k_measure', 'k_patterns'], 3, 'k_dragon'),
      ],
    },
    {
      id: 'starbridge', name: 'Star Bridge', emoji: '🌠', color: '#b0569e', tint: '#f6dff1', blurb: 'Challenge zone: 1st-grade math',
      levels: [
        L(['k_add'], 5, 'k_lioncub'), L(['k_sub'], 5, 'k_tigercub'), L(['k_teen', 'k_count'], 5, 'k_elephant'), L(['k_numbers', 'k_compare'], 5, 'k_giraffe'),
        L(['k_words', 'k_patterns', 'k_measure'], 5, 'k_joey', 'challenge'), boss(['k_add', 'k_sub', 'k_teen', 'k_words'], 5, 'k_polarcub'),
      ],
    },
  ];

  const add = (id, e, n, f, r) => (MQ.CREATURES[id] = C(id, e, n, f, r));
  // Sunny Meadow
  add('k_chick', '🐣', 'Chick', 'A chick peeps to its mother while it is still inside the egg — and she clucks back!');
  add('k_bunny', '🐰', 'Bunny Kit', 'A baby rabbit is called a kit. Kits are born with their eyes closed and open them after about 10 days.');
  add('k_duckling', '🦆', 'Duckling', 'Ducklings follow the first moving thing they see after hatching — usually their mom.');
  add('k_lamb', '🐑', 'Lamb', 'A lamb can stand up just a few minutes after it is born.');
  add('k_foal', '🐴', 'Foal', 'A baby horse is called a foal. It can run just a few hours after it is born.', 'rare');
  add('k_bearcub', '🐻', 'Bear Cub', 'Bear cubs are born in winter, as small as a squirrel. By spring they are big enough to explore!', 'legendary');
  // Lily Pond
  add('k_tadpole', '🐸', 'Tadpole', 'A frog starts life as a tadpole with a tail and no legs. The legs grow later!');
  add('k_fry', '🐟', 'Fish Fry', 'Baby fish are called fry. Some are as tiny as an eyelash.');
  add('k_turtle', '🐢', 'Turtle Hatchling', 'Baby turtles hatch from eggs buried in sand and dig their own way out.');
  add('k_flamingo', '🦩', 'Flamingo Chick', 'Flamingo chicks are born gray and fluffy. They turn pink later from the food they eat.');
  add('k_hippo', '🦛', 'Hippo Calf', 'Baby hippos can be born underwater and swim up for their very first breath.', 'rare');
  add('k_otter', '🦦', 'Otter Pup', 'Otter pups can’t swim at first — their moms give them swimming lessons!', 'legendary');
  // Apple Orchard
  add('k_piglet', '🐷', 'Piglet', 'A mother pig “sings” soft grunts to her piglets while they drink milk.');
  add('k_calf', '🐮', 'Calf', 'A baby cow is called a calf. Calves can walk an hour after being born.');
  add('k_kid', '🐐', 'Goat Kid', 'A baby goat is called a kid — just like you!');
  add('k_hoglet', '🦔', 'Hoglet', 'A baby hedgehog is called a hoglet. Its soft spines are hidden under its skin when it is born.');
  add('k_kitten', '🐱', 'Kitten', 'Kittens can purr when they are just a few days old. Purring tells mom: “I’m okay!”', 'rare');
  add('k_puppy', '🐶', 'Puppy', 'Newborn puppies can’t see or hear. They find their mom by smell and warmth.', 'legendary');
  // Maple Woods
  add('k_fawn', '🦌', 'Fawn', 'A fawn’s white spots look like sunlight on leaves, so it can hide in the forest.');
  add('k_foxkit', '🦊', 'Fox Kit', 'Baby foxes are called kits. They play-fight to practice hunting.');
  add('k_owlet', '🦉', 'Owlet', 'A baby owl is called an owlet. Owlets climb trees using their beaks and claws before they can fly.');
  add('k_raccoon', '🦝', 'Raccoon Kit', 'Raccoon kits chirp, purr and whistle to talk to their mom.');
  add('k_boar', '🐗', 'Boar Piglet', 'Baby wild boars have stripes, like little watermelons!', 'rare');
  add('k_wolfpup', '🐺', 'Wolf Pup', 'Wolf pups start practicing howls when they are only a few weeks old.', 'legendary');
  // Shell Beach
  add('k_seal', '🦭', 'Seal Pup', 'On a crowded beach, a seal mom finds her own pup by its voice and smell.');
  add('k_crab', '🦀', 'Baby Crab', 'Baby crabs start as tiny floating specks, smaller than a grain of rice.');
  add('k_penguin', '🐧', 'Penguin Chick', 'Penguin chicks huddle in a big group to keep warm while their parents go fishing.');
  add('k_octopus', '🐙', 'Baby Octopus', 'A baby octopus is as small as a flea when it hatches — and already has 8 arms!');
  add('k_dolphin', '🐬', 'Dolphin Calf', 'Baby dolphins are born tail first, so they don’t breathe in water.', 'rare');
  add('k_whale', '🐳', 'Whale Calf', 'A baby blue whale drinks so much milk that it gains about 200 pounds every day!', 'legendary');
  // Crystal Caves
  add('k_bat', '🦇', 'Bat Pup', 'A baby bat is called a pup. Its mom can find it among thousands of bats by its call.');
  add('k_spider', '🕷️', 'Spiderling', 'Baby spiders can float through the air on silk threads, like tiny balloons.');
  add('k_snake', '🐍', 'Snakelet', 'Baby snakes have a special egg tooth to cut their way out of the egg.');
  add('k_gecko', '🦎', 'Gecko Hatchling', 'Gecko babies can walk up walls from the day they hatch, thanks to sticky toes.');
  add('k_caterpillar', '🐛', 'Caterpillar', 'A caterpillar is a baby butterfly! It eats and eats and grows thousands of times heavier.', 'rare');
  add('k_dragon', '🐉', 'Baby Dragon', 'Legend says baby dragons love shiny crystals. Real fact: baby Komodo dragons live up in trees to stay safe.', 'legendary');
  // Star Bridge
  add('k_lioncub', '🦁', 'Lion Cub', 'Lion cubs are born with spots, which fade as they grow up.', 'rare');
  add('k_tigercub', '🐯', 'Tiger Cub', 'Every tiger cub is born with its own stripe pattern — no two are the same.', 'rare');
  add('k_elephant', '🐘', 'Elephant Calf', 'Baby elephants suck their trunks for comfort, like some kids suck their thumbs.', 'rare');
  add('k_giraffe', '🦒', 'Giraffe Calf', 'A newborn giraffe is about 6 feet tall — taller than most grown-ups!', 'rare');
  add('k_joey', '🦘', 'Joey', 'A baby kangaroo is born as small as a jellybean and grows inside its mom’s pouch.', 'rare');
  add('k_polarcub', '🐻‍❄️', 'Polar Bear Cub', 'Polar bear cubs are born in a cozy snow den and stay inside for about 3 months.', 'legendary');

  MQ.TRACKS.k = {
    id: 'k', label: 'Kindergarten', short: 'K', worlds: K_WORLDS,
    core: ['k_count', 'k_numbers', 'k_compare', 'k_add', 'k_sub', 'k_teen', 'k_shapes', 'k_measure', 'k_words'],
    ahead: ['k_patterns'], aheadLabel: 'Puzzles & patterns',
    dLabels: ['', 'warm-up', 'kindergarten', 'strong K', 'end of K', '1st grade!'],
    daily: [1, 3], paper: '#eef2fb',
    school: 'Problems follow the California Common Core standards for kindergarten: counting and number order to 100, comparing, adding and taking away within 10, making 10, teen numbers, shapes, measuring and sorting. Difficulty: 🌱 Sprout and 🧭 Explorer = core kindergarten, 🏕️ Ranger = strong kindergarten, 🏔️ Expert = end of K / start of 1st grade, 🐉 Legend = 1st-grade material (adding and subtracting to 20, tens and ones to 100, measuring with units). The Star Bridge world is all 1st-grade challenge. Every problem can be read aloud with the 🔊 button.',
  };
  MQ.linkCreatures();
})();
