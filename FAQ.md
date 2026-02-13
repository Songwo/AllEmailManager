# EmailHub - 常见问题解答 (FAQ)

## 目录

- [安装和配置](#安装和配置)
- [邮箱配置](#邮箱配置)
- [推送配置](#推送配置)
- [过滤规则](#过滤规则)
- [故障排查](#故障排查)
- [性能优化](#性能优化)
- [安全问题](#安全问题)
- [其他问题](#其他问题)

---

## 安装和配置

### Q: 系统要求是什么？

**A:**
- **Node.js**: 20.0.0 或更高版本
- **PostgreSQL**: 14.0 或更高版本
- **Redis**: 6.0 或更高版本（可选，用于缓存和队列）
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间

### Q: 如何快速开始？

**A:** 使用启动脚本：

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

脚本会自动检查环境并引导你完成配置。

### Q: 数据库连接失败怎么办？

**A:** 检查以下几点：

1. **PostgreSQL 是否运行**
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql

   # Windows
   services.msc  # 查找 PostgreSQL 服务
   ```

2. **DATABASE_URL 是否正确**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/email_manager"
   ```

3. **数据库是否存在**
   ```bash
   psql -U postgres -c "CREATE DATABASE email_manager;"
   ```

4. **运行数据库迁移**
   ```bash
   npm run db:migrate
   ```

### Q: 如何更改端口？

**A:** 修改 `next.config.ts` 或使用环境变量：

```bash
PORT=3001 npm run dev
```

---

## 邮箱配置

### Q: 支持哪些邮箱提供商？

**A:** 目前支持：
- Gmail
- Outlook / Hotmail
- QQ 邮箱
- 163 邮箱
- 126 邮箱
- iCloud
- Yahoo
- 自定义 IMAP/SMTP 服务器

### Q: Gmail 连接失败，提示"认证失败"？

**A:** Gmail 需要使用应用专用密码：

1. 访问 https://myaccount.google.com/security
2. 启用两步验证
3. 生成应用专用密码：
   - 选择"邮件"
   - 选择设备
   - 复制生成的 16 位密码
4. 在 EmailHub 中使用这个密码，而不是账户密码

### Q: QQ 邮箱如何获取授权码？

**A:**

1. 登录 QQ 邮箱网页版
2. 设置 → 账户
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启 IMAP/SMTP 服务
5. 生成授权码（16 位字符）
6. 使用授权码作为密码

### Q: Outlook 邮箱配置参数是什么？

**A:**
```
IMAP 主机: outlook.office365.com
IMAP 端口: 993
SMTP 主机: smtp.office365.com
SMTP 端口: 587
密码: 使用账户密码
```

### Q: 如何添加自定义邮箱？

**A:**

1. 选择"自定义"提供商
2. 填写 IMAP/SMTP 配置：
   - IMAP 主机和端口
   - SMTP 主机和端口（可选）
   - 邮箱地址和密码
3. 点击"测试并添加"

### Q: 邮箱连接后多久开始接收邮件？

**A:** 立即开始。系统使用 IMAP IDLE 协议实时监听，新邮件通常在 5 秒内到达。

### Q: 可以添加多少个邮箱？

**A:** 理论上无限制，但建议：
- 个人使用：3-5 个
- 团队使用：10-20 个
- 企业使用：根据服务器资源调整

---

## 推送配置

### Q: 如何创建企业微信机器人？

**A:**

1. 在企业微信群聊中，点击右上角"..."
2. 选择"群机器人" → "添加机器人"
3. 设置机器人名称和头像
4. 复制 Webhook 地址
5. 在 EmailHub 中添加推送渠道，粘贴 Webhook URL

**Webhook URL 格式:**
```
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx
```

### Q: 如何创建飞书机器人？

**A:**

1. 在飞书群聊中，点击右上角设置
2. 选择"群机器人" → "添加机器人"
3. 选择"自定义机器人"
4. 设置机器人名称
5. 复制 Webhook 地址
6. 在 EmailHub 中添加推送渠道

**Webhook URL 格式:**
```
https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx
```

### Q: 如何创建 Telegram Bot？

**A:**

1. 在 Telegram 中搜索 @BotFather
2. 发送 `/newbot` 命令
3. 按提示设置机器人名称
4. 获取 Bot Token（格式：123456:ABC-DEF...）
5. 获取 Chat ID：
   - 搜索 @userinfobot
   - 发送任意消息
   - 获取你的 Chat ID
6. 在 EmailHub 中填写 Bot Token 和 Chat ID

### Q: 推送失败怎么办？

**A:** 检查以下几点：

1. **Webhook URL 是否正确**
   - 复制时不要有多余空格
   - 确保 URL 完整

2. **网络是否可达**
   ```bash
   curl -X POST "你的Webhook URL" \
     -H "Content-Type: application/json" \
     -d '{"msgtype":"text","text":{"content":"Test"}}'
   ```

3. **是否触发频率限制**
   - 查看系统设置中的频率限制
   - 查看推送日志

4. **消息格式是否正确**
   - 检查自定义模板语法
   - 使用默认模板测试

### Q: 如何自定义推送消息模板？

**A:** 在推送渠道配置中，使用以下变量：

```
{from}     - 发件人
{subject}  - 邮件主题
{time}     - 接收时间
{preview}  - 邮件预览（前 100 字符）
```

**示例模板:**
```
📧 新邮件提醒

发件人: {from}
主题: {subject}
时间: {time}

{preview}
```

### Q: 推送消息太多怎么办？

**A:** 配置防骚扰策略：

1. **设置频率限制**
   - 系统设置 → 频率限制
   - 每分钟最大推送数：10
   - 每小时最大推送数：100

2. **配置静默时段**
   - 系统设置 → 通知设置
   - 静默时段：22:00 - 08:00

3. **优化过滤规则**
   - 只推送重要邮件
   - 营销邮件标记已读不推送

---

## 过滤规则

### Q: 如何创建过滤规则？

**A:**

1. 访问"过滤规则"页面
2. 点击"创建规则"
3. 设置规则名称和优先级
4. 配置匹配条件：
   - 发件人（支持多个，逗号分隔）
   - 主题关键词
   - 正文关键词
5. 选择执行动作：
   - 推送到哪些渠道
   - 是否标记已读
   - 是否删除邮件
6. 点击"创建规则"

### Q: 规则优先级如何工作？

**A:**
- 数字越大，优先级越高
- 系统按优先级从高到低匹配
- 只执行第一个匹配的规则
- 建议：
  - 重要规则：优先级 10
  - 普通规则：优先级 5
  - 过滤规则：优先级 1

### Q: 如何过滤营销邮件？

**A:** 创建低优先级规则：

**条件:**
```
关键词: 促销, 优惠, 折扣, marketing, unsubscribe
```

**动作:**
```
✓ 标记为已读
✗ 不推送
```

### Q: 如何只推送重要邮件？

**A:** 创建高优先级规则：

**条件:**
```
发件人: boss@company.com, client@important.com
主题: urgent, 紧急, ASAP
```

**动作:**
```
✓ 推送到所有渠道
✗ 不标记已读（需要手动处理）
```

### Q: 规则不生效怎么办？

**A:** 检查：

1. **规则是否激活**
   - 查看规则列表中的状态

2. **条件是否正确**
   - 发件人地址是否完整
   - 关键词是否正确（区分大小写）

3. **优先级是否合理**
   - 高优先级规则可能先匹配

4. **查看匹配统计**
   - 规则列表显示"已匹配 X 封邮件"

---

## 故障排查

### Q: 页面加载很慢？

**A:**

1. **清除浏览器缓存**
   - Ctrl+Shift+Delete

2. **检查网络连接**
   ```bash
   ping localhost
   ```

3. **查看服务器资源**
   ```bash
   npm run health:check
   ```

4. **优化数据库**
   ```bash
   npm run data:cleanup
   ```

### Q: 邮件接收延迟？

**A:**

1. **检查邮箱连接状态**
   - 仪表板 → 邮箱管理
   - 查看连接状态

2. **查看系统告警**
   ```bash
   npm run stats:report | grep "System Alerts"
   ```

3. **重启监听器**
   ```bash
   # 停止
   curl -X POST http://localhost:3000/api/listener \
     -H "Content-Type: application/json" \
     -d '{"accountId":"xxx","action":"stop"}'

   # 启动
   curl -X POST http://localhost:3000/api/listener \
     -H "Content-Type: application/json" \
     -d '{"accountId":"xxx","action":"start"}'
   ```

### Q: 数据库错误？

**A:**

1. **检查数据库连接**
   ```bash
   psql -U user -d email_manager -c "SELECT 1;"
   ```

2. **运行数据库迁移**
   ```bash
   npm run db:migrate
   ```

3. **重新生成 Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **查看数据库日志**
   ```bash
   tail -f /var/log/postgresql/postgresql-14-main.log
   ```

### Q: 内存占用过高？

**A:**

1. **查看进程状态**
   ```bash
   pm2 monit
   ```

2. **清理旧数据**
   ```bash
   npm run data:cleanup
   ```

3. **重启应用**
   ```bash
   pm2 restart email-manager
   ```

4. **增加内存限制**
   ```bash
   node --max-old-space-size=4096 dist/server.js
   ```

---

## 性能优化

### Q: 如何提高系统性能？

**A:**

1. **启用 Redis 缓存**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

2. **定期清理数据**
   ```bash
   npm run data:cleanup
   ```

3. **优化数据库**
   ```bash
   # 添加索引
   psql -U user -d email_manager -f scripts/optimize-db.sql
   ```

4. **使用 PM2 集群模式**
   ```bash
   pm2 start ecosystem.config.js
   ```

### Q: 如何减少数据库大小？

**A:**

1. **清理旧邮件**
   ```bash
   npm run data:cleanup
   ```

2. **手动清理**
   ```sql
   -- 删除 30 天前的已读邮件
   DELETE FROM "Email"
   WHERE "isRead" = true
   AND "receivedAt" < NOW() - INTERVAL '30 days';

   -- 清理推送日志
   DELETE FROM "PushLog"
   WHERE "pushedAt" < NOW() - INTERVAL '7 days';
   ```

3. **数据库压缩**
   ```sql
   VACUUM FULL;
   ANALYZE;
   ```

### Q: 如何监控系统性能？

**A:**

1. **使用健康检查**
   ```bash
   npm run health:check
   ```

2. **查看统计报告**
   ```bash
   npm run stats:report
   ```

3. **监控数据库**
   ```bash
   psql -U user -d email_manager -c "
   SELECT * FROM pg_stat_activity
   WHERE datname = 'email_manager';
   "
   ```

4. **使用 PM2 监控**
   ```bash
   pm2 monit
   ```

---

## 安全问题

### Q: 密码如何存储？

**A:**
- **邮箱密码**: AES-256 加密存储
- **用户密码**: bcrypt 哈希（10 轮）
- **加密密钥**: 存储在环境变量中

### Q: 如何更改加密密钥？

**A:**

1. **生成新密钥**
   ```bash
   openssl rand -hex 16
   ```

2. **更新 .env 文件**
   ```env
   ENCRYPTION_KEY="new-32-character-key"
   ```

3. **重新加密所有密码**
   ```bash
   npm run migrate:reencrypt
   ```

4. **重启应用**
   ```bash
   pm2 restart email-manager
   ```

### Q: 如何启用 HTTPS？

**A:**

**使用 Nginx 反向代理:**

1. **安装 Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **获取 SSL 证书**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Nginx 配置**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

### Q: 如何防止暴力破解？

**A:**

1. **使用强密码**
   - 至少 8 位字符
   - 包含大小写字母、数字、特殊字符

2. **启用频率限制**
   - 系统设置 → 频率限制

3. **使用 Nginx 限流**
   ```nginx
   limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

   location /api/auth {
       limit_req zone=login burst=3;
   }
   ```

4. **监控访问日志**
   ```bash
   tail -f /var/log/nginx/access.log | grep "/api/auth"
   ```

---

## 其他问题

### Q: 如何备份数据？

**A:**

```bash
# 自动备份
npm run db:backup

# 手动备份
pg_dump -U user email_manager > backup.sql

# 恢复备份
psql -U user email_manager < backup.sql
```

### Q: 如何迁移到新服务器？

**A:**

1. **备份数据**
   ```bash
   npm run db:backup
   cp .env .env.backup
   ```

2. **在新服务器上安装**
   ```bash
   git clone https://github.com/your-username/email-manager.git
   cd email-manager
   npm install
   ```

3. **恢复配置和数据**
   ```bash
   cp .env.backup .env
   psql -U user email_manager < backup.sql
   ```

4. **启动应用**
   ```bash
   npm run build
   pm2 start npm --name "email-manager" -- start
   ```

### Q: 如何更新到新版本？

**A:**

```bash
# 1. 备份数据
npm run db:backup

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖
npm install

# 4. 运行数据库迁移
npm run db:migrate

# 5. 重新构建
npm run build

# 6. 重启应用
pm2 restart email-manager
```

### Q: 如何卸载？

**A:**

```bash
# 1. 停止应用
pm2 stop email-manager
pm2 delete email-manager

# 2. 删除数据库
psql -U postgres -c "DROP DATABASE email_manager;"

# 3. 删除文件
rm -rf /path/to/email-manager

# 4. 删除 Nginx 配置（如果有）
sudo rm /etc/nginx/sites-enabled/email-manager
sudo systemctl reload nginx
```

### Q: 支持多语言吗？

**A:** 当前版本主要支持中文，多语言支持在开发计划中（v1.0.0）。

### Q: 有移动端 App 吗？

**A:** 移动端 App 在开发计划中（v0.3.0），当前可以通过浏览器访问响应式网页版。

### Q: 如何贡献代码？

**A:**

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 开启 Pull Request

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

### Q: 如何报告 Bug？

**A:**

1. 访问 [GitHub Issues](https://github.com/your-username/email-manager/issues)
2. 点击"New Issue"
3. 选择"Bug Report"模板
4. 填写详细信息
5. 提交 Issue

### Q: 如何获取技术支持？

**A:**

- **文档**: 查看项目文档目录
- **GitHub Issues**: 提交问题
- **Email**: support@emailhub.com
- **社区**: GitHub Discussions

---

## 还有其他问题？

如果你的问题没有在这里找到答案：

1. 查看完整文档：
   - [README.md](README.md)
   - [QUICKSTART.md](QUICKSTART.md)
   - [DEPLOYMENT.md](DEPLOYMENT.md)
   - [MAINTENANCE.md](MAINTENANCE.md)

2. 搜索 GitHub Issues：
   - https://github.com/your-username/email-manager/issues

3. 提交新 Issue：
   - https://github.com/your-username/email-manager/issues/new

4. 联系支持：
   - support@emailhub.com

---

**最后更新**: 2026-02-13
