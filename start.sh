#!/bin/bash

# EmailHub 快速启动脚本

echo "🚀 EmailHub 快速启动脚本"
echo "=========================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 20+"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️  配置环境变量..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请编辑配置后重新运行"
        echo ""
        echo "需要配置的项目："
        echo "  - DATABASE_URL: PostgreSQL 连接字符串"
        echo "  - REDIS_HOST: Redis 主机地址"
        echo "  - NEXTAUTH_SECRET: 认证密钥"
        echo "  - ENCRYPTION_KEY: 加密密钥（32位）"
        echo ""
        echo "生成随机密钥："
        echo "  NEXTAUTH_SECRET: $(openssl rand -base64 32 2>/dev/null || echo 'your-secret-key')"
        echo "  ENCRYPTION_KEY: $(openssl rand -hex 16 2>/dev/null || echo 'your-32-character-encryption-key')"
        exit 0
    else
        echo "❌ 未找到 .env.example 文件"
        exit 1
    fi
fi

echo "✅ 环境变量已配置"
echo ""

# 检查数据库连接
echo "🔍 检查数据库连接..."
if npm run db:generate > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "⚠️  数据库连接失败，请检查 DATABASE_URL 配置"
    echo "   继续启动开发服务器..."
fi
echo ""

# 启动开发服务器
echo "🎉 启动开发服务器..."
echo "   访问: http://localhost:3000"
echo ""
npm run dev
