/* =========================================================
 * build-song-pages.js — 为每首曲目生成静态详情页 song/{id}.html
 * 并同步重新生成 sitemap.xml
 * 运行: node tools/build-song-pages.js （项目根目录下执行）
 * ========================================================= */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
const { TAB_DATA } = new Function(src + "\nreturn { TAB_DATA: TAB_DATA };")();

const DOMAIN = "https://guitar-tabs.pages.dev";
const DIFF = ["", "入门", "初级", "中级", "进阶", "高级"];

function esc(t) {
  return String(t).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function stars(n) { return "★★★★★".slice(0, n); }

/* ---------- 侧栏静态列表（无 JS 也可爬取） ---------- */
function sideListHtml(current) {
  const hot = TAB_DATA.map(function (s, i) {
    const cls = s.id === current.id ? ' class="on"' : "";
    return '<li' + cls + '><a href="' + s.id + '.html"><span class="rk">' + (i + 1) + "</span>" +
      esc(s.title) + "吉他谱 · " + esc(s.artist) + " " + esc(s.key) + "</a></li>";
  }).join("");
  const latest = TAB_DATA.slice(-5).reverse().map(function (s) {
    return '<li><a href="' + s.id + '.html">' + esc(s.title) + "吉他谱 · " + esc(s.artist) + "</a></li>";
  }).join("");
  return (
    '<div class="detail-side">' +
    '<div class="detail-card"><h3 class="side-title">热门吉他谱</h3><ol class="rank-list">' + hot + "</ol></div>" +
    '<div class="detail-card"><h3 class="side-title">最新上架</h3><ol class="rank-list plain">' + latest + "</ol></div>" +
    '<div class="detail-card promo"><h3>零基础？先看教程</h3><p>十分钟学会看六线谱，配合本页谱面食用更佳。</p><a class="btn btn-primary" href="../tutorial.html">去看新手教程 →</a></div>' +
    "</div>"
  );
}

/* ---------- 相关推荐（同曲风优先，最多 6 个，静态输出） ---------- */
function relatedHtml(current) {
  const pool = TAB_DATA.filter(function (s) { return s.id !== current.id; });
  const sameGenre = pool.filter(function (s) { return s.genre === current.genre; });
  const others = pool.filter(function (s) { return s.genre !== current.genre; });
  const rel = sameGenre.concat(others).slice(0, 6);
  return '<div class="rel-grid">' + rel.map(function (s) {
    return (
      '<a class="rel-card" href="' + s.id + '.html">' +
      '<span class="chip chip-type">' + esc(s.type) + "</span>" +
      '<strong>' + esc(s.title) + "</strong>" +
      "<em>" + esc(s.artist) + " · " + esc(s.key) + " · " + DIFF[s.difficulty] + "</em>" +
      "</a>"
    );
  }).join("") + "</div>";
}

/* ---------- 单页模板 ---------- */
function pageHtml(song) {
  const title = song.title + "吉他谱_" + esc(song.artist) + "_" + esc(song.type) + "谱（" + esc(song.key) + "）— 六线谱库";
  const desc = String(song.desc || "").slice(0, 150);
  const intro =
    "《" + song.title + "》（" + song.subtitle + "）" +
    "是一首" + (song.genre === "儿歌" ? "经典儿歌" : song.genre === "古典" ? "古典名曲" : "广为流传的曲目") +
    "，本站编配为 " + song.key + " " + song.type + "谱，难度" + DIFF[song.difficulty] +
    "（" + stars(song.difficulty) + "），拍号 " + song.timeSig + "，速度 ♩= " + song.bpm +
    "。曲目已进入公有领域，本谱为原创编配，可免费在线查看、播放旋律跟练。";

  const metaBar =
    '<div class="meta-bar">' +
    '<span class="chip chip-type">' + esc(song.type) + "</span>" +
    '<span class="chip chip-chord">' + esc(song.key) + "</span>" +
    '<span class="chip chip-chord">' + esc(song.timeSig) + "</span>" +
    '<span class="chip chip-chord">♩= ' + song.bpm + "</span>" +
    '<span class="diff" title="难度 ' + song.difficulty + '/5">' + stars(song.difficulty) + " " + DIFF[song.difficulty] + "</span>" +
    "</div>";

  const chordsRow = (song.chords || []).length
    ? '<h2 class="sec-sub-title">用到的和弦指位图</h2><p class="muted">点击谱面下方的和弦名可对照左侧指位练习转换。</p><div class="chord-row" id="detailChords"></div>'
    : "";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    "name": song.title + "（吉他六线谱）",
    "alternateName": song.subtitle,
    "composer": { "@type": "Person", "name": song.artist },
    "musicalKey": song.key,
    "inLanguage": "zh-CN",
    "url": DOMAIN + "/song/" + song.id + ".html",
    "license": "Public domain arrangement (c) 六线谱库"
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(song.title)}吉他谱,${esc(song.title)}六线谱,${esc(song.type)}谱,${esc(song.key)}吉他谱,免费吉他谱">
  <meta name="theme-color" content="#14161b">
  <link rel="canonical" href="${DOMAIN}/song/${song.id}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${DOMAIN}/song/${song.id}.html">
  <meta property="og:site_name" content="六线谱库">
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8E%B8%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body class="theme-dark">

  <header class="site-header">
    <div class="container header-inner">
      <a class="logo" href="../index.html">🎸 <span>六线谱库</span><em>Guitar Tab Hub</em></a>
      <nav class="nav">
        <a href="../index.html#library">曲谱库</a>
        <a href="../index.html#chords">和弦图库</a>
        <a href="../tutorial.html">新手教程</a>
        <a href="../index.html#resources">资源导航</a>
      </nav>
    </div>
  </header>

  <main class="container detail-wrap" id="top">
    <div class="detail-main">
      <nav class="crumbs" aria-label="面包屑"><a href="../index.html">首页</a> › <a href="../index.html#library">曲谱库</a> › <span>${esc(song.title)}</span></nav>

      <article class="detail-card">
        <h1>${esc(song.title)}吉他谱 <small>${esc(song.subtitle)} · ${esc(song.artist)}</small></h1>
        ${metaBar}
        <div class="tab-box">
          <div id="tabScroll" class="tab-scroll"></div>
          <noscript><p class="tab-fallback">${esc(song.title)} · ${esc(song.type)} · ${esc(song.key)}：请启用 JavaScript 查看谱面，或访问首页使用各站点资源。</p></noscript>
        </div>
        <div class="play-bar">
          <button id="btnPlay" class="btn btn-primary" type="button">▶ 播放旋律</button>
          <div class="speed-chips" id="speedChips">
            <button class="tab-btn on" data-v="0.6" type="button">0.6x</button>
            <button class="tab-btn" data-v="0.8" type="button">0.8x</button>
            <button class="tab-btn" data-v="1" type="button">原速</button>
          </div>
        </div>
        ${chordsRow}
      </article>

      <article class="detail-card">
        <h2 class="sec-sub-title">${esc(song.title)}吉他谱简介</h2>
        <p>${esc(intro)}</p>
        <p>${esc(song.desc || "")}</p>

        <h2 class="sec-sub-title">${esc(song.title)}吉他谱难度大吗？</h2>
        <p>本谱难度为 <strong>${DIFF[song.difficulty]}</strong>（${stars(song.difficulty)}），${song.difficulty <= 1 ? "几乎零门槛，完全不认识六线谱也能在十分钟内弹出第一句，强烈推荐作为你的第一首曲子。" : song.difficulty === 2 ? "需要掌握基础指法与简单节奏型，适合已经能流畅读谱的新手进阶。" : "包含更复杂的节奏与把位变化，建议先放慢速度分段练习，再逐渐提速到原速。"}不确定怎么开始？先读一遍<a href="../tutorial.html">零基础六线谱入门教程</a>。</p>

        <h2 class="sec-sub-title">怎么练习这份谱子？</h2>
        <p>建议三步走：① 点击上方「播放旋律」，用 0.6 倍速听熟旋律走向；② 对照谱面逐小节模仿指法，先不求快、只求音对；③ 熟练后逐档提速至原速。练习中遇到不懂的符号，直接在<a href="../tutorial.html">新手教程</a>里查对应章节。</p>
      </article>

      <section class="detail-card">
        <h2 class="sec-sub-title">相关吉他谱推荐</h2>
        ${relatedHtml(song)}
      </section>
    </div>

    ${sideListHtml(song)}
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>本站曲谱均为公有领域曲目的原创编配，遵循 <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener" target="_blank">CC0</a> 精神免费开放。<a href="../privacy.html">隐私政策</a></p>
    </div>
  </footer>

  <script>window.SONG_ID = "${song.id}";</script>
  <script src="../js/data.js"></script>
  <script src="../js/renderer.js"></script>
  <script src="../js/player.js"></script>
  <script src="../js/song.js"></script>
</body>
</html>`;
}

/* ---------- sitemap ---------- */
function sitemapXml() {
  const urls = [
    { loc: DOMAIN + "/", pri: "1.0", freq: "weekly" },
    { loc: DOMAIN + "/tutorial.html", pri: "0.8", freq: "monthly" },
    { loc: DOMAIN + "/privacy.html", pri: "0.3", freq: "yearly" }
  ].concat(TAB_DATA.map(function (s) {
    return { loc: DOMAIN + "/song/" + s.id + ".html", pri: "0.9", freq: "monthly" };
  }));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(function (u) {
      return "  <url>\n    <loc>" + u.loc + "</loc>\n    <changefreq>" + u.freq + "</changefreq>\n    <priority>" + u.pri + "</priority>\n  </url>";
    }).join("\n") + "\n</urlset>\n";
}

/* ---------- main ---------- */
const outDir = path.join(ROOT, "song");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
let n = 0;
TAB_DATA.forEach(function (s) {
  fs.writeFileSync(path.join(outDir, s.id + ".html"), pageHtml(s), "utf8");
  n++;
});
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemapXml(), "utf8");
console.log("Generated " + n + " song pages + sitemap.xml (" + TAB_DATA.map(function (s) { return s.id; }).join(", ") + ")");
