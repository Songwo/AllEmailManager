# EmailHub

多邮箱聚合管理平台 —— 基于 Next.js 16 + Prisma + SQLite，支持 IMAP 实时监听、关键词过滤、飞书/企业微信/Telegram 推送。

## 功能概览

- **多邮箱聚合**：同时管理 Gmail、Outlook、QQ、163、126、iCloud、Yahoo 等邮箱
- **实时监听**：后端常驻 IMAP 连接，IDLE + UID 轮询双通道新邮件检测
- **智能推送**：新邮件自动推送至飞书、企业微信、Telegram
- **过滤规则**：按发件人、主题、关键词配置优先级过滤，匹配后触发推送
- **连接诊断**：DNS → TCP → TLS → IMAP 认证 → IDLE 能力逐步诊断
- **邮件搜索**：关键词搜索（主题/发件人/正文）+ 时间范围 + 账户筛选
- **邮件发送**：通过 SMTP 直接发送/回复邮件
- **安全**：AES 加密存储邮箱密码，JWT 认证，可选 2FA

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion |
| 后端 | Next.js API Routes, Node.js IMAP/SMTP |
| 数据库 | SQLite (better-sqlite3) + Prisma ORM |
| 认证 | JWT (HMAC-SHA256), 可选 TOTP 2FA |
| 推送 | 飞书/企业微信 Webhook, Telegram Bot API |
| 部署 | Docker multi-stage / PM2 + Nginx |

## 目录结构

```
email-manager/
├── app/                        # Next.js App Router
│   ├── api/                    # API 路由
│   │   ├── emails/             # 邮件 CRUD + 搜索
│   │   ├── email-accounts/     # 邮箱账户管理 + 连接诊断
│   │   ├── listener/           # 监听器控制 (start/stop/status)
│   │   ├── events/             # SSE 实时事件推送
│   │   └── ...
│   └── dashboard/              # 前端页面
├── lib/                        # 核心模块
│   ├── email-listener.ts       # IMAP 监听器 (IDLE + UID 轮询)
│   ├── listener-manager.ts     # 监听器生命周期管理
│   ├── email-service.ts        # SMTP 邮件发送服务
│   ├── upload-service.ts       # 文件上传服务
│   ├── logger.ts               # 结构化日志模块
│   ├── types.ts                # 共享 TypeScript 类型
│   ├── constants.ts            # 邮箱供应商 / 推送渠道配置
│   ├── notifications.ts        # 站内通知
│   ├── auth.ts                 # JWT 认证
│   ├── encryption.ts           # AES 密码加解密
│   ├── prisma.ts               # Prisma 客户端单例
│   └── env.ts                  # 环境变量校验 (Zod)
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── migrations/             # 数据库迁移文件
├── instrumentation.ts          # Next.js 启动钩子 (自动启动监听器)
├── Dockerfile                  # 多阶段 Docker 构建
├── docker-compose.yml          # Docker Compose 编排
└── scripts/                    # 运维脚本
```

## 快速开始

### 前置要求

- Node.js 20+
- npm 10+

### 1. 克隆并安装

```bash
git clone <your-repo-url>
cd email-manager
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入以下必需项：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<至少32位随机字符串>"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="<32位十六进制密钥>"
```

生成安全值：

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 16      # ENCRYPTION_KEY (32 位 hex)
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

> 如果是已有数据库（通过 `db push` 创建），运行 `npx prisma migrate resolve --applied 20260215000000_init` 标记基线迁移。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000`，注册账户后添加邮箱。

## 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | SQLite 路径，默认 `file:./dev.db` |
| `NEXTAUTH_SECRET` | 是 | JWT 签名密钥，至少 32 字符 |
| `NEXTAUTH_URL` | 是 | 应用外部访问 URL |
| `ENCRYPTION_KEY` | 是 | AES 加密密钥，32 位 hex |
| `NODE_ENV` | 建议 | `development` / `production` |
| `LOG_LEVEL` | 可选 | 日志级别：`debug` / `info` / `warn` / `error` |
| `UPLOAD_DIR` | 可选 | 附件上传目录，默认 `./uploads` |
| `MAX_UPLOAD_SIZE` | 可选 | 最大上传大小(字节)，默认 `10485760` (10MB) |

## 部署

### 方式 A：Docker（推荐）

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f app

# 停止
docker compose down
```

Docker 特性：
- 多阶段构建，最终镜像仅包含运行时依赖
- 启动时自动执行 `prisma db push` 同步 schema
- SQLite 数据通过 Docker volume (`emailhub_data`) 持久化
- 非 root 用户运行，健康检查配置

### 方式 B：裸机 / VM (PM2)

```bash
npm ci
npx prisma generate
npx prisma migrate deploy    # 生产环境使用 migrate deploy
npm run build
pm2 start npm --name emailhub -- start
pm2 save
```

配合 Nginx 反向代理终止 TLS：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 架构要点

### 邮件监听

```
服务启动 (instrumentation.ts)
  └→ listenerManager.startAll()
       └→ 对每个活跃邮箱创建 EmailListener
            ├→ IMAP 连接 + TLS
            ├→ 打开 INBOX, 获取 UIDNEXT 水位线
            ├→ 首次 UNSEEN 抓取
            ├→ UID 轮询 (30-60s, 核心机制)
            │    └→ SEARCH UID (lastSeenUid+1):*
            └→ IDLE 加速 (如果支持)
                 └→ mail 事件 → 立即触发一次轮询
```

- **UID 轮询**是所有邮箱的通用机制，不依赖 UNSEEN/IDLE/时间戳
- **动态频率调节**：有新邮件 → 30s，连续空轮询 5 次 → 45s，10 次 → 60s
- **IDLE 是可选加速器**：163 等不支持 IDLE 的邮箱依靠纯轮询
- **健康检查**：每 3 分钟自动检查，重启异常停止的监听器
- **心跳**：每 60s 更新 `lastHeartbeatAt`，用于前端状态展示

### 推送流程

```
新邮件保存 → 匹配过滤规则 → 查找关联推送通道 → 频率限制检查 → 推送
```

支持飞书互动卡片模板、企业微信 Markdown、Telegram HTML 格式。

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run lint             # ESLint 检查

# 数据库
npm run db:generate      # 生成 Prisma Client
npm run db:migrate       # 运行迁移 (开发)
npm run db:push          # 同步 schema 到数据库
npm run db:studio        # 打开 Prisma Studio

# 运维
npm run listeners:start  # 手动启动所有监听器
npm run health:check     # 健康检查
npm run db:backup        # 数据库备份
```

## 数据库备份

### 本地

```bash
cp dev.db dev.db.backup
```

### Docker

```bash
docker compose exec app sh -c "cp /data/dev.db /data/dev.db.backup.$(date +%Y%m%d%H%M%S)"
```

## 安全注意事项

- 生产环境必须更换 `NEXTAUTH_SECRET` 和 `ENCRYPTION_KEY`
- 不要提交 `.env` 文件到版本控制
- 定期运行 `npm audit` 检查依赖安全
- 建议通过 Nginx/Caddy 终止 TLS
- 定期备份 SQLite 数据文件

## 故障排除

| 问题 | 解决方案 |
|---|---|
| Prisma Unknown field 错误 | 删除 `.next/` 目录，运行 `npx prisma generate`，重启开发服务器 |
| 163 邮箱连接失败 | 确认已开启 IMAP 服务并使用授权码（非登录密码） |
| Docker 容器启动后退出 | `docker compose logs app --tail=200` 查看日志，通常是 `.env` 配置不正确 |
| 监听器不自动启动 | 检查 `instrumentation.ts` 存在且账户 `isActive=true` |
| 邮件搜索无结果 | 搜索匹配 subject/fromAddress/body，确认数据已入库 |

## License

MIT
