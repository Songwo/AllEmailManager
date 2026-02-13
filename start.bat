@echo off
REM EmailHub 快速启动脚本 (Windows)

echo ================================
echo EmailHub 快速启动脚本
echo ================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 20+
    pause
    exit /b 1
)

echo [成功] Node.js 已安装
node -v
echo.

REM 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

echo [成功] npm 已安装
npm -v
echo.

REM 检查依赖
if not exist "node_modules" (
    echo [安装] 正在安装依赖...
    call npm install
    echo.
)

REM 检查环境变量
if not exist ".env" (
    echo [配置] 创建环境变量文件...
    if exist ".env.example" (
        copy .env.example .env
        echo [成功] 已创建 .env 文件
        echo.
        echo 请编辑 .env 文件配置以下项目：
        echo   - DATABASE_URL: PostgreSQL 连接字符串
        echo   - REDIS_HOST: Redis 主机地址
        echo   - NEXTAUTH_SECRET: 认证密钥
        echo   - ENCRYPTION_KEY: 加密密钥（32位）
        echo.
        pause
        exit /b 0
    ) else (
        echo [错误] 未找到 .env.example 文件
        pause
        exit /b 1
    )
)

echo [成功] 环境变量已配置
echo.

REM 启动开发服务器
echo ================================
echo 启动开发服务器...
echo 访问: http://localhost:3000
echo ================================
echo.

call npm run dev
