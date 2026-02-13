# EmailHub - API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (计划中)

## API 端点

### 1. 用户认证

#### 1.1 用户注册

```http
POST /api/auth?action=register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "name": "用户名",
  "password": "password123"
}
```

**响应:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "用户名",
  "createdAt": "2026-02-13T12:00:00.000Z"
}
```

#### 1.2 用户登录

```http
POST /api/auth?action=login
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "用户名"
}
```

---

### 2. 邮箱账户管理

#### 2.1 获取邮箱列表

```http
GET /api/email-accounts?userId={userId}
```

**响应:**
```json
[
  {
    "id": "account_id",
    "email": "work@example.com",
    "provider": "gmail",
    "status": "connected",
    "isActive": true,
    "lastSyncAt": "2026-02-13T12:00:00.000Z",
    "createdAt": "2026-02-13T10:00:00.000Z"
  }
]
```

#### 2.2 添加邮箱账户

```http
POST /api/email-accounts
```

**请求体:**
```json
{
  "userId": "user_id",
  "email": "work@gmail.com",
  "provider": "gmail",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "password": "app_specific_password"
}
```

**响应:**
```json
{
  "id": "account_id",
  "email": "work@gmail.com",
  "provider": "gmail",
  "status": "connected",
  "isActive": true
}
```

---

### 3. 邮件管理

#### 3.1 获取邮件列表

```http
GET /api/emails?emailAccountId={accountId}&isRead={true|false}&limit={50}&offset={0}
```

**查询参数:**
- `emailAccountId` (可选): 邮箱账户 ID
- `isRead` (可选): 是否已读
- `limit` (可选): 每页数量，默认 50
- `offset` (可选): 偏移量，默认 0

**响应:**
```json
{
  "emails": [
    {
      "id": "email_id",
      "from": "sender@example.com",
      "to": ["recipient@example.com"],
      "subject": "邮件主题",
      "textContent": "邮件正文",
      "receivedAt": "2026-02-13T12:00:00.000Z",
      "isRead": false,
      "hasAttachments": false,
      "emailAccount": {
        "email": "work@gmail.com",
        "provider": "gmail"
      },
      "pushLogs": []
    }
  ],
  "total": 100
}
```

#### 3.2 标记邮件已读

```http
PATCH /api/emails
```

**请求体:**
```json
{
  "id": "email_id",
  "isRead": true
}
```

#### 3.3 删除邮件

```http
DELETE /api/emails?id={email_id}
```

#### 3.4 邮件操作（标记已读/删除/回复）

```http
POST /api/emails/{email_id}
```

**请求体:**
```json
{
  "action": "markAsRead",  // 或 "delete", "reply"
  "data": {
    "content": "回复内容"  // 仅 reply 需要
  }
}
```

---

### 4. 推送渠道管理

#### 4.1 获取推送渠道列表

```http
GET /api/push-channels?userId={userId}
```

**响应:**
```json
[
  {
    "id": "channel_id",
    "name": "企业微信通知",
    "type": "wechat",
    "isActive": true,
    "config": {
      "webhookUrl": "https://qyapi.weixin.qq.com/..."
    },
    "cardTemplate": "自定义模板",
    "createdAt": "2026-02-13T10:00:00.000Z"
  }
]
```

#### 4.2 添加推送渠道

```http
POST /api/push-channels
```

**请求体 (企业微信):**
```json
{
  "userId": "user_id",
  "type": "wechat",
  "name": "企业微信通知",
  "config": {
    "webhookUrl": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
  },
  "cardTemplate": "📧 新邮件\n\n发件人: {from}\n主题: {subject}"
}
```

**请求体 (飞书):**
```json
{
  "userId": "user_id",
  "type": "feishu",
  "name": "飞书工作群",
  "config": {
    "webhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/..."
  }
}
```

**请求体 (Telegram):**
```json
{
  "userId": "user_id",
  "type": "telegram",
  "name": "Telegram 个人",
  "config": {
    "botToken": "123456:ABC-DEF...",
    "chatId": "123456789"
  }
}
```

#### 4.3 更新推送渠道

```http
PATCH /api/push-channels
```

**请求体:**
```json
{
  "id": "channel_id",
  "isActive": false,
  "cardTemplate": "新模板"
}
```

---

### 5. 过滤规则管理

#### 5.1 获取过滤规则列表

```http
GET /api/filter-rules?userId={userId}
```

**响应:**
```json
[
  {
    "id": "rule_id",
    "name": "重要客户邮件",
    "isActive": true,
    "priority": 10,
    "conditions": {
      "sender": ["client@important.com"],
      "subject": ["urgent", "紧急"],
      "keywords": ["重要"]
    },
    "actions": {
      "pushChannels": ["channel_id_1", "channel_id_2"],
      "markAsRead": false,
      "delete": false
    },
    "createdAt": "2026-02-13T10:00:00.000Z"
  }
]
```

#### 5.2 创建过滤规则

```http
POST /api/filter-rules
```

**请求体:**
```json
{
  "userId": "user_id",
  "name": "重要客户邮件",
  "priority": 10,
  "conditions": {
    "sender": ["client@important.com", "vip@company.com"],
    "subject": ["urgent", "紧急"],
    "keywords": ["重要", "ASAP"]
  },
  "actions": {
    "pushChannels": ["channel_id_1"],
    "markAsRead": false,
    "delete": false
  }
}
```

#### 5.3 更新过滤规则

```http
PATCH /api/filter-rules
```

**请求体:**
```json
{
  "id": "rule_id",
  "isActive": false,
  "priority": 5
}
```

#### 5.4 删除过滤规则

```http
DELETE /api/filter-rules?id={rule_id}
```

---

### 6. 统计分析

#### 6.1 获取统计数据

```http
GET /api/analytics?userId={userId}
```

**响应:**
```json
{
  "overview": {
    "totalEmails": 1247,
    "unreadEmails": 23,
    "todayEmails": 45,
    "activeAccounts": 3
  },
  "pushStats": {
    "totalPushes": 479,
    "successfulPushes": 477,
    "successRate": "99.6"
  },
  "emailTrend": [
    {
      "date": "2026-02-07",
      "count": 45
    },
    {
      "date": "2026-02-08",
      "count": 52
    }
  ],
  "topSenders": [
    {
      "sender": "notifications@github.com",
      "count": 234
    }
  ]
}
```

---

### 7. 系统告警

#### 7.1 获取告警列表

```http
GET /api/alerts
```

**响应:**
```json
[
  {
    "id": "alert_id",
    "type": "email_disconnect",
    "severity": "error",
    "message": "邮箱连接断开: work@gmail.com",
    "metadata": {
      "accountId": "account_id",
      "error": "Authentication failed"
    },
    "isResolved": false,
    "createdAt": "2026-02-13T12:00:00.000Z"
  }
]
```

#### 7.2 标记告警已解决

```http
PATCH /api/alerts
```

**请求体:**
```json
{
  "id": "alert_id"
}
```

---

### 8. 系统设置

#### 8.1 获取设置

```http
GET /api/settings?userId={userId}
```

**响应:**
```json
{
  "notifications": {
    "emailNotifications": true,
    "pushNotifications": true,
    "soundEnabled": false,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  },
  "rateLimit": {
    "maxPerMinute": 10,
    "maxPerHour": 100
  },
  "security": {
    "twoFactorEnabled": false,
    "sessionTimeout": 30
  },
  "general": {
    "language": "zh-CN",
    "timezone": "Asia/Shanghai",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

#### 8.2 更新设置

```http
POST /api/settings
```

**请求体:**
```json
{
  "userId": "user_id",
  "notifications": {
    "emailNotifications": true,
    "quietHoursStart": "23:00",
    "quietHoursEnd": "07:00"
  },
  "rateLimit": {
    "maxPerMinute": 15
  }
}
```

---

### 9. 监听器管理

#### 9.1 启动/停止监听器

```http
POST /api/listener
```

**请求体 (启动):**
```json
{
  "accountId": "account_id",
  "action": "start"
}
```

**请求体 (停止):**
```json
{
  "accountId": "account_id",
  "action": "stop"
}
```

**响应:**
```json
{
  "success": true,
  "message": "Listener started"
}
```

---

## 错误响应

所有 API 在出错时返回统一格式：

```json
{
  "error": "错误描述信息"
}
```

**常见 HTTP 状态码:**
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 数据验证

所有 API 使用 Zod 进行数据验证，确保：
- 必填字段存在
- 数据类型正确
- 格式符合要求（如邮箱格式）
- 数值在合理范围内

---

## 速率限制

- **默认限制**: 每分钟 60 次请求
- **推送限制**: 可在系统设置中配置
- **超出限制**: 返回 429 状态码

---

## 安全建议

1. **使用 HTTPS**: 生产环境必须使用 HTTPS
2. **保护 API 密钥**: 不要在客户端暴露敏感信息
3. **验证输入**: 始终验证用户输入
4. **限制访问**: 实施适当的访问控制
5. **日志记录**: 记录所有 API 调用

---

## 示例代码

### JavaScript/TypeScript

```typescript
// 添加邮箱账户
async function addEmailAccount(data: any) {
  const response = await fetch('/api/email-accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}

// 获取邮件列表
async function getEmails(userId: string) {
  const response = await fetch(`/api/emails?userId=${userId}&limit=50`)
  const data = await response.json()
  return data.emails
}

// 创建过滤规则
async function createFilterRule(rule: any) {
  const response = await fetch('/api/filter-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  })

  return response.json()
}
```

### Python

```python
import requests

# 添加邮箱账户
def add_email_account(data):
    response = requests.post(
        'http://localhost:3000/api/email-accounts',
        json=data
    )
    response.raise_for_status()
    return response.json()

# 获取邮件列表
def get_emails(user_id):
    response = requests.get(
        f'http://localhost:3000/api/emails?userId={user_id}'
    )
    return response.json()['emails']

# 创建推送渠道
def create_push_channel(channel):
    response = requests.post(
        'http://localhost:3000/api/push-channels',
        json=channel
    )
    return response.json()
```

### cURL

```bash
# 用户注册
curl -X POST http://localhost:3000/api/auth?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "用户名",
    "password": "password123"
  }'

# 添加邮箱账户
curl -X POST http://localhost:3000/api/email-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "email": "work@gmail.com",
    "provider": "gmail",
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "password": "app_password"
  }'

# 获取邮件列表
curl http://localhost:3000/api/emails?userId=user_id&limit=10

# 创建过滤规则
curl -X POST http://localhost:3000/api/filter-rules \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "name": "重要邮件",
    "priority": 10,
    "conditions": {
      "sender": ["important@example.com"]
    },
    "actions": {
      "pushChannels": ["channel_id"]
    }
  }'
```

---

## Webhook 回调

### 推送平台 Webhook 格式

**企业微信:**
```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "📧 **新邮件**\n\n**发件人:** sender@example.com\n**主题:** 邮件主题"
  }
}
```

**飞书:**
```json
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {
        "tag": "plain_text",
        "content": "📧 新邮件通知"
      }
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "lark_md",
          "content": "**发件人:** sender@example.com"
        }
      }
    ]
  }
}
```

**Telegram:**
```json
{
  "chat_id": "123456789",
  "text": "📧 <b>新邮件</b>\n\n<b>发件人:</b> sender@example.com",
  "parse_mode": "HTML"
}
```

---

## 更新日志

### v0.1.0 (2026-02-13)
- 初始 API 版本
- 支持所有核心功能

---

## 技术支持

如有 API 相关问题，请：
- 查看 [项目文档](../README.md)
- 提交 [GitHub Issue](https://github.com/your-username/email-manager/issues)
- 联系技术支持: api@emailhub.com
