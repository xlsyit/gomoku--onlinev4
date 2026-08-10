(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function withAlpha(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  const THEMES = [
    {
      id: 'neon',
      name: '星海霓虹',
      tagline: '深空里的光之棋局',
      motif: 'star',
      fx: { type: 'quantum' },
      accent: '#00e5ff',
      accent2: '#ff3df5',
      bgType: 'neon',
      bgColors: ['#04060f', '#0d0a2e', '#1c0a3f'],
      decor: {
        nebula: [
          { x: 0.18, y: 0.24, r: 0.5, c: '#2f4bff', a: 0.55 },
          { x: 0.84, y: 0.68, r: 0.58, c: '#b026ff', a: 0.5 },
          { x: 0.5, y: 0.12, r: 0.34, c: '#00e5ff', a: 0.32 },
          { x: 0.08, y: 0.86, r: 0.42, c: '#ff3df5', a: 0.28 }
        ],
        shooting: true
      },
      board: {
        fill: 'rgba(7, 12, 34, 0.97)',
        line: 'rgba(126, 232, 250, 0.88)',
        star: '#ffd66e',
        frameTop: '#00e5ff',
        frameBottom: '#ff3df5',
        glow: 'rgba(0, 229, 255, 0.5)',
        corner: 'rgba(0, 229, 255, 0.8)'
      },
      pieces: {
        0: { core: '#101a3c', hi: '#3b57a8', edge: '#7ee8fa', glow: 'rgba(0,229,255,0.75)', label: '黑' },
        1: { core: '#f4f8ff', hi: '#ffffff', edge: '#ff8af8', glow: 'rgba(255,61,245,0.8)', label: '白' }
      },
      ambient: { kind: 'stars', count: 66, colors: ['#ffffff', '#9be8ff', '#ffd6ff', '#c9b8ff'], size: [1, 2.6], speed: 8 }
    },
    {
      id: 'sakura',
      name: '樱落和风',
      tagline: '落樱之间，一子定乾坤',
      motif: 'petal',
      fx: { type: 'sakura' },
      accent: '#ff9ec7',
      accent2: '#ffd6a8',
      bgType: 'sakura',
      bgColors: ['#ffe9f1', '#ffd9e5', '#f4c8dd'],
      decor: {
        sun: { x: 0.78, y: 0.2, r: 0.09, c: '#ffd9b0' },
        mountains: '#e8b7cf'
      },
      board: {
        fill: 'rgba(255, 248, 242, 0.97)',
        line: 'rgba(122, 74, 82, 0.92)',
        star: '#c2607a',
        frameTop: '#ff9ec7',
        frameBottom: '#d4789a',
        glow: 'rgba(255, 158, 199, 0.55)',
        corner: 'rgba(194, 96, 122, 0.85)'
      },
      pieces: {
        0: { core: '#1d1b22', hi: '#4a4556', edge: '#5b525f', glow: 'rgba(60,50,70,0.55)', label: '黑' },
        1: { core: '#fffdf9', hi: '#ffffff', edge: '#c2607a', glow: 'rgba(255,158,199,0.7)', label: '白' }
      },
      ambient: { kind: 'petals', count: 30, colors: ['#ffb7d0', '#ffc9db', '#ff9ec7', '#ffe1ec'], size: [5, 9], speed: 34 }
    },
    {
      id: 'cyber',
      name: '赛博都市',
      tagline: '霓虹之下，电路即战场',
      motif: 'circuit',
      fx: { type: 'matrix' },
      accent: '#22ffd8',
      accent2: '#ff3d81',
      bgType: 'cyber',
      bgColors: ['#05020f', '#140a2e', '#2a0a3a'],
      decor: {
        moon: { x: 0.8, y: 0.18, r: 0.06, c: '#ffd66e' },
        beams: ['rgba(0,255,200,0.5)', 'rgba(255,61,129,0.5)', 'rgba(120,120,255,0.5)']
      },
      board: {
        fill: 'rgba(8, 6, 24, 0.97)',
        line: 'rgba(34, 255, 216, 0.85)',
        star: '#ff3d81',
        frameTop: '#22ffd8',
        frameBottom: '#ff3d81',
        glow: 'rgba(34, 255, 216, 0.5)',
        corner: 'rgba(255, 61, 129, 0.9)'
      },
      pieces: {
        0: { core: '#071018', hi: '#0f3a4a', edge: '#22ffd8', glow: 'rgba(34,255,216,0.8)', label: '黑' },
        1: { core: '#f6f1ff', hi: '#ffffff', edge: '#ff5c9d', glow: 'rgba(255,61,129,0.85)', label: '白' }
      },
      ambient: { kind: 'sparkles', count: 42, colors: ['#22ffd8', '#ff3d81', '#7dd0ff', '#ffffff'], size: [1, 2.4], speed: 22 }
    },
    {
      id: 'lava',
      name: '熔岩深渊',
      tagline: '灼热之息，燃尽虚妄',
      motif: 'flame',
      fx: { type: 'lava' },
      accent: '#ff7b2d',
      accent2: '#ffd166',
      bgType: 'lava',
      bgColors: ['#0a0508', '#1c0a08', '#3a0d08'],
      decor: {
        horizon: '#5a1208',
        cracks: [
          { x: 0.14, y: 0.62, seed: 11 }, { x: 0.36, y: 0.55, seed: 23 },
          { x: 0.62, y: 0.6, seed: 37 }, { x: 0.85, y: 0.66, seed: 41 },
          { x: 0.5, y: 0.78, seed: 53 }, { x: 0.24, y: 0.82, seed: 67 }
        ]
      },
      board: {
        fill: 'rgba(20, 8, 8, 0.97)',
        line: 'rgba(255, 150, 70, 0.85)',
        star: '#ffd166',
        frameTop: '#ff7b2d',
        frameBottom: '#c81d0c',
        glow: 'rgba(255, 123, 45, 0.55)',
        corner: 'rgba(255, 209, 102, 0.9)'
      },
      pieces: {
        0: { core: '#120807', hi: '#3a1a10', edge: '#ff9a3d', glow: 'rgba(255,123,45,0.75)', label: '黑' },
        1: { core: '#fff6ea', hi: '#ffffff', edge: '#ffd166', glow: 'rgba(255,209,102,0.85)', label: '白' }
      },
      ambient: { kind: 'embers', count: 44, colors: ['#ffb347', '#ff7b2d', '#ffd166', '#ff5533'], size: [1.4, 3.2], speed: 30 }
    },
    {
      id: 'aurora',
      name: '极光冰川',
      tagline: '寒光流动，万象冰封',
      motif: 'snow',
      fx: { type: 'aurora' },
      accent: '#7dffb0',
      accent2: '#35f0ff',
      bgType: 'aurora',
      bgColors: ['#020b16', '#06213a', '#0a3550'],
      decor: {
        ribbons: ['#35f0ff', '#7dffb0', '#b48cff'],
        mountains: '#dff3ff'
      },
      board: {
        fill: 'rgba(6, 22, 38, 0.97)',
        line: 'rgba(160, 240, 255, 0.85)',
        star: '#cfe9ff',
        frameTop: '#7dffb0',
        frameBottom: '#35f0ff',
        glow: 'rgba(125, 255, 176, 0.5)',
        corner: 'rgba(180, 140, 255, 0.9)'
      },
      pieces: {
        0: { core: '#0a1b2c', hi: '#1d4a66', edge: '#7dffb0', glow: 'rgba(125,255,176,0.75)', label: '黑' },
        1: { core: '#f4ffff', hi: '#ffffff', edge: '#35f0ff', glow: 'rgba(53,240,255,0.85)', label: '白' }
      },
      ambient: { kind: 'snow', count: 52, colors: ['#ffffff', '#d9f7ff', '#b8ecff'], size: [1.2, 3], speed: 20 }
    },
    {
      id: 'ink',
      name: '水墨丹青',
      tagline: '一笔一划，皆是山河',
      motif: 'ink',
      fx: { type: 'ink' },
      accent: '#3a3a44',
      accent2: '#a33b3b',
      bgType: 'ink',
      bgColors: ['#f6f1e4', '#efe6d2', '#e6dac0'],
      decor: {
        sun: { x: 0.22, y: 0.24, r: 0.055, c: '#b84a3c' },
        layers: ['#8d8a80', '#5f5d57', '#3c3a36']
      },
      board: {
        fill: 'rgba(250, 246, 236, 0.97)',
        line: 'rgba(60, 58, 54, 0.8)',
        star: '#a33b3b',
        frameTop: '#6b655c',
        frameBottom: '#a33b3b',
        glow: 'rgba(90, 85, 75, 0.45)',
        corner: '#a33b3b'
      },
      pieces: {
        0: { core: '#171614', hi: '#403d38', edge: '#57534c', glow: 'rgba(40,38,34,0.5)', label: '黑' },
        1: { core: '#fbf7ec', hi: '#ffffff', edge: '#a33b3b', glow: 'rgba(163,59,59,0.6)', label: '白' }
      },
      ambient: { kind: 'mist', count: 12, colors: ['#ffffff', '#efe6d2'], size: [11, 20], speed: 6 }
    },
    {
      id: 'candy',
      name: '糖果梦境',
      tagline: '甜到犯规的梦幻棋局',
      motif: 'heart',
      fx: { type: 'candy' },
      accent: '#ff86c8',
      accent2: '#8ad7ff',
      bgType: 'candy',
      bgColors: ['#ffe3f1', '#f0d9ff', '#c9e9ff'],
      decor: {
        arcs: ['#ff86c8', '#ffd166', '#8ad7ff', '#b18cff'],
        clouds: '#ffffff'
      },
      board: {
        fill: 'rgba(255, 252, 254, 0.97)',
        line: 'rgba(150, 110, 170, 0.65)',
        star: '#ff86c8',
        frameTop: '#ff86c8',
        frameBottom: '#8ad7ff',
        glow: 'rgba(255, 134, 200, 0.5)',
        corner: 'rgba(177, 140, 255, 0.9)'
      },
      pieces: {
        0: { core: '#2a2030', hi: '#5a4566', edge: '#8ad7ff', glow: 'rgba(138,215,255,0.7)', label: '黑' },
        1: { core: '#fff8fe', hi: '#ffffff', edge: '#ff86c8', glow: 'rgba(255,134,200,0.8)', label: '白' }
      },
      ambient: { kind: 'bubbles', count: 24, colors: ['#ffffff', '#ffd9ef', '#d9f1ff'], size: [4, 12], speed: 18 }
    }
  ];

  function ensureDecor(theme, w, h) {
    const d = theme._d;
    if (d && Math.abs(d.w - w) < 4 && Math.abs(d.h - h) < 4) return d;
    const rng = mulberry32(theme.id.length * 7919 + 1337);
    const dec = {};
    dec.w = w;
    dec.h = h;

    dec.stars = [];
    const starCount = theme.ambient.kind === 'stars' ? theme.ambient.count : Math.round(theme.ambient.count * 0.45);
    for (let i = 0; i < starCount; i++) {
      dec.stars.push({
        x: rng(), y: rng() * 0.7,
        r: 0.5 + rng() * 1.9,
        ph: rng() * Math.PI * 2,
        sp: 0.6 + rng() * 1.6,
        c: theme.ambient.colors[Math.floor(rng() * theme.ambient.colors.length)],
        tw: rng() > 0.35
      });
    }

    if (theme.bgType === 'cyber') {
      dec.buildings = [];
      const n = 16 + Math.floor(rng() * 8);
      let x = -0.02;
      for (let i = 0; i < n; i++) {
        const bw = 0.035 + rng() * 0.09;
        const bh = 0.12 + rng() * 0.4;
        const b = { x: x, w: bw, h: bh, seed: Math.floor(rng() * 9999) };
        b.lights = [];
        const rows = Math.max(1, Math.floor((bh * h) / 13));
        const cols = Math.max(1, Math.floor((bw * w) / 9));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (rng() < 0.38) {
              b.lights.push({ r: r, c: c, warm: rng() < 0.5 });
            }
          }
        }
        dec.buildings.push(b);
        x += bw + 0.004 + rng() * 0.01;
      }
    }

    if (theme.bgType === 'lava') {
      dec.ridges = [];
      let rx = -0.05;
      while (rx < 1.05) {
        dec.ridges.push({
          x: rx,
          y: 0.42 + rng() * 0.2,
          w: 0.1 + rng() * 0.22
        });
        rx += 0.08 + rng() * 0.14;
      }
    }

    if (theme.bgType === 'ink' || theme.bgType === 'sakura' || theme.bgType === 'aurora') {
      dec.mtns = [];
      let mx = -0.05;
      while (mx < 1.05) {
        dec.mtns.push({
          x: mx,
          h: 0.12 + rng() * 0.26,
          w: 0.1 + rng() * 0.24
        });
        mx += 0.06 + rng() * 0.14;
      }
    }

    theme._d = dec;
    return dec;
  }

  function drawNeon(ctx, th, w, h, t) {
    const dec = ensureDecor(th, w, h);
    for (const n of th.decor.nebula) {
      const x = n.x * w;
      const y = n.y * h;
      const r = n.r * Math.min(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, withAlpha(n.c, n.a));
      g.addColorStop(1, withAlpha(n.c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (const s of dec.stars) {
      const a = s.tw ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)) : 0.75;
      ctx.fillStyle = withAlpha(s.c, a);
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.7) {
        ctx.fillStyle = withAlpha(s.c, a * 0.4);
        ctx.fillRect(s.x * w - s.r * 3, s.y * h - 0.5, s.r * 6, 1);
        ctx.fillRect(s.x * w - 0.5, s.y * h - s.r * 3, 1, s.r * 6);
      }
    }
    if (th.decor.shooting) {
      const cycle = (t * 0.16 + 2.4) % 7.2;
      if (cycle < 1.35) {
        const p = cycle / 1.35;
        const x0 = w * (0.72 + p * 0.5);
        const y0 = h * (0.12 + p * 0.22);
        const x1 = x0 + 70;
        const y1 = y0 + 24;
        const tail = 130 * (1 - p * 0.6);
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 - tail * 0.32, y0 - tail * 0.12);
        ctx.stroke();
      }
    }
  }

  function drawMountains(ctx, dec, w, h, color, baseY) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const m of dec.mtns) {
      const x = m.x * w;
      const y = baseY - m.h * h;
      const peakX = x + m.w * w * 0.5;
      ctx.quadraticCurveTo(x + m.w * w * 0.22, y + m.h * h * 0.35, peakX, y);
      ctx.quadraticCurveTo(x + m.w * w * 0.78, y + m.h * h * 0.35, x + m.w * w, baseY);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  function drawSakura(ctx, th, w, h) {
    const dec = ensureDecor(th, w, h);
    const sun = th.decor.sun;
    const sx = sun.x * w;
    const sy = sun.y * h;
    const sr = sun.r * Math.min(w, h);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
    sg.addColorStop(0, withAlpha(sun.c, 0.9));
    sg.addColorStop(0.35, withAlpha(sun.c, 0.45));
    sg.addColorStop(1, withAlpha(sun.c, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(sx - sr * 4, sy - sr * 4, sr * 8, sr * 8);
    ctx.fillStyle = withAlpha(sun.c, 0.95);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const cx = w * (0.2 + i * 0.22) + Math.sin(i * 3.7) * 40;
      const cy = h * (0.14 + (i % 2) * 0.09);
      const cw = 90 + i * 14;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, cw * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawMountains(ctx, dec, w, h, th.decor.mountains, h * 0.86);
    const haze = ctx.createLinearGradient(0, h * 0.7, 0, h);
    haze.addColorStop(0, 'rgba(255,230,238,0)');
    haze.addColorStop(1, 'rgba(255,230,238,0.75)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  }

  function drawCyber(ctx, th, w, h, t) {
    const dec = ensureDecor(th, w, h);
    const moon = th.decor.moon;
    const mx = moon.x * w;
    const my = moon.y * h;
    const mr = moon.r * Math.min(w, h);
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 5);
    mg.addColorStop(0, withAlpha(moon.c, 0.75));
    mg.addColorStop(1, withAlpha(moon.c, 0));
    ctx.fillStyle = mg;
    ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    ctx.strokeStyle = withAlpha(moon.c, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.stroke();

    const horizon = h * 0.72;
    for (const b of dec.buildings) {
      const bx = b.x * w;
      const bw = b.w * w;
      const bh = b.h * h;
      ctx.fillStyle = 'rgba(6, 4, 20, 0.92)';
      ctx.fillRect(bx, horizon - bh, bw, bh);
      ctx.strokeStyle = 'rgba(34, 255, 216, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 1, horizon - bh + 1, bw - 2, bh - 2);
      for (const l of b.lights) {
        const lx = bx + 3 + l.c * 8;
        const ly = horizon - bh + 4 + l.r * 12;
        ctx.fillStyle = l.warm ? 'rgba(255, 214, 110, 0.9)' : 'rgba(125, 208, 255, 0.85)';
        ctx.fillRect(lx, ly, 4, 6);
      }
    }
    const lineG = ctx.createLinearGradient(0, horizon, 0, h);
    lineG.addColorStop(0, 'rgba(34,255,216,0.55)');
    lineG.addColorStop(1, 'rgba(34,255,216,0.05)');
    ctx.strokeStyle = lineG;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w, horizon);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(34,255,216,0.16)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 7; i++) {
      const vy = horizon + ((h - horizon) * i) / 8;
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.lineTo(w, vy);
      ctx.stroke();
    }
    for (let i = 1; i <= 6; i++) {
      const px = (w / 2) + (i - 3) * w * 0.09;
      ctx.beginPath();
      ctx.moveTo(px, horizon);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
    }
    const scanX = w * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.35)));
    const sg = ctx.createLinearGradient(scanX - 60, 0, scanX + 60, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, horizon, w, h - horizon);
    const beamX = w * (0.16 + 0.68 * (0.5 + 0.5 * Math.sin(t * 0.6 + 2)));
    const bg = ctx.createLinearGradient(beamX - 3, 0, beamX + 3, 0);
    bg.addColorStop(0, 'rgba(255,255,255,0)');
    bg.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    bg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, horizon);
  }

  function drawLava(ctx, th, w, h, t) {
    const dec = ensureDecor(th, w, h);
    ctx.fillStyle = 'rgba(6, 2, 2, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const r of dec.ridges) {
      const x = r.x * w;
      const y = r.y * h;
      ctx.lineTo(x, y);
      ctx.lineTo(x + r.w * w * 0.5, y + h * 0.1);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 1.05, h * 0.75);
    glow.addColorStop(0, 'rgba(255, 90, 20, 0.5)');
    glow.addColorStop(0.5, 'rgba(200, 40, 10, 0.28)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, h * 0.3, w, h * 0.7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const c of th.decor.cracks) {
      const cx = c.x * w;
      const cy = c.y * h;
      ctx.strokeStyle = 'rgba(255, 150, 50, 0.7)';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(255, 100, 20, 0.9)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(cx - 34, cy);
      const rng2 = mulberry32(c.seed);
      for (let i = 1; i <= 7; i++) {
        const nx = cx - 34 + i * 9 + (rng2() - 0.5) * 7;
        const ny = cy + (rng2() - 0.5) * 26 + Math.sin(t * 1.4 + i + c.seed) * 3;
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAurora(ctx, th, w, h, t) {
    const dec = ensureDecor(th, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    th.decor.ribbons.forEach(function (color, i) {
      const baseY = h * (0.22 + i * 0.13);
      const amp = 26 + i * 12;
      const speed = 0.5 + i * 0.22;
      ctx.strokeStyle = withAlpha(color, 0.3);
      ctx.lineWidth = 3 + i * 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let x = -10; x <= w + 10; x += 8) {
        const y = baseY + Math.sin(x * 0.004 + t * speed + i * 2) * amp
          + Math.sin(x * 0.013 - t * speed * 0.7) * amp * 0.4;
        if (x === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();
    for (const s of dec.stars) {
      const a = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = withAlpha(s.c, a);
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    drawMountains(ctx, dec, w, h, withAlpha(th.decor.mountains, 0.85), h * 0.86);
    const snow = ctx.createLinearGradient(0, h * 0.7, 0, h);
    snow.addColorStop(0, 'rgba(255,255,255,0)');
    snow.addColorStop(1, 'rgba(235,250,255,0.35)');
    ctx.fillStyle = snow;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  }

  function drawInk(ctx, th, w, h) {
    const dec = ensureDecor(th, w, h);
    const rng = mulberry32(20260810);
    for (let i = 0; i < 240; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 0.4 + rng() * 1.1;
      ctx.fillStyle = rng() > 0.5 ? 'rgba(90, 80, 60, 0.045)' : 'rgba(120, 105, 80, 0.035)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const sun = th.decor.sun;
    const sx = sun.x * w;
    const sy = sun.y * h;
    const sr = sun.r * Math.min(w, h);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3);
    sg.addColorStop(0, withAlpha(sun.c, 0.85));
    sg.addColorStop(1, withAlpha(sun.c, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
    ctx.fillStyle = sun.c;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    th.decor.layers.forEach(function (color, i) {
      const rng2 = mulberry32(900 + i * 77);
      const baseY = h * (0.62 + i * 0.12);
      const alpha = 0.22 + i * 0.2;
      ctx.fillStyle = withAlpha(color, alpha);
      ctx.beginPath();
      ctx.moveTo(0, h);
      let x = -0.04 * w;
      while (x < w * 1.06) {
        const px = Math.max(0, Math.min(w, x));
        const py = baseY - (0.08 + rng2() * 0.22) * h;
        ctx.lineTo(px, py);
        x += (0.08 + rng2() * 0.14) * w;
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(50, 48, 44, 0.5)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const bx = w * (0.1 + i * 0.2) + Math.sin(i * 2.3) * 20;
      const by = h * (0.2 + (i % 3) * 0.07);
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 4);
      ctx.quadraticCurveTo(bx, by - 12, bx + 8, by - 4);
      ctx.moveTo(bx + 8, by - 4);
      ctx.quadraticCurveTo(bx + 18, by + 2, bx + 26, by - 3);
      ctx.stroke();
    }
  }

  function drawCandy(ctx, th, w, h) {
    const dec = ensureDecor(th, w, h);
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.15 + i * 0.3) + Math.sin(i * 4.2) * 60;
      const cy = h * (0.1 + (i % 2) * 0.08);
      const cw = 130 + i * 26;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
      g.addColorStop(0, 'rgba(255,255,255,0.92)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, cw * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    th.decor.arcs.forEach(function (c, i) {
      ctx.strokeStyle = withAlpha(c, 0.34);
      ctx.lineWidth = 9 - i;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, 120 + i * 26, Math.PI * 1.02, Math.PI * 1.62);
      ctx.stroke();
    });
    const rng = mulberry32(77);
    for (let i = 0; i < 16; i++) {
      const x = rng() * w;
      const y = h * (0.5 + rng() * 0.5);
      const r = 2 + rng() * 5;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackground(ctx, theme, w, h, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, theme.bgColors[0]);
    g.addColorStop(0.55, theme.bgColors[1]);
    g.addColorStop(1, theme.bgColors[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (theme.bgType === 'neon') drawNeon(ctx, theme, w, h, t);
    else if (theme.bgType === 'sakura') drawSakura(ctx, theme, w, h);
    else if (theme.bgType === 'cyber') drawCyber(ctx, theme, w, h, t);
    else if (theme.bgType === 'lava') drawLava(ctx, theme, w, h, t);
    else if (theme.bgType === 'aurora') drawAurora(ctx, theme, w, h, t);
    else if (theme.bgType === 'ink') drawInk(ctx, theme, w, h);
    else if (theme.bgType === 'candy') drawCandy(ctx, theme, w, h);
    ctx.restore();
  }

  function createAmbient(theme, ps, w, h) {
    const cfg = theme.ambient;
    const rng = mulberry32(theme.id.length * 104729 + 7);
    const spawn = function (n) {
      for (let i = 0; i < n; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const color = cfg.colors[Math.floor(rng() * cfg.colors.length)];
        const size = cfg.size[0] + rng() * (cfg.size[1] - cfg.size[0]);
        const p = {
          x: x, y: y,
          vx: 0, vy: 0,
          size: size,
          color: color,
          type: cfg.kind,
          life: 9999, maxLife: 9999,
          sway: 10 + rng() * 26,
          swayFreq: 0.4 + rng() * 1.2,
          swayPhase: rng() * Math.PI * 2,
          rot: rng() * Math.PI * 2,
          vr: (rng() - 0.5) * 2,
          alpha: cfg.kind === 'mist' ? 0.26 + rng() * 0.22 : 0.5 + rng() * 0.5,
          additive: cfg.kind === 'stars' || cfg.kind === 'embers' || cfg.kind === 'sparkles'
        };
        p.layer = 'bg';
        if (cfg.kind === 'petals') {
          p.vy = cfg.speed * (0.6 + rng() * 0.7);
          p.vx = 8 + rng() * 16;
          p.rotV = (rng() - 0.5) * 2.4;
        } else if (cfg.kind === 'snow') {
          p.vy = cfg.speed * (0.5 + rng() * 0.6);
          p.vx = 6 + rng() * 12;
        } else if (cfg.kind === 'embers') {
          p.vy = -(cfg.speed * (0.6 + rng() * 0.8));
          p.vx = (rng() - 0.5) * 18;
        } else if (cfg.kind === 'bubbles') {
          p.vy = -(cfg.speed * (0.4 + rng() * 0.7));
          p.vx = (rng() - 0.5) * 12;
          p.vr = (rng() - 0.5) * 0.8;
        } else if (cfg.kind === 'mist') {
          p.vx = cfg.speed * (0.4 + rng() * 0.5);
          p.vy = 0;
          p.sway = 40 + rng() * 60;
        } else {
          p.vx = (rng() - 0.5) * cfg.speed * 0.4;
          p.vy = (rng() - 0.5) * cfg.speed * 0.4;
          p.tw = true;
        }
        ps.emit(p);
      }
    };
    spawn(cfg.count);
    const timer = { t: 0, rate: 0.8 };
    return {
      update: function (dt) {
        timer.t += dt;
        if (timer.t >= timer.rate) {
          timer.t = 0;
          spawn(Math.max(1, Math.floor(cfg.count / 40)));
        }
      }
    };
  }

  // ---------------- 主题专属特效 ----------------

  function fxQuantum(tier, x, y, colors, brk) {
    const c = [colors[0], colors[1], '#ffffff'];
    if (brk) {
      window.FX.polyRing(x, y, 96, colors[0], 6, 0.65, 3.4, 18);
      window.FX.burst(x, y, c, 20, { speed: 250, size: 3, life: 0.95 });
      window.FX.flash(colors[0], 0.13, 0.3);
    } else if (tier >= 5) {
      window.FX.polyRing(x, y, 130, colors[0], 6, 0.75, 4, 22);
      window.FX.polyRing(x, y, 88, colors[1], 6, 0.55, 2.6, 14);
      window.FX.burst(x, y, c, 32, { speed: 320, size: 3.4, life: 1.1 });
      window.FX.flash(colors[0], 0.16, 0.34);
    } else if (tier >= 4) {
      window.FX.polyRing(x, y, 102, colors[0], 6, 0.6, 3.6, 18);
      window.FX.burst(x, y, c, 22, { speed: 250, size: 3, life: 1 });
      window.FX.flash(colors[0], 0.14, 0.32);
    } else {
      window.FX.polyRing(x, y, 74, colors[1], 6, 0.5, 2.4, 12);
      window.FX.burst(x, y, c, 14, { speed: 190, size: 2.6, life: 0.9 });
    }
  }

  function fxSakura(tier, x, y, colors, brk) {
    const c = [colors[0], colors[1], '#ffffff'];
    const n = brk ? 18 : tier >= 5 ? 26 : tier >= 4 ? 18 : 10;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        size: 4 + Math.random() * 4,
        color: c[i % 3],
        type: 'petal',
        life: 0.9 + Math.random() * 0.6,
        drag: 1.8,
        vr: (Math.random() - 0.5) * 6,
        sway: 18, swayFreq: 2 + Math.random() * 2,
        swayPhase: Math.random() * 6.28,
        alpha: 0.95
      });
    }
    window.FX.ring(x, y, colors[0], tier >= 5 ? 130 : brk ? 96 : 90, 0.6, 3, 14);
    if (tier >= 4 || brk) window.FX.flash('#ffd9ef', 0.16, 0.34);
  }

  function fxMatrix(tier, x, y, colors, brk) {
    const chars = '01アイウエオ量子ネオン';
    const c = [colors[0], colors[1], '#ffffff'];
    const n = brk ? 16 : tier >= 5 ? 24 : tier >= 4 ? 16 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 70 + Math.random() * 140;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        size: 2 + Math.random() * 2.4,
        color: c[Math.floor(Math.random() * 3)],
        type: 'glyph',
        char: chars[Math.floor(Math.random() * chars.length)],
        life: 0.7 + Math.random() * 0.6,
        drag: 2,
        alpha: 0.9,
        additive: true
      });
    }
    window.FX.polyRing(x, y, brk ? 92 : tier >= 5 ? 132 : tier >= 4 ? 106 : 78, colors[0], 4, 0.55, 3, 16);
    if (tier >= 4 || brk) window.FX.flash(colors[0], 0.15, 0.3);
  }

  function fxLava(tier, x, y, colors, brk) {
    const c = ['#ffb347', '#ff7b2d', '#ffd166', '#ff5533'];
    const n = brk ? 20 : tier >= 5 ? 30 : tier >= 4 ? 22 : 12;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const v = 120 + Math.random() * 180;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        size: 2 + Math.random() * 2.6,
        color: c[Math.floor(Math.random() * 4)],
        type: 'ember',
        life: 0.8 + Math.random() * 0.7,
        drag: 1.6,
        gravity: 60,
        alpha: 0.95,
        additive: true
      });
    }
    window.FX.ring(x, y, '#ff7b2d', brk ? 96 : tier >= 5 ? 140 : tier >= 4 ? 110 : 80, 0.65, 3.4, 18);
    if (tier >= 4 || brk) window.FX.flash('#ff7b2d', 0.16, 0.32);
  }

  function fxAurora(tier, x, y, colors, brk) {
    const c = ['#7dffb0', '#35f0ff', '#ffffff', '#b48cff'];
    const n = brk ? 18 : tier >= 5 ? 28 : tier >= 4 ? 20 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 170;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        size: 2 + Math.random() * 2.2,
        color: c[Math.floor(Math.random() * 4)],
        type: 'star',
        life: 0.8 + Math.random() * 0.7,
        drag: 2,
        alpha: 0.95,
        additive: true,
        vr: (Math.random() - 0.5) * 6
      });
    }
    window.FX.polyRing(x, y, brk ? 94 : tier >= 5 ? 134 : tier >= 4 ? 108 : 78, colors[0], 12, 0.55, 3, 16);
    window.FX.flash('#d9f7ff', brk ? 0.18 : tier >= 4 ? 0.2 : 0.1, 0.3);
  }

  function fxInk(tier, x, y, colors, brk) {
    const c = ['rgba(40,38,34,0.85)', 'rgba(70,66,60,0.8)'];
    const n = brk ? 16 : tier >= 5 ? 24 : tier >= 4 ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 50 + Math.random() * 120;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        size: 3 + Math.random() * 4,
        color: c[Math.floor(Math.random() * 2)],
        type: 'ink',
        life: 0.8 + Math.random() * 0.6,
        drag: 2.6,
        alpha: 0.8
      });
    }
    window.FX.bolt(x - 70 + Math.random() * 30, y - 10, x + 70 - Math.random() * 30, y + 10, '#a33b3b', 10, 8, 3.5);
    window.FX.ring(x, y, '#a33b3b', brk ? 96 : tier >= 5 ? 130 : tier >= 4 ? 105 : 78, 0.6, 2.6, 12);
  }

  function fxCandy(tier, x, y, colors, brk) {
    const c = ['#ff86c8', '#ffd166', '#8ad7ff', '#b18cff', '#ffffff'];
    const n = brk ? 18 : tier >= 5 ? 28 : tier >= 4 ? 20 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 90 + Math.random() * 180;
      window.PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
        size: 3 + Math.random() * 2.5,
        color: c[Math.floor(Math.random() * 5)],
        type: 'confetti',
        life: 1 + Math.random() * 0.6,
        drag: 1.6,
        gravity: 120,
        vr: (Math.random() - 0.5) * 10,
        alpha: 0.95
      });
    }
    for (let i = 0; i < 6; i++) {
      window.PS.emit({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        size: 3 + Math.random() * 4,
        color: '#ffffff',
        type: 'bubble',
        life: 1 + Math.random() * 0.4,
        alpha: 0.8
      });
    }
    window.FX.polyRing(x, y, brk ? 94 : tier >= 5 ? 134 : tier >= 4 ? 108 : 78, colors[0], 5, 0.55, 3, 16);
    if (tier >= 4 || brk) window.FX.flash('#ffffff', 0.14, 0.3);
  }

  function playThemeFx(theme, kind, tier, x, y, colors) {
    const t = theme.fx ? theme.fx.type : 'quantum';
    const brk = kind === 'break';
    if (t === 'sakura') fxSakura(tier, x, y, colors, brk);
    else if (t === 'matrix') fxMatrix(tier, x, y, colors, brk);
    else if (t === 'lava') fxLava(tier, x, y, colors, brk);
    else if (t === 'aurora') fxAurora(tier, x, y, colors, brk);
    else if (t === 'ink') fxInk(tier, x, y, colors, brk);
    else if (t === 'candy') fxCandy(tier, x, y, colors, brk);
    else fxQuantum(tier, x, y, colors, brk);
  }

  // ---------------- 棋子雕纹 ----------------

  function motifPath(m, ctx, r) {
    ctx.beginPath();
    if (m === 'star') {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (m === 'petal') {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.55, r * 0.26, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      return;
    } else if (m === 'circuit') {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (m === 'flame') {
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.55, r * 0.5, 0, r);
      ctx.bezierCurveTo(-r * 0.55, r * 0.5, -r * 0.9, -r * 0.2, 0, -r);
      ctx.closePath();
    } else if (m === 'snow') {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        const cx = Math.cos(a);
        const sy = Math.sin(a);
        ctx.moveTo(-cx * r, -sy * r);
        ctx.lineTo(cx * r, sy * r);
        const mx = cx * r * 0.5;
        const my = sy * r * 0.5;
        ctx.moveTo(mx - sy * r * 0.16, my + cx * r * 0.16);
        ctx.lineTo(mx + sy * r * 0.16, my - cx * r * 0.16);
      }
    } else if (m === 'ink') {
      ctx.moveTo(-r * 0.8, r * 0.35);
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.75, r * 0.4, r * 0.2);
      ctx.moveTo(-r * 0.45, r * 0.5);
      ctx.quadraticCurveTo(r * 0.25, -r * 0.3, r * 0.75, r * 0.6);
    } else if (m === 'heart') {
      ctx.moveTo(0, r * 0.7);
      ctx.bezierCurveTo(-r, r * 0.05, -r * 0.6, -r * 0.65, 0, -r * 0.2);
      ctx.bezierCurveTo(r * 0.6, -r * 0.65, r, r * 0.05, 0, r * 0.7);
      ctx.closePath();
    }
  }

  function drawMotif(theme, ctx, r, darkPiece) {
    const m = theme.motif;
    if (!m) return;
    const main = darkPiece ? 'rgba(255,255,255,0.62)' : 'rgba(25,25,32,0.55)';
    const shadow = darkPiece ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.65)';
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.3, r * 0.11);
    ctx.strokeStyle = shadow;
    ctx.save();
    ctx.translate(1.3, 1.6);
    motifPath(m, ctx, r * 0.65);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = main;
    motifPath(m, ctx, r * 0.65);
    ctx.stroke();
    ctx.shadowColor = main;
    ctx.shadowBlur = 3;
    ctx.lineWidth = Math.max(1.2, r * 0.08);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  window.Theme = {
    ALL: THEMES,
    random: function (excludeId) {
      const pool = THEMES.filter(function (t) { return t.id !== excludeId; });
      return pool[Math.floor(Math.random() * pool.length)];
    },
    byId: function (id) {
      return THEMES.find(function (t) { return t.id === id; }) || THEMES[0];
    },
    drawBackground: drawBackground,
    createAmbient: createAmbient,
    playThemeFx: playThemeFx,
    drawMotif: drawMotif,
    clearDecor: function (theme) {
      theme._d = null;
    }
  };
})();
