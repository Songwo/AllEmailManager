import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { decryptPassword } from './encryption'
import { prisma } from './prisma'

export class EmailListener {
  private imap: Imap | null = null
  private accountId: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(accountId: string) {
    this.accountId = accountId
  }

  async start() {
    const account = await prisma.emailAccount.findUnique({
      where: { id: this.accountId }
    })

    if (!account) throw new Error('Email account not found')

    const password = decryptPassword(account.encryptedPassword)

    this.imap = new Imap({
      user: account.email,
      password: password,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      keepalive: true
    })

    this.imap.once('ready', () => {
      this.reconnectAttempts = 0
      this.openInbox()
    })

    this.imap.once('error', async (err: Error) => {
      console.error(`IMAP error for ${this.accountId}:`, err.message)
      await this.updateAccountStatus('error', err.message)
      this.scheduleReconnect()
    })

    this.imap.once('end', async () => {
      console.log(`IMAP connection ended for ${this.accountId}`)
      await this.updateAccountStatus('disconnected')
      this.scheduleReconnect()
    })

    this.imap.connect()
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${this.accountId}`)
      this.createAlert('reconnect_failed', 'error',
        `邮箱监听重连失败，已达最大重试次数 (${this.maxReconnectAttempts})`)
      return
    }

    // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 80000)
    this.reconnectAttempts++

    console.log(`Reconnecting ${this.accountId} in ${delay / 1000}s (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.start()
      } catch (error) {
        console.error(`Reconnect failed for ${this.accountId}:`, error)
      }
    }, delay)
  }

  private openInbox() {
    if (!this.imap) return

    this.imap.openBox('INBOX', false, (err) => {
      if (err) {
        console.error('Error opening inbox:', err)
        return
      }

      this.updateAccountStatus('connected')
      this.listenForNewEmails()
    })
  }

  private listenForNewEmails() {
    if (!this.imap) return

    this.imap.on('mail', () => {
      this.fetchNewEmails()
    })

    // Initial fetch
    this.fetchNewEmails()
  }

  private async fetchNewEmails() {
    if (!this.imap) return

    this.imap.search(['UNSEEN'], (err, results) => {
      if (err || !results || results.length === 0) return

      const fetch = this.imap!.fetch(results, { bodies: '' })

      fetch.on('message', (msg) => {
        msg.on('body', (stream: any) => {
          simpleParser(stream, async (parseErr, parsed) => {
            if (parseErr) {
              console.error('Error parsing email:', parseErr)
              return
            }
            await this.saveEmail(parsed)
          })
        })
      })

      fetch.once('error', (fetchErr) => {
        console.error('Fetch error:', fetchErr)
      })
    })
  }

  private async saveEmail(parsed: any) {
    try {
      const messageId = parsed.messageId || `${Date.now()}-${Math.random()}`

      // Check if email already exists
      const existing = await prisma.email.findUnique({
        where: { messageId }
      })
      if (existing) return

      const toAddresses = parsed.to?.value?.map((t: any) => t.address) || []

      // Extract text content (fallback to HTML if no text)
      const textBody = parsed.text || (parsed.html ? parsed.html.replace(/<[^>]*>/g, '') : '')
      const htmlBody = parsed.html || null

      const email = await prisma.email.create({
        data: {
          emailAccountId: this.accountId,
          messageId,
          fromAddress: parsed.from?.text || '',
          toAddresses: JSON.stringify(toAddresses),
          subject: parsed.subject || '(No Subject)',
          body: textBody,
          bodyHtml: htmlBody,
          receivedAt: parsed.date || new Date(),
          isRead: false,
          attachments: parsed.attachments?.length
            ? JSON.stringify(parsed.attachments.map((a: any) => ({
              filename: a.filename,
              contentType: a.contentType,
              size: a.size
            })))
            : null,
          headers: parsed.headers ? JSON.stringify(parsed.headers) : null
        }
      })

      // Update last sync time
      await prisma.emailAccount.update({
        where: { id: this.accountId },
        data: { lastSyncAt: new Date() }
      })

      // Process filter rules and push notifications
      await this.processFilterRules(email)
    } catch (error) {
      console.error('Error saving email:', error)
    }
  }

  private async processFilterRules(email: any) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: this.accountId },
      include: {
        user: {
          include: {
            filterRules: {
              where: { isActive: true },
              orderBy: { priority: 'desc' }
            }
          }
        }
      }
    })

    if (!account) return

    for (const rule of account.user.filterRules) {
      const conditions = JSON.parse(rule.conditions)
      let matches = true

      // Check sender filter
      if (conditions.sender?.length > 0) {
        matches = conditions.sender.some((s: string) =>
          email.fromAddress.toLowerCase().includes(s.toLowerCase())
        )
      }

      // Check subject filter
      if (matches && conditions.subject?.length > 0) {
        matches = conditions.subject.some((s: string) =>
          email.subject.toLowerCase().includes(s.toLowerCase())
        )
      }

      // Check keywords filter
      if (matches && conditions.keywords?.length > 0) {
        const content = `${email.subject} ${email.body || ''}`.toLowerCase()
        matches = conditions.keywords.some((k: string) =>
          content.includes(k.toLowerCase())
        )
      }

      if (matches) {
        const actions = JSON.parse(rule.actions)

        // Increment match count
        await prisma.filterRule.update({
          where: { id: rule.id },
          data: { matchCount: { increment: 1 } }
        })

        // Push to channels
        if (actions.pushChannels?.length > 0) {
          for (const channelId of actions.pushChannels) {
            await this.pushToChannel(email, channelId)
          }
        }

        // Mark as read
        if (actions.markAsRead) {
          await prisma.email.update({
            where: { id: email.id },
            data: { isRead: true }
          })
        }

        break // Only apply first matching rule
      }
    }
  }

  private async pushToChannel(email: any, channelId: string) {
    try {
      const channel = await prisma.pushChannel.findUnique({
        where: { id: channelId }
      })

      if (!channel || !channel.isActive) return

      const canPush = await this.checkRateLimit(channelId)
      if (!canPush) {
        await this.createAlert('rate_limit', 'warning', `推送频率超限: ${channel.name}`)
        return
      }

      const config = JSON.parse(channel.config)
      let success = false

      switch (channel.type) {
        case 'wechat':
          success = await this.pushToWechat(email, config, channel.cardTemplate)
          break
        case 'feishu':
          success = await this.pushToFeishu(email, config, channel.cardTemplate)
          break
        case 'telegram':
          success = await this.pushToTelegram(email, config, channel.cardTemplate)
          break
      }

      await prisma.pushLog.create({
        data: {
          emailId: email.id,
          channelId,
          status: success ? 'success' : 'failed',
          errorMessage: success ? null : 'Push failed'
        }
      })

      if (!success) {
        await this.createAlert('push_failed', 'error', `推送失败: ${channel.name}`)
      }
    } catch (error: any) {
      console.error('Push error:', error)
      await prisma.pushLog.create({
        data: {
          emailId: email.id,
          channelId,
          status: 'failed',
          errorMessage: error.message
        }
      })
    }
  }

  private async checkRateLimit(channelId: string): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60000)

    const recentPushes = await prisma.pushLog.count({
      where: {
        channelId,
        pushedAt: { gte: oneMinuteAgo }
      }
    })

    return recentPushes < 10
  }

  private async pushToWechat(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const content = this.renderTemplate(email, template, 'markdown')
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content }
        })
      })
      return response.ok
    } catch (error) {
      console.error('Wechat push error:', error)
      return false
    }
  }

  private async pushToFeishu(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const card = this.renderTemplate(email, template, 'feishu')
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'interactive',
          card: JSON.parse(card)
        })
      })
      return response.ok
    } catch (error) {
      console.error('Feishu push error:', error)
      return false
    }
  }

  private async pushToTelegram(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const content = this.renderTemplate(email, template, 'html')
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: content,
          parse_mode: 'HTML'
        })
      })
      return response.ok
    } catch (error) {
      console.error('Telegram push error:', error)
      return false
    }
  }

  private renderTemplate(email: any, template: string | null, format: string): string {
    const time = new Date(email.receivedAt).toLocaleString('zh-CN')
    const preview = (email.body || '').substring(0, 200).trim() || '(无正文内容)'

    const defaultTemplates: Record<string, string> = {
      markdown: `📧 **新邮件**\n\n**发件人:** ${email.fromAddress}\n**主题:** ${email.subject}\n**时间:** ${time}\n\n**内容预览:**\n${preview}`,
      html: `📧 <b>新邮件</b>\n\n<b>发件人:</b> ${email.fromAddress}\n<b>主题:</b> ${email.subject}\n<b>时间:</b> ${time}\n\n<b>内容预览:</b>\n${preview}`,
      feishu: JSON.stringify({
        header: {
          title: { tag: 'plain_text', content: '📧 新邮件通知' },
          template: 'blue'
        },
        elements: [
          { tag: 'div', text: { tag: 'lark_md', content: `**发件人:** ${email.fromAddress}` } },
          { tag: 'div', text: { tag: 'lark_md', content: `**主题:** ${email.subject}` } },
          { tag: 'div', text: { tag: 'lark_md', content: `**时间:** ${time}` } },
          { tag: 'hr' },
          { tag: 'div', text: { tag: 'plain_text', content: `内容预览:\n${preview}` } }
        ]
      })
    }

    if (template) {
      return template
        .replace(/{from}/g, email.fromAddress)
        .replace(/{subject}/g, email.subject)
        .replace(/{time}/g, time)
        .replace(/{preview}/g, preview)
        .replace(/{body}/g, email.body || '')
    }

    return defaultTemplates[format] || defaultTemplates.markdown
  }

  private async updateAccountStatus(status: string, errorMessage?: string) {
    await prisma.emailAccount.update({
      where: { id: this.accountId },
      data: {
        status,
        errorMessage: errorMessage || null,
        lastSyncAt: new Date()
      }
    })

    if (status === 'error') {
      await this.createAlert('email_error', 'error', `邮箱连接异常: ${errorMessage}`)
    }
  }

  private async createAlert(type: string, severity: string, message: string) {
    await prisma.systemAlert.create({
      data: { type, severity, message }
    })
  }

  stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }
}
