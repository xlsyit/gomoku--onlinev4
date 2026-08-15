(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let muted = false;
  try {
    muted = window.localStorage.getItem('gmx_muted') === '1';
  } catch (e) { /* ignore */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(opts) {
    const ac = ensure();
    if (!ac || muted) return;
    const f = opts.f || 440;
    const slide = opts.slide;
    const type = opts.type || 'sine';
    const dur = opts.dur || 0.2;
    const vol = Math.min(0.5, opts.vol || 0.15);
    const delay = opts.delay || 0;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(opts) {
    const ac = ensure();
    if (!ac || muted) return;
    const dur = opts.dur || 0.35;
    const vol = Math.min(0.35, opts.vol || 0.12);
    const delay = opts.delay || 0;
    const from = opts.from || 200;
    const to = opts.to || 2400;
    const t0 = ac.currentTime + delay;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  window.SFX = {
    unlock: function () {
      ensure();
    },
    isMuted: function () {
      return muted;
    },
    setMuted: function (m) {
      muted = m;
      try {
        window.localStorage.setItem('gmx_muted', m ? '1' : '0');
      } catch (e) { /* ignore */ }
      if (master) master.gain.value = m ? 0 : 0.85;
    },
    toggle: function () {
      this.setMuted(!muted);
      return muted;
    },
    click: function () {
      tone({ f: 880, slide: 640, type: 'sine', dur: 0.07, vol: 0.1 });
    },
    hover: function () {
      tone({ f: 1200, slide: 1000, type: 'sine', dur: 0.04, vol: 0.04 });
    },
    place: function () {
      tone({ f: 340, slide: 300, type: 'triangle', dur: 0.09, vol: 0.16 });
      noise({ dur: 0.06, vol: 0.05, from: 2600, to: 900 });
    },
    effect: function (level) {
      if (level <= 1) {
        tone({ f: 520, slide: 660, type: 'sine', dur: 0.12, vol: 0.12 });
      } else if (level === 2) {
        tone({ f: 520, type: 'sine', dur: 0.14, vol: 0.12 });
        tone({ f: 660, type: 'sine', dur: 0.14, vol: 0.12, delay: 0.07 });
      } else if (level === 3) {
        tone({ f: 520, type: 'sine', dur: 0.16, vol: 0.13 });
        tone({ f: 660, type: 'sine', dur: 0.16, vol: 0.13, delay: 0.06 });
        tone({ f: 880, type: 'sine', dur: 0.2, vol: 0.13, delay: 0.12 });
      } else if (level === 4) {
        tone({ f: 420, slide: 880, type: 'sawtooth', dur: 0.2, vol: 0.1 });
        tone({ f: 660, type: 'sine', dur: 0.22, vol: 0.14, delay: 0.02 });
        tone({ f: 1040, type: 'sine', dur: 0.26, vol: 0.14, delay: 0.1 });
        noise({ dur: 0.3, vol: 0.1, from: 300, to: 3600 });
      } else {
        tone({ f: 440, type: 'sine', dur: 0.24, vol: 0.13 });
        tone({ f: 660, type: 'sine', dur: 0.24, vol: 0.13, delay: 0.06 });
        tone({ f: 880, type: 'sine', dur: 0.3, vol: 0.14, delay: 0.12 });
        noise({ dur: 0.5, vol: 0.13, from: 500, to: 5000 });
      }
    },
    counter: function (level) {
      tone({ f: 170, slide: 90, type: 'sawtooth', dur: 0.22, vol: 0.14 });
      tone({ f: 340, slide: 520, type: 'sine', dur: 0.2, vol: 0.12, delay: 0.04 });
      noise({ dur: 0.24, vol: 0.12, from: 800, to: 2400 });
      if (level >= 4) {
        tone({ f: 620, slide: 920, type: 'triangle', dur: 0.26, vol: 0.13, delay: 0.08 });
      }
    },
    win: function () {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach(function (n, i) {
        tone({ f: n, type: 'triangle', dur: 0.32, vol: 0.17, delay: i * 0.13 });
        tone({ f: n * 2, type: 'sine', dur: 0.2, vol: 0.07, delay: i * 0.13 });
      });
      tone({ f: 1318.5, type: 'sine', dur: 0.6, vol: 0.15, delay: 0.55 });
      noise({ dur: 0.7, vol: 0.08, from: 1200, to: 5200, delay: 0.3 });
    },
    whoosh: function () {
      noise({ dur: 0.55, vol: 0.18, from: 160, to: 4200 });
      tone({ f: 180, slide: 720, type: 'sine', dur: 0.5, vol: 0.1 });
    }
  };
})();
