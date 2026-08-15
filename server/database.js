'use strict';

var crypto = require('crypto');
var path = require('path');

var Database;
try {
  Database = require('node:sqlite').DatabaseSync;
} catch (e) {
  // Fallback for older Node versions if better-sqlite3 is installed manually.
  Database = require('better-sqlite3');
}

var dbPath = path.join(__dirname, 'gomoku.db');
var db = new Database(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA synchronous = NORMAL');

db.exec([
  'CREATE TABLE IF NOT EXISTS users (',
  '  nickname TEXT PRIMARY KEY,',
  '  password_hash TEXT NOT NULL,',
  '  salt TEXT NOT NULL,',
  '  wins    INTEGER NOT NULL DEFAULT 0,',
  '  losses  INTEGER NOT NULL DEFAULT 0,',
  '  draws   INTEGER NOT NULL DEFAULT 0,',
  '  rating  INTEGER NOT NULL DEFAULT 1000,',
  '  last_active TEXT NOT NULL DEFAULT (datetime(\'now\'))',
  ')'
].join('\n'));

var stmtUpsert = db.prepare([
  'INSERT INTO users (nickname, password_hash, salt, wins, losses, draws, rating, last_active)',
  'VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
  'ON CONFLICT(nickname) DO UPDATE SET',
  '  wins = wins + ?4,',
  '  losses = losses + ?5,',
  '  draws = draws + ?6,',
  '  rating = rating + ?7,',
  '  last_active = datetime(\'now\')'
].join('\n'));

var stmtGetUser = db.prepare('SELECT * FROM users WHERE nickname = ?');
var stmtInsertUser = db.prepare([
  'INSERT INTO users (nickname, password_hash, salt, wins, losses, draws, rating, last_active)',
  'VALUES (?, ?, ?, 0, 0, 0, 1000, datetime(\'now\'))'
].join('\n'));
var stmtGetLeaderboard = db.prepare(
  'SELECT nickname, wins, losses, draws, rating FROM users ORDER BY rating DESC LIMIT 50'
);

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function safeEqual(a, b) {
  var ba = Buffer.from(a, 'hex');
  var bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function publicUser(row) {
  if (!row) return null;
  return {
    nickname: row.nickname,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    rating: row.rating,
    last_active: row.last_active
  };
}

function registerUser(nickname, password) {
  var nick = String(nickname || '').trim().slice(0, 12);
  var pass = String(password || '');
  if (!nick || pass.length < 4) {
    return { ok: false, error: '昵称不能为空，密码至少 4 位' };
  }
  if (stmtGetUser.get(nick)) {
    return { ok: false, error: '昵称已存在，请直接登录' };
  }
  var salt = crypto.randomBytes(16).toString('hex');
  var hash = hashPassword(pass, salt);
  stmtInsertUser.run(nick, hash, salt);
  return { ok: true, token: crypto.randomBytes(24).toString('hex'), data: publicUser(stmtGetUser.get(nick)) };
}

function loginUser(nickname, password) {
  var nick = String(nickname || '').trim().slice(0, 12);
  var pass = String(password || '');
  var row = stmtGetUser.get(nick);
  if (!row || !safeEqual(row.password_hash, hashPassword(pass, row.salt))) {
    return { ok: false, error: '昵称或密码错误' };
  }
  db.prepare('UPDATE users SET last_active = datetime(\'now\') WHERE nickname = ?').run(nick);
  return { ok: true, token: crypto.randomBytes(24).toString('hex'), data: publicUser(row) };
}

function updateResult(winner, loser) {
  if (winner && loser) {
    stmtUpsert.run(winner, '', '', 1, 0, 0, 30);
    stmtUpsert.run(loser, '', '', 0, 1, 0, -10);
  } else if (winner) {
    stmtUpsert.run(winner, '', '', 1, 0, 0, 32);
  } else if (loser) {
    stmtUpsert.run(loser, '', '', 0, 1, 0, -10);
  }
}

function updateDraw(nick1, nick2) {
  stmtUpsert.run(nick1, '', '', 0, 0, 1, 5);
  if (nick2 && nick2 !== nick1) {
    stmtUpsert.run(nick2, '', '', 0, 0, 1, 5);
  }
}

function getLeaderboard() {
  return stmtGetLeaderboard.all();
}

function getPlayer(nickname) {
  return publicUser(stmtGetUser.get(String(nickname || '').trim()));
}

module.exports = {
  registerUser: registerUser,
  loginUser: loginUser,
  updateResult: updateResult,
  updateDraw: updateDraw,
  getLeaderboard: getLeaderboard,
  getPlayer: getPlayer
};
