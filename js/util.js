// Small helpers shared by every module. Each file attaches itself to the MQ namespace
// so the app runs from plain <script> tags (works from file://, GitHub Pages, or a single bundled file).
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const U = {};

  U.rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.sample = (arr, n) => U.shuffle(arr).slice(0, n);
  U.range = (a, b) => {
    const r = [];
    for (let i = a; i <= b; i++) r.push(i);
    return r;
  };
  U.sum = (arr) => arr.reduce((s, x) => s + x, 0);
  U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  U.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Numeric multiple-choice options: always contains the answer, all unique and non-negative.
  U.numChoices = (answer, distractors, n = 4) => {
    const set = new Set([answer]);
    for (const d of U.shuffle(distractors)) {
      if (set.size >= n) break;
      if (Number.isInteger(d) && d >= 0) set.add(d);
    }
    let k = 1;
    while (set.size < n) {
      const c = answer + (k % 2 ? 1 : -1) * Math.ceil(k / 2);
      if (c >= 0) set.add(c);
      k++;
    }
    return U.shuffle([...set]);
  };

  // String multiple-choice options (answer first in the candidate list, then shuffled).
  U.strChoices = (answer, distractors, n = 4) => {
    const set = new Set([String(answer)]);
    for (const d of U.shuffle(distractors.map(String))) {
      if (set.size >= n) break;
      set.add(d);
    }
    return U.shuffle([...set]);
  };

  U.cents = (c) => (c >= 100 ? '$' + (c / 100).toFixed(2) : c + '¢');
  U.dollars = (c) => '$' + (c / 100).toFixed(2);
  U.comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  U.dateKey = (d = new Date()) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  U.daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

  // Short fingerprint of a question (ignores answer order), used to avoid repeats across attempts.
  U.qkey = (p) => {
    const s = String(p.text) + (p.visual || '');
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };
  MQ.U = U;
})();
