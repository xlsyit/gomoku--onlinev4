(function () {
  'use strict';

  window.GC.applyUiTheme();

  window.Cover.init({
    start: function (settings) {
      window.Gomoku.startGame(settings);
    }
  });
  window.Gomoku.init({});

  if (window.location.search.indexOf('room=') >= 0 && window.Network && !window.Network.isConnected()) {
    window.Network.connect();
  }
})();
