(function () {
  'use strict';

  window.GC = {
    SIZE: 15,
    PLAYER_NAMES: ['黑方', '白方'],
    DIFFICULTY_NAMES: { easy: '简单', normal: '普通', hard: '困难' },
    STARS: [
      [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ],
    PREFERS_REDUCED_MOTION: window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  };

  GC.settings = { auto: false, interval: 30, duration: 1.2 };
  try {
    const saved = JSON.parse(window.localStorage.getItem('gmx_settings') || 'null');
    if (saved) {
      GC.settings.auto = !!saved.auto;
      if (typeof saved.interval === 'number') GC.settings.interval = saved.interval;
      if (typeof saved.duration === 'number') GC.settings.duration = saved.duration;
    }
  } catch (e) { /* ignore */ }

  GC.saveSettings = function () {
    try {
      window.localStorage.setItem('gmx_settings', JSON.stringify({
        auto: GC.settings.auto,
        interval: GC.settings.interval,
        duration: GC.settings.duration
      }));
    } catch (e) { /* ignore */ }
  };
})();
