// Creature stats, like a game character's: ⚡ Speed, 💪 Strength, 🧠 Smarts and ✨ Magic (0 to 100 each), their sum
// (Power) and a special power. Real animals get stats from real life (the cheetah-fast, the elephant-strong, the
// octopus-smart), and their Magic is a real "superpower" of nature (glowing, echoes, color change). Magical creatures
// from the Hatchery are stronger, and rarer ones stronger still; a dragon's stats grow with its stage (MQ.stats).
// Card Duels (js/duel.js) battle with these numbers.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  // id: [speed, strength, smarts, magic, special power]
  MQ.STATS = {
    // ---- Tide Pools
    hermit: [15, 30, 35, 25, 'Moves into a bigger shell as it grows'],
    puffer: [30, 15, 25, 45, 'Puffs up into a spiky ball'],
    mantis: [55, 70, 30, 45, 'Punches faster than you can blink'],
    nautilus: [20, 20, 30, 50, 'Floats up and down with gas in its shell'],
    lobster: [35, 65, 30, 50, 'Grows back a lost claw'],
    otter: [60, 45, 85, 55, 'Opens shells with a rock as a tool'],
    // ---- Rainforest
    dartfrog: [30, 10, 25, 60, 'Bright colors warn: I am poisonous!'],
    sloth: [3, 40, 35, 35, 'Algae grows in its fur like a green coat'],
    macaw: [70, 35, 75, 30, 'Cracks hard nuts and copies words'],
    chameleon: [20, 15, 35, 80, 'Changes color and moves each eye on its own'],
    jaguar: [80, 85, 55, 25, 'Bites right through a turtle shell'],
    orangutan: [30, 85, 90, 30, 'Uses big leaves as umbrellas'],
    // ---- Savanna
    zebra: [75, 55, 35, 20, 'No two zebras have the same stripes'],
    giraffe: [70, 70, 35, 20, 'The tallest animal on Earth'],
    rhino: [55, 92, 25, 10, 'Its horn is made of the same stuff as your nails'],
    hippo: [40, 90, 25, 15, 'Holds its breath underwater for 5 minutes'],
    elephant: [40, 99, 80, 25, 'Its trunk has about 40,000 muscles'],
    lion: [80, 90, 60, 40, 'Its roar can be heard 5 miles away'],
    // ---- Night Forest
    owl: [55, 35, 60, 55, 'Flies without making a sound'],
    bat: [65, 10, 55, 65, 'Sees in the dark with echoes'],
    raccoon: [35, 30, 75, 25, 'Opens latches and jars with its paws'],
    fox: [70, 35, 70, 30, 'Hears mice moving under the snow'],
    hedgehog: [30, 35, 45, 70, 'Rolls into a ball of 5,000 spines'],
    wolf: [80, 75, 80, 35, 'Hunts as a team and howls to its pack'],
    // ---- Desert
    scorpion: [30, 35, 20, 65, 'Glows blue-green under UV light'],
    camel: [55, 75, 35, 30, 'Goes a week without drinking water'],
    sidewinder: [45, 25, 30, 50, 'Slides sideways across hot sand'],
    kangaroo: [75, 70, 30, 20, 'Jumps 25 feet in one hop'],
    brachio: [20, 99, 25, 40, 'As tall as a 4-story building'],
    trex: [55, 99, 45, 35, 'The strongest bite of any land animal ever'],
    // ---- Arctic
    penguin: [30, 45, 40, 40, 'Dives deeper than 1,500 feet'],
    seal: [45, 50, 55, 25, 'Sleeps underwater and pops up to breathe'],
    reindeer: [65, 60, 40, 45, 'Its eyes turn blue in winter'],
    hare: [80, 20, 35, 40, 'Its fur turns white in winter'],
    mammoth: [40, 95, 55, 30, 'Tusks as long as a car'],
    polarbear: [55, 95, 65, 35, 'Smells a seal from a mile away'],
    // ---- Deep Ocean
    octopus: [45, 30, 85, 55, 'Three hearts and blue blood'],
    dolphin: [75, 35, 85, 25, 'Sleeps with half of its brain at a time'],
    turtle: [35, 40, 35, 55, 'Finds its way across oceans with Earth’s magnetism'],
    squid: [50, 60, 45, 50, 'Eyes as big as dinner plates'],
    shark: [80, 85, 40, 45, 'Grows new teeth all its life'],
    bluewhale: [45, 99, 60, 40, 'The biggest animal that ever lived'],
    // ---- Sky Kingdom
    bee: [55, 25, 50, 55, 'Dances to tell friends where flowers are'],
    monarch: [45, 10, 30, 75, 'Flies 3,000 miles to Mexico'],
    flamingo: [55, 30, 30, 40, 'Turns pink from the food it eats'],
    peacock: [50, 35, 35, 60, 'Spreads a giant fan of shimmering feathers'],
    eagle: [95, 60, 50, 35, 'Dives at 150 miles per hour'],
    dragon: [75, 80, 65, 95, 'Breathes fire and rides the wind'],
    // ---- Kindergarten: Sunny Meadow
    k_chick: [25, 15, 30, 35, 'Peeps to its mom from inside the egg'],
    k_bunny: [60, 15, 30, 25, 'Turns its ears to catch every sound'],
    k_duckling: [35, 15, 30, 35, 'Swims on the day it hatches'],
    k_lamb: [40, 25, 30, 25, 'Knows its mom’s voice in a big flock'],
    k_foal: [70, 45, 40, 25, 'Walks an hour after it is born'],
    k_bearcub: [45, 65, 60, 40, 'Climbs trees to stay safe'],
    // ---- Kindergarten: Lily Pond
    k_tadpole: [35, 10, 20, 55, 'Grows legs and turns into a frog'],
    k_fry: [45, 10, 20, 35, 'Swims in a big school with its brothers and sisters'],
    k_turtle: [15, 30, 25, 40, 'Digs out of its sandy nest at night'],
    k_flamingo: [35, 20, 25, 35, 'Born gray, turns pink later'],
    k_hippo: [30, 75, 30, 30, 'Drinks its mom’s milk underwater'],
    k_otter: [50, 35, 65, 50, 'Naps floating on its mom’s belly'],
    // ---- Kindergarten: Apple Orchard
    k_piglet: [35, 30, 60, 20, 'Learns its own name in about two weeks'],
    k_calf: [35, 45, 30, 20, 'Walks soon after it is born'],
    k_kid: [45, 30, 40, 30, 'Climbs rocks right away'],
    k_hoglet: [20, 15, 25, 50, 'Born with soft spines that harden later'],
    k_kitten: [65, 25, 55, 45, 'Purrs when it is happy'],
    k_puppy: [60, 45, 70, 35, 'Smells 10,000 times better than you'],
    // ---- Kindergarten: Whispering Woods
    k_fawn: [60, 20, 30, 50, 'Its spots help it hide in the forest'],
    k_foxkit: [50, 25, 55, 30, 'Plays games to learn how to hunt'],
    k_owlet: [25, 15, 45, 50, 'Turns its head almost all the way around'],
    k_raccoon: [30, 20, 55, 25, 'Feels its food in the water with clever paws'],
    k_boar: [45, 60, 40, 25, 'Its stripes help it hide in the leaves'],
    k_wolfpup: [55, 50, 65, 40, 'Howls to find its family'],
    // ---- Kindergarten: Shell Beach
    k_seal: [35, 30, 35, 35, 'Its mom finds it by its voice'],
    k_crab: [35, 25, 20, 35, 'Walks sideways'],
    k_penguin: [20, 20, 30, 40, 'Snuggles on its dad’s feet to stay warm'],
    k_octopus: [30, 20, 55, 50, 'Squirts ink to hide'],
    k_dolphin: [70, 30, 60, 30, 'Has its own whistle, like a name'],
    k_whale: [40, 85, 45, 40, 'Grows about 200 pounds a day'],
    // ---- Kindergarten: Crystal Caves
    k_bat: [50, 10, 40, 55, 'Finds bugs in the dark with echoes'],
    k_spider: [25, 10, 30, 60, 'Floats away on a silk thread like a balloon'],
    k_snake: [35, 20, 25, 50, 'Smells with its tongue'],
    k_gecko: [40, 15, 25, 60, 'Walks up walls and across ceilings'],
    k_caterpillar: [10, 20, 35, 95, 'Turns into a butterfly'],
    k_dragon: [55, 55, 55, 90, 'Puffs tiny flames'],
    // ---- Kindergarten: Star Bridge
    k_lioncub: [55, 50, 45, 30, 'Learns to roar at about one year old'],
    k_tigercub: [55, 55, 45, 30, 'Every tiger has its own stripes'],
    k_elephant: [30, 75, 60, 25, 'Sucks its trunk like a thumb'],
    k_giraffe: [60, 55, 35, 20, 'Born six feet tall'],
    k_joey: [45, 25, 30, 70, 'Born as small as a jelly bean'],
    k_polarcub: [40, 70, 55, 40, 'Born as small as a guinea pig'],
    // ---- Meadow Egg
    unicorn: [75, 60, 60, 99, 'Its horn makes water clean and pure'],
    dodo: [25, 45, 40, 80, 'Lived only on one island, Mauritius'],
    beaver: [35, 55, 70, 25, 'Builds dams that change rivers'],
    skunk: [35, 20, 40, 70, 'Does a handstand before it sprays'],
    squirrel: [60, 20, 55, 30, 'Plants trees by forgetting its buried nuts'],
    panda: [25, 70, 45, 30, 'Eats bamboo up to 12 hours a day'],
    koala: [15, 30, 25, 40, 'Sleeps up to 20 hours a day'],
    badger: [45, 65, 55, 40, 'Fearless: it stands up to lions'],
    snail: [3, 20, 15, 65, 'Carries its house on its back'],
    ladybug: [40, 10, 20, 60, 'Its spots warn birds: I taste bad!'],
    croc: [45, 90, 35, 20, 'The strongest bite of any animal today'],
    llama: [50, 50, 40, 30, 'Hums to talk to its friends'],
    swan: [65, 50, 45, 50, 'Guards its family with its big wings'],
    crowned: [50, 35, 40, 90, 'Its snow-white fan looks like lace'],
    tiger: [75, 85, 40, 15, 'Loves to swim, unlike most cats'],
    gorilla: [40, 95, 70, 10, 'Laughs when it is tickled'],
    bison: [65, 90, 30, 20, 'Runs 35 miles per hour'],
    snowmonkey: [45, 35, 65, 50, 'Warms up in hot springs in the snow'],
    humpback: [45, 95, 70, 55, 'Sings songs that last 20 minutes'],
    mandarin: [65, 25, 40, 60, 'The most colorful duck in the world'],
    // ---- Crystal Egg
    emberfox: [75, 45, 65, 85, 'Its tail glows like a warm campfire'],
    frostowl: [65, 40, 80, 85, 'Freezes the air with one hoot'],
    moonrabbit: [80, 30, 65, 90, 'Makes magic potions on the Moon'],
    moonwolf: [80, 65, 65, 85, 'Howls up the full moon'],
    stardust: [60, 25, 70, 95, 'Leaves a trail of stardust'],
    wishfish: [65, 20, 75, 99, 'Grants wishes to kind fishermen'],
    humpbackhorse: [90, 60, 75, 85, 'Gallops across the sky'],
    silverhoof: [70, 45, 50, 95, 'Stamps, and silver coins fly out'],
    frogprince: [40, 40, 80, 90, 'Turns into a prince'],
    pixie: [85, 15, 70, 99, 'Sprinkles fairy dust to fly'],
    gnome: [25, 55, 75, 85, 'Guards treasure under tree roots'],
    rainbowsnail: [15, 40, 55, 99, 'Leaves a rainbow trail'],
    thistlehog: [40, 45, 55, 90, 'Its spines bloom into flowers'],
    bubbleturtle: [35, 60, 60, 90, 'Blows a bubble that floats it to the sky'],
    glimmerwing: [80, 15, 55, 99, 'Its wings shine with every color'],
    acornsprite: [60, 30, 65, 90, 'Wakes up seeds and plants forests'],
    // ---- Legendary Egg
    firebird: [90, 55, 70, 99, 'Its feathers glow like fire, even at night'],
    griffin: [92, 95, 70, 85, 'Eagle eyes and a lion’s strength'],
    pegasus: [99, 70, 70, 95, 'Flies faster than the wind'],
    mermaid: [85, 50, 85, 95, 'Sings songs that calm the sea'],
    genie: [60, 80, 90, 99, 'Lives in a lamp and grants three wishes'],
    merlin: [45, 50, 99, 99, 'Knows every spell in the book'],
    kraken: [70, 99, 65, 85, 'Pulls whole ships under the sea'],
    yeti: [65, 95, 60, 80, 'Leaves giant footprints in the snow'],
    kitsune: [85, 50, 95, 99, 'Grows a new tail every 100 years'],
    featherserpent: [85, 75, 85, 95, 'Brings the wind and the rain'],
    starwhale: [70, 99, 80, 99, 'Swims through the stars'],
    worldturtle: [10, 99, 99, 99, 'Carries the whole world on its back'],
    // ---- Dragon Egg (fully grown: an elder dragon; younger dragons have less)
    dr_ember: [85, 99, 75, 99, 'Breathes fire hot enough to melt rock'],
    dr_frost: [80, 90, 85, 99, 'Freezes a lake with one breath'],
    dr_storm: [99, 90, 80, 99, 'Throws lightning bolts'],
    dr_forest: [70, 99, 90, 95, 'Makes trees grow overnight'],
    dr_ocean: [90, 95, 85, 95, 'Calls up giant waves'],
    dr_crystal: [75, 95, 95, 99, 'Its scales are made of crystal'],
    dr_moon: [90, 85, 99, 99, 'Glows bright on the darkest night'],
    dr_sun: [95, 99, 90, 99, 'Shines as bright as the Sun'],
    dr_rainbow: [99, 90, 95, 99, 'Paints rainbows across the sky'],
    dr_cosmic: [99, 99, 99, 99, 'Flies between the stars'],
    // ---- Royal Egg
    dr_royal: [100, 100, 100, 100, 'The king of all dragons'],
  };
  // [key, icon, name, comparative ("faster")]
  MQ.STAT_KEYS = [['speed', '⚡', 'Speed', 'faster'], ['strength', '💪', 'Strength', 'stronger'], ['smarts', '🧠', 'Smarts', 'smarter'], ['magic', '✨', 'Magic', 'more magical']];
  // A dragon has this share of its full stats at each stage: baby, young, grown-up, elder.
  MQ.DRAGON_GROWTH = [0.55, 0.7, 0.85, 1];
  // A creature's stats: { speed, strength, smarts, magic, list: [4 numbers], power, special, stage }.
  // stage: a dragon's growth stage (default: this child's dragon, or a grown-up one).
  MQ.stats = (c, st, stage) => {
    const s = MQ.STATS[c.id];
    if (!s) return null;
    if (c.dragon && stage === undefined) stage = st && st.dragons && st.dragons[c.id] && MQ.dragonStage ? MQ.dragonStage(st, c.id) : 2;
    const k = c.dragon ? MQ.DRAGON_GROWTH[stage] : 1;
    const list = s.slice(0, 4).map((x) => Math.round(x * k));
    const out = { list, power: list.reduce((a, b) => a + b, 0), special: s[4], stage: c.dragon ? stage : undefined };
    MQ.STAT_KEYS.forEach(([key], i) => (out[key] = list[i]));
    return out;
  };
})();
