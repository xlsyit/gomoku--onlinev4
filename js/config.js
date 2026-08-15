(function () {
  'use strict';

  function starsFor(size) {
    if (size === 9) return [[2, 2], [4, 4], [6, 6]];
    if (size === 13) return [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]];
    if (size === 19) return [
      [3, 3], [3, 9], [3, 15],
      [9, 3], [9, 9], [9, 15],
      [15, 3], [15, 9], [15, 15]
    ];
    return [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
  }

  var defaults = {
    auto: false,
    interval: 30,
    duration: 1.2,
    boardSize: 15,
    rule: 'free',
    uiTheme: 'neon'
  };

  var settings = {
    auto: defaults.auto,
    interval: defaults.interval,
    duration: defaults.duration,
    boardSize: defaults.boardSize,
    rule: defaults.rule,
    uiTheme: defaults.uiTheme
  };

  try {
    var saved = JSON.parse(window.localStorage.getItem('gmx_settings') || 'null');
    if (saved) {
      settings.auto = !!saved.auto;
      if (typeof saved.interval === 'number') settings.interval = saved.interval;
      if (typeof saved.duration === 'number') settings.duration = saved.duration;
      if ([9, 13, 15, 19].indexOf(saved.boardSize) >= 0) settings.boardSize = saved.boardSize;
      if (['free', 'renju', 'folk'].indexOf(saved.rule) >= 0) settings.rule = saved.rule;
      else if (typeof saved.renju === 'boolean' && saved.renju) settings.rule = 'renju';
      if (['neon', 'paper', 'terminal'].indexOf(saved.uiTheme) >= 0) settings.uiTheme = saved.uiTheme;
    }
    var savedNick = window.localStorage.getItem('gmx_nickname') || '';
    if (savedNick) settings.lastNickname = savedNick;
  } catch (e) { /* ignore */ }

  var GC = window.GC = {
    SIZE: settings.boardSize,
    PLAYER_NAMES: ['黑方', '白方'],
    DIFFICULTY_NAMES: { easy: '简单', normal: '普通', hard: '困难' },
    STARS: starsFor(settings.boardSize),
    SERVER_URL: '',
    PREFERS_REDUCED_MOTION: window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
    starsFor: starsFor
  };

  GC.settings = settings;
  if (settings.lastNickname) GC.lastNickname = settings.lastNickname;

  GC.saveSettings = function () {
    try {
      window.localStorage.setItem('gmx_settings', JSON.stringify({
        auto: GC.settings.auto,
        interval: GC.settings.interval,
        duration: GC.settings.duration,
        boardSize: GC.settings.boardSize,
        rule: GC.settings.rule,
        uiTheme: GC.settings.uiTheme
      }));
    } catch (e) { /* ignore */ }
  };

  GC.saveNickname = function (nick) {
    try {
      window.localStorage.setItem('gmx_nickname', nick || '');
      GC.lastNickname = nick;
    } catch (e) { /* ignore */ }
  };

  GC.applyUiTheme = function () {
    var theme = GC.settings.uiTheme || 'neon';
    if (document.documentElement) document.documentElement.dataset.uiTheme = theme;
    if (document.body) document.body.dataset.uiTheme = theme;
  };

  GC.setBoardSize = function (size) {
    size = [9, 13, 15, 19].indexOf(size) >= 0 ? size : 15;
    GC.settings.boardSize = size;
    GC.SIZE = size;
    GC.STARS = starsFor(size);
    GC.saveSettings();
  };
})();
