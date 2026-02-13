import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { decryptPassword } from './encryption'
import { prisma } from './prisma'

export class EmailListener {
  private imap: Imap | null = null
  private accountId: string

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
      tlsOptions: { rejectUnauthorized: false }
    })

    this.imap.once('ready', () => {
      this.openInbox()
    })

    this.imap.once('error', async (err: Error) => {
      console.error('IMAP error:', err)
      await this.updateAccountStatus('error', err.message)
    })

    this.imap.once('end', async () => {
      console.log('Connection ended')
      await this.updateAccountStatus('disconnected')
    })

    this.imap.connect()
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
        msg.on('body', (stream) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err)
              return
            }

            await this.saveEmail(parsed)
          })
        })
      })

      fetch.once('error', (err) => {
        console.error('Fetch error:', err)
      })
    })
  }

  private async saveEmail(parsed: any) {
    try {
      const email = await prisma.email.create({
        data: {
          emailAccountId: this.accountId,
          messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
          from: parsed.from?.text || '',
          to: parsed.to?.value?.map((t: any) => t.address) || [],
          subject: parsed.subject || '(No Subject)',
          textContent: parsed.text,
          htmlContent: parsed.html,
          receivedAt: parsed.date || new Date(),
          hasAttachments: (parsed.attachments?.length || 0) > 0,
          attachments: parsed.attachments || [],
          headers: parsed.headers as any
        }
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
      const conditions = rule.conditions as any
      let matches = true

      // Check sender filter
      if (conditions.sender?.length > 0) {
        matches = conditions.sender.some((s: string) =>
          email.from.toLowerCase().includes(s.toLowerCase())
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
        const content = `${email.subject} ${email.textContent}`.toLowerCase()
        matches = conditions.keywords.some((k: string) =>
          content.includes(k.toLowerCase())
        )
      }

      if (matches) {
        const actions = rule.actions as any

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

      // Check rate limit
      const canPush = await this.checkRateLimit(channelId)
      if (!canPush) {
        await this.createAlert('rate_limit', 'warning', `Rate limit exceeded for channel ${channel.name}`)
        return
      }

      const config = channel.config as any
      let success = false
      let errorMessage = ''

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
          channelId: channelId,
          status: success ? 'success' : 'failed',
          errorMessage: success ? null : errorMessage
        }
      })

      if (!success) {
        await this.createAlert('push_failed', 'error', `Failed to push to ${channel.name}`)
      }
    } catch (error: any) {
      console.error('Push error:', error)
      await prisma.pushLog.create({
        data: {
          emailId: email.id,
          channelId: channelId,
          status: 'failed',
          errorMessage: error.message
        }
      })
    }
  }

  private async checkRateLimit(channelId: string): Promise<boolean> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60000) // 1 minute window

    const log = await prisma.rateLimitLog.findUnique({
      where: {
        channelId_windowStart: {
          channelId,
          windowStart
        }
      }
    })

    if (log && log.count >= 10) { // Max 10 messages per minute
      return false
    }

    await prisma.rateLimitLog.upsert({
      where: {
        channelId_windowStart: {
          channelId,
          windowStart
        }
      },
      create: {
        channelId,
        windowStart,
        count: 1
      },
      update: {
        count: { increment: 1 }
      }
    })

    return true
  }

  private async pushToWechat(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const content = this.renderTemplate(email, template, 'markdown')

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: content
          }
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
    const defaultTemplates: Record<string, string> = {
      markdown: `📧 **新邮件**\n\n**发件人:** ${email.from}\n**主题:** ${email.subject}\n**时间:** ${new Date(email.receivedAt).toLocaleString('zh-CN')}`,
      html: `📧 <b>新邮件</b>\n\n<b>发件人:</b> ${email.from}\n<b>主题:</b> ${email.subject}\n<b>时间:</b> ${new Date(email.receivedAt).toLocaleString('zh-CN')}`,
      feishu: JSON.stringify({
        header: {
          title: { tag: 'plain_text', content: '📧 新邮件通知' },
          template: 'blue'
        },
        elements: [
          { tag: 'div', text: { tag: 'lark_md', content: `**发件人:** ${email.from}` } },
          { tag: 'div', text: { tag: 'lark_md', content: `**主题:** ${email.subject}` } },
          { tag: 'div', text: { tag: 'lark_md', content: `**时间:** ${new Date(email.receivedAt).toLocaleString('zh-CN')}` } }
        ]
      })
    }

    return template || defaultTemplates[format] || defaultTemplates.markdown
  }

  private async updateAccountStatus(status: string, errorMessage?: string) {
    await prisma.emailAccount.update({
      where: { id: this.accountId },
      data: {
        status,
        errorMessage,
        lastSyncAt: new Date()
      }
    })

    if (status === 'error' || status === 'disconnected') {
      await this.createAlert('email_disconnect', 'error', `Email account disconnected: ${errorMessage}`)
    }
  }

  private async createAlert(type: string, severity: string, message: string) {
    await prisma.systemAlert.create({
      data: { type, severity, message }
    })
  }

  stop() {
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }
}
