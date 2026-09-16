# -*- coding: utf-8 -*-
"""replace_elise.py — 把 data.js 里《致爱丽丝》替换为完整回旋曲式独奏编配（59 小节）
结构：A(15) + 下行模进(5) + riff再现(3) + B段F大调(8) + A再现(8) + C段(9) + A再现(7) + 尾声(4)
同时修正 riff 的 #2(D#4)：原误按 1弦1品(F4)，改为 2弦4品。
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "js", "data.js")

# 指位表（C 调记谱，A 小调）
P = {
    "E2": (6, 0), "F2": (6, 1), "A2": (5, 0), "B2": (5, 2), "C3": (5, 3),
    "D3": (4, 0), "E3": (4, 2), "F3": (4, 3),
    "G3": (3, 0), "Gs3": (3, 1), "A3": (3, 2), "Bb3": (3, 3),
    "B3": (2, 0), "C4": (2, 1), "Cs4": (2, 2), "D4": (2, 3), "Ds4": (2, 4),
    "E4": (1, 0), "F4": (1, 1), "Fs4": (1, 2), "G4": (1, 3), "Gs4": (1, 4),
    "A4": (1, 5), "Bb4": (1, 6), "B4": (1, 7), "C5": (1, 8), "Cs5": (1, 9),
    "D5": (1, 10), "Ds5": (1, 11), "E5": (1, 12),
}

def ev(*toks_d):
    """ev(("A2","E4",0.5), ("Ds4",0.5), ("E4",0.5)) -> JS 事件文本"""
    out = []
    for td in toks_d:
        toks, d = td[:-1], td[-1]
        flat = []
        for t in toks:
            if isinstance(t, tuple):
                flat.extend(t)
            else:
                flat.append(t)
        ns = ", ".join("[%d,%d]" % P[t] for t in flat)
        out.append("{ n: [%s], d: %g }" % (ns, d))
    return ", ".join(out)

def bar(c, *events):
    return '{ c: "%s", e: [%s] }' % (c, ev(*events))

A2, E2, C3, B2, F2 = "A2", "E2", "C3", "B2", "F2"

# riff 三小节（E4 D#4 E4 / D#4 E4 B3 / D4 C4 A3）
def riff():
    return [
        bar("Am", (A2, "E4", 0.5), ("Ds4", 0.5), ("E4", 0.5)),
        bar("E7", (E2, "Ds4", 0.5), ("E4", 0.5), ("B3", 0.5)),
        bar("Am", (A2, "D4", 0.5), ("C4", 0.5), ("A3", 0.5)),
    ]

def cea():  # C E A 上行 + C3 低音
    return bar("Am", (C3, "C4", 0.5), ("E4", 0.5), ("A4", 0.5))

def b_held():  # B3 附点全小节
    return bar("E7", (E2, "B3", 1.5))

def egsb():  # E G# B
    return bar("E7", (E2, "E4", 0.5), ("Gs4", 0.5), ("B4", 0.5))

def c_held():  # C5 全小节
    return bar("Am", (A2, "C5", 1.5))

def e_arp():  # E 大三和弦分解（呼吸小节）
    return bar("E7", (E2, "E3", 0.5), ("Gs3", 0.5), ("B3", 0.5))

def ecb():  # 第二遍结尾：E4 C4 B3
    return bar("E7", (E2, "E4", 0.5), ("C4", 0.5), ("B3", 0.5))

def a_held():  # A3 全小节
    return bar("Am", (A2, "A3", 1.5))

def trill_ds():  # E4 D#4 交替一整小节（16 分 ×6）
    evs = []
    for i in range(3):
        evs.append(((E2, "E4"), 0.25))
        evs.append((("Ds4",), 0.25))
    return bar("E7", *evs)

bars = []
# ---- A 叠部：riff + 主题 + riff + 主题(第二结尾) ----
bars += riff()
bars.append(cea())
bars.append(b_held())
bars.append(egsb())
bars.append(c_held())
bars.append(e_arp())
bars += riff()
bars.append(cea())
bars.append(b_held())
bars.append(ecb())
bars.append(a_held())
# ---- 下行模进（mf 段）：E·FE / D·ED / C·DC / B·EEE / E-D#震音 ----
bars.append(bar("C", (C3, "E4", 0.75), ("F4", 0.5), ("E4", 0.25)))
bars.append(bar("C", (B2, "D4", 0.75), ("E4", 0.5), ("D4", 0.25)))
bars.append(bar("Am", (A2, "C4", 0.75), ("D4", 0.5), ("C4", 0.25)))
bars.append(bar("E7", (E2, "B3", 0.75), ("E4", 0.25), ("E4", 0.25), ("E4", 0.25)))
bars.append(trill_ds())
# ---- riff 再现，引入 B 段 ----
bars += riff()
# ---- B 段（F 大调，dolce）----
bars.append(bar("F", (F2, "F3", 0.5), ("A3", 0.5), ("C4", 0.5)))
bars.append(bar("F", (F2, "F4", 0.75), ("E4", 0.5), ("D4", 0.25)))
bars.append(bar("C", (C3, "E4", 0.75), ("D4", 0.5), ("C4", 0.25)))
bars.append(bar("C", (C3, "A3", 0.25), ("G3", 0.25), ("F3", 0.25), ("E3", 0.25), ("D3", 0.25), ("C3", 0.25)))
bars.append(bar("C", (C3, "Bb3", 0.25), ("A3", 0.25), ("A3", 0.25), ("G3", 0.25), ("A3", 0.25), ("Bb3", 0.25)))
bars.append(bar("C", (C3, "C4", 1.5)))
bars.append(bar("C", (C3, "D4", 0.5), ("Ds4", 0.5), ("E4", 0.5)))   # 半音上行引回 A 段
bars.append(trill_ds())
# ---- A 再现 ----
bars += riff()
bars.append(cea())
bars.append(b_held())
bars.append(egsb())
bars.append(c_held())
bars.append(e_arp())
# ---- C 段（D 小调，A 持续音，激动）----
bars.append(bar("Am", (A2, "A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25)))
bars.append(bar("Am", (A2, "A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25), ("A4", 0.25)))
bars.append(bar("Dm", (A2, "D4", 0.5), ("Cs4", 0.5), ("D4", 0.5)))
bars.append(bar("Dm", (A2, "E4", 0.5), ("F4", 0.5), ("E4", 0.5)))
bars.append(bar("Dm", (A2, "D4", 0.75), ("Cs4", 0.5), ("B3", 0.25)))
bars.append(bar("E7", (E2, "E4", 1.5)))
bars.append(bar("Am", (A2, "A3", 0.25), ("C4", 0.25), ("E4", 0.25), ("A4", 0.25), ("C5", 0.25), ("E5", 0.25)))  # 上行琶音
descent_hi = [("E5",), ("Ds5",), ("D5",), ("Cs5",), ("C5",), ("B4",)]
bars.append(bar("E7", (E2,) + tuple(), ) if False else bar("E7", *[(("E2",) + t, 0.25) for t in descent_hi]))
bars.append(trill_ds())
# ---- A 末次再现（第二结尾收束）----
bars += riff()
bars.append(cea())
bars.append(b_held())
bars.append(ecb())
bars.append(a_held())
# ---- 尾声：两个八度内半音下行 + 终止 ----
bars.append(bar("E7", *[(("E2",) + t, 0.25) for t in descent_hi]))
bars.append(bar("E7", (E2, "B4", 0.25), ("Bb4", 0.25), ("A4", 0.25), ("Gs4", 0.25), ("G4", 0.25), ("Fs4", 0.25)))
bars.append(bar("E7", (E2, "E4", 0.5), ("B3", 0.5), ("Gs3", 0.5)))
bars.append(bar("Am", (("A2", "A3", "C4", "E4"), 1.5)))

bars_js = ",\n      ".join(bars)

new_block = '''  {
    id: "elise",
    title: "致爱丽丝",
    subtitle: "Für Elise (WoO 59)",
    artist: "贝多芬（1810，公有领域）",
    genre: "古典",
    type: "独奏",
    key: "A 小调",
    bpm: 66,
    timeSig: "3/8",
    difficulty: 3,
    chords: ["Am", "E7", "C", "F", "Dm"],
    style: "solo",
    desc: "完整回旋曲式独奏版（A–B–A–C–A 全曲 59 小节）：a 小调主题、下行模进、F 大调 B 段、A 持续音的 C 段与半音阶尾声全部编入。3/8 拍，#2、#5 变音按原谱标注，低音 Am/E7 交替铺底。",
    bars: [
      %s
    ]
  }''' % bars_js

with io.open(DATA, "r", encoding="utf-8") as f:
    src = f.read()

m = re.search(r'\n  \{\n    id: "elise",.*?\n  \},\n(?=  \{\n    id: "twotigers")', src, re.S)
assert m, "未定位到 elise 块"
src = src[:m.start()] + "\n" + new_block + ",\n" + src[m.end():]

with io.open(DATA, "w", encoding="utf-8") as f:
    f.write(src)

print("elise replaced, bars =", len(bars))
