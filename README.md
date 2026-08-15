# 星穹连珠 · Gomoku Nexus Online v4

原版炫酷特效五子棋与在线对战扩展合一的完整版本，保留本地人机/双人玩法，同时提供 **账号注册登录、实时网络对战、房间系统、排行榜、断线重连、职业禁手、自定义棋盘**。

Merged build of the original Gomoku Nexus and the online edition. It keeps every local theme/effect/gameplay feature and adds accounts, real-time online rooms, leaderboard, rejoin support, renju forbidden moves, and custom board sizes.

## 玩法 / Gameplay

### 本地对战

- 点击棋盘交叉点落子，五子连珠获胜
- 封面可选择 **玩家对战** 或 **人机对战**（简单 / 普通 / 困难 + 先后手）
- 对局中按 **空格** 切换主题场景，**R** 重开，**Esc** 返回菜单
- 设置中可选 **9 / 13 / 15 / 19** 棋盘
- 规则可选手动选择：**自由规则 / 职业禁手 / 民间禁手**
- 设置中可切换 **星云 / 纸墨 / 终端** 三种 UI 主题

### 在线对战

1. 封面点击 **在线对战**，进入对战大厅页面
2. 在大厅输入昵称和密码，点击 **注册**（新账号）或 **登录**（已有账号）
3. 创建房间时可选择 **公开房间** 或 **私密房间**
4. 公开房间会实时显示在大厅房间卡片网格中，其他玩家可一键加入
5. 私密房间不展示在大厅，输入 6 位房间码加入
6. 双方就绪后自动开始，创建者执黑先手
7. 落子后实时同步到对手，五连珠自动判定胜负并更新账号排名
8. 对局结束后 **请求再战**，对方接受后直接换边开始下一局，无需重新创建房间
9. 对局中掉线后 60 秒内重新连接可自动回到原房间并恢复棋盘

### 排行榜与账号

- 昵称、密码哈希、胜/负/平、积分均保存在 SQLite
- 注册 / 登录后返回会话令牌，创建与加入房间需要有效登录
- 积分规则：胜 +30，负 -10，平 +5；初始积分 1000

## v4 更新 / v4 Changes

- **AI 不再卡 UI**：AI 引擎拆为 `ai-core.js`，对局中通过 Web Worker 异步搜索，主线程保持流畅
- **AI 重构加强**：断点棋形识别（跳三、跳四、双三、四三等）、双威胁评分、Zobrist 置换表、迭代加深 α-β 剪枝与根节点排序
- AI 三档难度重做：简单会漏防但保留随机感，普通稳健，困难使用更深搜索与更强威胁判断
- **多规则选择**：自由规则无禁手；职业禁手为黑方双三/双四/长连禁手；民间禁手为黑方长连禁手，本地、AI、在线模式统一生效
- **自定义棋盘**：9、13、15、19 路，设置后自动应用到本地与在线房间
- **更多场景**：新增翡翠雨林、暮色金砂、紫晶幻境，共 10 套程序实时主题
- **UI 切换**：星云、纸墨、终端三套界面主题，设置面板重新分区
- **断线重连**：房间会话令牌 + 60 秒重连窗口，恢复棋盘、回合与胜负状态
- **服务端校验**：登录令牌、棋盘大小、坐标、回合、重复落子、五连与禁手由服务端复核
- **结算防重**：同一局只写入一次排行榜结果，避免双方同时上报导致积分重复

## 技术架构 / Architecture

```
用户浏览器
  ├── Nginx（反向代理 + SSL，可选）
  │     └── Node.js（:3000）
  │           ├── Express（静态文件托管 + REST 注册/登录 API）
  │           ├── Socket.IO（WebSocket 实时对战 / 重连）
  │           └── SQLite（账号与排行榜持久化）
  └── 纯前端渲染（Canvas 2D + WebAudio + AI Worker）
```

### 前端

- **纯 Vanilla JS**，零框架依赖
- HTML5 Canvas 2D 渲染全部游戏画面、背景、粒子、特效
- Web Audio API 程序化生成所有音效
- Web Worker 承载 AI 搜索，避免思考时界面卡顿
- Socket.IO 客户端处理实时通信与断线重连

### 后端

- **Node.js + Express + Socket.IO**
- **Node 内置 SQLite（`node:sqlite`）** 单文件数据库，零配置，不再依赖原生编译模块
- `scrypt` 加盐哈希保存密码，登录会话令牌保存在内存
- WebSocket 事件流：登录 → 创建房间 → 加入房间 → 落子同步 → 断线重连 → 胜负结算 → 排行榜更新
- 房间超时自动清理，掉线重连窗口 60 秒

## 项目结构 / Structure

```text
gomoku--onlinev4/
├── index.html              游戏页（本地对战、设置、结算 UI）
├── online.html             在线对战大厅独立页面
├── styles.css              界面样式 + 三套 UI 主题
├── LICENSE                 MIT 开源许可
├── README.md
├── 一键发布到GitHub.bat      GitHub 一键发布脚本
├── 发布到GitHub.md           GitHub 发布说明
│
├── server/                  后端服务（Node.js）
│   ├── package.json         依赖：express, socket.io（SQLite 使用 Node 内置）
│   ├── index.js             入口：HTTP + 注册/登录 API + WebSocket + 重连
│   ├── room-manager.js      房间管理：大小/禁手/校验/重连/超时清理
│   └── database.js           SQLite 账号、密码哈希与排行榜
│
├── js/                      前端脚本
│   ├── config.js            全局配置与设置持久化
│   ├── network.js           Socket.IO 客户端 + 登录/注册 + 会话令牌重连
│   ├── themes.js            10 套主题、背景、粒子、特效、棋子雕纹
│   ├── particles.js         粒子系统引擎
│   ├── effects.js           视觉特效引擎
│   ├── ai-core.js           AI 引擎（Worker/主线程共用，支持动态棋盘与禁手）
│   ├── ai.js                AI 异步封装与 Web Worker 调度
│   ├── audio.js             程序化音效
│   ├── game.js              对局核心 + 自定义棋盘 + 禁手 + 在线恢复
│   ├── cover.js             封面、账号、在线房间、设置与排行榜
│   └── main.js              启动入口
│
└── preview/                  截图预览
```

## 快速启动 / Quick Start

环境要求：Node.js 22+、npm。

```bash
cd gomoku--onlinev4/server
npm install
node index.js
```

服务启动后监听 3000 端口，浏览器打开 `http://localhost:3000` 即可。

直接双击 `index.html` 可以玩本地模式；在线模式从首页进入独立 `online.html` 对战大厅，连接失败会回退 `http://127.0.0.1:3000`。服务端 SQLite 使用 Node 22+ 内置 `node:sqlite`，不再需要编译 `better-sqlite3`。

## 部署 / Deploy

- 在线对战需要部署 `server/`，推荐宝塔面板 + PM2 + Nginx 反向代理，配置 WebSocket 升级头
- GitHub Pages / Netlify / Cloudflare Pages 可托管静态前端，但无法运行 Node 后端；此时可玩本地模式，在线模式需另配服务器
- 发布脚本与说明见 `一键发布到GitHub.bat`、`发布到GitHub.md`

## 开源许可 / License

[MIT](LICENSE)
