# 把这个项目发布到 GitHub（公开源码）

本文件夹是 `gomoku--onlinev4` 合并版，包含本地对战、AI 对战和 Node 在线对战服务。

## 最简单的方式（推荐）

**双击本文件夹里的 `一键发布到GitHub.bat`**，按提示操作：

1. 脚本会自动安装 GitHub 官方命令行工具（如果没有的话）；
2. 弹出浏览器让你登录 GitHub（只需要登录这一次）；
3. 自动创建公开仓库、推送全部源码、开启 GitHub Pages。

## 注意：在线模式不能只靠 GitHub Pages

- GitHub Pages / Netlify / Cloudflare Pages 只能托管静态前端，**不能运行 Node.js 后端**。
- 部署后打开页面可以玩本地双人、人机对战；**在线对战需要另行部署 `server/` 文件夹**（Node.js 22+，可用宝塔 + PM2 + Nginx）。
- 反向代理必须支持 WebSocket，参考 `README.md`。

## 手动步骤

1. 打开 https://github.com/new 新建一个仓库：
   - Repository name：例如 `gomoku-onlinev4`
   - 选择 **Public**
   - 不要勾选 “Add a README file”
   - 点击 Create repository
2. 在本文件夹中打开 PowerShell，依次执行：

```powershell
git remote add origin https://github.com/你的用户名/gomoku-onlinev4.git
git branch -M main
git push -u origin main
```

3. 完成。把仓库主页发出去即可。

## 可选：GitHub Pages 在线试玩

上传后进入仓库 Settings → Pages：

- Source 选择 `main` 分支，保存
- 等待约 1 分钟，即可获得
  `https://你的用户名.github.io/gomoku-onlinev4/`

## 不想上传 GitHub？

直接把 `gomoku--onlinev4` 文件夹发给对方，解压后：

```bash
cd gomoku--onlinev4/server
npm install
node index.js
```

浏览器打开 `http://localhost:3000`。
