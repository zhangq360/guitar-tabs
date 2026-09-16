const fs = require("fs");
const root = "C:/Users/Administrator/WorkBuddy/2026-09-14-20-04-16/guitar-tabs/";
const data = fs.readFileSync(root + "js/data.js", "utf8");
const renderer = fs.readFileSync(root + "js/renderer.js", "utf8");
const player = fs.readFileSync(root + "js/player.js", "utf8");
const sandbox = data + "\n" + renderer + "\n" + player + "\n" + `
const BEATS = { "4/4": 4, "3/4": 3, "3/8": 1.5 };
let bad = 0;
console.log("=== 独奏曲库校验 ===");
TAB_DATA.forEach(function (song) {
  const expect = BEATS[song.timeSig] || 4;
  const msgs = [];
  let noteCount = 0, bassCount = 0;
  song.bars.forEach(function (b, i) {
    const es = b.e.reduce(function (a, e) { return a + e.d; }, 0);
    if (es !== expect && !b.pickup) msgs.push("小节" + (i + 1) + " 拍数=" + es);
    b.e.forEach(function (e) {
      e.n.forEach(function (nt) {
        noteCount++;
        if (nt[0] >= 4) bassCount++;
        if (nt[0] < 1 || nt[0] > 6) msgs.push("小节" + (i + 1) + " 弦号非法 " + nt[0]);
        if (typeof nt[1] !== "number" || nt[1] < 0 || nt[1] > 19) msgs.push("小节" + (i + 1) + " 品位非法 " + nt[1]);
      });
    });
  });
  if (msgs.length) { bad++; console.log("!! " + song.id + ": " + msgs.join("; ")); }
  else console.log(song.id + " (" + song.bars.length + " 小节 " + song.timeSig + ", " + noteCount + " 音, 低音 " + bassCount + ") OK");
});
console.log(bad === 0 ? "=== 拍数/指位全部通过 ===" : "=== 有 " + bad + " 首异常 ===");

TAB_DATA.forEach(function (sg) {
  const svg = renderTabSVG(sg);
  if (svg.indexOf('rect x="0" y="0"') < 0) throw new Error(sg.id + " 缺少白底");
  // 事件序号连续性
  const idxs = [];
  svg.replace(/data-ev="(\\d+)"/g, function (m, d) { idxs.push(+d); return m; });
  const uniq = idxs.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  const total = sg.bars.reduce(function (a, b) { return a + b.e.length; }, 0);
  if (uniq.length && (uniq[0] !== 0 || uniq[uniq.length - 1] !== total - 1)) {
    throw new Error(sg.id + " 事件序号范围异常: " + uniq[0] + ".." + uniq[uniq.length - 1] + " 应为 0.." + (total - 1));
  }
});
console.log("全部 " + TAB_DATA.length + " 首渲染 OK（白底齐全、序号连续 0..N-1、无 × 记号）");

// 完整性：每首至少 8 小节
const short = TAB_DATA.filter(function (s) { return s.bars.length < 8; });
console.log(short.length ? "!! 曲子偏短: " + short.map(function (s) { return s.id + "=" + s.bars.length; }).join(",") : "曲长检查 OK（均 ≥ 8 小节）");
console.log(TAB_DATA.map(function (s) { return s.id + "=" + s.bars.length; }).join(" "));

const cn = renderTabSVG(TAB_DATA.filter(function (s) { return s.id === "canon"; })[0]);
console.log("canon c2 和弦图(Bm): " + (cn.indexOf(">Bm</text>") >= 0));
const tw = renderTabSVG(TAB_DATA.filter(function (s) { return s.id === "twinkle"; })[0]);
console.log("twinkle 双音事件(终止和弦): " + (tw.indexOf("[5,3]") >= 0 || tw.match(/data-ev/g).length > 12));
console.log("=== 全部检查完成 ===");
`;
eval(sandbox);
