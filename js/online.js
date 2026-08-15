(function () {
  'use strict';

  var els = {
    connectHint: document.getElementById('onlineConnectHint'),
    inputNickname: document.getElementById('inputNickname'),
    inputPassword: document.getElementById('inputPassword'),
    inputRoomCode: document.getElementById('inputRoomCode'),
    btnRegister: document.getElementById('btnRegister'),
    btnLogin: document.getElementById('btnLogin'),
    btnCreateRoom: document.getElementById('btnCreateRoom'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    segBoardSize: document.getElementById('segOnlineBoardSize'),
    segRule: document.getElementById('segOnlineRule'),
    ruleHint: document.getElementById('onlineRuleHint'),
    segPrivacy: document.getElementById('segRoomPrivacy'),
    roomStatus: document.getElementById('roomStatus'),
    lobbyGrid: document.getElementById('lobbyGrid'),
    roomCount: document.getElementById('roomCount')
  };

  var auth = { token: null, nickname: '' };
  var isPublic = true;
  var currentCode = null;
  var RULE_INFO = {
    free: '自由规则：黑方白方都无禁手，先连成五子即胜。',
    renju: '职业禁手：黑方禁止双三、双四和长连，白方无禁手；黑方犯规判白胜。',
    folk: '民间禁手：仅禁止黑方长连（超过五子），双三双四仍可下。'
  };
  var RULE_LABELS = { free: '自由', renju: '职业禁手', folk: '民间禁手' };

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function showStatus(html) {
    els.roomStatus.innerHTML = html;
    els.roomStatus.classList.remove('hidden');
  }

  function handleError(msg) {
    showStatus('<div class="room-error">' + escapeHtml(msg) + '</div>');
  }

  function updateRuleHint(rule) {
    els.ruleHint.textContent = RULE_INFO[rule] || RULE_INFO.free;
  }

  function syncSettings() {
    var s = window.GC.settings;
    els.segBoardSize.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === String(s.boardSize));
    });
    els.segRule.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === s.rule);
    });
    updateRuleHint(s.rule);
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

  function redirectToGame(code) {
    window.location.href = 'index.html?room=' + encodeURIComponent(code);
  }

  function doAuth(register) {
    var nick = els.inputNickname.value.trim();
    var pass = els.inputPassword.value;
    if (!nick || !pass) {
      handleError('请输入昵称和密码');
      return;
    }
    if (auth.token && !register) {
      if (currentCode) window.Network.leaveRoom();
      else if (window.Network.clearSession) window.Network.clearSession();
      currentCode = null;
      setAuth(null, '');
      showStatus('<div class="room-waiting">已退出登录，已离开房间</div>');
      return;
    }
    var cb = function (res) {
      if (res && res.ok) {
        setAuth(res.token, nick);
        window.GC.saveNickname(nick);
        showStatus('<div class="room-waiting">' + (register ? '注册成功' : '登录成功') + '，可以创建或加入房间</div>');
      } else {
        handleError((res && res.error) || (register ? '注册失败' : '登录失败'));
      }
    };
    if (register) window.Network.register(nick, pass, cb);
    else window.Network.login(nick, pass, cb);
  }

  function createRoom() {
    var nick = els.inputNickname.value.trim();
    if (!auth.token || !nick) {
      handleError('请先注册或登录');
      return;
    }
    window.Network.createRoom({
      token: auth.token,
      nickname: nick,
      size: window.GC.settings.boardSize || window.GC.SIZE,
      rule: window.GC.settings.rule || 'free',
      isPublic: isPublic
    });
  }

  function joinRoom(code, size, rule) {
    var nick = els.inputNickname.value.trim() || auth.nickname;
    if (!auth.token || !nick) {
      handleError('请先注册或登录');
      return;
    }
    window.Network.joinRoom({
      token: auth.token,
      nickname: nick,
      code: code,
      size: size || window.GC.settings.boardSize || window.GC.SIZE,
      rule: rule || window.GC.settings.rule || 'free'
    });
  }

  function handleRoomList(list) {
    list = list || [];
    els.roomCount.textContent = String(list.length);
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
        '<div class="room-card-meta">房主：' + escapeHtml(room.creator) + '<br>' +
        (room.size || 15) + ' 路 · ' + (RULE_LABELS[room.rule] || '自由') + '<br>人数：' + (room.players || 1) + '/2</div>' +
        '<button class="big-btn primary small" data-code="' + escapeHtml(room.code) + '" data-size="' + (room.size || 15) + '" data-rule="' + escapeHtml(room.rule || 'free') + '"' + (full ? ' disabled' : '') + '>加入</button>' +
        '</div>';
    }
    els.lobbyGrid.innerHTML = html;
  }

  function handleConnect() {
    els.connectHint.textContent = '已连接服务器';
  }

  function handleDisconnect() {
    els.connectHint.textContent = '连接已断开，正在重连...';
  }

  function handleRoomCreated(data) {
    currentCode = data.code;
    window.GC.saveNickname(els.inputNickname.value.trim());
    if (data.isPublic) {
      showStatus('<div class="room-waiting">公开房间已创建，等待对手加入...</div>');
    } else {
      showStatus('<div class="room-code-label">私密房间码</div><div class="room-code-display">' + escapeHtml(data.code) + '</div>');
    }
  }

  function handleRoomSession(data) {
    if (data && data.code) currentCode = data.code;
  }

  function handleGameStart(data) {
    var code = currentCode;
    if (!code && window.Network.getSession) {
      var session = window.Network.getSession();
      if (session && session.code) code = session.code;
    }
    if (code) redirectToGame(code);
  }

  function init() {
    window.GC.applyUiTheme();
    try {
      var saved = JSON.parse(window.localStorage.getItem('gmx_auth') || 'null');
      if (saved && saved.token) {
        auth.token = saved.token;
        auth.nickname = saved.nickname || '';
        if (auth.nickname) els.inputNickname.value = auth.nickname;
      }
    } catch (e) { /* ignore */ }
    if (window.GC.lastNickname && !els.inputNickname.value) els.inputNickname.value = window.GC.lastNickname;
    syncSettings();
    refreshAuthUI();
    window.Network.connect();

    els.btnRegister.addEventListener('click', function () { doAuth(true); });
    els.btnLogin.addEventListener('click', function () { doAuth(false); });
    els.btnCreateRoom.addEventListener('click', createRoom);
    els.btnJoinRoom.addEventListener('click', function () {
      var code = els.inputRoomCode.value.trim().toUpperCase();
      if (!code || code.length < 4) {
        handleError('请输入房间码');
        return;
      }
      joinRoom(code);
    });

    els.segBoardSize.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        els.segBoardSize.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        window.GC.setBoardSize(parseInt(b.dataset.value, 10));
        window.GC.saveSettings();
      });
    });
    els.segRule.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        els.segRule.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        window.GC.settings.rule = b.dataset.value;
        window.GC.saveSettings();
        updateRuleHint(b.dataset.value);
      });
    });
    els.segPrivacy.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        els.segPrivacy.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        isPublic = b.dataset.value === '1';
      });
    });

    els.lobbyGrid.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button[data-code]') : null;
      if (btn && !btn.disabled) {
        joinRoom(btn.getAttribute('data-code'), parseInt(btn.getAttribute('data-size'), 10), btn.getAttribute('data-rule'));
      }
    });

    window.Network.on('connect', handleConnect);
    window.Network.on('disconnect', handleDisconnect);
    window.Network.on('roomList', handleRoomList);
    window.Network.on('roomCreated', handleRoomCreated);
    window.Network.on('roomSession', handleRoomSession);
    window.Network.on('gameStart', handleGameStart);
    window.Network.on('roomRejoined', function (data) {
      if (!data) return;
      currentCode = data.code || currentCode;
      var state = data.state || {};
      var bothReady = state.players && state.players[1] && state.players[2];
      if (state.moveCount > 0 || bothReady) {
        redirectToGame(currentCode);
      } else {
        showStatus('<div class="room-waiting">已连接房间，等待对手...</div>');
      }
    });
    window.Network.on('error', handleError);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
