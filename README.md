# EmailHub / 邮件聚合管理平台

EmailHub is a multi-account email management platform built with Next.js + Prisma + SQLite.  
EmailHub 是一个基于 Next.js + Prisma + SQLite 的多邮箱聚合管理平台。

- EN: Aggregate multiple mailboxes, monitor incoming emails, and send notifications.
- 中文: 聚合多个邮箱、实时监听新邮件，并进行消息推送通知。

## Table of Contents / 目录

- [Version / 版本](#version--版本)
- [What This Project Does / 项目功能](#what-this-project-does--项目功能)
- [Tech Stack / 技术栈](#tech-stack--技术栈)
- [Quick Start (Docker Recommended) / 快速开始（推荐 Docker）](#quick-start-docker-recommended--快速开始推荐-docker)
- [Docker Files in This Repo / Docker 文件说明](#docker-files-in-this-repo--docker-文件说明)
- [Environment Variables / 环境变量](#environment-variables--环境变量)
- [Local Development (Without Docker) / 本地开发（不使用 Docker）](#local-development-without-docker--本地开发不使用-docker)
- [Daily Operations / 常用运维命令](#daily-operations--常用运维命令)
- [Backup and Restore / 备份与恢复](#backup-and-restore--备份与恢复)
- [Troubleshooting / 常见问题](#troubleshooting--常见问题)
- [Security Checklist / 安全检查清单](#security-checklist--安全检查清单)

## Version / 版本

- EN: Current stable version: `v2.0.0` (released on `2026-02-15`).
- 中文: 当前稳定版本：`v2.0.0`（发布日期：`2026-02-15`）。
- EN: Major focus in 2.0: deployment consistency, Docker usability, and bilingual beginner documentation.
- 中文: 2.0 重点：部署一致性、Docker 易用性和中英双语新手文档。

## What This Project Does / 项目功能

- EN: Manage Gmail, Outlook, QQ, 163, Yahoo and other IMAP mailboxes in one dashboard.
- 中文: 在一个面板中统一管理 Gmail、Outlook、QQ、163、Yahoo 等 IMAP 邮箱。
- EN: Real-time email listening with IMAP IDLE + UID polling fallback.
- 中文: 支持 IMAP IDLE + UID 轮询兜底的实时监听机制。
- EN: Create filter rules and push notifications to Feishu, WeCom, Telegram.
- 中文: 配置过滤规则并推送到飞书、企业微信、Telegram。
- EN: Send and reply emails directly in the dashboard.
- 中文: 支持在面板内直接发送、回复邮件。

## Tech Stack / 技术栈

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes, Node.js IMAP/SMTP |
| Database | SQLite + Prisma ORM (`@prisma/adapter-better-sqlite3`) |
| Auth | Custom JWT (HMAC-SHA256) + optional TOTP 2FA |
| Deployment | Docker Compose or bare-metal Node.js |

## Quick Start (Docker Recommended) / 快速开始（推荐 Docker）

This section is written for beginners. Follow it line by line.  
本节按“小白可直接照做”编写，按顺序执行即可。

### 0. Prerequisites / 前置条件

- EN: Install Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux).
- 中文: 先安装 Docker Desktop（Windows/macOS）或 Docker Engine + Compose 插件（Linux）。
- EN: Ensure Docker can run successfully (`docker --version` and `docker compose version`).
- 中文: 确认 Docker 可正常运行（执行 `docker --version` 和 `docker compose version`）。

### 1. Clone and Enter Project / 拉取并进入项目

```bash
git clone <your-repo-url>
cd email-manager
```

### 2. Create `.env` File / 创建 `.env` 文件

Linux/macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` with your own secure values.  
然后编辑 `.env`，替换为你自己的安全配置。

Required keys / 必填项:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-at-least-32-characters-secret-key"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
```

Generate secure values / 生成安全值:

```bash
# Linux/macOS (requires openssl)
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 16      # ENCRYPTION_KEY (32 hex chars)
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
-join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Minimum 0 -Maximum 16) })
```

### 3. Build and Start / 构建并启动

```bash
docker compose up -d --build
```

Check logs / 查看日志:

```bash
docker compose logs -f app
```

When logs show server started, open: `http://localhost:3000`  
日志显示服务启动后，打开：`http://localhost:3000`

### 4. First Login / 首次使用

- EN: Register your first user account on the login page.
- 中文: 在登录页先注册第一个用户。
- EN: Add an email account in Dashboard -> Accounts.
- 中文: 在 Dashboard -> 账户 中添加邮箱账号。
- EN: Turn on listener and test send/receive flow.
- 中文: 启动监听器后测试收发流程。

### 5. Stop and Remove / 停止与清理

Stop services (keep data) / 停止服务（保留数据）:

```bash
docker compose down
```

Stop and delete all volumes (erase DB data) / 停止并删除卷（会清空数据库）:

```bash
docker compose down -v
```

## Docker Files in This Repo / Docker 文件说明

- `Dockerfile`
  - EN: Multi-stage build to keep runtime image smaller.
  - 中文: 多阶段构建，减少运行镜像体积。
- `docker-compose.yml`
  - EN: One-command startup, persistent volume, health check, optional Redis profile.
  - 中文: 一键启动，内置数据卷持久化、健康检查、可选 Redis profile。
- `docker/entrypoint.sh`
  - EN: Creates persistent SQLite DB path and runs `prisma db push` at startup.
  - 中文: 启动时创建持久化 SQLite 路径并执行 `prisma db push` 同步 schema。

Optional Redis profile / 可选 Redis profile:

```bash
docker compose --profile with-redis up -d --build
```

## Environment Variables / 环境变量

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Keep as `file:./dev.db` for this project setup |
| `NEXTAUTH_URL` | Yes | Public URL, default `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret, at least 32 chars |
| `ENCRYPTION_KEY` | Yes | Exactly 32 hex chars for AES key |
| `NODE_ENV` | Recommended | `development` / `production` / `test` |
| `PORT` | Optional | App port, default `3000` |
| `UPLOAD_DIR` | Optional | Attachment directory, Docker defaults to `/data/uploads` |
| `MAX_UPLOAD_SIZE` | Optional | Bytes, default `10485760` (10MB) |
| `LOG_LEVEL` | Optional | `debug` / `info` / `warn` / `error` |
| `REDIS_HOST` | Optional | Used by health-check script only |
| `REDIS_PORT` | Optional | Used by health-check script only |

## Local Development (Without Docker) / 本地开发（不使用 Docker）

### 1. Requirements / 前置要求

- Node.js 20+
- npm 10+

### 2. Install and Setup / 安装与初始化

```bash
npm install
cp .env.example .env
```

Windows PowerShell copy command:

```powershell
Copy-Item .env.example .env
```

### 3. Initialize Database / 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 4. Run Dev Server / 启动开发服务器

```bash
npm run dev
```

Open `http://localhost:3000`.  
打开 `http://localhost:3000`。

## Daily Operations / 常用运维命令

```bash
# Start or rebuild
docker compose up -d --build

# View logs
docker compose logs -f app

# App shell
docker compose exec app sh

# Check container health
docker compose ps

# Stop
docker compose down
```

## Backup and Restore / 备份与恢复

### Docker Backup / Docker 备份

```bash
docker compose exec app sh -c "cp /data/dev.db /data/dev.db.backup.$(date +%Y%m%d%H%M%S)"
```

### Docker Restore / Docker 恢复

```bash
docker compose exec app sh -c "cp /data/dev.db.backup.YYYYMMDDHHMMSS /data/dev.db"
docker compose restart app
```

### Local Backup / 本地备份

```bash
cp dev.db dev.db.backup
```

## Troubleshooting / 常见问题

| Problem / 问题 | Fix / 解决方式 |
|---|---|
| Container exits after startup / 容器启动后退出 | Run `docker compose logs app --tail=200` and check `.env` values |
| Login/API returns env validation error / 启动提示环境变量不合法 | Verify `NEXTAUTH_SECRET` length and `ENCRYPTION_KEY` is exactly 32 chars |
| Prisma model mismatch / Prisma 字段不匹配 | Rebuild image: `docker compose up -d --build` |
| Cannot receive emails / 无法收取邮件 | Check mailbox IMAP is enabled and use app password/authorization code |
| Data lost after restart / 重启后数据丢失 | Run `docker volume ls` and confirm `emailhub_data` exists |

## Security Checklist / 安全检查清单

- EN: Replace `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` before production.
- 中文: 上生产前必须替换 `NEXTAUTH_SECRET` 和 `ENCRYPTION_KEY`。
- EN: Do not commit `.env` to git.
- 中文: 不要把 `.env` 提交到仓库。
- EN: Put a reverse proxy (Nginx/Caddy) with HTTPS in front of the app.
- 中文: 生产环境建议在前面加 Nginx/Caddy 并启用 HTTPS。
- EN: Back up `/data/dev.db` regularly.
- 中文: 定期备份 `/data/dev.db`。

## License

MIT
