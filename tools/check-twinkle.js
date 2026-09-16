const fs = require("fs");
const root = "C:/Users/Administrator/WorkBuddy/2026-09-14-20-04-16/guitar-tabs/";
const data = fs.readFileSync(root + "js/data.js", "utf8");
const renderer = fs.readFileSync(root + "js/renderer.js", "utf8");
const player = fs.readFileSync(root + "js/player.js", "utf8");
const sandbox = data + "\n" + renderer + "\n" + player + "\n" + `
const BEATS = { "4/4": 4, "3/4": 3, "3/8": 1.5 };
let bad = 0;
console.log("=== 全曲库数据校验（按各自拍号）===");
TAB_DATA.forEach(function (song) {
  const expect = BEATS[song.timeSig] || 4;
  const msgs = [];
  song.bars.forEach(function (b, i) {
    const es = b.e.reduce(function (a, e) { return a + e.d; }, 0);
    if (es !== expect && !b.pickup) msgs.push("小节" + (i + 1) + " 伴奏拍数=" + es);
    if (b.mel) {
      const ms = b.mel.reduce(function (a, m) { return a + m.d; }, 0);
      if (ms !== expect && !b.pickup) msgs.push("小节" + (i + 1) + " 简谱拍数=" + ms);
      if (b.ly && b.ly.length > b.mel.length) msgs.push("小节" + (i + 1) + " 歌词多于音符");
    }
  });
  if (msgs.length) { bad++; console.log("!! " + song.id + ": " + msgs.join("; ")); }
  else console.log(song.id + " (" + song.bars.length + " 小节 " + song.timeSig + ") OK");
});
console.log(bad === 0 ? "=== 数据全部通过 ===" : "=== 有 " + bad + " 首异常 ===");

TAB_DATA.forEach(function (sg) {
  const svg = renderTabSVG(sg);
  if (svg.indexOf('rect x="0" y="0"') < 0) throw new Error(sg.id + " 缺少白底");
  if (svg.length < 500) throw new Error(sg.id + " SVG 异常");
});
console.log("全部 " + TAB_DATA.length + " 首渲染 OK（白底齐全）");

const tw = TAB_DATA.filter(function (s) { return s.id === "twinkle"; })[0];
const svg = renderTabSVG(tw);
console.log("twinkle × 记号: " + (svg.indexOf(">×</text>") >= 0));
console.log("twinkle 和弦图: " + (svg.indexOf(">C</text>") >= 0));
console.log("twinkle 简谱: " + (svg.indexOf('font-size="19"') >= 0));
console.log("twinkle 歌词一: " + (svg.indexOf(">一</text>") >= 0));

const idxs = [];
svg.replace(/data-ev="([0-9]+)"/g, function (m, d) { idxs.push(+d); return m; });
const uniq = idxs.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
let cont = true;
for (let i = 0; i < uniq.length; i++) if (uniq[i] !== i) cont = false;
console.log("twinkle 事件序号连续 0.." + (uniq.length - 1) + ": " + cont);

const cn = renderTabSVG(TAB_DATA.filter(function (s) { return s.id === "canon"; })[0]);
console.log("canon c2 和弦图(Bm): " + (cn.indexOf(">Bm</text>") >= 0));

const sn = renderTabSVG(TAB_DATA.filter(function (s) { return s.id === "silentnight"; })[0]);
let dots = 0;
sn.replace(/r="2.2"/g, function () { dots++; return ""; });
console.log("silentnight 低音点: " + dots + " 个");

console.log("=== 全部检查完成 ===");
`;
eval(sandbox);
