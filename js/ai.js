(function () {
  'use strict';

  var core = window.AI;
  var worker = null;
  var seq = 0;
  var pending = {};

  function currentRule(rule) {
    if (rule !== undefined) return rule;
    if (window.GC && window.GC.settings) return window.GC.settings.rule || 'free';
    return 'free';
  }

  function engine() {
    var size = window.GC ? window.GC.SIZE : 15;
    return core.getEngine(size);
  }

  function chooseMove(board, ai, difficulty, rule) {
    return engine().chooseMove(board, ai, difficulty, currentRule(rule));
  }

  function chooseMoveAsync(board, ai, difficulty, rule) {
    var size = window.GC ? window.GC.SIZE : 15;
    var ruleOn = currentRule(rule);
    return new Promise(function (resolve) {
      function fallback() {
        setTimeout(function () {
          resolve(chooseMove(board, ai, difficulty, ruleOn));
        }, 0);
      }
      if (typeof Worker === 'undefined' || window.location.protocol === 'file:') {
        fallback();
        return;
      }
      if (!worker) {
        try {
          worker = new Worker('js/ai-core.js');
          worker.onmessage = function (e) {
            var d = e.data || {};
            if (pending[d.id]) {
              var done = pending[d.id];
              delete pending[d.id];
              if (done.timer) clearTimeout(done.timer);
              done(d.move || null);
            }
          };
          worker.onerror = function () {
            worker = null;
            var ids = Object.keys(pending);
            for (var i = 0; i < ids.length; i++) {
              var item = pending[ids[i]];
              if (!item) continue;
              if (item.timer) clearTimeout(item.timer);
              item.resolve(chooseMove(item.board, item.ai, item.difficulty, item.rule));
            }
            pending = {};
          };
        } catch (e) {
          worker = null;
        }
      }
      if (!worker) {
        fallback();
        return;
      }
      var id = ++seq;
      pending[id] = {
        resolve: resolve,
        board: board,
        ai: ai,
        difficulty: difficulty || 'normal',
        rule: ruleOn,
        timer: setTimeout(function () {
          var item = pending[id];
          if (!item) return;
          delete pending[id];
          item.resolve(chooseMove(item.board, item.ai, item.difficulty, item.rule));
        }, 2500)
      };
      var copy = [];
      for (var r = 0; r < board.length; r++) copy.push(board[r].slice());
      worker.postMessage({
        id: id,
        board: copy,
        ai: ai,
        difficulty: difficulty || 'normal',
        rule: ruleOn,
        size: size
      });
    });
  }

  window.AI = {
    chooseMove: chooseMove,
    chooseMoveAsync: chooseMoveAsync,
    getEngine: core.getEngine,
    create: core.create,
    hasWinScore: function (board, p) {
      return engine().hasWinScore(board, p);
    },
    evalCell: function (board, r, c, p) {
      return engine().evalCell(board, r, c, p);
    },
    isForbiddenAfter: function (board, r, c, p, rule) {
      return engine().isForbiddenAfter(board, r, c, p, currentRule(rule));
    },
    SC: core.SC
  };
})();
