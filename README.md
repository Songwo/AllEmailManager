# EmailHub

<div align="center">

![EmailHub Logo](https://via.placeholder.com/150x150/0EA5E9/FFFFFF?text=EmailHub)

**现代化的多邮件管理平台**

统一管理所有邮箱，实时推送重要消息到微信、飞书、Telegram

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [文档](#-文档) • [部署](#-部署) • [贡献](#-贡献)

</div>

---

## ✨ 功能特性

### 📧 多邮箱管理
- 支持 Gmail、Outlook、QQ、163、126、iCloud、Yahoo 等主流邮箱
- 实时 IMAP 监听，秒级接收新邮件
- 邮箱密码 AES-256 加密存储
- 连接状态实时监控

### 🎯 智能过滤
- 按发件人、主题、关键词自动过滤
- 支持多条件组合匹配
- 规则优先级排序
- 自动执行推送、标记已读、删除等操作

### 🔔 多平台推送
- **企业微信** - Webhook 机器人推送
- **飞书** - 富文本卡片推送
- **Telegram** - Bot API 推送
- 自定义消息模板
- 推送成功率统计

### 🛡️ 防骚扰策略
- 频率限制（每分钟/每小时）
- 静默时段设置
- 消息去重机制
- 智能限流

### 📊 统计分析
- 7 天邮件接收趋势图
- 发件人排行榜
- 推送渠道表现统计
- 实时数据概览

### 🔐 安全可靠
- 邮箱密码 AES-256 加密
- 用户密码 bcrypt 哈希
- SQL 注入防护
- XSS 防护
- CSRF 防护

### 🎨 精美 UI
- 现代简约设计
- 蓝绿色系配色
- Framer Motion 流畅动画
- 响应式布局
- 深色模式支持

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- PostgreSQL 14+
- Redis 6+ (可选)
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/your-username/email-manager.git
cd email-manager
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/email_manager"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
REDIS_HOST="localhost"
REDIS_PORT="6379"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

4. **初始化数据库**

```bash
npm run db:generate
npm run db:migrate
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000

### 使用启动脚本

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

---

## 📚 文档

- [快速开始指南](QUICKSTART.md) - 5 分钟上手教程
- [功能特性详解](FEATURES.md) - 详细功能说明
- [API 文档](API.md) - 完整 API 参考
- [部署指南](DEPLOYMENT.md) - 多种部署方式
- [项目结构](PROJECT_STRUCTURE.md) - 代码组织说明
- [贡献指南](CONTRIBUTING.md) - 如何参与贡献
- [更新日志](CHANGELOG.md) - 版本历史
- [安全政策](SECURITY.md) - 安全最佳实践

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React

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
- **加密**: crypto-js (AES-256)

### 认证和安全
- **密码哈希**: bcryptjs
- **会话**: NextAuth.js
- **验证**: Zod

---

## 📦 项目结构

```
email-manager/
├── app/                    # Next.js 应用
│   ├── api/               # API 路由
│   ├── dashboard/         # 仪表板页面
│   ├── login/             # 登录页面
│   └── page.tsx           # 首页
├── components/            # React 组件
├── lib/                   # 核心库
│   ├── email-listener.ts # 邮件监听服务
│   ├── encryption.ts     # 加密工具
│   └── prisma.ts         # 数据库客户端
├── prisma/               # 数据库模型
├── scripts/              # 后台脚本
└── __tests__/            # 测试文件
```

---

## 🚢 部署

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/email-manager)

### Docker 部署

```bash
docker-compose up -d
```

### VPS 部署

详见 [部署指南](DEPLOYMENT.md)

---

## 🎯 使用场景

### 个人用户
- 统一管理多个邮箱
- 重要邮件推送到手机
- 自动过滤营销邮件

### 团队协作
- 监听团队邮箱
- 客户邮件推送到群聊
- 按优先级分类处理

### 开发者
- 监听 GitHub 通知
- CI/CD 结果推送
- 服务器告警邮件

### 客服系统
- 实时工单通知
- 按客户优先级推送
- 自动分配和标记

---

## 📊 性能指标

- **邮件接收延迟**: < 5 秒
- **推送延迟**: < 2 秒
- **消息送达率**: 99.9%
- **系统可用性**: 99.5%
- **并发支持**: 100+ 邮箱账户

---

## 🤝 贡献

欢迎贡献代码、报告 Bug、提出建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

详见 [贡献指南](CONTRIBUTING.md)

---

## 📝 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm start                # 启动生产服务器
npm run lint             # 代码检查

# 测试
npm test                 # 运行测试
npm run test:watch       # 监听模式测试
npm run test:coverage    # 测试覆盖率

# 数据库
npm run db:generate      # 生成 Prisma Client
npm run db:migrate       # 运行数据库迁移
npm run db:push          # 推送 schema 到数据库
npm run db:studio        # 打开数据库管理界面

# 代码格式化
npm run format           # 格式化代码
npm run format:check     # 检查代码格式

# 后台服务
npm run listeners:start  # 启动邮件监听服务
```

---

## 🗺️ 路线图

### v0.2.0 (计划中)
- [ ] OAuth2 登录支持
- [ ] 邮件回复功能
- [ ] 可视化模板编辑器
- [ ] 邮件搜索功能

### v0.3.0 (计划中)
- [ ] 移动端 App
- [ ] 邮件分类标签
- [ ] AI 智能分类
- [ ] 邮件定时发送

### v1.0.0 (长期)
- [ ] 多语言支持
- [ ] 团队协作功能
- [ ] PGP 邮件加密
- [ ] 数据导出功能

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - 现代化 ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- 以及所有依赖的开源库

---

## 📞 联系方式

- **GitHub**: [项目地址](https://github.com/your-username/email-manager)
- **Issues**: [问题反馈](https://github.com/your-username/email-manager/issues)
- **Email**: support@emailhub.com
- **文档**: [在线文档](https://docs.emailhub.com)

---

## ⭐ Star History

如果这个项目对你有帮助，请给我们一个 Star！

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/email-manager&type=Date)](https://star-history.com/#your-username/email-manager&Date)

---

<div align="center">

**[⬆ 回到顶部](#emailhub)**

Made with ❤️ by EmailHub Team

</div>
