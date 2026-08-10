(function () {
  'use strict';

  const els = {
    cover: document.getElementById('cover'),
    btnPvp: document.getElementById('btnPvp'),
    btnVsAi: document.getElementById('btnVsAi'),
    aiConfig: document.getElementById('aiConfig'),
    segDifficulty: document.getElementById('segDifficulty'),
    segSide: document.getElementById('segSide'),
    btnAiStart: document.getElementById('btnAiStart'),
    btnAiBack: document.getElementById('btnAiBack'),
    btnSettings: document.getElementById('btnSettings'),
    settingsPanel: document.getElementById('settingsPanel'),
    segAuto: document.getElementById('segAuto'),
    sliderInterval: document.getElementById('sliderInterval'),
    intervalVal: document.getElementById('intervalVal'),
    sliderDuration: document.getElementById('sliderDuration'),
    durationVal: document.getElementById('durationVal'),
    btnSettingsClose: document.getElementById('btnSettingsClose')
  };

  let callbacks = { start: function () {} };
  const selected = { difficulty: 'easy', humanSide: 0 };

  function bindSeg(el, onPick) {
    const btns = el.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        onPick(b.dataset.value);
        window.SFX.click();
      });
    });
  }

  function setConfigVisible(v) {
    els.aiConfig.classList.toggle('hidden', !v);
  }

  function setSettingsVisible(v) {
    els.settingsPanel.classList.toggle('hidden', !v);
  }

  function syncSettingsUI() {
    const s = window.GC.settings;
    els.segAuto.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === (s.auto ? '1' : '0'));
    });
    els.sliderInterval.value = String(s.interval);
    els.intervalVal.textContent = s.interval + ' 秒';
    els.sliderDuration.value = String(s.duration);
    els.durationVal.textContent = s.duration.toFixed(1) + ' 秒';
  }

  window.Cover = {
    init: function (cb) {
      callbacks = cb || callbacks;
      els.btnPvp.addEventListener('click', function () {
        window.SFX.click();
        callbacks.start({ mode: 'pvp' });
      });
      els.btnVsAi.addEventListener('click', function () {
        window.SFX.click();
        setConfigVisible(true);
      });
      els.btnAiBack.addEventListener('click', function () {
        window.SFX.click();
        setConfigVisible(false);
      });
      els.btnSettings.addEventListener('click', function () {
        window.SFX.click();
        setConfigVisible(false);
        setSettingsVisible(els.settingsPanel.classList.contains('hidden'));
        syncSettingsUI();
      });
      els.btnSettingsClose.addEventListener('click', function () {
        window.SFX.click();
        setSettingsVisible(false);
      });
      els.btnAiStart.addEventListener('click', function () {
        window.SFX.click();
        callbacks.start({
          mode: 'ai',
          difficulty: selected.difficulty,
          humanSide: selected.humanSide
        });
      });
      bindSeg(els.segDifficulty, function (v) {
        selected.difficulty = v;
      });
      bindSeg(els.segSide, function (v) {
        selected.humanSide = parseInt(v, 10);
      });
      bindSeg(els.segAuto, function (v) {
        window.GC.settings.auto = v === '1';
        window.GC.saveSettings();
        if (window.Gomoku && window.Gomoku.refreshAutoChip) window.Gomoku.refreshAutoChip();
      });
      els.sliderInterval.addEventListener('input', function () {
        window.GC.settings.interval = parseInt(els.sliderInterval.value, 10);
        els.intervalVal.textContent = window.GC.settings.interval + ' 秒';
        window.GC.saveSettings();
      });
      els.sliderDuration.addEventListener('input', function () {
        window.GC.settings.duration = parseFloat(els.sliderDuration.value);
        els.durationVal.textContent = window.GC.settings.duration.toFixed(1) + ' 秒';
        window.GC.saveSettings();
      });
    },
    show: function () {
      setConfigVisible(false);
      setSettingsVisible(false);
      syncSettingsUI();
      els.cover.classList.remove('hidden');
    },
    hide: function () {
      els.cover.classList.add('hidden');
    }
  };
})();
