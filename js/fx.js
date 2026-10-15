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
  // a tone that slides from one pitch to another, through a low-pass filter (roars, rumbles, whooshes)
  function sweep(f1, f2, at, dur, type = 'sawtooth', vol = 0.14, cut = 900) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type;
    f.type = 'lowpass';
    f.frequency.value = cut;
    const t = c.currentTime + at;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(c.destination);
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
    coin: () => { tone(1320, 0, 0.06, 'square', 0.04); tone(1760, 0.05, 0.14, 'square', 0.04); },
    // the Hatchery's bigger eggs
    chime: () => { tone(1568, 0, 0.12, 'sine', 0.07); tone(2093, 0.05, 0.18, 'sine', 0.05); },
    shimmer: () => [1046, 1318, 1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.4, 'sine', 0.09)),
    fanfare: () => {
      [523, 659, 784].forEach((f) => tone(f, 0, 0.22, 'triangle', 0.09));
      [587, 740, 880].forEach((f) => tone(f, 0.24, 0.22, 'triangle', 0.09));
      [784, 988, 1175, 1568].forEach((f) => tone(f, 0.5, 0.9, 'triangle', 0.09));
    },
    rumble: () => { sweep(90, 50, 0, 0.35, 'sawtooth', 0.12, 300); tone(140, 0.02, 0.1, 'square', 0.04); },
    roar: () => { sweep(320, 70, 0, 1.1, 'sawtooth', 0.16, 900); sweep(250, 60, 0.05, 1.1, 'square', 0.07, 600); },
    whoosh: () => { sweep(200, 1200, 0, 0.5, 'sawtooth', 0.05, 1500); sweep(1200, 300, 0.5, 0.6, 'sawtooth', 0.05, 1500); },
  };
  MQ.sfx = (name) => {
    if (!MQ.state || !MQ.state.settings.sound) return;
    try { SONGS[name] && SONGS[name](); } catch (e) { /* audio unavailable */ }
  };

  // Read-aloud for kids who don't read yet (Web Speech API, built into iPad Safari and Chrome).
  MQ.canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
  MQ.toSpeech = (html) =>
    String(html)
      .replace(/<span class="blank">\?<\/span>/g, ' what ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/(\d)\/(\d)/g, '$1 out of $2')
      .replace(/\+/g, ' plus ').replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/=/g, ' equals ')
      .replace(/\p{Extended_Pictographic}|️|‍/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  // Speaks the text and resolves when the voice has finished (or after a safety timeout, because
  // some browsers never fire "end"). Resolves false right away when speech is unavailable.
  let speaking = 0;
  MQ.speak = (text) =>
    new Promise((resolve) => {
      if (!MQ.canSpeak() || !text) return resolve(false);
      const id = ++speaking;
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); resolve(id === speaking); } };
      const timer = setTimeout(finish, Math.min(10000, 1500 + text.split(/\s+/).length * 450));
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voices = synth.getVoices();
        const v = voices.find((x) => /en-US/i.test(x.lang) && /Samantha|Google US English|Ava|Allison|Female/i.test(x.name)) || voices.find((x) => /^en/i.test(x.lang));
        if (v) u.voice = v;
        u.lang = 'en-US';
        u.rate = 0.92;
        u.pitch = 1.1;
        u.onend = finish;
        u.onerror = finish;
        synth.speak(u);
      } catch (e) { finish(); }
    });
  MQ.hush = () => { speaking++; try { MQ.canSpeak() && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } };

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // confetti(amount, { colors, shape: 'rect' | 'diamond' | 'star' | 'dot', rain }) — rain falls from the top of the screen
  MQ.confetti = (amount = 120, o = {}) => {
    if (reduced()) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    document.body.appendChild(cv);
    const dpr = window.devicePixelRatio || 1;
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const g = cv.getContext('2d');
    const colors = o.colors || ['#ff6b5b', '#ffb547', '#5cc8b8', '#8c9cff', '#7fd36b', '#f58fc8'];
    const shape = o.shape || 'rect', rain = !!o.rain;
    const parts = Array.from({ length: amount }, () => ({
      x: rain ? Math.random() * W : W / 2 + (Math.random() - 0.5) * W * 0.3, y: rain ? -Math.random() * H * 0.6 : H * 0.35,
      vx: (Math.random() - 0.5) * (rain ? 3 : 22) * dpr, vy: rain ? (2 + Math.random() * 4) * dpr : (-Math.random() * 20 - 8) * dpr,
      s: (6 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const draw = (p) => {
      g.fillStyle = p.c;
      if (shape === 'rect') return g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.beginPath();
      if (shape === 'dot') g.arc(0, 0, p.s / 2.4, 0, Math.PI * 2);
      else if (shape === 'diamond') { g.moveTo(0, -p.s / 1.6); g.lineTo(p.s / 2.6, 0); g.lineTo(0, p.s / 1.6); g.lineTo(-p.s / 2.6, 0); }
      else for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? p.s / 5 : p.s / 1.6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      g.fill();
    };
    let frame = 0;
    const last = rain ? 220 : 150;
    (function step() {
      g.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += (rain ? 0.06 : 0.7) * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); draw(p); g.restore();
      }
      if (++frame < last) requestAnimationFrame(step);
      else cv.remove();
    })();
  };
})();
