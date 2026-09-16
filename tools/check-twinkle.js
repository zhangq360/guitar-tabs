const fs = require("fs");
const root = "C:/Users/Administrator/WorkBuddy/2026-09-14-20-04-16/guitar-tabs/";
const code = fs.readFileSync(root + "js/data.js", "utf8") + "\n" +
             fs.readFileSync(root + "js/renderer.js", "utf8") + "\n" +
             `
const tw = TAB_DATA.find(s => s.id === "twinkle");
console.log("曲目总数=" + TAB_DATA.length + "，twinkle 小节=" + tw.bars.length + "，类型=" + tw.type);
let bad = 0;
tw.bars.forEach((b, i) => {
  const t = b.e.reduce((a, e) => a + e.d, 0);
  if (t !== 4) { bad++; console.log("!! 小节" + (i + 1) + " 拍数=" + t); }
  if (b.mel) { const mt = b.mel.reduce((a, m) => a + m.d, 0); if (mt !== 4) { bad++; console.log("!! 小节" + (i + 1) + " 简谱拍数=" + mt); } }
});
console.log("拍数校验(伴奏+简谱): " + (bad === 0 ? "全部 4 拍 OK" : "有异常"));
TAB_DATA.forEach(s => { const svg = renderTabSVG(s); if (svg.length < 500) throw new Error(s.id + " SVG 异常"); });
console.log("全部 " + TAB_DATA.length + " 首渲染 OK");
const svg = renderTabSVG(tw);
const checks = {
  "多行谱表(viewBox 940)": svg.includes('viewBox="0 0 940'),
  "× 记号": svg.includes("tab-xmark"),
  "符干符梁2.6": svg.includes('stroke-width="2.6"'),
  "迷你和弦图": svg.includes("mini-name"),
  "简谱行": svg.includes("ac-num"),
  "歌词行": svg.includes("ac-ly"),
  "段落标记": svg.includes("tab-sec"),
  "key 信息行": svg.includes("ac-head"),
  "终止双线": svg.includes('stroke-width="3"'),
  "事件序号 data-ev": svg.includes("data-ev")
};
let ok = true;
for (const k in checks) { if (!checks[k]) { ok = false; console.log("!! 缺少: " + k); } }
console.log("多行弹唱谱要素: " + (ok ? "齐全" : "缺失"));
// data-ev 连续性：序号应从 0 开始且连续
const idxs = [...svg.matchAll(/data-ev="([0-9]+)"/g)].map(m => +m[1]);
const uniq = [...new Set(idxs)].sort((a,b)=>a-b);
const continuous = uniq.every((v,i)=>v===i);
console.log("事件序号连续 0.." + (uniq.length-1) + ": " + (continuous ? "OK" : "!! 断裂"));
// 非弹唱曲目走旧渲染器不受影响
const ode = renderTabSVG(TAB_DATA.find(s => s.id === "ode"));
console.log("欢乐颂(旧格式)无 xmark: " + !ode.includes("tab-xmark") + "，无和弦图: " + !ode.includes("mini-name"));
`;
eval(code);
