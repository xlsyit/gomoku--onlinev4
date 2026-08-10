(function () {
  'use strict';

  window.Cover.init({
    start: function (settings) {
      window.Gomoku.startGame(settings);
    }
  });
  window.Gomoku.init({});
})();
