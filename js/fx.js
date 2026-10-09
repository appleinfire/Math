// Sound effects (synthesized with Web Audio, no files) and confetti.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  let ctx = null;
  const ac = () => {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  function tone(freq, at, dur, type = 'sine', vol = 0.18) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = c.currentTime + at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const SONGS = {
    tap: () => tone(520, 0, 0.06, 'triangle', 0.08),
    correct: () => { tone(660, 0, 0.14, 'triangle'); tone(990, 0.09, 0.22, 'triangle'); },
    wrong: () => { tone(260, 0, 0.16, 'sine', 0.12); tone(220, 0.12, 0.22, 'sine', 0.1); },
    streak: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.14)),
    reward: () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.15)),
    crack: () => { tone(180, 0, 0.08, 'square', 0.06); tone(140, 0.05, 0.08, 'square', 0.05); },
    hatch: () => [440, 554, 659, 880, 1108].forEach((f, i) => tone(f, i * 0.1, 0.35, 'sine', 0.16)),
    tick: () => tone(1200, 0, 0.03, 'square', 0.03),
  };
  MQ.sfx = (name) => {
    if (!MQ.state || !MQ.state.settings.sound) return;
    try { SONGS[name] && SONGS[name](); } catch (e) { /* audio unavailable */ }
  };

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  MQ.confetti = (amount = 120) => {
    if (reduced()) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    document.body.appendChild(cv);
    const dpr = window.devicePixelRatio || 1;
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const g = cv.getContext('2d');
    const colors = ['#ff6b5b', '#ffb547', '#5cc8b8', '#8c9cff', '#7fd36b', '#f58fc8'];
    const parts = Array.from({ length: amount }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
      vx: (Math.random() - 0.5) * 22 * dpr, vy: (-Math.random() * 20 - 8) * dpr,
      s: (6 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    let frame = 0;
    (function step() {
      g.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.7 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      }
      if (++frame < 150) requestAnimationFrame(step);
      else cv.remove();
    })();
  };
})();
