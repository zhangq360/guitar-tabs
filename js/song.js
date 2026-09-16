/* =========================================================
 * song.js — 曲目详情页逻辑（谱面渲染、播放跟练、倍速）
 * 依赖: data.js / renderer.js / player.js，window.SONG_ID 由页面内联注入
 * ========================================================= */
(function () {
  "use strict";
  const song = TAB_DATA.find(function (s) { return s.id === window.SONG_ID; });
  if (!song) return;

  function el(id) { return document.getElementById(id); }

  /* ---------- 谱面 ---------- */
  el("tabScroll").innerHTML = renderTabSVG(song);

  /* ---------- 和弦指位图 ---------- */
  const chordBox = el("detailChords");
  if (chordBox) {
    chordBox.innerHTML = (song.chords || []).map(function (c) {
      const cd = CHORDS.find(function (x) { return x.name === c; });
      return cd ? "<div class='mini-chord'><span class='mini-name'>" + c + "</span>" + renderChordSVG(cd) + "</div>" : "";
    }).join("");
  }

  /* ---------- 播放 ---------- */
  let speed = 1;
  const btnPlay = el("btnPlay");

  function resetBtn() {
    btnPlay.textContent = "▶ 播放";
    btnPlay.dataset.playing = "0";
    document.querySelectorAll("#tabScroll .tabnote").forEach(function (n) { n.classList.remove("active"); });
  }

  TabPlayer.setHighlight(function (evIdx) {
    document.querySelectorAll("#tabScroll .tabnote").forEach(function (n) { n.classList.remove("active"); });
    if (evIdx >= 0) {
      const nodes = document.querySelectorAll('#tabScroll .tabnote[data-ev="' + evIdx + '"]');
      nodes.forEach(function (n) {
        n.classList.add("active");
        const box = el("tabScroll");
        const nx = n.getBoundingClientRect().left - box.getBoundingClientRect().left;
        if (nx < 40 || nx > box.clientWidth - 80) {
          box.scrollTo({ left: box.scrollLeft + nx - box.clientWidth * 0.35, behavior: "smooth" });
        }
      });
    }
  });
  TabPlayer.setOnEnd(resetBtn);

  btnPlay.addEventListener("click", function () {
    if (btnPlay.dataset.playing === "1") {
      TabPlayer.stop();
      resetBtn();
    } else {
      TabPlayer.play(song, speed);
      btnPlay.textContent = "■ 停止";
      btnPlay.dataset.playing = "1";
    }
  });

  document.querySelectorAll("#speedChips .tab-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#speedChips .tab-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      speed = parseFloat(b.dataset.v);
      if (btnPlay.dataset.playing === "1") { TabPlayer.stop(); TabPlayer.play(song, speed); }
    });
  });
})();
