# -*- coding: utf-8 -*-
"""
gen_hybrid.py — 生成混合谱式 js/data.js
- 古典曲（欢乐颂/致爱丽丝/卡农）：独奏谱（style=solo，从当前 data.js 原样保留）
- 民谣/儿歌/歌曲（小星星/生日快乐/两只老虎/小蜜蜂/送别/平安夜）：弹唱谱
  （style=accomp，和弦图 + × 分解节奏型 + 简谱旋律 + 逐字歌词）
送别/平安夜的弹唱版为完整曲长（16 / 23 小节），词曲对齐依据权威简谱。
输出: js/data.js (TAB_DATA + 辅助函数 + CHORDS + RESOURCES)
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "js", "data.js")

with io.open(DATA, "r", encoding="utf-8") as f:
    cur = f.read()

# ---------- 1. 从当前 data.js 提取独奏曲块与 CHORDS/RESOURCES ----------
def solo_block(sid):
    m = re.search(r'\n  \{\n    id: "%s",.*?\n  \}' % sid, cur, re.S)
    assert m, "未找到独奏曲块 %s" % sid
    block = m.group(0)
    assert 'style: "solo"' in block, "%s 不是独奏块" % sid
    return block

SOLO_IDS = ["ode", "elise", "canon"]
solo_blocks = {sid: solo_block(sid) for sid in SOLO_IDS}

idx = cur.find("/* ============ 和弦图库")
assert idx > 0, "当前 data.js 缺少 CHORDS 段"
CHORDS_RES = cur[idx:]

# ---------- 2. 简谱解析 ----------
def mel(spec):
    """'5 3:.5 5:.5 1':1.5' -> JS 数组文本 [{ n: "5", d: 1 }, ...]"""
    out = []
    for item in spec.split():
        parts = item.split(":")
        tok = parts[0]
        d = float(parts[1]) if len(parts) > 1 and parts[1] else 1.0
        out.append('{ n: "%s", d: %g }' % (tok, d))
    return "[" + ", ".join(out) + "]"

def js_arr(items):
    return "[" + ", ".join('"%s"' % t for t in items) + "]"

def acc_bar(c, bass, mel_spec, ly, sec=None, pickup=False):
    parts = ['c: "%s"' % c]
    if sec:
        parts.append('sec: "%s"' % sec)
    if pickup:
        parts.append("pickup: true")
    parts.append("mel: %s" % mel(mel_spec))
    if ly is not None:
        parts.append("ly: %s" % js_arr(ly))
    pat = "accPick(%d)" % bass if pickup else "accPattern34(%d)" % bass
    parts.append("e: %s" % pat)
    return "      { %s }" % ", ".join(parts)

def acc_bar44(c, bass, mel_spec, ly, sec=None):
    parts = ['c: "%s"' % c]
    if sec:
        parts.append('sec: "%s"' % sec)
    parts.append("mel: %s" % mel(mel_spec))
    if ly is not None:
        parts.append("ly: %s" % js_arr(ly))
    parts.append("e: accPattern(%d)" % bass)
    return "      { %s }" % ", ".join(parts)

# ---------- 3. 送别（弹唱完整版 16 小节，词曲对齐依《城南旧事》版简谱） ----------
songbie_bars = [
    acc_bar44("C",  5, "5 3 5 1'",                    ["长", "亭", "外", "古"], "一"),
    acc_bar44("F",  4, "6 1' 5:2",                    ["道", "边", "芳"]),
    acc_bar44("C",  5, "5, 1 2 3",                    ["草", "碧", "连", "天"]),
    acc_bar44("G7", 6, "2 1 2:2",                     ["", "", ""]),
    acc_bar44("C",  5, "5 3:.5 5:.5 1':1.5 7:.5",     ["晚", "风", "拂", "柳", "笛"], "二"),
    acc_bar44("F",  4, "6 1' 5:2",                    ["声", "残", ""]),
    acc_bar44("C",  5, "5 2:.5 3:.5 4:1.5 7,:.5",     ["夕", "阳", "山", "外", ""]),
    acc_bar44("G7", 6, "1:3 0:1",                     ["山"]),
    acc_bar44("F",  4, "6 1' 1':2",                   ["天", "之", "涯"], "三"),
    acc_bar44("G7", 6, "7 6 7:2",                     ["地", "之", "角"]),
    acc_bar44("C",  5, "6 7 1':2",                    ["知", "交", "半"]),
    acc_bar44("C",  5, "6 5 3:2",                     ["零", "落", ""]),
    acc_bar44("C",  5, "5 3:.5 5:.5 1':1.5 7:.5",     ["一", "壶", "浊", "酒", "尽"], "四"),
    acc_bar44("F",  4, "6 1' 5:2",                    ["余", "欢", ""]),
    acc_bar44("G7", 6, "5 2:.5 3:.5 4:1.5 7,:.5",     ["今", "宵", "别", "梦", ""]),
    acc_bar44("C",  5, "1:4",                         ["寒"]),
]

SONGBIE = """  {
    id: "songbie",
    title: "送别",
    subtitle: "Dreaming of Home and Mother（旋律公有领域）",
    artist: "J.P.奥德威 曲 · 李叔同 填词",
    genre: "民谣",
    type: "弹唱",
    key: "C 大调",
    bpm: 84,
    timeSig: "4/4",
    difficulty: 1,
    chords: ["C", "F", "G7"],
    style: "accomp",
    desc: "弹唱完整版：四段十六小节全部编入——长亭外、晚风拂柳、天之涯、一壶浊酒，上方和弦指位图 + 53231323 分解节奏型，下方简谱旋律与逐字歌词对照。照谱弹伴奏、跟简谱开口唱，一首完整的《送别》就出来了。",
    bars: [
%s
    ]
  }""" % ",\n".join(songbie_bars)

# ---------- 4. 平安夜（弹唱完整版 23 小节，词曲对齐依标准简谱） ----------
silent_bars = [
    acc_bar("G",  6, "5:1.5 6:.5 5",        ["平", "安", "夜"]),
    acc_bar("G",  6, "3:3",                 None),
    acc_bar("G",  6, "5:1.5 6:.5 5",        ["圣", "善", "夜"]),
    acc_bar("G",  6, "3:3",                 None),
    acc_bar("D7", 4, "2':2 2'",             ["万", "暗"]),
    acc_bar("D7", 4, "7:3",                 ["中"]),
    acc_bar("G",  6, "1':2 1'",             ["光", "华"]),
    acc_bar("G",  6, "5:3",                 ["射"]),
    acc_bar("C",  5, "6:2 6",               ["照", "着"]),
    acc_bar("D7", 4, "1':1.5 7:.5 6",       ["圣", "母", "也"]),
    acc_bar("G",  6, "5:1.5 6:.5 5",        ["照", "着", "圣"]),
    acc_bar("G",  6, "3:3",                 ["婴"]),
    acc_bar("C",  5, "6:2 6",               ["多", "少"]),
    acc_bar("D7", 4, "1':1.5 7:.5 6",       ["慈", "祥", "也"]),
    acc_bar("G",  6, "5:1.5 6:.5 5",        ["多", "少", "天"]),
    acc_bar("G",  6, "3:3",                 ["真"]),
    acc_bar("D7", 4, "2':2 2'",             ["静", "享"]),
    acc_bar("D7", 4, "4':1.5 2':.5 7",      ["天", "赐", "安"]),
    acc_bar("G",  6, "1':3",                ["眠"]),
    acc_bar("G",  6, "3':3",                None),
    acc_bar("G",  6, "1' 5 3",              ["静", "享", ""]),
    acc_bar("D7", 4, "5:1.5 4:.5 2",        ["天", "赐", "安"]),
    acc_bar("G",  6, "1:3",                 ["眠"]),
]

SILENTNIGHT = """  {
    id: "silentnight",
    title: "平安夜",
    subtitle: "Silent Night",
    artist: "弗朗茨·格鲁伯（1818，公有领域）",
    genre: "圣咏",
    type: "弹唱",
    key: "G 大调",
    bpm: 72,
    timeSig: "3/4",
    difficulty: 1,
    chords: ["G", "C", "D7"],
    style: "accomp",
    desc: "弹唱完整版：一段二十三小节全曲——平安夜、万暗中光华射、照着圣母也照着圣婴、多少慈祥也多少天真、静享天赐安眠全部编入，三拍子 532313 分解伴奏 + 简谱旋律（附点是三拍子的律动关键）+ 逐字歌词。",
    bars: [
%s
    ]
  }""" % ",\n".join(silent_bars)

# ---------- 5. 其余四首弹唱曲（自弹唱版 v2 恢复，曲长完整） ----------
TWINKLE = """  {
    id: "twinkle",
    title: "小星星",
    subtitle: "Twinkle Twinkle Little Star",
    artist: "英格兰传统童谣",
    genre: "儿歌",
    type: "弹唱",
    key: "C 大调",
    bpm: 96,
    timeSig: "4/4",
    desc: "弹唱完整版：上方挂和弦指位图，谱面为 × 记号的 53231323 分解和弦节奏型，下方简谱旋律 + 歌词对照，含前奏、间奏与尾声。照谱弹伴奏、跟简谱开口唱，就能自弹自唱一首完整的《小星星》。",
    chords: ["C", "F", "G"],
    difficulty: 1,
    style: "accomp",
    bars: [
      { c: "C", sec: "前奏", e: accPattern(5), mel: rest4() },
      { c: "C", e: accPattern(5), mel: rest4() },
      { c: "C", sec: "主歌", mel: mel4("1", "1", "5", "5"), ly: ["一", "闪", "一", "闪"], e: accPattern(5) },
      { c: "C", mel: mel3("6", "6", "5"), ly: ["亮", "晶", "晶"], e: accPattern(5) },
      { c: "F", mel: mel4("4", "4", "3", "3"), ly: ["满", "天", "都", "是"], e: accPattern(4) },
      { c: "C", mel: mel3("2", "2", "1"), ly: ["小", "星", "星"], e: accPattern(5) },
      { c: "C", sec: "间奏", mel: mel4("5", "5", "4", "4"), e: accPattern(5) },
      { c: "F", mel: mel3("3", "3", "2"), e: accPattern(4) },
      { c: "G", mel: mel4("5", "5", "4", "4"), e: accPattern(6) },
      { c: "G", mel: mel3("3", "3", "2"), e: accPattern(6) },
      { c: "C", sec: "再现", mel: mel4("1", "1", "5", "5"), ly: ["一", "闪", "一", "闪"], e: accPattern(5) },
      { c: "C", mel: mel3("6", "6", "5"), ly: ["亮", "晶", "晶"], e: accPattern(5) },
      { c: "F", mel: mel4("4", "4", "3", "3"), ly: ["满", "天", "都", "是"], e: accPattern(4) },
      { c: "C", mel: mel3("2", "2", "1"), ly: ["小", "星", "星"], e: accPattern(5) },
      { c: "C", sec: "尾声", mel: [{ n: "1", d: 4 }], e: [ { n: [[5,3],[4,2],[3,0],[2,1],[1,0]], d: 4 } ] }
    ]
  }"""

BIRTHDAY = """  {
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
  }"""

TWOTIGERS = """  {
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
  }"""

BEE = """  {
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
  }"""

# ---------- 6. 组装 ----------
HEADER = '''/* =========================================================
 * 六线谱库 · 曲谱数据（均为公有领域曲目，由本站自行编配）
 * 混合谱式：古典曲 = 独奏谱（style:"solo"，旋律+低音双声部）
 *           民谣/儿歌 = 弹唱谱（style:"accomp"，和弦分解 + 简谱旋律 + 歌词）
 * 独奏事件格式: { n: [[弦, 品], ...], d: 拍数 }
 * 弹唱小节格式: { c, mel: [{n:"简谱",d:拍数}], ly:["逐字歌词"], e:[×节奏型事件] }
 *   简谱记号: 1~7 = 唱名, ' = 高八度, , = 低八度, 0 = 休止, # = 升半音
 * ========================================================= */

/* ---- 弹唱谱辅助：分解节奏型与简谱行 ---- */
// 4/4 分解 53231323（b = 低音弦号：C 用 5、F 用 4、G/G7 用 6）
function accPattern(b) {
  return [b, 3, 2, 3, 1, 3, 2, 3].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}
// 3/4 分解 532313
function accPattern34(b) {
  return [b, 3, 2, 3, 1, 3].map(function (st) {
    return { n: [[st, "x"]], d: 0.5 };
  });
}
// 弱起小节：低音两个八分
function accPick(b) {
  return [{ n: [[b, "x"]], d: 0.5 }, { n: [[b, "x"]], d: 0.5 }];
}
// 简谱辅助：4 个四分 / 3 个四分 + 1 个二分 / 4 拍休止
function mel4(a, b, c, d) { return [{ n: a, d: 1 }, { n: b, d: 1 }, { n: c, d: 1 }, { n: d, d: 1 }]; }
function mel3(a, b, c) { return [{ n: a, d: 1 }, { n: b, d: 1 }, { n: c, d: 2 }]; }
function rest4() { return [{ n: "0", d: 1 }, { n: "0", d: 1 }, { n: "0", d: 1 }, { n: "0", d: 1 }]; }

const TAB_DATA = [
'''

parts = [TWINKLE, solo_blocks["ode"], BIRTHDAY, SONGBIE, solo_blocks["elise"],
         TWOTIGERS, BEE, SILENTNIGHT, solo_blocks["canon"]]

out = HEADER + ",\n".join(parts) + "\n];\n\n" + CHORDS_RES
with io.open(DATA, "w", encoding="utf-8") as f:
    f.write(out)

print("data.js 生成完毕：9 首（独奏 3 + 弹唱 6）")
for sid in ["twinkle", "ode", "birthday", "songbie", "elise", "twotigers", "bee", "silentnight", "canon"]:
    style = "独奏" if sid in SOLO_IDS else "弹唱"
    n = out.count('id: "%s"' % sid)
    print("  %-12s %s" % (sid, style))
