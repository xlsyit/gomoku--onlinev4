'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var db = require('./database');
var RoomManager = require('./room-manager');

var PORT = process.env.PORT || 3000;
var sessions = {};

function safeDb(fn) {
  try {
    return fn();
  } catch (e) {
    console.error('[db] write failed:', e && e.message ? e.message : e);
    return null;
  }
}

var app = express();
var server = http.createServer(app);
var io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/leaderboard', function (req, res) {
  try {
    var list = db.getLeaderboard();
    res.json({ ok: true, data: list });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get('/api/player/:nickname', function (req, res) {
  try {
    var player = db.getPlayer(req.params.nickname);
    res.json({ ok: true, data: player });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.post('/api/register', function (req, res) {
  try {
    var result = db.registerUser(req.body && req.body.nickname, req.body && req.body.password);
    if (result.ok) {
      sessions[result.token] = result.data.nickname;
      res.json({ ok: true, token: result.token, data: result.data });
    } else {
      res.json(result);
    }
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.post('/api/login', function (req, res) {
  try {
    var result = db.loginUser(req.body && req.body.nickname, req.body && req.body.password);
    if (result.ok) {
      sessions[result.token] = result.data.nickname;
      res.json({ ok: true, token: result.token, data: result.data });
    } else {
      res.json(result);
    }
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

function broadcastRooms() {
  io.emit('roomList', RoomManager.listPublicRooms());
}

function emitGameStart(room, code) {
  var start = {
    black: { nickname: room.players[1].nickname, color: 1 },
    white: { nickname: room.players[2].nickname, color: 2 },
    size: room.boardSize,
    rule: room.rule || 'free',
    renju: !!(room.rule && room.rule !== 'free')
  };
  io.to(room.players[1].socketId).emit('gameStart', {
    black: start.black,
    white: start.white,
    size: start.size,
    rule: start.rule,
    renju: start.renju,
    youColor: 1,
    myNickname: room.players[1].nickname
  });
  io.to(room.players[2].socketId).emit('gameStart', {
    black: start.black,
    white: start.white,
    size: start.size,
    rule: start.rule,
    renju: start.renju,
    youColor: 2,
    myNickname: room.players[2].nickname
  });
}

io.on('connection', function (socket) {
  var myNickname = '';
  var myRoomCode = null;

  socket.emit('roomList', RoomManager.listPublicRooms());

  socket.on('createRoom', function (data) {
    var nickname = data && data.nickname;
    var token = data && data.token;
    if (!nickname || !token || sessions[token] !== String(nickname).trim()) {
      socket.emit('error', '请先注册或登录');
      return;
    }
    myNickname = String(nickname).trim().slice(0, 12);
    var created = RoomManager.createRoom(socket.id, myNickname, token, {
      boardSize: data.size,
      rule: data.rule,
      isPublic: data.isPublic
    });
    var code = created.code;
    myRoomCode = code;
    socket.join(code);
    socket.emit('roomSession', { code: code, color: 1, token: created.token });
    socket.emit('roomCreated', { code: code, color: 1, isPublic: !!data.isPublic });
    broadcastRooms();
  });

  socket.on('joinRoom', function (data) {
    var nickname = (data && data.nickname) || '';
    var token = (data && data.token) || '';
    var code = ((data && data.code) || '').toUpperCase().trim();
    if (!nickname || !token || sessions[token] !== String(nickname).trim()) {
      socket.emit('error', '请先注册或登录');
      return;
    }
    if (code.length === 0) {
      socket.emit('error', '请输入房间码');
      return;
    }
    myNickname = String(nickname).trim().slice(0, 12);
    var result = RoomManager.joinRoom(code, socket.id, myNickname, token, {
      boardSize: data.size,
      rule: data.rule
    });
    if (result.error) {
      socket.emit('error', result.error);
      return;
    }
    var room = result.room;
    myRoomCode = code;
    socket.join(code);
    socket.emit('roomSession', { code: code, color: 2, token: room.players[2].token });

    socket.to(code).emit('opponentJoined', { nickname: myNickname });
    emitGameStart(room, code);
    broadcastRooms();
  });

  socket.on('rejoinRoom', function (data) {
    var code = ((data && data.code) || '').toUpperCase().trim();
    var token = (data && data.token) || '';
    if (!code || !token) {
      socket.emit('error', '重连信息不完整');
      return;
    }
    var result = RoomManager.rejoinRoom(code, token, socket.id);
    if (result.error) {
      socket.emit('error', result.error);
      return;
    }
    myNickname = result.nickname;
    myRoomCode = code;
    socket.join(code);
    socket.emit('roomRejoined', {
      color: result.color,
      state: result.state,
      code: code,
      token: token
    });
    socket.to(code).emit('opponentRejoined', { nickname: myNickname });
  });

  socket.on('move', function (data) {
    if (!myRoomCode) return;
    var r = data ? data.r : -1;
    var c = data ? data.c : -1;
    if (typeof r !== 'number' || typeof c !== 'number') return;

    var result = RoomManager.validateMove(socket.id, myRoomCode, r, c);
    if (result.error) {
      socket.emit('error', result.error);
      return;
    }

    var room = result.room;
    var color = result.color;
    RoomManager.applyMove(room, color, r, c);

    socket.to(myRoomCode).emit('opponentMove', { r: r, c: c, color: color, winner: room.winner });
  });

  socket.on('chat', function (message) {
    if (!myRoomCode || !myNickname) return;
    if (!message || message.trim().length === 0) return;
    var text = myNickname.slice(0, 12) + ': ' + message.trim().slice(0, 100);
    socket.to(myRoomCode).emit('chat', { text: text });
  });

  socket.on('gameEnd', function (data) {
    if (!myRoomCode) return;
    var room = RoomManager.getRoom(myRoomCode);
    if (!room || room.resultReported) return;

    var winner = data && data.winner;
    RoomManager.setGameOver(myRoomCode);
    room.resultReported = true;

    // 'abort' means someone left during game — don't update ranking
    if (winner === 'abort') return;

    if (winner === 'draw') {
      var p1Nick = room.players[1] ? room.players[1].nickname : null;
      var p2Nick = room.players[2] ? room.players[2].nickname : null;
      if (p1Nick && p2Nick) safeDb(function () { db.updateDraw(p1Nick, p2Nick); });
    } else if (winner === 1 || winner === 2) {
      var winNick = room.players[winner] ? room.players[winner].nickname : null;
      var loseColor = winner === 1 ? 2 : 1;
      var loseNick = room.players[loseColor] ? room.players[loseColor].nickname : null;
      if (winNick && loseNick) safeDb(function () { db.updateResult(winNick, loseNick); });
    }
  });

  socket.on('rematchRequest', function () {
    if (!myRoomCode || !myNickname) return;
    var room = RoomManager.getRoom(myRoomCode);
    if (!room || !room.gameOver) return;
    socket.to(myRoomCode).emit('rematchRequested', { nickname: myNickname });
  });

  socket.on('rematchAccept', function () {
    if (!myRoomCode || !myNickname) return;
    var room = RoomManager.getRoom(myRoomCode);
    if (!room || !room.gameOver) return;
    if (!room.players[1] || !room.players[1].connected || !room.players[2] || !room.players[2].connected) {
      socket.emit('error', '对手不在线，无法再战');
      return;
    }
    room.gameOver = false;
    room.winner = 0;
    room.resultReported = false;
    room.board = null;
    room.moveCount = 0;
    room.lastMove = null;
    room.currentTurn = 1;

    var oldBlack = room.players[1];
    var oldWhite = room.players[2];
    room.players[1] = oldWhite;
    room.players[2] = oldBlack;

    io.to(room.players[1].socketId).emit('roomSession', { code: room.code, color: 1, token: room.players[1].token });
    io.to(room.players[2].socketId).emit('roomSession', { code: room.code, color: 2, token: room.players[2].token });
    emitGameStart(room, room.code);
  });

  socket.on('rematchDecline', function () {
    if (!myRoomCode || !myNickname) return;
    socket.to(myRoomCode).emit('rematchDeclined', { nickname: myNickname });
  });

  socket.on('disconnect', function () {
    var result = RoomManager.markDisconnected(socket.id);
    if (result && result.room) {
      socket.to(result.code).emit('opponentLeft', {
        nickname: result.leftNickname,
        youWin: false,
        reconnecting: true
      });
    }
  });

  socket.on('leaveRoom', function () {
    var result = RoomManager.removePlayer(socket.id);
    if (result && result.room) {
      var started = result.room.moveCount > 0 || result.room.board !== null;
      var forfeit = started && result.winnerColor && !result.room.resultReported;
      if (forfeit) result.room.resultReported = true;
      socket.to(result.room.code).emit('opponentLeft', {
        nickname: result.leftNickname,
        youWin: !!forfeit
      });
      socket.leave(result.room.code);
      broadcastRooms();
    }
    myRoomCode = null;
  });
});

setInterval(function () {
  var expired = RoomManager.checkRejoinTimeouts(Date.now());
  for (var i = 0; i < expired.length; i++) {
    var item = expired[i];
    var started = item.room.moveCount > 0 || item.room.board !== null;
    if (started && item.winnerColor && !item.room.resultReported) {
      item.room.resultReported = true;
      var winColor = item.winnerColor;
      var loseColor = winColor === 1 ? 2 : 1;
      var winNick = item.room.players[winColor] ? item.room.players[winColor].nickname : null;
      var loseNick = item.leftNickname;
      if (winNick && loseNick) safeDb(function () { db.updateResult(winNick, loseNick); });
    }
    io.to(item.code).emit('opponentLeft', {
      nickname: item.leftNickname,
      youWin: started,
      reconnecting: false
    });
  }
  if (expired.length) broadcastRooms();
}, 5000);

process.on('uncaughtException', function (err) {
  console.error('[server] uncaught exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', function (reason) {
  console.error('[server] unhandled rejection:', reason);
});

server.listen(PORT, function () {
  console.log('Gomoku Nexus v4 server running on port ' + PORT);
});
