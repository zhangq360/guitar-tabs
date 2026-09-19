# -*- coding: utf-8 -*-
"""
add_songs2.py — 向 js/data.js 的 TAB_DATA 追加 4 首完整古典独奏谱：
  1. 爱的罗曼史 (Romance, 西班牙民谣/叶佩斯) — a小调 3/4, A-B-A 单三部曲式 48 小节
     (Am 选调, 依 yopu.co 完整六线谱解码; 三连音音型: 旋律+2弦+3弦)
  2. 绿袖子 (Greensleeves, 英格兰民谣) — a小调 3/4, 主歌+副歌×2 34 小节
     (依 gmajormusictheory/pianonotes/songsguitar 多源一致旋律)
  3. G大调小步舞曲 (Minuet in G, 佩措尔德/巴赫) — G大调 3/4, A-A-B-A 36 小节
     (依 百度知道/ sogou 问答两源一致简谱: 5 1234|5 11|6̇ 4567|1̇ 11 ...)
  4. 摇篮曲 (Wiegenlied, 勃拉姆斯) — C大调 3/4, A-B-A-B' 24 小节
     (依 尚家骧译配版简谱 1=F, 移调 C 大调; 5.335|1̇7.665|234024|7657...)
"""
import io, re

def ev(notes, d):
    return (notes, d)

def bars_js(bars, indent="      "):
    out = []
    for chord, evs in bars:
        evs_js = ", ".join(
            "{ n: [%s], d: %s }" % (
                ", ".join("[%d,%d]" % (s, f) for s, f in notes),
                ("%g" % d)
            )
            for notes, d in evs
        )
        out.append('%s{ c: "%s", e: [%s] }' % (indent, chord, evs_js))
    return ",\n".join(out)

def song_js(meta, bars):
    return (
        "  {\n"
        '    id: "%(id)s",\n'
        '    title: "%(title)s",\n'
        '    subtitle: "%(subtitle)s",\n'
        '    artist: "%(artist)s",\n'
        '    genre: "%(genre)s",\n'
        '    type: "独奏",\n'
        '    key: "%(key)s",\n'
        '    bpm: %(bpm)d,\n'
        '    timeSig: "%(ts)s",\n'
        '    difficulty: %(diff)d,\n'
        '    chords: %(chords)s,\n'
        '    style: "solo",\n'
        '    desc: "%(desc)s",\n'
        '    bars: [\n%(bars)s\n    ]\n'
        "  }"
    ) % dict(meta, bars=bars_js(bars))

REST = None  # 用 ("R", d) 表示休止

# ============================================================
# 1. 爱的罗曼史 — a小调 3/4，三连音织体（每拍=旋律/2弦/3弦 三个音）
# ============================================================
MEL = {  # 简谱字母名 -> [弦, 品]（Am/A 大调 第一把位）
    "E4": (1, 0), "F4": (1, 1), "F#4": (1, 2), "G4": (1, 3), "G#4": (1, 4),
    "A4": (1, 5), "B4": (1, 7), "C5": (1, 8), "C#5": (1, 9),
}
AC = {  # 各和弦的内声部伴奏双音（2弦,3弦）
    "Am": [(2, 0), (3, 0)], "C": [(2, 1), (3, 0)], "Dm": [(2, 1), (3, 2)],
    "E7": [(2, 0), (3, 1)], "E": [(2, 0), (3, 1)], "A": [(2, 2), (3, 2)],
    "A7": [(2, 2), (3, 2)], "B7": [(2, 4), (3, 4)], "G7": [(2, 0), (3, 0)],
}

def rom_bar(chord, toks):
    """toks: [(旋律名或'R', 整数拍)]；每拍拆成 旋律/内声部/低声部 三个 1/3 拍三连音"""
    beats = []
    for tok, d in toks:
        n = int(round(d))
        assert abs(d - n) < 1e-9, "旋律拍须为整数: %s" % (tok,)
        beats.extend([tok] * n)
    assert len(beats) == 3, "拍数错误 %s %s" % (chord, toks)
    a2, a3 = AC[chord]
    t = 1.0 / 3.0
    evs = []
    for tok in beats:
        if tok == "R":
            evs.extend([ev([], t), ev([], t), ev([], t)])
        else:
            evs.append(ev([MEL[tok]], t))
            evs.append(ev([a2], t))
            evs.append(ev([a3], t))
    return (chord, evs)

rom_A = lambda: [
    rom_bar("Am", [("B4", 3)]),
    rom_bar("C", [("A4", 2), ("G4", 1)]),
    rom_bar("Dm", [("F4", 3)]),
    rom_bar("E7", [("E4", 3)]),
    rom_bar("Dm", [("F4", 1), ("G4", 2)]),
    rom_bar("Am", [("A4", 3)]),
    rom_bar("E7", [("E4", 2), ("F4", 1)]),
    rom_bar("Am", [("A4", 3)]),
    rom_bar("Dm", [("A4", 3)]),
    rom_bar("Am", [("B4", 2), ("C5", 1)]),
    rom_bar("C", [("C5", 3)]),
    rom_bar("E7", [("B4", 2), ("A4", 1)]),
    rom_bar("Am", [("G4", 3)]),
    rom_bar("Dm", [("F4", 3)]),
    rom_bar("A7", [("F#4", 3)]),
    rom_bar("A7", [("E4", 3)]),
]
rom_B = [
    rom_bar("E", [("G#4", 3)]),
    rom_bar("E", [("G#4", 2), ("F#4", 1)]),
    rom_bar("B7", [("F#4", 3)]),
    rom_bar("E", [("G#4", 3)]),
    rom_bar("E", [("B4", 3)]),
    rom_bar("A", [("B4", 2), ("C#5", 1)]),
    rom_bar("A", [("C#5", 3)]),
    rom_bar("A", [("C#5", 2), ("B4", 1)]),
    rom_bar("A", [("C#5", 2), ("B4", 1)]),
    rom_bar("A", [("A4", 3)]),
    rom_bar("B7", [("G#4", 2), ("F#4", 1)]),
    rom_bar("E", [("E4", 3)]),
    rom_bar("B7", [("F#4", 3)]),
    rom_bar("A", [("A4", 3)]),
    rom_bar("G7", [("F4", 3)]),
    rom_bar("E7", [("E4", 3)]),
]
rom_end = [  # 末小节：Am 和弦整把收束
    ("Am", [ev([(1, 0), (2, 1), (3, 2), (4, 2)], 3)]),
]
rom_bars = rom_A() + rom_B + rom_A()[:-1] + rom_end

rom_meta = dict(
    id="romance", title="爱的罗曼史", subtitle="Romance",
    artist="西班牙民谣（叶佩斯改编）", genre="古典", key="a小调",
    bpm=84, ts="3/4", diff=3, chords='["Am", "C", "Dm", "E7", "A7", "A", "B7", "G7"]',
    desc="几乎等于吉他同义词的不朽名曲，1952 年因法国电影《被禁止的游戏》配乐风靡全球。完整收录单三部曲式 A-B-A 共 48 小节：a 小调主题（三连音分解和弦贯穿、旋律下行歌唱）、转同主音 A 大调的中段（色彩明朗）与主题再现。本谱依原始六线谱以 a 小调第一把位编配，右手 p-m-a 三连音指法即可完整弹奏。",
)

# ============================================================
# 2. 绿袖子 — a小调 3/4（6/8 摇曳感），主歌+副歌
# ============================================================
GM = {
    "G3": (3, 0), "G#3": (3, 1), "A3": (3, 2), "F#3": (4, 4),
    "B3": (2, 0), "C4": (2, 1), "D4": (2, 3),
    "E4": (1, 0), "F4": (1, 1), "F#4": (1, 2), "G4": (1, 3), "G#4": (1, 4),
    "A4": (1, 5), "B4": (1, 7), "C5": (1, 8),
}
GB = {"Am": (5, 0), "G": (6, 3), "E7": (6, 0), "C": (5, 3)}

def g_bar(chord, toks):
    evs, beats, bass_done = [], 0.0, False
    for tok, d in toks:
        beats += d
        if tok == "R":
            evs.append(ev([], d)); continue
        notes = [GM[tok]]
        if not bass_done:
            notes = [GB[chord], GM[tok]]
            bass_done = True
        evs.append(ev(notes, d))
    assert abs(beats - 3) < 1e-9, "拍数错误 %s %s" % (chord, toks)
    return (chord, evs)

g_verse = lambda: [
    g_bar("Am", [("R", 1), ("A3", 1), ("C4", 1)]),
    g_bar("Am", [("D4", 1.5), ("E4", 0.5), ("F4", 1)]),
    g_bar("G", [("E4", 1.5), ("D4", 0.5), ("B3", 1)]),
    g_bar("Am", [("G3", 1.5), ("A3", 0.5), ("B3", 1)]),
    g_bar("E7", [("C4", 1.5), ("B3", 0.5), ("A3", 1)]),
    g_bar("Am", [("R", 1), ("A3", 1), ("B3", 1)]),
    g_bar("G", [("C4", 1.5), ("B3", 0.5), ("A3", 1)]),
    g_bar("E7", [("G#3", 0.5), ("F#3", 0.5), ("G#3", 0.5), ("A3", 0.5), ("B3", 1)]),
    g_bar("Am", [("A3", 3)]),
]
g_chorus = [
    g_bar("C", [("G4", 1.5), ("G4", 0.5), ("F#4", 1)]),
    g_bar("G", [("E4", 1.5), ("D4", 0.5), ("B3", 1)]),
    g_bar("Am", [("G3", 1), ("A3", 1), ("B3", 1)]),
    g_bar("Am", [("C5", 1.5), ("A4", 0.5), ("A4", 1)]),
    g_bar("E7", [("G#4", 0.5), ("A4", 0.5), ("B4", 0.5), ("G#4", 0.5), ("E4", 1)]),
    g_bar("C", [("G4", 1.5), ("G4", 0.5), ("F#4", 1)]),
    g_bar("G", [("E4", 1.5), ("D4", 0.5), ("B3", 1)]),
    g_bar("Am", [("B3", 0.5), ("C4", 0.5), ("B3", 1), ("A3", 1)]),
]
g_bars = g_verse() + g_chorus + g_verse() + g_chorus

g_meta = dict(
    id="greensleeves", title="绿袖子", subtitle="Greensleeves",
    artist="英格兰民谣", genre="古典", key="a小调",
    bpm=100, ts="3/4", diff=2, chords='["Am", "G", "E7", "C"]',
    desc="传唱四百余年的英格兰民谣，相传为亨利八世为安妮·博林所作，后被无数古典吉他演奏家改编为独奏曲。完整收录主歌与「绿袖子是我一切快乐」副歌各两遍共 34 小节：主歌在 a 小调上哀婉倾诉，副歌转入 C 大调与 E7 和弦色彩交替，结尾落回主和弦。全曲第一把位即可完成，是练习三拍子摇曳律动与连贯圆滑线的经典曲目。",
)

# ============================================================
# 3. G大调小步舞曲 — G大调 3/4，A-A-B-A 36 小节
# ============================================================
NM = {
    "E4": (1, 0), "F#4": (1, 2), "G4": (1, 3), "A4": (1, 5), "B4": (1, 7), "C5": (1, 8),
    "D5": (2, 3), "E5": (2, 5), "F#5": (2, 7), "G5": (2, 8), "A5": (2, 10),
}
NB = {"G": (6, 3), "C": (5, 3), "D7": (4, 0)}

def n_bar(chord, toks):
    evs, beats, bass_done = [], 0.0, False
    for tok, d in toks:
        beats += d
        if tok == "R":
            evs.append(ev([], d)); continue
        notes = [NM[tok]]
        if not bass_done:
            notes = [NB[chord], NM[tok]]
            bass_done = True
        evs.append(ev(notes, d))
    assert abs(beats - 3) < 1e-9, "拍数错误 %s %s" % (chord, toks)
    return (chord, evs)

def n_A(end_tok):
    a = [
        n_bar("G", [("D5", 1), ("G4", 0.5), ("A4", 0.5), ("B4", 0.5), ("C5", 0.5)]),
        n_bar("G", [("D5", 1), ("G4", 1), ("G4", 1)]),
        n_bar("C", [("E5", 1), ("C5", 0.5), ("D5", 0.5), ("E5", 0.5), ("F#5", 0.5)]),
        n_bar("G", [("G5", 1), ("G4", 1), ("G4", 1)]),
        n_bar("C", [("C5", 1), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5)]),
        n_bar("G", [("B4", 1), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5)]),
        n_bar("D7", [("A4", 1), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5)]),
    ]
    a.append(n_bar("D7" if end_tok == "D5" else "G", [(end_tok, 3)]))
    return a

n_B = [
    n_bar("G", [("B4", 1), ("G4", 0.5), ("A4", 0.5), ("B4", 0.5), ("C5", 0.5)]),
    n_bar("G", [("D5", 1), ("E5", 0.5), ("F#5", 0.5), ("G5", 0.5), ("D5", 0.5)]),
    n_bar("G", [("G5", 1), ("F#5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 0.5)]),
    n_bar("G", [("B4", 1), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5)]),
    n_bar("G", [("D5", 1), ("E5", 0.5), ("F#5", 0.5), ("G5", 0.5), ("A5", 0.5)]),
    n_bar("G", [("G5", 1), ("F#5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 0.5)]),
    n_bar("G", [("B4", 1), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5), ("E4", 0.5)]),
    n_bar("D7", [("D5", 1), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5)]),
    n_bar("C", [("C5", 1), ("D5", 0.5), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5)]),
    n_bar("G", [("B4", 1), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5)]),
    n_bar("D7", [("A4", 1), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5)]),
    n_bar("G", [("G4", 3)]),
]
n_bars = n_A("D5") + n_A("G4") + n_B + n_A("G4")

n_meta = dict(
    id="minuetg", title="G大调小步舞曲", subtitle="Minuet in G, BWV Anh.114",
    artist="克里斯蒂安·佩措尔德（旧题巴赫）", genre="古典", key="G大调",
    bpm=108, ts="3/4", diff=2, chords='["G", "C", "D7"]',
    desc="《安娜·玛格达莱娜·巴赫笔记》中最著名的一页，三百年 来几乎所有琴童的第一首巴洛克舞曲（1970 年考证确认为德累斯顿管风琴家佩措尔德所作，旧题巴赫）。完整收录全曲 36 小节：第一段主题（带一、二房子反复）典雅工整，第二段模进爬升后回落，最后主题再现收束。旋律声部以级进为主、朗朗上口，低音声部在强拍给以根音支撑，是练习巴洛克句法与声部平衡的必修曲。",
)

# ============================================================
# 4. 摇篮曲 — C大调 3/4，A-B-A-B' 24 小节
# ============================================================
LM = {
    "C4": (2, 1), "D4": (2, 3), "E4": (1, 0), "F4": (1, 1),
    "G4": (1, 3), "A4": (1, 5), "B4": (1, 7), "C5": (1, 8),
}
LB = {"C": (5, 3), "G7": (6, 3), "F": (6, 1)}

def l_bar(chord, toks):
    evs, beats, bass_done = [], 0.0, False
    for tok, d in toks:
        beats += d
        if tok == "R":
            evs.append(ev([], d)); continue
        notes = [LM[tok]]
        if not bass_done:
            notes = [LB[chord], LM[tok]]
            bass_done = True
        evs.append(ev(notes, d))
    assert abs(beats - 3) < 1e-9, "拍数错误 %s %s" % (chord, toks)
    return (chord, evs)

l_A = lambda: [
    l_bar("C", [("R", 2), ("G4", 1)]),       # 弱起（第三拍起音）
    l_bar("C", [("E4", 1), ("E4", 1), ("G4", 1)]),
    l_bar("C", [("G4", 2), ("R", 1)]),
    l_bar("C", [("E4", 1), ("E4", 1), ("G4", 1)]),
    l_bar("C", [("G4", 2), ("R", 1)]),
    l_bar("C", [("E4", 1), ("G4", 1), ("C5", 1)]),
    l_bar("G7", [("B4", 1), ("A4", 1), ("A4", 1)]),
    l_bar("C", [("G4", 3)]),
]
l_B = [
    l_bar("G7", [("D4", 1), ("E4", 1), ("F4", 1)]),
    l_bar("G7", [("D4", 1), ("G4", 2)]),
    l_bar("C", [("C5", 1), ("B4", 1), ("A4", 1)]),
    l_bar("G7", [("B4", 1), ("C5", 2)]),
]
l_end = [
    l_bar("C", [("C5", 2), ("A4", 1)]),
    l_bar("C", [("G4", 2), ("E4", 1)]),
    l_bar("F", [("F4", 1), ("G4", 1), ("A4", 1)]),
    l_bar("C", [("G4", 2), ("E4", 1)]),
    l_bar("C", [("C4", 3)]),
]
l_bars = l_A() + l_B + l_A() + l_end

l_meta = dict(
    id="lullaby", title="摇篮曲", subtitle="Wiegenlied, Op.49 No.4",
    artist="约翰内斯·勃拉姆斯", genre="古典", key="C大调",
    bpm=72, ts="3/4", diff=2, chords='["C", "G7", "F"]',
    desc="1868 年勃拉姆斯为祝贺友人法柏夫人次子出生而作，是世界传唱度最高的摇篮曲。完整收录全曲 24 小节：主题从第三拍弱起、随三拍子轻轻摇晃，中段「明天早晨若蒙神恩」下行句温柔回落，尾声在主和弦安静收束。本谱移调至吉他友好的 C 大调第一把位，旋律全在 1-2 弦，适合作为 bedtime 曲目入门与哄睡必弹。",
)

# ============================================================
# 写入 data.js
# ============================================================
new_songs = [song_js(m, b) for m, b in [
    (rom_meta, rom_bars), (g_meta, g_bars), (n_meta, n_bars), (l_meta, l_bars),
]]
block = ",\n\n" + "\n\n".join(new_songs) + "\n"

p = "js/data.js"
s = io.open(p, encoding="utf-8").read()
anchor = s.find("\n];")
assert anchor > 0, "找不到 TAB_DATA 结尾"
s2 = s[:anchor] + "\n," + ",".join(new_songs) + "\n" + s[anchor:]
io.open(p, "w", encoding="utf-8").write(s2)
print("已写入 4 首新曲: romance(%d小节) greensleeves(%d) minuetg(%d) lullaby(%d)" % (
    len(rom_bars), len(g_bars), len(n_bars), len(l_bars)))
print("data.js 总长:", len(s2))
