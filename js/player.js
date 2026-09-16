/* =========================================================
 * 六线谱播放器（Web Audio API）· 双谱式
 * 独奏谱(style=solo)：旋律（1~3 弦）+ 低音/和声（4~6 弦）双声部
 * 弹唱谱(style=accomp)：简谱旋律 + × 分解和弦（按和弦指法取音）同时发声
 * ========================================================= */

const TabPlayer = (function () {
  let ctx = null;
  let timers = [];
  let activeOsc = [];
  let onHighlight = null;   // 回调：function(evIdx) 高亮当前事件
  let onEnd = null;         // 回调：播放结束

  // 简谱基准音高（key 首字母 → "1" 的频率）：C 大调 1=C4，G 大调 1=G3（低把位记谱）
  const KEY_ROOT = {
    "C": 261.63, "D": 293.66, "E": 329.63, "F": 349.23,
    "G": 196.00, "A": 220.00, "B": 246.94
  };
  const DEG_SEMI = { "1": 0, "2": 2, "3": 4, "4": 5, "5": 7, "6": 9, "7": 11 };

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

  /** 简谱记号 → 频率（"0" 返回 0 = 休止） */
  function jianpuFreq(tok, key) {
    if (tok === "0" || !tok) return 0;
    let semi = 0, oct = 0, i = 0;
    if (tok[i] === "#") { semi += 1; i += 1; }
    const deg = DEG_SEMI[tok[i]];
    if (deg === undefined) return 0;
    semi += deg;
    for (i += 1; i < tok.length; i++) {
      if (tok[i] === "'") oct += 1;
      else if (tok[i] === ",") oct -= 1;
    }
    const root = KEY_ROOT[(key || "C").charAt(0)] || 261.63;
    return root * Math.pow(2, (semi + oct * 12) / 12);
  }

  /** 单音发声（triangle 波，简单包络） */
  function voice(f, start, durSec, vol) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = f;
    const rel = Math.max(durSec * 0.95, 0.3);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.012);
    gain.gain.setValueAtTime(vol * 0.7, start + Math.min(0.25, durSec * 0.6));
    gain.gain.exponentialRampToValueAtTime(0.001, start + rel);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + rel + 0.05);
    activeOsc.push({ osc: osc, gain: gain });
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

  /** 和弦名 → CHORDS 条目（先精确匹配，再前缀匹配，避免 G7 落到 G） */
  function findChord(name) {
    if (!name || typeof CHORDS === "undefined") return null;
    let cd = null;
    for (let i = 0; i < CHORDS.length; i++) {
      if (CHORDS[i].name === name) { cd = CHORDS[i]; break; }
    }
    if (!cd) {
      for (let i = 0; i < CHORDS.length; i++) {
        if (name.indexOf(CHORDS[i].name) === 0) { cd = CHORDS[i]; break; }
      }
    }
    return cd;
  }

  /** 弹唱谱播放：× 分解伴奏 + 简谱旋律同时发声 */
  function playAccomp(song, speed) {
    const beat = 60 / (song.bpm * speed);
    const t0 = ctx.currentTime + 0.12;
    let evIdx = 0;      // 高亮序号：仅计 × 节奏事件（与渲染器 data-ev 一致）
    let barStart = 0;   // 小节起始拍

    song.bars.forEach(function (bar) {
      const barBeats = bar.e.reduce(function (a, e) { return a + e.d; }, 0);

      // ---- × 分解节奏型 ----
      let t = 0;
      bar.e.forEach(function (ev) {
        const evIdxHere = evIdx++;
        const start = t0 + (barStart + t) * beat;
        const uiDelay = Math.max(0, (start - ctx.currentTime) * 1000);
        timers.push(setTimeout(function () {
          if (onHighlight) onHighlight(evIdxHere);
        }, uiDelay));

        let chordName = bar.c;
        if (bar.c2 && t >= barBeats / 2 - 0.01) chordName = bar.c2;  // 半小节第二和弦
        const durSec = ev.d * beat;
        ev.n.forEach(function (nt) {
          let f;
          if (nt[1] === "x") {
            const cd = findChord(chordName);
            const cf = cd ? cd.frets[6 - nt[0]] : 0;
            f = noteFreq(nt[0], cf >= 0 ? cf : 0);
          } else {
            f = noteFreq(nt[0], nt[1]);
          }
          voice(f, start, durSec, 0.16);
        });
        t += ev.d;
      });

      // ---- 简谱旋律（与小节内 × 声部并行）----
      if (bar.mel) {
        let mt = 0;
        bar.mel.forEach(function (m) {
          const f = jianpuFreq(m.n, song.key);
          if (f > 0) {
            voice(f, t0 + (barStart + mt) * beat, m.d * beat, 0.30);
          }
          mt += m.d;
        });
      }

      barStart += barBeats;
    });

    const totalMs = (t0 - ctx.currentTime + barStart * beat) * 1000 + 300;
    timers.push(setTimeout(function () {
      stop();
      if (onEnd) onEnd();
    }, totalMs));
  }

  /** 独奏谱播放：旋律 + 低音双声部 */
  function playSolo(song, speed) {
    const beat = 60 / (song.bpm * speed);
    const t0 = ctx.currentTime + 0.12;
    let offset = 0;
    let evIdx = 0;

    song.bars.forEach(function (bar) {
      bar.e.forEach(function (ev) {
        const evIdxHere = evIdx++;
        const uiDelay = Math.max(0, (t0 - ctx.currentTime + offset * beat) * 1000);
        timers.push(setTimeout(function () {
          if (onHighlight) onHighlight(evIdxHere);
        }, uiDelay));

        const durSec = ev.d * beat;
        const start0 = t0 + offset * beat;
        ev.n.forEach(function (nt, i) {
          const f = noteFreq(nt[0], nt[1]);
          const isMelody = nt[0] <= 3;
          const start = start0 + i * 0.022;   // 逐弦错开模拟拨弦
          voice(f, start, durSec, isMelody ? 0.30 : 0.20);
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

  function play(song, speed) {
    stop();
    if (!ensureCtx()) return;
    if (song.style === "accomp") playAccomp(song, speed);
    else playSolo(song, speed);
  }

  return {
    play: play,
    stop: stop,
    setHighlight: function (fn) { onHighlight = fn; },
    setOnEnd: function (fn) { onEnd = fn; },
    noteFreq: noteFreq
  };
})();
