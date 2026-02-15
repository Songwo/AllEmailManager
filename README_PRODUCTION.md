# EmailHub Production Deployment Guide

Production-grade deployment guide for EmailHub `v2.0.0` on a Linux server with Docker Compose.  
EmailHub `v2.0.0` 生产环境部署指南（Linux + Docker Compose）。

This document is release-oriented: secure defaults, clear verification steps, backup/rollback, and operations checklist.  
本指南面向正式发布：强调安全默认值、可验证步骤、备份回滚和运维清单。

## 1. Deployment Scope

EN:
- Target architecture: single-host deployment with Docker Compose.
- Database: SQLite file persisted in Docker volume (`/data/dev.db` in container).
- Suitable for: small/medium teams, single server, fast rollout.

中文：
- 目标架构：单机 Docker Compose 部署。
- 数据库：SQLite 文件持久化到 Docker 卷（容器内路径 `/data/dev.db`）。
- 适用场景：中小团队、单服务器、快速上线。

Important:
- This project currently runs as a single-node app with a local SQLite file.
- If you need multi-node HA (high availability), plan a database architecture migration first.
- 当前版本是单节点 + 本地 SQLite，不适合多节点共享同一数据库文件。

## 2. Recommended Production Architecture

```text
Internet
  |
  v
Nginx (HTTPS, 443)
  |
  v
EmailHub App Container (Next.js, port 3000)
  |
  v
Docker Volume (emailhub_data -> /data/dev.db, /data/uploads)
```

Optional:
- Add Redis container only if you need Redis-based scripts/diagnostics.
- 可选启用 Redis（当前主业务流程不是强依赖）。

## 3. Prerequisites

Server requirements:
- OS: Ubuntu 22.04/24.04 LTS (recommended)
- CPU: 2 cores+
- RAM: 4 GB+ (8 GB recommended)
- Disk: 30 GB+ SSD
- Domain: one DNS A record pointing to your server

Software:
- Docker Engine 24+
- Docker Compose plugin 2.20+
- Nginx 1.20+
- OpenSSL

## 4. Server Initialization

Run as a sudo user:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx openssl

# Docker (official repo)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Then re-login (or run `newgrp docker`) and verify:

```bash
docker --version
docker compose version
nginx -v
```

## 5. Deploy Application (Release Version)

### 5.1 Fetch code

```bash
git clone https://github.com/Songwo/AllEmailManager.git
cd AllEmailManager
git fetch --tags
git checkout v2.0.0
```

### 5.2 Create production env file

```bash
cp .env.example .env
```

Generate secure values:

```bash
openssl rand -base64 48   # NEXTAUTH_SECRET
openssl rand -hex 16      # ENCRYPTION_KEY (32 hex chars)
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://mail.your-domain.com"
NEXTAUTH_SECRET="paste_generated_long_secret_here"
ENCRYPTION_KEY="paste_32_hex_key_here"
NODE_ENV="production"
PORT="3000"
LOG_LEVEL="info"
UPLOAD_DIR="/data/uploads"
MAX_UPLOAD_SIZE="10485760"
```

Validation notes:
- `NEXTAUTH_SECRET` must be at least 32 characters.
- `ENCRYPTION_KEY` must be exactly 32 characters.
- `NEXTAUTH_URL` should be your final HTTPS domain URL.

### 5.3 Start containers

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Expected behavior:
- Container starts successfully.
- Entrypoint runs `prisma db push --skip-generate`.
- App listens on `0.0.0.0:3000`.

### 5.4 First verification

On server:

```bash
curl -I http://127.0.0.1:3000/login
```

Expected: `HTTP/1.1 200 OK` (or redirect to login route behavior with healthy response).

## 6. Configure Nginx + HTTPS

### 6.1 Nginx site config

Create `/etc/nginx/sites-available/emailhub.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mail.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # SSE endpoint for realtime events
    location /api/events {
        proxy_pass http://127.0.0.1:3000/api/events;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }
}
```

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/emailhub.conf /etc/nginx/sites-enabled/emailhub.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 Enable TLS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mail.your-domain.com
```

Check renewal timer:

```bash
systemctl status certbot.timer
```

## 7. Security Hardening Checklist

- Close direct public access to port `3000` (only expose 80/443).
- Use strong secrets in `.env`.
- Keep `.env` permission strict:

```bash
chmod 600 .env
```

- Set OS firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

- Regularly update system packages and Docker images.

## 8. Operations Runbook

### 8.1 Daily commands

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose restart app
```

### 8.2 Upgrade to a new release

```bash
git fetch --tags
git checkout vX.Y.Z
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 app
```

### 8.3 Rollback

```bash
git checkout v2.0.0
docker compose up -d --build
```

## 9. Backup and Restore

### 9.1 Quick backup (no downtime)

```bash
docker compose exec app sh -c "cp /data/dev.db /data/dev.db.backup.$(date +%Y%m%d%H%M%S)"
```

### 9.2 Recommended backup (with short maintenance window)

```bash
docker compose stop app
docker run --rm -v emailhub_data:/data -v "$PWD/backups:/backup" alpine \
  sh -c 'cp /data/dev.db /backup/dev.db.$(date +%Y%m%d%H%M%S).bak'
docker compose start app
```

Note:
- If your Compose project name changes, volume name may not be exactly `emailhub_data`.
- Check actual volume name with `docker volume ls`.

### 9.3 Restore

```bash
docker compose stop app
docker run --rm -v emailhub_data:/data -v "$PWD/backups:/backup" alpine \
  sh -c 'cp /backup/dev.db.YYYYMMDDHHMMSS.bak /data/dev.db'
docker compose start app
docker compose logs --tail=100 app
```

## 10. Production Verification Checklist

- `docker compose ps` shows `app` is `Up`.
- `curl -I http://127.0.0.1:3000/login` returns healthy response.
- HTTPS domain is reachable in browser.
- You can register/login and add at least one mailbox.
- New incoming email can be listed on dashboard.
- SMTP send test works.
- Backup file can be generated successfully.

## 11. Common Production Issues

| Symptom | Root cause | Fix |
|---|---|---|
| App container exits immediately | Invalid env values (secret length/format) | Check `.env`, then `docker compose up -d --build` |
| 502 from Nginx | App not ready or wrong upstream | Check `docker compose ps`, fix `proxy_pass` to `127.0.0.1:3000` |
| Login token issues after domain switch | `NEXTAUTH_URL` not updated | Set real HTTPS URL and redeploy |
| Attachments missing after restart | `UPLOAD_DIR` not persisted | Keep `UPLOAD_DIR=/data/uploads` and keep volume |
| Data loss after redeploy | Volume removed or wrong project name | Verify volume with `docker volume ls`, restore from backup |

## 12. Release Notes Integration

For public release, keep these files aligned:
- `README.md`
- `README_PRODUCTION.md`
- `CHANGELOG.md`
- `package.json`

Recommended release sequence:
1. Update docs and changelog.
2. Commit and tag (`v2.0.0`).
3. Push branch and tag.
4. Publish GitHub Release with deployment notes.
