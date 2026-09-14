/* =========================================================
 * 页面交互逻辑
 * ========================================================= */

(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  function el(id) { return document.getElementById(id); }
  function stars(n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 曲谱卡片 ---------- */
  const state = { q: "", diff: "all", type: "all" };

  function songCard(song) {
    const diffText = ["", "入门", "初级", "中级", "进阶", "高级"][song.difficulty] || "初级";
    const chordChips = (song.chords || []).map(function (c) {
      return '<span class="chip chip-chord">' + esc(c) + "</span>";
    }).join("");
    return (
      '<article class="song-card" data-id="' + song.id + '">' +
      '<div class="card-top"><span class="chip chip-type">' + esc(song.type) + "</span>" +
      '<span class="diff" title="难度 ' + song.difficulty + '/5">' + stars(song.difficulty) + "</span></div>" +
      '<h3 class="card-title">' + esc(song.title) + "</h3>" +
      '<p class="card-sub">' + esc(song.subtitle) + "</p>" +
      '<p class="card-artist">' + esc(song.artist) + " · " + esc(song.genre) + "</p>" +
      '<div class="card-meta"><span>' + esc(song.key) + "</span><span>" + esc(song.timeSig) +
      "</span><span>♩= " + song.bpm + "</span></div>" +
      '<div class="card-chords">' + chordChips + "</div>" +
      '<button class="btn btn-primary btn-open" type="button">查看六线谱</button>' +
      "</article>"
    );
  }

  function renderSongs() {
    const grid = el("songGrid");
    const list = TAB_DATA.filter(function (s) {
      const q = state.q.trim().toLowerCase();
      const hitQ = !q ||
        s.title.toLowerCase().indexOf(q) >= 0 ||
        s.subtitle.toLowerCase().indexOf(q) >= 0 ||
        s.artist.toLowerCase().indexOf(q) >= 0 ||
        s.genre.toLowerCase().indexOf(q) >= 0 ||
        (s.chords || []).join(" ").toLowerCase().indexOf(q) >= 0;
      const hitD = state.diff === "all" || s.difficulty <= (state.diff === "easy" ? 1 : state.diff === "mid" ? 2 : 99);
      const hitT = state.type === "all" || s.type === state.type;
      return hitQ && hitD && hitT;
    });
    if (!list.length) {
      grid.innerHTML = '<p class="empty">没有找到匹配的曲谱，换个关键词试试～</p>';
      return;
    }
    grid.innerHTML = list.map(songCard).join("");
  }

  /* ---------- 谱面弹窗 ---------- */
  let currentSong = null;
  let currentSpeed = 1;

  function openSong(id) {
    const song = TAB_DATA.find(function (s) { return s.id === id; });
    if (!song) return;
    currentSong = song;

    el("mTitle").textContent = song.title;
    el("mSub").textContent = song.subtitle + " · " + song.artist;
    el("mDesc").textContent = song.desc;
    el("mMeta").innerHTML =
      '<span class="chip chip-chord">' + esc(song.key) + "</span>" +
      '<span class="chip chip-chord">' + esc(song.timeSig) + "</span>" +
      '<span class="chip chip-chord">♩= ' + song.bpm + "</span>" +
      '<span class="chip chip-chord">难度 ' + stars(song.difficulty) + "</span>";

    const chordImgs = (song.chords || []).map(function (c) {
      const cd = CHORDS.find(function (x) { return x.name === c; });
      return cd ? "<div class='mini-chord'>" + renderChordSVG(cd) + "</div>" : "";
    }).join("");
    el("mChords").innerHTML = chordImgs
      ? '<h4>用到的和弦</h4><div class="chord-row">' + chordImgs + "</div>"
      : "";

    el("mChordLine").innerHTML = song.chordLine
      ? '<div class="chordline">' + esc(song.chordLine) + "</div>"
      : "";

    el("tabScroll").innerHTML = renderTabSVG(song);
    el("tabFallback").textContent = song.title + " · " + song.type + " · " + song.key +
      "（横向滚动查看完整谱面，点击下方播放可听旋律）";

    el("modal").classList.add("show");
    document.body.style.overflow = "hidden";
    el("btnPlay").textContent = "▶ 播放旋律";
  }

  function closeSong() {
    TabPlayer.stop();
    el("modal").classList.remove("show");
    document.body.style.overflow = "";
  }

  /* ---------- 播放高亮 ---------- */
  TabPlayer.setHighlight(function (evIdx) {
    document.querySelectorAll("#tabScroll .tabnote").forEach(function (n) {
      n.classList.remove("active");
    });
    if (evIdx >= 0) {
      const nodes = document.querySelectorAll('#tabScroll .tabnote[data-ev="' + evIdx + '"]');
      nodes.forEach(function (n) {
        n.classList.add("active");
        // 滚动跟随
        const box = el("tabScroll");
        const nx = n.getBoundingClientRect().left - box.getBoundingClientRect().left;
        if (nx < 40 || nx > box.clientWidth - 80) {
          box.scrollTo({ left: box.scrollLeft + nx - box.clientWidth * 0.35, behavior: "smooth" });
        }
      });
    }
  });
  TabPlayer.setOnEnd(function () {
    el("btnPlay").textContent = "▶ 播放旋律";
  });

  /* ---------- 和弦图库 ---------- */
  function renderChordLib() {
    el("chordGrid").innerHTML = CHORDS.map(function (c) {
      return '<figure class="chord-card">' + renderChordSVG(c) + "</figure>";
    }).join("");
  }

  /* ---------- 资源导航 ---------- */
  function renderResources() {
    el("resGrid").innerHTML = RESOURCES.map(function (cat) {
      const cards = cat.items.map(function (r) {
        return (
          '<a class="res-card" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="res-head"><h3>' + esc(r.name) + '</h3><span class="res-go" aria-hidden="true">↗</span></div>' +
          "<p>" + esc(r.desc) + "</p>" +
          '<div class="res-tags">' + r.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
          "</a>"
        );
      }).join("");
      return '<section class="res-cat"><h2 class="sec-sub-title">' + esc(cat.cat) + '</h2><div class="res-cards">' + cards + "</div></section>";
    }).join("");
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    el("searchInput").addEventListener("input", function (e) {
      state.q = e.target.value;
      renderSongs();
    });

    document.querySelectorAll("#diffChips .chip-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#diffChips .chip-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        state.diff = b.dataset.v;
        renderSongs();
      });
    });
    document.querySelectorAll("#typeChips .chip-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#typeChips .chip-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        state.type = b.dataset.v;
        renderSongs();
      });
    });

    el("songGrid").addEventListener("click", function (e) {
      const btn = e.target.closest(".btn-open");
      const card = e.target.closest(".song-card");
      if (card) openSong(card.dataset.id);
    });

    el("modalClose").addEventListener("click", closeSong);
    el("modal").addEventListener("click", function (e) {
      if (e.target === el("modal")) closeSong();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el("modal").classList.contains("show")) closeSong();
    });

    el("btnPlay").addEventListener("click", function () {
      if (!currentSong) return;
      if (el("btnPlay").dataset.playing === "1") {
        TabPlayer.stop();
        el("btnPlay").textContent = "▶ 播放旋律";
        el("btnPlay").dataset.playing = "0";
      } else {
        TabPlayer.play(currentSong, currentSpeed);
        el("btnPlay").textContent = "■ 停止";
        el("btnPlay").dataset.playing = "1";
      }
    });
    TabPlayer.setOnEnd(function () {
      el("btnPlay").textContent = "▶ 播放旋律";
      el("btnPlay").dataset.playing = "0";
    });

    document.querySelectorAll("#speedChips .chip-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#speedChips .chip-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        currentSpeed = parseFloat(b.dataset.v);
      });
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    el("statSongs").textContent = TAB_DATA.length + " 首";
    el("statChords").textContent = CHORDS.length + " 个";
    let resCount = 0;
    RESOURCES.forEach(function (c) { resCount += c.items.length; });
    el("statRes").textContent = resCount + " 个";
    renderSongs();
    renderChordLib();
    renderResources();
    bind();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
