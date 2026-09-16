const fs = require("fs");
const root = "C:/Users/Administrator/WorkBuddy/2026-09-14-20-04-16/guitar-tabs/";
const code = fs.readFileSync(root + "js/data.js", "utf8") + "\n" +
             fs.readFileSync(root + "js/renderer.js", "utf8") + "\n" +
             `
const tw = TAB_DATA.find(s => s.id === "twinkle");
console.log("曲目总数=" + TAB_DATA.length + "，twinkle 小节=" + tw.bars.length + "，难度=" + tw.difficulty);
let bad = 0;
tw.bars.forEach((b, i) => {
  const t = b.e.reduce((a, e) => a + e.d, 0);
  if (t !== 4) { bad++; console.log("!! 小节" + (i + 1) + " 拍数=" + t); }
});
console.log("拍数校验: " + (bad === 0 ? "全部 4 拍 OK" : "有异常"));
// 全部曲目都能渲染
TAB_DATA.forEach(s => { const svg = renderTabSVG(s); if (svg.length < 500) throw new Error(s.id + " SVG 异常"); });
console.log("全部 " + TAB_DATA.length + " 首渲染 OK");
const svg = renderTabSVG(tw);
console.log("twinkle SVG 含段落标记=" + svg.includes("tab-sec") + "，含歌词=" + svg.includes("tab-ly"));
`;
eval(code);
