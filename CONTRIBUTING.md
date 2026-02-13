# 贡献指南

感谢你对 EmailHub 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](https://github.com/your-username/email-manager/issues) 是否已有相同问题
2. 如果没有，创建新 Issue，包含：
   - Bug 描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、Node.js 版本等）
   - 截图（如果适用）

### 提出新功能

如果你有新功能建议：

1. 创建 Feature Request Issue
2. 描述功能的使用场景
3. 说明为什么需要这个功能
4. 提供可能的实现方案（可选）

### 提交代码

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目
   git clone https://github.com/your-username/email-manager.git
   cd email-manager
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发和测试**
   ```bash
   npm install
   npm run dev
   # 进行开发和测试
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # 或
   git commit -m "fix: fix bug description"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

5. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 描述你的改动
   - 关联相关 Issue（如果有）

## 开发规范

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks

### 命名规范

- **文件名**: kebab-case（例如：`email-listener.ts`）
- **组件名**: PascalCase（例如：`EmailList`）
- **函数名**: camelCase（例如：`fetchEmails`）
- **常量**: UPPER_SNAKE_CASE（例如：`MAX_RETRY_COUNT`）

### 目录结构

```
email-manager/
├── app/                    # Next.js 页面和 API
│   ├── api/               # API 路由
│   ├── dashboard/         # 仪表板页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # UI 组件
├── lib/                   # 工具函数和服务
│   ├── prisma.ts         # Prisma 客户端
│   ├── encryption.ts     # 加密工具
│   └── email-listener.ts # 邮件监听服务
├── prisma/               # 数据库模型
│   └── schema.prisma
└── public/               # 静态资源
```

### 提交前检查

- [ ] 代码通过 ESLint 检查
- [ ] 代码格式化（Prettier）
- [ ] 功能测试通过
- [ ] 没有 console.log 等调试代码
- [ ] 更新相关文档（如果需要）

## 开发环境设置

### 前置要求

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Git

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
   # 编辑 .env 文件
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

## 测试

### 运行测试

```bash
# 单元测试
npm test

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e
```

### 编写测试

- 为新功能编写测试
- 确保测试覆盖率 > 80%
- 使用有意义的测试描述

## 文档

### 更新文档

如果你的改动影响到：

- **功能**: 更新 `FEATURES.md`
- **使用方法**: 更新 `QUICKSTART.md`
- **部署**: 更新 `DEPLOYMENT.md`
- **API**: 更新 API 文档

### 文档风格

- 使用清晰简洁的语言
- 提供代码示例
- 包含截图（如果适用）
- 保持中英文一致

## 社区准则

### 行为准则

- 尊重他人
- 保持友善和专业
- 接受建设性批评
- 关注项目目标

### 沟通渠道

- **GitHub Issues**: Bug 报告和功能请求
- **GitHub Discussions**: 一般讨论和问题
- **Pull Requests**: 代码审查和讨论

## 版本发布

### 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 发布流程

1. 更新版本号（`package.json`）
2. 更新 CHANGELOG.md
3. 创建 Git Tag
4. 发布到 npm（如果适用）
5. 创建 GitHub Release

## 获取帮助

如果你在贡献过程中遇到问题：

1. 查看现有文档
2. 搜索 Issues 和 Discussions
3. 创建新 Issue 提问
4. 联系维护者

## 致谢

感谢所有为 EmailHub 做出贡献的开发者！

你的贡献将被记录在 [Contributors](https://github.com/your-username/email-manager/graphs/contributors) 页面。

---

再次感谢你的贡献！🎉
