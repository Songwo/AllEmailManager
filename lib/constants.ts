export const emailProviders = [
  {
    name: 'Gmail',
    value: 'gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    instructions: '需要生成应用专用密码。前往 Google 账户 → 安全性 → 两步验证 → 应用专用密码'
  },
  {
    name: 'Outlook',
    value: 'outlook',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    instructions: '使用您的 Microsoft 账户密码'
  },
  {
    name: 'QQ Mail',
    value: 'qq',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    smtpHost: 'smtp.qq.com',
    smtpPort: 587,
    instructions: '需要生成授权码。前往 QQ 邮箱设置 → 账户 → 开启 IMAP/SMTP 服务'
  },
  {
    name: '163 Mail',
    value: '163',
    imapHost: 'imap.163.com',
    imapPort: 993,
    smtpHost: 'smtp.163.com',
    smtpPort: 465,
    instructions: '需要生成授权码。前往网易邮箱设置 → POP3/SMTP/IMAP → 开启服务'
  },
  {
    name: '126 Mail',
    value: '126',
    imapHost: 'imap.126.com',
    imapPort: 993,
    smtpHost: 'smtp.126.com',
    smtpPort: 465,
    instructions: '需要生成授权码'
  },
  {
    name: 'iCloud',
    value: 'icloud',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    instructions: '需要生成应用专用密码。前往 Apple ID → 安全 → 应用专用密码'
  },
  {
    name: 'Yahoo',
    value: 'yahoo',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    instructions: '需要生成应用密码'
  },
  {
    name: '自定义',
    value: 'custom',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 587,
    instructions: '请手动填写 IMAP 和 SMTP 服务器信息'
  }
]

export const pushChannelTypes = [
  {
    type: 'wechat',
    name: '企业微信',
    icon: '💬',
    color: 'from-green-500 to-emerald-500',
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...',
        required: true
      }
    ],
    instructions: '在企业微信群聊中添加机器人，复制 Webhook 地址'
  },
  {
    type: 'feishu',
    name: '飞书',
    icon: '🚀',
    color: 'from-blue-500 to-sky-500',
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...',
        required: true
      }
    ],
    instructions: '在飞书群聊中添加机器人，复制 Webhook 地址'
  },
  {
    type: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    color: 'from-sky-500 to-cyan-500',
    fields: [
      {
        name: 'botToken',
        label: 'Bot Token',
        type: 'text',
        placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        required: true
      },
      {
        name: 'chatId',
        label: 'Chat ID',
        type: 'text',
        placeholder: '123456789',
        required: true
      }
    ],
    instructions: '与 @BotFather 对话创建 Bot 获取 Token，使用 @userinfobot 获取 Chat ID'
  }
]

export const defaultTemplates = {
  wechat: `📧 **新邮件通知**

**发件人:** {from}
**主题:** {subject}
**时间:** {time}

{preview}`,

  feishu: {
    header: {
      title: { tag: 'plain_text', content: '📧 新邮件通知' },
      template: 'blue'
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: '**发件人:** {from}' } },
      { tag: 'div', text: { tag: 'lark_md', content: '**主题:** {subject}' } },
      { tag: 'div', text: { tag: 'lark_md', content: '**时间:** {time}' } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'plain_text', content: '{preview}' } }
    ]
  },

  telegram: `📧 <b>新邮件通知</b>

<b>发件人:</b> {from}
<b>主题:</b> {subject}
<b>时间:</b> {time}

{preview}`
}
