# EmailHub - 维护和运维指南

## 日常维护任务

### 1. 健康检查

定期检查系统健康状态：

```bash
npm run health:check
```

**检查项目：**
- ✅ 数据库连接
- ✅ Redis 连接
- ✅ 邮箱账户状态
- ✅ 推送渠道状态
- ✅ 系统告警

**输出示例：**
```
🏥 EmailHub Health Check
========================

✅ Database
   Database connection successful
   Details: { users: 5, emails: 1247 }

⚠️ Redis
   Redis connection failed (Optional service)

✅ Email Accounts
   3 connected, 0 disconnected, 0 errors

✅ Push Channels
   3 active channels, 99.5% success rate (last hour)

✅ System Alerts
   0 unresolved alerts

========================
Overall Status: ✅ HEALTHY
```

### 2. 数据统计报告

生成系统使用统计报告：

```bash
npm run stats:report
```

**报告内容：**
- 用户统计
- 邮箱账户统计
- 邮件统计
- 推送渠道统计
- 推送成功率
- 过滤规则统计
- 系统告警统计
- 发件人排行榜

**输出示例：**
```
📊 EmailHub Statistics Report
=============================
Generated at: 2026-02-13 22:00:00

👥 Users
   Total: 5

📧 Email Accounts
   Total: 8
   Active: 7
   Connected: 6

✉️  Emails
   Total: 1247
   Unread: 23
   Today: 45

📤 Push Channels
   Total: 5
   Active: 4
   wechat: 2
   feishu: 1
   telegram: 2

📊 Push Statistics
   Total pushes: 479
   Successful: 477
   Failed: 2
   Success rate: 99.58%

🎯 Filter Rules
   Total: 12
   Active: 10

🔔 System Alerts
   Total: 15
   Unresolved: 0

📬 Top Senders (Last 30 Days)
   1. notifications@github.com (234 emails)
   2. no-reply@vercel.com (156 emails)
   3. alerts@aws.amazon.com (123 emails)
```

### 3. 数据库备份

定期备份数据库：

```bash
npm run db:backup
```

**备份策略：**
- 自动保留最近 7 天的备份
- 备份文件存储在 `backups/` 目录
- 文件名格式：`backup_YYYY-MM-DD-HH-mm-ss.sql`

**输出示例：**
```
📦 EmailHub Database Backup
===========================

✅ Created backup directory: /path/to/backups

📝 Backup file: backup_2026-02-13-22-00-00.sql
🗄️  Database: email_manager
🖥️  Host: localhost:5432

⏳ Creating backup...
✅ Backup created successfully!
📊 Size: 15.32 MB

🧹 Cleaning old backups...
   Deleted: backup_2026-02-06-22-00-00.sql
✅ Kept 7 most recent backups
```

**恢复备份：**
```bash
psql -U user -d email_manager < backups/backup_2026-02-13-22-00-00.sql
```

### 4. 数据清理

清理旧数据以保持性能：

```bash
npm run data:cleanup
```

**清理规则：**
- 已读邮件：保留 30 天
- 推送日志：保留 7 天
- 频率限制日志：保留 24 小时
- 已解决告警：保留 30 天

**输出示例：**
```
🧹 EmailHub Data Cleanup
========================

📧 Cleaning up old read emails (30+ days)...
   Deleted 456 emails

📤 Cleaning up old push logs (7+ days)...
   Deleted 1234 push logs

🚦 Cleaning up old rate limit logs (24+ hours)...
   Deleted 567 rate limit logs

🔔 Cleaning up resolved alerts (30+ days)...
   Deleted 12 resolved alerts

========================
✅ Cleanup completed successfully!

Summary:
  - Emails deleted: 456
  - Push logs deleted: 1234
  - Rate limit logs deleted: 567
  - Resolved alerts deleted: 12
  - Total records deleted: 2269
```

---

## 定期维护计划

### 每日任务

```bash
# 健康检查
npm run health:check

# 查看系统告警
npm run stats:report | grep "System Alerts" -A 5
```

### 每周任务

```bash
# 完整统计报告
npm run stats:report

# 数据库备份
npm run db:backup

# 数据清理
npm run data:cleanup
```

### 每月任务

```bash
# 检查依赖更新
npm outdated

# 安全审计
npm audit

# 性能分析
npm run stats:report
```

---

## 自动化维护

### 使用 Cron 定时任务

**Linux/Mac:**

编辑 crontab：
```bash
crontab -e
```

添加定时任务：
```cron
# 每天凌晨 2 点备份数据库
0 2 * * * cd /path/to/email-manager && npm run db:backup

# 每天凌晨 3 点清理数据
0 3 * * * cd /path/to/email-manager && npm run data:cleanup

# 每小时健康检查
0 * * * * cd /path/to/email-manager && npm run health:check

# 每周一生成统计报告
0 9 * * 1 cd /path/to/email-manager && npm run stats:report > /var/log/emailhub-report.log
```

**Windows:**

使用任务计划程序：
```powershell
# 创建每日备份任务
schtasks /create /tn "EmailHub Backup" /tr "cd C:\path\to\email-manager && npm run db:backup" /sc daily /st 02:00

# 创建每日清理任务
schtasks /create /tn "EmailHub Cleanup" /tr "cd C:\path\to\email-manager && npm run data:cleanup" /sc daily /st 03:00
```

---

## 监控和告警

### 1. 系统告警

查看未解决的告警：

```bash
npm run stats:report | grep "System Alerts" -A 10
```

**告警类型：**
- `email_disconnect` - 邮箱连接断开
- `push_failed` - 推送失败
- `rate_limit` - 触发频率限制
- `auth_error` - 认证错误

### 2. 性能监控

**数据库性能：**
```bash
# 查看慢查询
psql -U user -d email_manager -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 查看数据库大小
psql -U user -d email_manager -c "SELECT pg_size_pretty(pg_database_size('email_manager'));"

# 查看表大小
psql -U user -d email_manager -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**应用性能：**
```bash
# 查看 PM2 进程状态
pm2 status

# 查看内存使用
pm2 monit

# 查看日志
pm2 logs email-manager --lines 100
```

### 3. 日志管理

**查看应用日志：**
```bash
# PM2 日志
pm2 logs email-manager

# Docker 日志
docker-compose logs -f app

# 系统日志
tail -f /var/log/emailhub.log
```

**日志轮转配置：**

创建 `/etc/logrotate.d/emailhub`：
```
/var/log/emailhub.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 故障排查

### 1. 邮箱连接失败

**检查步骤：**
```bash
# 1. 查看邮箱状态
npm run stats:report | grep "Email Accounts" -A 5

# 2. 查看系统告警
npm run stats:report | grep "System Alerts" -A 10

# 3. 测试 IMAP 连接
telnet imap.gmail.com 993

# 4. 检查防火墙
sudo ufw status

# 5. 查看应用日志
pm2 logs email-manager | grep -i "imap"
```

**常见原因：**
- 密码错误或过期
- IMAP 服务未启用
- 防火墙阻止连接
- 网络问题

### 2. 推送失败

**检查步骤：**
```bash
# 1. 查看推送统计
npm run stats:report | grep "Push Statistics" -A 10

# 2. 测试 Webhook
curl -X POST https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx \
  -H "Content-Type: application/json" \
  -d '{"msgtype":"text","text":{"content":"Test"}}'

# 3. 查看推送日志
psql -U user -d email_manager -c "SELECT * FROM \"PushLog\" WHERE status = 'failed' ORDER BY \"pushedAt\" DESC LIMIT 10;"
```

**常见原因：**
- Webhook URL 错误
- 网络连接问题
- 触发频率限制
- 消息格式错误

### 3. 数据库性能问题

**检查步骤：**
```bash
# 1. 查看数据库连接
psql -U user -d email_manager -c "SELECT count(*) FROM pg_stat_activity;"

# 2. 查看慢查询
psql -U user -d email_manager -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 3. 查看表大小
npm run stats:report

# 4. 运行数据清理
npm run data:cleanup
```

**优化建议：**
- 定期清理旧数据
- 添加必要的索引
- 优化查询语句
- 增加数据库资源

### 4. 内存占用过高

**检查步骤：**
```bash
# 1. 查看进程内存
pm2 monit

# 2. 查看系统内存
free -h

# 3. 查看 Node.js 堆内存
node --max-old-space-size=4096 dist/server.js

# 4. 重启应用
pm2 restart email-manager
```

**优化建议：**
- 增加 Node.js 内存限制
- 优化代码减少内存泄漏
- 使用 Redis 缓存
- 定期重启应用

---

## 性能优化

### 1. 数据库优化

**添加索引：**
```sql
-- 邮件查询优化
CREATE INDEX idx_email_received_at ON "Email"("receivedAt" DESC);
CREATE INDEX idx_email_is_read ON "Email"("isRead");

-- 推送日志优化
CREATE INDEX idx_push_log_pushed_at ON "PushLog"("pushedAt" DESC);
CREATE INDEX idx_push_log_status ON "PushLog"("status");

-- 系统告警优化
CREATE INDEX idx_alert_is_resolved ON "SystemAlert"("isResolved");
CREATE INDEX idx_alert_created_at ON "SystemAlert"("createdAt" DESC);
```

**数据库配置优化：**
```sql
-- 增加连接池
ALTER SYSTEM SET max_connections = 200;

-- 增加共享缓冲区
ALTER SYSTEM SET shared_buffers = '256MB';

-- 增加工作内存
ALTER SYSTEM SET work_mem = '16MB';

-- 重新加载配置
SELECT pg_reload_conf();
```

### 2. 应用优化

**PM2 配置：**

创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'email-manager',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

启动：
```bash
pm2 start ecosystem.config.js
```

### 3. Redis 缓存

**启用 Redis 缓存：**
```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379')
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
```

---

## 安全维护

### 1. 定期更新

```bash
# 检查依赖更新
npm outdated

# 更新依赖
npm update

# 安全审计
npm audit

# 修复安全问题
npm audit fix
```

### 2. 密钥轮换

**定期更换加密密钥：**
```bash
# 1. 生成新密钥
openssl rand -hex 16

# 2. 更新 .env 文件
ENCRYPTION_KEY="new-32-character-key"

# 3. 重新加密所有密码
npm run migrate:reencrypt

# 4. 重启应用
pm2 restart email-manager
```

### 3. 访问日志

**启用访问日志：**
```nginx
# Nginx 配置
access_log /var/log/nginx/emailhub-access.log;
error_log /var/log/nginx/emailhub-error.log;
```

**分析访问日志：**
```bash
# 查看访问量
cat /var/log/nginx/emailhub-access.log | wc -l

# 查看 IP 访问统计
cat /var/log/nginx/emailhub-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# 查看错误日志
tail -f /var/log/nginx/emailhub-error.log
```

---

## 灾难恢复

### 1. 数据恢复

**从备份恢复：**
```bash
# 1. 停止应用
pm2 stop email-manager

# 2. 恢复数据库
psql -U user -d email_manager < backups/backup_2026-02-13-22-00-00.sql

# 3. 重启应用
pm2 start email-manager

# 4. 验证数据
npm run health:check
```

### 2. 系统迁移

**迁移到新服务器：**
```bash
# 1. 备份数据
npm run db:backup

# 2. 导出配置
cp .env .env.backup

# 3. 在新服务器上安装依赖
npm ci --only=production

# 4. 恢复配置
cp .env.backup .env

# 5. 恢复数据库
psql -U user -d email_manager < backup.sql

# 6. 启动应用
npm run build
pm2 start npm --name "email-manager" -- start
```

---

## 维护检查清单

### 每日检查
- [ ] 运行健康检查
- [ ] 查看系统告警
- [ ] 检查邮箱连接状态
- [ ] 查看推送成功率

### 每周检查
- [ ] 生成统计报告
- [ ] 备份数据库
- [ ] 清理旧数据
- [ ] 查看错误日志
- [ ] 检查磁盘空间

### 每月检查
- [ ] 更新依赖包
- [ ] 安全审计
- [ ] 性能分析
- [ ] 检查备份完整性
- [ ] 审查访问日志

---

## 联系支持

如遇到无法解决的问题：

- **GitHub Issues**: https://github.com/your-username/email-manager/issues
- **Email**: support@emailhub.com
- **文档**: 查看项目文档目录

---

**最后更新**: 2026-02-13
