(function () {
  'use strict';

  var GC = window.GC;
  var SIZE = GC.SIZE;
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');

  var els = {
    hud: document.getElementById('hud'),
    cover: document.getElementById('cover'),
    winOverlay: document.getElementById('winOverlay'),
    turnChip: document.getElementById('turnChip'),
    themeChip: document.getElementById('themeChip'),
    comboChip: document.getElementById('comboChip'),
    winTitle: document.getElementById('winTitle'),
    winMeta: document.getElementById('winMeta'),
    winEmblem: document.getElementById('winEmblem'),
    winRematchArea: document.getElementById('winRematchArea'),
    winRematchStatus: document.getElementById('winRematchStatus'),
    winNormalActions: document.getElementById('winNormalActions'),
    btnRematch: document.getElementById('btnRematch'),
    btnAuto: document.getElementById('btnAuto'),
    btnMenu: document.getElementById('btnMenu'),
    btnRestart: document.getElementById('btnRestart'),
    btnAgain: document.getElementById('btnAgain'),
    btnBackWin: document.getElementById('btnBackWin'),
    btnMuteGame: document.getElementById('btnMuteGame'),
    btnMuteCover: document.getElementById('btnMuteCover')
  };

  var W = 0;
  var H = 0;
  var DPR = 1;
  var time = 0;
  var last = performance.now();
  var scene = 'cover';
  var game = null;
  var cover = null;
  var raf = 0;
  var activeAmbient = null;
  var options = {};

  function inB(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  }

  function withAlpha(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  function easeOutBack(p) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  }

  function show(el) {
    el.classList.remove('hidden');
  }

  function hide(el) {
    el.classList.add('hidden');
  }

  // ---------------- 模拟与规则 ----------------

  function createSim() {
    var board = [];
    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) row.push(0);
      board.push(row);
    }
    return {
      board: board,
      current: 1,
      winner: 0,
      winLine: null,
      lastMove: null,
      moves: 0
    };
  }

  function analyzeMove(board, r, c, p) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    var patterns = [];
    for (var d = 0; d < 4; d++) {
      var dr = dirs[d][0];
      var dc = dirs[d][1];
      var len = 1;
      for (var rr = r + dr, cc = c + dc; inB(rr, cc) && board[rr][cc] === p; rr += dr, cc += dc) len++;
      for (var rr = r - dr, cc = c - dc; inB(rr, cc) && board[rr][cc] === p; rr -= dr, cc -= dc) len++;
      var e1 = inB(r + dr, c + dc) && board[r + dr][c + dc] === 0 ? 1 : 0;
      var e2 = inB(r - dr, c - dc) && board[r - dr][c - dc] === 0 ? 1 : 0;
      patterns.push({ dir: d, len: len, open: e1 + e2 });
    }
    var five = patterns.find(function (x) { return x.len >= 5; });
    if (five) {
      return { tier: 6, len: five.len, open: five.open, dir: five.dir, patterns: patterns, strong: 1 };
    }
    var maxTier = 0;
    var maxLen = 0;
    var maxOpen = 0;
    var maxDir = 0;
    for (var i = 0; i < patterns.length; i++) {
      var ptn = patterns[i];
      var tier = 0;
      if (ptn.len === 4) tier = ptn.open >= 1 ? 4 : 0;
      else if (ptn.len === 3) tier = ptn.open === 2 ? 3 : ptn.open === 1 ? 2 : 0;
      else if (ptn.len === 2 && ptn.open >= 1) tier = 1;
      if (tier > maxTier) {
        maxTier = tier;
        maxLen = ptn.len;
        maxOpen = ptn.open;
        maxDir = ptn.dir;
      }
    }
    var strong = patterns.filter(function (x) { return x.len >= 3 && x.open >= 1; }).length;
    if (strong >= 2 && maxTier >= 3) maxTier = 5;
    return { tier: maxTier, len: maxLen, open: maxOpen, dir: maxDir, patterns: patterns, strong: strong };
  }

  function findWinLine(board, r, c, p) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (var d = 0; d < 4; d++) {
      var dr = dirs[d][0];
      var dc = dirs[d][1];
      var len = 1;
      for (var rr = r + dr, cc = c + dc; inB(rr, cc) && board[rr][cc] === p; rr += dr, cc += dc) len++;
      for (var rr = r - dr, cc = c - dc; inB(rr, cc) && board[rr][cc] === p; rr -= dr, cc -= dc) len++;
      if (len >= 5) {
        var r1 = r;
        var c1 = c;
        while (inB(r1 - dr, c1 - dc) && board[r1 - dr][c1 - dc] === p) {
          r1 -= dr;
          c1 -= dc;
        }
        var r2 = r;
        var c2 = c;
        while (inB(r2 + dr, c2 + dc) && board[r2 + dr][c2 + dc] === p) {
          r2 += dr;
          c2 += dc;
        }
        return { r1: r1, c1: c1, r2: r2, c2: c2 };
      }
    }
    return null;
  }

  function isBreakingMove(board, r, c, opp) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    var best = 0;
    for (var d = 0; d < 4; d++) {
      var dr = dirs[d][0];
      var dc = dirs[d][1];
      var a = 0;
      var rr = r + dr;
      var cc = c + dc;
      while (inB(rr, cc) && board[rr][cc] === opp) {
        a++;
        rr += dr;
        cc += dc;
      }
      var openA = inB(rr, cc) && board[rr][cc] === 0;
      var b = 0;
      rr = r - dr;
      cc = c - dc;
      while (inB(rr, cc) && board[rr][cc] === opp) {
        b++;
        rr -= dr;
        cc -= dc;
      }
      var openB = inB(rr, cc) && board[rr][cc] === 0;
      var total = a + b;
      var tier = 0;
      if (total >= 5) tier = 5;
      else if (total === 4 && (openA || openB)) tier = 4;
      else if (total === 3 && openA && openB) tier = 3;
      if (tier > best) best = tier;
    }
    return best;
  }

  function luminance(hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // ---------------- 棋盘几何 ----------------

  function boardGeom() {
    var pad = Math.max(22, Math.min(W, H) * 0.04);
    var side = Math.min(W, H) * 0.78;
    var cell = Math.max(9, (side - pad * 2) / (SIZE - 1));
    var ox = (W - side) / 2;
    var oy = (H - side) / 2;
    return { pad: pad, side: side, cell: cell, ox: ox, oy: oy };
  }

  function ix(c) {
    var g = boardGeom();
    return g.ox + g.pad + c * g.cell;
  }

  function iy(r) {
    var g = boardGeom();
    return g.oy + g.pad + r * g.cell;
  }

  function cellAt(px, py) {
    var g = boardGeom();
    if (px < g.ox - 8 || px > g.ox + g.side + 8 || py < g.oy - 8 || py > g.oy + g.side + 8) return null;
    var c = Math.round((px - g.ox - g.pad) / g.cell);
    var r = Math.round((py - g.oy - g.pad) / g.cell);
    if (!inB(r, c)) return null;
    return { r: r, c: c };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------- 对局控制 ----------------

  function startGame(settings) {
    if (game && game.aiTimer) clearTimeout(game.aiTimer);
    settings = settings || { mode: 'pvp' };
    SIZE = settings.size || window.GC.SIZE || 15;
    if ([9, 11, 13, 15, 19].indexOf(SIZE) < 0) SIZE = 15;
    window.GC.SIZE = SIZE;
    window.GC.STARS = window.GC.starsFor(SIZE);
    game = {
      settings: settings,
      sim: createSim(),
      theme: window.Theme.random(null),
      stoneAnims: [],
      combo: { streak: 0, best: 0 },
      autoTimer: 0,
      aiThinking: false,
      aiTimer: null,
      ghost: null,
      switching: null,
      ambient: null,
      rule: settings.rule || (settings.renju ? 'renju' : (window.GC.settings && window.GC.settings.rule) || 'free'),
      renjuLoss: false,
      myColor: (settings.mode === 'online') ? settings.myColor : 0,
      isMyTurn: (settings.mode === 'online') ? settings.myColor === 1 : true,
      onlineActive: (settings.mode === 'online') || false,
      onlineEnded: false,
      rematchRequested: false,
      rematchReceived: false
    };
    game.aiPlayer = settings && settings.mode === 'ai'
      ? (settings.humanSide === 0 ? 2 : 1)
      : 0;
    if (game.onlineActive) {
      var onlineNick = settings.myNickname || '你';
      var oppNick = settings.opponentNickname || '对手';
      GC.PLAYER_NAMES = [
        game.myColor === 1 ? onlineNick : oppNick,
        game.myColor === 2 ? onlineNick : oppNick
      ];
    } else {
      GC.PLAYER_NAMES = ['黑方', '白方'];
    }
    applyThemeLight();
    window.FX.clear();
    window.PS.clear();
    game.ambient = window.Theme.createAmbient(game.theme, window.PS, W, H);
    activeAmbient = game.ambient;
    scene = 'game';
    hide(els.cover);
    hide(els.winOverlay);
    show(els.hud);
    refreshAutoChip();
    updateHud();
    if (game.aiPlayer && game.sim.current === game.aiPlayer) scheduleAi();
  }

  function backToMenu() {
    if (game && game.onlineActive && !game.onlineEnded) {
      window.Network.sendGameEnd('abort');
      window.Network.leaveRoom();
    }
    if (game && game.onlineActive && game.onlineEnded) {
      // game ended but we're leaving — just leave room
      window.Network.leaveRoom();
    }
    if (game && game.aiTimer) clearTimeout(game.aiTimer);
    game = null;
    scene = 'cover';
    GC.PLAYER_NAMES = ['黑方', '白方'];
    if (cover) {
      window.PS.clear();
      cover.ambient = window.Theme.createAmbient(cover.theme, window.PS, W, H);
    }
    activeAmbient = cover ? cover.ambient : null;
    hide(els.hud);
    hide(els.winOverlay);
    show(els.cover);
    window.Cover.show();
  }

  function restoreOnlineGame(state, color) {
    if (!state || !color) return;
    var session = window.Network.getSession ? window.Network.getSession() : null;
    var myNick = (session && session.nickname) || (color === 1 ? '黑方' : '白方');
    var oppNick = state.players ? (color === 1 ? state.players[2] : state.players[1]) : '对手';
    startGame({
      mode: 'online',
      size: state.size || window.GC.SIZE,
      rule: state.rule || (state.renju ? 'renju' : 'free'),
      myColor: color,
      myNickname: myNick,
      opponentNickname: oppNick || '对手',
      roomCode: session ? session.code : null
    });
    game.sim.board = [];
    for (var r = 0; r < SIZE; r++) game.sim.board.push(state.board[r].slice());
    game.sim.current = state.currentTurn || 1;
    game.sim.winner = state.winner || 0;
    game.sim.lastMove = state.lastMove || null;
    game.sim.moves = state.moveCount || 0;
    game.onlineEnded = !!state.gameOver;
    game.isMyTurn = !game.onlineEnded && game.sim.current === color;
    updateHud();
    if (game.sim.winner) {
      game.sim.winLine = game.sim.lastMove
        ? findWinLine(game.sim.board, game.sim.lastMove.r, game.sim.lastMove.c, game.sim.winner)
        : null;
      handleWin(game.sim.winner);
    }
  }

  function canPlace() {
    if (!game || scene !== 'game' || game.sim.winner || game.switching) return false;
    if (game.onlineActive && !game.isMyTurn) return false;
    if (game.aiThinking) return false;
    if (game.aiPlayer && game.sim.current === game.aiPlayer) return false;
    return true;
  }

  function placeMove(r, c) {
    var sim = game.sim;
    var p = sim.current;
    if (game.rule !== 'free' && p === 1 && window.AI.isForbiddenAfter(sim.board, r, c, 1, game.rule)) {
      game.renjuLoss = true;
      sim.winner = 2;
      sim.lastMove = { r: r, c: c };
      window.FX.toast('黑方禁手 · 白方获胜', W / 2, H / 2, '#ff6b6b', false);
      window.SFX.counter(5);
      handleWin(2);
      return;
    }
    sim.board[r][c] = p;
    sim.moves++;
    sim.lastMove = { r: r, c: c };
    game.stoneAnims.push({ r: r, c: c, t0: time });
    window.SFX.place();
    var info = analyzeMove(sim.board, r, c, p);
    triggerCombo(info, r, c, p);
    if (info.tier === 6) {
      sim.winner = p;
      sim.winLine = findWinLine(sim.board, r, c, p);
      handleWin(p);
      return;
    }
    sim.current = 3 - p;
    if (game.onlineActive) {
      game.isMyTurn = (sim.current === game.myColor);
      if (!game.onlineEnded) {
        window.Network.sendMove(r, c);
      }
    }
    updateHud();
    if (game.aiPlayer && sim.current === game.aiPlayer) scheduleAi();
  }

  function placeRemoteMove(r, c) {
    if (!game || game.sim.winner || game.switching) return;
    var sim = game.sim;
    if (sim.board[r][c] !== 0) return;
    var p = sim.current;
    if (game.rule !== 'free' && p === 1 && window.AI.isForbiddenAfter(sim.board, r, c, 1, game.rule)) {
      game.renjuLoss = true;
      sim.winner = 2;
      sim.lastMove = { r: r, c: c };
      window.FX.toast('黑方禁手 · 白方获胜', W / 2, H / 2, '#ff6b6b', false);
      handleWin(2);
      return;
    }
    sim.board[r][c] = p;
    sim.moves++;
    sim.lastMove = { r: r, c: c };
    game.stoneAnims.push({ r: r, c: c, t0: time });
    window.SFX.place();
    var info = analyzeMove(sim.board, r, c, p);
    triggerCombo(info, r, c, p);
    if (info.tier === 6) {
      sim.winner = p;
      sim.winLine = findWinLine(sim.board, r, c, p);
      handleWin(p);
      return;
    }
    sim.current = 3 - p;
    if (game.onlineActive) {
      game.isMyTurn = (sim.current === game.myColor);
    }
    updateHud();
  }

  function handleOnlineWin(winnerColor) {
    if (!game || game.onlineEnded) return;
    game.onlineEnded = true;
    var winnerName = winnerColor === game.myColor ? '你' : '对手';
    if (winnerName === '你') {
      window.Network.sendGameEnd(game.myColor);
    } else {
      var oppColor = game.myColor === 1 ? 2 : 1;
      window.Network.sendGameEnd(oppColor);
    }
  }

  function scheduleAi() {
    if (game.aiTimer) clearTimeout(game.aiTimer);
    game.aiThinking = true;
    updateHud();
    var g = game;
    var delay = 160 + Math.random() * 240;
    game.aiTimer = setTimeout(function () {
      if (!g || game !== g || scene !== 'game' || g.sim.winner) return;
      var done = function (move) {
        if (!g || game !== g || scene !== 'game') return;
        g.aiThinking = false;
        updateHud();
        if (move) placeMove(move.r, move.c);
      };
      var p = window.AI.chooseMoveAsync(g.sim.board, g.aiPlayer, g.settings.difficulty || 'normal', g.rule || 'free');
      if (p && p.then) p.then(done);
      else done(p);
    }, delay);
  }

  function triggerCombo(info, r, c, p) {
    var th = game.theme;
    var px = ix(c);
    var py = iy(r);
    var st = th.pieces[p === 1 ? 0 : 1];
    var colors = [th.accent, th.accent2, st.edge, '#ffffff'];
    var tier = info.tier;
    var brk = isBreakingMove(game.sim.board, r, c, 3 - p);
    var gain = 0;

    window.FX.burst(px, py, colors, 7, { speed: 90, size: 2.2, life: 0.7 });
    if (tier >= 1 || brk >= 3) {
      window.FX.ring(px, py, th.accent, 56, 0.55, 2.6, 12);
    }

    if (brk >= 3) {
      window.Theme.playThemeFx(th, 'break', brk, px, py, colors);
      if (brk >= 5) {
        window.FX.shake(13, 0.55);
        window.FX.flash('#ffffff', 0.25, 0.4);
        window.FX.pulseZoom(1, 1.06, 0.4);
      } else if (brk >= 4) {
        window.FX.shake(10, 0.45);
        window.FX.pulseZoom(1, 1.04, 0.35);
      } else {
        window.FX.shake(6, 0.35);
      }
      window.FX.toast(
        brk >= 5 ? '绝杀封堵!' : brk >= 4 ? '破解冲四!' : '封锁活三!',
        px, py - 58,
        brk >= 4 ? th.accent2 : th.accent,
        false
      );
      window.SFX.counter(brk);
      gain = Math.max(gain, brk);
    }

    if (tier >= 2) {
      window.Theme.playThemeFx(th, 'move', tier, px, py, colors);
      window.SFX.effect(tier);
      var labels = {
        2: '流星三连',
        3: '彗星活三',
        4: '雷暴四连',
        5: '双线新星'
      };
      window.FX.toast(labels[tier], px, py - 34, tier >= 4 ? th.accent2 : th.accent, tier <= 2);
      gain = Math.max(gain, tier);
      if (Math.random() < 0.18) {
        window.FX.burst(px, py, [th.accent, '#ffffff'], 16, { speed: 180, size: 2.6, life: 0.9 });
      }
    }

    if (tier === 3) window.FX.shake(5, 0.32);
    if (tier === 4) window.FX.shake(8, 0.4);
    if (tier === 5) {
      window.FX.shake(12, 0.55);
      window.FX.pulseZoom(1, 1.05, 0.4);
      window.FX.flash(th.accent2, 0.18, 0.35);
    }

    if (gain >= 2) {
      game.combo.streak++;
      game.combo.best = Math.max(game.combo.best, game.combo.streak);
    } else {
      game.combo.streak = 0;
    }
    updateCombo();
  }

  function handleWin(p) {
    var name = p === 1 ? GC.PLAYER_NAMES[0] : GC.PLAYER_NAMES[1];
    var sim = game.sim;
    var last = sim.lastMove;
    updateHud();
    window.SFX.win();
    if (game.onlineActive) {
      handleOnlineWin(p);
    }
    if (!GC.PREFERS_REDUCED_MOTION) window.FX.setSlowmo(0.35, 1200);
    window.FX.flash('#ffffff', 0.4, 0.5);
    window.FX.shake(14, 0.7);
    window.FX.pulseZoom(1, 1.08, 0.6);
    var toastText = game.renjuLoss ? '黑方禁手 · 白方获胜' : '五连珠 · ' + name + '胜';
    window.FX.toast(toastText, last ? ix(last.c) : W / 2, last ? iy(last.r) - 44 : H / 2, '#ffd66e', false);
    window.FX.fireworks(W * 0.5, H * 0.38);
    var g = game;
    setTimeout(function () {
      if (!g || game !== g || scene !== 'game') return;
      els.winTitle.textContent = name + '获胜';
      els.winMeta.textContent = (g.renjuLoss ? '黑方禁手 · ' : '') + '最长特效连击 ×' + g.combo.best + ' · 共 ' + sim.moves + ' 手';
      els.winEmblem.textContent = (g.onlineActive && p === g.myColor) ? '🏆' : (g.onlineActive && p !== g.myColor) ? '💔' : '🏆';
      if (g.onlineActive) {
        showOnlineWinControls();
      } else {
        hide(els.winRematchArea);
        show(els.winNormalActions);
      }
      hide(els.hud);
      show(els.winOverlay);
    }, 1250);
  }

  function showOnlineWinControls() {
    hide(els.winNormalActions);
    hide(els.winRematchArea);
    show(els.winRematchArea);
    if (game.rematchReceived) {
      els.winRematchStatus.textContent = '对手请求再战！';
      els.btnRematch.textContent = '接受再战';
      els.btnRematch.onclick = function () {
        window.SFX.click();
        window.Network.acceptRematch();
        game.onlineEnded = false;
        game.rematchRequested = false;
        game.rematchReceived = false;
      };
      show(els.btnRematch);
    } else if (game.rematchRequested) {
      els.winRematchStatus.textContent = '已发送再战请求，等待对方...';
      hide(els.btnRematch);
    } else {
      els.winRematchStatus.textContent = '';
      els.btnRematch.textContent = '请求再战';
      els.btnRematch.onclick = function () {
        window.SFX.click();
        game.rematchRequested = true;
        window.Network.requestRematch();
        els.winRematchStatus.textContent = '已发送再战请求，等待对方...';
        hide(els.btnRematch);
      };
      show(els.btnRematch);
    }
    // always show back button inside rematch area
    var backBtn = els.winRematchArea.querySelector('.ghost-btn');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.className = 'ghost-btn';
      backBtn.textContent = '返回菜单';
      backBtn.addEventListener('click', function () {
        window.SFX.click();
        backToMenu();
      });
      els.winRematchArea.appendChild(backBtn);
    }
  }

  function handleForfeitWin() {
    // opponent disconnected during game — we win
    if (!game || game.onlineEnded) return;
    game.onlineEnded = true;
    game.sim.winner = game.myColor;
    window.SFX.win();
    window.FX.flash('#ffffff', 0.4, 0.5);
    window.FX.shake(14, 0.7);
    window.FX.toast('对手已离开 · 你获胜', W / 2, H / 2, '#ffd66e', false);
    window.FX.fireworks(W * 0.5, H * 0.38);
    var g = game;
    setTimeout(function () {
      if (!g || game !== g || scene !== 'game') return;
      var myName = g.myColor === 1 ? GC.PLAYER_NAMES[0] : GC.PLAYER_NAMES[1];
      els.winTitle.textContent = myName + '获胜';
      els.winMeta.textContent = '对手离开 · 共 ' + g.sim.moves + ' 手';
      els.winEmblem.textContent = '🏆';
      hide(els.winNormalActions);
      showOnlineWinControls();
      hide(els.hud);
      show(els.winOverlay);
    }, 1000);
  }

  function updateHud() {
    if (!game) return;
    var sim = game.sim;
    var thinking = game.aiThinking;
    var label;
    if (thinking) {
      label = 'AI 思考中…';
    } else if (sim.winner) {
      label = sim.winner === 1 ? GC.PLAYER_NAMES[0] + '胜' : GC.PLAYER_NAMES[1] + '胜';
    } else if (game.onlineActive && !game.isMyTurn) {
      label = '等待对手…';
    } else {
      label = (sim.current === 1 ? GC.PLAYER_NAMES[0] : GC.PLAYER_NAMES[1]) + '回合';
    }
    els.turnChip.textContent = label;
    els.turnChip.classList.toggle('thinking', !!thinking || (game.onlineActive && !game.isMyTurn && !sim.winner));
    els.themeChip.textContent = game.theme.name + ' · ' + game.theme.tagline;
    updateCombo();
  }

  function updateCombo() {
    if (!game) return;
    if (game.combo.streak >= 2) {
      els.comboChip.textContent = '✦ 特效连击 ×' + game.combo.streak;
      show(els.comboChip);
    } else {
      hide(els.comboChip);
    }
  }

  // ---------------- 场景切换 ----------------

  function switchTheme() {
    if (scene !== 'game' || !game || game.switching) return;
    var snap = document.createElement('canvas');
    snap.width = canvas.width;
    snap.height = canvas.height;
    snap.getContext('2d').drawImage(canvas, 0, 0);
    var next = window.Theme.random(game.theme.id);
    game.theme = next;
    window.PS.clear();
    game.ambient = window.Theme.createAmbient(next, window.PS, W, H);
    activeAmbient = game.ambient;
    game.switching = {
      snap: snap,
      from: performance.now(),
      dur: clamp(GC.settings.duration, 0.5, 2.5) * 1000,
      p: 0,
      burst: false,
      flashed: false
    };
    game.autoTimer = 0;
    applyThemeLight();
    window.SFX.whoosh();
    updateHud();
  }

  function applyThemeLight() {
    if (!game) return;
    var light = ['sakura', 'ink', 'candy'].indexOf(game.theme.bgType) >= 0;
    document.body.dataset.themeLight = light ? '1' : '0';
  }

  function drawPortal(sw) {
    var eased = easeInOut(sw.p);
    var cx = W / 2;
    var cy = H / 2;
    var R = Math.hypot(W, H) * 0.72;
    ctx.save();
    if (sw.snap) {
      ctx.globalAlpha = 1 - eased * 0.9;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(6, R * (1 - eased)), 0, Math.PI * 2);
      ctx.clip();
      var zoom = 1 + (1 - sw.p) * 0.04;
      var zw = W * zoom;
      var zh = H * zoom;
      ctx.drawImage(sw.snap, (W - zw) / 2, (H - zh) / 2, zw, zh);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'lighter';
    var a = Math.sin(sw.p * Math.PI);
    var th = game.theme;
    for (var i = 0; i < 3; i++) {
      ctx.strokeStyle = withAlpha(i % 2 ? th.accent2 : th.accent, 0.8 * a);
      ctx.lineWidth = Math.max(1.5, 7 * (1 - sw.p) + 1);
      ctx.shadowColor = i % 2 ? th.accent2 : th.accent;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      var start = sw.p * Math.PI * 6 + i * 2.1;
      var span = 1.7 + (1 - sw.p) * 4.4;
      ctx.arc(cx, cy, R * (0.38 + i * 0.07) * (1 - sw.p * 0.75), start, start + span);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.6 * a;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + R * 0.32 * (1 - sw.p), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------- 绘制 ----------------

  function drawPiece(x, y, p, scale, alpha) {
    var st = game.theme.pieces[p === 1 ? 0 : 1];
    var r = boardGeom().cell * 0.42 * scale;
    ctx.save();
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.14, y + r * 0.16, r * 0.94, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = st.glow;
    ctx.shadowBlur = 16 * scale + 6;
    var grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.42, r * 0.08, x, y, r);
    grad.addColorStop(0, st.hi);
    grad.addColorStop(0.55, st.core);
    grad.addColorStop(0.97, st.edge);
    grad.addColorStop(1, st.edge);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.translate(x, y);
    window.Theme.drawMotif(game.theme, ctx, r * 0.96, luminance(st.core) < 120);
    ctx.restore();
    ctx.strokeStyle = withAlpha(st.edge, 0.9);
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.97, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function stoneScale(r, c) {
    for (var i = game.stoneAnims.length - 1; i >= 0; i--) {
      var a = game.stoneAnims[i];
      if (a.r === r && a.c === c) {
        var p = (time - a.t0) / 0.24;
        if (p >= 1) {
          game.stoneAnims.splice(i, 1);
          return 1;
        }
        return Math.max(0.02, easeOutBack(p));
      }
    }
    return 1;
  }

  function drawBoard() {
    var th = game.theme;
    var sim = game.sim;
    var g = boardGeom();
    ctx.save();
    ctx.shadowColor = th.board.glow;
    ctx.shadowBlur = 26;
    roundRect(g.ox, g.oy, g.side, g.side, 20);
    ctx.fillStyle = th.board.fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    var frame = ctx.createLinearGradient(g.ox, g.oy, g.ox, g.oy + g.side);
    frame.addColorStop(0, withAlpha(th.board.frameTop, 0.9));
    frame.addColorStop(1, withAlpha(th.board.frameBottom, 0.9));
    ctx.strokeStyle = frame;
    ctx.lineWidth = 2;
    roundRect(g.ox, g.oy, g.side, g.side, 20);
    ctx.stroke();
    var cornerR = 7;
    ctx.fillStyle = th.board.corner;
    ctx.shadowColor = th.board.glow;
    ctx.shadowBlur = 10;
    for (var i = 0; i < 4; i++) {
      var cx = i % 2 === 0 ? g.ox + 7 : g.ox + g.side - 7;
      var cy = i < 2 ? g.oy + 7 : g.oy + g.side - 7;
      ctx.beginPath();
      ctx.arc(cx, cy, cornerR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.strokeStyle = th.board.line;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var i = 0; i < SIZE; i++) {
      ctx.moveTo(ix(0), iy(i));
      ctx.lineTo(ix(SIZE - 1), iy(i));
      ctx.moveTo(ix(i), iy(0));
      ctx.lineTo(ix(i), iy(SIZE - 1));
    }
    ctx.stroke();

    ctx.fillStyle = th.board.star;
    ctx.shadowColor = th.board.star;
    ctx.shadowBlur = 8;
    for (var si = 0; si < GC.STARS.length; si++) {
      var s = GC.STARS[si];
      ctx.beginPath();
      ctx.arc(ix(s[1]), iy(s[0]), g.cell * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = sim.board[r][c];
        if (v === 0) continue;
        drawPiece(ix(c), iy(r), v, stoneScale(r, c), 1);
      }
    }

    if (game.ghost && canPlace() && sim.board[game.ghost.r][game.ghost.c] === 0) {
      drawPiece(ix(game.ghost.c), iy(game.ghost.r), sim.current, 1, 0.38);
    }

    if (sim.lastMove) {
      var pulse = 0.55 + 0.45 * Math.sin(time * 5);
      ctx.strokeStyle = withAlpha(th.accent, pulse);
      ctx.lineWidth = 2.4;
      ctx.shadowColor = th.accent;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ix(sim.lastMove.c), iy(sim.lastMove.r), g.cell * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (sim.winner && sim.winLine) {
      var wl = sim.winLine;
      var x1 = ix(wl.c1);
      var y1 = iy(wl.r1);
      var x2 = ix(wl.c2);
      var y2 = iy(wl.r2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = withAlpha(th.accent2, 0.95);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.shadowColor = th.accent2;
      ctx.shadowBlur = 22;
      ctx.setLineDash([16, 12]);
      ctx.lineDashOffset = -time * 60;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawConstellation() {
    var pts = [];
    for (var i = 0; i < 7; i++) {
      pts.push({
        x: W * (0.14 + ((i * 37 + 13) % 10) / 10 * 0.72),
        y: H * (0.18 + ((i * 53 + 7) % 10) / 10 * 0.64),
        ph: i * 2.1,
        color: i % 3 === 0 ? cover.theme.accent : i % 3 === 1 ? cover.theme.accent2 : '#ffffff'
      });
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x;
        var dy = pts[i].y - pts[j].y;
        var dist = Math.hypot(dx, dy);
        var maxD = Math.min(W, H) * 0.3;
        if (dist < maxD) {
          ctx.globalAlpha = (1 - dist / maxD) * (0.12 + 0.08 * Math.sin(time * 0.8 + i + j));
          ctx.strokeStyle = '#7df9ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    for (var pi = 0; pi < pts.length; pi++) {
      var p = pts[pi];
      var tw = 0.55 + 0.45 * Math.sin(time * 1.6 + p.ph);
      ctx.globalAlpha = 0.5 + tw * 0.5;
      var pr = 3 + tw * 4;
      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr * 2.4);
      grad.addColorStop(0, withAlpha(p.color, 0.9));
      grad.addColorStop(1, withAlpha(p.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var off = window.FX.shakeOffset();
    var zoom = window.FX.getZoomScale(performance.now());
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(off.x, off.y);
    if (scene === 'cover') {
      if (cover) {
        window.Theme.drawBackground(ctx, cover.theme, W, H, time);
        if (cover.crossAlpha > 0) {
          ctx.globalAlpha = cover.crossAlpha;
          window.Theme.drawBackground(ctx, cover.theme2, W, H, time);
          ctx.globalAlpha = 1;
        }
        drawConstellation();
        window.PS.draw(ctx, time, 'bg');
      }
    } else if (game) {
      window.Theme.drawBackground(ctx, game.theme, W, H, time);
      window.PS.draw(ctx, time, 'bg');
      drawBoard();
      if (game.switching) drawPortal(game.switching);
      window.PS.draw(ctx, time, 'fg');
    }
    ctx.restore();
    drawVignette();
    window.FX.draw(ctx);
  }

  // ---------------- 封面状态 ----------------

  function initCover() {
    cover = {
      theme: window.Theme.random(null),
      theme2: window.Theme.random(null),
      crossAlpha: 0,
      mode: 'hold',
      t: 0,
      ambient: null
    };
    cover.ambient = window.Theme.createAmbient(cover.theme, window.PS, W, H);
    activeAmbient = cover.ambient;
  }

  function updateCover(dt) {
    if (!cover) return;
    cover.t += dt;
    if (cover.mode === 'hold' && cover.t > 8) {
      cover.mode = 'cross';
      cover.t = 0;
    }
    if (cover.mode === 'cross') {
      cover.crossAlpha = Math.min(1, cover.crossAlpha + dt / 1.3);
      if (cover.crossAlpha >= 1) {
        cover.theme = cover.theme2;
        cover.theme2 = window.Theme.random(cover.theme.id);
        cover.crossAlpha = 0;
        cover.mode = 'hold';
        window.PS.clear();
        cover.ambient = window.Theme.createAmbient(cover.theme, window.PS, W, H);
        activeAmbient = cover.ambient;
      }
    }
    if (cover.ambient) cover.ambient.update(dt);
  }

  // ---------------- 主循环 ----------------

  function update(dt) {
    window.FX.update(dt, performance.now());
    if (scene === 'cover') {
      updateCover(dt);
    } else if (game) {
      if (game.ambient) game.ambient.update(dt);
      if (game.switching) {
        game.switching.p = Math.min(1, (performance.now() - game.switching.from) / game.switching.dur);
        if (game.switching.p >= 0.5 && !game.switching.burst) {
          game.switching.burst = true;
          window.FX.burst(W / 2, H / 2, [game.theme.accent, game.theme.accent2, '#ffffff'], 26, {
            speed: 300,
            size: 3,
            life: 0.65
          });
          window.SFX.effect(3);
        }
        if (game.switching.p >= 0.86 && !game.switching.flashed) {
          game.switching.flashed = true;
          window.FX.flash(game.theme.accent, 0.14, 0.28);
        }
        if (game.switching.p >= 1) {
          game.switching = null;
        }
      }
      if (GC.settings.auto && !game.sim.winner && !game.switching) {
        game.autoTimer = (game.autoTimer || 0) + dt;
        if (game.autoTimer >= GC.settings.interval) {
          game.autoTimer = 0;
          switchTheme();
        }
      }
    }
    window.PS.update(dt, time);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var ts = window.FX.getTimeScale(now);
    time += dt * ts;
    update(dt * ts);
    draw();
  }

  // ---------------- 在线事件监听 ----------------

  function setupOnlineListeners() {
    window.Network.on('opponentMove', function (data) {
      if (game && game.onlineActive && !game.onlineEnded) {
        placeRemoteMove(data.r, data.c);
      }
    });

    window.Network.on('opponentLeft', function (data) {
      if (game && game.onlineActive) {
        if (data && data.reconnecting && !game.onlineEnded) {
          window.FX.toast('对手掉线，等待重连...', W / 2, H / 2, '#ffd66e', true);
        } else if (data && data.youWin && !game.onlineEnded) {
          // opponent left during active game — we win by forfeit
          handleForfeitWin();
        } else {
          // opponent left while waiting or game already ended
          window.FX.toast('对手已离开', W / 2, H / 2, '#ff6b6b', false);
          setTimeout(function () {
            if (game && game.onlineActive) backToMenu();
          }, 1500);
        }
      }
    });

    window.Network.on('rematchRequested', function (data) {
      if (game && game.onlineActive && game.onlineEnded) {
        game.rematchReceived = true;
        window.FX.toast((data.nickname || '对手') + ' 请求再战', W / 2, H / 2, '#00e5ff', true);
        // update win overlay if visible
        if (!els.winOverlay.classList.contains('hidden')) {
          showOnlineWinControls();
        }
      }
    });

    window.Network.on('rematchDeclined', function (data) {
      if (game && game.onlineActive && game.onlineEnded) {
        game.rematchRequested = false;
        window.FX.toast((data.nickname || '对手') + ' 拒绝了再战', W / 2, H / 2, '#ffd66e', true);
        if (!els.winOverlay.classList.contains('hidden')) {
          els.winRematchStatus.textContent = '对方拒绝了再战';
          hide(els.btnRematch);
        }
      }
    });

    window.Network.on('disconnect', function () {
      if (game && game.onlineActive && !game.onlineEnded) {
        window.FX.toast('网络断开，尝试重连...', W / 2, H / 2, '#ff6b6b', false);
      }
    });

    window.Network.on('connect', function () {
      if (game && game.onlineActive && !game.onlineEnded) {
        window.FX.toast('已重新连接', W / 2, H / 2, '#00e5ff', true);
      }
    });

    window.Network.on('error', function (msg) {
      if (game && game.onlineActive) {
        window.FX.toast(String(msg), W / 2, H / 2, '#ff6b6b', true);
      }
    });
  }

  // ---------------- 事件 ----------------

  function onPointerMove(e) {
    if (scene !== 'game' || !game) return;
    var rect = canvas.getBoundingClientRect();
    var pt = cellAt(e.clientX - rect.left, e.clientY - rect.top);
    game.ghost = pt;
  }

  function onPointerDown(e) {
    if (scene !== 'game' || !game) return;
    var rect = canvas.getBoundingClientRect();
    var pt = cellAt(e.clientX - rect.left, e.clientY - rect.top);
    if (!pt || !canPlace()) return;
    if (game.sim.board[pt.r][pt.c] === 0) {
      placeMove(pt.r, pt.c);
    }
  }

  function onKey(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (scene === 'game' && game) switchTheme();
    } else if (e.key === 'Escape' || e.key === 'Esc') {
      if (scene === 'game') backToMenu();
    } else if ((e.key === 'r' || e.key === 'R') && scene === 'game' && game) {
      if (game.onlineActive) {
        window.FX.toast('在线模式无法重开', W / 2, H / 2, '#ffd66e', true);
        return;
      }
      startGame(game.settings);
    }
  }

  function onResize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    for (var t = 0; t < window.Theme.ALL.length; t++) window.Theme.clearDecor(window.Theme.ALL[t]);
    if (scene === 'game' && game) {
      window.PS.clear();
      game.ambient = window.Theme.createAmbient(game.theme, window.PS, W, H);
      activeAmbient = game.ambient;
    } else if (cover) {
      window.PS.clear();
      cover.ambient = window.Theme.createAmbient(cover.theme, window.PS, W, H);
      activeAmbient = cover.ambient;
    }
  }

  function updateMuteIcons() {
    var icon = window.SFX.isMuted() ? '🔇' : '🔊';
    els.btnMuteGame.textContent = icon;
    els.btnMuteCover.textContent = icon;
  }

  function refreshAutoChip() {
    els.btnAuto.textContent = '⏱ 自动:' + (GC.settings.auto ? '开' : '关');
    els.btnAuto.classList.toggle('on', GC.settings.auto);
  }

  function wireButtons() {
    els.btnAuto.addEventListener('click', function () {
      GC.settings.auto = !GC.settings.auto;
      GC.saveSettings();
      refreshAutoChip();
      if (game) game.autoTimer = 0;
      window.SFX.click();
    });
    els.btnMenu.addEventListener('click', function () {
      window.SFX.click();
      backToMenu();
    });
    els.btnRestart.addEventListener('click', function () {
      window.SFX.click();
      if (game && game.onlineActive) {
        window.FX.toast('在线模式无法重开', W / 2, H / 2, '#ffd66e', true);
        return;
      }
      if (game) startGame(game.settings);
    });
    els.btnAgain.addEventListener('click', function () {
      window.SFX.click();
      if (game && game.onlineActive) {
        // online: request rematch instead of going back
        if (!game.rematchRequested) {
          game.rematchRequested = true;
          window.Network.requestRematch();
          els.winRematchStatus.textContent = '已发送再战请求，等待对方...';
          hide(els.btnRematch);
        }
        return;
      }
      if (game) startGame(game.settings);
    });
    els.btnBackWin.addEventListener('click', function () {
      window.SFX.click();
      backToMenu();
    });
    els.btnMuteGame.addEventListener('click', function () {
      window.SFX.toggle();
      updateMuteIcons();
    });
    els.btnMuteCover.addEventListener('click', function () {
      window.SFX.toggle();
      updateMuteIcons();
    });
  }

  window.Gomoku = {
    init: function (opts) {
      options = opts || {};
      wireButtons();
      setupOnlineListeners();
      onResize();
      initCover();
      updateMuteIcons();
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('resize', onResize);
      window.addEventListener('keydown', onKey);
      document.addEventListener('pointerdown', function () {
        window.SFX.unlock();
      }, { once: false });
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    startGame: function (settings) {
      startGame(settings);
    },
    placeRemoteMove: placeRemoteMove,
    restoreOnlineGame: restoreOnlineGame,
    backToMenu: backToMenu,
    refreshAutoChip: refreshAutoChip
  };
})();
