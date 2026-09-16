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

  /* ---------- 状态 ---------- */
  const state = { q: "", diff: "all", type: "all", key: "all" };

  /* ---------- 曲谱列表行 ---------- */
  function songRow(song, idx) {
    const diffText = ["", "入门", "初级", "中级", "进阶", "高级"][song.difficulty] || "初级";
    return (
      '<article class="song-row" data-id="' + song.id + '">' +
      '<span class="row-idx">' + (idx + 1) + "</span>" +
      "<div>" +
      '<h3 class="row-title">' + esc(song.title) + " · " + esc(song.artist) + "（" + esc(song.key) + "）</h3>" +
      '<p class="row-sub">' + esc(song.subtitle) + " · " + esc(song.genre) + " · ♩= " + song.bpm + "</p>" +
      "</div>" +
      '<div class="row-right"><span class="chip chip-type">' + esc(song.type) + "</span>" +
      '<span class="diff" title="难度 ' + song.difficulty + '/5">' + stars(song.difficulty) + "</span>" +
      "<span>" + diffText + "</span></div>" +
      "</article>"
    );
  }

  function filteredSongs() {
    const q = state.q.trim().toLowerCase();
    return TAB_DATA.filter(function (s) {
      const hitQ = !q ||
        s.title.toLowerCase().indexOf(q) >= 0 ||
        s.subtitle.toLowerCase().indexOf(q) >= 0 ||
        s.artist.toLowerCase().indexOf(q) >= 0 ||
        s.genre.toLowerCase().indexOf(q) >= 0 ||
        (s.chords || []).join(" ").toLowerCase().indexOf(q) >= 0;
      const hitD = state.diff === "all" || s.difficulty <= parseInt(state.diff, 10);
      const hitT = state.type === "all" || s.type === state.type || s.genre === state.type;
      const hitK = state.key === "all" || s.key === state.key;
      return hitQ && hitD && hitT && hitK;
    });
  }

  function renderSongs() {
    const box = el("songList");
    const list = filteredSongs();
    if (!list.length) {
      box.innerHTML = '<p class="empty">没有找到匹配的曲谱，换个关键词试试～</p>';
      return;
    }
    box.innerHTML = list.map(songRow).join("");
  }

  /* ---------- 左侧筛选（难度 / 调性，带数量统计） ---------- */
  function renderSideFilters() {
    const diffDefs = [
      { v: "all", label: "全部难度" },
      { v: "1", label: "入门 ★" },
      { v: "2", label: "初级及以下 ★★" },
      { v: "3", label: "中级及以下 ★★★" }
    ];
    const keySet = [];
    TAB_DATA.forEach(function (s) {
      if (keySet.indexOf(s.key) < 0) keySet.push(s.key);
    });
    const diffHtml = diffDefs.map(function (d) {
      const n = d.v === "all" ? TAB_DATA.length :
        TAB_DATA.filter(function (s) { return s.difficulty <= parseInt(d.v, 10); }).length;
      return '<div class="side-item" data-group="diff" data-v="' + d.v + '" role="button" tabindex="0">' +
        "<span>" + d.label + "</span><span class='cnt'>" + n + "</span></div>";
    }).join("");
    const keyHtml = ['<div class="side-item" data-group="key" data-v="all" role="button" tabindex="0">' +
      "<span>全部调性</span><span class='cnt'>" + TAB_DATA.length + "</span></div>"]
      .concat(keySet.map(function (k) {
        const n = TAB_DATA.filter(function (s) { return s.key === k; }).length;
        return '<div class="side-item" data-group="key" data-v="' + esc(k) + '" role="button" tabindex="0">' +
          "<span>" + esc(k) + "</span><span class='cnt'>" + n + "</span></div>";
      })).join("");
    el("sideFilters").innerHTML =
      '<h3 class="side-title">难度</h3>' + diffHtml +
      '<h3 class="side-title" style="margin-top:14px">调性</h3>' + keyHtml;
  }

  function bindSideFilters() {
    el("sideFilters").addEventListener("click", function (e) {
      const item = e.target.closest(".side-item");
      if (!item) return;
      const group = item.dataset.group;
      el("sideFilters").querySelectorAll('.side-item[data-group="' + group + '"]').forEach(function (x) {
        x.classList.remove("on");
      });
      item.classList.add("on");
      state[group] = item.dataset.v;
      renderSongs();
    });
  }

  /* ---------- 右侧：最新上架 + 热门标签 ---------- */
  function renderLatest() {
    const latest = TAB_DATA.slice().reverse().slice(0, 5);
    el("latestList").innerHTML = latest.map(function (s, i) {
      return '<div class="side-item" data-song="' + esc(s.id) + '" role="button" tabindex="0">' +
        '<span class="row-idx">' + (i + 1) + "</span>" +
        "<span style=\"flex:1;margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">" +
        esc(s.title) + " " + esc(s.artist) + "</span></div>";
    }).join("");
    el("latestList").addEventListener("click", function (e) {
      const item = e.target.closest(".side-item[data-song]");
      if (item) openSong(item.dataset.song);
    });
  }

  function renderTagCloud() {
    const seen = {};
    const tags = [];
    TAB_DATA.forEach(function (s) {
      (s.chords || []).forEach(function (c) {
        if (!seen[c]) { seen[c] = true; tags.push(c); }
      });
    });
    el("tagCloud").innerHTML = tags.map(function (t) {
      return '<button class="chip chip-chord" data-tag="' + esc(t) + '" type="button">' + esc(t) + "</button>";
    }).join("");
    el("tagCloud").addEventListener("click", function (e) {
      const b = e.target.closest(".chip-chord");
      if (!b) return;
      state.q = b.dataset.tag;
      el("searchInput").value = state.q;
      renderSongs();
      el("library").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- 谱面弹窗 ---------- */
  let currentSong = null;
  let currentSpeed = 1;

  function openSong(id) {
    // 跳转到独立详情页（每个详情页都是单独的收录入口，利于 SEO）
    location.href = "song/" + id + ".html";
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

    document.querySelectorAll("#typeChips .tab-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#typeChips .tab-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        state.type = b.dataset.v;
        renderSongs();
      });
    });

    el("songList").addEventListener("click", function (e) {
      const row = e.target.closest(".song-row");
      if (row) openSong(row.dataset.id);
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

    document.querySelectorAll("#speedChips .tab-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#speedChips .tab-btn").forEach(function (x) { x.classList.remove("on"); });
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
    renderSideFilters();
    bindSideFilters();
    renderLatest();
    renderTagCloud();
    renderSongs();
    renderChordLib();
    renderResources();
    bind();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
