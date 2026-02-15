# EmailHub 部署指南

## 📋 目录

1. [环境要求](#环境要求)
2. [本地开发部署](#本地开发部署)
3. [生产环境部署](#生产环境部署)
4. [Docker 部署](#docker-部署)
5. [环境变量配置](#环境变量配置)
6. [数据库迁移](#数据库迁移)
7. [反向代理配置](#反向代理配置)
8. [监控和日志](#监控和日志)

---

## 🔧 环境要求

### 最低要求

- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0
- **数据库**: SQLite（开发）/ PostgreSQL（生产推荐）
- **内存**: >= 512MB
- **磁盘**: >= 1GB

### 推荐配置

- **Node.js**: 20.x LTS
- **数据库**: PostgreSQL 15+
- **内存**: >= 2GB
- **磁盘**: >= 5GB
- **CPU**: >= 2 核

---

## 💻 本地开发部署

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/email-manager.git
cd email-manager
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 生成安全密钥
openssl rand -base64 32  # 用于 NEXTAUTH_SECRET
openssl rand -hex 16     # 用于 ENCRYPTION_KEY

# 编辑 .env 文件
nano .env
```

配置示例：
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-char-key-here"
NODE_ENV="development"
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表
npx prisma db push

# （可选）查看数据库
npx prisma studio
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 🚀 生产环境部署

### 方案 1: 传统服务器部署（推荐）

#### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

#### 2. 配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE emailhub;
CREATE USER emailhub_user WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE emailhub TO emailhub_user;
\q
```

#### 3. 部署应用

```bash
# 克隆代码
cd /var/www
sudo git clone https://github.com/your-repo/email-manager.git
cd email-manager

# 安装依赖
npm ci --production

# 配置环境变量
sudo nano .env
```

生产环境 `.env` 配置：
```env
DATABASE_URL="postgresql://emailhub_user:your-strong-password@localhost:5432/emailhub"
NEXTAUTH_SECRET="your-production-secret-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"
ENCRYPTION_KEY="your-production-32-char-key"
NODE_ENV="production"
```

#### 4. 构建和启动

```bash
# 初始化数据库
npx prisma generate
npx prisma db push

# 构建生产版本
npm run build

# 使用 PM2 启动
pm2 start npm --name "emailhub" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs emailhub
```

#### 5. 配置 Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/emailhub
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书（使用 Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/emailhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. 配置 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🐳 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: emailhub-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: emailhub
      POSTGRES_USER: emailhub_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - emailhub-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U emailhub_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: emailhub-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://emailhub_user:${DB_PASSWORD}@postgres:5432/emailhub
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - emailhub-network
    volumes:
      - ./data:/app/data

volumes:
  postgres_data:

networks:
  emailhub-network:
    driver: bridge
```

### 3. 创建 .env 文件

```env
DB_PASSWORD=your-strong-db-password
NEXTAUTH_SECRET=your-production-secret-min-32-chars
NEXTAUTH_URL=https://your-domain.com
ENCRYPTION_KEY=your-production-32-char-key
```

### 4. 启动服务

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 初始化数据库
docker-compose exec app npx prisma db push

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

---

## 🔐 环境变量配置详解

### 必需变量

| 变量名 | 说明 | 示例 | 生成方法 |
|--------|------|------|----------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@localhost:5432/db` | - |
| `NEXTAUTH_SECRET` | JWT 签名密钥 | `abc123...` (≥32字符) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 应用访问地址 | `https://your-domain.com` | - |
| `ENCRYPTION_KEY` | 密码加密密钥 | `abc123...` (=32字符) | `openssl rand -hex 16` |
| `NODE_ENV` | 运行环境 | `production` | - |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 应用端口 | `3000` |
| `LOG_LEVEL` | 日志级别 | `info` |

### 安全建议

1. **永远不要提交 .env 文件到 Git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **使用强密钥**
   - NEXTAUTH_SECRET: 至少 32 个随机字符
   - ENCRYPTION_KEY: 必须是 32 个字符（16 字节十六进制）

3. **定期轮换密钥**
   - 建议每 3-6 个月更换一次
   - 更换后需要重新加密所有邮箱密码

4. **使用环境变量管理工具**
   - 开发: `.env` 文件
   - 生产: 系统环境变量或密钥管理服务（如 AWS Secrets Manager）

---

## 📊 数据库迁移

### SQLite 迁移到 PostgreSQL

#### 1. 导出 SQLite 数据

```bash
# 安装 sqlite3
sudo apt install sqlite3

# 导出数据
sqlite3 dev.db .dump > backup.sql
```

#### 2. 转换 SQL 语法

```bash
# 移除 SQLite 特定语法
sed -i 's/PRAGMA.*//g' backup.sql
sed -i 's/BEGIN TRANSACTION/BEGIN/g' backup.sql
sed -i 's/AUTOINCREMENT/SERIAL/g' backup.sql
```

#### 3. 导入到 PostgreSQL

```bash
# 创建新数据库
psql -U emailhub_user -d emailhub < backup.sql
```

#### 4. 更新环境变量

```env
DATABASE_URL="postgresql://emailhub_user:password@localhost:5432/emailhub"
```

#### 5. 重新生成 Prisma Client

```bash
npx prisma generate
npx prisma db push
```

### 数据备份策略

#### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/emailhub"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="emailhub"
DB_USER="emailhub_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/emailhub_$DATE.sql.gz

# 保留最近 30 天的备份
find $BACKUP_DIR -name "emailhub_*.sql.gz" -mtime +30 -delete

echo "Backup completed: emailhub_$DATE.sql.gz"
```

#### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 🔍 监控和日志

### PM2 监控

```bash
# 查看进程状态
pm2 status

# 查看实时日志
pm2 logs emailhub

# 查看监控面板
pm2 monit

# 查看详细信息
pm2 show emailhub
```

### 日志管理

#### 配置日志轮转

```bash
# 安装 pm2-logrotate
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### 查看应用日志

```bash
# 查看所有日志
pm2 logs emailhub

# 只看错误日志
pm2 logs emailhub --err

# 只看输出日志
pm2 logs emailhub --out

# 清空日志
pm2 flush
```

### 性能监控

#### 使用 PM2 Plus（可选）

```bash
# 注册 PM2 Plus
pm2 link <secret_key> <public_key>

# 访问 https://app.pm2.io 查看监控数据
```

#### 自定义健康检查

创建 `health-check.sh`:
```bash
#!/bin/bash

# 检查应用是否响应
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Application is healthy"
    exit 0
else
    echo "✗ Application is down"
    # 发送告警通知
    # curl -X POST https://your-alert-webhook.com/alert
    exit 1
fi
```

设置定时检查:
```bash
# 每 5 分钟检查一次
*/5 * * * * /path/to/health-check.sh
```

---

## 🛡️ 安全加固

### 1. 防火墙配置

```bash
# 安装 UFW
sudo apt install ufw

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 2. 限制数据库访问

```bash
# 编辑 PostgreSQL 配置
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 只允许本地连接
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### 3. 配置 Fail2Ban

```bash
# 安装 Fail2Ban
sudo apt install fail2ban

# 创建配置
sudo nano /etc/fail2ban/jail.local
```

配置内容:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

### 4. 定期更新

```bash
# 创建更新脚本
cat > /usr/local/bin/update-emailhub.sh << 'EOF'
#!/bin/bash
cd /var/www/email-manager
git pull
npm ci --production
npm run build
pm2 restart emailhub
EOF

chmod +x /usr/local/bin/update-emailhub.sh
```

---

## 📈 性能优化

### 1. Node.js 优化

```bash
# 增加内存限制
pm2 start npm --name "emailhub" -- start --node-args="--max-old-space-size=2048"
```

### 2. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_emails_received_at ON "Email"("receivedAt");
CREATE INDEX idx_emails_is_read ON "Email"("isRead");
CREATE INDEX idx_filter_rules_priority ON "FilterRule"("priority");

-- 定期清理旧数据
DELETE FROM "Email" WHERE "receivedAt" < NOW() - INTERVAL '90 days';
```

### 3. Nginx 缓存

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=emailhub_cache:10m max_size=100m inactive=60m;

# 在 server 块中使用
location /_next/static {
    proxy_cache emailhub_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

---

## 🆘 故障排查

### 应用无法启动

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查日志
pm2 logs emailhub --lines 100

# 检查环境变量
pm2 env emailhub
```

### 数据库连接失败

```bash
# 测试数据库连接
psql -U emailhub_user -d emailhub -h localhost

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

### 内存不足

```bash
# 查看内存使用
free -h

# 增加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📞 获取帮助

- 📖 查看 [使用指南](./USAGE_GUIDE.md)
- 🐛 提交 Issue: https://github.com/your-repo/email-manager/issues
- 💬 讨论区: https://github.com/your-repo/email-manager/discussions

---

## ✅ 部署检查清单

- [ ] 服务器环境准备完成
- [ ] 数据库安装并配置
- [ ] 环境变量正确设置
- [ ] 应用成功构建
- [ ] PM2 进程正常运行
- [ ] Nginx 反向代理配置
- [ ] SSL 证书安装
- [ ] 防火墙规则配置
- [ ] 数据库备份策略设置
- [ ] 日志轮转配置
- [ ] 健康检查脚本运行
- [ ] 性能监控启用

完成以上检查后，你的 EmailHub 就可以投入生产使用了！🎉
