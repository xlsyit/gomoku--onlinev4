@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  Gomoku Nexus - One-click GitHub Publishing
echo ============================================
echo.

where gh >nul 2>nul
if errorlevel 1 (
    echo [1/4] GitHub CLI not found. Installing via winget...
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
    where gh >nul 2>nul
    if errorlevel 1 (
        echo Failed to install GitHub CLI.
        echo Please install it from https://cli.github.com/ and run this script again.
        pause
        exit /b 1
    )
)

echo [2/4] Checking GitHub login...
gh auth status >nul 2>nul
if errorlevel 1 (
    echo Please sign in. A browser window will open - complete it once.
    gh auth login
)

echo [3/4] Creating public repository and pushing code...
gh repo create gomoku-nexus --public --source . --push --description "Gomoku Nexus - a stylish browser Gomoku game with dazzling effects"
if errorlevel 1 (
    echo.
    echo Repository create/push failed.
    echo If "gomoku-nexus" already exists, edit this script and change the name.
    pause
    exit /b 1
)

echo [4/4] Enabling GitHub Pages (online playable version)...
gh api repos/{owner}/{repo}/pages -X POST -f "source[branch]=main" >nul 2>nul

echo.
echo Done! Repository URL:
gh repo view --json url -q .url
echo.
echo The online playable version will be ready in about 1 minute:
echo https://YOUR-USERNAME.github.io/gomoku-nexus/
echo.
pause
