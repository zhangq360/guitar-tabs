/* =========================================================
 * check-twinkle.js — 全曲库校验（混合谱式）
 * 用法: node tools/check-twinkle.js
 * ========================================================= */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const src = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8") +
            "\n" + fs.readFileSync(path.join(ROOT, "js", "renderer.js"), "utf8");
const { TAB_DATA, renderTabSVG, CHORDS } = new Function(src + "\nreturn { TAB_DATA: TAB_DATA, renderTabSVG: renderTabSVG, CHORDS: CHORDS };")();

const BEATS = { "4/4": 4, "3/4": 3, "2/4": 2, "3/8": 1.5 };
let errors = 0;

TAB_DATA.forEach(function (sg) {
  const beats = BEATS[sg.timeSig];
  if (!beats) { console.log("!! " + sg.id + " 未知拍号 " + sg.timeSig); errors++; return; }
  if (!sg.style || (sg.style !== "solo" && sg.style !== "accomp")) {
    console.log("!! " + sg.id + " 缺少 style 字段"); errors++; return;
  }

  // 和弦必须都在和弦表里
  (sg.chords || []).forEach(function (c) {
    if (!CHORDS.some(function (cd) { return cd.name === c; })) {
      console.log("!! " + sg.id + " 和弦 " + c + " 不在 CHORDS 表"); errors++;
    }
  });

  sg.bars.forEach(function (bar, bi) {
    const sum = bar.e.reduce(function (a, e) { return a + e.d; }, 0);
    if (bar.pickup) {
      if (sum >= beats) { console.log("!! " + sg.id + " 弱起小节 " + (bi + 1) + " 拍数 " + sum); errors++; }
    } else if (Math.abs(sum - beats) > 0.001) {
      console.log("!! " + sg.id + " 小节 " + (bi + 1) + " e 拍数 " + sum + " != " + beats); errors++;
    }
    if (sg.style === "accomp") {
      if (!bar.mel) { console.log("!! " + sg.id + " 小节 " + (bi + 1) + " 弹唱谱缺 mel"); errors++; return; }
      const msum = bar.mel.reduce(function (a, m) { return a + m.d; }, 0);
      if (bar.pickup) {
        if (msum >= beats) { console.log("!! " + sg.id + " 弱起小节 " + (bi + 1) + " mel 拍数 " + msum); errors++; }
      } else if (Math.abs(msum - beats) > 0.001) {
        console.log("!! " + sg.id + " 小节 " + (bi + 1) + " mel 拍数 " + msum + " != " + beats); errors++;
      }
      if (bar.mel.some(function (m) { return String(m.n).indexOf("#") >= 0; })) {
        // 变音记号仅独奏谱标注，弹唱谱允许但提示
        console.log("   " + sg.id + " 小节 " + (bi + 1) + " 简谱含变音记号");
      }
    } else if (bar.mel) {
      console.log("!! " + sg.id + " 小节 " + (bi + 1) + " 独奏谱不应有 mel"); errors++;
    }
  });

  // 渲染检查：白底、无 NaN、事件序号连续
  const svg = renderTabSVG(sg);
  if (/NaN|Infinity/.test(svg)) { console.log("!! " + sg.id + " SVG 含 NaN/Infinity"); errors++; }
  if (svg.indexOf('rect x="0" y="0"') < 0) { console.log("!! " + sg.id + " 缺少白底"); errors++; }

  const idxs = [];
  svg.replace(/data-ev="(\d+)"/g, function (m, d) { idxs.push(+d); return m; });
  const uniq = idxs.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  for (let i = 0; i < uniq.length; i++) {
    if (uniq[i] !== i) { console.log("!! " + sg.id + " 事件序号不连续 @" + i); errors++; break; }
  }
  const totalE = sg.bars.reduce(function (a, b) { return a + b.e.length; }, 0);
  if (totalE !== uniq.length) {
    console.log("!! " + sg.id + " 事件数不匹配: 渲染 " + uniq.length + " vs 数据 " + totalE); errors++;
  }

  const styleName = sg.style === "solo" ? "独奏" : "弹唱";
  console.log("ok " + sg.id.padEnd(12) + " [" + styleName + "] " + String(sg.bars.length).padStart(2) + " 小节 " + sg.timeSig + "  事件 " + totalE);
});

if (errors) {
  console.log("\n共 " + errors + " 个问题");
  process.exit(1);
} else {
  console.log("\n全部通过：" + TAB_DATA.length + " 首（独奏 " +
    TAB_DATA.filter(function (s) { return s.style === "solo"; }).length + " + 弹唱 " +
    TAB_DATA.filter(function (s) { return s.style === "accomp"; }).length + "）");
}
