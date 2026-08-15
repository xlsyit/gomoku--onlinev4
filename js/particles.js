(function () {
  'use strict';

  const parts = [];
  let lastId = 0;
  const CAP = 1300;

  function emit(o) {
    if (parts.length >= CAP) parts.shift();
    const p = {
      id: ++lastId,
      x: o.x || 0,
      y: o.y || 0,
      vx: o.vx || 0,
      vy: o.vy || 0,
      size: o.size || 3,
      color: o.color || '#ffffff',
      type: o.type || 'dot',
      life: o.life !== undefined ? o.life : 1,
      maxLife: o.maxLife || (o.life !== undefined ? o.life : 1),
      gravity: o.gravity || 0,
      drag: o.drag !== undefined ? o.drag : 0,
      sway: o.sway || 0,
      swayFreq: o.swayFreq || 0,
      swayPhase: o.swayPhase || 0,
      rot: o.rot || 0,
      vr: o.vr || 0,
      alpha: o.alpha !== undefined ? o.alpha : 1,
      additive: !!o.additive,
      tw: !!o.tw,
      char: o.char || '',
      layer: o.layer || 'fg',
      born: o.born || 0
    };
    p.maxLife = p.life;
    parts.push(p);
    return p;
  }

  function update(dt, time) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      const age = p.maxLife - p.life;
      p.vx *= Math.max(0, 1 - p.drag * dt);
      p.vy += p.gravity * dt;
      const sway = p.sway * Math.sin((time + p.swayPhase) * p.swayFreq);
      p.x += (p.vx + sway) * dt;
      p.y += p.vy * dt;
      p.rot += (p.vr || 0) * dt;
    }
  }

  function drawStar(ctx, p) {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.moveTo(0, -s * 2.4);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.4, s * 2.4, 0);
    ctx.quadraticCurveTo(s * 0.4, s * 0.4, 0, s * 2.4);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.4, -s * 2.4, 0);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.4, 0, -s * 2.4);
    ctx.fill();
    ctx.restore();
  }

  function drawSpark(ctx, p) {
    const s = p.size * (0.5 + p.life / p.maxLife);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.globalAlpha = p.alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, s * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 3, 0);
    ctx.lineTo(s * 1.4, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawPetal(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = p.alpha * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-p.size * 0.15, -p.size * 0.12, p.size * 0.5, p.size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBubble(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alpha * (0.5 + 0.5 * (p.life / p.maxLife));
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = p.alpha * 0.8;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMist(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.alpha * (p.life / p.maxLife);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    g.addColorStop(0, p.color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawConfetti(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha * Math.min(1, p.life / p.maxLife * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size, -p.size * 0.62, p.size * 2, p.size * 1.24);
    ctx.restore();
  }

  function drawInk(ctx, p) {
    const ratio = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = p.alpha * Math.min(1, ratio * 2);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.6);
    g.addColorStop(0, p.color);
    g.addColorStop(1, 'rgba(40,38,34,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGlyph(ctx, p) {
    const ratio = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = p.alpha * Math.min(1, ratio * 2.2);
    ctx.font = '700 ' + Math.max(9, p.size * 2.6) + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillText(p.char || '0', p.x, p.y);
    ctx.restore();
  }

  function draw(ctx, time, layer) {
    const normal = [];
    const additive = [];
    for (const p of parts) {
      if (layer && p.layer !== layer) continue;
      if (p.additive) additive.push(p);
      else normal.push(p);
    }
    ctx.save();
    for (const p of normal) {
      const ratio = p.life / p.maxLife;
      ctx.globalAlpha = p.alpha * Math.min(1, ratio * 2.5);
      if (p.tw) {
        ctx.globalAlpha *= 0.55 + 0.45 * Math.sin((time * 1.5 + p.swayPhase + p.id) * 1.7);
      }
      if (p.type === 'dot' || p.type === 'snow' || p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * Math.max(0.2, ratio)), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star') {
        drawStar(ctx, p);
      } else if (p.type === 'spark') {
        drawSpark(ctx, p);
      } else if (p.type === 'petal') {
        drawPetal(ctx, p);
      } else if (p.type === 'bubble') {
        drawBubble(ctx, p);
      } else if (p.type === 'mist') {
        drawMist(ctx, p);
      } else if (p.type === 'confetti') {
        drawConfetti(ctx, p);
      } else if (p.type === 'ink') {
        drawInk(ctx, p);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of additive) {
      const ratio = p.life / p.maxLife;
      ctx.globalAlpha = p.alpha * Math.min(1, ratio * 2.2);
      if (p.tw) {
        ctx.globalAlpha *= 0.55 + 0.45 * Math.sin((time * 1.5 + p.swayPhase + p.id) * 1.7);
      }
      if (p.type === 'sparkle' || p.type === 'star') {
        drawStar(ctx, p);
      } else if (p.type === 'spark') {
        drawSpark(ctx, p);
      } else if (p.type === 'glyph') {
        drawGlyph(ctx, p);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * Math.max(0.25, ratio)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function clear() {
    parts.length = 0;
  }

  window.PS = {
    emit: emit,
    update: update,
    draw: draw,
    clear: clear,
    count: function () {
      return parts.length;
    }
  };
})();
