(function (root) {
  'use strict';

  var EMPTY = 0;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var SC = {
    five: 100000000,
    open4: 12000000,
    four: 1600000,
    live3: 130000,
    sleep3: 14000,
    live2: 1300,
    sleep2: 220,
    one: 20
  };
  var WIN_SCORE = SC.five * 2;
  var TIMEOUT = {};
  var LIVE3_MASKS = [14, 22, 26, 28];
  var FIVE_MASKS = [31, 62, 63];
  var engines = {};

  function createEngine(size) {
    var SIZE = size || 15;
    var CENTER = (SIZE - 1) / 2;
    var Z = [];
    (function initZobrist() {
      for (var r = 0; r < SIZE; r++) {
        Z.push([]);
        for (var c = 0; c < SIZE; c++) {
          Z[r].push([
            (Math.random() * 4294967295) >>> 0,
            (Math.random() * 4294967295) >>> 0
          ]);
        }
      }
    })();

    function inB(r, c) {
      return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
    }

    function boardKey(board) {
      var key = 0;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var v = board[r][c];
          if (v !== EMPTY) key ^= Z[r][c][v - 1];
        }
      }
      return key;
    }

    function countOccupied(board) {
      var n = 0;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (board[r][c] !== EMPTY) n++;
        }
      }
      return n;
    }

    function occupiedAround(board, r, c, radius) {
      var R = radius || 2;
      for (var rr = r - R; rr <= r + R; rr++) {
        for (var cc = c - R; cc <= c + R; cc++) {
          if (inB(rr, cc) && board[rr][cc] !== EMPTY) return true;
        }
      }
      return false;
    }

    // Scans one line with a sliding 6-cell window. Windows containing the
    // opponent are ignored; the result records the strongest shape found.
    function scanLine(line, p) {
      var res = {
        overline: false,
        five: false,
        open4: false,
        four: false,
        live3: false,
        sleep3: false,
        live2: false,
        sleep2: false
      };
      var mask = 0;
      var own = 0;
      var opp = 0;
      var n = line.length;

      for (var i = 0; i < n; i++) {
        var v = line[i];
        var ownBit = v === p ? 1 : 0;
        var oppBit = v !== EMPTY && v !== p ? 1 : 0;
        mask = ((mask << 1) | ownBit) & 63;
        own += ownBit;
        opp += oppBit;
        if (i >= 6) {
          var old = line[i - 6];
          if (old === p) own--;
          else if (old !== EMPTY) opp--;
        }
        if (i < 5) continue;
        if (opp > 0) continue;

        var cnt = own;
        if (mask === 63) res.overline = true;
        if (cnt >= 5) {
          if (FIVE_MASKS.indexOf(mask) >= 0) res.five = true;
          else res.four = true;
        } else if (cnt === 4) {
          if (mask === 30) res.open4 = true;
          else res.four = true;
        } else if (cnt === 3) {
          if (LIVE3_MASKS.indexOf(mask) >= 0) res.live3 = true;
          else res.sleep3 = true;
        } else if (cnt === 2) {
          if ((mask & 1) === 0 && (mask & 32) === 0) res.live2 = true;
          else res.sleep2 = true;
        }
      }
      return res;
    }

    function addResult(res, target) {
      if (res.overline) target.overline++;
      if (res.five) target.five++;
      if (res.open4) target.open4++;
      if (res.four) target.four++;
      if (res.live3) target.live3++;
      if (res.sleep3) target.sleep3++;
      if (res.live2) target.live2++;
      if (res.sleep2) target.sleep2++;
    }

    function emptyTotals() {
      return {
        overline: 0,
        five: 0,
        open4: 0,
        four: 0,
        live3: 0,
        sleep3: 0,
        live2: 0,
        sleep2: 0
      };
    }

    function scoreTotals(t) {
      if (t.five > 0) return WIN_SCORE;
      var s = t.open4 * SC.open4 +
        t.four * SC.four +
        t.live3 * SC.live3 +
        t.sleep3 * SC.sleep3 +
        t.live2 * SC.live2 +
        t.sleep2 * SC.sleep2;
      var strong = t.open4 + t.four;
      var live = t.live3;
      if (strong >= 2) s += SC.open4 * 4;
      else if (strong >= 1 && live >= 1) s += SC.open4 * 2;
      else if (live >= 2) s += SC.open4 * 1.5;
      else if (live >= 1 && t.sleep3 >= 1) s += SC.open4 * 0.5;
      return s;
    }

    function buildLocalLine(board, r, c, dr, dc) {
      var line = [];
      for (var k = -4; k <= 4; k++) {
        var rr = r + dr * k;
        var cc = c + dc * k;
        line.push(inB(rr, cc) ? board[rr][cc] : -1);
      }
      return line;
    }

    function localEval(board, r, c, p) {
      var totals = emptyTotals();
      for (var d = 0; d < 4; d++) {
        var line = buildLocalLine(board, r, c, DIRS[d][0], DIRS[d][1]);
        addResult(scanLine(line, p), totals);
      }
      return { totals: totals, score: scoreTotals(totals) };
    }

    function isForbiddenAfter(board, r, c, p, rule) {
      if (p !== 1 || rule === 'free') return false;
      board[r][c] = p;
      var t = localEval(board, r, c, p).totals;
      board[r][c] = EMPTY;
      if (rule === 'folk') return t.overline > 0;
      return t.overline > 0 || (t.open4 + t.four) >= 2 || t.live3 >= 2;
    }

    function hasWinAt(board, r, c, p) {
      board[r][c] = p;
      var win = false;
      for (var d = 0; d < 4; d++) {
        var line = buildLocalLine(board, r, c, DIRS[d][0], DIRS[d][1]);
        if (scanLine(line, p).five) {
          win = true;
          break;
        }
      }
      board[r][c] = EMPTY;
      return win;
    }

    function scoreCellMove(board, r, c, p) {
      board[r][c] = p;
      var atk = localEval(board, r, c, p);
      board[r][c] = EMPTY;
      var opp = 3 - p;
      board[r][c] = opp;
      var def = localEval(board, r, c, opp);
      board[r][c] = EMPTY;
      var center = (Math.floor(CENTER) - Math.abs(r - Math.floor(CENTER))) +
        (Math.floor(CENTER) - Math.abs(c - Math.floor(CENTER)));
      return {
        atk: atk,
        def: def,
        score: atk.score + def.score * 0.92 + center * 6,
        win: atk.totals.five > 0,
        block: def.totals.five > 0
      };
    }

    function evalCell(board, r, c, p) {
      var dirs = DIRS;
      board[r][c] = p;
      var atk = 0;
      for (var d = 0; d < dirs.length; d++) {
        var dr = dirs[d][0];
        var dc = dirs[d][1];
        var a = 1;
        for (var rr = r + dr, cc = c + dc; inB(rr, cc) && board[rr][cc] === p; rr += dr, cc += dc) a++;
        for (var rr2 = r - dr, cc2 = c - dc; inB(rr2, cc2) && board[rr2][cc2] === p; rr2 -= dr, cc2 -= dc) a++;
        var e1 = inB(r + dr, c + dc) && board[r + dr][c + dc] === EMPTY ? 1 : 0;
        var e2 = inB(r - dr, c - dc) && board[r - dr][c - dc] === EMPTY ? 1 : 0;
        if (a >= 5) atk += SC.five;
        else if (a === 4) atk += e1 + e2 === 2 ? SC.open4 : e1 + e2 === 1 ? SC.four : 0;
        else if (a === 3) atk += e1 + e2 === 2 ? SC.live3 : e1 + e2 === 1 ? SC.sleep3 : 0;
        else if (a === 2) atk += e1 + e2 === 2 ? SC.live2 : e1 + e2 === 1 ? SC.sleep2 : 0;
      }
      board[r][c] = EMPTY;
      var opp = 3 - p;
      board[r][c] = opp;
      var def = 0;
      for (var dd = 0; dd < dirs.length; dd++) {
        var dr2 = dirs[dd][0];
        var dc2 = dirs[dd][1];
        var a2 = 1;
        for (var rr3 = r + dr2, cc3 = c + dc2; inB(rr3, cc3) && board[rr3][cc3] === opp; rr3 += dr2, cc3 += dc2) a2++;
        for (var rr4 = r - dr2, cc4 = c - dc2; inB(rr4, cc4) && board[rr4][cc4] === opp; rr4 -= dr2, cc4 -= dc2) a2++;
        var e3 = inB(r + dr2, c + dc2) && board[r + dr2][c + dc2] === EMPTY ? 1 : 0;
        var e4 = inB(r - dr2, c - dc2) && board[r - dr2][c - dc2] === EMPTY ? 1 : 0;
        if (a2 >= 5) def += SC.five;
        else if (a2 === 4) def += e3 + e4 === 2 ? SC.open4 : e3 + e4 === 1 ? SC.four : 0;
        else if (a2 === 3) def += e3 + e4 === 2 ? SC.live3 : e3 + e4 === 1 ? SC.sleep3 : 0;
        else if (a2 === 2) def += e3 + e4 === 2 ? SC.live2 : e3 + e4 === 1 ? SC.sleep2 : 0;
      }
      board[r][c] = EMPTY;
      return atk + def * 0.93 +
        ((Math.floor(CENTER) - Math.abs(r - Math.floor(CENTER))) +
          (Math.floor(CENTER) - Math.abs(c - Math.floor(CENTER)))) * 4;
    }

    function getCandidates(board, p, limit, full, rule) {
      var out = [];
      var hasStone = false;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (board[r][c] !== EMPTY) {
            hasStone = true;
            continue;
          }
          if (!occupiedAround(board, r, c, 2)) continue;
          if (rule && rule !== 'free' && p === 1 && isForbiddenAfter(board, r, c, 1, rule)) continue;
          if (full) {
            var info = scoreCellMove(board, r, c, p);
            out.push({
              r: r, c: c,
              score: info.atk.score,
              opp: info.def.score,
              heu: info.score,
              win: info.win,
              block: info.block
            });
          } else {
            var s = evalCell(board, r, c, p);
            var os = evalCell(board, r, c, 3 - p);
            out.push({
              r: r, c: c,
              score: s,
              opp: os,
              heu: Math.max(s, os * 0.94),
              win: hasWinAt(board, r, c, p),
              block: hasWinAt(board, r, c, 3 - p)
            });
          }
        }
      }
      var center = Math.floor(CENTER);
      if (!hasStone) {
        out.push({ r: center, c: center, score: 0, opp: 0, heu: 0, win: false, block: false });
      } else if (!out.length) {
        out.push({ r: center, c: center, score: 0, opp: 0, heu: 0, win: false, block: false });
      }
      out.sort(function (a, b) {
        if (b.win !== a.win) return b.win ? 1 : -1;
        if (b.block !== a.block) return b.block ? 1 : -1;
        return b.heu - a.heu;
      });
      return out.slice(0, limit || 16);
    }

    function scanBoardLines(board, p) {
      var totals = emptyTotals();
      var r, c, line, i;

      for (r = 0; r < SIZE; r++) {
        addResult(scanLine(board[r], p), totals);
      }
      for (c = 0; c < SIZE; c++) {
        line = [];
        for (r = 0; r < SIZE; r++) line.push(board[r][c]);
        addResult(scanLine(line, p), totals);
      }
      for (c = 0; c < SIZE; c++) {
        line = [];
        for (r = 0, i = c; r < SIZE && i < SIZE; r++, i++) line.push(board[r][i]);
        addResult(scanLine(line, p), totals);
      }
      for (r = 1; r < SIZE; r++) {
        line = [];
        for (c = 0, i = r; c < SIZE && i < SIZE; c++, i++) line.push(board[i][c]);
        addResult(scanLine(line, p), totals);
      }
      for (c = 0; c < SIZE; c++) {
        line = [];
        for (r = 0, i = c; r < SIZE && i >= 0; r++, i--) line.push(board[r][i]);
        addResult(scanLine(line, p), totals);
      }
      for (r = 1; r < SIZE; r++) {
        line = [];
        for (c = SIZE - 1, i = r; c >= 0 && i < SIZE; c--, i++) line.push(board[i][c]);
        addResult(scanLine(line, p), totals);
      }
      return totals;
    }

    function evaluateBoard(board, p) {
      var atk = scanBoardLines(board, p);
      var def = scanBoardLines(board, 3 - p);
      return scoreTotals(atk) - scoreTotals(def) * 0.92;
    }

    function ttStore(tt, key, depth, value, flag, move) {
      if (tt.size > 120000) tt.clear();
      tt.set(key, { depth: depth, value: value, flag: flag, move: move || null });
    }

    function ttLookup(tt, key, depth, alpha, beta) {
      var e = tt.get(key);
      if (!e || e.depth < depth) return null;
      if (e.flag === 0) return e.value;
      if (e.flag === 1 && e.value >= beta) return e.value;
      if (e.flag === 2 && e.value <= alpha) return e.value;
      return null;
    }

    function orderMoves(cands, pref) {
      if (!pref) return cands;
      var copy = cands.slice();
      for (var i = 0; i < copy.length; i++) {
        if (copy[i].r === pref.r && copy[i].c === pref.c) {
          var m = copy.splice(i, 1)[0];
          copy.unshift(m);
          break;
        }
      }
      return copy;
    }

    function minimax(board, key, depth, alpha, beta, turn, ai, branch, deadline, tt, ply, rule) {
      if (performance.now() > deadline) throw TIMEOUT;
      if (depth <= 0) return evaluateBoard(board, ai);

      var cached = ttLookup(tt, key, depth, alpha, beta);
      if (cached !== null) return cached;

      var cands = getCandidates(board, turn, branch, false, rule);
      if (!cands.length) return evaluateBoard(board, ai);
      var entry = tt.get(key);
      cands = orderMoves(cands, entry ? entry.move : null);

      var isMax = turn === ai;
      var best = isMax ? -Infinity : Infinity;
      var bestMove = null;

      for (var i = 0; i < cands.length; i++) {
        var c = cands[i];
        if (c.win) {
          var winVal = isMax ? WIN_SCORE - ply : -(WIN_SCORE - ply);
          ttStore(tt, key, depth, winVal, 0, c);
          return winVal;
        }
        board[c.r][c.c] = turn;
        var childKey = key ^ Z[c.r][c.c][turn - 1];
        var v;
        try {
          v = minimax(board, childKey, depth - 1, alpha, beta, 3 - turn, ai, branch, deadline, tt, ply + 1, rule);
        } catch (e) {
          board[c.r][c.c] = EMPTY;
          throw e;
        }
        board[c.r][c.c] = EMPTY;
        if (isMax) {
          if (v > best) {
            best = v;
            bestMove = c;
          }
          if (v > alpha) alpha = v;
        } else {
          if (v < best) {
            best = v;
            bestMove = c;
          }
          if (v < beta) beta = v;
        }
        if (beta <= alpha) break;
      }

      var flag = 0;
      if (isMax) {
        if (best >= beta) flag = 1;
        else if (best <= alpha) flag = 2;
      } else {
        if (best <= alpha) flag = 2;
        else if (best >= beta) flag = 1;
      }
      if (best > -Infinity && best < Infinity) {
        ttStore(tt, key, depth, best, flag, bestMove);
      }
      return best;
    }

    function searchRoot(board, ai, branch, maxDepth, budget, rule) {
      var deadline = performance.now() + budget;
      var key = boardKey(board);
      var tt = new Map();
      var moves = getCandidates(board, ai, branch, true, rule);
      var bestMove = moves[0];
      var bestValue = -Infinity;

      for (var depth = 1; depth <= maxDepth; depth++) {
        if (performance.now() > deadline) break;
        var alpha = -Infinity;
        var beta = Infinity;
        var depthBest = null;
        var depthValue = -Infinity;
        var ordered = orderMoves(moves, tt.get(key) ? tt.get(key).move : null);

        for (var i = 0; i < ordered.length; i++) {
          if (performance.now() > deadline) break;
          var c = ordered[i];
          if (c.win) {
            depthBest = c;
            depthValue = WIN_SCORE;
            break;
          }
          board[c.r][c.c] = ai;
          var childKey = key ^ Z[c.r][c.c][ai - 1];
          var v;
          try {
            v = minimax(board, childKey, depth - 1, alpha, beta, 3 - ai, ai, branch, deadline, tt, 1, rule);
          } catch (e) {
            board[c.r][c.c] = EMPTY;
            break;
          }
          board[c.r][c.c] = EMPTY;
          if (v > depthValue) {
            depthValue = v;
            depthBest = c;
          }
          if (v > alpha) alpha = v;
        }

        if (depthBest) {
          bestMove = depthBest;
          bestValue = depthValue;
          ttStore(tt, key, depth, depthValue, 0, depthBest);
        } else {
          break;
        }
      }
      return bestMove;
    }

    function weightedPick(list) {
      var total = 0;
      var ws = [];
      for (var i = 0; i < list.length; i++) {
        var w = Math.pow(Math.max(list[i].score, list[i].opp) + 2000, 1.5) * (0.7 + Math.random() * 0.6);
        ws.push(w);
        total += w;
      }
      var roll = Math.random() * total;
      for (var j = 0; j < list.length; j++) {
        roll -= ws[j];
        if (roll <= 0) return list[j];
      }
      return list[0];
    }

    function chooseMove(board, ai, difficulty, rule) {
      rule = rule || 'free';
      var occupied = countOccupied(board);
      var center = Math.floor(CENTER);
      if (occupied === 0) return { r: center, c: center };

      var branch;
      var budget;
      var maxDepth;
      if (difficulty === 'hard') {
        branch = 12;
        budget = 420;
        maxDepth = occupied < 8 ? 5 : 4;
      } else if (difficulty === 'normal') {
        branch = 9;
        budget = 170;
        maxDepth = 3;
      } else {
        branch = 7;
        budget = 60;
        maxDepth = 2;
      }

      var cands = getCandidates(board, ai, 24, true, rule);
      if (!cands.length) return { r: center, c: center };

      var win = null;
      var block = null;
      for (var i = 0; i < cands.length; i++) {
        if (cands[i].win && !win) win = cands[i];
        if (cands[i].block && !block) block = cands[i];
      }
      if (win) return { r: win.r, c: win.c };

      if (difficulty === 'easy') {
        if (block && Math.random() < 0.72) return { r: block.r, c: block.c };
        return weightedPick(cands.slice(0, 6));
      }
      if (block) return { r: block.r, c: block.c };

      var move = searchRoot(board, ai, branch, maxDepth, budget, rule);
      if (move) return { r: move.r, c: move.c };
      return { r: cands[0].r, c: cands[0].c };
    }

    function hasWinScore(board, p) {
      var cands = getCandidates(board, p, 20, false, false);
      for (var i = 0; i < cands.length; i++) {
        if (cands[i].win) return true;
      }
      return false;
    }

    return {
      chooseMove: chooseMove,
      hasWinScore: hasWinScore,
      evalCell: evalCell,
      isForbiddenAfter: isForbiddenAfter,
      SC: SC
    };
  }

  function getEngine(size) {
    size = [9, 11, 13, 15, 19].indexOf(size) >= 0 ? size : 15;
    if (!engines[size]) engines[size] = createEngine(size);
    return engines[size];
  }

  root.AI = root.AI || {};
  root.AI.create = createEngine;
  root.AI.getEngine = getEngine;
  root.AI.SC = SC;

  if (typeof root.document === 'undefined' && typeof root.postMessage === 'function') {
    root.onmessage = function (e) {
      var msg = e.data || {};
      var engine = getEngine(msg.size);
      var move = engine.chooseMove(msg.board, msg.ai, msg.difficulty, msg.rule || 'free');
      root.postMessage({ id: msg.id, move: move });
    };
  }
})(typeof self !== 'undefined' ? self : this);
