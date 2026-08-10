(function () {
  'use strict';

  const rings = [];
  const flashes = [];
  const shakes = [];
  const bolts = [];
  const polys = [];
  let slow = { scale: 1, until: 0 };
  let zoom = { from: 1, to: 1, until: 0, dur: 1 };

  function ring(x, y, color, maxR, dur, lineWidth, glow) {
    rings.push({
      x: x, y: y, r: 2, maxR: maxR || 90,
      color: color || '#ffffff', life: dur || 0.6, dur: dur || 0.6,
      lw: lineWidth || 3, glow: glow || 10
    });
  }

  function flash(color, alpha, dur) {
    flashes.push({ color: color || '#ffffff', alpha: alpha || 0.3, life: dur || 0.3, dur: dur || 0.3 });
  }

  function shake(power, dur) {
    shakes.push({ power: power || 8, life: dur || 0.4, dur: dur || 0.4 });
  }

  function bolt(x1, y1, x2, y2, color, offset, segments, lw) {
    const pts = [{ x: x1, y: y1 }];
    const seg = segments || 9;
    const off = offset || 10;
    for (let i = 1; i < seg; i++) {
      const t = i / seg;
      const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * off * 2 * Math.sin(Math.PI * t);
      const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * off * 2 * Math.sin(Math.PI * t);
      pts.push({ x: nx, y: ny });
    }
    pts.push({ x: x2, y: y2 });
    bolts.push({ pts: pts, color: color || '#aef9ff', life: 0.32, dur: 0.32, lw: lw || 3 });
  }

  function polyRing(x, y, maxR, color, sides, dur, lw, glow) {
    polys.push({
      x: x, y: y, r: 6, maxR: maxR || 90,
      color: color || '#ffffff', sides: sides || 6,
      life: dur || 0.6, dur: dur || 0.6,
      lw: lw || 3, glow: glow || 14,
      rot: Math.random() * Math.PI * 2
    });
  }

  function setSlowmo(scale, dur) {
    slow = { scale: scale, until: performance.now() + dur };
  }

  function getTimeScale(now) {
    if (now < slow.until) return slow.scale;
    return 1;
  }

  function pulseZoom(from, to, dur) {
    zoom = { from: from, to: to, until: performance.now() + dur, dur: dur };
  }

  function getZoomScale(now) {
    if (now >= zoom.until) return 1;
    const p = 1 - (zoom.until - now) / zoom.dur;
    const eased = 1 - Math.pow(1 - p, 3);
    return zoom.from + (zoom.to - zoom.from) * eased;
  }

  function update(dt, now) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life -= dt;
      if (f.life <= 0) flashes.splice(i, 1);
    }
    for (let i = shakes.length - 1; i >= 0; i--) {
      const s = shakes[i];
      s.life -= dt;
      if (s.life <= 0) shakes.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.life -= dt;
      if (b.life <= 0) bolts.splice(i, 1);
    }
    for (let i = polys.length - 1; i >= 0; i--) {
      const p = polys[i];
      p.life -= dt;
      if (p.life <= 0) polys.splice(i, 1);
    }
    return getTimeScale(now);
  }

  function shakeOffset() {
    let ox = 0;
    let oy = 0;
    for (const s of shakes) {
      const k = s.life / s.dur;
      ox += (Math.random() - 0.5) * s.power * 2 * k;
      oy += (Math.random() - 0.5) * s.power * 2 * k;
    }
    return { x: ox, y: oy };
  }

  function draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of rings) {
      const p = 1 - r.life / r.dur;
      const eased = 1 - Math.pow(1 - p, 3);
      const rr = r.r + (r.maxR - r.r) * eased;
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lw * (1 - p * 0.6);
      ctx.shadowColor = r.color;
      ctx.shadowBlur = r.glow;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const b of bolts) {
      const p = 1 - b.life / b.dur;
      ctx.globalAlpha = (1 - p) * 0.95;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.lw * (1 - p * 0.5);
      ctx.lineCap = 'round';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
      ctx.stroke();
    }
    for (const p of polys) {
      const pr = 1 - p.life / p.dur;
      const eased = 1 - Math.pow(1 - pr, 3);
      const rr = p.r + (p.maxR - p.r) * eased;
      ctx.globalAlpha = (1 - pr) * 0.9;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.lw * (1 - pr * 0.6);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + pr * 0.9);
      ctx.beginPath();
      for (let i = 0; i <= p.sides; i++) {
        const a = (i / p.sides) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    for (const f of flashes) {
      const p = f.life / f.dur;
      ctx.globalAlpha = f.alpha * p;
      ctx.fillStyle = f.color;
      ctx.fillRect(-4000, -4000, 8000, 8000);
    }
    ctx.globalAlpha = 1;
  }

  function burst(x, y, colors, count, opts) {
    const o = opts || {};
    const speed = o.speed || 180;
    const size = o.size || 3;
    const life = o.life || 0.9;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.85);
      PS.emit({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: size * (0.6 + Math.random() * 0.9),
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() < 0.42 ? 'star' : 'spark',
        life: life * (0.6 + Math.random() * 0.7),
        drag: 2.2,
        gravity: o.gravity || 0,
        alpha: 0.95,
        additive: true,
        vr: (Math.random() - 0.5) * 8
      });
    }
  }

  function nova(x, y, colors) {
    burst(x, y, colors, 26, { speed: 220, size: 3.4, life: 1 });
    ring(x, y, colors[0], 130, 0.65, 4, 18);
    ring(x, y, colors[1] || colors[0], 70, 0.5, 2.4, 12);
  }

  function comet(x0, y0, x1, y1, colors) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const steps = Math.max(6, Math.floor(len / 16));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const jitter = (Math.random() - 0.5) * 14;
      PS.emit({
        x: x0 + dx * t + (Math.random() - 0.5) * 10,
        y: y0 + dy * t + (Math.random() - 0.5) * 10,
        vx: ux * (60 + Math.random() * 120) + jitter,
        vy: uy * (60 + Math.random() * 120) + (Math.random() - 0.5) * 30,
        size: 2.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() < 0.5 ? 'spark' : 'star',
        life: 0.75 + Math.random() * 0.4,
        drag: 1.6,
        additive: true,
        alpha: 0.9
      });
    }
    burst(x1, y1, colors, 14, { speed: 150, size: 3, life: 0.8 });
  }

  function fireworks(cx, cy) {
    const colors = ['#ffd66e', '#ff86c8', '#7df9ff', '#b18cff', '#7dffb0'];
    for (let i = 0; i < 10; i++) {
      const delay = i * 0.22 + Math.random() * 0.12;
      const x = cx + (Math.random() - 0.5) * Math.min(600, cx * 0.8);
      const y = cy + (Math.random() - 0.5) * Math.min(320, cy * 0.5);
      setTimeout(function () {
        const c = colors[Math.floor(Math.random() * colors.length)];
        burst(x, y, [c, '#ffffff'], 34, { speed: 260, size: 3.6, life: 1.15, gravity: 40 });
        ring(x, y, c, 110, 0.6, 3, 14);
        flash(c, 0.1, 0.18);
      }, delay * 1000);
    }
  }

  function toast(text, x, y, color, small) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (small ? ' small' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color || '#ffffff';
    box.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1150);
  }

  function clear() {
    rings.length = 0;
    flashes.length = 0;
    shakes.length = 0;
    bolts.length = 0;
    polys.length = 0;
  }

  window.FX = {
    ring: ring,
    flash: flash,
    shake: shake,
    bolt: bolt,
    polyRing: polyRing,
    setSlowmo: setSlowmo,
    pulseZoom: pulseZoom,
    getZoomScale: getZoomScale,
    getTimeScale: getTimeScale,
    update: update,
    shakeOffset: shakeOffset,
    draw: draw,
    burst: burst,
    nova: nova,
    comet: comet,
    fireworks: fireworks,
    toast: toast,
    clear: clear
  };
})();
