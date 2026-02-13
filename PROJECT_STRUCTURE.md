# EmailHub 项目结构

```
email-manager/
├── .github/                      # GitHub 配置
│   ├── workflows/               # GitHub Actions
│   │   ├── ci.yml              # CI/CD 流程
│   │   └── security.yml        # 安全扫描
│   ├── ISSUE_TEMPLATE/         # Issue 模板
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── question.md
│   └── pull_request_template.md
│
├── app/                         # Next.js App Router
│   ├── api/                    # API 路由
│   │   ├── alerts/            # 系统告警 API
│   │   ├── analytics/         # 统计分析 API
│   │   ├── auth/              # 用户认证 API
│   │   ├── email-accounts/    # 邮箱账户 API
│   │   ├── emails/            # 邮件管理 API
│   │   │   └── [id]/         # 邮件操作 API
│   │   ├── filter-rules/      # 过滤规则 API
│   │   ├── listener/          # 监听器管理 API
│   │   ├── push-channels/     # 推送渠道 API
│   │   └── settings/          # 系统设置 API
│   │
│   ├── dashboard/              # 仪表板页面
│   │   ├── accounts/          # 邮箱管理页面
│   │   ├── analytics/         # 统计分析页面
│   │   ├── channels/          # 推送渠道页面
│   │   ├── filters/           # 过滤规则页面
│   │   ├── settings/          # 系统设置页面
│   │   ├── layout.tsx         # 仪表板布局
│   │   └── page.tsx           # 仪表板首页
│   │
│   ├── login/                  # 登录页面
│   │   └── page.tsx
│   │
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
│
├── components/                  # React 组件
│   └── ui/                     # UI 组件库
│       └── button.tsx          # 按钮组件
│
├── lib/                         # 工具库和服务
│   ├── constants.ts            # 常量定义
│   ├── email-listener.ts       # 邮件监听服务
│   ├── encryption.ts           # 加密工具
│   ├── listener-manager.ts     # 监听器管理
│   ├── prisma.ts               # Prisma 客户端
│   └── utils.ts                # 通用工具函数
│
├── prisma/                      # Prisma ORM
│   └── schema.prisma           # 数据库模型定义
│
├── public/                      # 静态资源
│   ├── next.svg
│   └── vercel.svg
│
├── scripts/                     # 脚本文件
│   └── start-listeners.ts      # 启动邮件监听器
│
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件
├── .prettierrc.js              # Prettier 配置
├── .prettierignore             # Prettier 忽略文件
├── CHANGELOG.md                 # 更新日志
├── CONTRIBUTING.md              # 贡献指南
├── DEPLOYMENT.md                # 部署指南
├── docker-compose.yml           # Docker Compose 配置
├── Dockerfile                   # Docker 镜像配置
├── eslint.config.mjs           # ESLint 配置
├── FEATURES.md                  # 功能特性文档
├── LICENSE                      # 开源许可证
├── next.config.ts              # Next.js 配置
├── package.json                # 项目依赖
├── package-lock.json           # 依赖锁定文件
├── postcss.config.mjs          # PostCSS 配置
├── prisma.config.ts            # Prisma 配置
├── QUICKSTART.md               # 快速开始指南
├── README.md                   # 项目说明
├── SECURITY.md                 # 安全政策
├── start.bat                   # Windows 启动脚本
├── start.sh                    # Linux/Mac 启动脚本
└── tsconfig.json               # TypeScript 配置
```

## 目录说明

### `/app` - 应用核心
Next.js 14 App Router 目录，包含所有页面和 API 路由。

**API 路由 (`/app/api`)**
- `alerts/` - 系统告警管理
- `analytics/` - 数据统计分析
- `auth/` - 用户认证（登录/注册）
- `email-accounts/` - 邮箱账户 CRUD
- `emails/` - 邮件列表和操作
- `filter-rules/` - 过滤规则管理
- `listener/` - 邮件监听器控制
- `push-channels/` - 推送渠道配置
- `settings/` - 系统设置

**页面 (`/app/dashboard`)**
- `accounts/` - 邮箱管理界面
- `analytics/` - 统计图表展示
- `channels/` - 推送渠道配置界面
- `filters/` - 过滤规则配置界面
- `settings/` - 系统设置界面

### `/components` - 组件库
可复用的 React 组件。

**UI 组件 (`/components/ui`)**
- `button.tsx` - 按钮组件（支持多种样式）

### `/lib` - 核心库
业务逻辑和工具函数。

**核心服务**
- `email-listener.ts` - IMAP 邮件监听服务
  - 实时监听新邮件
  - 邮件解析和存储
  - 过滤规则处理
  - 推送通知触发

- `listener-manager.ts` - 监听器生命周期管理
  - 启动/停止监听器
  - 监听器状态管理
  - 优雅关闭处理

- `encryption.ts` - 加密/解密工具
  - AES-256 密码加密
  - 密钥管理

- `prisma.ts` - 数据库客户端
  - Prisma 单例模式
  - 连接池管理

- `constants.ts` - 常量定义
  - 邮箱提供商配置
  - 推送平台配置
  - 默认模板

- `utils.ts` - 通用工具函数
  - CSS 类名合并
  - 其他辅助函数

### `/prisma` - 数据库
Prisma ORM 配置和模型定义。

**数据模型**
- `User` - 用户
- `EmailAccount` - 邮箱账户
- `Email` - 邮件
- `PushChannel` - 推送渠道
- `FilterRule` - 过滤规则
- `PushLog` - 推送日志
- `RateLimitLog` - 频率限制日志
- `SystemAlert` - 系统告警

### `/scripts` - 脚本
后台服务和工具脚本。

- `start-listeners.ts` - 启动所有邮件监听器
  - 自动发现活跃邮箱
  - 批量启动监听器
  - 错误处理和日志

### 配置文件

**环境配置**
- `.env.example` - 环境变量模板
- `.env` - 实际环境变量（不提交到 Git）

**代码质量**
- `eslint.config.mjs` - ESLint 规则
- `.prettierrc.js` - Prettier 格式化规则
- `tsconfig.json` - TypeScript 编译配置

**构建和部署**
- `next.config.ts` - Next.js 配置
- `postcss.config.mjs` - PostCSS 配置
- `Dockerfile` - Docker 镜像构建
- `docker-compose.yml` - Docker 服务编排

**启动脚本**
- `start.bat` - Windows 快速启动
- `start.sh` - Linux/Mac 快速启动

### 文档

- `README.md` - 项目介绍和基本使用
- `QUICKSTART.md` - 5 分钟快速开始指南
- `FEATURES.md` - 详细功能说明
- `DEPLOYMENT.md` - 部署指南（本地/Docker/VPS/Vercel）
- `CONTRIBUTING.md` - 贡献指南
- `CHANGELOG.md` - 版本更新日志
- `SECURITY.md` - 安全政策
- `LICENSE` - MIT 开源许可证

## 数据流

### 邮件接收流程
```
IMAP Server → EmailListener → Parse Email → Save to DB →
Process FilterRules → Push to Channels → Log Results
```

### 推送流程
```
New Email → Match FilterRule → Get PushChannels →
Check RateLimit → Render Template → Send to Platform →
Log Success/Failure
```

### 用户操作流程
```
User Action → API Route → Prisma Client → Database →
Response → UI Update
```

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **工具**: clsx, tailwind-merge

### 后端
- **运行时**: Node.js 20+
- **框架**: Next.js API Routes
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis + ioredis
- **队列**: Bull

### 邮件处理
- **协议**: IMAP (imap 库)
- **解析**: mailparser
- **加密**: crypto-js

### 认证和安全
- **密码哈希**: bcryptjs
- **会话**: NextAuth.js
- **验证**: Zod

## 开发工作流

1. **本地开发**
   ```bash
   npm run dev          # 启动开发服务器
   npm run db:studio    # 打开数据库管理界面
   npm run lint         # 代码检查
   ```

2. **数据库操作**
   ```bash
   npm run db:generate  # 生成 Prisma Client
   npm run db:migrate   # 运行数据库迁移
   npm run db:push      # 推送 schema 到数据库
   ```

3. **构建和部署**
   ```bash
   npm run build        # 构建生产版本
   npm start            # 启动生产服务器
   ```

4. **后台服务**
   ```bash
   npm run listeners:start  # 启动邮件监听服务
   ```

## 扩展指南

### 添加新的邮箱提供商
1. 在 `lib/constants.ts` 中添加配置
2. 测试 IMAP/SMTP 连接
3. 更新文档

### 添加新的推送平台
1. 在 `lib/constants.ts` 中添加配置
2. 在 `lib/email-listener.ts` 中实现推送逻辑
3. 添加默认模板
4. 更新 UI 和文档

### 添加新的 API 端点
1. 在 `app/api/` 下创建路由文件
2. 实现 GET/POST/PATCH/DELETE 方法
3. 添加数据验证（Zod）
4. 更新前端调用

### 添加新的页面
1. 在 `app/dashboard/` 下创建页面文件
2. 实现 UI 组件
3. 添加动画效果
4. 更新导航菜单

## 性能优化

- **数据库索引**: 已在 Prisma schema 中定义
- **Redis 缓存**: 用于频繁查询的数据
- **消息队列**: Bull 处理异步任务
- **连接池**: Prisma 自动管理
- **静态资源**: Next.js 自动优化

## 监控和日志

- **应用日志**: console.log（生产环境建议使用 Winston）
- **错误追踪**: 系统告警表记录
- **性能监控**: 推送成功率统计
- **数据库监控**: Prisma Studio

## 安全措施

- **密码加密**: AES-256 + bcrypt
- **SQL 注入防护**: Prisma ORM
- **XSS 防护**: React 自动转义
- **CSRF 防护**: NextAuth.js
- **频率限制**: 自定义实现
- **环境变量**: 敏感信息隔离
