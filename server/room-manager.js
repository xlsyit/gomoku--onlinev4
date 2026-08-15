'use strict';

var rooms = {};
var IDLE_TIMEOUT = 10 * 60 * 1000;
var REJOIN_GRACE = 60 * 1000;
var idleTimer = null;

function makeToken() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var token = '';
  for (var i = 0; i < 18; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function normalizeSize(n) {
  n = parseInt(n, 10);
  return [9, 11, 13, 15, 19].indexOf(n) >= 0 ? n : 15;
}

function normalizeRule(r) {
  return ['free', 'renju', 'folk'].indexOf(r) >= 0 ? r : 'free';
}

function createRoom(socketId, nickname, token, opts) {
  var code = generateCode();
  while (rooms[code]) {
    code = generateCode();
  }
  var size = normalizeSize(opts && opts.boardSize);
  rooms[code] = {
    code: code,
    boardSize: size,
    rule: normalizeRule(opts && opts.rule),
    isPublic: !!(opts && opts.isPublic),
    players: {
      1: { socketId: socketId, nickname: nickname, token: token || makeToken(), connected: true, disconnectedAt: null },
      2: null
    },
    currentTurn: 1,
    board: null,
    moveCount: 0,
    lastMove: null,
    createdAt: Date.now(),
    gameOver: false,
    winner: 0,
    resultReported: false
  };
  return { code: code, token: rooms[code].players[1].token };
}

function joinRoom(code, socketId, nickname, token, opts) {
  var room = rooms[code];
  if (!room) return { error: '房间不存在' };
  if (room.players[2]) return { error: '房间已满' };
  if (room.gameOver) return { error: '游戏已结束' };
  var size = normalizeSize(opts && opts.boardSize);
  if (size !== room.boardSize) return { error: '棋盘大小不一致' };
  if (normalizeRule(opts && opts.rule) !== room.rule) return { error: '对局规则不一致' };
  room.players[2] = { socketId: socketId, nickname: nickname, token: token || makeToken(), connected: true, disconnectedAt: null };
  return { room: room };
}

function getRoom(code) {
  return rooms[code] || null;
}

function removePlayer(socketId) {
  for (var code in rooms) {
    var room = rooms[code];
    for (var color = 1; color <= 2; color++) {
      if (room.players[color] && room.players[color].socketId === socketId) {
        return removePlayerByColor(room, color);
      }
    }
  }
  return null;
}

function getPlayerColor(socketId, room) {
  if (room.players[1] && room.players[1].socketId === socketId) return 1;
  if (room.players[2] && room.players[2].socketId === socketId) return 2;
  return 0;
}

function getPlayerNickname(socketId, room) {
  var color = getPlayerColor(socketId, room);
  if (color === 0) return null;
  return room.players[color].nickname;
}

function removePlayerByColor(room, color) {
  var code = room.code;
  if (color === 2 && room.players[2]) {
    var leftNick = room.players[2].nickname;
    room.players[2] = null;
    room.gameOver = true;
    room.winner = 1;
    return { room: room, code: code, leftNickname: leftNick, winnerColor: 1 };
  }
  if (color === 1 && room.players[1]) {
    if (room.players[2]) {
      var leftNick2 = room.players[1].nickname;
      room.gameOver = true;
      room.winner = 2;
      delete rooms[code];
      return { room: room, code: code, leftNickname: leftNick2, winnerColor: 2 };
    }
    delete rooms[code];
    return null;
  }
  return null;
}

function markDisconnected(socketId) {
  for (var code in rooms) {
    var room = rooms[code];
    for (var color = 1; color <= 2; color++) {
      var p = room.players[color];
      if (p && p.socketId === socketId) {
        if (p.disconnectedAt) return null;
        p.connected = false;
        p.disconnectedAt = Date.now();
        return { room: room, code: code, leftNickname: p.nickname, color: color };
      }
    }
  }
  return null;
}

function rejoinRoom(code, token, socketId) {
  var room = rooms[code];
  if (!room) return { error: '房间不存在或已过期' };
  for (var color = 1; color <= 2; color++) {
    var p = room.players[color];
    if (p && p.token === token) {
      p.socketId = socketId;
      p.connected = true;
      p.disconnectedAt = null;
      return {
        room: room,
        color: color,
        nickname: p.nickname,
        state: getState(room)
      };
    }
  }
  return { error: '重新加入失败，令牌无效' };
}

function getState(room) {
  var size = room.boardSize || 15;
  var board = [];
  if (!room.board) {
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) row.push(0);
      board.push(row);
    }
  } else {
    for (var rr = 0; rr < size; rr++) board.push(room.board[rr].slice());
  }
  return {
    board: board,
    size: size,
    rule: room.rule || 'free',
    renju: !!room.renju || (room.rule && room.rule !== 'free'),
    currentTurn: room.currentTurn,
    winner: room.winner,
    gameOver: room.gameOver,
    moveCount: room.moveCount,
    lastMove: room.lastMove ? { r: room.lastMove.r, c: room.lastMove.c } : null,
    players: {
      1: room.players[1] ? room.players[1].nickname : null,
      2: room.players[2] ? room.players[2].nickname : null
    }
  };
}

function checkRejoinTimeouts(now) {
  var expired = [];
  for (var code in rooms) {
    var room = rooms[code];
    for (var color = 1; color <= 2; color++) {
      var p = room.players[color];
      if (p && p.disconnectedAt && now - p.disconnectedAt >= REJOIN_GRACE) {
        var other = color === 1 ? 2 : 1;
        if (!room.gameOver && room.players[other] && room.players[other].disconnectedAt) {
          delete rooms[code];
          break;
        }
        if (room.gameOver) {
          room.players[color] = null;
          if (!room.players[1] && !room.players[2]) delete rooms[code];
        } else {
          var res = removePlayerByColor(room, color);
          if (res) expired.push(res);
        }
        break;
      }
    }
  }
  return expired;
}

function validateMove(socketId, code, r, c) {
  var room = rooms[code];
  if (!room) return { error: '房间不存在' };
  if (room.gameOver) return { error: '游戏已结束' };
  var color = getPlayerColor(socketId, room);
  if (color === 0) return { error: '不在房间中' };
  if (room.currentTurn !== color) return { error: '不是你的回合' };
  if (!room.board) {
    room.board = [];
    for (var i = 0; i < room.boardSize; i++) {
      var row = [];
      for (var j = 0; j < room.boardSize; j++) row.push(0);
      room.board.push(row);
    }
  }
  if (r < 0 || r >= room.boardSize || c < 0 || c >= room.boardSize) return { error: '坐标越界' };
  if (room.board[r][c] !== 0) return { error: '位置已被占据' };
  if (room.rule && room.rule !== 'free' && color === 1 && isRenjuForbidden(room.board, r, c, room.boardSize, room.rule)) {
    return { error: '黑方禁手，白方获胜' };
  }
  return { room: room, color: color };
}

var RENJU_LIVE3_MASKS = [14, 22, 26, 28];

function renjuLineShape(line) {
  var res = { overline: false, four: false, live3: false };
  var mask = 0;
  var own = 0;
  var opp = 0;
  for (var i = 0; i < line.length; i++) {
    var v = line[i];
    var ownBit = v === 1 ? 1 : 0;
    var oppBit = v !== 0 && v !== 1 ? 1 : 0;
    mask = ((mask << 1) | ownBit) & 63;
    own += ownBit;
    opp += oppBit;
    if (i >= 6) {
      var old = line[i - 6];
      if (old === 1) own--;
      else if (old !== 0) opp--;
    }
    if (i < 5) continue;
    if (opp > 0) continue;
    if (mask === 63) res.overline = true;
    if (own === 4) res.four = true;
    else if (own === 3 && RENJU_LIVE3_MASKS.indexOf(mask) >= 0) res.live3 = true;
  }
  return res;
}

function isRenjuForbidden(board, r, c, size, rule) {
  var n = size || board.length || 15;
  if (board[r][c] !== 0) return false;
  board[r][c] = 1;
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var overline = false;
  var fours = 0;
  var live3 = 0;
  for (var d = 0; d < dirs.length; d++) {
    var dr = dirs[d][0];
    var dc = dirs[d][1];
    var line = [];
    for (var k = -4; k <= 4; k++) {
      var rr = r + dr * k;
      var cc = c + dc * k;
      line.push(rr >= 0 && rr < n && cc >= 0 && cc < n ? board[rr][cc] : -1);
    }
    var shape = renjuLineShape(line);
    if (shape.overline) overline = true;
    if (shape.four) fours++;
    if (shape.live3) live3++;
  }
  board[r][c] = 0;
  if (rule === 'folk') return overline;
  return overline || fours >= 2 || live3 >= 2;
}

function hasFive(board, r, c, color, size) {
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var n = size || board.length || 15;
  for (var d = 0; d < dirs.length; d++) {
    var dr = dirs[d][0];
    var dc = dirs[d][1];
    var len = 1;
    for (var rr = r + dr, cc = c + dc; rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr][cc] === color; rr += dr, cc += dc) len++;
    for (var rr2 = r - dr, cc2 = c - dc; rr2 >= 0 && rr2 < n && cc2 >= 0 && cc2 < n && board[rr2][cc2] === color; rr2 -= dr, cc2 -= dc) len++;
    if (len >= 5) return true;
  }
  return false;
}

function applyMove(room, color, r, c) {
  if (!room.board) return { winner: 0 };
  room.board[r][c] = color;
  room.moveCount++;
  room.lastMove = { r: r, c: c };
  if (hasFive(room.board, r, c, color, room.boardSize)) {
    room.gameOver = true;
    room.winner = color;
    return { winner: color };
  }
  room.currentTurn = color === 1 ? 2 : 1;
  return { winner: 0 };
}

function setGameOver(code) {
  var room = rooms[code];
  if (room) room.gameOver = true;
}

function cleanupIdle() {
  var now = Date.now();
  for (var code in rooms) {
    var room = rooms[code];
    if (now - room.createdAt > IDLE_TIMEOUT) {
      delete rooms[code];
    }
  }
}

function listPublicRooms() {
  var list = [];
  for (var code in rooms) {
    var room = rooms[code];
    if (!room.isPublic || room.gameOver) continue;
    list.push({
      code: code,
      creator: room.players[1] ? room.players[1].nickname : '?',
      size: room.boardSize,
      rule: room.rule || 'free',
      players: room.players[2] ? 2 : 1
    });
  }
  return list;
}

function startIdleCleanup() {
  if (idleTimer) clearInterval(idleTimer);
  idleTimer = setInterval(cleanupIdle, 60000);
}

startIdleCleanup();

module.exports = {
  createRoom: createRoom,
  joinRoom: joinRoom,
  getRoom: getRoom,
  removePlayer: removePlayer,
  getPlayerColor: getPlayerColor,
  getPlayerNickname: getPlayerNickname,
  validateMove: validateMove,
  applyMove: applyMove,
  setGameOver: setGameOver,
  hasFive: hasFive,
  isRenjuForbidden: isRenjuForbidden,
  markDisconnected: markDisconnected,
  rejoinRoom: rejoinRoom,
  getState: getState,
  checkRejoinTimeouts: checkRejoinTimeouts,
  listPublicRooms: listPublicRooms
};
