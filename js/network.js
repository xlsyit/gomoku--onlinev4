(function () {
  'use strict';

  var socket = null;
  var connected = false;
  var activeSession = null;
  var SESSION_KEY = 'gmx_room_session_v4';
  var handlers = {
    roomCreated: [],
    roomList: [],
    roomSession: [],
    roomRejoined: [],
    opponentJoined: [],
    opponentRejoined: [],
    gameStart: [],
    opponentMove: [],
    opponentLeft: [],
    chat: [],
    error: [],
    disconnect: [],
    connect: [],
    rematchRequested: [],
    rematchDeclined: []
  };

  function getServerUrl() {
    if (window.GC && window.GC.SERVER_URL) return window.GC.SERVER_URL;
    if (window.location.protocol === 'file:') return 'http://127.0.0.1:3000';
    var host = window.location.hostname;
    var port = window.location.port;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://' + host + ':3000';
    }
    // When deployed behind Nginx reverse proxy, port is typically 80/443
    // and the page is served from the same origin as the API
    return window.location.origin;
  }

  function getApiUrl() {
    if (window.location.protocol === 'file:') return 'http://127.0.0.1:3000';
    return window.location.origin;
  }

  function loadActiveSession() {
    if (activeSession) return activeSession;
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) activeSession = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return activeSession;
  }

  function saveActiveSession(data) {
    activeSession = {
      code: data.code,
      color: data.color,
      token: data.token,
      nickname: data.nickname || ''
    };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
    } catch (e) { /* ignore */ }
  }

  function clearActiveSession() {
    activeSession = null;
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* ignore */ }
  }

  function on(event, fn) {
    if (handlers[event]) handlers[event].push(fn);
  }

  function off(event, fn) {
    if (!handlers[event]) return;
    handlers[event] = handlers[event].filter(function (f) { return f !== fn; });
  }

  function emit(event, data) {
    if (!socket || !connected) return;
    socket.emit(event, data);
  }

  function connect() {
    if (socket) socket.disconnect();
    var url = getServerUrl();
    socket = window.io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 20,
      timeout: 10000
    });
    bindSocketEvents();
  }

  function disconnect() {
    clearActiveSession();
    if (socket) {
      socket.disconnect();
      socket = null;
      connected = false;
    }
  }

  function isConnected() {
    return connected;
  }

  function bindSocketEvents() {
    var events = [
      'roomCreated', 'roomList', 'roomSession', 'roomRejoined',
      'opponentJoined', 'opponentRejoined', 'gameStart',
      'opponentMove', 'opponentLeft', 'chat', 'error',
      'rematchRequested', 'rematchDeclined'
    ];
    socket.on('connect', function () {
      connected = true;
      fire('connect', []);
      var session = loadActiveSession();
      if (session && session.code && session.token) {
        socket.emit('rejoinRoom', { code: session.code, token: session.token });
      }
    });
    socket.on('disconnect', function () {
      connected = false;
      fire('disconnect', []);
    });
    socket.on('connect_error', function () {
      connected = false;
      fire('disconnect', []);
    });
    for (var i = 0; i < events.length; i++) {
      (function (evt) {
        socket.on(evt, function (data) {
          if (evt === 'roomSession' && data) {
            saveActiveSession(data);
          }
          if (evt === 'gameStart' && data && data.myNickname) {
            var session = loadActiveSession();
            if (session) {
              session.nickname = data.myNickname;
              if (data.youColor) session.color = data.youColor;
              saveActiveSession(session);
            }
          }
          fire(evt, [data]);
        });
      })(events[i]);
    }
  }

  function fire(event, args) {
    var list = handlers[event];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try { list[i].apply(null, args); } catch (e) { console.error('Network handler error:', e); }
    }
  }

  function apiPost(path, body, cb) {
    var url = getApiUrl() + path;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = 8000;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          var res = JSON.parse(xhr.responseText);
          cb(res || { ok: false, error: '服务器响应异常' });
        } catch (e) {
          cb({ ok: false, error: '服务器响应异常' });
        }
      }
    };
    xhr.onerror = function () { cb({ ok: false, error: '无法连接服务器' }); };
    xhr.ontimeout = function () { cb({ ok: false, error: '请求超时' }); };
    xhr.send(JSON.stringify(body || {}));
  }

  function getLeaderboard(cb) {
    var url = getApiUrl() + '/api/leaderboard';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var res = JSON.parse(xhr.responseText);
            cb(res.ok ? res.data : null);
          } catch (e) { cb(null); }
        } else {
          cb(null);
        }
      }
    };
    xhr.onerror = function () { cb(null); };
    xhr.ontimeout = function () { cb(null); };
    xhr.send();
  }

  window.Network = {
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    on: on,
    off: off,
    register: function (nickname, password, cb) {
      apiPost('/api/register', { nickname: nickname, password: password }, cb);
    },
    login: function (nickname, password, cb) {
      apiPost('/api/login', { nickname: nickname, password: password }, cb);
    },
    createRoom: function (data) { emit('createRoom', data); },
    joinRoom: function (data) { emit('joinRoom', data); },
    rejoinRoom: function (code, token) { emit('rejoinRoom', { code: code, token: token }); },
    sendMove: function (r, c) { emit('move', { r: r, c: c }); },
    sendGameEnd: function (winner) { emit('gameEnd', { winner: winner }); },
    sendChat: function (message) { emit('chat', message); },
    leaveRoom: function () {
      emit('leaveRoom');
      clearActiveSession();
    },
    requestRematch: function () { emit('rematchRequest'); },
    acceptRematch: function () { emit('rematchAccept'); },
    declineRematch: function () { emit('rematchDecline'); },
    getSession: loadActiveSession,
    clearSession: clearActiveSession,
    getLeaderboard: getLeaderboard
  };
})();
