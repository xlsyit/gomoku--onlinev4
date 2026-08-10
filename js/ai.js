(function () {
  'use strict';

  const SIZE = 15;
  const EMPTY = 0;
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const SC = {
    five: 100000000,
    open4: 8000000,
    four: 900000,
    open3: 90000,
    three: 12000,
    open2: 1100,
    two: 150,
    one: 10
  };

  function inB(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  }

  function lineScore(len, open) {
    if (len >= 5) return SC.five;
    if (len === 4) return open === 2 ? SC.open4 : open === 1 ? SC.four : 0;
    if (len === 3) return open === 2 ? SC.open3 : open === 1 ? SC.three : 0;
    if (len === 2) return open === 2 ? SC.open2 : open === 1 ? SC.two : 0;
    return open > 0 ? SC.one : 0;
  }

  function patternAt(board, r, c, p) {
    const res = [];
    for (let d = 0; d < 4; d++) {
      const dr = DIRS[d][0];
      const dc = DIRS[d][1];
      let a = 1;
      for (let rr = r + dr, cc = c + dc; inB(rr, cc) && board[rr][cc] === p; rr += dr, cc += dc) a++;
      for (let rr = r - dr, cc = c - dc; inB(rr, cc) && board[rr][cc] === p; rr -= dr, cc -= dc) a++;
      const e1 = inB(r + dr, c + dc) && board[r + dr][c + dc] === EMPTY ? 1 : 0;
      const e2 = inB(r - dr, c - dc) && board[r - dr][c - dc] === EMPTY ? 1 : 0;
      res.push({ len: a, open: e1 + e2 });
    }
    return res;
  }

  function sumPatterns(patterns) {
    let s = 0;
    let threats = 0;
    for (const x of patterns) {
      s += lineScore(x.len, x.open);
      if (x.len >= 3 && x.open >= 1) threats++;
    }
    if (threats >= 2) s += 30000;
    return s;
  }

  function evalCell(board, r, c, p) {
    board[r][c] = p;
    const atk = sumPatterns(patternAt(board, r, c, p));
    board[r][c] = EMPTY;
    const opp = 3 - p;
    board[r][c] = opp;
    const def = sumPatterns(patternAt(board, r, c, opp));
    board[r][c] = EMPTY;
    const center = (7 - Math.abs(r - 7)) + (7 - Math.abs(c - 7));
    return atk + def * 0.93 + center * 4;
  }

  function occupiedAround(board, r, c, radius) {
    const R = radius || 2;
    for (let rr = r - R; rr <= r + R; rr++) {
      for (let cc = c - R; cc <= c + R; cc++) {
        if (inB(rr, cc) && board[rr][cc] !== EMPTY) return true;
      }
    }
    return false;
  }

  function getCandidates(board, p, limit) {
    const out = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== EMPTY) continue;
        if (!occupiedAround(board, r, c, 2)) continue;
        const score = evalCell(board, r, c, p);
        const oppScore = evalCell(board, r, c, 3 - p);
        out.push({ r: r, c: c, score: score, opp: oppScore });
      }
    }
    if (!out.length) out.push({ r: 7, c: 7, score: 0, opp: 0 });
    out.sort(function (a, b) {
      return Math.max(b.score, b.opp) - Math.max(a.score, a.opp);
    });
    return out.slice(0, limit || 12);
  }

  function evaluateBoard(board, p) {
    const lines = [];
    for (let r = 0; r < SIZE; r++) {
      const line = [];
      for (let c = 0; c < SIZE; c++) line.push(board[r][c]);
      lines.push(line);
    }
    for (let c = 0; c < SIZE; c++) {
      const line = [];
      for (let r = 0; r < SIZE; r++) line.push(board[r][c]);
      lines.push(line);
    }
    for (let k = -(SIZE - 1); k <= SIZE - 1; k++) {
      const line = [];
      for (let r = 0; r < SIZE; r++) {
        const c = r - k;
        if (inB(r, c)) line.push(board[r][c]);
      }
      if (line.length >= 2) lines.push(line);
    }
    for (let k = 0; k <= 2 * (SIZE - 1); k++) {
      const line = [];
      for (let r = 0; r < SIZE; r++) {
        const c = k - r;
        if (inB(r, c)) line.push(board[r][c]);
      }
      if (line.length >= 2) lines.push(line);
    }
    let atk = 0;
    let def = 0;
    for (const line of lines) {
      let i = 0;
      while (i < line.length) {
        if (line[i] === EMPTY) {
          i++;
          continue;
        }
        const v = line[i];
        let j = i;
        while (j < line.length && line[j] === v) j++;
        const len = j - i;
        const open = (i > 0 && line[i - 1] === EMPTY ? 1 : 0) + (j < line.length && line[j] === EMPTY ? 1 : 0);
        const s = lineScore(len, open);
        if (v === p) atk += s;
        else def += s;
        i = j;
      }
    }
    return atk - def * 0.92;
  }

  function hasWinScore(board, p) {
    const cands = getCandidates(board, p, 20);
    for (const c of cands) {
      if (c.score >= SC.five) return true;
    }
    return false;
  }

  function minimax(board, depth, alpha, beta, ai, turn, branch, deadline) {
    if (performance.now() > deadline) return evaluateBoard(board, ai);
    if (depth <= 0) return evaluateBoard(board, ai);
    const cands = getCandidates(board, turn, branch);
    for (const c of cands) {
      if (c.score >= SC.five) {
        return turn === ai ? SC.five * 2 : -SC.five * 2;
      }
    }
    if (turn === ai) {
      let best = -Infinity;
      for (const c of cands) {
        board[c.r][c.c] = turn;
        const v = minimax(board, depth - 1, alpha, beta, ai, 3 - turn, branch, deadline);
        board[c.r][c.c] = EMPTY;
        if (v > best) best = v;
        if (v > alpha) alpha = v;
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Infinity;
    for (const c of cands) {
      board[c.r][c.c] = turn;
      const v = minimax(board, depth - 1, alpha, beta, ai, 3 - turn, branch, deadline);
      board[c.r][c.c] = EMPTY;
      if (v < best) best = v;
      if (v < beta) beta = v;
      if (beta <= alpha) break;
    }
    return best;
  }

  function weightedPick(list) {
    let total = 0;
    const ws = [];
    for (const c of list) {
      const w = Math.pow(Math.max(0, c.score) + 3000, 1.6) * (0.75 + Math.random() * 0.5);
      ws.push(w);
      total += w;
    }
    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      roll -= ws[i];
      if (roll <= 0) return list[i];
    }
    return list[0];
  }

  function chooseMove(board, ai, difficulty) {
    let occupied = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== EMPTY) occupied++;
      }
    }
    if (occupied === 0) return { r: 7, c: 7 };

    const branch = difficulty === 'hard' ? 12 : difficulty === 'normal' ? 10 : 8;
    const budget = difficulty === 'hard' ? 850 : difficulty === 'normal' ? 200 : 60;
    const deadline = performance.now() + budget;
    const cands = getCandidates(board, ai, 18);

    const win = cands.find(function (c) { return c.score >= SC.five; });
    if (win) return { r: win.r, c: win.c };
    const block = cands.find(function (c) { return c.opp >= SC.five; });

    if (difficulty === 'easy') {
      if (block && Math.random() < 0.72) return { r: block.r, c: block.c };
      return weightedPick(cands.slice(0, 6));
    }
    if (block) return { r: block.r, c: block.c };

    if (difficulty === 'normal') {
      let best = null;
      let bestV = -Infinity;
      for (const c of cands.slice(0, branch)) {
        board[c.r][c.c] = ai;
        const v = minimax(board, 2, -Infinity, Infinity, ai, 3 - ai, 8, deadline) + Math.random() * 40;
        board[c.r][c.c] = EMPTY;
        if (v > bestV) {
          bestV = v;
          best = c;
        }
      }
      return best ? { r: best.r, c: best.c } : { r: cands[0].r, c: cands[0].c };
    }

    const depth = occupied < 6 ? 3 : 4;
    let best = null;
    let bestV = -Infinity;
    const top = cands.slice(0, branch);
    for (const c of top) {
      board[c.r][c.c] = ai;
      const v = minimax(board, depth - 1, -Infinity, Infinity, ai, 3 - ai, 10, deadline);
      board[c.r][c.c] = EMPTY;
      if (v > bestV) {
        bestV = v;
        best = c;
      }
    }
    if (best) return { r: best.r, c: best.c };
    return { r: cands[0].r, c: cands[0].c };
  }

  window.AI = {
    chooseMove: chooseMove,
    hasWinScore: hasWinScore,
    evalCell: evalCell,
    SC: SC
  };
})();
