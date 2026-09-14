# 六线谱库 · Guitar Tab Hub

一个零依赖的吉他六线谱网站，纯 HTML/CSS/JavaScript 实现，支持 SVG 六线谱实时渲染、和弦图浏览、旋律播放跟练，并整合全网合法六线谱资源导航。

> 演示站点：<https://github.com/zhangq360/guitar-tabs>
>
> 内置曲谱均为公有领域旋律的原创编配，资源导航部分仅做外部链接，不抓取、不转载任何受版权保护的谱子。

## ✨ 主要功能

- 🎼 **SVG 六线谱渲染**：纯 JS 绘制品数、符干、小节线、和弦标记，可无限缩放
- 🎵 **旋律播放跟练**：浏览器原生 Web Audio 合成发音，音符实时高亮 + 谱面自动滚动
- 🎸 **和弦图库**：16 个常用开放和弦指位图（含横按、七和弦）
- 🔗 **全网资源导航**：汇总 Ultimate Guitar、Songsterr、吉他社、弹琴吧、MuseScore 等正版资源入口
- ⚡ **零依赖、零构建**：所有代码手写，不引入任何第三方库，托管到任意静态托管即可运行

## 📂 项目结构

```
guitar-tabs/
├── index.html      # 入口 HTML
├── css/
│   └── style.css   # 全部样式
├── js/
│   ├── data.js     # 曲谱数据 + 和弦数据 + 资源导航
│   ├── renderer.js # SVG 六线谱 / 和弦图渲染器
│   ├── player.js   # Web Audio 播放引擎
│   └── app.js      # 页面交互逻辑
└── README.md
```

## 🚀 本地运行

无需构建工具。任何静态服务器即可：

```bash
# Python（推荐，已内置）
python -m http.server 8020

# 或者 Node.js
npx serve .
```

浏览器访问 <http://localhost:8020>。

## 📝 增加曲目

编辑 `js/data.js`，在 `TAB_DATA` 数组里追加一条：

```javascript
{
  id: "my-song",
  title: "我的歌",
  artist: "佚名",
  tags: ["练习", "C调"],
  difficulty: 1,
  tuning: ["E","A","D","G","B","E"],
  bpm: 100,
  bars: [
    { e: [
      { n: [[1, 3], [2, 3], [3, 1]], d: 1 }, // n[i] = [弦号, 品数]
      { n: [[2, 3]], d: 1 }
    ]}
    // ...
  ]
}
```

刷新页面即可看到。

## ⚖️ 版权说明

- 站内曲谱仅收录公有领域（public domain）旋律的原创编配
- 流行歌曲六线谱受著作权保护，请通过下方导航前往正版平台学习

## 📜 许可证

本仓库代码与原创曲谱编配采用 [MIT License](https://opensource.org/licenses/MIT)，你可以自由使用、修改、商用。