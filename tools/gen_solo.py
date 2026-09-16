# -*- coding: utf-8 -*-
"""
gen_solo.py — 生成古典吉他独奏版 js/data.js
每首曲子 = 完整旋律 + 低音声部（小节首拍根音、4/4 第三拍和声内音/双和弦根音）
输出: js/data.js (TAB_DATA + CHORDS + RESOURCES)
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------- 指板位置表：简谱字符 -> [弦, 品] ----------
# 1弦=E4 2弦=B3 3弦=G3 4弦=D3 5弦=A2 6弦=E2
C_HIGH = {  # C 大调 高把位旋律（C4~A4）
    "1": (2, 1), "2": (2, 3), "3": (1, 0), "4": (1, 1), "5": (1, 3), "6": (1, 5), "7": (1, 7),
    "5,": (3, 0), "6,": (3, 2), "7,": (2, 0),
    "1'": (1, 8), "2'": (1, 10), "3'": (1, 12),
}
C_MED = {  # C 大调 中低把位（生日快乐）
    "5": (3, 0), "6": (3, 2), "7": (2, 0),
    "1'": (2, 1), "2'": (2, 3), "3'": (1, 0), "4'": (1, 1), "5'": (1, 3),
}
SONGBIE = {  # 送别专用（1=C4 基准）
    "5": (1, 3), "3": (1, 0), "1'": (1, 8), "7": (1, 7), "6": (1, 5),
    "5,": (3, 0), "1": (2, 1), "2": (2, 3), "4,": (1, 1), "7,": (2, 0),
}
BEE = {  # 小蜜蜂 低把位
    "1": (5, 3), "2": (4, 0), "3": (4, 2), "4": (4, 3), "5": (3, 0),
}
G_LOW = {  # G 大调 低把位（平安夜）
    "5,": (4, 0), "6,": (4, 2), "7,": (4, 4), "1": (3, 0), "2": (3, 2), "3": (2, 0),
    "4": (2, 1), "5": (2, 3), "1,": (6, 3), "2,": (4, 0), "3,": (4, 2), "4,": (4, 3), "6": (1, 0),
}
ELISE = {  # 致爱丽丝（C 记谱 a 小调）
    "3": (1, 0), "#2": (1, 1), "2": (2, 3), "1": (2, 1), "6": (3, 2), "7,": (2, 0), "#5": (1, 4),
}
CANON = {  # 卡农（G 大调）
    "3": (1, 7), "2": (1, 5), "1": (1, 3), "7,": (1, 2), "6,": (1, 0),
    "5,": (2, 3), "4,": (2, 1), "3,": (2, 0), "2,": (3, 2),
}

# 和弦 -> (根音, 五音)
BASS = {
    "C": ((5, 3), (3, 0)), "G": ((6, 3), (4, 0)), "G7": ((6, 3), (4, 0)),
    "F": ((6, 1), (5, 3)), "Am": ((5, 0), (4, 2)), "E7": ((6, 0), (5, 2)),
    "D7": ((4, 0), (5, 0)), "Em": ((6, 0), (5, 2)), "Bm": ((5, 2), (4, 4)),
    "D": ((4, 0), (5, 0)),
}
# 终止和弦把位（6弦->1弦）
ENDV = {
    "C": [[5, 3], [3, 0], [2, 1], [1, 0]],
    "G": [[6, 3], [4, 0], [3, 0], [2, 0], [1, 3]],
    "Am": [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0]],
    "F": [[6, 1], [5, 3], [4, 3], [3, 2], [2, 1], [1, 1]],
    "E7": [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]],
}

BEATS = {"4/4": 4.0, "3/4": 3.0, "3/8": 1.5}


def mel(spec):
    """'1 1 5 5' / '3 .5' 形式: 每个音 = token[:d]，d 缺省 1，支持 0.5/1.5/2/3/4"""
    out = []
    for item in spec.split():
        parts = item.split(":")
        tok = parts[0]
        d = float(parts[1]) if len(parts) > 1 and parts[1] else 1.0
        out.append((tok, d))
    return out


def build_bar(tab, c, c2, m, beats, pickup=False, motion=False, end_chord=None):
    """把小节编配为事件: 低音并入首拍, 4/4 第三拍加和声内音, 双和弦(c2)后半小节换低音"""
    if end_chord:
        d = sum(d for _, d in m)
        return [{"n": [list(x) for x in ENDV[end_chord]], "d": d}]
    events = []
    t = 0.0
    for i, (tok, d) in enumerate(m):
        n = []
        if i == 0 and c:
            root = list(BASS[c][0])
            if tok == "0" or tab[tok] != root:
                n.append(root)
        if tok != "0":
            n.append(list(tab[tok]))
        events.append({"n": n, "d": d})
        t += d
    if beats == 4 and c2:
        # 双和弦: 后半小节低音换 c2 根音（变奏再加五音）
        tt = 0.0
        for ev in events:
            if abs(tt - 2.0) < 1e-6:
                tones = [BASS[c2][0]] + ([BASS[c2][1]] if motion else [])
                for tone in tones:
                    if list(tone) not in ev["n"]:
                        ev["n"].insert(0, list(tone))
            tt += ev["d"]
    elif beats == 4 and not pickup:
        # 普通小节: 第三拍起的事件(>=1拍)加五音
        tt = 0.0
        for ev in events:
            if abs(tt - 2.0) < 1e-6 and ev["d"] >= 1.0:
                fifth = list(BASS[c][1])
                if fifth not in ev["n"]:
                    ev["n"].insert(0, fifth)
            tt += ev["d"]
    return events


def song(id, title, subtitle, artist, genre, key, bpm, timeSig, difficulty, chords, desc, tab, bars_spec):
    beats = BEATS[timeSig]
    bars = []
    for spec in bars_spec:
        c = spec.get("c")
        evs = build_bar(tab, c, spec.get("c2"), spec["mel"], beats,
                        pickup=spec.get("pickup", False), motion=spec.get("motion", False),
                        end_chord=spec.get("end"))
        bar = {"c": c, "e": evs}
        for k in ("c2", "sec", "pickup", "motion"):
            if spec.get(k):
                bar[k] = spec[k]
        # 拍数校验
        s = sum(e["d"] for e in evs)
        if not spec.get("pickup") and spec.get("end"):
            assert s <= beats, "%s 末小节拍数 %s > %s" % (id, s, beats)
        elif not spec.get("pickup"):
            assert s == beats, "%s 小节%d 拍数 %s != %s" % (id, len(bars) + 1, s, beats)
        bars.append(bar)
    return {
        "id": id, "title": title, "subtitle": subtitle, "artist": artist, "genre": genre,
        "type": "独奏", "key": key, "bpm": bpm, "timeSig": timeSig, "difficulty": difficulty,
        "chords": chords, "style": "solo", "desc": desc, "bars": bars,
    }


def m(specs):
    """['1 1 5 5', 'F'] -> dict; 支持 (mel, c) / (mel, c, c2) / dict"""
    if isinstance(specs, dict):
        d = dict(specs)
        d["mel"] = mel(d["mel"])
        return d
    mel_spec, c = specs[0], specs[1]
    d = {"mel": mel(mel_spec), "c": c}
    if len(specs) > 2:
        d["c2"] = specs[2]
    return d


DATA = []

# ============ 1. 小星星 ============
DATA.append(song(
    "twinkle", "小星星", "Twinkle Twinkle Little Star", "英格兰传统童谣", "儿歌",
    "C 大调", 96, "4/4", 1, ["C", "F", "G7"],
    "古典吉他独奏版：完整十二小节主题 + 终止和弦，旋律声部与低音声部逐小节编配——低音落在每小节第一拍、第三拍补和声内音，不用伴奏也能弹出完整的《小星星》。",
    C_HIGH,
    [
        m(("1 1 5 5", "C")), m(("6 6 5:2", "F")), m(("4 4 3 3", "F")), m(("2 2 1:2", "C")),
        m(("5 5 4 4", "C")), m(("3 3 2:2", "G7")), m(("5 5 4 4", "C")), m(("3 3 2:2", "G7")),
        m(("1 1 5 5", "C")), m(("6 6 5:2", "F")), m(("4 4 3 3", "F")), m(("2 2 1:2", "C")),
        m(({"mel": "1:4", "c": "C", "end": "C"})),
    ],
))

# ============ 2. 欢乐颂（完整 16 小节主题）============
DATA.append(song(
    "ode", "欢乐颂", "Ode to Joy", "贝多芬 · 《第九交响曲》", "古典",
    "C 大调", 108, "4/4", 1, ["C", "G", "G7", "F"],
    "古典吉他独奏版：完整十六小节主题——中段『2 34 3』级进推进、低音 sol 收束后再现主题，旋律+低音双声部，贝多芬第九交响曲第四乐章一次弹完整。",
    C_HIGH,
    [
        m(("3 3 4 5", "C")), m(("5 4 3 2", "G")), m(("1 1 2 3", "C")), m(("3:1.5 2:.5 2:2", "G")),
        m(("3 3 4 5", "C")), m(("5 4 3 2", "G")), m(("1 1 2 3", "C")), m(("2:1.5 1:.5 1:2", "G7")),
        m(("2 2 3 1", "C")), m(("2 3:.5 4:.5 3 1", "F")), m(("2 3:.5 4:.5 3 2", "G7")), m(("1 2 5,:2", "G7")),
        m(("3 3 4 5", "C")), m(("5 4 3 2", "G")), m(("1 1 2 3", "C")), m(("2:1.5 1:.5 1:2", "C")),
    ],
))

# ============ 3. 生日快乐 ============
DATA.append(song(
    "birthday", "生日快乐", "Happy Birthday to You", "Hill 姐妹（1893，已进入公有领域）", "歌曲",
    "C 大调", 90, "3/4", 1, ["C", "G", "F"],
    "古典吉他独奏版：三拍子完整一曲，弱起「祝你」低音跟随，每小节第一拍落根音，全曲停在开放把位，生日当天就能上手弹唱助兴。",
    C_MED,
    [
        m(({"mel": "5:.5 5:.5", "c": "G", "pickup": True})),
        m(("6 5 1'", "G")), m(("7:3", "G")),
        m(({"mel": "5:.5 5:.5", "c": "G", "pickup": True})),
        m(("6 5 2'", "G")), m(("1':3", "C")),
        m(({"mel": "5':.5 5':.5", "c": "C", "pickup": True})),
        m(("5' 3' 1'", "C")), m(("7 6:2", "G")),
        m(({"mel": "4':.5 4':.5", "c": "F", "pickup": True})),
        m(({"mel": "3' 1' 2'", "c": "F"})), m(({"mel": "1':3", "c": "C", "end": "C"})),
    ],
))

# ============ 4. 送别（完整四段 16 小节）============
DATA.append(song(
    "songbie", "送别", "Dreaming of Home and Mother（旋律公有领域）", "J.P.奥德威 曲 · 李叔同 填词", "民谣",
    "C 大调", 84, "4/4", 2, ["C", "F", "G7"],
    "古典吉他独奏版：完整四段十六小节——长亭外、晚风拂柳、天之涯、一壶浊酒全部编入，旋律+低音双声部，李叔同 1915 年填词的经典一次弹完整。",
    SONGBIE,
    [
        m(("5 3 5 1'", "C")), m(("6 1' 5:2", "F")), m(("5, 1 2 3", "C")), m(("2 1 2:2", "G7")),
        m(("5 3:.5 5:.5 1':1.5 7:.5", "C")), m(("6 1' 5:2", "F")), m(("5 2:.5 3:.5 4,:1.5 7,:.5", "C")), m(("1:3 0:1", "G7")),
        m(("6 1' 1':2", "F")), m(("7 6 7:2", "G7")), m(("6 7 1':2", "C")), m(("6 5 3:2", "C")),
        m(("5 3:.5 5:.5 1':1.5 7:.5", "C")), m(("6 1' 5:2", "F")), m(("5 2:.5 3:.5 4,:1.5 7,:.5", "G7")),
        m(({"mel": "1:4", "c": "C", "end": "C"})),
    ],
))

# ============ 5. 致爱丽丝（完整 A 段 16 小节）============
DATA.append(song(
    "elise", "致爱丽丝", "Für Elise (WoO 59)", "贝多芬（1810，公有领域）", "古典",
    "A 小调", 132, "3/8", 2, ["Am", "E7"],
    "古典吉他独奏版：完整 A 段十六小节，3/8 拍，#2、#5 变音记号标注，空弦与开放把位为主——低音 Am/E7 交替铺底，全曲灵魂的半音交替一气呵成。",
    ELISE,
    [
        m(("3:.5 #2:.5 3:.5", "Am")), m(("#2:.5 3:.5 7,:.5", "Am")), m(("2:.5 1:.5 6:.5", "Am")), m(("1:.5 3:.5 6:.5", "Am")),
        m(("7,:.5 3:.5 #5:.5", "E7")), m(("7,:.5 1:.5 3:.5", "E7")),
        m(("3:.5 #2:.5 3:.5", "Am")), m(("#2:.5 3:.5 7,:.5", "Am")), m(("2:.5 1:.5 6:.5", "Am")), m(("1:.5 3:.5 6:.5", "Am")),
        m(("7,:.5 3:.5 #5:.5", "E7")), m(("7,:.5 1:.5 3:.5", "E7")),
        m(("3:.5 #2:.5 3:.5", "Am")), m(("#2:.5 3:.5 7,:.5", "Am")), m(("2:.5 1:.5 6:.5", "Am")),
        m(({"mel": "6:1.5", "c": "Am", "end": "Am"})),
    ],
))

# ============ 6. 两只老虎 ============
DATA.append(song(
    "twotigers", "两只老虎", "Frère Jacques", "法国传统轮唱曲", "儿歌",
    "C 大调", 100, "4/4", 1, ["C", "G7"],
    "古典吉他独奏版：完整八小节 + 终止和弦，C/G7 低音交替，第五六小节的连续八分音符（565431）是全曲唯一的节奏难点。",
    C_HIGH,
    [
        m(("1 2 3 1", "C")), m(("1 2 3 1", "C")), m(("3 4 5:2", "C")), m(("3 4 5:2", "C")),
        m(("5:.5 6:.5 5:.5 4:.5 3 1", "G")), m(("5:.5 6:.5 5:.5 4:.5 3 1", "C")),
        m(("1 5, 1:2", "G7")), m(({"mel": "1 5, 1:2", "c": "C", "end": "C"})),
    ],
))

# ============ 7. 小蜜蜂 ============
DATA.append(song(
    "bee", "小蜜蜂", "Lightly Row（Hänschen klein）", "德国传统民歌", "儿歌",
    "C 大调", 108, "4/4", 1, ["C", "G7"],
    "古典吉他独奏版：完整八小节，低把位 C/G7 交替，前三小节上行音阶 + 第七小节 C-E-G 琶音，最适合作为独奏第一首练习曲。",
    BEE,
    [
        m(("5 3 3:2", "C")), m(("4 2 2:2", "G7")), m(("1 2 3 4", "C")), m(("5 5 5:2", "G7")),
        m(("5 3 3:2", "C")), m(("4 2 2:2", "G7")), m(("1 3 5 5", "C")),
        m(({"mel": "1:4", "c": "C", "end": "C"})),
    ],
))

# ============ 8. 平安夜（完整 17 小节）============
DATA.append(song(
    "silentnight", "平安夜", "Silent Night", "弗朗茨·格鲁伯（1818，公有领域）", "圣咏",
    "G 大调", 72, "3/4", 2, ["G", "C", "D7"],
    "古典吉他独奏版：G 大调完整编配十七小节——平安夜、圣善夜、万暗中、照着圣母、多少慈祥、静享天赐安眠全部编入，附点节奏是三拍子的律动关键。",
    G_LOW,
    [
        m(("5,:1.5 6,:.5 5:", "G")), m(("3,:3", "G")), m(("5,:1.5 6,:.5 5:", "G")), m(("3,:3", "G")),
        m(("2 2 7,", "D7")), m(("3 3 1", "G")),
        m(("6, 6, 1:.5 7,:.5", "C")), m(("5,:1.5 6,:.5 5:", "G")), m(("3,:3", "G")),
        m(("6, 6, 1:.5 7,:.5", "C")), m(("5,:1.5 6,:.5 5:", "G")), m(("3,:3", "G")),
        m(("2:1.5 2:.5 4", "D7")), m(("4:1.5 2 7,:.5", "D7")), m(("1:1.5 3:1.5", "G")), m(("5,:1.5 4 3:.5", "G")),
        m(({"mel": "1:3", "c": "G", "end": "G"})),
    ],
))

# ============ 9. 卡农（主题 + 变奏 16 小节）============
_canon_prog = [
    ("3:2 2:2", "G", "D"), ("1:2 7,:2", "Em", "Bm"), ("6,:2 5,:2", "C", "G"), ("6,:2 7,:2", "C", "D"),
    ("1:2 7,:2", "G", "D"), ("6,:2 5,:2", "Em", "Bm"), ("4,:2 3,:2", "C", "G"), ("4,:2 2,:2", "C", "D"),
]
_canon_bars = []
for i, (mm, c, c2) in enumerate(_canon_prog):
    _canon_bars.append(m({"mel": mm, "c": c, "c2": c2, "sec": "主题" if i == 0 else None}))
for i, (mm, c, c2) in enumerate(_canon_prog):
    _canon_bars.append(m({"mel": mm, "c": c, "c2": c2, "motion": True, "sec": "变奏" if i == 0 else None}))
DATA.append(song(
    "canon", "卡农（主题与变奏）", "Canon in D · Pachelbel（移调为 G 大调）", "约翰·帕赫贝尔（约 1690，公有领域）", "古典",
    "G 大调", 64, "4/4", 2, ["G", "D", "Em", "Bm", "C"],
    "古典吉他独奏版：主题八小节 + 变奏八小节。每小节两个和弦（G-D、Em-Bm、C-G、C-D），低音随和弦在半小节处切换，变奏段低音加厚呈五度双音，一条下行音线在八个和弦上循环。",
    CANON,
    _canon_bars,
))

# ---------- 生成 JS ----------
def js_song(s):
    bars = []
    for b in s["bars"]:
        parts = []
        if b.get("c"):
            parts.append("c: %s" % js_str(b["c"]))
        if b.get("c2"):
            parts.append("c2: %s" % js_str(b["c2"]))
        if b.get("sec"):
            parts.append("sec: %s" % js_str(b["sec"]))
        if b.get("pickup"):
            parts.append("pickup: true")
        evs = ", ".join("{ n: [%s], d: %s }" % (
            ", ".join("[%d,%d]" % (n[0], n[1]) for n in e["n"]),
            ("%g" % e["d"]),
        ) for e in b["e"])
        parts.append("e: [%s]" % evs)
        bars.append("      { %s }" % ", ".join(parts))
    return (
        "  {\n"
        "    id: %s,\n    title: %s,\n    subtitle: %s,\n    artist: %s,\n"
        "    genre: %s,\n    type: %s,\n    key: %s,\n    bpm: %d,\n    timeSig: %s,\n"
        "    difficulty: %d,\n    chords: [%s],\n    style: \"solo\",\n    desc: %s,\n"
        "    bars: [\n%s\n    ]\n  }" % (
            js_str(s["id"]), js_str(s["title"]), js_str(s["subtitle"]), js_str(s["artist"]),
            js_str(s["genre"]), js_str(s["type"]), js_str(s["key"]), s["bpm"], js_str(s["timeSig"]),
            s["difficulty"], ", ".join(js_str(c) for c in s["chords"]), js_str(s["desc"]),
            ",\n".join(bars),
        )
    )


def js_str(t):
    return '"%s"' % str(t).replace("\\", "\\\\").replace('"', '\\"')


CHORDS_JS = '''/* ============ 和弦图库（常用开放和弦）============ */
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
];'''

HEADER = '''/* =========================================================
 * 六线谱库 · 曲谱数据（均为公有领域曲目，由本站自行编配）
 * 古典吉他独奏版：旋律 + 低音双声部
 * 事件格式: { n: [[弦(1高音E~6低音E), 品], ...], d: 拍数 }
 *   d: 0.5 = 八分音符, 1 = 四分, 1.5 = 附点四分, 2 = 二分, 3 = 附点二分, 4 = 全音符
 * 小节格式: { c: 和弦, c2: 半小节第二和弦(可选), sec: 段落(可选), pickup: 弱起(可选), e: [事件...] }
 * ========================================================= */

const TAB_DATA = [
'''

# RESOURCES 段从旧 data.js 原样保留
with io.open(os.path.join(ROOT, "js", "data.js"), "r", encoding="utf-8") as f:
    old = f.read()
idx = old.find("/* ============ 全网六线谱资源导航")
assert idx > 0, "旧 data.js 缺少 RESOURCES 段"
RESOURCES_JS = old[idx:]

out = HEADER + ",\n".join(js_song(s) for s in DATA) + "\n];\n\n" + CHORDS_JS + "\n\n" + RESOURCES_JS
with io.open(os.path.join(ROOT, "js", "data.js"), "w", encoding="utf-8") as f:
    f.write(out)

print("data.js 生成完毕：%d 首独奏曲" % len(DATA))
for s in DATA:
    print("  %-12s %2d 小节 %s %s" % (s["id"], len(s["bars"]), s["timeSig"], "/".join(c for c in s["chords"])))
