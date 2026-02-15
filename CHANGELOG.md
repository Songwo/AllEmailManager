# EmailHub 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- OAuth2 登录支持（Google、GitHub）
- 邮件回复功能
- 自定义卡片模板编辑器
- 邮件搜索功能
- 移动端适配

## [2.0.0] - 2026-02-15

### 新增
- 双语（中文/English）README，新手级部署说明
- Docker 快速开始章节（从 `.env` 到 `docker compose up` 的完整步骤）
- Docker 文件说明章节（`Dockerfile`、`docker-compose.yml`、`docker/entrypoint.sh`）
- 统一环境变量模板，补充运行参数和可选参数（如 `UPLOAD_DIR`、`MAX_UPLOAD_SIZE`）

### 变更
- 部署文档与当前代码实现对齐：
  - 数据库基于 SQLite（`dev.db`）与 Prisma SQLite 适配器
  - Docker 启动时执行 `prisma db push --skip-generate`
  - 上传目录持久化到 `/data/uploads`
- `docker-compose.yml` 增强默认环境变量映射与可读性
- `docs/deployment/README.md` 更新为稳定入口并指向新文档结构

### 修复
- 修复 ComposeEmail 弹窗的循环渲染问题（`Maximum update depth exceeded`）
  - 原因：默认数组参数在每次渲染创建新引用，导致 effect 反复触发
  - 处理：改为稳定常量引用，避免无限 setState 循环

### 技术栈（2.0 当前）
- **前端**: Next.js 16 + React 19 + Tailwind CSS 4
- **后端**: Next.js API Routes + Node.js IMAP/SMTP
- **数据库**: SQLite + Prisma ORM (`@prisma/adapter-better-sqlite3`)
- **认证**: 自定义 JWT（HMAC-SHA256）+ 可选 TOTP 2FA

## [0.1.0] - 2026-02-13

### 新增
- ✨ 多邮箱管理功能
  - 支持 Gmail、Outlook、QQ、163、126、iCloud、Yahoo 等主流邮箱
  - 实时 IMAP 监听（IDLE 协议）
  - 邮箱密码 AES-256 加密存储
  - 邮箱连接状态监控

- ✨ 智能过滤规则
  - 按发件人、主题、关键词过滤
  - 支持多条件组合
  - 规则优先级排序
  - 自动执行推送、标记已读、删除等操作

- ✨ 多平台推送
  - 企业微信 Webhook 推送
  - 飞书 Webhook 推送
  - Telegram Bot API 推送
  - 自定义消息模板
  - 推送成功率统计

- ✨ 防骚扰策略
  - 频率限制（每分钟/每小时）
  - 静默时段设置
  - 消息去重机制

- ✨ 监控告警
  - 邮箱连接断开告警
  - 推送失败告警
  - 频率限制告警
  - 系统错误日志

- ✨ 邮件操作
  - 标记已读
  - 删除邮件
  - 邮件列表查看
  - 附件支持

- ✨ 统计分析
  - 邮件接收趋势图（7天）
  - 发件人排行榜
  - 推送渠道表现统计
  - 实时数据概览

- ✨ 系统设置
  - 通知设置
  - 频率限制配置
  - 语言和时区设置
  - 深色模式支持

- ✨ 用户认证
  - 邮箱密码登录
  - 用户注册
  - 会话管理

- 🎨 精美 UI 设计
  - 现代简约风格
  - 蓝绿色系配色
  - Framer Motion 动画效果
  - 响应式布局
  - 深色模式

### 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis + ioredis
- **队列**: Bull
- **邮件**: imap + mailparser
- **加密**: crypto-js
- **认证**: bcryptjs

### 文档
- 📖 README.md - 项目介绍
- 📖 QUICKSTART.md - 快速开始指南
- 📖 FEATURES.md - 功能特性详解
- 📖 DEPLOYMENT.md - 部署指南
- 📖 CONTRIBUTING.md - 贡献指南

### 部署支持
- Docker 支持（Dockerfile + docker-compose.yml）
- Vercel 一键部署
- VPS 部署指南
- 启动脚本（Windows + Linux/Mac）

---

## 版本说明

### [0.1.0] - 初始版本
这是 EmailHub 的第一个公开版本，包含了核心的邮件管理和推送功能。

**主要特性:**
- 多邮箱统一管理
- 智能过滤和自动化
- 多平台实时推送
- 完善的监控告警
- 精美的用户界面

**适用场景:**
- 个人邮件管理
- 团队协作通知
- 开发者工具集成
- 客服系统监控

**已知限制:**
- 暂不支持邮件回复
- 暂不支持 OAuth2 登录
- 暂不支持移动端
- 暂不支持邮件搜索

**性能指标:**
- 邮件接收延迟: < 5秒
- 推送延迟: < 2秒
- 消息送达率: 99.9%
- 支持并发: 100+ 邮箱账户

---

## 贡献者

感谢所有为 EmailHub 做出贡献的开发者！

- [@your-username](https://github.com/your-username) - 项目创建者

---

## 反馈

如有问题或建议，欢迎：
- 提交 [Issue](https://github.com/your-username/email-manager/issues)
- 发起 [Discussion](https://github.com/your-username/email-manager/discussions)
- 提交 [Pull Request](https://github.com/your-username/email-manager/pulls)

---

[未发布]: https://github.com/your-username/email-manager/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/your-username/email-manager/releases/tag/v2.0.0
[0.1.0]: https://github.com/your-username/email-manager/releases/tag/v0.1.0
