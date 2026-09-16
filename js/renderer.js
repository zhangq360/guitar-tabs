/* =========================================================
 * 六线谱 SVG 渲染器 + 和弦图渲染器
 * ========================================================= */

// 标准调弦空弦频率（1弦高音E → 6弦低音E），用于播放
const OPEN_FREQ = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

/**
 * 渲染六线谱为 SVG 字符串
 * @param {object} song TAB_DATA 中的一条曲目
 * @returns {string} svg 标记（音符圆点带 class="tabnote" data-ev 序号，供播放高亮）
 */
function renderTabSVG(song) {
  const SP = 13;            // 弦间距
  const LEFT = 46;          // 左侧留白（TAB 字样 + 首小节线）
  const STEM = 30;          // 符干长度
  const NOTE_R = 8.6;       // 品数圆点半径

  // 段落标记（前奏/主歌…）需要更高的上方留白；歌词行需要更多下方留白
  const hasSec = song.bars.some(function (b) { return b.sec; });
  const hasLy = song.bars.some(function (b) { return b.ly; });
  const TOP = hasSec ? 76 : 52;   // 谱面上方留白（段落标记 + 和弦）
  const staffTop = TOP;
  const staffBottom = staffTop + SP * 5;   // 6 条弦
  const height = staffBottom + STEM + (hasLy ? 60 : 34);

  // ---- 布局：逐小节推进 x 游标 ----
  let x = LEFT;
  const barX = [];          // 每个小节起始 x
  const events = [];        // { x, stringY, fret, evIdx, dur }
  let evIdx = 0;
  const barInfo = [];

  song.bars.forEach(function (bar, bi) {
    barX.push(x);
    // 和弦文字
    if (bar.c) {
      barInfo.push({ x: x, chord: bar.c, num: bar.pickup ? "" : (bi + 1) });
    } else {
      barInfo.push({ x: x, chord: "", num: bar.pickup ? "" : (bi + 1) });
    }
    x += 14; // 小节线后留一点空
    bar.e.forEach(function (ev) {
      const w = 30 + ev.d * 34; // 拍越长占位越宽
      events.push({
        x: x + w / 2,
        dur: ev.d,
        notes: ev.n,
        evIdx: evIdx,
        bar: bi
      });
      evIdx += 1;
      x += w;
    });
    x += 12; // 小节尾部留白
  });

  const width = x + 14;

  // ---- SVG 组装 ----
  let s = "";
  s += '<svg viewBox="0 0 ' + width + " " + height + '" width="' + width +
       '" height="' + height + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
       song.title + " 六线谱\">";

  // 六条弦（1弦在顶）
  for (let i = 0; i < 6; i++) {
    const y = staffTop + i * SP;
    s += '<line x1="' + (LEFT - 6) + '" y1="' + y + '" x2="' + (width - 10) +
         '" y2="' + y + '" stroke="#8a8f9a" stroke-width="' + (i === 0 || i === 5 ? 1.6 : 1) + '"/>';
  }

  // 左侧 TAB 字样
  s += '<text x="' + (LEFT - 20) + '" y="' + ((staffTop + staffBottom) / 2 - 15) +
       '" class="tab-word" text-anchor="middle">T</text>';
  s += '<text x="' + (LEFT - 20) + '" y="' + ((staffTop + staffBottom) / 2) +
       '" class="tab-word" text-anchor="middle">A</text>';
  s += '<text x="' + (LEFT - 20) + '" y="' + ((staffTop + staffBottom) / 2 + 15) +
       '" class="tab-word" text-anchor="middle">B</text>';

  // 小节线与和弦 / 小节号
  song.bars.forEach(function (bar, bi) {
    const bx = barX[bi];
    const isLast = bi === song.bars.length - 1;
    if (bar.pickup) {
      // 弱起小节：只画浅色虚线
      s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
           '" stroke="#c3c8d0" stroke-width="1" stroke-dasharray="3 3"/>';
    } else {
      s += '<line x1="' + bx + '" y1="' + staffTop + '" x2="' + bx + '" y2="' + staffBottom +
           '" stroke="#a8b0bd" stroke-width="1.4"/>';
    }
    if (isLast) {
      // 终止线（双线）
      s += '<line x1="' + (width - 22) + '" y1="' + staffTop + '" x2="' + (width - 22) + '" y2="' + staffBottom +
           '" stroke="#a8b0bd" stroke-width="1.2"/>';
      s += '<line x1="' + (width - 15) + '" y1="' + staffTop + '" x2="' + (width - 15) + '" y2="' + staffBottom +
           '" stroke="#a8b0bd" stroke-width="3"/>';
    }
    // 段落标记：金色文字 + 左侧竖线（贯穿谱面）
    if (bar.sec) {
      s += '<text x="' + (bx + 4) + '" y="' + (staffTop - 40) + '" class="tab-sec">' + bar.sec + "</text>";
      s += '<line x1="' + (bx - 4) + '" y1="' + (staffTop - 34) + '" x2="' + (bx - 4) + '" y2="' + staffBottom +
           '" stroke="#e0a23f" stroke-width="2.5"/>';
    }
    const info = barInfo[bi];
    if (info.chord) {
      s += '<text x="' + (bx + 18) + '" y="' + (staffTop - 22) + '" class="tab-chord">' + info.chord + "</text>";
    }
    if (info.num) {
      s += '<text x="' + (bx + 2) + '" y="' + (staffBottom + 20) + '" class="tab-barnum">' + info.num + "</text>";
    }
    // 歌词行（小节下方）
    if (bar.ly) {
      s += '<text x="' + (bx + 6) + '" y="' + (staffBottom + STEM + 24) + '" class="tab-ly">' + bar.ly + "</text>";
    }
  });

  // 音符：品数圆点 + 符干 / 符头
  events.forEach(function (ev) {
    ev.notes.forEach(function (nt) {
      const st = nt[0];  // 1~6
      const fret = nt[1];
      const y = staffTop + (st - 1) * SP;
      s += '<g class="tabnote" data-ev="' + ev.evIdx + '">' +
           '<circle cx="' + ev.x + '" cy="' + y + '" r="' + NOTE_R + '" fill="#ffffff" stroke="#d96c3f" stroke-width="1.6"/>' +
           '<text x="' + ev.x + '" y="' + (y + 3.6) + '" class="tab-fret" text-anchor="middle">' + fret + "</text></g>";
    });

    // 节奏：从最低（数字最大）的弦垂下符干
    let maxSt = 0;
    ev.notes.forEach(function (nt) { if (nt[0] > maxSt) maxSt = nt[0]; });
    if (maxSt > 0) {
      const stemTop = staffTop + (maxSt - 1) * SP + 6;
      const stemBottom = staffBottom + STEM;
      s += '<g class="tabstem" data-ev="' + ev.evIdx + '">';
      s += '<line x1="' + ev.x + '" y1="' + stemTop + '" x2="' + ev.x + '" y2="' + stemBottom +
           '" stroke="#a8b0bd" stroke-width="1.4"/>';
      // 符头
      const hollow = ev.dur >= 2;
      s += '<ellipse cx="' + ev.x + '" cy="' + stemBottom + '" rx="5.2" ry="3.8" fill="' +
           (hollow ? "#ffffff" : "#a8b0bd") + '" stroke="#a8b0bd" stroke-width="1.3"/>';
      // 附点
      if (ev.dur === 1.5 || ev.dur === 3) {
        s += '<circle cx="' + (ev.x + 11) + '" cy="' + (stemBottom) + '" r="2.2" fill="#a8b0bd"/>';
      }
      // 八分音符旗
      if (ev.dur === 0.5) {
        s += '<path d="M ' + ev.x + " " + stemBottom + ' q 8 3 6 12" fill="none" stroke="#a8b0bd" stroke-width="1.8" stroke-linecap="round"/>';
      }
      s += "</g>";
    }
  });

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
