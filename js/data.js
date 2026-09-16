/* =========================================================
 * 六线谱库 · 曲谱数据（均为公有领域曲目，由本站自行编配）
 * 事件格式: { n: [[弦(1高音E~6低音E), 品]], d: 拍数 }
 *   d: 0.5 = 八分音符, 1 = 四分, 1.5 = 附点四分, 2 = 二分, 3 = 附点二分/三拍
 * 小节格式: { c: "和弦名(可选)", e: [事件...] }
 * ========================================================= */

// 标准调弦下常用音的把位（开放式把位）：
// C4=5弦3品 D4=4弦0 E4=4弦2 F4=4弦3 G4=3弦0 A4=3弦2 B4=2弦0
// C5=2弦1 D5=2弦3 E5=2弦5 D#5=2弦4 F5=1弦1 G5=1弦3

// 弹唱分解节奏型 53231323（b = 低音弦号：C 用 5、F 用 4、G 用 6）
function accPattern(b) {
  return [b, 3, 2, 3, 1, 3, 2, 3].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}
// 简谱辅助：4 个四分音符 / 2 个四分 + 1 个二分（n 为简谱字符，"0" 为休止）
function mel4(a, b, c, d) { return [{ n: a, d: 1 }, { n: b, d: 1 }, { n: c, d: 1 }, { n: d, d: 1 }]; }
function mel3(a, b, c) { return [{ n: a, d: 1 }, { n: b, d: 1 }, { n: c, d: 2 }]; }
function rest4() { return [{ n: "0", d: 1 }, { n: "0", d: 1 }, { n: "0", d: 1 }, { n: "0", d: 1 }]; }
// 3/4 拍分解节奏型 532313
function accPattern34(b) {
  return [b, 3, 2, 3, 1, 3].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}
// 3/8 拍分解（三个八分音符）
function accPattern38(b) {
  return [b, 3, 1].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}
// 弱起小节：低音两个八分
function accPick(b) {
  return [{ n: [[b, "x"]], d: 0.5 }, { n: [[b, "x"]], d: 0.5 }];
}
// 半小节分解 5323（卡农双和弦用）
function accHalf(b) {
  return [b, 3, 2, 3].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}

const TAB_DATA = [
  {
    id: "twinkle",
    title: "小星星",
    subtitle: "Twinkle Twinkle Little Star",
    artist: "英格兰传统童谣",
    genre: "儿歌",
    type: "指弹",
    key: "C 大调",
    bpm: 96,
    timeSig: "4/4",
    desc: "弹唱完整版：上方挂和弦指位图，谱面为 × 记号的 53231323 分解和弦节奏型，下方简谱旋律 + 歌词对照。照谱弹伴奏、跟简谱开口唱，就能自弹自唱一首完整的《小星星》。",
    chords: ["C", "F", "G"],
    type: "弹唱",
    difficulty: 1,
    style: "accomp",
    bars: [
      // ---- 前奏：C 和弦分解，简谱休止 ----
      { c: "C", sec: "前奏", e: accPattern(5), mel: rest4() },
      { c: "C", e: accPattern(5), mel: rest4() },
      // ---- 主歌：弹伴奏，唱旋律 ----
      { c: "C", sec: "主歌", mel: mel4("1", "1", "5", "5"), ly: ["一", "闪", "一", "闪"], e: accPattern(5) },
      { c: "C", mel: mel3("6", "6", "5"), ly: ["亮", "晶", "晶"], e: accPattern(5) },
      { c: "F", mel: mel4("4", "4", "3", "3"), ly: ["满", "天", "都", "是"], e: accPattern(4) },
      { c: "C", mel: mel3("2", "2", "1"), ly: ["小", "星", "星"], e: accPattern(5) },
      // ---- 间奏：C-F-G-G 走向 ----
      { c: "C", sec: "间奏", mel: mel4("5", "5", "4", "4"), e: accPattern(5) },
      { c: "F", mel: mel3("3", "3", "2"), e: accPattern(4) },
      { c: "G", mel: mel4("5", "5", "4", "4"), e: accPattern(6) },
      { c: "G", mel: mel3("3", "3", "2"), e: accPattern(6) },
      // ---- 再现：回到主题 ----
      { c: "C", sec: "再现", mel: mel4("1", "1", "5", "5"), ly: ["一", "闪", "一", "闪"], e: accPattern(5) },
      { c: "C", mel: mel3("6", "6", "5"), ly: ["亮", "晶", "晶"], e: accPattern(5) },
      { c: "F", mel: mel4("4", "4", "3", "3"), ly: ["满", "天", "都", "是"], e: accPattern(4) },
      { c: "C", mel: mel3("2", "2", "1"), ly: ["小", "星", "星"], e: accPattern(5) },
      // ---- 尾声：完整 C 和弦收束 ----
      { c: "C", sec: "尾声", mel: [{ n: "1", d: 4 }], e: [ { n: [[5,3],[4,2],[3,0],[2,1],[1,0]], d: 4 } ] }
    ]
  },
  {
    id: "ode",
    title: "欢乐颂",
    subtitle: "Ode to Joy",
    artist: "贝多芬 · 《第九交响曲》",
    genre: "古典",
    type: "弹唱",
    difficulty: 1,
    key: "C 大调",
    bpm: 108,
    timeSig: "4/4",
    desc: "弹唱版：贝多芬第九交响曲第四乐章主题，上方和弦图 + 53231323 分解节奏型 + 简谱旋律 + 歌词对照。旋律级进为主，照谱弹伴奏开口就能唱。",
    chords: ["C", "G", "G7"],
    style: "accomp",
    bars: [
      { c: "C",  mel: mel4("3", "3", "4", "5"), ly: ["欢", "乐", "女", "神"], e: accPattern(5) },
      { c: "G",  mel: mel4("5", "4", "3", "2"), ly: ["圣", "洁", "美", "丽"], e: accPattern(6) },
      { c: "C",  mel: mel4("1", "1", "2", "3"), ly: ["灿", "烂", "光", "芒"], e: accPattern(5) },
      { c: "G",  mel: [{ n: "3", d: 1.5 }, { n: "2", d: 0.5 }, { n: "2", d: 2 }], ly: ["照", "大", "地"], e: accPattern(6) },
      { c: "C",  mel: mel4("3", "3", "4", "5"), ly: ["我", "们", "心", "中"], e: accPattern(5) },
      { c: "G",  mel: mel4("5", "4", "3", "2"), ly: ["充", "满", "热", "情"], e: accPattern(6) },
      { c: "C",  mel: mel4("1", "1", "2", "3"), ly: ["来", "到", "你", "的"], e: accPattern(5) },
      { c: "G7", mel: [{ n: "2", d: 1.5 }, { n: "1", d: 0.5 }, { n: "1", d: 2 }], ly: ["圣", "殿", "里"], e: accPattern(6) }
    ]
  },
  {
    id: "birthday",
    title: "生日快乐",
    subtitle: "Happy Birthday to You",
    artist: "Hill 姐妹（1893，已进入公有领域）",
    genre: "歌曲",
    type: "弹唱",
    difficulty: 1,
    key: "C 大调",
    bpm: 90,
    timeSig: "3/4",
    desc: "弹唱版：三拍子分解伴奏（532313）+ 简谱旋律 + 歌词，弱起小节从「祝你」开始。世界上最常被演唱的旋律（2016 年起进入公有领域）。",
    chords: ["C", "G", "F"],
    style: "accomp",
    bars: [
      { c: "G", pickup: true, mel: [{ n: "5", d: 0.5 }, { n: "5", d: 0.5 }], ly: ["祝", "你"], e: accPick(6) },
      { c: "G", mel: [{ n: "6", d: 1 }, { n: "5", d: 1 }, { n: "1'", d: 1 }], ly: ["生", "日", "快"], e: accPattern34(6) },
      { c: "G", mel: [{ n: "7", d: 3 }], ly: ["乐"], e: accPattern34(6) },
      { c: "G", pickup: true, mel: [{ n: "5", d: 0.5 }, { n: "5", d: 0.5 }], ly: ["祝", "你"], e: accPick(6) },
      { c: "G", mel: [{ n: "6", d: 1 }, { n: "5", d: 1 }, { n: "2'", d: 1 }], ly: ["生", "日", "快"], e: accPattern34(6) },
      { c: "C", mel: [{ n: "1'", d: 3 }], ly: ["乐"], e: accPattern34(5) },
      { c: "C", pickup: true, mel: [{ n: "5'", d: 0.5 }, { n: "5'", d: 0.5 }], ly: ["祝", "你"], e: accPick(5) },
      { c: "C", mel: [{ n: "5'", d: 1 }, { n: "3'", d: 1 }, { n: "1'", d: 1 }], ly: ["生", "日", "快"], e: accPattern34(5) },
      { c: "G", mel: [{ n: "7", d: 1 }, { n: "6", d: 2 }], ly: ["乐"], e: accPattern34(6) },
      { c: "F", pickup: true, mel: [{ n: "4'", d: 0.5 }, { n: "4'", d: 0.5 }], ly: ["祝", "你"], e: accPick(4) },
      { c: "F", mel: [{ n: "3'", d: 1 }, { n: "1'", d: 1 }, { n: "2'", d: 1 }], ly: ["生", "日", "快"], e: accPattern34(4) },
      { c: "C", mel: [{ n: "1'", d: 3 }], ly: ["乐"], e: accPattern34(5) }
    ]
  },
  {
    id: "songbie",
    title: "送别",
    subtitle: "Dreaming of Home and Mother（旋律公有领域）",
    artist: "J.P.奥德威 曲 · 李叔同 填词",
    genre: "民谣",
    type: "弹唱",
    difficulty: 1,
    key: "C 大调",
    bpm: 84,
    timeSig: "4/4",
    desc: "弹唱版：主歌第一句「长亭外古道边，芳草碧连天」+ 53231323 分解伴奏 + 简谱对照。旋律公有领域，李叔同 1915 年填词。",
    chords: ["C", "F", "G7"],
    chordLine: "主歌和弦循环：| C  F | C  G7 | C  F | G7  C |（全曲反复，结尾落在 C）",
    style: "accomp",
    bars: [
      { c: "C",  mel: mel4("5", "3", "5", "1'"), ly: ["长", "亭", "外", "古"], e: accPattern(5) },
      { c: "F",  mel: [{ n: "6", d: 1 }, { n: "1'", d: 1 }, { n: "5", d: 2 }], ly: ["道", "边", "芳"], e: accPattern(4) },
      { c: "C",  mel: mel4("5", "1", "2", "3"), ly: ["草", "碧", "连", "天"], e: accPattern(5) },
      { c: "G7", mel: [{ n: "2", d: 1 }, { n: "1", d: 1 }, { n: "2", d: 2 }], e: accPattern(6) }
    ]
  },
  {
    id: "elise",
    title: "致爱丽丝（主题片段）",
    subtitle: "Für Elise (WoO 59)",
    artist: "贝多芬（1810，公有领域）",
    genre: "古典",
    type: "弹唱",
    difficulty: 2,
    key: "A 小调",
    bpm: 132,
    timeSig: "3/8",
    desc: "弹唱版式改编：3/8 拍分解伴奏 + 简谱旋律（#2、#5 变音记号标注）。器乐小品的分解和弦版，注意 2 弦 4/5 品的半音交替是全曲灵魂。",
    chords: ["Am", "E7"],
    style: "accomp",
    bars: [
      { c: "Am", mel: [{ n: "3", d: 0.5 }, { n: "#2", d: 0.5 }, { n: "3", d: 0.5 }], e: accPattern38(5) },
      { c: "Am", mel: [{ n: "#2", d: 0.5 }, { n: "3", d: 0.5 }, { n: "7", d: 0.5 }], e: accPattern38(5) },
      { c: "Am", mel: [{ n: "2", d: 0.5 }, { n: "1", d: 0.5 }, { n: "6", d: 0.5 }], e: accPattern38(5) },
      { c: "Am", mel: [{ n: "1", d: 0.5 }, { n: "3", d: 0.5 }, { n: "6", d: 0.5 }], e: accPattern38(5) },
      { c: "E7", mel: [{ n: "7", d: 0.5 }, { n: "3'", d: 0.5 }, { n: "#5", d: 0.5 }], e: accPattern38(6) },
      { c: "E7", mel: [{ n: "7", d: 0.5 }, { n: "1'", d: 0.5 }, { n: "3'", d: 0.5 }], e: accPattern38(6) },
      { c: "Am", mel: [{ n: "3", d: 0.5 }, { n: "#2", d: 0.5 }, { n: "3", d: 0.5 }], e: accPattern38(5) },
      { c: "Am", mel: [{ n: "#2", d: 0.5 }, { n: "3", d: 0.5 }, { n: "7", d: 0.5 }], e: accPattern38(5) }
    ]
  },
  {
    id: "twotigers",
    title: "两只老虎",
    subtitle: "Frère Jacques",
    artist: "法国传统轮唱曲",
    genre: "儿歌",
    type: "弹唱",
    difficulty: 1,
    key: "C 大调",
    bpm: 100,
    timeSig: "4/4",
    desc: "弹唱版：完整八小节旋律（1 2 3 1）+ C/G 和弦分解伴奏 + 逐字歌词。第五六小节的八分音符连贯进行（565431）是全曲唯一的节奏难点。",
    chords: ["C", "G"],
    style: "accomp",
    bars: [
      { c: "C", mel: mel4("1", "2", "3", "1"), ly: ["两", "只", "老", "虎"], e: accPattern(5) },
      { c: "C", mel: mel4("1", "2", "3", "1"), ly: ["两", "只", "老", "虎"], e: accPattern(5) },
      { c: "C", mel: [{ n: "3", d: 1 }, { n: "4", d: 1 }, { n: "5", d: 2 }], ly: ["跑", "得", "快"], e: accPattern(5) },
      { c: "C", mel: [{ n: "3", d: 1 }, { n: "4", d: 1 }, { n: "5", d: 2 }], ly: ["跑", "得", "快"], e: accPattern(5) },
      { c: "G", mel: [{ n: "5", d: 0.5 }, { n: "6", d: 0.5 }, { n: "5", d: 0.5 }, { n: "4", d: 0.5 }, { n: "3", d: 1 }, { n: "1", d: 1 }], ly: ["一", "只", "没", "有", "眼", "睛"], e: accPattern(6) },
      { c: "C", mel: [{ n: "5", d: 0.5 }, { n: "6", d: 0.5 }, { n: "5", d: 0.5 }, { n: "4", d: 0.5 }, { n: "3", d: 1 }, { n: "1", d: 1 }], ly: ["一", "只", "没", "有", "尾", "巴"], e: accPattern(5) },
      { c: "C", mel: [{ n: "1", d: 1 }, { n: "5,", d: 1 }, { n: "1", d: 2 }], ly: ["真", "奇", "怪"], e: accPattern(5) },
      { c: "C", mel: [{ n: "1", d: 1 }, { n: "5,", d: 1 }, { n: "1", d: 2 }], ly: ["真", "奇", "怪"], e: accPattern(5) }
    ]
  },
  {
    id: "bee",
    title: "小蜜蜂",
    subtitle: "Lightly Row（Hänschen klein）",
    artist: "德国传统民歌",
    genre: "儿歌",
    type: "弹唱",
    difficulty: 1,
    key: "C 大调",
    bpm: 108,
    timeSig: "4/4",
    desc: "弹唱版：分解和弦伴奏 + 简谱旋律 + 逐字歌词。前三小节是「上行音阶练习」，第七小节的 C-E-G 琶音是全曲的小亮点。",
    chords: ["C", "F", "G"],
    style: "accomp",
    bars: [
      { c: "C", mel: [{ n: "5", d: 1 }, { n: "3", d: 1 }, { n: "3", d: 2 }], ly: ["嗡", "嗡", "嗡"], e: accPattern(5) },
      { c: "F", mel: [{ n: "4", d: 1 }, { n: "2", d: 1 }, { n: "2", d: 2 }], ly: ["嗡", "嗡", "嗡"], e: accPattern(4) },
      { c: "C", mel: mel4("1", "2", "3", "4"), ly: ["大", "家", "一", "起"], e: accPattern(5) },
      { c: "G", mel: [{ n: "5", d: 1 }, { n: "5", d: 1 }, { n: "5", d: 2 }], ly: ["勤", "做", "工"], e: accPattern(6) },
      { c: "C", mel: [{ n: "5", d: 1 }, { n: "3", d: 1 }, { n: "3", d: 2 }], ly: ["来", "匆", "匆"], e: accPattern(5) },
      { c: "F", mel: [{ n: "4", d: 1 }, { n: "2", d: 1 }, { n: "2", d: 2 }], ly: ["来", "匆", "匆"], e: accPattern(4) },
      { c: "C", mel: mel4("1", "3", "5", "5"), ly: ["做", "工", "趣", "味"], e: accPattern(5) },
      { c: "C", mel: [{ n: "1", d: 4 }], ly: ["浓"], e: accPattern(5) }
    ]
  },
  {
    id: "silentnight",
    title: "平安夜",
    subtitle: "Silent Night",
    artist: "弗朗茨·格鲁伯（1818，公有领域）",
    genre: "圣咏",
    type: "弹唱",
    difficulty: 1,
    key: "G 大调",
    bpm: 72,
    timeSig: "3/4",
    desc: "弹唱版：三拍子分解伴奏 + 简谱旋律（附点节奏是三拍子的律动关键）+ 歌词。G 大调编配，全曲停留在第 0-4 品。",
    chords: ["G", "C", "D7"],
    style: "accomp",
    bars: [
      { c: "G",  mel: [{ n: "5,", d: 1.5 }, { n: "6,", d: 0.5 }, { n: "5,", d: 1 }], ly: ["平", "安", "夜"], e: accPattern34(6) },
      { c: "G",  mel: [{ n: "3,", d: 3 }], e: accPattern34(6) },
      { c: "G",  mel: [{ n: "5,", d: 1.5 }, { n: "6,", d: 0.5 }, { n: "5,", d: 1 }], ly: ["圣", "善", "夜"], e: accPattern34(6) },
      { c: "G",  mel: [{ n: "3,", d: 3 }], e: accPattern34(6) },
      { c: "C",  mel: [{ n: "6,", d: 1 }, { n: "6,", d: 1 }, { n: "1", d: 1 }], ly: ["万", "暗", "中"], e: accPattern34(4) },
      { c: "D7", mel: [{ n: "7,", d: 1 }, { n: "6,", d: 1 }, { n: "5,", d: 1 }], ly: ["光", "华", "射"], e: accPattern34(4) },
      { c: "G",  mel: [{ n: "5,", d: 1.5 }, { n: "6,", d: 0.5 }, { n: "5,", d: 1 }], ly: ["牧", "羊", "人"], e: accPattern34(6) },
      { c: "G",  mel: [{ n: "3,", d: 3 }], e: accPattern34(6) },
      { c: "C",  mel: [{ n: "6,", d: 1 }, { n: "6,", d: 1 }, { n: "1", d: 1 }], ly: ["在", "旷", "野"], e: accPattern34(4) },
      { c: "D7", mel: [{ n: "7,", d: 1 }, { n: "6,", d: 1 }, { n: "5,", d: 1 }], e: accPattern34(4) },
      { c: "C",  mel: [{ n: "6,", d: 1 }, { n: "6,", d: 1 }, { n: "1", d: 1 }], e: accPattern34(4) },
      { c: "G",  mel: [{ n: "7,", d: 1 }, { n: "6,", d: 1 }, { n: "1", d: 1 }], e: accPattern34(6) }
    ]
  },
  {
    id: "canon",
    title: "卡农（主题）",
    subtitle: "Canon in D · Pachelbel（移调为 G 大调）",
    artist: "约翰·帕赫贝尔（约 1690，公有领域）",
    genre: "古典",
    type: "弹唱",
    difficulty: 2,
    key: "G 大调",
    bpm: 64,
    timeSig: "4/4",
    desc: "弹唱版：每小节两个和弦（谱面上方左右各挂一个指位图），分解伴奏随和弦切换，简谱旋律对照。全曲就是一条下行音线在八个和弦上循环。",
    chords: ["G", "D", "Em", "Bm", "C"],
    chordLine: "和弦循环：G · D | Em · Bm | C · G | C · D（反复），即 1-5-6m-3m-4-1-4-5 级数进行",
    style: "accomp",
    bars: [
      { c: "G",  c2: "D",  mel: [{ n: "3", d: 2 }, { n: "2", d: 2 }],  e: accHalf(6).concat(accHalf(4)) },
      { c: "Em", c2: "Bm", mel: [{ n: "1", d: 2 }, { n: "7,", d: 2 }], e: accHalf(6).concat(accHalf(5)) },
      { c: "C",  c2: "G",  mel: [{ n: "6,", d: 2 }, { n: "5,", d: 2 }], e: accHalf(5).concat(accHalf(6)) },
      { c: "C",  c2: "D",  mel: [{ n: "6,", d: 2 }, { n: "7,", d: 2 }], e: accHalf(5).concat(accHalf(4)) },
      { c: "G",  c2: "D",  mel: [{ n: "1", d: 2 }, { n: "7,", d: 2 }], e: accHalf(6).concat(accHalf(4)) },
      { c: "Em", c2: "Bm", mel: [{ n: "6,", d: 2 }, { n: "5,", d: 2 }], e: accHalf(6).concat(accHalf(5)) },
      { c: "C",  c2: "G",  mel: [{ n: "4,", d: 2 }, { n: "3,", d: 2 }], e: accHalf(5).concat(accHalf(6)) },
      { c: "C",  c2: "D",  mel: [{ n: "4,", d: 2 }, { n: "2,", d: 2 }], e: accHalf(5).concat(accHalf(4)) }
    ]
  }

];

/* ============ 和弦图库（常用开放和弦）============ */
// frets: 从 6 弦(低音E)到 1 弦(高音E)，-1 = 不弹，0 = 空弦
const CHORDS = [
  { name: "C",  frets: [-1, 3, 2, 0, 1, 0] },
  { name: "G",  frets: [3, 2, 0, 0, 0, 3] },
  { name: "D",  frets: [-1, -1, 0, 2, 3, 2] },
  { name: "A",  frets: [-1, 0, 2, 2, 2, 0] },
  { name: "E",  frets: [0, 2, 2, 1, 0, 0] },
  { name: "F",  frets: [1, 3, 3, 2, 1, 1], barre: true },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
  { name: "Dm", frets: [-1, -1, 0, 2, 3, 1] },
  { name: "Bm", frets: [-1, 2, 4, 4, 3, 2], barre: true },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1] },
  { name: "C7", frets: [-1, 3, 2, 3, 1, 0] },
  { name: "D7", frets: [-1, -1, 0, 2, 1, 2] },
  { name: "A7", frets: [-1, 0, 2, 0, 2, 0] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0] },
  { name: "B7", frets: [-1, 2, 1, 2, 0, 2] }
];

/* ============ 全网六线谱资源导航（正版渠道）============ */
const RESOURCES = [
  {
    cat: "国际平台",
    items: [
      { name: "Ultimate Guitar", url: "https://www.ultimate-guitar.com", desc: "全球最大吉他谱库，数百万首用户上传的和弦谱、六线谱与官方谱。选谱时认准高评分、多评价的版本。", tags: ["和弦谱", "六线谱", "官方谱"] },
      { name: "Songsterr", url: "https://www.songsterr.com", desc: "以可播放的交互式六线谱著称，音色真实、可变速跟练，谱面质量普遍很高，练 Solo / Riff 神器。", tags: ["播放式", "跟练"] },
      { name: "911Tabs", url: "https://www.911tabs.com", desc: "谱子聚合搜索引擎：输入歌名，一次性汇总 Ultimate Guitar、Songsterr 等数百个站点的结果。", tags: ["搜索聚合"] },
      { name: "Chordify", url: "https://chordify.net", desc: "粘贴 YouTube / Spotify 歌曲链接，自动分析并生成和弦进行，适合快速抓弹唱伴奏框架。", tags: ["自动扒和弦"] },
      { name: "MuseScore", url: "https://musescore.com", desc: "大型社区乐谱平台，含大量用户分享的吉他六线谱，配合免费的 MuseScore 软件生态。", tags: ["社区乐谱", "多乐器"] }
    ]
  },
  {
    cat: "国内平台",
    items: [
      { name: "吉他社", url: "https://www.jitashe.com", desc: "国内老牌吉他谱站，免费谱量大，从入门指弹到流行弹唱谱都有，部分谱支持在线试听示范。", tags: ["免费谱", "在线试听"] },
      { name: "虫虫吉他", url: "https://www.gtp123.com", desc: "老牌 GTP 谱库，经典摇滚、民谣的 Guitar Pro 谱资源尤其丰富，进阶玩家必藏。", tags: ["GTP谱", "经典"] },
      { name: "弹琴吧", url: "https://www.tan8.com", desc: "主打动态谱与跟弹练习的互动平台，谱子按难度、风格分类，播放时进度条跟随谱面滚动。", tags: ["动态谱", "APP"] },
      { name: "吉他中国", url: "https://www.guitarchina.com", desc: "国内最大的吉他社区之一，谱子之外还有名家教程、设备评测，指弹资源尤其丰富。", tags: ["社区", "指弹"] },
      { name: "一起吉他", url: "https://www.yiqijita.com", desc: "吉他爱好者资源导航平台，聚合了国内外主流吉他谱站入口，适合作为浏览器书签。", tags: ["导航站"] }
    ]
  },
  {
    cat: "制谱软件",
    items: [
      { name: "TuxGuitar", url: "https://www.tuxguitar.com.ar", desc: "免费开源的 Guitar Pro 替代品，可打开 / 编辑 .gp3 ~ .gp5 等格式文件，支持多音轨播放与变速循环。", tags: ["免费开源", "GP格式"] },
      { name: "Guitar Pro", url: "https://www.guitar-pro.com", desc: "行业标准制谱 / 练谱软件，音色与谱面体验最佳（付费），网上下载的 GTP 谱基本都用它打开。", tags: ["行业标准", "付费"] },
      { name: "MuseScore（软件）", url: "https://musescore.org", desc: "免费开源制谱软件，对吉他六线谱（Tablature）支持完善，可导出 PDF / MIDI，社区曲库庞大。", tags: ["免费开源", "制谱"] }
    ]
  }
];
