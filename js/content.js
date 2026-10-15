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

  // The Hatchery: five eggs, each with its own creatures. An egg opens after enough creatures from the egg before it
  // (need), and a bought egg always holds a creature not hatched yet. Taps = how many taps crack it open.
  // Real animals come from Meadow Eggs; Crystal, Legendary and Dragon eggs hold magical creatures with pictures
  // (js/creature-art.js). Dragons get a name, grow from right answers (MQ.DRAGON_STAGES) and guard treasure.
  MQ.EGGS = [
    { id: 'meadow', name: 'Meadow Egg', icon: '🥚', price: 30, taps: 3, need: 0, color: '#7cbf4a', tint: '#eef8e2', blurb: 'Real animals you can’t meet on the expedition.' },
    { id: 'crystal', name: 'Crystal Egg', icon: '💎', price: 80, taps: 5, need: 5, color: '#7a5cc9', tint: '#efeaff', blurb: 'Magic critters from fairy tales.' },
    { id: 'legend', name: 'Legendary Egg', icon: '🌟', price: 200, taps: 7, need: 5, color: '#d99a0b', tint: '#fff4d1', blurb: 'Heroes of myths and legends.' },
    { id: 'dragon', name: 'Dragon Egg', icon: '🐉', price: 500, taps: 9, need: 3, color: '#c0392b', tint: '#fde6e0', blurb: 'A real baby dragon! Name it and watch it grow.' },
    { id: 'royal', name: 'Royal Dragon Egg', icon: '👑', price: 1000, taps: 12, need: 10, color: '#9a2a8c', tint: '#f8e1f3', blurb: 'The ruler of all dragons.', secret: true },
  ];
  const H = (egg, list) => list.map(([id, emoji, name, fact, rarity, more]) => Object.assign(C(id, emoji, name, fact, rarity || ({ crystal: 'crystal', legend: 'legend', dragon: 'dragon', royal: 'royal' }[egg] || 'common')), { egg }, more || {}));
  const D = (id, emoji, name, el, names, fact) => [id, emoji, name, fact, '', { el, names, dragon: true }];
  MQ.EGG_CREATURES = [
    ...H('meadow', [
      ['unicorn', '🦄', 'Unicorn', 'The real “unicorn of the sea” is the narwhal. Its long tusk is actually a tooth that grows through its lip!', 'mythic'],
      ['dodo', '🦤', 'Dodo', 'Dodos lived on the island of Mauritius. They disappeared about 350 years ago, so nobody alive has ever seen one.', 'mythic'],
      ['beaver', '🦫', 'Beaver', 'Beaver teeth are orange because they contain iron, which makes them extra strong for chewing trees.'],
      ['skunk', '🦨', 'Spotted Skunk', 'Before spraying, a spotted skunk does a handstand as a final warning.'],
      ['squirrel', '🐿️', 'Squirrel', 'Squirrels bury thousands of nuts and forget some of them — so they plant lots of new trees!'],
      ['panda', '🐼', 'Giant Panda', 'Pandas spend around 12 hours a day eating bamboo.'],
      ['koala', '🐨', 'Koala', 'Koalas have fingerprints so much like ours that they could confuse a detective.'],
      ['badger', '🦡', 'Honey Badger', 'Honey badgers are famously fearless and have thick, loose skin that helps protect them from bee stings.'],
      ['snail', '🐌', 'Snail', 'A snail’s tongue is covered with thousands of tiny teeth.'],
      ['ladybug', '🐞', 'Ladybug', 'One ladybug can eat about 5,000 aphids in its life. Gardeners love them!'],
      ['croc', '🐊', 'Crocodile', 'Crocodiles can’t stick out their tongues. They also swallow stones to help them dive.'],
      ['llama', '🦙', 'Llama', 'Llamas hum to talk to each other, especially mothers to their babies.'],
      ['swan', '🦢', 'Swan', 'A swan can have more than 25,000 feathers.', 'rare'],
      ['crowned', '🦚', 'White Peacock', 'Some peacocks are pure white. They are not albino — they just don’t make color in their feathers.', 'mythic'],
      ['tiger', '🐅', 'Bengal Tiger', 'Every tiger has its own stripe pattern, and the stripes are on its skin too, not just on its fur.'],
      ['gorilla', '🦍', 'Gorilla', 'Gorillas build a fresh bed of leaves and branches to sleep in every single night.'],
      ['bison', '🦬', 'Bison', 'A bison can run about 35 miles per hour and jump over a fence taller than a grown-up.'],
      ['snowmonkey', '🐒', 'Snow Monkey', 'In snowy Japan, some monkeys warm up in winter by soaking in hot springs, like a bath.'],
      ['humpback', '🐳', 'Humpback Whale', 'Humpback whales sing long songs. All the males in one part of the ocean sing the same song and change it a little every year.', 'rare'],
      ['mandarin', '🦆', 'Mandarin Duck', 'Mandarin ducklings jump out of their nest high up in a tree on their first day and bounce safely onto the ground.', 'rare'],
    ]),
    ...H('crystal', [
      ['emberfox', '🦊', 'Ember Fox', 'Legend says its tail glows like a warm campfire on cold nights. Real fact: a fox wraps its big fluffy tail around itself like a blanket when it sleeps in the snow.'],
      ['frostowl', '🦉', 'Frost Owl', 'Legend says snow starts to fall wherever the Frost Owl flies. Real fact: snowy owls have feathers even on their toes, like warm slippers.'],
      ['moonrabbit', '🐇', 'Moon Rabbit', 'Old stories from China, Japan and Korea say a rabbit lives on the Moon. Look at a full moon: the dark spots make a rabbit shape! Real fact: those dark spots are huge plains of old lava.'],
      ['moonwolf', '🐺', 'Moon Wolf', 'Legend says the Moon Wolf howls to wake up the stars. Real fact: wolves don’t really howl at the Moon. They howl to call their pack and to tell other wolves “this is our home.”'],
      ['stardust', '🐈', 'Stardust Kitten', 'Legend says this kitten naps on clouds and its fur is full of tiny stars. Real fact: cats sleep about 12 to 16 hours a day.'],
      ['wishfish', '🐟', 'Golden Wish-Fish', 'In a Russian fairy tale, a fisherman catches a golden fish that grants wishes. Real fact: goldfish can learn tricks and remember them for months.'],
      ['humpbackhorse', '🐴', 'Little Humpbacked Horse', 'In a Russian fairy tale, a tiny horse with two humps and very long ears helps Ivan and gallops faster than the wind. Real fact: a horse can turn each ear on its own, almost all the way around, to catch sounds.'],
      ['silverhoof', '🦌', 'Silver Hoof', 'In a fairy tale from the Ural Mountains, a little goat stamps its silver hoof and sparkling gems appear. Real fact: the Ural Mountains really are famous for gems like emeralds and amethysts.'],
      ['frogprince', '🐸', 'Frog Prince', 'In the fairy tale, a frog turns out to be a prince in disguise. Real fact: frogs don’t drink with their mouths. They soak up water through their skin.'],
      ['pixie', '🧚', 'Pixie', 'Legend says pixies leave rings of mushrooms where they dance at night. Real fact: “fairy rings” are real! Mushrooms come up in a circle as the fungus spreads out underground.'],
      ['gnome', '🍄', 'Mushroom Gnome', 'Legend says gnomes guard treasure under the roots of old trees. Real fact: a mushroom is only a small part of a fungus. Most of it is a web of threads hidden underground.'],
      ['rainbowsnail', '🐌', 'Rainbow Snail', 'Legend says it leaves a shimmering rainbow trail. Real fact: a snail’s shell grows with it, spiraling a little bigger every year, so it never needs a new one.'],
      ['thistlehog', '🦔', 'Thistle Hedgehog', 'Legend says flowers bloom in its spines every spring. Real fact: baby hedgehogs are called hoglets. Their spines are soft when they are born.'],
      ['bubbleturtle', '🐢', 'Bubble Turtle', 'Legend says its bubbles carry wishes up to the surface. Real fact: some turtles sleep underwater all winter and take in air through their skin and even their bottoms!'],
      ['glimmerwing', '🦋', 'Glimmerwing', 'Legend says its wings sparkle like jewels in the moonlight. Real fact: butterfly wings are covered with thousands of tiny scales, like the shingles on a roof.'],
      ['acornsprite', '🌰', 'Acorn Sprite', 'Legend says it sleeps inside an acorn all winter and wakes up when the oak gets new leaves. Real fact: one big oak tree can drop thousands of acorns in a single year.'],
    ]),
    ...H('legend', [
      ['firebird', '🦚', 'Firebird', 'In Russian fairy tales, one feather of the Firebird lights up a whole room. Real fact: some animals really glow under ultraviolet light. A puffin’s beak does!'],
      ['griffin', '🦅', 'Griffin', 'A griffin has an eagle’s head and wings and a lion’s body. In stories, griffins guard treasures of gold. Real fact: an eagle sees about 4 to 8 times sharper than a person.'],
      ['pegasus', '🐎', 'Pegasus', 'In Greek myths, Pegasus is a winged horse that flew up to the sky and became stars. Real fact: you can find the Pegasus constellation in the autumn night sky.'],
      ['mermaid', '🧜‍♀️', 'Mermaid', 'Sailors told stories about mermaids for thousands of years. Real fact: many of those “mermaids” were probably manatees, gentle sea cows that come up to breathe.'],
      ['genie', '🧞', 'Genie', 'In the old stories of the Thousand and One Nights, a genie lives in a lamp and grants wishes. Real fact: people used little oil lamps like that for thousands of years before electric lights.'],
      ['merlin', '🧙', 'Merlin the Wizard', 'In the legends of King Arthur, Merlin is a wise wizard who helps a boy become king. Real fact: a merlin is also a real bird, a small and super-fast falcon.'],
      ['kraken', '🦑', 'Kraken', 'Sailors’ legends tell of the Kraken, a sea monster so big it looked like an island. Real fact: the giant squid is real and can be as long as a school bus.'],
      ['yeti', '❄️', 'Yeti', 'Legend says the Yeti lives high in the snowy Himalaya mountains and leaves giant footprints. Real fact: many “Yeti” footprints turned out to be bear tracks that melted and grew bigger in the sun.'],
      ['kitsune', '🦊', 'Kitsune', 'In Japanese legends, a kitsune is a magic fox that grows a new tail every hundred years, up to nine tails. Real fact: real foxes use their tails for balance and to send signals to other foxes.'],
      ['featherserpent', '🐍', 'Feathered Serpent', 'The Aztecs and the Maya told of Quetzalcoatl, a serpent covered in bright feathers. Real fact: those feathers came from the quetzal, a real bird whose tail feathers are longer than its body.'],
      ['starwhale', '🐋', 'Star Whale', 'Legend says the Star Whale swims through the night sky eating stardust. Real fact: there is a whale in the stars too, the constellation Cetus, the Whale.'],
      ['worldturtle', '🐢', 'World Turtle', 'Many old stories say the whole world rides on the back of a giant turtle. Real fact: some tortoises live more than 150 years. Jonathan, a giant tortoise, hatched around 1832!'],
    ]),
    ...H('dragon', [
      D('dr_ember', '🐉', 'Ember Dragon', 'ember', ['Blaze', 'Sparky', 'Cinder', 'Flicker'], 'Legend says its breath can light a thousand candles at once. Real fact: the bombardier beetle sprays a boiling hot puff to scare enemies away.'),
      D('dr_frost', '🐉', 'Frost Dragon', 'frost', ['Frosty', 'Icicle', 'Snowflake', 'Blizzard'], 'Legend says it breathes snowflakes and paints frost on windows. Real fact: every snowflake has six sides.'),
      D('dr_storm', '🐉', 'Storm Dragon', 'storm', ['Zap', 'Thunder', 'Bolt', 'Flash'], 'Legend says thunder is the Storm Dragon’s roar. Real fact: lightning is about five times hotter than the surface of the Sun.'),
      D('dr_forest', '🐉', 'Forest Dragon', 'forest', ['Fern', 'Moss', 'Clover', 'Sprout'], 'Legend says flowers bloom wherever it steps. Real fact: the flying dragon lizard of Asia glides from tree to tree on wings made of skin.'),
      D('dr_ocean', '🐉', 'Ocean Dragon', 'ocean', ['Splash', 'Wave', 'Coral', 'Bubbles'], 'Legend says it makes the waves by swishing its tail. Real fact: the leafy sea dragon is a real fish that looks just like floating seaweed.'),
      D('dr_crystal', '🐉', 'Crystal Dragon', 'crystal', ['Gem', 'Sparkle', 'Prism', 'Diamond'], 'Legend says its scales are made of diamonds. Real fact: diamonds are made of carbon, the same stuff as the “lead” in your pencil.'),
      D('dr_moon', '🐉', 'Moon Dragon', 'moon', ['Luna', 'Shadow', 'Midnight', 'Star'], 'Legend says it sleeps all day and guards your dreams at night. Real fact: the Moon moves away from Earth a tiny bit every year, about 1½ inches.'),
      D('dr_sun', '🐉', 'Sun Dragon', 'sun', ['Sunny', 'Goldie', 'Ray', 'Shine'], 'Legend says it pulls the Sun up into the sky every morning. Real fact: sunlight takes about 8 minutes to travel from the Sun to Earth.'),
      D('dr_rainbow', '🐉', 'Rainbow Dragon', 'rainbow', ['Rainbow', 'Prism', 'Glitter', 'Joy'], 'Legend says a rainbow appears whenever this dragon smiles. Real fact: from an airplane you can sometimes see a rainbow as a full circle.'),
      D('dr_cosmic', '🐉', 'Cosmic Dragon', 'cosmic', ['Nova', 'Comet', 'Galaxy', 'Orbit'], 'Legend says it was born from a falling star. Real fact: shooting stars are tiny space rocks, often no bigger than a grain of sand, burning up high in the sky.'),
    ]),
    ...H('royal', [
      D('dr_royal', '👑', 'Royal Dragon', 'royal', ['Majesty', 'Goldie', 'Regal', 'Aurora'], 'The ruler of all dragons! It hatches only for a true Master of the Hatchery. Real fact: the Komodo dragon is the biggest lizard alive, and its babies hatch from eggs too.'),
    ]),
  ];
  MQ.eggById = (id) => MQ.EGGS.find((e) => e.id === id);
  MQ.eggCreatures = (egg) => MQ.EGG_CREATURES.filter((c) => c.egg === egg);
  // Dragons grow from first-try right answers given after they hatched (s.dragons[id].at = answers right then).
  MQ.DRAGON_STAGES = [{ at: 0, name: 'Baby' }, { at: 50, name: 'Young' }, { at: 150, name: 'Grown-up' }, { at: 400, name: 'Elder' }];
  MQ.dragonFed = (s, id) => Math.max(0, ((s.stats || {}).correct || 0) - (((s.dragons || {})[id] || {}).at || 0));
  MQ.dragonStage = (s, id) => { const n = MQ.dragonFed(s, id); let i = 0; while (i < 3 && n >= MQ.DRAGON_STAGES[i + 1].at) i++; return i; };
  MQ.DRAGON_TREASURE = 2; // each grown-up or elder dragon adds this many crystals to the Daily Quest reward
  MQ.dragonTreasure = (s) => Object.keys(s.dragons || {}).filter((id) => s.creatures[id] && MQ.dragonStage(s, id) >= 2).length * MQ.DRAGON_TREASURE;
  // A creature's picture for this child (dragons at their growth stage); the emoji when it isn't drawn.
  MQ.look = (s, c, o = {}) => (MQ.art && MQ.art(c.id, Object.assign({ stage: c.dragon ? MQ.dragonStage(s, c.id) : undefined }, o))) || c.emoji;
  // The expedition buddy: a creature from the collection (s.buddy), or the companion picked at the start.
  MQ.buddyCreature = (s) => (s && s.buddy && s.creatures[s.buddy] && MQ.creatureById(s.buddy)) || null;
  MQ.face = (s) => { const c = MQ.buddyCreature(s); return c ? MQ.look(s, c) : s.companion; };
  MQ.buddyName = (s) => { const c = MQ.buddyCreature(s); return !c ? s.buddyName : ((s.dragons || {})[c.id] || {}).name || c.name; };

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
  // basic = the expedition and the Meadow Eggs only (the magical eggs are counted by their own badges)
  MQ.trackCreatures = (grade, basic) => [...MQ.track(grade).worlds.flatMap((w) => w.levels.map((l) => MQ.CREATURES[l.creature])), ...(basic ? MQ.eggCreatures('meadow') : MQ.EGG_CREATURES)];
  // Call after a track's worlds and creatures are registered.
  MQ.linkCreatures = () => {
    Object.values(MQ.TRACKS).forEach((t) => t.worlds.forEach((w) => w.levels.forEach((l) => (MQ.CREATURES[l.creature].world = w.id))));
    MQ.EGG_CREATURES.forEach((c) => (c.world = 'egg'));
    MQ.ALL_CREATURES = [...Object.values(MQ.CREATURES), ...MQ.EGG_CREATURES];
  };
  MQ.linkCreatures();
  MQ.creatureById = (id) => MQ.ALL_CREATURES.find((c) => c.id === id);
  MQ.worldById = (id) => Object.values(MQ.TRACKS).flatMap((t) => t.worlds).find((w) => w.id === id);

  // Our apps, all on appleinfire.github.io. The picker and home screens link to the others, and one family
  // code + PIN works in all of them (js/cloud.js). Keep this list the same in every app.
  MQ.APP_ID = 'math-expedition';
  MQ.APPS = [
    { id: 'math-expedition', name: 'Math Expedition', icon: '🧭', url: 'https://appleinfire.github.io/Math/' },
    { id: 'writing-power', name: 'WritingPower', icon: '✏️', url: 'https://appleinfire.github.io/WritingPower/' },
  ];
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
    { id: 'colall', icon: '🌍', name: 'Living Encyclopedia', desc: 'Discover every creature on the map and in Meadow Eggs', test: (s) => MQ.trackCreatures(s.grade, true).every((c) => s.creatures[c.id]) },
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
    { id: 'crystalall', icon: '💎', name: 'Crystal Keeper', desc: 'Hatch every creature from Crystal Eggs', test: (s) => MQ.eggCreatures('crystal').every((c) => s.creatures[c.id]) },
    { id: 'legendall', icon: '🌟', name: 'Legend Hunter', desc: 'Hatch every creature from Legendary Eggs', test: (s) => MQ.eggCreatures('legend').every((c) => s.creatures[c.id]) },
    { id: 'dragon1', icon: '🐲', name: 'Dragon Tamer', desc: 'Hatch your first dragon', test: (s) => MQ.eggCreatures('dragon').some((c) => s.creatures[c.id]) },
    { id: 'dragonall', icon: '🐉', name: 'Dragon Master', desc: 'Hatch all 10 dragons', test: (s) => MQ.eggCreatures('dragon').every((c) => s.creatures[c.id]) },
    { id: 'elder', icon: '🏰', name: 'Dragon Whisperer', desc: 'Raise a dragon into an Elder Dragon', test: (s) => Object.keys(s.dragons || {}).some((id) => s.creatures[id] && MQ.dragonStage(s, id) >= 3) },
    { id: 'hatchall', icon: '👑', name: 'Master of the Hatchery', desc: 'Hatch every creature from every egg', test: (s) => MQ.EGG_CREATURES.every((c) => s.creatures[c.id]) },
    { id: 'ahead', icon: '🧠', name: 'Big Brain', desc: 'Solve 25 challenge-level problems', test: (s) => (s.stats.d5 || 0) >= 25 },
    { id: 'sky', icon: '🌠', name: 'Summit Explorer', desc: 'Befriend the guardian of the last world', test: (s) => { const w = MQ.trackWorlds(s); return !!s.levels[w[w.length - 1].id + '-5']; } },
    { id: 'fix10', icon: '🛠️', name: 'Fixer', desc: 'Fix 10 mistakes in the Fix-it Lab', test: (s) => (s.stats.fixed || 0) >= 10 },
    { id: 'fix50', icon: '🔧', name: 'Comeback Champion', desc: 'Fix 50 mistakes', test: (s) => (s.stats.fixed || 0) >= 50 },
    { id: 'goal', icon: '🎯', name: 'Goal Getter', desc: 'Reach the daily goal enough days in one week', test: (s) => MQ.goalWeeks(s).some((w) => w.met) },
    { id: 'farm1', icon: '🧺', name: 'Little Farmer', desc: 'Sell something at your Sunny Farm stand', test: (s) => !!s.farm && s.farm.stats.sold >= 1 },
    { id: 'farm100', icon: '🏪', name: 'Shopkeeper', desc: 'Serve 100 customers at your farm stand', test: (s) => !!s.farm && s.farm.stats.tasks - s.farm.stats.jobs >= 100 },
    { id: 'farm10', icon: '🚜', name: 'Real Farmer', desc: 'Reach farm level 10', test: (s) => !!s.farm && MQ.farm.level(s.farm.xp).level >= 10 },
    { id: 'farm25', icon: '🌾', name: 'Farm Tycoon', desc: 'Reach farm level 25', test: (s) => !!s.farm && MQ.farm.level(s.farm.xp).level >= 25 },
    { id: 'maker', icon: '🫙', name: 'Maker', desc: 'Make something in a Sunny Farm workshop', test: (s) => !!s.farm && (s.farm.stats.made || 0) >= 1 },
    { id: 'banker', icon: '🏦', name: 'Smart Saver', desc: 'Collect interest from the farm bank 4 times', test: (s) => !!s.farm && (s.farm.stats.bankDays || 0) >= 4 },
    { id: 'farm60', icon: '🦄', name: 'Farm Legend', desc: 'Reach farm level 60', test: (s) => !!s.farm && MQ.farm.level(s.farm.xp).level >= 60 },
    { id: 'vip10', icon: '⭐', name: 'Challenge Champ', desc: 'Help 10 ⭐ challenge customers right on the first try', test: (s) => !!s.farm && s.farm.stats.vip >= 10 },
    { id: 'dream1', icon: '🏗️', name: 'Dreamer', desc: 'Build the first part of a Big Dream on your farm', test: (s) => !!s.farm && !!s.farm.dream && (s.farm.dream.p > 0 || s.farm.dream.s > 0) },
    { id: 'investor', icon: '🍎', name: 'Investor', desc: 'Finish the Fruit Orchard: it earns money every bank day', test: (s) => !!s.farm && !!s.farm.dream && s.farm.dream.p >= 1 },
    { id: 'castle', icon: '🏰', name: 'Castle Builder', desc: 'Build the Castle on the Hill', test: (s) => !!s.farm && !!s.farm.dream && s.farm.dream.p >= 4 },
    { id: 'logic', icon: '🧩', name: 'Logician', desc: 'Finish a Logic Lab challenge', test: (s) => ((s.tests || {}).contests || []).some((c) => c.kind === 'logic' || c.kind === 'logick') },
  ];

  // Daily goal (set by a grown-up): weeks from Monday to Sunday, how many days reached the goal.
  MQ.weekStart = (key) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return MQ.U.dateKey(d); };
  MQ.goalWeeks = (s) => {
    const g = s.goal || {};
    if (!g.perDay) return [];
    const weeks = {};
    for (const [k, v] of Object.entries(s.days || {})) {
      const w = (weeks[MQ.weekStart(k)] = weeks[MQ.weekStart(k)] || { start: MQ.weekStart(k), days: 0 });
      if ((v.a || 0) >= g.perDay) w.days++;
    }
    return Object.values(weeks).map((w) => Object.assign(w, { met: w.days >= (g.days || 5) }));
  };

  // Strategy tips: shown before the next question after a child misses the same kind of problem twice,
  // and in the Fix-it Lab. Short, concrete, in a child's words.
  MQ.TIPS = {
    add20: ['Make a ten: 8 + 5 → 8 + 2 = 10, then 10 + 3 = 13.', 'Use doubles: 6 + 7 is 6 + 6 and one more = 13.', 'For take-away, count up: 13 − 9 → from 9 to 10 is 1, from 10 to 13 is 3, so 4.'],
    place: ['Read the digits by their places: 352 = 3 hundreds, 5 tens, 2 ones.', 'To compare numbers, look at the hundreds first, then the tens, then the ones.'],
    add100: ['Add the tens first, then the ones: 34 + 25 → 30 + 20 = 50, 4 + 5 = 9, so 59.', 'If the ones make more than 10, trade 10 ones for 1 ten.'],
    sub100: ['Jump back by tens, then by ones: 72 − 25 → 72 − 20 = 52, 52 − 5 = 47.', 'Check by adding: your answer + the number you took away should give the start.'],
    arrays: ['Even numbers split into pairs with none left over. Look at the ones digit: 0, 2, 4, 6, 8 are even.', 'An array is rows × columns: count one row, then skip-count the rows.'],
    time: ['The short hand shows the hour, the long hand shows the minutes.', 'Each number on the clock is 5 minutes for the long hand: count by 5s.'],
    money: ['Start with the coins worth the most, then count on: quarters, dimes, nickels, pennies.', 'Quarter 25¢, dime 10¢, nickel 5¢, penny 1¢. A dime is small but worth more than a nickel!'],
    shapes: ['Count the sides and the corners. Triangles 3, quadrilaterals 4, pentagons 5, hexagons 6.', 'Halves are 2 equal parts, thirds are 3, fourths are 4. The parts must be the same size.'],
    measure: ['Line up the object with 0 on the ruler, not with the end of the ruler.', 'Longer units mean a smaller number: 1 foot is 12 inches.'],
    data: ['Read the title and the labels first. Then find the bar or row the question asks about.', '“How many more” means find both numbers and subtract.'],
    big: ['Line up hundreds, tens and ones. Add or subtract each place, starting with the ones.', 'Estimate first: 398 + 205 is about 400 + 200 = 600.'],
    words: ['Read the question twice. What do you know? What do you need to find?', 'Draw a quick picture or a bar model. “In all” often means add, “left” or “more than” often means subtract.'],
    mult: ['Multiplication is equal groups: 4 × 3 is 4 groups of 3 = 3 + 3 + 3 + 3.', 'Division is sharing equally: 12 ÷ 3 means 12 shared into 3 equal groups.'],
    logic: ['Look at how much the numbers change each time. Is the jump always the same?', 'Try a number, check it, then fix it: guess and check is a real strategy!'],
    k_count: ['Touch each thing once while you count. Move it or mark it so you don’t count it twice.', 'The last number you say tells how many.'],
    k_numbers: ['Say the numbers out loud in order. Which comes just before? Just after?'],
    k_compare: ['Match them up one to one. The group with some left over has more.'],
    k_add: ['Start with the bigger number and count on with your fingers.', 'Adding means putting together. Count all of them.'],
    k_sub: ['Taking away means some go away. Start with all of them, cover the ones that leave, count what is left.'],
    k_teen: ['A ten frame holds 10. Teen numbers are 10 and some more ones: 14 is 10 and 4.'],
    k_shapes: ['Count the sides and the corners. Flat shapes lie on paper, solid shapes you can hold.'],
    k_measure: ['Put the things side by side, with their ends lined up at the same start.'],
    k_words: ['Listen to the story again and act it out with your fingers or toys.'],
    k_patterns: ['Say the pattern out loud: red, blue, red, blue… what comes next?'],
    kg_count: ['Count small shapes first, then shapes made of 2 pieces, then bigger ones. Write the number for each size.'],
    kg_balance: ['If the scale is level, both sides weigh the same. Take the same thing off both sides to make it simpler.'],
    kg_order: ['Draw a line from tallest to shortest (or oldest to youngest) and place each person as you read the clue.'],
    kg_calendar: ['Every 7 days it is the same day of the week again. Count the leftover days after the full weeks.'],
    kg_coins: ['Make a list of the coins and add them in an organized way, biggest first.'],
    kg_paths: ['Trace the route with your finger and count each step. Mark where you have already been.'],
    kg_mirror: ['In a mirror, left and right swap but up and down stay. Turning moves every part around the middle.'],
    kg_cubes: ['Count the cubes layer by layer, and remember the ones hidden underneath that hold the others up.'],
    kg_pattern: ['Look at the jumps between the numbers. Do they stay the same, or grow by a rule?'],
    kg_digits: ['Start with the ones column: which digit makes the ones work? Then move to the tens.'],
    kg_age: ['Everybody gets older by the same amount. The difference between two ages never changes.'],
    kg_bank: ['Read slowly and draw the puzzle. Check your answer against every sentence before you choose.'],
    kg_joey: ['Listen to the question again with 🔊 and point to each picture.'],
    cg_picanalogy: ['Say how the first two pictures go together in a sentence, like “a bird lives in a nest”. Then use the same sentence for the next one.'],
    cg_sentence: ['Listen to the whole question. Then look at every picture before you choose.'],
    cg_picclass: ['Find what the three pictures have in common: what they are, what they do, or where they belong.'],
    cg_numanalogy: ['Find the rule in the first pair: add, take away, or double? Then do the same to the last one.'],
    cg_numpuzzle: ['Find what the animal must be to make both sides equal. Check by putting your number back in.'],
    cg_numseries: ['Look at how each step changes from the one before. The same change comes next.'],
    cg_matrix: ['Look across the row: what changes and what stays the same? Then look down the column too.'],
    cg_classify: ['Check shape, color, size and number. The rule is what ALL three share.'],
    cg_folding: ['Each fold doubles the holes. Unfold in your head one fold at a time, like a mirror.'],
    lg_order: ['Draw a line or a ladder. Put names on it as you read each clue, and erase guesses that don’t fit.'],
    lg_whois: ['Make a table: names down the side, things across the top. Put ✗ for every “does not”. A row with one empty box gives the answer.'],
    lg_truth: ['Use only what the sentences say. If something could go either way, the answer is “Can’t tell”.', '“If A, then B” does not mean “if B, then A”.'],
    lg_situation: ['Make a picture in your head. Which answer makes sense with ALL the facts?'],
    lg_count: ['Make an organized list so you don’t miss any or count any twice.', 'For “to be sure”, imagine the unluckiest way it could happen.'],
    lg_liars: ['Pretend one person tells the truth and see if everything fits. If something breaks, try the other way.'],
  };

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
