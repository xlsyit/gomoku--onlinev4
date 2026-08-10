# 星穹连珠 · Gomoku Nexus

一个开箱即玩的炫酷特效五子棋网页游戏，纯 HTML / CSS / JavaScript 实现，**零依赖、无需构建、离线可玩**。

A stylish browser Gomoku game with dazzling effects. Pure HTML / CSS / JavaScript — **no dependencies, no build step, works offline**.

## 玩法 / Gameplay

- 点击棋盘交叉点落子，五子连珠获胜 / Click an intersection to place a stone; connect five to win.
- 封面可选择玩家对战或人机对战（简单 / 普通 / 困难 + 先后手）。
  Choose player-vs-player or player-vs-AI on the cover (Easy / Normal / Hard + first move).
- 对局中按空格切换主题场景 / Press **Space** to switch theme scenes.
- 按 R 重开，Esc 返回菜单 / Press **R** to restart, **Esc** to return to menu.

## 特色 / Features

- 7 套程序实时生成的主题：星海霓虹、樱落和风、赛博都市、熔岩深渊、极光冰川、水墨丹青、糖果梦境
  7 procedurally generated themes: Neon Cosmos, Sakura, Cyber City, Lava Abyss, Aurora Glacier, Ink Wash, Candy Dream
- 每套主题拥有专属连招特效、氛围粒子和棋子雕纹
  Unique combo effects, ambient particles, and engraved stone motifs per theme
- 组合判定：三连 / 活三 / 四连 / 双线 / 封锁活三 / 破解冲四 / 五连
  Combo detection: three, open three, four, double-line, blocking open three, breaking open four, five-in-a-row
- 空格换景：虹膜收缩 + 漩涡光效的丝滑过渡，动画时长可调
  Smooth scene transitions with iris + swirl effects; duration is adjustable
- 自动换景设置（封面 ⚙ 设置：间隔 8–120 秒）
  Auto scene switching (cover ⚙ Settings: interval 8–120 s)
- AI：威胁评分 + α-β 剪枝搜索，三档难度
  AI: threat scoring + alpha-beta pruning search, three difficulty levels
- 全程序化音效（WebAudio），无需音频文件
  Procedural sound effects via WebAudio, no audio files needed

## 运行 / Run

直接双击 `index.html`，或用任意静态服务器：

Simply double-click `index.html`, or serve it with any static file server:

```bash
python -m http.server 8000 --directory .
```

然后打开 `http://localhost:8000`。

## 项目结构 / Structure

```text
index.html          页面骨架 / page shell
styles.css          界面样式 / UI styles
js/
  config.js         全局配置与设置持久化 / config & settings persistence
  themes.js         7 套主题、背景绘制、氛围粒子、专属特效与棋子雕纹 / themes, backgrounds, fx, motifs
  particles.js      粒子系统 / particle system
  effects.js        特效引擎（光环、闪电、震屏、镜头缩放、文字提示）/ FX engine
  ai.js             人机 AI（启发式 + α-β 剪枝）/ AI engine
  audio.js          程序化音效 / procedural audio
  game.js           对局逻辑、棋盘渲染、连招检测、场景切换 / game logic & rendering
  cover.js          封面与设置面板 / cover & settings UI
  main.js           启动入口 / bootstrap
preview/            截图预览 / screenshots
```

## 部署 / Deploy

纯静态项目，可拖拽上传至 Netlify Drop、Cloudflare Pages、Vercel、GitHub Pages 等任意静态托管平台。

Pure static project — drag-and-drop to Netlify Drop, Cloudflare Pages, Vercel, GitHub Pages, or any static host.

## 开源许可 / License

[MIT](LICENSE)
