/* =========================================================
 * 六线谱 SVG 渲染器 + 和弦图渲染器（古典吉他独奏版）
 * ========================================================= */

// 标准调弦空弦频率（1弦高音E → 6弦低音E），用于播放
const OPEN_FREQ = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

/**
 * 渲染六线谱为 SVG 字符串（独奏谱：多行谱表、白底黑字）
 * @param {object} song TAB_DATA 中的一条曲目
 * @returns {string} svg 标记（音符圆点带 class="tabnote" data-ev 序号，供播放高亮）
 */
function renderTabSVG(song) {
  if (song.style === "accomp") return renderAccompSVG(song);  // 弹唱谱
  return renderSoloSVG(song);                                  // 独奏谱
}

/* =========================================================
 * 独奏谱渲染器（多行谱表版 · 白底黑字纸质风）
 * 每行 4 小节逐行下排：和弦图（支持 c2 半小节第二和弦）
 * 六线谱：品数圆点（旋律+低音双声部）+ 符干 + 按拍符梁
 * ========================================================= */
function renderSoloSVG(song) {
  const SP = 15;
  const PER_ROW = 4;
  const LEFT = 64, RIGHT = 20;
  const W = 1040;
  const barW = (W - LEFT - RIGHT) / PER_ROW;

  // 拍号 → 每小节拍数
  const ts = (song.timeSig || "4/4").split("/");
  const beatsPerBar = (parseFloat(ts[0]) || 4) * 4 / (parseFloat(ts[1]) || 4);
  const beatW = barW / beatsPerBar;

  const HEADER = 42, CH = 78, STAFF = SP * 5, BEAM = 26, BOT = 22;
  const SYS = CH + STAFF + BEAM + BOT;
  const rows = Math.ceil(song.bars.length / PER_ROW);
  const H = HEADER + rows * SYS + 6;

  let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H +
         '" style="width:100%;background:#fff" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
         song.title + ' 古典吉他独奏六线谱">';
  s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#ffffff"/>';

  s += '<text x="' + LEFT + '" y="26" fill="#555" font-size="15">key = ' + song.key +
       "　　" + song.timeSig + "　　♩= " + song.bpm + "</text>";

  let evSeq = 0;   // 全局事件序号（与播放器 uiEventCounter 对齐）

  for (let r = 0; r < rows; r++) {
    const rowBars = song.bars.slice(r * PER_ROW, r * PER_ROW + PER_ROW);
    const sysTop = HEADER + r * SYS;
    const staffTop = sysTop + CH;
    const staffBottom = staffTop + STAFF;
    const beamY = staffBottom + BEAM;
    const rowW = rowBars.length * barW;

    for (let i = 0; i < 6; i++) {
      const y = staffTop + i * SP;
      s += '<line x1="' + (LEFT - 6) + '" y1="' + y + '" x2="' + (LEFT + rowW - 8) +
           '" y2="' + y + '" stroke="#333" stroke-width="' + (i === 0 || i === 5 ? 1.7 : 1.1) + '"/>';
    }
    const midY = (staffTop + staffBottom) / 2;
    s += '<text x="' + (LEFT - 24) + '" y="' + (midY - 16) + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">T</text>';
    s += '<text x="' + (LEFT - 24) + '" y="' + midY + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">A</text>';
    s += '<text x="' + (LEFT - 24) + '" y="' + (midY + 16) + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">B</text>';

    let lastDia = "";
    rowBars.forEach(function (bar, bi) {
      const bx = LEFT + bi * barW;
      const gi = r * PER_ROW + bi;
      const isSongEnd = gi === song.bars.length - 1;

      // 小节线（弱起小节画虚线）
      if (bar.pickup) {
        s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
             '" stroke="#999" stroke-width="1" stroke-dasharray="4 3"/>';
      } else {
        s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.5"/>';
      }
      if (bi === rowBars.length - 1) {
        s += '<line x1="' + (bx + barW) + '" y1="' + staffTop + '" x2="' + (bx + barW) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.5"/>';
      }
      if (isSongEnd) {
        s += '<line x1="' + (bx + barW - 9) + '" y1="' + staffTop + '" x2="' + (bx + barW - 9) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.3"/>';
        s += '<line x1="' + (bx + barW - 2) + '" y1="' + staffTop + '" x2="' + (bx + barW - 2) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="3.4"/>';
      }

      if (bar.sec) {
        s += '<text x="' + (bx + 2) + '" y="' + (sysTop + 10) + '" fill="#b8860b" font-size="15" font-weight="700">' + bar.sec + "</text>";
      }
      s += '<text x="' + (bx + 2) + '" y="' + (staffTop - 6) + '" fill="#999" font-size="11">' + (gi + 1) + "</text>";

      // 和弦指位图（和弦变化时挂新图；c2 半小节第二和弦挂右半）
      if (bar.c && (bar.c !== lastDia || bi === 0)) {
        s += renderChordMiniSVG(bar.c, bx + 16, sysTop + 8);
        lastDia = bar.c;
      }
      if (bar.c2) {
        s += renderChordMiniSVG(bar.c2, bx + barW * 0.56, sysTop + 8);
      }

      // 事件定位
      let t = 0;
      const evPos = [];
      bar.e.forEach(function (ev) {
        const ex = bx + (t + ev.d / 2) * beatW;
        evPos.push({ x: ex, d: ev.d, t: t, notes: ev.n });
        t += ev.d;
      });

      // 音符：品数圆点 + 符干
      evPos.forEach(function (ev) {
        const myEv = evSeq; evSeq += 1;
        let maxSt = 0;
        ev.notes.forEach(function (nt) { if (nt[0] > maxSt) maxSt = nt[0]; });
        ev.notes.forEach(function (nt) {
          const y = staffTop + (nt[0] - 1) * SP;
          s += '<g class="tabnote" data-ev="' + myEv + '">' +
               '<circle cx="' + ev.x + '" cy="' + y + '" r="8.4" fill="#ffffff" stroke="#c0392b" stroke-width="1.8"/>' +
               '<text x="' + ev.x + '" y="' + (y + 3.8) + '" fill="#1a1a1a" font-size="12" font-weight="600" text-anchor="middle">' + nt[1] + "</text></g>";
        });
        // 符干：从最低音弦垂下（全音符不画）
        if (maxSt > 0 && ev.d < 4) {
          const yTop = staffTop + (maxSt - 1) * SP + 5;
          s += '<line x1="' + ev.x + '" y1="' + yTop + '" x2="' + ev.x + '" y2="' + beamY +
               '" stroke="#333" stroke-width="1.7"/>';
          if (ev.d === 1.5 || ev.d === 3) {
            s += '<circle cx="' + (ev.x + 11) + '" cy="' + beamY + '" r="2.2" fill="#333"/>';
          }
          if (ev.d === 0.5) {
            // 八分音符由符梁连接（见下），孤立八分画符尾
            const next = evPos[evPos.indexOf(ev) + 1];
            const linked = next && next.d === 0.5 &&
              Math.abs(ev.t + 0.5 - next.t) < 0.01 &&
              Math.floor(ev.t + 0.01) === Math.floor(next.t + 0.01);
            if (!linked) {
              s += '<path d="M ' + ev.x + " " + beamY + ' q 8 3 6 12" fill="none" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>';
            }
          }
        }
      });

      // 八分音符符梁（同拍内相邻两个 0.5 连接）
      for (let ei = 0; ei < evPos.length - 1; ei++) {
        const a = evPos[ei], b = evPos[ei + 1];
        if (a.d === 0.5 && b.d === 0.5 && Math.abs(a.t + 0.5 - b.t) < 0.01 && Math.floor(a.t + 0.01) === Math.floor(b.t + 0.01)) {
          s += '<line x1="' + a.x + '" y1="' + beamY + '" x2="' + b.x + '" y2="' + beamY +
               '" stroke="#333" stroke-width="3"/>';
        }
      }
    });
  }

  s += "</svg>";
  return s;
}

/**
 * 渲染和弦指位图为 SVG 字符串
 * @param {object} chord { name, frets:[6..1], barre }
 */
function renderChordSVG(chord) {
  const W = 110, H = 132;
  const gx = 26, gy = 30;          // 网格左上
  const gw = 74, gh = 68;          // 网格宽高（4 品）
  const CS = gw / 5;               // 列距（6弦）
  const RS = gh / 3;               // 行距（4品格）

  let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H +
          '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + chord.name + ' 和弦图">';
  s += '<text x="' + (W / 2) + '" y="17" class="chord-name" text-anchor="middle">' + chord.name + "</text>";

  // 是否需要品位标注（当最低品 > 1）
  const played = chord.frets.filter(function (f) { return f > 0; });
  const minFret = played.length ? Math.min.apply(null, played) : 1;
  const offset = minFret > 1 ? minFret : 0;

  // 品位标签
  if (offset > 1) {
    s += '<text x="' + (gx - 12) + '" y="' + (gy + RS / 2 + 4) + '" class="chord-pos" text-anchor="end">' + offset + "fr</text>";
  }

  // 竖线（6 弦）与横线（品）
  for (let i = 0; i < 6; i++) {
    s += '<line x1="' + (gx + i * CS) + '" y1="' + gy + '" x2="' + (gx + i * CS) + '" y2="' + (gy + gh) +
         '" stroke="#8a8f9a" stroke-width="1.2"/>';
  }
  for (let j = 0; j <= 3; j++) {
    s += '<line x1="' + gx + '" y1="' + (gy + j * RS) + '" x2="' + (gx + gw) + '" y2="' + (gy + j * RS) +
         '" stroke="' + (j === 0 && offset === 0 ? "#a8b0bd" : "#c3c8d0") +
         '" stroke-width="' + (j === 0 && offset === 0 ? 3 : 1.2) + '"/>';
  }

  // 指位
  chord.frets.forEach(function (f, i) {
    // frets 数组顺序为 6弦→1弦，列从左到右
    const cx = gx + i * CS;
    if (f === -1) {
      s += '<text x="' + cx + '" y="' + (gy - 7) + '" class="chord-x" text-anchor="middle">x</text>';
    } else if (f === 0) {
      s += '<circle cx="' + cx + '" cy="' + (gy - 10) + '" r="3.6" fill="none" stroke="#a8b0bd" stroke-width="1.3"/>';
    } else {
      const row = f - offset;   // 第几格
      const cy = gy + (row - 0.5) * RS;
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#d96c3f"/>';
      if (f >= 10) {
        s += '<text x="' + cx + '" y="' + (cy + 3) + '" class="chord-dotnum" text-anchor="middle">' + f + "</text>";
      }
    }
  });

  if (chord.barre) {
    s += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" class="chord-pos" text-anchor="middle">横按和弦</text>';
  }
  s += "</svg>";
  return s;
}


/**
 * 迷你和弦指位图（谱面上方：白底深色）
 */
function renderChordMiniSVG(name, x, y) {
  const cd = (typeof CHORDS !== "undefined") ? CHORDS.find(function (c) { return c.name === name; }) : null;
  if (!cd) return "";
  const gx = 6, gy = 20, cw = 12, rh = 14;
  let s = '<g transform="translate(' + x + ',' + y + ')">';
  s += '<text x="' + (gx + cw * 2.5) + '" y="13" fill="#1a1a1a" font-size="15" font-weight="700" text-anchor="middle">' + name + "</text>";
  const played = cd.frets.filter(function (f) { return f > 0; });
  const minF = played.length ? Math.min.apply(null, played) : 1;
  const off = minF > 3 ? minF : 0;
  for (let i = 0; i < 6; i++) {
    s += '<line x1="' + (gx + i * cw) + '" y1="' + gy + '" x2="' + (gx + i * cw) + '" y2="' + (gy + rh * 3) +
         '" stroke="#555" stroke-width="1.1"/>';
  }
  for (let j = 0; j <= 3; j++) {
    s += '<line x1="' + gx + '" y1="' + (gy + j * rh) + '" x2="' + (gx + cw * 5) + '" y2="' + (gy + j * rh) +
         '" stroke="' + (j === 0 && off === 0 ? "#1a1a1a" : "#555") +
         '" stroke-width="' + (j === 0 && off === 0 ? 2.6 : 1.1) + '"/>';
  }
  cd.frets.forEach(function (f, i) {
    const cx = gx + i * cw;
    if (f === -1) {
      s += '<text x="' + cx + '" y="' + (gy - 5) + '" fill="#555" font-size="11" font-weight="700" text-anchor="middle">×</text>';
    } else if (f === 0) {
      s += '<circle cx="' + cx + '" cy="' + (gy - 6) + '" r="2.8" fill="none" stroke="#555" stroke-width="1.2"/>';
    } else {
      const row = f - off;
      s += '<circle cx="' + cx + '" cy="' + (gy + (row - 0.5) * rh) + '" r="4.4" fill="#d96c3f"/>';
    }
  });
  if (off > 0) {
    s += '<text x="' + (gx - 4) + '" y="' + (gy + rh / 2 + 4) + '" fill="#555" font-size="10" text-anchor="end">' + off + "</text>";
  }
  s += "</g>";
  return s;
}

/* =========================================================
 * 弹唱谱渲染器（多行谱表版 · 白底黑字纸质风）
 * 每行 4 小节逐行下排：和弦图（支持 c2 半小节第二和弦）
 * 六线谱（× 记号 + 符干 + 按拍符梁）→ 简谱行（增时线/八分下划线/高低八度点）→ 歌词行
 * ========================================================= */
function renderAccompSVG(song) {
  const SP = 15;
  const PER_ROW = 4;
  const LEFT = 64, RIGHT = 20;
  const W = 1040;
  const barW = (W - LEFT - RIGHT) / PER_ROW;

  // 拍号 → 每小节拍数（d 单位为四分音符）：4/4=4, 3/4=3, 3/8=1.5
  const ts = (song.timeSig || "4/4").split("/");
  const beatsPerBar = (parseFloat(ts[0]) || 4) * 4 / (parseFloat(ts[1]) || 4);
  const beatW = barW / beatsPerBar;

  const HEADER = 42, CH = 78, STAFF = SP * 5, BEAM = 26, NUMH = 32, LYH = 24, GAP = 38;
  const SYS = CH + STAFF + BEAM + NUMH + LYH + GAP;
  const rows = Math.ceil(song.bars.length / PER_ROW);
  const H = HEADER + rows * SYS;

  let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H +
         '" style="width:100%;background:#fff" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
         song.title + ' 弹唱六线谱">';
  s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#ffffff"/>';

  s += '<text x="' + LEFT + '" y="26" fill="#555" font-size="15">key = ' + song.key +
       "　　" + song.timeSig + "　　♩= " + song.bpm + "</text>";

  let evSeq = 0;   // 全局事件序号（与播放器高亮计数对齐，仅计 × 节奏事件）

  for (let r = 0; r < rows; r++) {
    const rowBars = song.bars.slice(r * PER_ROW, r * PER_ROW + PER_ROW);
    const sysTop = HEADER + r * SYS;
    const staffTop = sysTop + CH;
    const staffBottom = staffTop + STAFF;
    const beamY = staffBottom + BEAM;
    const numY = beamY + NUMH;
    const lyY = numY + LYH;
    const rowW = rowBars.length * barW;

    for (let i = 0; i < 6; i++) {
      const y = staffTop + i * SP;
      s += '<line x1="' + (LEFT - 6) + '" y1="' + y + '" x2="' + (LEFT + rowW - 8) +
           '" y2="' + y + '" stroke="#333" stroke-width="' + (i === 0 || i === 5 ? 1.7 : 1.1) + '"/>';
    }
    const midY = (staffTop + staffBottom) / 2;
    s += '<text x="' + (LEFT - 24) + '" y="' + (midY - 16) + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">T</text>';
    s += '<text x="' + (LEFT - 24) + '" y="' + midY + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">A</text>';
    s += '<text x="' + (LEFT - 24) + '" y="' + (midY + 16) + '" fill="#666" font-size="17" font-weight="700" text-anchor="middle">B</text>';

    let lastDia = "";
    rowBars.forEach(function (bar, bi) {
      const bx = LEFT + bi * barW;
      const gi = r * PER_ROW + bi;
      const isSongEnd = gi === song.bars.length - 1;

      if (bar.pickup) {
        s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
             '" stroke="#999" stroke-width="1" stroke-dasharray="4 3"/>';
      } else {
        s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.5"/>';
      }
      if (bi === rowBars.length - 1) {
        s += '<line x1="' + (bx + barW) + '" y1="' + staffTop + '" x2="' + (bx + barW) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.5"/>';
      }
      if (isSongEnd) {
        s += '<line x1="' + (bx + barW - 9) + '" y1="' + staffTop + '" x2="' + (bx + barW - 9) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="1.3"/>';
        s += '<line x1="' + (bx + barW - 2) + '" y1="' + staffTop + '" x2="' + (bx + barW - 2) + '" y2="' + staffBottom +
             '" stroke="#333" stroke-width="3.4"/>';
      }

      if (bar.sec) {
        s += '<text x="' + (bx + 2) + '" y="' + (sysTop + 10) + '" fill="#b8860b" font-size="15" font-weight="700">' + bar.sec + "</text>";
      }
      s += '<text x="' + (bx + 2) + '" y="' + (staffTop - 6) + '" fill="#999" font-size="11">' + (gi + 1) + "</text>";

      if (bar.c && (bar.c !== lastDia || bi === 0)) {
        s += renderChordMiniSVG(bar.c, bx + 16, sysTop + 8);
        lastDia = bar.c;
      }
      if (bar.c2) {
        s += renderChordMiniSVG(bar.c2, bx + barW * 0.56, sysTop + 8);
      }

      let t = 0;
      const evPos = [];
      bar.e.forEach(function (ev) {
        const ex = bx + (t + ev.d / 2) * beatW;
        evPos.push({ x: ex, d: ev.d, t: t, notes: ev.n });
        t += ev.d;
      });

      evPos.forEach(function (ev) {
        const myEv = evSeq; evSeq += 1;
        let maxSt = 0;
        ev.notes.forEach(function (nt) { if (nt[0] > maxSt) maxSt = nt[0]; });
        ev.notes.forEach(function (nt) {
          const y = staffTop + (nt[0] - 1) * SP;
          if (nt[1] === "x") {
            s += '<g class="tabnote" data-ev="' + myEv + '">' +
                 '<text x="' + ev.x + '" y="' + (y + 4.4) + '" fill="#333" font-size="15" font-weight="700" text-anchor="middle">×</text></g>';
          } else {
            s += '<g class="tabnote" data-ev="' + myEv + '">' +
                 '<circle cx="' + ev.x + '" cy="' + y + '" r="8.4" fill="#ffffff" stroke="#c0392b" stroke-width="1.8"/>' +
                 '<text x="' + ev.x + '" y="' + (y + 3.8) + '" fill="#1a1a1a" font-size="12" font-weight="600" text-anchor="middle">' + nt[1] + "</text></g>";
          }
        });
        if (maxSt > 0 && ev.d < 4) {
          const yTop = staffTop + (maxSt - 1) * SP + 5;
          s += '<line x1="' + ev.x + '" y1="' + yTop + '" x2="' + ev.x + '" y2="' + beamY +
               '" stroke="#333" stroke-width="1.7"/>';
        }
      });

      for (let ei = 0; ei < evPos.length - 1; ei++) {
        const a = evPos[ei], b = evPos[ei + 1];
        if (a.d === 0.5 && b.d === 0.5 && Math.abs(a.t + 0.5 - b.t) < 0.01 && Math.floor(a.t + 0.01) === Math.floor(b.t + 0.01)) {
          s += '<line x1="' + a.x + '" y1="' + beamY + '" x2="' + b.x + '" y2="' + beamY +
               '" stroke="#333" stroke-width="3"/>';
        }
      }

      // 简谱旋律行（唱的部分）
      if (bar.mel) {
        let mt = 0;
        bar.mel.forEach(function (m) {
          const mx = bx + (mt + 0.5) * beatW;
          let label = String(m.n);
          const low = label.slice(-1) === ",";
          const high = label.slice(-1) === "'";
          if (low || high) label = label.slice(0, -1);
          s += '<text x="' + mx + '" y="' + numY + '" fill="#1a1a1a" font-size="19" font-weight="600" text-anchor="middle">' + label + "</text>";
          if (low) s += '<circle cx="' + mx + '" cy="' + (numY + 9) + '" r="2.2" fill="#1a1a1a"/>';
          if (high) s += '<circle cx="' + mx + '" cy="' + (numY - 20) + '" r="2.2" fill="#1a1a1a"/>';
          if (m.d < 1 && m.n !== "0") {
            s += '<line x1="' + (mx - 8) + '" y1="' + (numY + 6) + '" x2="' + (mx + 8) + '" y2="' + (numY + 6) +
                 '" stroke="#1a1a1a" stroke-width="1.4"/>';
          }
          for (let k = 1; k < m.d; k++) {
            const dx = bx + (mt + k + 0.5) * beatW;
            s += '<text x="' + dx + '" y="' + numY + '" fill="#1a1a1a" font-size="19" text-anchor="middle">–</text>';
          }
          mt += m.d;
        });
      }

      // 歌词行（逐字对齐简谱）
      if (bar.ly && bar.mel) {
        let lt = 0;
        bar.mel.forEach(function (m, mi) {
          const lx = bx + (lt + 0.5) * beatW;
          if (bar.ly[mi]) {
            s += '<text x="' + lx + '" y="' + lyY + '" fill="#333" font-size="15" text-anchor="middle">' + bar.ly[mi] + "</text>";
          }
          lt += m.d;
        });
      }
    });
  }

  s += "</svg>";
  return s;
}
