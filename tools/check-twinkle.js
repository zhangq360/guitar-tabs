const fs = require("fs");
const root = "C:/Users/Administrator/WorkBuddy/2026-09-14-20-04-16/guitar-tabs/";
const code = fs.readFileSync(root + "js/data.js", "utf8") + "\n" +
             fs.readFileSync(root + "js/renderer.js", "utf8") + "\n" +
             `
const tw = TAB_DATA.find(s => s.id === "twinkle");
console.log("曲目总数=" + TAB_DATA.length + "，twinkle 小节=" + tw.bars.length + "，类型=" + tw.type + "，风格=" + tw.style);
let bad = 0;
tw.bars.forEach((b, i) => {
  const t = b.e.reduce((a, e) => a + e.d, 0);
  if (t !== 4) { bad++; console.log("!! 小节" + (i + 1) + " 拍数=" + t); }
});
console.log("拍数校验: " + (bad === 0 ? "全部 4 拍 OK" : "有异常"));
TAB_DATA.forEach(s => { const svg = renderTabSVG(s); if (svg.length < 500) throw new Error(s.id + " SVG 异常"); });
console.log("全部 " + TAB_DATA.length + " 首渲染 OK");
const svg = renderTabSVG(tw);
const checks = {
  "× 记号": svg.includes("tab-xmark"),
  "迷你和弦图": svg.includes("mini-name"),
  "简谱行": svg.includes("tab-num"),
  "歌词行": svg.includes("tab-ly"),
  "段落标记": svg.includes("tab-sec"),
  "尾声和弦": svg.includes("data-ev")
};
let ok = true;
for (const k in checks) { if (!checks[k]) { ok = false; console.log("!! 缺少: " + k); } }
console.log("弹唱谱要素: " + (ok ? "齐全" : "缺失"));
// 非弹唱曲目不受影响
const ode = renderTabSVG(TAB_DATA.find(s => s.id === "ode"));
console.log("欢乐颂(旧格式)无 xmark: " + !ode.includes("tab-xmark") + "，无和弦图: " + !ode.includes("mini-name"));
`;
eval(code);
