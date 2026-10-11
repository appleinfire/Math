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
  F.FEED_PACKS = [5, 20];
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
  F.bedStars = (b) => Math.min(b.u || 0, 2) + ((b.u || 0) >= 4 ? 1 : 0) + ((b.u || 0) >= 6 ? 1 : 0);
  F.bedWater = (b) => (b.u || 0) >= 3;
  F.bedGlass = (b) => (b.u || 0) >= 5;
  F.cropDays = (b) => Math.max(1, F.CROPS[b.c].days - (F.bedWater(b) ? 1 : 0));
  F.cropYield = (b) => F.CROPS[b.c].yield + F.bedStars(b);
  F.penCount = (p) => 1 + Math.min(p.u || 0, 2);
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
    for (const u of F.BED_UP) if (u.lv === L) out.push({ e: u.icon, name: 'Garden bed upgrade: ' + u.name });
    for (const u of F.PEN_UP) if (u.lv === L) out.push({ e: '🏡', name: 'Pen upgrade: ' + u.name });
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
    stats: { sold: 0, earned: 0, spent: 0, tasks: 0, right: 0, vip: 0, jobs: 0, made: 0, interest: 0, bankDays: 0 },
    works: {}, // workshop id: { r: recipe index or null, g: nights, ready: items, out: item }
    bank: { bal: 0, since: '', log: [] }, // since: the day the bank week started (interest every 7 days)
  });
  F.START_MONEY = [5, 30];
  F.ensure = (st) => {
    if (!st.farm) st.farm = F.fresh();
    const fm = st.farm;
    if (!fm.started) { fm.started = true; fm.money = F.START_MONEY[gi(st.grade)]; }
    // farms from the first version: add what came later
    if (!fm.works) fm.works = {};
    if (!fm.bank) fm.bank = { bal: 0, since: '', log: [] };
    if (!fm.helper) fm.helper = { hired: false, on: true };
    if (!fm.stats.wages) fm.stats.wages = 0;
    for (const k of ['made', 'interest', 'bankDays']) if (!fm.stats[k]) fm.stats[k] = 0;
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
    const n = F.cropYield(bed);
    fm.basket[bed.c] = (fm.basket[bed.c] || 0) + n;
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
  F.collect = (fm, i) => {
    const pen = fm.pens[i], n = pen.ready || 0;
    if (!n) return 0;
    const item = F.ANIMALS[pen.a].item;
    fm.basket[item] = (fm.basket[item] || 0) + n;
    pen.ready = 0;
    return n;
  };
  F.feed = (fm, i) => {
    const pen = fm.pens[i], eat = F.penEat(pen);
    if (pen.fed) return 'fed';
    if (fm.feed < eat) return 'nofeed';
    fm.feed -= eat;
    pen.fed = true;
    return 'ok';
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
        fm.pens.forEach((p, i) => { if (p.a && !p.fed) F.feed(fm, i) === 'ok' ? news.helper.fed++ : news.helper.short++; });
      }
    }
    for (const [id, w] of Object.entries(fm.works || {})) {
      if (w.r === null || w.r === undefined) continue;
      const r = F.WORKS[id].recipes[w.r];
      w.g++;
      if (w.g >= r.days) { w.ready = (w.ready || 0) + 1; w.out = r.out; w.r = null; w.g = 0; news.cooked.push(r.out); }
    }
    fm.beds.forEach((b) => {
      if (!b.c || F.cropStage(b) === 'ready') return;
      b.g++;
      if (F.cropStage(b) === 'ready') news.ripe.push(b.c);
    });
    fm.pens.forEach((p) => {
      if (!p.a) return;
      if (!p.fed) { news.hungry.push(p.a); return; }
      const before = F.animalStage(p);
      if (before === 2) { const a = F.ANIMALS[p.a], k = F.penMakes(p); p.ready = Math.min(30, (p.ready || 0) + k); news.made.push([a.item, k]); }
      p.g++;
      if (F.animalStage(p) > before) news.grew.push([p.a, F.animalStage(p)]);
      p.fed = false;
    });
    if (news.helper && !news.helper.unpaid) { // in the morning: products into the basket, ripe crops too from level 48
      fm.pens.forEach((p, i) => { news.helper.collected += F.collect(fm, i); });
      if (F.level(fm.xp).level >= F.HELPER.picksLv) fm.beds.forEach((b, i) => { news.helper.picked += F.harvest(fm, i); });
    }
    fm.day++;
    return news;
  };

  // ---------------------------------------------------------------- the shop
  // Every thing a farmer can buy, with its state for this farm: lock (level needed), owned, price.
  F.shop = (fm, grade) => {
    const L = F.level(fm.xp).level, g = gi(grade), out = [];
    const freePen = fm.pens.some((p) => !p.a);
    for (const n of F.FEED_PACKS) out.push({ id: 'feed:' + n, tab: 'animals', e: F.FEED.e, name: `${n} bags of feed`, price: n * F.FEED.price[g], lv: 1, note: `You have ${fm.feed} 🌾` });
    for (const [id, a] of Object.entries(F.ANIMALS)) out.push({ id: 'animal:' + id, tab: 'animals', e: a.e, name: a.name, price: a.cost[g], lv: a.lv, note: `${F.ITEMS[a.item].e} ${F.fmt(F.price(a.item, grade), grade)} each · eats ${a.eat} 🌾 a day`, blocked: !freePen && 'Needs an empty pen' });
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
    else if (kind === 'helper') fm.helper = { hired: true, on: true };
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
  // Money in the bank grows every week (7 real days): 10¢ for every whole dollar in 2nd grade, 1¢ for every 10¢ in
  // kindergarten (10% a week, easy to work out). At most BANK_CAP a week, and at most 4 missed weeks are paid.
  F.BANK_LV = 10;
  F.BANK_RULE = [[10, 1], [100, 10]]; // [for every …, add …] for k, g2
  F.BANK_CAP = [50, 500];
  F.BANK_MISSED = 4;
  F.bankRule = (grade) => F.BANK_RULE[gi(grade)];
  F.ruleText = (grade) => (grade === 'k' ? 'The bank adds 1¢ for every 10¢ you save, every week.' : 'The bank adds 10¢ for every whole dollar you save, every week.');
  F.interest = (bal, grade) => { const [per, add] = F.bankRule(grade); return Math.min(F.BANK_CAP[gi(grade)], Math.floor(bal / per) * add); };
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return U.dateKey(d); };
  F.addDays = addDays;
  const bankLog = (fm, kind, amt, today) => { fm.bank.log.unshift({ d: today, kind, amt }); fm.bank.log.length = Math.min(fm.bank.log.length, 12); };
  F.deposit = (fm, amt, today = U.dateKey()) => {
    if (!(amt > 0) || amt > fm.money) return false;
    fm.money -= amt;
    if (!fm.bank.bal || !fm.bank.since) fm.bank.since = today; // the first week starts with the first savings
    fm.bank.bal += amt;
    bankLog(fm, 'in', amt, today);
    return true;
  };
  F.withdraw = (fm, amt, today = U.dateKey()) => {
    if (!(amt > 0) || amt > fm.bank.bal) return false;
    fm.bank.bal -= amt;
    fm.money += amt;
    bankLog(fm, 'out', amt, today);
    return true;
  };
  // Bank days waiting (whole weeks since the bank week started), at most BANK_MISSED; older weeks are skipped.
  F.bankDue = (fm, today = U.dateKey()) => {
    const b = fm.bank;
    if (!b.since || !b.bal) return 0;
    const weeks = Math.floor(U.daysBetween(b.since, today) / 7);
    if (weeks > F.BANK_MISSED) b.since = addDays(b.since, 7 * (weeks - F.BANK_MISSED));
    return Math.max(0, Math.min(weeks, F.BANK_MISSED));
  };
  // Pay one week of interest. Returns the amount.
  F.payInterest = (fm, grade, today = U.dateKey()) => {
    const x = F.interest(fm.bank.bal, grade);
    fm.bank.bal += x;
    fm.bank.since = addDays(fm.bank.since, 7);
    fm.stats.interest += x;
    fm.stats.bankDays++;
    bankLog(fm, 'interest', x, today);
    return x;
  };
  // How the savings would grow, week by week, without adding or taking out money.
  F.project = (bal, grade, weeks = 6) => { const out = [bal]; for (let i = 0; i < weeks; i++) out.push(out[i] + F.interest(out[i], grade)); return out; };
  F.nextBankDay = (fm, today = U.dateKey()) => (fm.bank.since && fm.bank.bal ? 7 - (U.daysBetween(fm.bank.since, today) % 7) : 0);

  // ---------------------------------------------------------------- grown-up preview
  // The farm of a level-60 farmer, to look around in the grown-up preview (a copy of the profile; nothing is saved):
  // everything open and owned, plenty of money, crops and animals at every stage, a full basket, a bank day waiting.
  F.showcase = (st) => {
    const fm = F.ensure(st), g = st.grade, k = g === 'k';
    let xp = 0;
    for (let L = 1; L < 60; L++) xp += F.need(L);
    const today = U.dateKey();
    Object.assign(fm, {
      xp, money: k ? 5000 : 100000, feed: 200, stand: F.STANDS.length - 1, tier: F.tiers(g).length, goal: '',
      beds: ['carrot', 'tomato', 'corn', 'pumpkin', 'strawberry', 'pineapple'].map((c, i) => ({ c, u: [0, 1, 2, 3, 5, 6][i], g: i % 2 ? 0 : 9 })),
      pens: ['chicken', 'cow', 'bees', 'fishpond', 'sheep', 'unicorn'].map((a, i) => ({ a, g: i === 5 ? 0 : 9, fed: i % 3 === 0, ready: i % 2 ? 3 : 0, u: i % 4 })),
      basket: {}, owned: {}, works: {},
      helper: { hired: true, on: false },
      bank: { bal: k ? 300 : 2500, since: addDays(today, -8), log: [] },
    });
    for (const id of Object.keys(F.ITEMS)) fm.basket[id] = 3;
    for (const id of Object.keys(F.DECOR)) fm.owned[id] = true;
    Object.keys(F.WORKS).forEach((id, i) => { fm.works[id] = i % 2 ? { r: null, g: 0, ready: 1, out: F.WORKS[id].recipes[0].out } : { r: null, g: 0, ready: 0, out: '' }; });
    return fm;
  };

  F.goalItem = (fm, grade) => (fm.goal ? F.shopItem(fm, grade, fm.goal) : null);

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
  const things = (id, n) => `${n} ${F.ITEMS[id].e} ${plural(id, n)}`;
  // Choices for an amount of money: the answer and near misses (a coin off, a dime off, a dollar off).
  F.moneyChoices = (ans, grade) => {
    const near = [ans + 10, ans - 10, ans + 5, ans - 5, ans + 25, ans - 25, ans + 100, ans - 100, ans + 1, ans - 1].filter((x) => x > 0 && x !== ans);
    const picks = new Set([ans]);
    for (const x of U.shuffle(near)) { if (picks.size >= 4) break; picks.add(x); }
    return U.shuffle([...picks]).map((x) => F.fmt(x, grade));
  };
  // Number pad for amounts in cents under a dollar; buttons for dollar amounts (typing $3.45 is hard on a pad).
  function ask(p, ans, grade) {
    if (grade === 'k' || ans < 100) return Object.assign(p, { kind: 'num', answer: ans, unit: '¢' });
    const choices = F.moneyChoices(ans, grade);
    return Object.assign(p, { kind: 'choice', answer: F.fmt(ans, grade), choices });
  }
  const tag = (id, grade) => `<span class="ftag">${F.ITEMS[id].e} ${F.fmt(F.price(id, grade), grade)}</span>`;
  const row = (id, n) => `<div class="frow" aria-hidden="true">${Array(Math.min(n, 12)).fill(F.ITEMS[id].e).join('')}</div>`;

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
      const two = U.shuffle(items).filter((id) => P(id) < tier.max).slice(0, type === 'budget' && tier.pay.length > 1 && items.length > 2 ? 3 : 2);
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
  const FALLBACK = ['count', 'collect', 'total', 'two'];
  // The next customer: a problem of the child's tier (one tier up for a ⭐ challenge customer).
  // stock: what can be sold (the basket; odd jobs use a pretend crate). Returns null when nothing can be sold.
  F.customer = (fm, grade, { stock, vip = false, jobs = false } = {}) => {
    const all = F.tiers(grade);
    const ti = Math.min(all.length, Math.max(1, fm.tier) + (vip ? 1 : 0));
    const tier = all[ti - 1];
    if (!Object.values(stock).some((n) => n > 0)) return null;
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
  F.tip = (fm, total) => (F.STANDS[fm.stand].tip ? Math.max(1, Math.round(total * F.STANDS[fm.stand].tip)) : 0);
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
      if (firstTry) res.tip = p.vip ? F.VIP_TIP(grade, p.total) : F.tip(fm, p.total);
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
