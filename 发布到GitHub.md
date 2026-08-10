# 把这个项目发布到 GitHub（公开源码）

本文件夹已经是一个完整的 Git 仓库（`main` 分支，含首次提交）。

## 最简单的方式（推荐）

**双击本文件夹里的 `一键发布到GitHub.bat`**，按提示操作：

1. 脚本会自动安装 GitHub 官方命令行工具（如果没有的话）；
2. 弹出浏览器让你登录 GitHub（只需要登录这一次）；
3. 自动创建公开仓库、推送全部源码、开启 GitHub Pages 在线试玩。

全程约 2 分钟，完成后脚本会显示仓库链接。

## 步骤

1. 打开 https://github.com/new 新建一个仓库：
   - Repository name：例如 `gomoku-nexus`
   - 选择 **Public**（公开，别人才能看到）
   - 不要勾选 “Add a README file”（避免和本项目的说明冲突）
   - 点击 Create repository
2. 创建后页面会显示仓库地址，例如：
   `https://github.com/你的用户名/gomoku-nexus.git`
3. 在本文件夹中打开 PowerShell，依次执行：

```powershell
git remote add origin https://github.com/你的用户名/gomoku-nexus.git
git branch -M main
git push -u origin main
```

4. 完成。把仓库主页发出去即可，例如：
   `https://github.com/你的用户名/gomoku-nexus`

## 可选：给仓库开一个在线试玩地址

上传后进入仓库 Settings → Pages：

- Source 选择 `main` 分支，保存
- 等待约 1 分钟，即可获得
  `https://你的用户名.github.io/gomoku-nexus/`

这样对方既能看源码，也能直接在线玩。

## 不想上传 GitHub？

直接把 `gomoku-arena-开源版.zip` 发给对方，解压即可查看源码并运行。
