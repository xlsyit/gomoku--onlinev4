(function () {
  'use strict';

  var els = {
    cover: document.getElementById('cover'),
    btnPvp: document.getElementById('btnPvp'),
    btnVsAi: document.getElementById('btnVsAi'),
    btnOnline: document.getElementById('btnOnline'),
    aiConfig: document.getElementById('aiConfig'),
    onlineConfig: document.getElementById('onlineConfig'),
    leaderboardPanel: document.getElementById('leaderboardPanel'),
    segDifficulty: document.getElementById('segDifficulty'),
    segSide: document.getElementById('segSide'),
    segAiBoardSize: document.getElementById('segAiBoardSize'),
    segAiRule: document.getElementById('segAiRule'),
    aiRuleHint: document.getElementById('aiRuleHint'),
    btnAiStart: document.getElementById('btnAiStart'),
    btnAiBack: document.getElementById('btnAiBack'),
    btnCreateRoom: document.getElementById('btnCreateRoom'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    btnRegister: document.getElementById('btnRegister'),
    btnLogin: document.getElementById('btnLogin'),
    btnOnlineBack: document.getElementById('btnOnlineBack'),
    inputNickname: document.getElementById('inputNickname'),
    inputPassword: document.getElementById('inputPassword'),
    inputRoomCode: document.getElementById('inputRoomCode'),
    onlineConnectHint: document.getElementById('onlineConnectHint'),
    roomStatus: document.getElementById('roomStatus'),
    segRoomPrivacy: document.getElementById('segRoomPrivacy'),
    lobbyGrid: document.getElementById('lobbyGrid'),
    roomCount: document.getElementById('roomCount'),
    btnLeaderboard: document.getElementById('btnLeaderboard'),
    btnLbClose: document.getElementById('btnLbClose'),
    lbList: document.getElementById('lbList'),
    btnSettings: document.getElementById('btnSettings'),
    settingsPanel: document.getElementById('settingsPanel'),
    segBoardSize: document.getElementById('segBoardSize'),
    segRule: document.getElementById('segRule'),
    ruleHint: document.getElementById('ruleHint'),
    segUiTheme: document.getElementById('segUiTheme'),
    segAuto: document.getElementById('segAuto'),
    sliderInterval: document.getElementById('sliderInterval'),
    intervalVal: document.getElementById('intervalVal'),
    sliderDuration: document.getElementById('sliderDuration'),
    durationVal: document.getElementById('durationVal'),
    btnSettingsClose: document.getElementById('btnSettingsClose')
  };

  var callbacks = { start: function () {} };
  var selected = { difficulty: 'easy', humanSide: 0 };
  var onlineState = { mode: 'idle', roomCode: null, color: null, isPublic: true };
  var auth = { token: null, nickname: '' };
  var RULE_INFO = {
    free: '自由规则：黑方白方都无禁手，先连成五子即胜。',
    renju: '职业禁手：黑方禁止双三、双四和长连，白方无禁手；黑方犯规判白胜。',
    folk: '民间禁手：仅禁止黑方长连（超过五子），双三双四仍可下，适合休闲对局。'
  };

  function updateRuleHint(rule) {
    var text = RULE_INFO[rule] || RULE_INFO.free;
    if (els.ruleHint) els.ruleHint.textContent = text;
    if (els.aiRuleHint) els.aiRuleHint.textContent = text;
  }

  function refreshAuthUI() {
    var ok = !!auth.token;
    els.btnCreateRoom.disabled = !ok;
    els.btnJoinRoom.disabled = !ok;
    els.btnRegister.disabled = ok;
    els.btnRegister.textContent = ok ? '已登录' : '注册';
    els.btnLogin.textContent = ok ? '退出' : '登录';
  }

  function setAuth(token, nickname) {
    auth.token = token || null;
    auth.nickname = nickname || '';
    if (token) {
      try { window.localStorage.setItem('gmx_auth', JSON.stringify({ token: token, nickname: nickname })); } catch (e) { /* ignore */ }
    } else {
      try { window.localStorage.removeItem('gmx_auth'); } catch (e) { /* ignore */ }
    }
    refreshAuthUI();
  }

  function bindSeg(el, onPick) {
    var btns = el.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        onPick(b.dataset.value);
        window.SFX.click();
      });
    });
  }

  function setConfigVisible(v) {
    els.aiConfig.classList.toggle('hidden', !v);
  }

  function setOnlineConfigVisible(v) {
    els.onlineConfig.classList.toggle('hidden', !v);
    if (v) {
      resetOnlineUI();
      try {
        var savedAuth = JSON.parse(window.localStorage.getItem('gmx_auth') || 'null');
        if (savedAuth && savedAuth.token) {
          auth.token = savedAuth.token;
          auth.nickname = savedAuth.nickname || '';
          if (auth.nickname) els.inputNickname.value = auth.nickname;
        }
      } catch (e) { /* ignore */ }
      if (window.GC && window.GC.lastNickname && !els.inputNickname.value) {
        els.inputNickname.value = window.GC.lastNickname;
      }
      refreshAuthUI();
      if (els.onlineConnectHint) {
        els.onlineConnectHint.textContent = window.Network.isConnected() ? '已连接服务器' : '正在连接服务器...';
      }
    }
  }

  function handleConnect() {
    if (els.onlineConnectHint && !els.onlineConfig.classList.contains('hidden')) {
      els.onlineConnectHint.textContent = '已连接服务器';
    }
  }

  function handleDisconnect() {
    if (els.onlineConnectHint && !els.onlineConfig.classList.contains('hidden')) {
      els.onlineConnectHint.textContent = '连接已断开，正在重连...';
    }
  }

  function setLeaderboardVisible(v) {
    els.leaderboardPanel.classList.toggle('hidden', !v);
    if (v) loadLeaderboard();
  }

  function setSettingsVisible(v) {
    els.settingsPanel.classList.toggle('hidden', !v);
  }

  function hideAllPanels() {
    setConfigVisible(false);
    setOnlineConfigVisible(false);
    setLeaderboardVisible(false);
    setSettingsVisible(false);
  }

  function resetOnlineUI() {
    els.roomStatus.classList.add('hidden');
    els.roomStatus.textContent = '';
    els.inputRoomCode.value = '';
    els.inputNickname.disabled = false;
    els.inputPassword.disabled = false;
    els.btnCreateRoom.textContent = '创建房间';
    els.btnJoinRoom.textContent = '加入房间';
    onlineState = { mode: 'idle', roomCode: null, color: null, isPublic: true };
    if (els.segRoomPrivacy) {
      els.segRoomPrivacy.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === '1');
      });
    }
  }

  function showRoomStatus(html) {
    els.roomStatus.innerHTML = html;
    els.roomStatus.classList.remove('hidden');
  }

  function syncSettingsUI() {
    var s = window.GC.settings;
    els.segBoardSize.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === String(s.boardSize));
    });
    els.segRule.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === s.rule);
    });
    if (els.segAiBoardSize) {
      els.segAiBoardSize.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === String(s.boardSize));
      });
    }
    if (els.segAiRule) {
      els.segAiRule.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === s.rule);
      });
    }
    updateRuleHint(s.rule);
    els.segUiTheme.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === s.uiTheme);
    });
    els.segAuto.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === (s.auto ? '1' : '0'));
    });
    els.sliderInterval.value = String(s.interval);
    els.intervalVal.textContent = s.interval + ' 秒';
    els.sliderDuration.value = String(s.duration);
    els.durationVal.textContent = s.duration.toFixed(1) + ' 秒';
  }

  function loadLeaderboard() {
    els.lbList.innerHTML = '<div class="lb-empty">加载中...</div>';
    window.Network.getLeaderboard(function (data) {
      if (!data || data.length === 0) {
        els.lbList.innerHTML = '<div class="lb-empty">暂无数据</div>';
        return;
      }
      var html = '<table class="lb-table"><thead><tr>' +
        '<th>#</th><th>昵称</th><th>胜</th><th>负</th><th>积分</th>' +
        '</tr></thead><tbody>';
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        var rankClass = i < 3 ? ' lb-rank-' + (i + 1) : '';
        html += '<tr class="' + rankClass + '">' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + escapeHtml(p.nickname) + '</td>' +
          '<td>' + p.wins + '</td>' +
          '<td>' + p.losses + '</td>' +
          '<td>' + p.rating + '</td>' +
          '</tr>';
      }
      html += '</tbody></table>';
      els.lbList.innerHTML = html;
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  var RULE_LABELS = { free: '自由', renju: '职业禁手', folk: '民间禁手' };

  function handleRoomList(list) {
    if (!els.lobbyGrid) return;
    list = list || [];
    if (els.roomCount) els.roomCount.textContent = String(list.length);
    if (!list.length) {
      els.lobbyGrid.innerHTML = '<div class="lb-empty">暂无公开房间</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var room = list[i];
      var full = room.players >= 2;
      html += '<div class="room-card">' +
        '<div class="room-card-header"><span class="room-card-code">' + escapeHtml(room.code) + '</span><span>' + (full ? '对局中' : '等待') + '</span></div>' +
        '<div class="room-card-meta">房主：' + escapeHtml(room.creator || '?') + '<br>' +
        (room.size || 15) + ' 路 · ' + (RULE_LABELS[room.rule] || '自由') + '<br>人数：' + (room.players || 1) + '/2</div>' +
        '<button class="big-btn primary small" data-code="' + escapeHtml(room.code) + '" data-size="' + (room.size || 15) + '" data-rule="' + escapeHtml(room.rule || 'free') + '"' + (full ? ' disabled' : '') + '>加入</button>' +
        '</div>';
    }
    els.lobbyGrid.innerHTML = html;
  }

  function joinPublicRoom(code, size, rule) {
    var nick = els.inputNickname.value.trim() || auth.nickname;
    if (!auth.token || !nick) {
      handleError('请先注册或登录');
      return;
    }
    window.SFX.click();
    window.Network.joinRoom({
      token: auth.token,
      nickname: nick,
      code: code,
      size: size || window.GC.settings.boardSize || window.GC.SIZE,
      rule: rule || window.GC.settings.rule || 'free'
    });
  }

  function handleRoomCreated(data) {
    onlineState.mode = 'waiting';
    onlineState.roomCode = data.code;
    onlineState.color = data.color || 1;
    onlineState.isPublic = !!data.isPublic;
    if (data.isPublic) {
      showRoomStatus(
        '<div class="room-waiting">房间已公开，等待对手加入...</div>' +
        '<div class="room-code-display">' + data.code + '</div>'
      );
    } else {
      showRoomStatus(
        '<div class="room-code-label">私密房间已创建，将房间码发给对手</div>' +
        '<div class="room-code-display">' + data.code + '</div>' +
        '<div class="room-waiting">等待对手加入...</div>'
      );
    }
    els.btnCreateRoom.textContent = '已创建';
    els.btnCreateRoom.disabled = true;
    els.btnJoinRoom.disabled = true;
    els.inputNickname.disabled = true;
    els.inputPassword.disabled = true;
    window.GC.saveNickname(els.inputNickname.value.trim());
  }

  function handleGameStart(data) {
    var session = window.Network.getSession ? window.Network.getSession() : null;
    var myNick = els.inputNickname.value.trim() || auth.nickname || (session && session.nickname) || '你';
    var myColor = data.youColor || onlineState.color || (data.black.nickname === myNick ? 1 : 2);
    onlineState.mode = 'playing';
    els.onlineConfig.classList.add('hidden');
    window.GC.saveNickname(myNick);
    callbacks.start({
      mode: 'online',
      size: data.size || window.GC.SIZE,
      rule: data.rule || (data.renju ? 'renju' : 'free'),
      myColor: myColor,
      myNickname: myNick,
      opponentNickname: myColor === 1 ? data.white.nickname : data.black.nickname,
      roomCode: onlineState.roomCode
    });
  }

  function handleOpponentJoined(data) {
    showRoomStatus(
      '<div class="room-code-label">对手已加入</div>' +
      '<div class="room-code-display">' + onlineState.roomCode + '</div>' +
      '<div class="room-waiting">即将开始...</div>'
    );
  }

  function handleRoomSession(data) {
    if (data && data.color) {
      onlineState.color = data.color;
      onlineState.roomCode = data.code || onlineState.roomCode;
    }
  }

  function handleRoomRejoined(data) {
    if (!data) return;
    onlineState.roomCode = data.code || onlineState.roomCode;
    onlineState.color = data.color || onlineState.color;
    var state = data.state;
    var bothReady = state && state.players && state.players[1] && state.players[2];
    if (state && state.moveCount > 0 && window.Gomoku && typeof window.Gomoku.restoreOnlineGame === 'function') {
      onlineState.mode = 'playing';
      window.Gomoku.restoreOnlineGame(state, data.color);
    } else if (bothReady) {
      onlineState.mode = 'playing';
      var session = window.Network.getSession ? window.Network.getSession() : null;
      var myNick = auth.nickname || (session && session.nickname) || '你';
      var myColor = data.color || onlineState.color;
      callbacks.start({
        mode: 'online',
        size: state.size || window.GC.SIZE,
        rule: state.rule || (state.renju ? 'renju' : 'free'),
        myColor: myColor,
        myNickname: myNick,
        opponentNickname: myColor === 1 ? state.players[2] : state.players[1],
        roomCode: data.code || onlineState.roomCode
      });
    } else if (data.code) {
      onlineState.mode = 'waiting';
      window.FX.toast('已连接房间 ' + data.code + '，等待对手', window.innerWidth / 2, window.innerHeight / 2, '#00e5ff', true);
    }
  }

  function handleOpponentRejoined(data) {
    window.FX.toast((data && data.nickname ? data.nickname : '对手') + ' 已重连', window.innerWidth / 2, window.innerHeight / 2, '#00e5ff', true);
  }

  function handleError(msg) {
    showRoomStatus('<div class="room-error">' + escapeHtml(msg) + '</div>');
  }

  function doAuth(register) {
    var nick = els.inputNickname.value.trim();
    var pass = els.inputPassword.value;
    if (!nick || !pass) {
      handleError('请输入昵称和密码');
      return;
    }
    if (auth.token && !register) {
      setAuth(null, '');
      showRoomStatus('<div class="room-waiting">已退出登录</div>');
      return;
    }
    var cb = function (res) {
      if (res && res.ok) {
        setAuth(res.token, nick);
        window.GC.saveNickname(nick);
        showRoomStatus('<div class="room-waiting">' + (register ? '注册成功' : '登录成功') + '，可以创建或加入房间</div>');
      } else {
        handleError((res && res.error) || (register ? '注册失败' : '登录失败'));
      }
    };
    if (register) window.Network.register(nick, pass, cb);
    else window.Network.login(nick, pass, cb);
  }

  window.Cover = {
    init: function (cb) {
      callbacks = cb || callbacks;

      els.btnPvp.addEventListener('click', function () {
        window.SFX.click();
        callbacks.start({ mode: 'pvp' });
      });
      els.btnVsAi.addEventListener('click', function () {
        window.SFX.click();
        hideAllPanels();
        setConfigVisible(true);
      });
      els.btnAiBack.addEventListener('click', function () {
        window.SFX.click();
        setConfigVisible(false);
      });
      els.btnOnline.addEventListener('click', function () {
        window.SFX.click();
        window.location.href = 'online.html';
      });
      els.btnOnlineBack.addEventListener('click', function () {
        window.SFX.click();
        if (onlineState.mode === 'waiting' || onlineState.mode === 'playing') {
          window.Network.leaveRoom();
        }
        setOnlineConfigVisible(false);
      });
      els.btnRegister.addEventListener('click', function () {
        window.SFX.click();
        doAuth(true);
      });
      els.btnLogin.addEventListener('click', function () {
        window.SFX.click();
        doAuth(false);
      });
      els.btnCreateRoom.addEventListener('click', function () {
        var nick = els.inputNickname.value.trim();
        if (!auth.token || !nick) {
          handleError('请先注册或登录');
          return;
        }
        window.SFX.click();
        window.Network.createRoom({
          token: auth.token,
          nickname: nick,
          size: window.GC.settings.boardSize || window.GC.SIZE,
          rule: window.GC.settings.rule || 'free',
          isPublic: onlineState.isPublic
        });
      });
      els.btnJoinRoom.addEventListener('click', function () {
        var nick = els.inputNickname.value.trim();
        var code = els.inputRoomCode.value.trim().toUpperCase();
        if (!auth.token || !nick) { handleError('请先注册或登录'); return; }
        if (!code || code.length < 4) { handleError('请输入房间码'); return; }
        window.SFX.click();
        window.Network.joinRoom({
          token: auth.token,
          nickname: nick,
          code: code,
          size: window.GC.settings.boardSize || window.GC.SIZE,
          rule: window.GC.settings.rule || 'free'
        });
      });

      window.Network.on('connect', handleConnect);
      window.Network.on('disconnect', handleDisconnect);
      window.Network.on('roomCreated', handleRoomCreated);
      window.Network.on('roomList', handleRoomList);
      window.Network.on('roomSession', handleRoomSession);
      window.Network.on('roomRejoined', handleRoomRejoined);
      window.Network.on('opponentJoined', handleOpponentJoined);
      window.Network.on('opponentRejoined', handleOpponentRejoined);
      window.Network.on('gameStart', handleGameStart);
      window.Network.on('error', handleError);

      if (els.lobbyGrid) {
        els.lobbyGrid.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button[data-code]') : null;
          if (btn && !btn.disabled) {
            joinPublicRoom(btn.getAttribute('data-code'), parseInt(btn.getAttribute('data-size'), 10), btn.getAttribute('data-rule'));
          }
        });
      }

      els.btnLeaderboard.addEventListener('click', function () {
        window.SFX.click();
        hideAllPanels();
        if (!window.Network.isConnected()) {
          window.Network.connect();
        }
        setLeaderboardVisible(true);
      });
      els.btnLbClose.addEventListener('click', function () {
        window.SFX.click();
        setLeaderboardVisible(false);
      });

      els.btnSettings.addEventListener('click', function () {
        window.SFX.click();
        hideAllPanels();
        setSettingsVisible(true);
        syncSettingsUI();
      });
      els.btnSettingsClose.addEventListener('click', function () {
        window.SFX.click();
        setSettingsVisible(false);
      });
      els.btnAiStart.addEventListener('click', function () {
        window.SFX.click();
        callbacks.start({
          mode: 'ai',
          difficulty: selected.difficulty,
          humanSide: selected.humanSide,
          size: window.GC.settings.boardSize || window.GC.SIZE,
          rule: window.GC.settings.rule || 'free'
        });
      });
      bindSeg(els.segDifficulty, function (v) {
        selected.difficulty = v;
      });
      bindSeg(els.segSide, function (v) {
        selected.humanSide = parseInt(v, 10);
      });
      bindSeg(els.segRoomPrivacy, function (v) {
        onlineState.isPublic = v === '1';
      });
      bindSeg(els.segBoardSize, function (v) {
        window.GC.setBoardSize(parseInt(v, 10));
        window.GC.saveSettings();
        window.location.reload();
      });
      if (els.segAiBoardSize) {
        bindSeg(els.segAiBoardSize, function (v) {
          window.GC.setBoardSize(parseInt(v, 10));
          window.GC.saveSettings();
        });
      }
      bindSeg(els.segRule, function (v) {
        window.GC.settings.rule = v;
        window.GC.saveSettings();
        updateRuleHint(v);
      });
      if (els.segAiRule) {
        bindSeg(els.segAiRule, function (v) {
          window.GC.settings.rule = v;
          window.GC.saveSettings();
          updateRuleHint(v);
        });
      }
      bindSeg(els.segUiTheme, function (v) {
        window.GC.settings.uiTheme = v;
        window.GC.saveSettings();
        window.GC.applyUiTheme();
      });
      bindSeg(els.segAuto, function (v) {
        window.GC.settings.auto = v === '1';
        window.GC.saveSettings();
        if (window.Gomoku && window.Gomoku.refreshAutoChip) window.Gomoku.refreshAutoChip();
      });
      els.sliderInterval.addEventListener('input', function () {
        window.GC.settings.interval = parseInt(els.sliderInterval.value, 10);
        els.intervalVal.textContent = window.GC.settings.interval + ' 秒';
        window.GC.saveSettings();
      });
      els.sliderDuration.addEventListener('input', function () {
        window.GC.settings.duration = parseFloat(els.sliderDuration.value);
        els.durationVal.textContent = window.GC.settings.duration.toFixed(1) + ' 秒';
        window.GC.saveSettings();
      });
    },
    show: function () {
      hideAllPanels();
      syncSettingsUI();
      resetOnlineUI();
      els.cover.classList.remove('hidden');
    },
    hide: function () {
      els.cover.classList.add('hidden');
    },
    getOnlineState: function () {
      return onlineState;
    },
    setOnlineState: function (state) {
      onlineState = state;
    }
  };
})();
