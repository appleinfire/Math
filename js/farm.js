// Sunny Farm: a mini-game about real money. The child grows crops and raises animals, sells what the farm makes at
// their own stand, and spends the money on seeds, feed, animals and upgrades. Every sale and every purchase is a
// money problem with US coins and bills (2.MD.8 and beyond). This file holds the rules and the problems
// (no screens, so it runs in the tests); js/farm-ui.js draws it.
//
// st.farm = { money (cents), xp, day, feed (bags), beds: [{ c: crop, g: days grown }], pens: [{ a: animal, g, fed, ready }],
//             basket: { item: count }, owned: { decoration: true }, stand, goal, tier, streak, miss, stats }
// Prices come in two scales: kindergarten in small cents ('k'), 2nd grade in dollars and cents ('g2').
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = MQ.U;
  const F = {};
  const gi = (g) => (g === 'k' ? 0 : 1); // index into [k, g2] price pairs

  // ---------------------------------------------------------------- catalog
  // Things to sell. price: [kindergarten, 2nd grade] in cents.
  F.ITEMS = {
    carrot: { e: '🥕', name: 'carrot', many: 'carrots', price: [1, 10] },
    strawberry: { e: '🍓', name: 'strawberry', many: 'strawberries', price: [2, 20] },
    tomato: { e: '🍅', name: 'tomato', many: 'tomatoes', price: [3, 25] },
    corn: { e: '🌽', name: 'ear of corn', many: 'ears of corn', price: [3, 30] },
    pumpkin: { e: '🎃', name: 'pumpkin', many: 'pumpkins', price: [6, 120] },
    sunflower: { e: '🌻', name: 'sunflower', many: 'sunflowers', price: [4, 45] },
    watermelon: { e: '🍉', name: 'watermelon', many: 'watermelons', price: [8, 150] },
    blueberry: { e: '🫐', name: 'box of blueberries', many: 'boxes of blueberries', price: [5, 60] },
    grapes: { e: '🍇', name: 'bunch of grapes', many: 'bunches of grapes', price: [9, 200] },
    egg: { e: '🥚', name: 'egg', many: 'eggs', price: [2, 15] },
    honey: { e: '🍯', name: 'jar of honey', many: 'jars of honey', price: [5, 85] },
    goatmilk: { e: '🍼', name: 'bottle of goat milk', many: 'bottles of goat milk', price: [4, 60] },
    wool: { e: '🧶', name: 'ball of wool', many: 'balls of wool', price: [6, 95] },
    milk: { e: '🥛', name: 'glass of milk', many: 'glasses of milk', price: [5, 75] },
    duckegg: { e: '🪺', name: 'duck egg', many: 'duck eggs', price: [3, 35] },
    truffle: { e: '🍄', name: 'truffle', many: 'truffles', price: [9, 300] },
    fluff: { e: '☁️', name: 'bag of alpaca fluff', many: 'bags of alpaca fluff', price: [9, 350] },
    ride: { e: '🎟️', name: 'pony ride', many: 'pony rides', price: [10, 250] },
    potato: { e: '🥔', name: 'potato', many: 'potatoes', price: [3, 35] },
    pepper: { e: '🌶️', name: 'pepper', many: 'peppers', price: [4, 50] },
    pineapple: { e: '🍍', name: 'pineapple', many: 'pineapples', price: [9, 275] },
    feather: { e: '🪶', name: 'turkey feather', many: 'turkey feathers', price: [6, 120] },
    fish: { e: '🐟', name: 'fish', many: 'fish', price: [7, 180] },
    silk: { e: '🧵', name: 'spool of silk', many: 'spools of silk', price: [9, 400] },
    sleigh: { e: '🛷', name: 'sleigh ride', many: 'sleigh rides', price: [12, 500] },
    sparkle: { e: '✨', name: 'jar of rainbow sparkles', many: 'jars of rainbow sparkles', price: [15, 900] },
    rainbow: { e: '🌈', name: 'ball of rainbow wool', many: 'balls of rainbow wool', price: [14, 400] }, // from the merchant's Rainbow Sheep
    // made in a Mythic Feed week (F.MYTHS): worth 3 to 4 times the usual thing; myth: how its icon glows (css .my-*)
    goldegg: { e: '🥚', name: 'golden egg', many: 'golden eggs', price: [7, 50], myth: 'gold' },
    starhoney: { e: '🍯', name: 'jar of star honey', many: 'jars of star honey', price: [16, 300], myth: 'star' },
    crystalmilk: { e: '🍼', name: 'bottle of crystal milk', many: 'bottles of crystal milk', price: [14, 200], myth: 'crystal' },
    fleece: { e: '🧶', name: 'ball of golden fleece', many: 'balls of golden fleece', price: [20, 350], myth: 'gold' },
    moonmilk: { e: '🥛', name: 'glass of moon milk', many: 'glasses of moon milk', price: [16, 250], myth: 'moon' },
    silveregg: { e: '🥚', name: 'silver egg', many: 'silver eggs', price: [10, 120], myth: 'silver' },
    goldtruffle: { e: '🍄', name: 'golden truffle', many: 'golden truffles', price: [30, 1000], myth: 'gold' },
    thunder: { e: '🪶', name: 'thunder feather', many: 'thunder feathers', price: [20, 400], myth: 'thunder' },
    starfluff: { e: '☁️', name: 'bag of star fluff', many: 'bags of star fluff', price: [30, 1200], myth: 'star' },
    skyride: { e: '🎟️', name: 'sky ride on a pegasus', many: 'sky rides on a pegasus', price: [35, 900], myth: 'sky' },
    // made in the workshops (F.WORKS)
    jam: { e: '🫙', name: 'jar of strawberry jam', many: 'jars of strawberry jam', price: [10, 120], made: true },
    sauce: { e: '🥫', name: 'can of tomato sauce', many: 'cans of tomato sauce', price: [14, 140], made: true },
    cornbread: { e: '🍞', name: 'loaf of cornbread', many: 'loaves of cornbread', price: [12, 160], made: true },
    pie: { e: '🥧', name: 'pumpkin pie', many: 'pumpkin pies', price: [16, 250], made: true },
    fries: { e: '🍟', name: 'box of fries', many: 'boxes of fries', price: [15, 200], made: true },
    cheese: { e: '🧀', name: 'wheel of cheese', many: 'wheels of cheese', price: [18, 320], made: true },
    icecream: { e: '🍦', name: 'strawberry ice cream', many: 'strawberry ice creams', price: [17, 240], made: true },
    scarf: { e: '🧣', name: 'scarf', many: 'scarves', price: [16, 280], made: true },
    sweater: { e: '🧥', name: 'fluffy sweater', many: 'fluffy sweaters', price: [30, 1100], made: true },
    juice: { e: '🧃', name: 'bottle of grape juice', many: 'bottles of grape juice', price: [32, 800], made: true },
    smoothie: { e: '🥤', name: 'berry smoothie', many: 'berry smoothies', price: [24, 350], made: true },
    hat: { e: '👒', name: 'feather hat', many: 'feather hats', price: [28, 950], made: true },
    dress: { e: '👗', name: 'silk dress', many: 'silk dresses', price: [26, 1200], made: true },
    soup: { e: '🍲', name: 'pot of veggie soup', many: 'pots of veggie soup', price: [26, 330], made: true },
    fishchips: { e: '🍱', name: 'fish and chips', many: 'fish and chips', price: [28, 650], made: true },
    candy: { e: '🍬', name: 'bag of honey candy', many: 'bags of honey candy', price: [14, 260], made: true },
    pizza: { e: '🍕', name: 'pineapple pizza', many: 'pineapple pizzas', price: [40, 950], made: true },
    lollipop: { e: '🍭', name: 'rainbow lollipop', many: 'rainbow lollipops', price: [28, 1400], made: true },
  };
  // Crops: plant a seed packet in a bed, wait `days` days, pick `yield` items.
  F.CROPS = {
    carrot: { lv: 1, days: 1, yield: 3, seed: [2, 15] },
    strawberry: { lv: 2, days: 2, yield: 3, seed: [3, 30] },
    tomato: { lv: 5, days: 2, yield: 4, seed: [5, 40] },
    corn: { lv: 8, days: 3, yield: 5, seed: [6, 50] },
    pumpkin: { lv: 12, days: 4, yield: 2, seed: [8, 100] },
    sunflower: { lv: 16, days: 3, yield: 4, seed: [7, 60] },
    watermelon: { lv: 22, days: 4, yield: 2, seed: [10, 150] },
    blueberry: { lv: 28, days: 3, yield: 5, seed: [12, 120] },
    grapes: { lv: 35, days: 5, yield: 4, seed: [20, 250] },
    potato: { lv: 25, days: 2, yield: 4, seed: [5, 50] },
    pepper: { lv: 31, days: 3, yield: 4, seed: [7, 70] },
    pineapple: { lv: 43, days: 5, yield: 2, seed: [10, 300] },
  };
  // Animals: fed every day they grow (baby → young → grown-up); a fed grown-up gives `per` items the next morning.
  // grow: [days fed to be young, days fed to be grown-up]; eat: feed bags a day.
  F.ANIMALS = {
    chicken: { e: '🐔', baby: '🐣', name: 'Chicken', lv: 1, cost: [5, 50], eat: 1, grow: [1, 2], item: 'egg', per: 2 },
    bees: { e: '🐝', baby: '🐝', name: 'Beehive', lv: 3, cost: [10, 150], eat: 1, grow: [1, 2], item: 'honey', per: 1 },
    goat: { e: '🐐', baby: '🐐', name: 'Goat', lv: 6, cost: [15, 300], eat: 2, grow: [1, 3], item: 'goatmilk', per: 1 },
    sheep: { e: '🐑', baby: '🐑', name: 'Sheep', lv: 10, cost: [20, 450], eat: 2, grow: [1, 3], item: 'wool', per: 1 },
    cow: { e: '🐄', baby: '🐮', name: 'Cow', lv: 14, cost: [30, 800], eat: 4, grow: [2, 4], item: 'milk', per: 2 },
    duck: { e: '🦆', baby: '🐥', name: 'Duck', lv: 18, cost: [25, 600], eat: 2, grow: [1, 2], item: 'duckegg', per: 2 },
    pig: { e: '🐖', baby: '🐷', name: 'Pig', lv: 24, cost: [40, 1500], eat: 3, grow: [2, 4], item: 'truffle', per: 1 },
    alpaca: { e: '🦙', baby: '🦙', name: 'Alpaca', lv: 30, cost: [60, 2500], eat: 4, grow: [2, 5], item: 'fluff', per: 1 },
    pony: { e: '🐴', baby: '🐴', name: 'Pony', lv: 40, cost: [90, 4000], eat: 5, grow: [2, 5], item: 'ride', per: 1 },
    turkey: { e: '🦃', baby: '🐥', name: 'Turkey', lv: 27, cost: [45, 1800], eat: 3, grow: [2, 4], item: 'feather', per: 2 },
    fishpond: { e: '🐟', baby: '🐟', name: 'Fish pond', lv: 34, cost: [55, 2800], eat: 2, grow: [1, 3], item: 'fish', per: 2 },
    silkworm: { e: '🐛', baby: '🐛', name: 'Silkworms', lv: 41, cost: [65, 3500], eat: 2, grow: [1, 3], item: 'silk', per: 1 },
    reindeer: { e: '🦌', baby: '🦌', name: 'Reindeer', lv: 51, cost: [80, 6000], eat: 5, grow: [2, 5], item: 'sleigh', per: 1 },
    unicorn: { e: '🦄', baby: '🦄', name: 'Unicorn', lv: 60, cost: [99, 12000], eat: 6, grow: [3, 6], item: 'sparkle', per: 1 },
  };
  // The merchant's Mythic Feed turns the animals of one kind into mythic ones for a week (drawn in js/farm-art.js):
  // they make a rare thing instead of the usual one. of: the usual animals, in a sentence.
  F.MYTHS = {
    chicken: { of: 'chickens', name: 'Firebird Hen', many: 'Firebird Hens', item: 'goldegg' },
    bees: { of: 'bees', name: 'Starlight Bees', many: 'Starlight Bees', item: 'starhoney' },
    goat: { of: 'goats', name: 'Crystal Goat', many: 'Crystal Goats', item: 'crystalmilk' },
    sheep: { of: 'sheep', name: 'Cloud Sheep', many: 'Cloud Sheep', item: 'fleece' },
    cow: { of: 'cows', name: 'Moon Cow', many: 'Moon Cows', item: 'moonmilk' },
    duck: { of: 'ducks', name: 'Silver Swan', many: 'Silver Swans', item: 'silveregg' },
    pig: { of: 'pigs', name: 'Flying Pig', many: 'Flying Pigs', item: 'goldtruffle' },
    turkey: { of: 'turkeys', name: 'Thunderbird', many: 'Thunderbirds', item: 'thunder' },
    alpaca: { of: 'alpacas', name: 'Star Alpaca', many: 'Star Alpacas', item: 'starfluff' },
    pony: { of: 'ponies', name: 'Pegasus', many: 'Pegasus ponies', item: 'skyride' },
  };
  // An item's icon for the screens: mythic things glow (the plain emoji is for text).
  F.ie = (id) => { const it = F.ITEMS[id]; return it.myth ? `<i class="mye my-${it.myth}">${it.e}</i>` : it.e; };
  // Workshops turn what the farm makes into things worth more (the first lesson in "adding value").
  // Each workshop makes one batch at a time; a batch is ready after `days` nights. A recipe may open later than its workshop.
  F.WORKS = {
    jamkitchen: { e: '🫙', name: 'Jam kitchen', lv: 7, cost: [12, 200], recipes: [
      { out: 'jam', in: { strawberry: 4 }, days: 1, lv: 7 },
      { out: 'sauce', in: { tomato: 4 }, days: 1, lv: 9 },
    ] },
    bakery: { e: '🥖', name: 'Bakery', lv: 12, cost: [20, 500], recipes: [
      { out: 'cornbread', in: { corn: 2, egg: 2 }, days: 1, lv: 12 },
      { out: 'pie', in: { pumpkin: 1, egg: 2 }, days: 1, lv: 14 },
      { out: 'fries', in: { potato: 4 }, days: 1, lv: 26 },
    ] },
    dairy: { e: '🏭', name: 'Cheese dairy', lv: 17, cost: [30, 900], recipes: [
      { out: 'cheese', in: { milk: 3 }, days: 2, lv: 17 },
      { out: 'icecream', in: { milk: 2, strawberry: 2 }, days: 1, lv: 19 },
    ] },
    knitting: { e: '🪡', name: 'Knitting room', lv: 21, cost: [35, 1200], recipes: [
      { out: 'scarf', in: { wool: 2 }, days: 1, lv: 21 },
      { out: 'sweater', in: { fluff: 2, wool: 1 }, days: 2, lv: 32 },
    ] },
    juicebar: { e: '🍹', name: 'Juice bar', lv: 29, cost: [45, 2000], recipes: [
      { out: 'juice', in: { grapes: 3 }, days: 1, lv: 35 },
      { out: 'smoothie', in: { strawberry: 2, blueberry: 2, milk: 1 }, days: 1, lv: 29 },
    ] },
    tailor: { e: '🧵', name: 'Tailor shop', lv: 44, cost: [70, 6000], recipes: [
      { out: 'hat', in: { feather: 2, silk: 1 }, days: 1, lv: 44 },
      { out: 'dress', in: { silk: 2 }, days: 2, lv: 45 },
    ] },
    restaurant: { e: '🍽️', name: 'Restaurant', lv: 49, cost: [80, 8000], recipes: [
      { out: 'soup', in: { carrot: 3, tomato: 2, potato: 2, pepper: 1 }, days: 1, lv: 49 },
      { out: 'fishchips', in: { fish: 2, potato: 2 }, days: 1, lv: 50 },
      { out: 'pizza', in: { pineapple: 1, tomato: 2, cheese: 1 }, days: 1, lv: 55 },
    ] },
    sweets: { e: '🍬', name: 'Sweet shop', lv: 56, cost: [90, 10000], recipes: [
      { out: 'candy', in: { honey: 2 }, days: 1, lv: 56 },
      { out: 'lollipop', in: { sparkle: 1, honey: 1 }, days: 1, lv: 60 },
    ] },
  };
  F.recipes = () => Object.entries(F.WORKS).flatMap(([w, x]) => x.recipes.map((r, i) => Object.assign({ work: w, i }, r)));
  F.FEED = { e: '🌾', price: [1, 5] }; // one bag
  F.FEED_PACKS = [[5, 1], [20, 1], [50, 6], [100, 15]]; // [bags, level]: big packs for a farm with many animals
  // More beds and pens: [unlock level, price k, price g2] for each one after the first ones.
  // At most 6 beds and 6 pens, so the whole farm fits on a screen: after that the farm grows by upgrading them.
  F.BEDS = [[1, 0, 0], [1, 0, 0], [2, 5, 40], [4, 8, 80], [7, 12, 150], [11, 18, 250]];
  F.PENS = [[1, 0, 0], [2, 6, 60], [5, 12, 150], [8, 20, 300], [12, 30, 500], [17, 45, 800]];
  // Upgrades for each bed, in this order (bed.u = how many are done): more crops, faster growth, a second harvest.
  F.BED_UP = [
    { name: 'Good soil ★', lv: 3, cost: [4, 40], note: '+1 crop every harvest', icon: '⭐' },
    { name: 'Rich soil ★★', lv: 9, cost: [8, 100], note: '+1 more crop every harvest', icon: '⭐' },
    { name: 'Sprinkler', lv: 14, cost: [12, 200], note: 'crops are ready 1 day sooner', icon: '💧' },
    { name: 'Super soil ★★★', lv: 20, cost: [18, 350], note: '+1 more crop every harvest', icon: '⭐' },
    { name: 'Mini greenhouse', lv: 37, cost: [30, 700], note: 'one packet of seeds gives two harvests', icon: '🏠' },
    { name: 'Golden soil ★★★★', lv: 53, cost: [45, 1200], note: '+1 more crop every harvest', icon: '🌟' },
  ];
  // Upgrades for each pen (pen.u): room for a 2nd and a 3rd animal of the same kind, then a cozy barn (+1 every day).
  // Room costs what one more animal costs; the cozy barn costs half of that.
  F.PEN_UP = [
    { name: 'Room for 2', lv: 6, note: 'a 2nd animal: twice the things to sell, twice the feed' },
    { name: 'Room for 3', lv: 15, note: 'a 3rd animal: three times the things to sell and the feed' },
    { name: 'Cozy barn', lv: 23, note: 'grown-ups give 1 more every day', half: true },
  ];
  // The barnyard: from level 16, a row of six little houses, one for each kind of small animal, so the cheap
  // animals don't take a pen from the big ones (a farm grows into alpacas and unicorns, and the bakery, the dairy
  // and the orders still want eggs, milk and honey). A house comes with its first animal; Room for 2 and Room for 3
  // work as in a pen and cost one more animal; there is no cozy barn. fm.yard = { animal: a pen of that kind }.
  F.YARD_LV = 16;
  F.YARD_ROOM = 2; // room upgrades in a house (up to 3 animals)
  F.HOUSES = {
    chicken: { name: 'Henhouse', lv: 16, cost: [15, 300] },
    bees: { name: 'Bee yard', lv: 18, cost: [20, 400] },
    goat: { name: 'Goat shed', lv: 20, cost: [25, 500] },
    sheep: { name: 'Sheep barn', lv: 22, cost: [30, 600] },
    duck: { name: 'Duck house', lv: 24, cost: [35, 800] },
    turkey: { name: 'Turkey roost', lv: 30, cost: [50, 2000] },
  };
  F.yardOpen = (fm) => F.level(fm.xp).level >= F.YARD_LV;
  // every pen and every house with animals: what is fed, grows and makes things each night
  F.allPens = (fm) => fm.pens.concat(Object.values(fm.yard || {}));
  F.bedStars = (b) => Math.min(b.u || 0, 2) + ((b.u || 0) >= 4 ? 1 : 0) + ((b.u || 0) >= 6 ? 1 : 0);
  F.bedWater = (b) => (b.u || 0) >= 3;
  F.bedGlass = (b) => (b.u || 0) >= 5;
  F.cropDays = (b) => Math.max(1, F.CROPS[b.c].days - (F.bedWater(b) ? 1 : 0));
  // + the Magic Watering Can; a week of the merchant's Sunshine Potion doubles it
  F.cropYield = (b, fm) => (F.CROPS[b.c].yield + F.bedStars(b) + (fm && fm.treasure && fm.treasure.can ? 1 : 0)) * (fm && F.charmOn(fm, 'sun') ? 2 : 1);
  F.penCount = (p) => 1 + Math.min(p.u || 0, 2);
  // what a pen has to collect: the usual things (ready) and mythic ones from a Mythic Feed week (rare)
  F.penReady = (p) => (p.ready || 0) + (p.rare || 0);
  F.penEat = (p) => F.ANIMALS[p.a].eat * F.penCount(p);
  F.penMakes = (p) => F.ANIMALS[p.a].per * F.penCount(p) + ((p.u || 0) >= 3 ? 1 : 0);
  F.upCost = (kind, i, grade, animal) => {
    if (kind === 'bed') return F.BED_UP[i].cost[gi(grade)];
    const a = F.ANIMALS[animal].cost[gi(grade)];
    return F.PEN_UP[i].half ? Math.ceil(a / 2) : a;
  };
  // The farmhand feeds the animals every night and collects what they made in the morning, for a daily wage.
  // From level 48 the farmhand also picks ripe crops.
  F.HELPER = { lv: 39, picksLv: 48, hire: [20, 500], wage: [2, 25], name: 'Sam' };
  // The stand: a nicer stand brings tips for first-try right answers (part of the sale, at least 1¢).
  F.STANDS = [
    { e: '🪵', name: 'Wooden table', lv: 1, cost: [0, 0], tip: 0 },
    { e: '🛒', name: 'Farm cart', lv: 4, cost: [15, 200], tip: 0.05 },
    { e: '⛺', name: 'Market tent', lv: 9, cost: [30, 600], tip: 0.1 },
    { e: '🏠', name: 'Farm shop', lv: 15, cost: [50, 1500], tip: 0.15 },
    { e: '🏛️', name: 'Market hall', lv: 25, cost: [80, 4000], tip: 0.2 },
    { e: '🏬', name: 'Supermarket', lv: 40, cost: [99, 10000], tip: 0.25 },
    { e: '🏰', name: 'Royal market', lv: 58, cost: [99, 20000], tip: 0.3 },
  ];
  F.DECOR = {
    fence: { e: '🪵', name: 'Fence', lv: 2, cost: [5, 100] },
    flowers: { e: '🌷', name: 'Tulips', lv: 3, cost: [6, 150] },
    scarecrow: { e: '🧑‍🌾', name: 'Scarecrow', lv: 5, cost: [8, 250] },
    birdhouse: { e: '🐦', name: 'Birdhouse', lv: 6, cost: [10, 300] },
    tree: { e: '🌳', name: 'Apple tree', lv: 8, cost: [12, 500] },
    pond: { e: '🦢', name: 'Pond with swans', lv: 9, cost: [15, 600] },
    dog: { e: '🐕', name: 'Farm dog', lv: 11, cost: [18, 900] },
    windmill: { e: '🌬️', name: 'Windmill', lv: 13, cost: [20, 1200] },
    tractor: { e: '🚜', name: 'Tractor', lv: 15, cost: [40, 4000] },
    barn: { e: '🛖', name: 'Red barn', lv: 19, cost: [35, 3000] },
    cat: { e: '🐈', name: 'Barn cat', lv: 21, cost: [30, 2000] },
    greenhouse: { e: '🪴', name: 'Greenhouse', lv: 26, cost: [50, 6000] },
    balloon: { e: '🎈', name: 'Hot-air balloon', lv: 33, cost: [70, 8000] },
    fountain: { e: '⛲', name: 'Fountain', lv: 36, cost: [80, 10000] },
    rainbow: { e: '🌈', name: 'Rainbow arch', lv: 42, cost: [90, 15000] },
    golden: { e: '🏆', name: 'Golden chicken statue', lv: 50, cost: [99, 20000] },
    carousel: { e: '🎠', name: 'Carousel', lv: 38, cost: [75, 9000] },
    farmhouse: { e: '🏡', name: 'Big farmhouse', lv: 46, cost: [85, 12000] },
    helicopter: { e: '🚁', name: 'Farm helicopter', lv: 52, cost: [90, 16000] },
    ferris: { e: '🎡', name: 'Ferris wheel', lv: 54, cost: [95, 18000] },
    rocket: { e: '🚀', name: 'Rocket to the moon', lv: 57, cost: [99, 25000] },
    sailboat: { e: '⛵', name: 'Sailboat on the pond', lv: 47, cost: [88, 14000] },
    circus: { e: '🎪', name: 'Farm circus', lv: 59, cost: [99, 22000] },
    telescope: { e: '🔭', name: 'Star telescope', lv: 64, cost: [99, 35000] },
    island: { e: '🏝️', name: 'Farm island', lv: 68, cost: [99, 45000] },
    fireworks: { e: '🎆', name: 'Fireworks show', lv: 62, cost: [99, 30000] },
    ufo: { e: '🛸', name: 'Friendly UFO', lv: 66, cost: [99, 40000] },
    dragon: { e: '🐉', name: 'Dragon friend', lv: 70, cost: [99, 50000] },
  };
  // Math tiers: which money problems customers bring. A tier opens with the farm level; the child climbs the open
  // tiers by answering right (4 first-try right in a row → up, 2 misses → down). Tiers marked ahead are beyond
  // the grade's standards (challenges to grow into); a ⭐ challenge customer brings one tier above the current one.
  F.TIERS = {
    k: [
      { lv: 1, name: 'Pennies to 10', max: 10, coins: ['p'], types: ['collect', 'count', 'total'] },
      { lv: 4, name: 'Nickels to 20', max: 20, coins: ['n', 'p'], types: ['count', 'collect', 'total', 'change', 'enough'], pay: [10] },
      { lv: 12, name: 'Dimes to 50', max: 50, coins: ['d', 'n', 'p'], types: ['count', 'collect', 'change', 'giveChange', 'total'], pay: [10, 20, 25, 50], ahead: true },
      { lv: 22, name: 'Quarters to 99', max: 99, coins: ['q', 'd', 'n', 'p'], types: ['count', 'collect', 'change', 'giveChange', 'two', 'enough'], pay: [25, 50, 100], ahead: true },
      { lv: 30, name: 'Dollars and saving', max: 200, coins: ['b', 'q', 'd', 'n', 'p'], types: ['count', 'collect', 'change', 'interest', 'worth'], pay: [100, 200], ahead: true },
    ],
    g2: [
      { lv: 1, name: 'Coins to 50¢', max: 60, coins: ['d', 'n', 'p'], types: ['count', 'collect', 'total', 'two'] },
      { lv: 3, name: 'Quarters to 99¢', max: 99, coins: ['q', 'd', 'n', 'p'], types: ['count', 'collect', 'change', 'two', 'enough'], pay: [50, 100] },
      { lv: 6, name: 'Dollars', max: 500, coins: ['b', 'q', 'd', 'n', 'p'], types: ['count', 'two', 'total', 'change', 'giveChange'], pay: [100, 200, 500] },
      { lv: 10, name: 'Change from $5', max: 1000, coins: ['f', 'b', 'q', 'd', 'n', 'p'], types: ['change', 'giveChange', 'budget', 'collect', 'two'], pay: [100, 200, 500, 1000] },
      { lv: 16, name: 'Big orders', max: 2000, coins: ['t', 'f', 'b', 'q', 'd', 'n', 'p'], types: ['multiply', 'change', 'budget', 'giveChange'], pay: [500, 1000, 2000], ahead: true },
      { lv: 24, name: 'Deals & profit', max: 5000, coins: ['w', 't', 'f', 'b', 'q', 'd', 'n', 'p'], types: ['deal', 'profit', 'budget', 'multiply'], pay: [1000, 2000], ahead: true },
      { lv: 34, name: 'Interest & adding value', max: 5000, coins: ['w', 't', 'f', 'b', 'q', 'd', 'n', 'p'], types: ['interest', 'worth', 'deal', 'budget'], pay: [1000, 2000], ahead: true },
    ],
  };
  F.tiers = (grade) => F.TIERS[grade === 'k' ? 'k' : 'g2'];
  F.tierOpen = (fm, grade) => F.tiers(grade).filter((t) => t.lv <= F.level(fm.xp).level).length; // 1-based count
  F.VIP_EVERY = 5; // every 5th customer is a ⭐ challenge customer
  // A big farm makes more than customers carry away (2–3 things each). When a pile builds up, every 3rd customer is
  // the market truck: it buys a whole pile of one thing at the wholesale price, with one money problem of the child's
  // tier. It pays at most 50¢ or $5 (F.truckCap), so a problem still brings about the money a customer does.
  F.TRUCK = ['🚚', 'The market truck'];
  F.TRUCK_EVERY = 3;
  F.TRUCK_MIN = 10; // a pile: at least this many of one thing

  // ---------------------------------------------------------------- money words
  F.COINV = { p: 1, n: 5, d: 10, q: 25, b: 100, f: 500, t: 1000, w: 2000 };
  // Kindergarten counts everything in cents; 2nd grade writes $1.25 from a dollar up.
  F.fmt = (c, grade) => (grade === 'k' ? c + '¢' : U.cents(c));
  F.spoken = (c, grade) => {
    if (grade === 'k' || c < 100) return c + (c === 1 ? ' cent' : ' cents');
    const d = Math.floor(c / 100), r = c % 100;
    return d + (d === 1 ? ' dollar' : ' dollars') + (r ? ' and ' + r + (r === 1 ? ' cent' : ' cents') : '');
  };
  const PAY_NAMES = { 5: ['a nickel', ['n']], 10: ['a dime', ['d']], 20: ['two dimes', ['d', 'd']], 25: ['a quarter', ['q']], 50: ['two quarters', ['q', 'q']], 100: ['a $1 bill', ['b']], 200: ['two $1 bills', ['b', 'b']], 500: ['a $5 bill', ['f']], 1000: ['a $10 bill', ['t']], 2000: ['a $20 bill', ['w']] };
  F.payName = (x) => (PAY_NAMES[x] || [F.fmt(x, 'g2'), []])[0];
  F.payCoins = (x) => (PAY_NAMES[x] || ['', F.fewest(x, Object.keys(F.COINV))])[1];
  const byValue = (kinds) => kinds.slice().sort((a, b) => F.COINV[b] - F.COINV[a]);
  F.sumCoins = (list) => U.sum(list.map((k) => F.COINV[k]));
  // Fewest coins and bills for an amount (US money is greedy-safe).
  F.fewest = (amt, kinds) => {
    const out = [];
    let rem = amt;
    for (const k of byValue(kinds)) while (F.COINV[k] <= rem) { out.push(k); rem -= F.COINV[k]; }
    return rem ? null : out;
  };
  // A natural-looking handful of coins for an amount: not always the fewest, at most 12 pieces.
  F.coinsFor = (amt, kinds) => {
    const ks = byValue(kinds);
    for (let tries = 0; tries < 20; tries++) {
      let rem = amt;
      const out = [];
      ks.forEach((k, i) => {
        const v = F.COINV[k], most = Math.floor(rem / v);
        const n = i === ks.length - 1 ? most : U.rnd(Math.ceil(most / 2), most);
        for (let j = 0; j < n; j++) out.push(k);
        rem -= n * v;
      });
      if (!rem && out.length <= 12) return out;
    }
    return F.fewest(amt, ks);
  };

  // ---------------------------------------------------------------- levels
  // Farm level from XP: level L → L+1 takes 20 + 10·L XP (level 10 ≈ 650 XP, level 50 ≈ 13,000 XP). No top level.
  F.need = (L) => 20 + 10 * L;
  F.level = (xp) => {
    let L = 1, from = 0;
    while (xp >= from + F.need(L)) { from += F.need(L); L++; }
    return { level: L, from, to: from + F.need(L) };
  };
  F.gift = (L, grade) => (grade === 'k' ? Math.max(2, Math.round(L / 2)) : 10 * L); // money gift for reaching level L
  // Everything that opens at a level (for the level-up card and the "next level" hint).
  F.unlocksAt = (L, grade) => {
    const out = [];
    for (const [id, c] of Object.entries(F.CROPS)) if (c.lv === L) out.push({ e: F.ITEMS[id].e, name: F.ITEMS[id].many + ' to plant' });
    for (const a of Object.values(F.ANIMALS)) if (a.lv === L) out.push({ e: a.e, name: a.name });
    F.BEDS.forEach((b, i) => { if (i >= 2 && b[0] === L) out.push({ e: '🟫', name: 'Garden bed ' + (i + 1) }); });
    F.PENS.forEach((p, i) => { if (i >= 1 && p[0] === L) out.push({ e: '🏡', name: 'Animal pen ' + (i + 1) }); });
    for (const s of F.STANDS) if (s.lv === L && L > 1) out.push({ e: s.e, name: s.name });
    for (const d of Object.values(F.DECOR)) if (d.lv === L) out.push({ e: d.e, name: d.name });
    F.tiers(grade).forEach((t) => { if (t.lv === L && L > 1) out.push({ e: t.ahead ? '⭐' : '🧮', name: 'New money problems: ' + t.name + (t.ahead ? ' (challenge)' : '') }); });
    for (const w of Object.values(F.WORKS)) {
      if (w.lv === L) out.push({ e: w.e, name: w.name + ' (workshop)' });
      for (const r of w.recipes) if (r.lv === L && r.lv > w.lv) out.push({ e: F.ITEMS[r.out].e, name: `New recipe: ${F.ITEMS[r.out].many}` });
    }
    if (L === F.BANK_LV) out.push({ e: '🏦', name: 'The bank: save money and earn interest' });
    for (const [a, h] of Object.entries(F.HOUSES)) if (h.lv === L) out.push({ e: F.ANIMALS[a].e, name: `Barnyard: a ${h.name.toLowerCase()} for ${F.MYTHS[a].of} (no pen needed)` });
    if (L === F.ORDERS_LV) out.push({ e: '📋', name: 'The order board: people in town order things from your farm' });
    F.ACCOUNTS.forEach((a, i) => { if (i && a.lv === L) out.push({ e: a.e, name: `Bank: ${a.name} (more savings earn the big interest)` }); });
    for (const u of F.BED_UP) if (u.lv === L) out.push({ e: u.icon, name: 'Garden bed upgrade: ' + u.name });
    for (const u of F.PEN_UP) if (u.lv === L) out.push({ e: '🏡', name: 'Pen upgrade: ' + u.name });
    for (const [n, lv] of F.FEED_PACKS) if (lv === L && L > 1) out.push({ e: F.FEED.e, name: `Feed: ${n} bags in one pack` });
    if (L === F.HELPER.lv) out.push({ e: '🧑‍🌾', name: `Farmhand ${F.HELPER.name}: feeds and collects for a wage` });
    if (L === F.HELPER.picksLv) out.push({ e: '🧑‍🌾', name: `${F.HELPER.name} picks ripe crops too` });
    const t = F.TITLES.find((x) => x[0] === L);
    if (t && L > 1) out.push({ e: '🎖️', name: 'New title: ' + t[1] });
    return out;
  };
  // A farmer's title grows with the farm level.
  F.TITLES = [[1, 'Little farmer'], [5, 'Farm helper'], [10, 'Farmer'], [15, 'Busy farmer'], [20, 'Rancher'], [30, 'Farm boss'], [40, 'Market master'], [50, 'Farm tycoon'], [60, 'Farm legend'], [75, 'Farm hero'], [100, 'Farm superstar']];
  F.title = (L) => F.TITLES.filter((x) => x[0] <= L).pop()[1];

  // ---------------------------------------------------------------- new farm
  F.fresh = () => ({
    money: 0, // set for the grade on first open (F.ensure)
    started: false,
    xp: 0,
    day: 1,
    feed: 3,
    beds: [{ c: 'carrot', g: 1 }, { c: null, g: 0 }],
    pens: [{ a: 'chicken', g: 0, fed: false, ready: 0 }],
    basket: {},
    owned: {},
    stand: 0,
    goal: '',
    tier: 1,
    streak: 0,
    miss: 0,
    customers: 0,
    t: 0, // when the farm last changed (for merging copies from two devices)
    stats: { sold: 0, earned: 0, spent: 0, tasks: 0, right: 0, vip: 0, jobs: 0, made: 0, interest: 0, bankDays: 0, saved: 0, tookOut: 0, built: 0, dreamIn: 0 }, // saved / tookOut: all money ever put in / taken out of the bank; built: paid to builders from the bank; dreamIn: what the buildings earned
    works: {}, // workshop id: { r: recipe index or null, g: nights, ready: items, out: item }
    bank: { bal: 0, acct: 0, log: [], pend: [] }, // see the bank below: bank day is every 7th farm day
    dream: { p: 0, s: 0, b: false, seen: false }, // Big Dreams: project p, stages built s, builders at work tonight b
    treasure: {}, // the traveling merchant's treasures bought: id: true
    merchant: null, // his visit: { week, n, item, charms, a, cost, got } (see the traveling merchant below)
    charms: {}, // the merchant's week charms working now: id: { cost, until, gain, a, extra } (Golden Piggy: { cost }, until bank day)
    dep: { ok: false, amt: 0, until: 0 }, // the bank's locked deposit (2nd grade): opened once savings pass the limit (ok); amt locked until farm day `until`
    orders: { seen: false, n: 0, list: [] }, // the order board (see below)
    yard: {}, // the barnyard's houses: animal: { a, g, fed, ready, u } (like a pen)
  });
  F.START_MONEY = [5, 30];
  F.ensure = (st) => {
    if (!st.farm) st.farm = F.fresh();
    const fm = st.farm;
    if (!fm.started) { fm.started = true; fm.money = F.START_MONEY[gi(st.grade)]; }
    // farms from the first version: add what came later
    if (!fm.works) fm.works = {};
    if (!fm.bank) fm.bank = { bal: 0, log: [], pend: [] };
    if (!fm.bank.pend) { fm.bank.pend = []; delete fm.bank.since; } // bank weeks used to be calendar weeks
    if (!fm.bank.acct) fm.bank.acct = 0; // bank accounts came later
    if (!fm.helper) fm.helper = { hired: false, on: true };
    if (!fm.stats.wages) fm.stats.wages = 0;
    for (const k of ['made', 'interest', 'bankDays']) if (!fm.stats[k]) fm.stats[k] = 0;
    // totals saved and taken out came later: what is in the bank and is not interest was saved
    if (fm.stats.saved == null) { fm.stats.saved = Math.max(0, fm.bank.bal - fm.stats.interest); fm.stats.tookOut = 0; }
    if (!fm.dream) fm.dream = { p: 0, s: 0, b: false, seen: false }; // Big Dreams came later
    if (!fm.treasure) fm.treasure = {}; // so did the traveling merchant
    if (fm.merchant === undefined) fm.merchant = null;
    if (!fm.charms) fm.charms = {}; // and his week charms
    for (const k of ['charms', 'charmCost', 'charmGain', 'charmWins']) if (!fm.stats[k]) fm.stats[k] = 0;
    if (!fm.dep) fm.dep = { ok: false, amt: 0, until: 0 }; // and the locked deposit
    if (!fm.stats.depBonus) fm.stats.depBonus = 0;
    for (const k of ['built', 'dreamIn']) if (!fm.stats[k]) fm.stats[k] = 0;
    if (!fm.orders) fm.orders = { seen: false, n: 0, list: [] }; // and the order board
    if (!fm.yard) fm.yard = {}; // and the barnyard
    for (const k of ['orders', 'orderPay', 'orderExtra']) if (!fm.stats[k]) fm.stats[k] = 0;
    return fm;
  };

  // ---------------------------------------------------------------- farm actions
  F.price = (id, grade) => F.ITEMS[id].price[gi(grade)];
  F.seedPrice = (crop, grade) => F.CROPS[crop].seed[gi(grade)];
  F.basketCount = (fm) => U.sum(Object.values(fm.basket));
  F.basketValue = (fm, grade) => U.sum(Object.entries(fm.basket).map(([id, n]) => n * F.price(id, grade)));
  F.cropStage = (bed) => {
    if (!bed.c) return 'empty';
    return bed.g >= F.cropDays(bed) ? 'ready' : bed.g === 0 ? 'seed' : 'sprout';
  };
  F.animalStage = (pen) => {
    const a = F.ANIMALS[pen.a];
    return pen.g >= a.grow[1] ? 2 : pen.g >= a.grow[0] ? 1 : 0; // 0 baby, 1 young, 2 grown-up
  };
  // A bed keeps its upgrades (u) when it is planted and picked.
  F.plant = (fm, i, crop) => { Object.assign(fm.beds[i], { c: crop, g: 0, again: false }); };
  F.harvest = (fm, i) => {
    const bed = fm.beds[i];
    if (F.cropStage(bed) !== 'ready') return 0;
    const n = F.cropYield(bed, fm);
    fm.basket[bed.c] = (fm.basket[bed.c] || 0) + n;
    if (F.charmOn(fm, 'sun')) { const x = fm.charms.sun; x.extra = x.extra || {}; x.extra[bed.c] = (x.extra[bed.c] || 0) + n / 2; } // what the Sunshine Potion added
    if (F.bedGlass(bed) && !bed.again) Object.assign(bed, { g: 0, again: true }); // the greenhouse grows a second harvest
    else Object.assign(bed, { c: null, g: 0, again: false });
    return n;
  };
  F.emptyBeds = (fm) => fm.beds.map((b, i) => (b.c ? -1 : i)).filter((i) => i >= 0);
  // Plant the same crop in n empty beds for one payment of n × the seed price.
  F.plantAll = (fm, grade, crop, n) => {
    const beds = F.emptyBeds(fm).slice(0, n), price = beds.length * F.seedPrice(crop, grade);
    if (beds.length < n || fm.money < price || F.CROPS[crop].lv > F.level(fm.xp).level) return false;
    fm.money -= price;
    fm.stats.spent += price;
    beds.forEach((i) => F.plant(fm, i, crop));
    return true;
  };
  // What a pen has to collect, thing by thing: [[item, count], …] (the mythic things first).
  F.penLoot = (p) => [[F.MYTHS[p.a] && F.MYTHS[p.a].item, p.rare || 0], [F.ANIMALS[p.a].item, p.ready || 0]].filter(([id, n]) => id && n > 0);
  F.collect = (fm, i) => F.collectPen(fm, fm.pens[i]);
  F.collectPen = (fm, pen) => {
    const loot = pen && pen.a ? F.penLoot(pen) : [];
    if (!loot.length) return 0;
    for (const [item, n] of loot) fm.basket[item] = (fm.basket[item] || 0) + n;
    pen.ready = 0;
    pen.rare = 0;
    return U.sum(loot.map((x) => x[1]));
  };
  F.feed = (fm, i) => F.feedPen(fm, fm.pens[i]);
  F.feedPen = (fm, pen) => {
    const eat = F.penEat(pen);
    if (pen.fed) return 'fed';
    if (fm.feed < eat) return 'nofeed';
    fm.feed -= eat;
    pen.fed = true;
    return 'ok';
  };
  // Selling a pen's animals to the neighbour, to make room for another kind. Farmer Rosa pays half of what they cost
  // in the shop: every animal in the pen (the 2nd and 3rd came with "Room for"), and half of the cozy barn. The pen's
  // upgrades go with the animals (they cost what one more animal of that kind costs), so the pen is new again.
  F.NEIGHBOR = ['👩‍🌾', 'Farmer Rosa'];
  F.resale = (p, grade) => {
    const g = gi(grade), cost = F.ANIMALS[p.a].cost[g], each = Math.ceil(cost / 2), n = F.penCount(p);
    const barn = (p.u || 0) >= 3 ? Math.ceil(F.upCost('pen', 2, grade, p.a) / 2) : 0;
    return { cost, each, n, barn, total: n * each + barn };
  };
  // Things the animals already made go to the basket first. Returns what Rosa paid (0 for an empty pen).
  F.sellPen = (fm, grade, i) => {
    const p = fm.pens[i];
    if (!p || !p.a) return 0;
    F.collect(fm, i);
    const { total } = F.resale(p, grade);
    fm.money += total;
    fm.stats.animalsSold = (fm.stats.animalsSold || 0) + F.penCount(p);
    fm.pens[i] = { a: null, g: 0, fed: false, ready: 0 };
    return total;
  };
  // Moving a pen's small animals into their house in the barnyard, instead of selling them: when the house is built
  // and there is room for all of them (3 at most). Things they made go to the basket first; they keep growing from
  // where the further-grown group is; the house gets the room they need. Feed for today: if only one group was fed,
  // its feed comes back and the house is hungry (feed them once more). The pen is empty and new again. (A pen with
  // a cozy barn has 3 animals, which never fit with the house's own, so a barn never has to move.)
  F.canMove = (fm, i) => {
    const p = fm.pens[i], h = p && p.a && (fm.yard || {})[p.a];
    return !!h && F.penCount(h) + F.penCount(p) <= 1 + F.YARD_ROOM;
  };
  F.moveToHouse = (fm, i) => {
    if (!F.canMove(fm, i)) return null;
    const p = fm.pens[i], h = fm.yard[p.a], n = F.penCount(p);
    F.collectPen(fm, p);
    if (p.fed !== h.fed) fm.feed += F.penEat(p.fed ? p : h); // one group was fed today: its feed back
    Object.assign(h, { u: F.penCount(h) + n - 1, g: Math.max(h.g, p.g), fed: p.fed && h.fed });
    fm.pens[i] = { a: null, g: 0, fed: false, ready: 0 };
    return { a: h.a, n, count: F.penCount(h) };
  };
  // Night: crops grow a day, fed animals grow and grown-ups make something. Returns what happened for the morning card.
  F.nextDay = (fm, grade = 'g2') => {
    const news = { ripe: [], made: [], grew: [], hungry: [], cooked: [], helper: null };
    const hp = fm.helper;
    if (hp && hp.hired && hp.on) { // the farmhand works tonight if there is money for the wage
      const wage = F.HELPER.wage[gi(grade)];
      if (fm.money < wage) news.helper = { unpaid: true, wage };
      else {
        fm.money -= wage;
        fm.stats.wages = (fm.stats.wages || 0) + wage;
        news.helper = { wage, fed: 0, short: 0, collected: 0, picked: 0 };
        F.allPens(fm).forEach((p) => { if (p.a && !p.fed) F.feedPen(fm, p) === 'ok' ? news.helper.fed++ : news.helper.short++; });
      }
    }
    for (const [id, w] of Object.entries(fm.works || {})) {
      if (w.r === null || w.r === undefined) continue;
      const r = F.WORKS[id].recipes[w.r];
      w.g++;
      if (w.g >= r.days) { w.ready = (w.ready || 0) + 1; w.out = r.out; w.r = null; w.g = 0; news.cooked.push(r.out); }
    }
    const tr = fm.treasure || {};
    if (tr.fairy) { // the Feed Fairy feeds hungry pens, for free
      const fed = F.allPens(fm).filter((x) => x.a && !x.fed).slice(0, F.TREASURES.fairy.feeds);
      fed.forEach((p) => (p.fed = true));
      if (fed.length) news.fairy = fed.map((p) => p.a);
    }
    fm.beds.forEach((b) => {
      if (!b.c || F.cropStage(b) === 'ready') return;
      b.g++;
      if (F.cropStage(b) === 'ready') news.ripe.push(b.c);
    });
    F.allPens(fm).forEach((p) => {
      if (!p.a) return;
      if (!p.fed) { news.hungry.push(p.a); return; }
      const before = F.animalStage(p);
      if (before === 2) {
        const a = F.ANIMALS[p.a], k = F.penMakes(p);
        if (F.mythOn(fm, p.a)) { // a Mythic Feed week: the rare thing instead of the usual one
          const it = F.MYTHS[p.a].item;
          p.rare = Math.min(30, (p.rare || 0) + k);
          news.made.push([it, k]);
          fm.charms.myth.gain += k * (F.price(it, grade) - F.price(a.item, grade));
        } else { p.ready = Math.min(30, (p.ready || 0) + k); news.made.push([a.item, k]); }
      }
      p.g++;
      if (F.animalStage(p) > before) news.grew.push([p.a, F.animalStage(p)]);
      p.fed = false;
    });
    if (news.helper && !news.helper.unpaid) { // in the morning: products into the basket, ripe crops too from level 48
      F.allPens(fm).forEach((p) => { news.helper.collected += F.collectPen(fm, p); });
      if (F.level(fm.xp).level >= F.HELPER.picksLv) fm.beds.forEach((b, i) => { news.helper.picked += F.harvest(fm, i); });
    }
    news.built = F.buildOvernight(fm);
    fm.day++;
    news.charmEnd = F.charmsMorning(fm, grade);
    news.orders = F.ordersMorning(fm, grade);
    if (tr.goose) { const x = F.TREASURES.goose.gold[gi(grade)]; fm.money += x; fm.stats.earned += x; news.gold = x; }
    if (tr.sheep) { fm.basket.rainbow = (fm.basket.rainbow || 0) + 1; news.rainbow = 1; }
    news.merchant = F.merchantMorning(fm, grade);
    if (fm.dep && fm.dep.amt && fm.day === fm.dep.until) news.depReady = F.depositBack(fm.dep.amt);
    news.depNew = F.depositCheck(fm, grade);
    news.bankDay = fm.bank ? F.bankMorning(fm, grade) : false; // the morning of bank day: what is saved earns interest
    return news;
  };

  // ---------------------------------------------------------------- the shop
  // Every thing a farmer can buy, with its state for this farm: lock (level needed), owned, price.
  F.shop = (fm, grade) => {
    const L = F.level(fm.xp).level, g = gi(grade), out = [];
    const freePen = fm.pens.some((p) => !p.a);
    for (const [n, lv] of F.FEED_PACKS) out.push({ id: 'feed:' + n, tab: 'animals', e: F.FEED.e, name: `${n} bags of feed`, price: n * F.FEED.price[g], lv, note: `You have ${fm.feed} 🌾` });
    for (const [id, a] of Object.entries(F.ANIMALS)) out.push({ id: 'animal:' + id, tab: 'animals', e: a.e, name: a.name, price: a.cost[g], lv: a.lv, note: `${F.ITEMS[a.item].e} ${F.fmt(F.price(a.item, grade), grade)} each · eats ${a.eat} 🌾 a day`, blocked: !freePen && 'Sell animals to free a pen' });
    for (const [a, h] of Object.entries(F.HOUSES)) out.push({ id: 'house:' + a, tab: 'animals', e: F.ANIMALS[a].e, name: h.name, price: h.cost[g], lv: h.lv, owned: !!(fm.yard || {})[a], note: `A little house for ${F.MYTHS[a].of}: no pen needed. Comes with one ${F.ANIMALS[a].name.toLowerCase()}.` });
    for (const [a, h] of Object.entries(fm.yard || {})) {
      const up = h.u < F.YARD_ROOM ? F.PEN_UP[h.u || 0] : null, A = F.ANIMALS[a];
      if (up) out.push({ id: 'houseup:' + a, tab: 'up', e: A.e, name: `${F.HOUSES[a].name}: ${up.name}`, price: A.cost[g], lv: up.lv, note: up.note });
      else out.push({ id: 'houseup:' + a, tab: 'up', e: A.e, name: `${F.HOUSES[a].name}: room for 3`, price: 0, lv: 1, owned: true });
    }
    const nb = fm.beds.length, np = fm.pens.length;
    if (nb < F.BEDS.length) out.push({ id: 'bed', tab: 'farm', e: '🟫', name: 'Garden bed ' + (nb + 1), price: F.BEDS[nb][1 + g], lv: F.BEDS[nb][0], note: 'Grow more crops' });
    if (np < F.PENS.length) out.push({ id: 'pen', tab: 'farm', e: '🏡', name: 'Animal pen ' + (np + 1), price: F.PENS[np][1 + g], lv: F.PENS[np][0], note: 'Room for one more animal' });
    fm.beds.forEach((b, i) => {
      const up = F.BED_UP[b.u || 0];
      if (up) out.push({ id: 'bedup:' + i, tab: 'up', e: up.icon, name: `Garden bed ${i + 1}: ${up.name}`, price: up.cost[g], lv: up.lv, note: up.note });
      else out.push({ id: 'bedup:' + i, tab: 'up', e: '🏅', name: `Garden bed ${i + 1}: every upgrade`, price: 0, lv: 1, owned: true });
    });
    fm.pens.forEach((p, i) => {
      if (!p.a) return;
      const up = F.PEN_UP[p.u || 0], a = F.ANIMALS[p.a];
      if (up) out.push({ id: 'penup:' + i, tab: 'up', e: a.e, name: `${a.name} pen: ${up.name}`, price: F.upCost('pen', p.u || 0, grade, p.a), lv: up.lv, note: up.note });
      else out.push({ id: 'penup:' + i, tab: 'up', e: a.e, name: `${a.name} pen: every upgrade`, price: 0, lv: 1, owned: true });
    });
    const H = F.HELPER;
    out.push({ id: 'helper', tab: 'farm', e: '🧑‍🌾', name: `Farmhand ${H.name}`, price: H.hire[g], lv: H.lv, owned: !!(fm.helper && fm.helper.hired), note: `Feeds the animals every night and collects in the morning. Wage: ${F.fmt(H.wage[g], grade)} a day.` });
    const na = F.ACCOUNTS[(fm.bank.acct || 0) + 1];
    if (na) out.push({ id: 'acct', tab: 'farm', e: na.e, name: 'Bank: ' + na.name, price: na.cost[g], lv: Math.max(na.lv, F.BANK_LV), note: `The bank adds the big interest on savings up to ${F.fmt(na.top[g], grade)}` });
    const ns = F.STANDS[fm.stand + 1];
    if (ns) out.push({ id: 'stand', tab: 'farm', e: ns.e, name: ns.name, price: ns.cost[g], lv: ns.lv, note: `Customers tip ${Math.round(ns.tip * 100)}% for right answers` });
    for (const [id, w] of Object.entries(F.WORKS)) out.push({ id: 'work:' + id, tab: 'farm', e: w.e, name: w.name, price: w.cost[g], lv: w.lv, owned: !!(fm.works || {})[id], note: 'Makes ' + w.recipes.map((r) => F.ITEMS[r.out].e).join(' ') + ' from what you grow' });
    for (const [id, d] of Object.entries(F.DECOR)) out.push({ id: 'decor:' + id, tab: 'decor', e: d.e, name: d.name, price: d.cost[g], lv: d.lv, owned: !!fm.owned[id] });
    for (const x of out) x.locked = x.lv > L;
    return out;
  };
  F.shopItem = (fm, grade, id) => F.shop(fm, grade).find((x) => x.id === id) || null;
  // Apply a paid purchase. Returns a short line for the toast.
  F.buy = (fm, grade, id) => {
    const x = F.shopItem(fm, grade, id);
    if (!x || x.locked || x.owned || x.blocked || fm.money < x.price) return null;
    fm.money -= x.price;
    fm.stats.spent += x.price;
    const [kind, arg] = id.split(':');
    if (kind === 'animal') { const i = fm.pens.findIndex((p) => !p.a); fm.pens[i] = { a: arg, g: 0, fed: false, ready: 0 }; }
    else if (kind === 'feed') fm.feed += +arg;
    else if (kind === 'bed') fm.beds.push({ c: null, g: 0 });
    else if (kind === 'pen') fm.pens.push({ a: null, g: 0, fed: false, ready: 0 });
    else if (kind === 'stand') fm.stand++;
    else if (kind === 'decor') fm.owned[arg] = true;
    else if (kind === 'work') fm.works[arg] = { r: null, g: 0, ready: 0, out: '' };
    else if (kind === 'bedup') fm.beds[+arg].u = (fm.beds[+arg].u || 0) + 1;
    else if (kind === 'penup') fm.pens[+arg].u = (fm.pens[+arg].u || 0) + 1;
    else if (kind === 'house') fm.yard[arg] = { a: arg, g: 0, fed: false, ready: 0, u: 0 };
    else if (kind === 'houseup') fm.yard[arg].u = (fm.yard[arg].u || 0) + 1;
    else if (kind === 'helper') fm.helper = { hired: true, on: true };
    else if (kind === 'acct') fm.bank.acct = (fm.bank.acct || 0) + 1;
    if (fm.goal === id) fm.goal = '';
    return x;
  };
  // Seed packets are bought from an empty bed.
  F.buySeed = (fm, grade, i, crop) => {
    const price = F.seedPrice(crop, grade);
    if (fm.money < price || fm.beds[i].c || F.CROPS[crop].lv > F.level(fm.xp).level) return false;
    fm.money -= price;
    fm.stats.spent += price;
    F.plant(fm, i, crop);
    return true;
  };
  // ---------------------------------------------------------------- workshops
  // What a recipe is worth: the inputs sold one by one, the thing made from them, and how much more that brings.
  F.worth = (r, grade) => {
    const inVal = U.sum(Object.entries(r.in).map(([id, n]) => n * F.price(id, grade)));
    const outVal = F.price(r.out, grade);
    return { inVal, outVal, gain: outVal - inVal };
  };
  F.canMake = (fm, work, i) => {
    const r = F.WORKS[work].recipes[i], w = fm.works[work];
    if (!w || w.r !== null || r.lv > F.level(fm.xp).level) return false;
    return Object.entries(r.in).every(([id, n]) => (fm.basket[id] || 0) >= n);
  };
  F.startMake = (fm, work, i) => {
    if (!F.canMake(fm, work, i)) return false;
    const r = F.WORKS[work].recipes[i];
    for (const [id, n] of Object.entries(r.in)) { fm.basket[id] -= n; if (!fm.basket[id]) delete fm.basket[id]; }
    Object.assign(fm.works[work], { r: i, g: 0 });
    return true;
  };
  F.takeMade = (fm, work) => {
    const w = fm.works[work];
    if (!w || !w.ready) return 0;
    const n = w.ready;
    fm.basket[w.out] = (fm.basket[w.out] || 0) + n;
    fm.stats.made += n;
    w.ready = 0;
    return n;
  };

  // ---------------------------------------------------------------- the bank
  // Money in the bank grows every bank week of 7 farm days: every 7th farm day (day 7, 14, 21 …) is bank day. In the
  // morning of bank day the bank looks at what is saved, and the interest on it waits until the child collects it at
  // the bank (working it out first). Interest comes in two steps, like a real savings account with tiers:
  //  - the big rate on savings up to the account's limit: 10¢ for every whole dollar in 2nd grade, 1¢ for every 10¢
  //    in kindergarten (10% a week, easy to work out);
  //  - the small rate on the rest: 1¢ for every whole dollar (1% a week), so big savings still grow, but slowly.
  // A better account (bought like any farm upgrade) raises the limit. At most 4 bank days wait to be collected.
  // bank = { bal, acct, log: [{ day, kind, amt }], pend: [{ day, bal }] } — acct: which account (F.ACCOUNTS),
  // pend: bank days waiting, with the morning balance.
  F.BANK_LV = 10;
  F.BANK_WEEK = 7;
  F.BANK_RULE = [[10, 1], [100, 10]]; // the big rate: [for every …, add …] for k, g2
  F.BANK_LOW = [100, 1]; // the small rate above the limit: 1¢ for every whole dollar (both grades)
  F.ACCOUNTS = [ // top: the big rate is paid on savings up to this (k, g2)
    { e: '🐷', name: 'Piggy account', lv: 10, cost: [0, 0], top: [500, 5000] },
    { e: '🥈', name: 'Silver account', lv: 18, cost: [40, 3000], top: [1000, 10000] },
    { e: '🥇', name: 'Gold account', lv: 27, cost: [60, 8000], top: [2000, 20000] },
    { e: '💎', name: 'Diamond account', lv: 41, cost: [80, 20000], top: [5000, 50000] },
    { e: '👑', name: 'Royal vault', lv: 56, cost: [99, 40000], top: [10000, 100000] },
  ];
  F.BANK_MISSED = 4;
  F.bankRule = (grade) => F.BANK_RULE[gi(grade)];
  F.account = (fm) => F.ACCOUNTS[(fm.bank && fm.bank.acct) || 0];
  F.bankTop = (acct, grade) => F.ACCOUNTS[acct || 0].top[gi(grade)];
  F.ruleText = (grade, acct = 0) => {
    const top = F.fmt(F.bankTop(acct, grade), grade);
    return grade === 'k'
      ? `The bank adds 1¢ for every 10¢ you save, up to ${top}. Above ${top} it adds 1¢ for every 100¢. Every bank week.`
      : `The bank adds 10¢ for every whole dollar you save, up to ${top}. Above ${top} it adds 1¢ for every whole dollar. Every bank week.`;
  };
  // This week's interest, in its two parts: big = how many dollars (k: tens of cents) earn the big rate,
  // small = how many whole dollars above the limit earn the small rate.
  F.interestParts = (bal, grade, acct = 0) => {
    const [per, add] = F.bankRule(grade), top = F.bankTop(acct, grade);
    const big = Math.floor(Math.min(bal, top) / per), small = Math.floor(Math.max(0, bal - top) / F.BANK_LOW[0]);
    return { top, per, add, big, small, x: big * add + small * F.BANK_LOW[1] };
  };
  F.interest = (bal, grade, acct = 0) => F.interestParts(bal, grade, acct).x;
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return U.dateKey(d); };
  F.addDays = addDays;
  const bankLog = (fm, kind, amt, day = fm.day) => { fm.bank.log.unshift({ day, kind, amt }); fm.bank.log.length = Math.min(fm.bank.log.length, 12); };
  F.isBankDay = (day) => day % F.BANK_WEEK === 0;
  // The farm days of this bank week (the last one is bank day).
  F.bankWeek = (day) => { const first = Math.floor((day - 1) / F.BANK_WEEK) * F.BANK_WEEK + 1; return U.range(first, first + F.BANK_WEEK - 1); };
  // Nights until the next bank day (on bank day itself: until the next one).
  F.nightsToBankDay = (day) => (Math.floor(day / F.BANK_WEEK) + 1) * F.BANK_WEEK - day;
  F.deposit = (fm, amt) => {
    if (!(amt > 0) || amt > fm.money) return false;
    fm.money -= amt;
    fm.bank.bal += amt;
    fm.stats.saved += amt;
    bankLog(fm, 'in', amt);
    return true;
  };
  F.withdraw = (fm, amt) => {
    if (!(amt > 0) || amt > fm.bank.bal) return false;
    fm.bank.bal -= amt;
    fm.money += amt;
    fm.stats.tookOut += amt;
    bankLog(fm, 'out', amt);
    return true;
  };
  // Called each morning (from F.nextDay): on bank day, note what is in the bank, counting interest still waiting.
  // The Big Dreams' buildings earn money that day too (inc: [[icon, name, amount], …]); it goes into the bank after
  // the interest.
  F.bankMorning = (fm, grade) => {
    if (!F.isBankDay(fm.day) || fm.bank.pend.length >= F.BANK_MISSED) return false; // at most 4 bank days wait
    // what will be in the bank once the bank days still waiting are paid (each earns on the one before)
    let bal = fm.bank.bal;
    for (const x of fm.bank.pend) { if (!x.paid) bal += F.interest(bal, grade, fm.bank.acct) * (x.piggy ? 2 : 1); bal += F.incomeOf(x); }
    const inc = F.dreamIncome(fm, grade);
    if (!bal && !inc.length) return false;
    const p = inc.length ? { day: fm.day, bal, inc } : { day: fm.day, bal };
    if (fm.charms && fm.charms.piggy) { p.piggy = { cost: fm.charms.piggy.cost }; delete fm.charms.piggy; } // the Golden Piggy doubles this one
    fm.bank.pend.push(p);
    return true;
  };
  F.bankDue = (fm) => fm.bank.pend.length;
  F.incomeOf = (p) => U.sum((p.inc || []).map((x) => x[2]));
  // Pay the interest of the oldest bank day waiting. Returns { day, bal, x, bonus, cost }: with the merchant's Golden
  // Piggy the bank pays it twice (bonus: the second time; cost: what the piggy cost). A bank day with buildings' income
  // waits for F.payIncome after its interest (paid: true).
  F.payInterest = (fm, grade) => {
    const p = fm.bank.pend[0];
    if (!p || p.paid) return null;
    const x = F.interest(p.bal, grade, fm.bank.acct), bonus = p.piggy ? x : 0;
    fm.bank.bal += x + bonus;
    fm.stats.interest += x + bonus;
    fm.stats.bankDays++;
    bankLog(fm, 'interest', x, p.day);
    if (p.piggy) { bankLog(fm, 'piggy', bonus, p.day); F.charmDone(fm, { cost: p.piggy.cost, gain: bonus }, grade); }
    if (p.inc && p.inc.length) p.paid = true;
    else fm.bank.pend.shift();
    return p.piggy ? { day: p.day, bal: p.bal, x, bonus, cost: p.piggy.cost } : { day: p.day, bal: p.bal, x };
  };
  // What the buildings earned on that bank day goes into the bank. Returns { day, x, inc }.
  F.payIncome = (fm) => {
    const p = fm.bank.pend[0];
    if (!p || !p.paid) return null;
    fm.bank.pend.shift();
    const x = F.incomeOf(p);
    fm.bank.bal += x;
    fm.stats.dreamIn += x;
    bankLog(fm, 'dream', x, p.day);
    return { day: p.day, x, inc: p.inc };
  };
  // All-time bank summary: what is in the bank now, split into the child's own money and interest
  // (interest counts as spent last, so taking money out uses up the child's own money first).
  F.bankSummary = (fm) => {
    const s = fm.stats, interest = Math.min(fm.bank.bal, s.interest);
    return { saved: s.saved, tookOut: s.tookOut, interest: s.interest, days: s.bankDays, bal: fm.bank.bal, own: fm.bank.bal - interest, fromInterest: interest, built: s.built || 0, dreamIn: s.dreamIn || 0, depBonus: s.depBonus || 0, locked: (fm.dep && fm.dep.amt) || 0 };
  };
  // ---------------------------------------------------------------- the locked deposit (2nd grade)
  // Savings above the account's limit earn only the small interest (1¢ a dollar). So once the savings first pass
  // the limit, the bank offers a locked deposit: move savings in $5 steps into it for 4 bank weeks, and for every $5
  // the bank gives back $6 (that is 5¢ a dollar a week: less than the big interest, much more than the small one).
  // It can't be taken out early, and there is one at a time. When it unlocks, the money goes back to the savings.
  F.DEPOSIT = { weeks: 4, step: 500, back: 600 };
  F.depositOn = (fm, grade) => grade !== 'k' && !!fm.dep && fm.dep.ok;
  // the offer opens the first time the savings are above the account's limit (returns true when it just opened)
  F.depositCheck = (fm, grade) => {
    if (grade === 'k' || !fm.dep || fm.dep.ok || !fm.bank || fm.bank.bal <= F.bankTop(fm.bank.acct, grade)) return false;
    fm.dep.ok = true;
    return true;
  };
  F.depositBack = (amt) => (amt / F.DEPOSIT.step) * F.DEPOSIT.back;
  // it unlocks on the 4th bank day after the day it is locked
  F.depositUntil = (day) => (Math.floor(day / F.BANK_WEEK) + F.DEPOSIT.weeks) * F.BANK_WEEK;
  F.depositReady = (fm) => !!fm.dep && fm.dep.amt > 0 && fm.day >= fm.dep.until;
  F.lockDeposit = (fm, grade, amt) => {
    if (!F.depositOn(fm, grade) || fm.dep.amt || !(amt > 0) || amt % F.DEPOSIT.step || amt > fm.bank.bal) return false;
    fm.bank.bal -= amt;
    Object.assign(fm.dep, { amt, until: F.depositUntil(fm.day) });
    bankLog(fm, 'lock', amt);
    return true;
  };
  // Returns { amt, back } and puts the money back into the savings, or null when it is still locked.
  F.collectDeposit = (fm) => {
    if (!F.depositReady(fm)) return null;
    const amt = fm.dep.amt, back = F.depositBack(amt);
    fm.bank.bal += back;
    fm.stats.depBonus += back - amt;
    Object.assign(fm.dep, { amt: 0, until: 0 });
    bankLog(fm, 'unlock', back);
    return { amt, back };
  };
  // How the savings would grow, bank week by bank week, without adding or taking out money.
  F.project = (bal, grade, weeks = 6, acct = 0) => { const out = [bal]; for (let i = 0; i < weeks; i++) out.push(out[i] + F.interest(out[i], grade, acct)); return out; };

  // ---------------------------------------------------------------- Big Dreams
  // Huge buildings to save up for, one after another: a fruit orchard, a guest cottage, a railway, a castle. Each is
  // built in stages. A stage is paid from the bank (a bank transfer to the builders, never from the wallet), the
  // builders work that night, and from then on the stage earns money every bank day (pay), straight into the bank.
  // An earning stage pays for itself in about 8 bank weeks (it earns a bit more than the bank's big interest, with no
  // limit, but the money is spent); after that it is all profit. The castle earns nothing:
  // it is the dream. Prices [k, g2] fit what a farm makes at the level it is usually reached (see the farm tests).
  F.DREAM_LV = F.BANK_LV;
  F.DREAMS = [
    { id: 'orchard', e: '🍎', name: 'Fruit Orchard', blurb: 'Plant fruit trees once, and sell fruit every bank week.', earns: 'fruit sales', stages: [
      { e: '🍎', name: 'Apple trees', cost: [100, 2500], pay: [12, 300] },
      { e: '🍐', name: 'Pear trees', cost: [150, 4000], pay: [18, 500] },
      { e: '🍑', name: 'Peach trees', cost: [200, 6000], pay: [24, 700] },
    ] },
    { id: 'cottage', e: '🏡', name: 'Guest Cottage', blurb: 'Build a cozy cottage. Visitors stay there and pay rent every bank week.', earns: 'rent', stages: [
      { e: '🧱', name: 'Stone floor', cost: [300, 8000], pay: [36, 1000] },
      { e: '🪟', name: 'Walls and windows', cost: [400, 12000], pay: [48, 1400] },
      { e: '🏠', name: 'Red roof', cost: [500, 16000], pay: [60, 1900] },
      { e: '🌷', name: 'Flower garden', cost: [600, 24000], pay: [72, 2900] },
    ] },
    { id: 'railway', e: '🚂', name: 'Farm Railway', blurb: 'A little train around the farm. Visitors buy tickets every bank week.', earns: 'train tickets', stages: [
      { e: '🛤️', name: 'Train tracks', cost: [800, 25000], pay: [96, 3000] },
      { e: '🚉', name: 'Station', cost: [1000, 40000], pay: [120, 4800] },
      { e: '🚂', name: 'Steam train', cost: [1200, 55000], pay: [144, 6600] },
      { e: '🌉', name: 'Bridge over the river', cost: [1400, 80000], pay: [168, 9600] },
    ] },
    { id: 'castle', e: '🏰', name: 'Castle on the Hill', blurb: 'The biggest dream of all: your very own castle. It earns nothing. It is just amazing.', earns: '', castle: true, stages: [
      { e: '🧱', name: 'Castle walls', cost: [1500, 80000], pay: [0, 0] },
      { e: '🗼', name: 'Two towers', cost: [1800, 100000], pay: [0, 0] },
      { e: '🚪', name: 'Gate and drawbridge', cost: [2100, 120000], pay: [0, 0] },
      { e: '🚩', name: 'Royal flags', cost: [2400, 140000], pay: [0, 0] },
      { e: '👑', name: 'Golden throne hall', cost: [2700, 160000], pay: [0, 0] },
    ] },
  ];
  F.dreamOpen = (fm) => F.level(fm.xp).level >= F.DREAM_LV;
  F.dreamDone = (fm) => fm.dream.p >= F.DREAMS.length; // every dream built
  F.dreamNow = (fm) => (F.dreamDone(fm) ? null : F.DREAMS[fm.dream.p]); // the dream being built
  // the next stage to pay for: { d, i, st, cost, pay } (null when every dream is built)
  F.dreamNext = (fm, grade) => {
    const d = F.dreamNow(fm);
    if (!d) return null;
    const st = d.stages[fm.dream.s];
    return { d, i: fm.dream.s, st, cost: st.cost[gi(grade)], pay: st.pay[gi(grade)] };
  };
  // how many stages of dream number k are built
  F.dreamBuilt = (fm, k) => (k < fm.dream.p ? F.DREAMS[k].stages.length : k === fm.dream.p ? fm.dream.s : 0);
  // What the buildings earn on a bank day, one line per dream: [[icon, name, amount], …]
  F.dreamIncome = (fm, grade) => {
    if (!fm.dream) return [];
    const out = [];
    F.DREAMS.forEach((d, k) => {
      const n = F.dreamBuilt(fm, k), x = U.sum(d.stages.slice(0, n).map((st) => st.pay[gi(grade)]));
      if (x) out.push([d.e, d.name, x]);
    });
    return out;
  };
  F.canBuild = (fm, grade) => { const n = F.dreamNext(fm, grade); return !!n && !fm.dream.b && F.dreamOpen(fm) && fm.bank.bal >= n.cost; };
  // Pay the builders from the bank. They build the stage tonight. Returns the stage paid for (or null).
  F.payBuilders = (fm, grade) => {
    if (!F.canBuild(fm, grade)) return null;
    const n = F.dreamNext(fm, grade);
    fm.bank.bal -= n.cost;
    fm.stats.built += n.cost;
    fm.dream.b = true;
    bankLog(fm, 'build', n.cost);
    return n;
  };
  // Night: the builders finish the stage. Returns { d, i, st, done } (done: the whole dream is finished) or null.
  F.buildOvernight = (fm) => {
    const dr = fm.dream;
    if (!dr || !dr.b) return null;
    const d = F.DREAMS[dr.p], i = dr.s;
    dr.b = false;
    dr.s++;
    const done = dr.s >= d.stages.length;
    if (done) { dr.p++; dr.s = 0; }
    return { d, i, st: d.stages[i], done };
  };
  // How many bank days until a stage has earned back its price.
  F.payback = (cost, pay) => (pay ? Math.ceil(cost / pay) : 0);

  // ---------------------------------------------------------------- the traveling merchant
  // Uncle Marco comes every 3rd bank week and stays its 7 farm days (so a bank day falls in his visit, and the child
  // can take savings out of the bank in time). He starts coming once the first Big Dream stage is built (so the new
  // things come one at a time), and then keeps coming. Every visit he brings two week charms: magic that works for 7
  // farm days, each visit a different pair, priced at about a third of what it brings a good farm (so it pays for
  // itself about three times over when it is used well). Every 2nd visit he also brings a rare treasure that stays on
  // the farm for good: expensive (3 to 5 bank weeks of what a good farm makes at its level), so it takes real saving.
  // If it isn't bought, he brings the same treasure again on his next treasure visit.
  F.MERCHANT = { e: '🧔', name: 'Uncle Marco', every: 3, rare: 2 };
  F.TREASURES = {
    goose: { e: '🪿', name: 'Golden Goose', lv: 10, cost: [95, 20000], gold: [3, 250], note: (fmt) => `Lays a golden egg every morning: +${fmt(F.TREASURES.goose.gold[1])} into your wallet. No feed needed.`, noteK: (fmt) => `Lays a golden egg every morning: +${fmt(F.TREASURES.goose.gold[0])} into your wallet. No feed needed.` },
    can: { e: '🪣', name: 'Magic Watering Can', lv: 12, cost: [95, 25000], note: () => 'Every garden bed gives 1 more crop at every harvest.' },
    musician: { e: '🎻', name: 'Street Musician', lv: 12, cost: [90, 20000], tip: 0.1, note: () => 'Plays music at your stand: customers tip 10% more for right answers, on any stand.' },
    fairy: { e: '🧚', name: 'Feed Fairy', lv: 14, cost: [90, 25000], feeds: 2, note: () => 'Every night she feeds two hungry pens for free.' },
    sheep: { e: '🐑', name: 'Rainbow Sheep', lv: 16, cost: [99, 35000], note: () => 'Gives a ball of rainbow wool every morning, to sell at your stand. No feed needed.' },
  };
  F.treasureNote = (id, grade, fmt) => { const t = F.TREASURES[id]; return (grade === 'k' && t.noteK ? t.noteK : t.note)(fmt); };
  // Week charms. myth: the animals of one kind become mythic (F.MYTHS); clover: bigger tips; sun: double harvests;
  // piggy: the next bank day pays double interest.
  F.CHARM_NIGHTS = 7;
  F.CHARMS = {
    myth: { e: '🌟', name: 'Mythic Feed' },
    clover: { e: '🍀', name: 'Lucky Clover', tip: 0.2 },
    sun: { e: '☀️', name: 'Sunshine Potion' },
    piggy: { e: '🐷', name: 'Golden Piggy' },
  };
  F.CHARM_PAIRS = [['myth', 'clover'], ['sun', 'piggy'], ['myth', 'sun'], ['clover', 'piggy'], ['myth', 'piggy'], ['sun', 'clover']];
  F.charmName = (id, a) => (id === 'myth' && a ? `Mythic Feed for ${F.MYTHS[a].of}` : F.CHARMS[id].name);
  F.charmNote = (id, grade, fmt, a) => {
    const N = F.CHARM_NIGHTS;
    if (id === 'myth') {
      const M = F.MYTHS[a], it = F.ITEMS[M.item], was = F.ITEMS[F.ANIMALS[a].item];
      return `For ${N} nights your ${M.of} become ${M.many}! They make ${it.many} instead of ${was.many}: ${fmt(F.price(M.item, grade))} each, not ${fmt(F.price(F.ANIMALS[a].item, grade))}. Feed them every day!`;
    }
    if (id === 'clover') return `For ${N} days customers tip ${Math.round(F.CHARMS.clover.tip * 100)}% more for first-try right answers, on any stand.`;
    if (id === 'sun') return `For ${N} days every harvest gives twice as many crops.`;
    return 'On the next bank day the bank pays your interest twice!';
  };
  // What a good farm at level L makes in a farm day, in cents: crops (the best crop in every open bed, with half the
  // bed upgrades), animals (the best animals in the open pens, with room for more), total.
  F.goodDay = (L, grade) => {
    const g = gi(grade), beds = F.BEDS.filter((b) => b[0] <= L).length, pens = F.PENS.filter((p) => p[0] <= L).length;
    const bed = { u: Math.floor(F.BED_UP.filter((u) => u.lv <= L).length / 2) };
    let best = 0;
    for (const [id, c] of Object.entries(F.CROPS)) if (c.lv <= L) { bed.c = id; best = Math.max(best, (F.cropYield(bed) * F.price(id, grade) - c.seed[g]) / F.cropDays(bed)); }
    const room = 1 + F.PEN_UP.filter((x, i) => i < 2 && x.lv <= L).length;
    const animals = U.sum(Object.values(F.ANIMALS).filter((a) => a.lv <= L).map((a) => (a.per * F.price(a.item, grade) - a.eat * F.FEED.price[g]) * room).sort((a, b) => b - a).slice(0, pens));
    return { crops: beds * best, animals, total: beds * best + animals };
  };
  // What a charm brings in its week (cents): Mythic Feed from this farm's pens of kind a; Lucky Clover and the
  // Sunshine Potion on a good farm at this level; the Golden Piggy at most (the big interest on a full account).
  F.charmGain = (id, fm, grade, a) => {
    const N = F.CHARM_NIGHTS, d = F.goodDay(F.level(fm.xp).level, grade);
    if (id === 'myth') return N * (F.price(F.MYTHS[a].item, grade) - F.price(F.ANIMALS[a].item, grade)) * U.sum(F.allPens(fm).filter((p) => p.a === a).map(F.penMakes));
    if (id === 'clover') return Math.round(N * d.total * F.CHARMS.clover.tip);
    if (id === 'sun') return Math.round(N * d.crops);
    const top = F.bankTop(fm.bank.acct, grade);
    return F.interest(top, grade, fm.bank.acct);
  };
  // about a third of what it brings: whole dollars (kindergarten: 5¢ steps, paid with coins, at most 95¢)
  F.charmCost = (id, fm, grade, a) => {
    const x = F.charmGain(id, fm, grade, a) / 3;
    return grade === 'k' ? Math.max(5, Math.min(95, Math.round(x / 5) * 5)) : Math.max(100, Math.round(x / 100) * 100);
  };
  F.charmOn = (fm, id) => { const c = fm.charms && fm.charms[id]; return !!c && (id === 'piggy' || fm.day < c.until); };
  F.mythOn = (fm, a) => F.charmOn(fm, 'myth') && fm.charms.myth.a === a;
  // what a charm has brought so far (the Sunshine Potion counts the extra crops at their price)
  F.charmGot = (c, grade) => (c.gain || 0) + U.sum(Object.entries(c.extra || {}).map(([id, n]) => n * F.price(id, grade)));
  F.charmDone = (fm, c, grade) => {
    const got = F.charmGot(c, grade);
    fm.stats.charmGain += got;
    if (got > c.cost) fm.stats.charmWins++;
    return got;
  };
  // The morning a charm's week is over it stops. Returns what it brought, for the morning card: [{ id, a, cost, got }].
  F.charmsMorning = (fm, grade) => {
    const out = [];
    for (const id of Object.keys(fm.charms || {})) {
      const c = fm.charms[id];
      if (id === 'piggy' || fm.day < c.until) continue;
      delete fm.charms[id];
      out.push({ id, a: c.a, cost: c.cost, got: F.charmDone(fm, c, grade) });
    }
    return out;
  };
  F.bankWeekNo = (day) => Math.ceil(day / F.BANK_WEEK);
  F.merchantOn = (fm) => !!fm.dream && (fm.dream.p > 0 || fm.dream.s > 0) && F.dreamOpen(fm);
  // his visit, while he is here (null when he isn't)
  F.merchantHere = (fm) => { const m = fm.merchant; return m && m.week === F.bankWeekNo(fm.day) ? m : null; };
  // what he still has for sale on a visit: { item: the rare treasure or null, charms: [ids] }
  const wares = (fm, m) => ({ item: m.item && !(fm.treasure || {})[m.item] ? m.item : null, charms: (m.charms || []).filter((c) => !(m.got || {})[c]) });
  F.merchantWares = (fm) => { const m = F.merchantHere(fm); return m ? wares(fm, m) : { item: null, charms: [] }; };
  // the rare treasure he has for sale today (null when he isn't here, it isn't a treasure visit, or it was bought)
  F.merchantNow = (fm) => F.merchantWares(fm).item;
  F.merchantHas = (fm) => { const w = F.merchantWares(fm); return !!w.item || w.charms.length > 0; };
  F.merchantNights = (day) => F.bankWeekNo(day) * F.BANK_WEEK - day; // nights left (0: he leaves tonight)
  // The rare treasure he brings: the one the child is saving for, or else the first one not bought yet that fits the
  // farm level (null: none left).
  F.nextTreasure = (fm) => {
    const L = F.level(fm.xp).level, ok = (t) => !!F.TREASURES[t] && !(fm.treasure || {})[t] && F.TREASURES[t].lv <= L;
    const goal = (fm.goal || '').startsWith('treasure:') ? fm.goal.slice(9) : '';
    return ok(goal) ? goal : Object.keys(F.TREASURES).find(ok) || null;
  };
  // A new visit (number n, in bank week w): the treasure on every 2nd visit, two charms, their prices for this farm.
  // Mythic Feed is for a kind of animal on the farm (grown-ups first), a different kind each time.
  F.merchantVisit = (fm, grade, w, n) => {
    const item = n % F.MERCHANT.rare === 1 ? F.nextTreasure(fm) : null;
    const has = Object.keys(F.MYTHS).filter((a) => F.allPens(fm).some((p) => p.a === a));
    const grown = has.filter((a) => F.allPens(fm).some((p) => p.a === a && F.animalStage(p) === 2));
    const kinds = (grown.length ? grown : has).sort((x, y) => F.charmGain('myth', fm, grade, y) - F.charmGain('myth', fm, grade, x));
    const a = kinds.length ? kinds[Math.floor(n / 2) % kinds.length] : null;
    let charms = F.CHARM_PAIRS[(n - 1) % F.CHARM_PAIRS.length];
    if (!a) charms = charms.map((c) => (c === 'myth' ? ['sun', 'clover', 'piggy'].find((x) => !charms.includes(x)) : c));
    const cost = {};
    for (const c of charms) cost[c] = F.charmCost(c, fm, grade, a);
    return { week: w, n, item, charms, a: charms.includes('myth') ? a : null, cost, got: {} };
  };
  // Each morning: he arrives on the first morning of his bank week, says goodbye on his last day (if something is
  // still for sale), and the morning after he left. Returns ['came' | 'last' | 'left', visit] for the morning card, or null.
  F.merchantMorning = (fm, grade) => {
    const w = F.bankWeekNo(fm.day), m = fm.merchant;
    if (w % F.MERCHANT.every === 0 && F.merchantOn(fm) && (!m || m.week !== w)) {
      fm.merchant = F.merchantVisit(fm, grade, w, (m ? m.n || 1 : 0) + 1);
      return ['came', fm.merchant];
    }
    if (!m) return null;
    const left = wares(fm, m);
    if (!left.item && !left.charms.length) return null;
    if (m.week === w && F.merchantNights(fm.day) === 0) return ['last', m];
    if (m.week === w - 1 && F.isBankDay(fm.day - 1)) return ['left', m];
    return null;
  };
  // The farm day he comes next (with a treasure: on his next treasure visit), counting from today.
  F.merchantNext = (fm, rare = false) => {
    const E = F.MERCHANT.every, m = fm.merchant;
    let w = (Math.floor(F.bankWeekNo(fm.day) / E) + 1) * E, n = (m ? m.n || 1 : 0) + 1;
    if (rare) while (n % F.MERCHANT.rare !== 1) { w += E; n++; }
    return (w - 1) * F.BANK_WEEK + 1;
  };
  F.buyTreasure = (fm, grade) => {
    const id = F.merchantNow(fm), t = id && F.TREASURES[id], cost = t && t.cost[gi(grade)];
    if (!t || fm.money < cost) return null;
    fm.money -= cost;
    fm.stats.spent += cost;
    fm.treasure[id] = true;
    if (fm.goal === 'treasure:' + id) fm.goal = '';
    return Object.assign({ id, cost }, t);
  };
  // Buy a week charm: it starts working now, for 7 farm days (the Golden Piggy: on the next bank day, or on today's
  // if today is bank day and its interest isn't collected yet). Returns { id, cost, … } or null.
  F.buyCharm = (fm, grade, id) => {
    const m = F.merchantHere(fm), cost = m && m.cost && m.cost[id];
    if (!m || !F.merchantWares(fm).charms.includes(id) || !(cost > 0) || fm.money < cost) return null;
    fm.money -= cost;
    fm.stats.spent += cost;
    fm.stats.charms++;
    fm.stats.charmCost += cost;
    m.got = Object.assign({}, m.got, { [id]: true });
    if (id === 'piggy') {
      const today = fm.bank.pend.find((p) => p.day === fm.day && !p.paid);
      if (today && !today.piggy) today.piggy = { cost };
      else fm.charms.piggy = { cost };
    } else fm.charms[id] = Object.assign({ cost, until: fm.day + F.CHARM_NIGHTS, gain: 0 }, id === 'myth' ? { a: m.a } : {});
    return Object.assign({ id, cost, a: id === 'myth' ? m.a : null }, F.CHARMS[id]);
  };
  // Is the Golden Piggy waiting for a bank day (bought, interest not paid yet)?
  F.piggyWaiting = (fm) => !!(fm.charms && fm.charms.piggy) || fm.bank.pend.some((p) => p.piggy);
  // How much to put aside each day to buy it before he leaves: today and every day left, in whole dollars (k: cents).
  F.perDayToSave = (need, nights, grade) => { const days = nights + 1, x = Math.ceil(need / days); return grade === 'k' ? x : Math.ceil(x / 100) * 100; };

  // ---------------------------------------------------------------- the order board
  // From farm level 5, people in town order things from the farm: "6 eggs and 2 glasses of milk by farm day 12".
  // The board holds up to 3 orders, and a new one comes each morning when there is room. An order is made only of
  // things this farm can make now (crops open at its level, the grown-up animals in its pens, its workshops, with
  // what they need), in amounts it can make before the order ends: the nights it takes, plus 2 to spare (kindergarten 3). An order
  // pays half as much again as the same things bring at the stand; every 4th one is a ⭐ big order from a special
  // guest that pays double. What the orders need is kept in the basket (customers at the stand don't buy it), so
  // the child collects for an order on purpose. Nothing is lost when an order ends or is turned down: a new one comes.
  // orders = { seen, n: orders so far, list: [{ n, who, why, items: { item: count }, stand, pay, end (its last farm day), big }] }
  F.ORDERS_LV = 5;
  F.ORDER_SLOTS = 3;
  F.ORDER_BIG = 4; // every 4th order is a big one
  F.ORDER_SPARE = [3, 2]; // nights to spare (kindergarten: one more)
  F.ORDER_MAX = 5; // nights of work at most (a big order: one more)
  F.ORDER_WHY = ['for a picnic', 'for a birthday party', 'for the school lunch', 'for their café', 'for a family dinner', 'for a camping trip', 'for a bake sale', 'for a pajama party', 'for a soccer team snack'];
  F.ORDER_WHY_BIG = ['for the town fair', 'for a royal party', 'for the big parade', 'for a wedding feast', 'for the harvest festival'];
  F.ordersOpen = (fm) => F.level(fm.xp).level >= F.ORDERS_LV;
  // An order pays the stand price and half as much again (a big order: twice the stand price); 2nd grade in 5¢ steps.
  F.orderPay = (stand, big, grade) => { const x = stand * (big ? 2 : 1.5); return grade === 'k' ? Math.ceil(x) : Math.ceil(x / 5) * 5; };
  F.standValue = (items, grade) => U.sum(Object.entries(items).map(([id, n]) => n * F.price(id, grade)));
  // The most an order pays: the money of the hardest money problems open at this level (so the numbers are ones the
  // child works with: 20¢ in kindergarten at level 5, $5 in 2nd grade at level 6 …).
  F.orderCap = (fm, grade) => Math.max(...F.tiers(grade).filter((t) => t.lv <= F.level(fm.xp).level).map((t) => t.max));
  // What this farm can make for an order. per: how many one garden bed (with the farm's poorest soil) or all the pens
  // of a kind make; days: nights for one batch; made things need a workshop, and their inputs must come from this farm.
  F.orderGoods = (fm) => {
    const L = F.level(fm.xp).level, stars = Math.min(...fm.beds.map(F.bedStars)), out = {};
    for (const [id, c] of Object.entries(F.CROPS)) if (c.lv <= L) out[id] = { id, kind: 'crop', per: c.yield + stars, days: c.days };
    F.allPens(fm).forEach((p) => {
      if (!p.a || F.animalStage(p) < 2) return;
      const id = F.ANIMALS[p.a].item;
      out[id] = out[id] ? Object.assign(out[id], { per: out[id].per + F.penMakes(p) }) : { id, kind: 'animal', a: p.a, per: F.penMakes(p), days: 1 };
    });
    for (const [w, W] of Object.entries(F.WORKS)) {
      if (!(fm.works || {})[w]) continue;
      for (const r of W.recipes) if (r.lv <= L && Object.keys(r.in).every((id) => out[id] && out[id].kind !== 'made')) out[r.out] = { id: r.out, kind: 'made', work: w, r, per: 1, days: r.days };
    }
    return out;
  };
  // Nights this farm needs to make everything in an order, starting with an empty basket: the crops (and the crops
  // the workshops need) planted in all the beds at once, round after round; the animals' things day after day; then
  // each workshop's batches one after another.
  F.orderNights = (fm, items) => {
    const goods = F.orderGoods(fm), need = {};
    let made = 0;
    const work = {};
    for (const [id, n] of Object.entries(items)) {
      const x = goods[id];
      if (!x) return Infinity;
      if (x.kind !== 'made') { need[id] = (need[id] || 0) + n; continue; }
      work[x.work] = (work[x.work] || 0) + n * x.days;
      for (const [i, k] of Object.entries(x.r.in)) need[i] = (need[i] || 0) + n * k;
    }
    made = Math.max(0, ...Object.values(work));
    let beds = 0, days = 0, animals = 0;
    for (const [id, n] of Object.entries(need)) {
      const x = goods[id];
      if (x.kind === 'crop') { beds += Math.ceil(n / x.per); days = Math.max(days, x.days); } else animals = Math.max(animals, Math.ceil(n / x.per));
    }
    return Math.max(beds ? Math.ceil(beds / fm.beds.length) * days : 0, animals) + made;
  };
  // A new order (number n): one or two kinds of things (kindergarten: one; a big order: two or three), at most the cap.
  F.makeOrder = (fm, grade, n) => {
    const k = grade === 'k', big = n % F.ORDER_BIG === 0, goods = Object.values(F.orderGoods(fm));
    const busy = new Set(((fm.orders && fm.orders.list) || []).flatMap((o) => Object.keys(o.items))); // a different thing from the other orders
    const pool = (kind) => { const all = goods.filter((x) => x.kind === kind), free = all.filter((x) => !busy.has(x.id)); return free.length ? free : all; };
    const kinds = big ? (k ? 2 : U.rnd(2, 3)) : k ? 1 : U.rnd(1, 2);
    const items = {};
    for (let i = 0; i < kinds; i++) {
      // crops, the animals' things and workshop goods, each often enough to show up
      const roll = Math.random(), kind = roll < 0.4 ? 'crop' : roll < (k ? 0.85 : 0.75) ? 'animal' : 'made';
      const list = pool(kind).filter((x) => !items[x.id]), x = U.pick(list.length ? list : goods.filter((g) => !items[g.id]));
      if (!x) break;
      // a bed's harvest or two (big: two or three); the animals' things of two or three days (big: three or four)
      items[x.id] = x.kind === 'made' ? (big ? 2 : 1) : x.per * (x.kind === 'crop' ? (big ? U.rnd(2, 3) : U.rnd(1, 2)) : big ? U.rnd(3, 4) : U.rnd(2, 3));
    }
    // not more than the cap: take one off the thing worth the most, until it fits
    const cap = F.orderCap(fm, grade);
    while (Object.keys(items).length && F.orderPay(F.standValue(items, grade), big, grade) > cap) {
      const id = Object.keys(items).sort((a, b) => items[b] * F.price(b, grade) - items[a] * F.price(a, grade))[0];
      if (--items[id] <= 0) delete items[id];
    }
    // and not too long to wait for: at most 5 nights of work (a big order 6), taking off the most first
    const goodsOf = F.orderGoods(fm);
    while (Object.keys(items).length > 1 && F.orderNights(fm, items) > F.ORDER_MAX + (big ? 1 : 0)) {
      const id = Object.keys(items).sort((a, b) => F.orderNights(fm, { [b]: items[b] }) - F.orderNights(fm, { [a]: items[a] }) || items[b] - items[a])[0];
      items[id] -= goodsOf[id].per;
      if (items[id] <= 0) delete items[id];
    }
    if (!Object.keys(items).length) items.carrot = Math.max(1, Math.floor(cap / F.orderPay(F.price('carrot', grade), big, grade)));
    const stand = F.standValue(items, grade), used = new Set(((fm.orders && fm.orders.list) || []).map((o) => o.who[1]));
    const who = U.pick((big ? F.VIPS : F.PEOPLE).filter((x) => !used.has(x[1])));
    return { n, who, why: U.pick(big ? F.ORDER_WHY_BIG : F.ORDER_WHY), items, stand, pay: F.orderPay(stand, big, grade), end: fm.day + Math.max(3, F.orderNights(fm, items) + F.ORDER_SPARE[gi(grade)]), big };
  };
  F.addOrder = (fm, grade) => {
    fm.orders.n++;
    const o = F.makeOrder(fm, grade, fm.orders.n);
    fm.orders.list.push(o);
    return o;
  };
  // The first time the board opens: two orders to start with.
  F.ordersStart = (fm, grade) => {
    fm.orders.seen = true;
    while (fm.orders.list.length < 2) F.addOrder(fm, grade);
  };
  // What the orders keep in the basket, order by order (the first order first): [{ o, have: { item: count }, ready }].
  F.orderStatus = (fm) => {
    const left = Object.assign({}, fm.basket);
    return ((fm.orders && fm.orders.list) || []).map((o) => {
      const have = {};
      for (const [id, n] of Object.entries(o.items)) { have[id] = Math.min(n, left[id] || 0); left[id] = (left[id] || 0) - have[id]; }
      return { o, have, ready: Object.entries(o.items).every(([id, n]) => have[id] >= n) };
    });
  };
  F.kept = (fm) => { const out = {}; for (const s of F.orderStatus(fm)) for (const [id, n] of Object.entries(s.have)) if (n) out[id] = (out[id] || 0) + n; return out; };
  // What customers at the stand (and the market truck) may buy: the basket without what the orders keep.
  F.forSale = (fm) => { const kept = F.kept(fm), out = {}; for (const [id, n] of Object.entries(fm.basket)) if (n - (kept[id] || 0) > 0) out[id] = n - (kept[id] || 0); return out; };
  F.saleCount = (fm) => U.sum(Object.values(F.forSale(fm)));
  F.ordersReady = (fm) => F.orderStatus(fm).filter((s) => s.ready).map((s) => s.o);
  F.orderXp = (o) => 5 + 3 * Object.keys(o.items).length + (o.big ? 5 : 0);
  // Deliver an order: its things leave the basket, it pays. Returns the order (null when it isn't ready).
  F.deliver = (fm, n) => {
    const s = F.orderStatus(fm).find((x) => x.o.n === n);
    if (!s || !s.ready) return null;
    const o = s.o;
    for (const [id, q] of Object.entries(o.items)) { fm.basket[id] -= q; if (!fm.basket[id]) delete fm.basket[id]; fm.stats.sold += q; }
    fm.money += o.pay;
    fm.stats.earned += o.pay;
    fm.stats.orders = (fm.stats.orders || 0) + 1;
    fm.stats.orderPay = (fm.stats.orderPay || 0) + o.pay;
    fm.stats.orderExtra = (fm.stats.orderExtra || 0) + o.pay - o.stand;
    fm.orders.list = fm.orders.list.filter((x) => x !== o);
    return o;
  };
  // "No, thank you": the order is gone; a new one comes in the morning.
  F.dropOrder = (fm, n) => { const before = fm.orders.list.length; fm.orders.list = fm.orders.list.filter((o) => o.n !== n); return fm.orders.list.length < before; };
  // Each morning (from F.nextDay): orders whose last day was yesterday end, and a new one comes if there is room.
  // Returns { gone, added, last (orders on their last day) } for the morning card, or null when the board isn't open.
  F.ordersMorning = (fm, grade) => {
    if (!fm.orders || !F.ordersOpen(fm)) return null;
    const gone = fm.orders.list.filter((o) => o.end < fm.day);
    fm.orders.list = fm.orders.list.filter((o) => o.end >= fm.day);
    const added = fm.orders.list.length < F.ORDER_SLOTS ? F.addOrder(fm, grade) : null;
    return { gone, added, last: fm.orders.list.filter((o) => o.end === fm.day && o !== added) };
  };
  // The question when an order is delivered. Kindergarten and the first two tiers count the money it pays with;
  // from the third tier: how much more does the order pay than the stand?
  F.orderQuestion = (o, grade, tierNo) => {
    const fmt = (c) => F.fmt(c, grade), ts = F.tiers(grade);
    const what = Object.entries(o.items).map(([id, n]) => things(id, n)).join(' and ');
    const tags = `<div class="ftags">${Object.entries(o.items).map(([id, n]) => `<span class="ftag">${n} × ${F.ie(id)} ${fmt(F.price(id, grade))}</span>`).join('')}</div>`;
    const base = { type: 'order', who: o.who, sale: {}, total: 0 };
    if (tierNo < 3) {
      const t = ts.find((x) => x.max >= o.pay) || ts[ts.length - 1];
      const coins = F.coinsFor(o.pay, t.coins) || F.fewest(o.pay, t.coins);
      return ask(Object.assign(base, { text: `takes the order: <b>${what}</b>, and pays with these. How much money is it?`, visual: MQ.V.coins(coins, grade === 'k' || tierNo === 1), hint: 'Start with the money worth the most, then count on.', explain: `${coins.map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(o.pay)}` }), o.pay, grade);
    }
    const more = o.pay - o.stand;
    const p = Object.assign(base, { text: `takes the order: <b>${what}</b>, and pays <b>${fmt(o.pay)}</b>. At your stand the same things bring <b>${fmt(o.stand)}</b>. How much <b>more</b> does the order pay?`, visual: tags + `<div class="ftags"><span class="ftag">🏪 ${fmt(o.stand)}</span><b>→</b><span class="ftag">📋 ${fmt(o.pay)}</span></div>`, hint: `Count up from ${fmt(o.stand)} to ${fmt(o.pay)}.`, explain: `${fmt(o.pay)} − ${fmt(o.stand)} = ${fmt(more)}` });
    return grade === 'k' || more < 100 ? Object.assign(p, { kind: 'num', answer: more, unit: '¢' }) : Object.assign(p, { kind: 'choice', answer: fmt(more), choices: F.moneyChoices(more, grade, [o.pay + o.stand, o.stand, o.pay]) });
  };

  // ---------------------------------------------------------------- grown-up preview
  // The farm of a level-60 farmer, to look around in the grown-up preview (a copy of the profile; nothing is saved):
  // everything open and owned, plenty of money, crops and animals at every stage, a full basket, a bank day waiting.
  F.showcase = (st) => {
    const fm = F.ensure(st), g = st.grade, k = g === 'k';
    let xp = 0;
    for (let L = 1; L < 60; L++) xp += F.need(L);
    Object.assign(fm, {
      xp, money: k ? 5000 : 100000, feed: 200, stand: F.STANDS.length - 1, tier: F.tiers(g).length, goal: '',
      beds: ['carrot', 'tomato', 'corn', 'pumpkin', 'strawberry', 'pineapple'].map((c, i) => ({ c, u: [0, 1, 2, 3, 5, 6][i], g: i % 2 ? 0 : 9 })),
      pens: ['chicken', 'cow', 'bees', 'fishpond', 'sheep', 'unicorn'].map((a, i) => ({ a, g: i === 5 ? 0 : 9, fed: i % 3 === 0, ready: i % 2 ? 3 : 0, u: i % 4 })),
      basket: {}, owned: {}, works: {}, yard: {},
      helper: { hired: true, on: false },
      day: 14,
      bank: { bal: k ? 1234 : 12345, acct: 1, log: [], pend: [{ day: 14, bal: k ? 1234 : 12345 }] }, // above the Silver limit: both rates
      dream: { p: 2, s: 2, b: false, seen: true }, // the orchard and the cottage built, the railway half done
      treasure: { goose: true, can: true, musician: true }, // three of the merchant's treasures
      dep: k ? { ok: false, amt: 0, until: 0 } : { ok: true, amt: 2000, until: 28 }, // and a locked deposit (2nd grade)
    });
    Object.assign(fm.stats, k ? { saved: 1100, tookOut: 100, interest: 234, bankDays: 9 } : { saved: 11000, tookOut: 1000, interest: 2345, bankDays: 9 }); // adds up to the bank above
    // the merchant is visiting (farm day 14 is the last day of bank week 2) with a treasure and two charms; two charms work
    fm.merchant = F.merchantVisit(fm, g, 2, 3);
    fm.charms = { clover: { cost: k ? 30 : 900, until: 18, gain: k ? 12 : 640 }, myth: { a: 'cow', cost: k ? 60 : 2400, until: 17, gain: k ? 33 : 1750 } };
    fm.pens[1].rare = 2;
    // the whole barnyard: babies, hungry, fed and with eggs to collect
    Object.keys(F.HOUSES).forEach((a, i) => { fm.yard[a] = { a, g: i === 4 ? 0 : 9, fed: i % 2 === 0, ready: i % 3 === 1 ? 2 : 0, u: i % 3 }; });
    for (const id of Object.keys(F.ITEMS)) fm.basket[id] = 3;
    // three orders on the board: one ready to deliver, a ⭐ big one, and one more
    fm.orders = { seen: true, n: 0, list: [] };
    const o = F.addOrder(fm, g);
    o.items = { egg: 2, honey: 1 };
    Object.assign(o, { stand: F.standValue(o.items, g), end: fm.day + 3 });
    o.pay = F.orderPay(o.stand, o.big, g);
    fm.orders.n = F.ORDER_BIG - 1;
    F.addOrder(fm, g);
    F.addOrder(fm, g);
    for (const id of Object.keys(F.DECOR)) fm.owned[id] = true;
    Object.keys(F.WORKS).forEach((id, i) => { fm.works[id] = i % 2 ? { r: null, g: 0, ready: 1, out: F.WORKS[id].recipes[0].out } : { r: null, g: 0, ready: 0, out: '' }; });
    return fm;
  };

  // The saving goal: something in the shop, or a rare treasure from the merchant ('treasure:goose').
  F.goalItem = (fm, grade) => {
    if (!fm.goal) return null;
    if (!fm.goal.startsWith('treasure:')) return F.shopItem(fm, grade, fm.goal);
    const id = fm.goal.slice(9), t = F.TREASURES[id];
    return t && !(fm.treasure || {})[id] ? { id: fm.goal, e: t.e, name: t.name, price: t.cost[gi(grade)], lv: t.lv, treasure: id } : null;
  };

  // ---------------------------------------------------------------- XP
  // Returns the levels reached (empty when none), after paying each level's gift.
  F.addXp = (fm, n, grade) => {
    const before = F.level(fm.xp).level;
    fm.xp += n;
    const after = F.level(fm.xp).level, ups = [];
    for (let L = before + 1; L <= after; L++) { fm.money += F.gift(L, grade); ups.push(L); }
    return ups;
  };
  // Adaptive tier: 4 first-try right in a row → one tier up (if open), 2 misses → down.
  F.adapt = (fm, grade, firstTry) => {
    if (firstTry) { fm.streak++; fm.miss = 0; } else { fm.miss++; fm.streak = 0; }
    const open = F.tierOpen(fm, grade);
    if (fm.streak >= 4 && fm.tier < open) { fm.tier++; fm.streak = 0; return 'up'; }
    if (fm.miss >= 2 && fm.tier > 1) { fm.tier--; fm.miss = 0; return 'down'; }
    if (fm.tier > open) fm.tier = open;
    return null;
  };
  // Every money problem counts in the child's daily totals (daily goal, My Progress).
  F.record = (st, firstTry) => {
    const day = U.dateKey(), dd = (st.days[day] = st.days[day] || { a: 0, c: 0 });
    dd.a++;
    st.stats.attempts++;
    if (firstTry) { dd.c++; st.stats.correct++; }
    st.lastPlayed = day;
  };

  // ---------------------------------------------------------------- customers & problems
  F.PEOPLE = [['🐻', 'Bruno'], ['🐰', 'Hazel'], ['🦊', 'Felix'], ['🐼', 'Mei'], ['🦉', 'Olive'], ['🐸', 'Ribbit'], ['🐨', 'Kip'], ['🐯', 'Tess'], ['🐹', 'Peanut'], ['🦔', 'Spike'], ['🐧', 'Pablo'], ['🦝', 'Rocky'], ['🐿️', 'Nutmeg'], ['🦌', 'Fern'], ['🐭', 'Pip'], ['🦫', 'Bucky']];
  F.VIPS = [['🦁', 'Mayor Leo'], ['🦄', 'Princess Luna'], ['🐘', 'Chef Ellie'], ['🦒', 'Professor Gigi'], ['🐳', 'Captain Blue']];
  const plural = (id, n) => (n === 1 ? F.ITEMS[id].name : F.ITEMS[id].many);
  const things = (id, n) => `${n} ${F.ie(id)} ${plural(id, n)}`;
  // Choices for an amount of money: the answer and near misses (a coin off, a dime off, a dollar off).
  // traps: wrong answers a child is likely to give (tried first), then amounts near the answer
  F.moneyChoices = (ans, grade, traps = []) => {
    const near = [ans + 10, ans - 10, ans + 5, ans - 5, ans + 25, ans - 25, ans + 100, ans - 100, ans + 1, ans - 1].filter((x) => x > 0 && x !== ans);
    const picks = new Set([ans]);
    for (const x of traps) if (x > 0 && picks.size < 4) picks.add(x);
    for (const x of U.shuffle(near)) { if (picks.size >= 4) break; picks.add(x); }
    return U.shuffle([...picks]).map((x) => F.fmt(x, grade));
  };
  // Number pad for amounts in cents under a dollar; buttons for dollar amounts (typing $3.45 is hard on a pad).
  function ask(p, ans, grade) {
    if (grade === 'k' || ans < 100) return Object.assign(p, { kind: 'num', answer: ans, unit: '¢' });
    const choices = F.moneyChoices(ans, grade);
    return Object.assign(p, { kind: 'choice', answer: F.fmt(ans, grade), choices });
  }
  const tag = (id, grade) => `<span class="ftag">${F.ie(id)} ${F.fmt(F.price(id, grade), grade)}</span>`;
  const row = (id, n) => `<div class="frow" aria-hidden="true">${Array(Math.min(n, 12)).fill(F.ie(id)).join('')}</div>`;

  // One problem. ctx: { grade, tier (object), stock: { item: count } }. Returns null when the stock can't make it.
  // Every problem has: kind (num | choice | coins), text, answer, hint, explain, sale { item: count } and total (cents
  // the customer pays for the sale).
  F.problem = (type, ctx) => {
    const { grade, tier, stock } = ctx;
    const fmt = (c) => F.fmt(c, grade);
    const items = Object.keys(stock).filter((id) => stock[id] > 0);
    const P = (id) => F.price(id, grade);
    // an item and how many, with the total at most `max`
    const pickSale = (minQ, maxQ, max) => {
      const ok = U.shuffle(items).map((id) => {
        const top = Math.min(maxQ, stock[id], Math.floor(max / P(id)));
        return top >= minQ ? [id, U.rnd(minQ, top)] : null;
      }).filter(Boolean);
      return ok[0] || null;
    };
    const kinds = tier.coins;
    if (type === 'total') {
      const s = pickSale(2, grade === 'k' ? 3 : 4, tier.max);
      if (!s) return null;
      const [id, q] = s, T = q * P(id);
      return ask({ type, text: `wants <b>${things(id, q)}</b>. One costs <b>${fmt(P(id))}</b>. How much is that in all?`, visual: row(id, q) + tag(id, grade), hint: `Add ${fmt(P(id))} ${q} times: ${Array(q).fill(P(id)).join(' + ')}.`, explain: `${Array(q).fill(fmt(P(id))).join(' + ')} = ${fmt(T)}`, sale: { [id]: q }, total: T }, T, grade);
    }
    if (type === 'count') {
      const s = pickSale(1, 3, tier.max);
      if (!s) return null;
      const [id, q] = s, T = q * P(id), coins = F.coinsFor(T, kinds);
      if (!coins) return null;
      const names = grade !== 'k' && tier !== F.tiers(grade)[0];
      return ask({ type, text: `buys <b>${things(id, q)}</b> and pays with these. How much money is it?`, visual: MQ.V.coins(coins, !names), hint: 'Start with the money worth the most, then count on.', explain: `${coins.map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(T)}`, sale: { [id]: q }, total: T }, T, grade);
    }
    if (type === 'collect') {
      const s = pickSale(1, 3, tier.max);
      if (!s) return null;
      const [id, q] = s, T = q * P(id);
      if (!F.fewest(T, kinds)) return null;
      return { type, kind: 'coins', target: T, coinKinds: kinds, text: `buys <b>${things(id, q)}</b> for <b>${fmt(T)}</b>. Help them pay: tap coins to make <b>${fmt(T)}</b>.`, hint: 'Start with the biggest coin that fits, then add smaller ones.', explain: `One way: ${F.fewest(T, kinds).map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(T)}`, sale: { [id]: q }, total: T };
    }
    if (type === 'change' || type === 'giveChange') {
      const s = pickSale(1, 3, Math.max(...tier.pay) - 1);
      if (!s) return null;
      const [id, q] = s, T = q * P(id);
      const over = tier.pay.filter((x) => x > T);
      if (!over.length) return null;
      const X = over[0] - T < 5 && over[1] ? U.pick(over.slice(0, 2)) : over[0];
      const C = X - T;
      const steps = `Count up from ${fmt(T)} to ${fmt(X)}.`;
      const base = { type, text: `buys <b>${things(id, q)}</b> for <b>${fmt(T)}</b> and pays with <b>${F.payName(X)}</b>. `, visual: MQ.V.coins(F.payCoins(X), true), hint: steps, explain: `${fmt(X)} − ${fmt(T)} = ${fmt(C)}`, sale: { [id]: q }, total: T };
      if (type === 'change') return ask(Object.assign(base, { text: base.text + 'How much change do you give back?' }), C, grade);
      const ck = kinds.filter((k) => F.COINV[k] < X);
      if (!F.fewest(C, ck)) return null;
      return Object.assign(base, { kind: 'coins', target: C, coinKinds: ck, text: base.text + 'Tap coins to give the right change.', explain: `${fmt(X)} − ${fmt(T)} = ${fmt(C)}. One way: ${F.fewest(C, ck).map((k) => fmt(F.COINV[k])).join(' + ')}` });
    }
    if (type === 'enough') {
      const s = pickSale(1, 2, tier.max);
      if (!s) return null;
      const [id, q] = s, T = q * P(id);
      const off = U.pick([-3, -2, -1, 0, 1, 2, 5]) * (T >= 20 ? 5 : 1);
      const H = Math.max(1, T + off);
      const coins = F.coinsFor(H, kinds);
      if (!coins) return null;
      const yes = H >= T;
      return { type, kind: 'choice', choices: ['Yes, enough', 'No, not enough'], answer: yes ? 'Yes, enough' : 'No, not enough', text: `wants <b>${things(id, q)}</b> for <b>${fmt(T)}</b>. These coins are in their pocket. Do they have enough?`, visual: MQ.V.coins(coins, true), hint: `Count the coins, then compare with ${fmt(T)}.`, explain: `The coins make ${fmt(H)}. ${fmt(H)} is ${H > T ? 'more than' : H === T ? 'the same as' : 'less than'} ${fmt(T)}, so ${yes ? 'yes, it is enough' : 'it is not enough'}.`, sale: { [id]: q }, total: T, noPay: !yes };
    }
    if (type === 'two' || type === 'budget') {
      let two = U.shuffle(items).filter((id) => P(id) < tier.max).slice(0, type === 'budget' && tier.pay.length > 1 && items.length > 2 ? 3 : 2);
      if (type === 'two' && two.length === 2 && P(two[0]) + P(two[1]) > tier.max) { // a second thing that fits the money with the first
        const fit = U.shuffle(items).find((id) => id !== two[0] && P(two[0]) + P(id) <= tier.max);
        if (fit) two = [two[0], fit];
      }
      if (two.length < 2) return null;
      const T = U.sum(two.map(P));
      const list = two.map((id) => `${F.ITEMS[id].e} ${F.ITEMS[id].name} (${fmt(P(id))})`).join(' and ');
      const sale = {};
      two.forEach((id) => (sale[id] = 1));
      if (type === 'two') {
        if (T > tier.max) return null;
        return ask({ type, text: `wants <b>${list}</b>. How much is that in all?`, visual: `<div class="ftags">${two.map((id) => tag(id, grade)).join('<b>+</b>')}</div>`, hint: grade === 'k' ? 'Count on from the bigger price.' : 'Add the dollars, then the cents. 100¢ make a dollar.', explain: `${two.map((id) => fmt(P(id))).join(' + ')} = ${fmt(T)}`, sale, total: T }, T, grade);
      }
      const over = (tier.pay || []).filter((x) => x > T);
      if (!over.length) return null;
      const H = over[0];
      return ask({ type, text: `has <b>${fmt(H)}</b> and buys <b>${list}</b>. How much money will they have left?`, visual: `<div class="ftags">${two.map((id) => tag(id, grade)).join('<b>+</b>')}</div>`, hint: `First add the prices. Then count up from the total to ${fmt(H)}.`, explain: `${two.map((id) => fmt(P(id))).join(' + ')} = ${fmt(T)}; ${fmt(H)} − ${fmt(T)} = ${fmt(H - T)}`, sale, total: T }, H - T, grade);
    }
    if (type === 'multiply') {
      const s = pickSale(3, 9, tier.max);
      if (!s) return null;
      const [id, q] = s, T = q * P(id);
      return ask({ type, text: `orders <b>${things(id, q)}</b> at <b>${fmt(P(id))}</b> each. How much is the order?`, visual: row(id, q) + tag(id, grade), hint: `${q} × ${fmt(P(id))}: find 2 × first, then keep adding, or split ${fmt(P(id))} into dollars and cents.`, explain: `${q} × ${fmt(P(id))} = ${fmt(T)}`, sale: { [id]: q }, total: T }, T, grade);
    }
    if (type === 'deal') {
      const s = pickSale(2, 6, tier.max * 2);
      if (!s) return null;
      const id = s[0], one = P(id), dealP = 2 * one - (one >= 50 ? 10 * U.rnd(1, 3) : U.rnd(1, 3) * 5);
      if (dealP <= one) return null;
      const qs = [4, 6].filter((n) => n <= stock[id]);
      const q = qs.length ? U.pick(qs) : 2;
      if (q > stock[id]) return null;
      const T = (q / 2) * dealP;
      return ask({ type, text: `likes today’s deal: <b>2 ${F.ITEMS[id].many} for ${fmt(dealP)}</b> (one is ${fmt(one)}) and takes <b>${things(id, q)}</b>. How much do they pay?`, visual: row(id, q) + tag(id, grade), hint: `${q} ${F.ITEMS[id].many} is ${q / 2} pairs. Each pair costs ${fmt(dealP)}.`, explain: `${q / 2} × ${fmt(dealP)} = ${fmt(T)} (without the deal it would be ${fmt(q * one)})`, sale: { [id]: q }, total: T }, T, grade);
    }
    if (type === 'profit') {
      const crops = Object.keys(F.CROPS).filter((c) => items.includes(c) || F.CROPS[c].lv <= 8);
      const c = U.pick(crops), seed = F.seedPrice(c, grade), y = F.CROPS[c].yield, T = y * P(c);
      const s = pickSale(1, 2, tier.max);
      if (!s) return null;
      return ask({ type, text: `asks a farmer question: a packet of ${F.ITEMS[c].e} seeds costs <b>${fmt(seed)}</b> and gives <b>${y} ${F.ITEMS[c].many}</b> that sell for <b>${fmt(P(c))}</b> each. How much <b>profit</b> is that? Then they buy ${things(s[0], s[1])}.`, hint: `Profit = money you get − money you spent. First ${y} × ${fmt(P(c))}.`, explain: `${y} × ${fmt(P(c))} = ${fmt(T)}; ${fmt(T)} − ${fmt(seed)} = ${fmt(T - seed)} profit`, sale: { [s[0]]: s[1] }, total: s[1] * P(s[0]) }, T - seed, grade);
    }
    if (type === 'interest') {
      const [per, add] = F.bankRule(grade);
      const bal = grade === 'k' ? U.rnd(12, Math.min(tier.max, 199)) : U.rnd(120, 2400);
      const n = Math.floor(bal / per), I = n * add;
      const s = pickSale(1, 2, tier.max);
      if (!s) return null;
      const unit = per === 100 ? 'whole dollar' : fmt(per);
      return ask({ type, text: `asks a bank question: the bank adds <b>${fmt(add)} for every ${unit}</b> you save. They have <b>${fmt(bal)}</b> in the bank. How much interest do they get this week? Then they buy ${things(s[0], s[1])}.`, hint: per === 100 ? `How many whole dollars are in ${fmt(bal)}? Each dollar brings 10¢.` : `How many tens are in ${bal}? Each ten brings 1¢.`, explain: `${fmt(bal)} has ${n} ${per === 100 ? (n === 1 ? 'whole dollar' : 'whole dollars') : n === 1 ? 'ten' : 'tens'}: ${n} × ${fmt(add)} = ${fmt(I)}`, sale: { [s[0]]: s[1] }, total: s[1] * P(s[0]) }, I, grade);
    }
    if (type === 'worth') {
      const r = U.pick(F.recipes());
      const w = F.worth(r, grade);
      const s = pickSale(1, 2, tier.max);
      if (!s) return null;
      const ins = Object.entries(r.in).map(([id, n]) => `${n} ${F.ITEMS[id].e}`).join(' + ');
      return ask({ type, text: `asks a farmer question: <b>${ins}</b> sell for <b>${fmt(w.inVal)}</b> in all. Made into ${F.ITEMS[r.out].e} ${F.ITEMS[r.out].name}, they sell for <b>${fmt(w.outVal)}</b>. How much <b>more</b> money is that? Then they buy ${things(s[0], s[1])}.`, hint: `Count up from ${fmt(w.inVal)} to ${fmt(w.outVal)}.`, explain: `${fmt(w.outVal)} − ${fmt(w.inVal)} = ${fmt(w.gain)}`, sale: { [s[0]]: s[1] }, total: s[1] * P(s[0]) }, w.gain, grade);
    }
    return null;
  };
  // The question before making something in a workshop: is it worth it?
  F.makeQuestion = (r, grade) => {
    const fmt = (c) => F.fmt(c, grade), w = F.worth(r, grade);
    const ins = Object.entries(r.in).map(([id, n]) => `${n} ${F.ITEMS[id].e} ${n === 1 ? F.ITEMS[id].name : F.ITEMS[id].many}`).join(' and ');
    const tags = Object.entries(r.in).map(([id, n]) => `<span class="ftag">${n} × ${F.ITEMS[id].e} ${fmt(F.price(id, grade))}</span>`).join('<b>+</b>');
    return ask({ type: 'make', text: `Make ${F.ITEMS[r.out].e} <b>${F.ITEMS[r.out].name}</b> from <b>${ins}</b>? Sold one by one they bring <b>${fmt(w.inVal)}</b>. The ${F.ITEMS[r.out].name} sells for <b>${fmt(w.outVal)}</b>. How much <b>more</b> money do you get by making it?`, visual: `<div class="ftags">${tags}<b>→</b><span class="ftag">${F.ITEMS[r.out].e} ${fmt(w.outVal)}</span></div>`, hint: `Count up from ${fmt(w.inVal)} to ${fmt(w.outVal)}.`, explain: `${fmt(w.outVal)} − ${fmt(w.inVal)} = ${fmt(w.gain)} more`, sale: {}, total: 0 }, w.gain, grade);
  };
  // How much Rosa pays for a pen. Kindergarten counts the coins she pays with; 2nd grade works out half of the shop
  // price (one animal) or adds it up (more animals, the barn).
  F.sellQuestion = (p, grade) => {
    const fmt = (c) => F.fmt(c, grade), a = F.ANIMALS[p.a], { cost, each, n, barn, total } = F.resale(p, grade);
    const what = `${n > 1 ? n + ' × ' : ''}${a.e} ${a.name}${barn ? ' and the cozy barn' : ''}`;
    const base = { type: 'sell', who: F.NEIGHBOR, sale: {}, total: 0 };
    if (grade === 'k') {
      const coins = F.fewest(total, total >= 25 ? ['q', 'd', 'n', 'p'] : ['d', 'n', 'p']);
      return ask(Object.assign(base, { text: `buys your <b>${what}</b> for half of the shop price. She pays with these coins. How much money is it?`, visual: MQ.V.coins(coins, false), hint: 'Start with the money worth the most, then count on.', explain: `${coins.map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(total)}` }), total, grade);
    }
    let q;
    if (n === 1 && !barn) q = { text: `wants to buy your <b>${what}</b>. It costs <b>${fmt(cost)}</b> in the shop, and she pays <b>half</b> of that. How much does she pay?`, hint: `Half means two equal parts: what number plus the same number makes ${fmt(cost)}?`, explain: `${fmt(each)} + ${fmt(each)} = ${fmt(cost)}, so half of ${fmt(cost)} is ${fmt(each)}`, traps: [cost] };
    else {
      const parts = Array(n).fill(fmt(each)).concat(barn ? [fmt(barn)] : []);
      q = { text: `wants to buy your <b>${what}</b>. She pays <b>${fmt(each)} for each ${a.name.toLowerCase()}</b>${barn ? ` and <b>${fmt(barn)} for the barn</b>` : ''}. How much does she pay in all?`, hint: `Add ${fmt(each)} ${n} ${n === 1 ? 'time' : 'times'}${barn ? `, then add ${fmt(barn)} for the barn` : ''}.`, explain: `${parts.join(' + ')} = ${fmt(total)}`, traps: [n * each, each + barn, (n + 1) * each].filter((x) => x !== total) };
    }
    Object.assign(base, { text: q.text, hint: q.hint, explain: q.explain });
    return Object.assign(base, total < 100 ? { kind: 'num', answer: total, unit: '¢' } : { kind: 'choice', answer: fmt(total), choices: F.moneyChoices(total, grade, q.traps) });
  };
  // The wholesale price: about half (2nd grade: a multiple of 5¢, nice for counting by 5s and 10s).
  F.wholesale = (id, grade) => {
    const p = F.price(id, grade);
    return grade === 'k' ? Math.max(1, Math.floor(p / 2)) : Math.max(5, Math.floor(p / 10) * 5);
  };
  // At most the tier's money range, and never more than 50¢ (kindergarten) or $5: a truck pays a bit more than a
  // customer, for a lot more things. Expensive things are for customers (a truck can't take 10 of them).
  F.truckCap = (grade, tier) => Math.min(tier.max, grade === 'k' ? 50 : 500);
  // The pile the truck buys now: the biggest one it can take at least F.TRUCK_MIN of within F.truckCap.
  F.truckLoad = (stock, grade, tier) => {
    let best = null;
    for (const [id, n] of Object.entries(stock)) {
      if (n < F.TRUCK_MIN) continue;
      const each = F.wholesale(id, grade), q = Math.min(n, Math.floor(F.truckCap(grade, tier) / each));
      if (q >= F.TRUCK_MIN && (!best || q > best.q)) best = { id, q, each, total: q * each };
    }
    return best;
  };
  // The truck's problem: count the money the driver pays (kindergarten, odd prices), or count by 5s and 10s /
  // multiply (2nd grade).
  F.truckProblem = (stock, grade, tier) => {
    const L = F.truckLoad(stock, grade, tier);
    if (!L) return null;
    const { id, q, each, total } = L, fmt = (c) => F.fmt(c, grade), it = F.ITEMS[id];
    const buys = `buys <b>${things(id, q)}</b> at the wholesale price, <b>${fmt(each)} each</b> (less than customers pay, but all at once).`;
    const base = { type: 'truck', truck: true, sale: { [id]: q }, total, visual: row(id, q) + `<span class="ftag">🚚 ${fmt(each)} each</span>` };
    const easy = each === 5 || each === 10;
    if (grade !== 'k' && (easy || tier.types.includes('multiply') || tier.types.includes('deal'))) {
      const tens = Math.floor(q / 10), rest = q % 10;
      const hint = easy
        ? (q >= 10 ? `10 ${it.many} make ${fmt(10 * each)}. Count the tens first: ${tens} × ${fmt(10 * each)}${rest ? `, then count the other ${rest} by ${each}s` : ''}.` : `Count by ${each}s: ${each}, ${2 * each}, ${3 * each}…`)
        : rest ? `${q} × ${fmt(each)}: split ${q} into ${tens * 10} and ${rest}, find each part, then add.` : `${q} is ${tens} tens: find 10 × ${fmt(each)} first, then ${tens} × that.`;
      const explain = easy && q >= 10 ? `${tens} × ${fmt(10 * each)} = ${fmt(tens * 10 * each)}${rest ? `, ${rest} × ${fmt(each)} = ${fmt(rest * each)}; ${fmt(tens * 10 * each)} + ${fmt(rest * each)} = ${fmt(total)}` : ''}` : `${q} × ${fmt(each)} = ${fmt(total)}`;
      const traps = [(q - 1) * each, (q + 1) * each, total + 10 * each, total - 10 * each];
      return Object.assign(base, { text: `${buys} How much does it pay?`, hint, explain }, total < 100 ? { kind: 'num', answer: total, unit: '¢' } : { kind: 'choice', answer: fmt(total), choices: F.moneyChoices(total, grade, traps) });
    }
    const coins = F.coinsFor(total, tier.coins) || F.fewest(total, tier.coins);
    if (!coins) return null;
    return ask(Object.assign(base, { text: `${buys} The driver pays with these. How much money is it?`, visual: base.visual + MQ.V.coins(coins, grade === 'k' || tier === F.tiers(grade)[0]), hint: 'Start with the money worth the most, then count on.', explain: `${coins.map((k) => fmt(F.COINV[k])).join(' + ')} = ${fmt(total)}` }), total, grade);
  };
  const FALLBACK = ['count', 'collect', 'total', 'two'];
  // The next customer: a problem of the child's tier (one tier up for a ⭐ challenge customer).
  // stock: what can be sold (the basket; odd jobs use a pretend crate). Returns null when nothing can be sold.
  F.customer = (fm, grade, { stock, vip = false, jobs = false, truck = false } = {}) => {
    const all = F.tiers(grade);
    const ti = Math.min(all.length, Math.max(1, fm.tier) + (vip ? 1 : 0));
    const tier = all[ti - 1];
    if (!Object.values(stock).some((n) => n > 0)) return null;
    const t = truck && !vip && !jobs ? F.truckProblem(stock, grade, tier) : null;
    if (t) return Object.assign(t, { who: F.TRUCK, vip: false, jobs: false, tier: ti, ahead: !!tier.ahead });
    const types = U.shuffle(tier.types).concat(FALLBACK);
    for (const type of types) {
      const p = F.problem(type, { grade, tier, stock });
      if (!p) continue;
      const who = vip ? U.pick(F.VIPS) : U.pick(F.PEOPLE);
      return Object.assign(p, { who, vip, jobs, tier: ti, ahead: !!tier.ahead });
    }
    // nothing fits the tier (e.g. only expensive items): count the money for one item
    const id = Object.keys(stock).find((k) => stock[k] > 0), T = F.price(id, grade);
    const coins = F.coinsFor(T, all[all.length - 1].coins);
    return ask({ type: 'count', who: U.pick(F.PEOPLE), vip, jobs, tier: ti, text: `buys <b>${things(id, 1)}</b> and pays with these. How much money is it?`, visual: MQ.V.coins(coins, false), hint: 'Start with the money worth the most, then count on.', explain: `${coins.map((k) => F.fmt(F.COINV[k], grade)).join(' + ')} = ${F.fmt(T, grade)}`, sale: { [id]: 1 }, total: T }, T, grade);
  };
  // Odd jobs: helping at the big Farmers' Market with things the farm doesn't grow yet. Pays a small wage.
  F.jobStock = (fm) => {
    const L = F.level(fm.xp).level, stock = {};
    for (const [id, c] of Object.entries(F.CROPS)) if (c.lv <= L + 6) stock[id] = 9;
    for (const a of Object.values(F.ANIMALS)) if (a.lv <= L + 6) stock[a.item] = 9;
    return stock;
  };
  F.wage = (tier, grade) => (grade === 'k' ? (tier >= 3 ? 2 : 1) : 5 * tier);
  // a nicer stand tips more; the merchant's Street Musician adds 10% on any stand, his Lucky Clover 20% for a week
  F.tipRate = (fm, clover = true) => F.STANDS[fm.stand].tip + (fm.treasure && fm.treasure.musician ? F.TREASURES.musician.tip : 0) + (clover && F.charmOn(fm, 'clover') ? F.CHARMS.clover.tip : 0);
  F.tip = (fm, total, clover = true) => { const r = F.tipRate(fm, clover); return r ? Math.max(1, Math.round(total * r)) : 0; };
  F.VIP_TIP = (grade, total) => Math.max(grade === 'k' ? 2 : 10, Math.round(total * 0.5));

  // Is this answer right? (coins: the picked coins make the target exactly)
  F.isRight = (p, given) => (p.kind === 'coins' ? F.sumCoins(given) === p.target : String(given) === String(p.answer));
  // A customer was served: take the items, get paid (plus a tip for a first-try right answer), earn XP.
  F.serve = (fm, grade, p, firstTry, solved) => {
    const res = { paid: 0, tip: 0, xp: 0, ups: [] };
    if (p.jobs) {
      res.paid = solved ? (firstTry ? F.wage(p.tier, grade) : Math.ceil(F.wage(p.tier, grade) / 2)) : 0;
      fm.stats.jobs++;
    } else if (!p.noPay) {
      for (const [id, n] of Object.entries(p.sale)) { fm.basket[id] = Math.max(0, (fm.basket[id] || 0) - n); if (!fm.basket[id]) delete fm.basket[id]; fm.stats.sold += n; }
      res.paid = p.total;
      if (firstTry) res.tip = p.vip ? F.VIP_TIP(grade, p.total) : p.truck ? 0 : F.tip(fm, p.total); // wholesale: no tip
      if (firstTry && !p.vip && !p.truck && F.charmOn(fm, 'clover')) { res.clover = res.tip - F.tip(fm, p.total, false); fm.charms.clover.gain += res.clover; } // what the Lucky Clover added
    }
    fm.money += res.paid + res.tip;
    fm.stats.earned += res.paid + res.tip;
    fm.stats.tasks++;
    if (firstTry) fm.stats.right++;
    if (p.vip && firstTry) fm.stats.vip++;
    fm.customers++;
    res.xp = (firstTry ? 5 : solved ? 2 : 1) + (p.vip && firstTry ? 5 : 0) + (p.ahead && firstTry ? 2 : 0);
    res.ups = F.addXp(fm, res.xp, grade);
    return res;
  };

  MQ.farm = F;
})();
