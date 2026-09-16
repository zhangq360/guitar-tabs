# -*- coding: utf-8 -*-
"""gen_hybrid.py 已废弃（2026-09-17）。

站点方向已定为：全站统一为古典吉他独奏谱（style:"solo"），
不再生成弹唱谱（style:"accomp"）数据。js/data.js 即唯一数据源，直接编辑。

此存根防止误跑旧脚本把 data.js 覆盖回混合谱式。
"""
import sys

sys.stderr.write(
    "[gen_hybrid.py] 已废弃：站点已全站切换为独奏谱，"
    "请直接编辑 js/data.js（曲谱数据唯一源头），不要运行本脚本。\n"
)
sys.exit(1)
