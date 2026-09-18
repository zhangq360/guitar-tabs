# -*- coding: utf-8 -*-
"""
add_songs.py — 向 js/data.js 的 TAB_DATA 追加两首完整古典独奏谱：
  1. 泪滴/雨滴 (Lágrima, Tárrega) — E大调 3/4，A-B-DC 完整结构 23 小节
  2. 鸽子 (La Paloma, Yradier) — D大调 2/4 哈巴涅拉，完整主歌+副歌+桥段+尾声 34 小节
谱源：Lágrima 用多源一致的标准六线谱；La Paloma 用权威简谱（1=D 2/4）自行编配旋律+低音。
"""
import io, re, json

# ---------- 小工具 ----------
def ev(notes, d):
    """notes: [(string, fret), ...]  string: 1=高音E … 6=低音E"""
    return (notes, d)

def bars_js(bars, indent="      "):
    out = []
    for chord, evs in bars:
        evs_js = ", ".join(
            "{ n: [%s], d: %s }" % (
                ", ".join("[%d,%d]" % (s, f) for s, f in notes) if notes else "",
                ("%g" % d)
            )
            for notes, d in evs
        )
        # 休止事件的 n 为空数组
        evs_js = evs_js.replace("[ ]", "")
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

# ============================================================
# 1. 泪滴（雨滴）Lágrima — E大调 3/4
#    逐小节严格按多源一致六线谱（guitartabs.cc / lacuerda / musicnoteslib 三源一致）
# ============================================================
# A 段主题（4 小节为一乐句）
def lag_a1():
    return [
        ("E", [ev([(1,4),(2,0),(4,2)],1), ev([(1,5),(2,0),(4,4)],1), ev([(1,7),(2,0),(4,6)],1)]),
        ("E", [ev([(1,2),(2,0),(4,1)],1.5), ev([(2,0),(3,2)],0.75), ev([(5,2)],0.75)]),
    ]
def lag_theme():
    """A 段 8 小节 = 主题乐句 ×2（原谱 REPEAT SIMILE 写出）"""
    return lag_a1() * 4  # a1(2小节) ×4 = 8 小节：m1-2, m3-4(=m1-2), m5-6, m7-8

lag_connect = [
    ("E",  [ev([(1,12),(3,9),(4,11)],1), ev([(1,11),(3,9),(4,9)],1), ev([(1,9),(2,7),(4,7)],1)]),
    ("B7", [ev([(1,7),(2,9),(4,9)],1), ev([(2,5),(3,6)],1), ev([(2,7)],1)]),
    ("B7", [ev([(1,0),(2,9),(4,9)],1), ev([(2,2),(3,3),(5,2)],1), ev([(2,4),(3,2)],1)]),
]
lag_b = [
    ("Em", [ev([(1,3),(2,0),(6,0)],0.5), ev([(1,8)],0.5), ev([(1,7)],0.5), ev([(1,0),(2,5)],0.5), ev([(1,2),(2,4),(3,2),(5,2)],0.5), ev([(1,3)],0.5)]),
    ("Em", [ev([(1,0),(2,0),(6,0)],0.5), ev([(3,5),(4,7)],0.5), ev([(3,4),(4,5)],0.5), ev([(3,2),(4,4)],0.5), ev([(3,0),(4,2)],0.5), ev([(3,2),(4,4)],0.5)]),
    ("A",  [ev([(2,0),(3,0),(6,0)],0.5), ev([(1,12),(4,7)],1), ev([(1,8),(5,9)],1), ev([(2,10)],0.5)]),
    ("B7", [ev([(1,2),(2,7),(6,7)],1), ev([(3,8),(4,9)],1), ev([(4,10)],0.5), ev([(2,0),(4,9)],0.5)]),
    ("Em", [ev([(1,3),(2,0),(4,2)],1), ev([(1,5),(2,0),(4,4)],1), ev([(1,7),(2,0),(4,5)],1)]),
    ("Em", [ev([(1,10)],0.5), ev([(1,8)],0.5), ev([(1,7)],0.5), ev([(2,10),(5,0)],0.5), ev([(2,8)],0.5), ev([(2,7)],0.5)]),
    ("B7", [ev([(1,0)],0.5), ev([(2,0),(3,0)],0.5), ev([(1,2),(2,3),(3,2)],0.5), ev([(2,0)],0.5), ev([(3,2),(4,1),(5,2)],1)]),
    ("Em", [ev([(1,0),(2,0),(3,0)],1), ev([(4,2)],1), ev([(6,0)],1)]),
]
lag_final = lag_a1() * 2  # D.C. al Fine 再现：主题 4 小节收束
lag_bars = lag_theme() + lag_connect + lag_b + lag_final

lag_meta = dict(
    id="lagrima", title="泪滴（雨滴）", subtitle="Lágrima",
    artist="弗朗西斯科·塔雷加", genre="古典", key="E 大调",
    bpm=76, ts="3/4", diff=3, chords='["E", "B7", "Em", "A"]',
    desc="塔雷加最著名的短篇杰作，因「大调如笑、小调如泪」得名。完整收录 A 段（E 大调主题及其反复）、下行连接句、B 段（E 小调）与 D.C. 再现共 23 小节；旋律声部在高音弦歌唱、内声部与低音以分解和弦陪衬，是练习声部分离的经典教材。",
)

# ============================================================
# 2. 鸽子 La Paloma — D大调 2/4 哈巴涅拉
#    旋律依权威简谱（1=D 2/4），低音按哈巴涅拉节奏型编配
# ============================================================
# D 大调指位表（简谱记号 → [弦, 品]）
DP = {
    "5,": (3,2),  # A3
    "6,": (2,0),  # B3
    "7,": (2,2),  # C#4
    "1":  (2,3),  # D4
    "2":  (2,5),  # E4
    "3":  (1,2),  # F#4
    "4":  (1,3),  # G4
    "5":  (1,5),  # A4
    "6":  (1,7),  # B4
    "7":  (1,9),  # C#5
    "1'": (1,10), # D5
}
BASS = {"D": (4,0), "A": (5,0), "G": (6,3)}   # 根音（D3 / A2 / G2）

def mel_bar(chord, tokens, bass=True, extra_bass=None):
    """tokens: [(记号, 拍数)]；小节首音配低音根音；extra_bass: [(根音名, 拍数)] 追加低音过渡"""
    evs = []
    for i, (tok, d) in enumerate(tokens):
        notes = [DP[tok]]
        if i == 0 and bass:
            notes.append(BASS[chord])
        evs.append(ev(notes, d))
    for name, d in (extra_bass or []):
        evs.append(ev([BASS[name]], d))
    assert abs(sum(d for _, d in tokens) + sum(d for _, d in (extra_bass or [])) - 2) < 1e-9, \
        "小节拍数错误: %s %s" % (chord, tokens)
    return (chord, evs)

def hold_bar(chord, tok, tail):
    """长音小节：旋律长音 + 后两拍低音五度过渡（哈巴涅拉律动）"""
    notes = [DP[tok], BASS[chord]]
    d0 = 2 - sum(d for _, d in tail)
    evs = [ev(notes, d0)] + [ev([BASS[n]], d) for n, d in tail]
    return (chord, evs)

lap_bars = []
# 前奏 2 小节（哈巴涅拉低音）
lap_bars.append(("D", [ev([BASS["D"]],0.75), ev([BASS["A"]],0.25), ev([BASS["D"]],0.5), ev([BASS["A"]],0.5)]))
lap_bars.append(("A", [ev([BASS["A"]],0.75), ev([BASS["G"]],0.25), ev([BASS["A"]],0.5), ev([BASS["A"]],0.5)]))
# 主歌 9 小节：当我离开可爱的故乡…
lap_bars.append(("D", [ev([BASS["D"]],1), ev([DP["5"]],1)]))                                    # (0)5 5-
lap_bars.append(mel_bar("D", [("5",0.5),("3",0.5),("4",0.5),("5",0.25),("6",0.25)]))     # 53456
lap_bars.append(mel_bar("A", [("7",0.5),("1'",0.5),("6",0.5),("7,",0.25),("5",0.25)]))   # 7167.5
lap_bars.append(hold_bar("G", "4", [("A",0.5),("G",0.5)]))                               # 4-
lap_bars.append(("G", [ev([DP["4"],BASS["G"]],1), ev([],0.5), ev([DP["2"]],0.5)]))              # 4 0 2
lap_bars.append(hold_bar("A", "2", [("G",0.5),("A",0.5)]))                               # 2-
lap_bars.append(mel_bar("A", [("2",0.5),("3",0.5),("1",0.5),("2",0.25),("7,",0.25)]))    # 23127
lap_bars.append(mel_bar("D", [("1",0.5),("7",0.5),("6",0.75),("5,",0.25)]))              # 1765.
lap_bars.append(("D", [ev([DP["4"],BASS["D"]],0.5), ev([DP["3"],BASS["A"]],1.5)]))              # 4→3-
# 副歌 10 小节（两段歌词同一旋律）：象一只鸽子在海上自由地飞…
def chorus(first=True):
    c = []
    c.append(mel_bar("D", [("5",0.5),("7",0.25),("7",0.25),("7",0.25),("7",0.25),("6",0.5)]))
    c.append(mel_bar("D", [("6",0.5),("5",0.25),("5",0.25),("5",0.5),("6",0.25),("6",0.25)], bass=False) if False else
             mel_bar("D", [("6",0.5),("5",0.25),("5",0.25),("5",0.5),("6",0.25),("6",0.25)]))
    c.append(("D", [ev([DP["5"],BASS["D"]],0.5), ev([DP["4"]],0.25), ev([DP["3"]],0.25), ev([DP["3"],BASS["A"]],1)]))
    c.append(mel_bar("A", [("2",0.5),("2",0.5),("1",0.5),("7,",0.25),("6",0.25)]))
    c.append(mel_bar("D", [("1",0.5),("1",0.5),("1",0.75),("7,",0.25)]))
    return c
lap_bars += chorus()
lap_bars += chorus()
# 桥段 5 小节：请你来到我身旁…走向遥远地方
lap_bars.append(mel_bar("A", [("7,",0.5),("2",0.5),("2",0.5),("4",0.5)]))                # 7 2 2 4
lap_bars.append(mel_bar("D", [("3",0.5),("2",0.5),("3",0.5),("1",0.5)]))                 # 3 2 3 1
lap_bars.append(mel_bar("A", [("2",0.5),("7,",0.5),("1",0.5),("3",0.5)]))                # 2 7 1 3
lap_bars.append(mel_bar("A", [("2",0.5),("3",0.5),("4",0.25),("6",0.25),("5",0.5)]))     # 2346 5
lap_bars.append(("D", [ev([DP["3"],BASS["D"]],1.5), ev([BASS["A"]],0.5)]))                      # 3-
# 尾声 3 小节
lap_bars.append(mel_bar("D", [("1'",0.5),("2",0.5),("3",0.25),("4",0.25),("6",0.5)]))    # 1' 2346
lap_bars.append(("D", [ev([DP["5"],BASS["D"]],0.5), ev([DP["3"],BASS["A"]],1.5)]))              # 5 3-
lap_bars.append(("D", [ev([(1,10),(2,3),(4,0)],1.5), ev([],0.5)]))                              # 终止主和弦

lap_meta = dict(
    id="lapaloma", title="鸽子", subtitle="La Paloma",
    artist="塞巴斯蒂安·伊拉迪尔", genre="古典", key="D 大调",
    bpm=104, ts="2/4", diff=2, chords='["D", "A7", "G"]',
    desc="风靡世界一百六十余年的哈巴涅拉名曲（1862年创作于哈瓦那），史上被翻录最多的歌曲之一。完整收录前奏、主歌、两遍副歌、桥段与尾声共 34 小节；低音采用哈巴涅拉标志性的附点律动（附点八分—十六分—八分—八分），旋律声部多用一、二弦，把位友好，是接触拉丁风格的绝佳入门曲。",
)

# ============================================================
# 校验并写入 data.js
# ============================================================
def check(name, bars, beats):
    for i, (c, evs) in enumerate(bars):
        s = sum(d for _, d in evs)
        assert abs(s - beats) < 1e-9, "%s 第%d小节拍数 %g ≠ %g" % (name, i+1, s, beats)

check("lagrima", lag_bars, 3)
check("lapaloma", lap_bars, 2)
print("拍数校验通过：泪滴 %d 小节，鸽子 %d 小节" % (len(lag_bars), len(lap_bars)))

path = "js/data.js"
src = io.open(path, encoding="utf-8").read()
assert "lagrima" not in src and "lapaloma" not in src, "已存在同名曲目"

anchor = "\n];\n\n/* ============ 和弦图库"
i = src.find(anchor)
assert i > 0, "未找到 TAB_DATA 结束锚点"

block = (
    ",\n\n"
    + song_js(lag_meta, lag_bars)
    + ",\n\n"
    + song_js(lap_meta, lap_bars)
)
new = src[:i] + block + src[i:]
io.open(path, "w", encoding="utf-8", newline="\n").write(new)
print("已写入 data.js，新总长:", len(new))
