/* =========================================================
 * 旋律播放器（Web Audio API）
 * ========================================================= */

const TabPlayer = (function () {
  let ctx = null;
  let timers = [];
  let activeOsc = [];
  let playingEvIdx = -1;
  let onHighlight = null;   // 回调：function(evIdx) 高亮当前音符
  let onEnd = null;         // 回调：播放结束

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noteFreq(stringNo, fret) {
    return OPEN_FREQ[stringNo - 1] * Math.pow(2, fret / 12);
  }

  function stop() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    activeOsc.forEach(function (o) {
      try { o.gain.gain.cancelScheduledValues(ctx.currentTime); o.gain.gain.setValueAtTime(0, ctx.currentTime); o.osc.stop(); } catch (e) {}
    });
    activeOsc = [];
    playingEvIdx = -1;
    if (onHighlight) onHighlight(-1);
  }

  /**
   * 播放整首曲子的旋律
   * @param {object} song 曲目数据
   * @param {number} speed 速度倍率（0.6 ~ 1）
   */
  function play(song, speed) {
    stop();
    if (!ensureCtx()) return;
    const beat = 60 / (song.bpm * speed); // 一拍的秒数
    let t = ctx.currentTime + 0.12;
    let acc = 0; // 累计拍的偏移（用于 UI 高亮）

    // 先把 UI 高亮时间算出来
    let beatOffset = 0;
    song.bars.forEach(function (bar) {
      bar.e.forEach(function (ev) {
        const durSec = ev.d * beat;
        const uiDelay = (t - ctx.currentTime + (beatOffset * beat)) * 1000;
        const myIdx = ev.evIdx !== undefined ? ev.evIdx : null;
        // 记录事件序号 —— 由调用方保证 data-ev 顺序与展开顺序一致
        const evIdx = uiEventCounter++;
        timers.push(setTimeout(function () {
          if (onHighlight) onHighlight(evIdx);
        }, uiDelay));
        ev.n.forEach(function (nt) {
          const f = noteFreq(nt[0], nt[1]);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = f;
          const start = t + beatOffset * beat;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.32, start + 0.015);
          gain.gain.setValueAtTime(0.32, Math.max(start + 0.02, start + durSec * 0.7));
          gain.gain.exponentialRampToValueAtTime(0.001, start + durSec * 0.98);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + durSec);
          activeOsc.push({ osc: osc, gain: gain });
        });
        beatOffset += ev.d;
      });
    });
    const totalMs = (t - ctx.currentTime + beatOffset * beat) * 1000 + 200;
    timers.push(setTimeout(function () {
      stop();
      if (onEnd) onEnd();
    }, totalMs));
  }

  // 事件序号计数器（与渲染器 data-ev 对齐：渲染器按 bars→events 顺序编号）
  let uiEventCounter = 0;

  return {
    play: function (song, speed) { uiEventCounter = 0; play(song, speed); },
    stop: stop,
    setHighlight: function (fn) { onHighlight = fn; },
    setOnEnd: function (fn) { onEnd = fn; },
    noteFreq: noteFreq
  };
})();
