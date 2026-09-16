/* =========================================================
 * 独奏谱播放器（Web Audio API）
 * 旋律（1~3 弦）+ 低音/和声（4~6 弦）双声部同时发声
 * ========================================================= */

const TabPlayer = (function () {
  let ctx = null;
  let timers = [];
  let activeOsc = [];
  let onHighlight = null;   // 回调：function(evIdx) 高亮当前事件
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
      try {
        o.gain.gain.cancelScheduledValues(ctx.currentTime);
        o.gain.gain.setValueAtTime(0, ctx.currentTime);
        o.osc.stop();
      } catch (e) {}
    });
    activeOsc = [];
    if (onHighlight) onHighlight(-1);
  }

  /**
   * 播放整首独奏曲（旋律 + 低音双声部）
   * @param {object} song 曲目数据
   * @param {number} speed 速度倍率（0.6 ~ 1）
   */
  function play(song, speed) {
    stop();
    if (!ensureCtx()) return;
    const beat = 60 / (song.bpm * speed); // 一拍的秒数
    const t0 = ctx.currentTime + 0.12;
    let offset = 0;   // 累计拍偏移
    let evIdx = 0;    // 事件序号（与渲染器 data-ev 顺序一致）

    song.bars.forEach(function (bar) {
      bar.e.forEach(function (ev) {
        const evIdxHere = evIdx++;
        const uiDelay = Math.max(0, (t0 - ctx.currentTime + offset * beat) * 1000);
        timers.push(setTimeout(function () {
          if (onHighlight) onHighlight(evIdxHere);
        }, uiDelay));

        const durSec = ev.d * beat;
        const start0 = t0 + offset * beat;
        // 多音事件（如终止和弦）逐弦错开 22ms，模拟拨弦
        ev.n.forEach(function (nt, i) {
          const f = noteFreq(nt[0], nt[1]);
          const isMelody = nt[0] <= 3;   // 1~3 弦为旋律，4~6 弦为低音/和声
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = f;
          const start = start0 + i * 0.022;
          const vol = isMelody ? 0.30 : 0.20;
          const rel = Math.max(durSec * 0.95, 0.3);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(vol, start + 0.012);
          gain.gain.setValueAtTime(vol * 0.7, start + Math.min(0.25, durSec * 0.6));
          gain.gain.exponentialRampToValueAtTime(0.001, start + rel);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + rel + 0.05);
          activeOsc.push({ osc: osc, gain: gain });
        });
        offset += ev.d;
      });
    });

    const totalMs = (t0 - ctx.currentTime + offset * beat) * 1000 + 300;
    timers.push(setTimeout(function () {
      stop();
      if (onEnd) onEnd();
    }, totalMs));
  }

  return {
    play: play,
    stop: stop,
    setHighlight: function (fn) { onHighlight = fn; },
    setOnEnd: function (fn) { onEnd = fn; },
    noteFreq: noteFreq
  };
})();
