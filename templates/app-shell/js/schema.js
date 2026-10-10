// The app-specific part of a profile: what a new profile starts with, and how two copies of the same
// profile (played offline on two devices) are combined. Replace the demo fields with the new app's own.
//
// Merge rule of thumb — nothing earned is ever lost:
//   things collected (levels, badges, items)  → union of both copies, best value per key;
//   counters that only grow (xp, totals)      → the higher value;
//   things that can be spent or changed (coins, settings, choices) → the newer copy (it is the base of `out`).
(function () {
  const APP = (globalThis.APP = globalThis.APP || {});
  APP.schema = {
    fresh: (kind) => ({
      xp: 0,
      coins: 0,
      levels: {}, // '<levelId>': { stars }
      badges: {}, // id: date earned
      stats: { attempts: 0, correct: 0, bestStreak: 0 },
      settings: { sound: true, unlockAll: false, readAloud: kind === 'young' },
    }),
    // out = a copy of the newer profile `nw`; `old` is the other copy. M = helpers from the store (union, max).
    mergeProgress(out, nw, old, M) {
      out.levels = M.union(old.levels, nw.levels, (a, b) => ({ stars: M.max(a.stars, b.stars) }));
      out.badges = M.union(old.badges, nw.badges);
      out.xp = M.max(nw.xp, old.xp);
      for (const k of ['attempts', 'correct', 'bestStreak']) out.stats[k] = M.max(nw.stats[k], old.stats[k]);
    },
  };
})();
