# EmailHub - 项目部署指南

## 本地开发环境搭建

### 前置要求

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- npm 或 yarn

### 步骤

1. **克隆项目并安装依赖**

```bash
cd email-manager
npm install
```

2. **配置环境变量**

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写以下配置：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/email_manager?schema=public"

# NextAuth 配置
NEXTAUTH_SECRET="生成一个随机字符串"
NEXTAUTH_URL="http://localhost:3000"

# Redis 配置
REDIS_HOST="localhost"
REDIS_PORT="6379"

# 加密密钥（32位字符）
ENCRYPTION_KEY="your-32-character-encryption-key"
```

生成随机密钥：

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 16
```

3. **初始化数据库**

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 或者直接推送 schema（开发环境）
npm run db:push
```

4. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000

5. **（可选）启动邮件监听服务**

在另一个终端窗口：

```bash
npm run listeners:start
```

## Docker 部署

### 使用 Docker Compose（推荐）

1. **配置环境变量**

创建 `.env` 文件：

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-character-key
```

2. **启动所有服务**

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 数据库（端口 5432）
- Redis 缓存（端口 6379）
- Next.js 应用（端口 3000）

3. **查看日志**

```bash
docker-compose logs -f app
```

4. **停止服务**

```bash
docker-compose down
```

### 单独构建 Docker 镜像

```bash
# 构建镜像
docker build -t email-manager .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_HOST="redis" \
  -e NEXTAUTH_SECRET="..." \
  -e ENCRYPTION_KEY="..." \
  email-manager
```

## 生产环境部署

### Vercel 部署

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/email-manager.git
git push -u origin main
```

2. **在 Vercel 导入项目**

- 访问 https://vercel.com
- 点击 "Import Project"
- 选择你的 GitHub 仓库
- 配置环境变量（参考 `.env.example`）

3. **配置数据库**

推荐使用 Vercel Postgres 或 Supabase：

```bash
# Vercel Postgres
vercel postgres create

# 或使用 Supabase
# 在 Supabase 创建项目，获取连接字符串
```

4. **部署**

Vercel 会自动部署，每次推送到 main 分支都会触发部署。

### VPS 部署（Ubuntu/Debian）

1. **安装依赖**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 Redis
sudo apt install -y redis-server

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

2. **配置数据库**

```bash
# 创建数据库用户和数据库
sudo -u postgres psql
CREATE USER emailmanager WITH PASSWORD 'your_password';
CREATE DATABASE email_manager OWNER emailmanager;
\q
```

3. **部署应用**

```bash
# 克隆代码
git clone https://github.com/your-username/email-manager.git
cd email-manager

# 安装依赖
npm ci --only=production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 构建应用
npm run build

# 使用 PM2 启动
pm2 start npm --name "email-manager" -- start
pm2 startup
pm2 save
```

4. **配置 Nginx 反向代理**

```bash
sudo apt install -y nginx

# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/email-manager
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/email-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **配置 SSL（Let's Encrypt）**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控和维护

### 查看应用日志

```bash
# PM2 日志
pm2 logs email-manager

# Docker 日志
docker-compose logs -f app
```

### 数据库备份

```bash
# 备份数据库
pg_dump -U emailmanager email_manager > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U emailmanager email_manager < backup_20260213.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 运行数据库迁移
npm run db:migrate

# 重新构建
npm run build

# 重启应用
pm2 restart email-manager
```

## 性能优化

### 1. 启用 Redis 缓存

确保 Redis 正常运行，应用会自动使用 Redis 进行缓存。

### 2. 数据库索引优化

Prisma schema 已包含必要的索引，确保运行了所有迁移。

### 3. 配置 CDN

将静态资源部署到 CDN（如 Cloudflare、AWS CloudFront）。

### 4. 启用 Gzip 压缩

Nginx 配置：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

## 故障排查

### 数据库连接失败

检查 `DATABASE_URL` 是否正确，确保 PostgreSQL 服务运行中：

```bash
sudo systemctl status postgresql
```

### Redis 连接失败

检查 Redis 服务状态：

```bash
sudo systemctl status redis
```

### 邮件监听失败

检查邮箱配置是否正确，IMAP 端口是否开放，密码是否为应用专用密码。

### 推送失败

检查 Webhook URL 是否正确，网络是否可达目标服务器。

## 安全建议

1. **定期更新依赖**

```bash
npm audit
npm update
```

2. **使用强密码**

确保数据库密码、加密密钥足够复杂。

3. **启用防火墙**

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

4. **定期备份**

设置自动备份脚本（cron job）。

5. **监控日志**

定期检查应用和系统日志，及时发现异常。

## 技术支持

如遇到问题，请查看：

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [项目 Issues](https://github.com/your-username/email-manager/issues)
