import { sendEventToUser } from '@/app/api/events/route'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { decryptPassword } from './encryption'
import { createLogger } from './logger'
import { prisma } from './prisma'
import { createNotification } from './notifications'

function hasPrismaModel(modelName: string): boolean {
  const runtimeDataModel = (prisma as any)?._runtimeDataModel
  return !!runtimeDataModel?.models?.[modelName]
}

function hasPrismaField(modelName: string, fieldName: string): boolean {
  const model = (prisma as any)?._runtimeDataModel?.models?.[modelName]
  if (!model?.fields) return false
  return model.fields.some((field: { name: string }) => field.name === fieldName)
}

function hasPushTemplateSupport(): boolean {
  return hasPrismaModel('PushTemplate') && typeof (prisma as any)?.pushTemplate !== 'undefined'
}

function hasChannelTemplateRelation(): boolean {
  return hasPrismaField('PushChannel', 'template')
}

// ---------------------------------------------------------------------------
// 默认轮询参数
// ---------------------------------------------------------------------------
const POLL_MIN_MS = 10_000      // 下限 10s
const POLL_MAX_MS = 300_000     // 上限 5min
const POLL_DEFAULT_MS = 30_000  // 默认 30s
const POLL_STEP_1_MS = 45_000   // 连续 5 次空轮询 → 45s
const POLL_STEP_2_MS = 60_000   // 连续 10 次空轮询 → 60s
const EMPTY_POLLS_STEP_1 = 5
const EMPTY_POLLS_STEP_2 = 10

export class EmailListener {
  private imap: Imap | null = null
  private accountId: string
  private userId: string
  private log
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isManualStop = false
  private _isConnected = false

  // ── UID 轮询状态 ──
  private lastSeenUid = 0
  private pollTimer: NodeJS.Timeout | null = null
  private _pollIntervalMs = POLL_DEFAULT_MS
  private _supportsIdle = false
  private consecutiveEmptyPolls = 0
  private _pollLock = false

  constructor(accountId: string, userId: string) {
    this.accountId = accountId
    this.userId = userId
    this.log = createLogger(`listener:${accountId}`)
  }

  // ── 公开属性 ──
  get isConnected(): boolean { return this._isConnected }

  get isRunning(): boolean {
    return this.imap !== null || this.reconnectTimer !== null
  }

  get supportsIdle(): boolean { return this._supportsIdle }

  get currentPollInterval(): number { return this._pollIntervalMs }

  /** 动态调节轮询间隔 (ms)，限制在 [10s, 300s] */
  setPollingInterval(ms: number) {
    this._pollIntervalMs = Math.max(POLL_MIN_MS, Math.min(POLL_MAX_MS, ms))
    this.consecutiveEmptyPolls = 0
    if (this.pollTimer) {
      this.startPolling()  // 用新间隔重启定时器
    }
    this.log.info(`Poll interval set to ${this._pollIntervalMs}ms`)
  }

  // ==========================================================================
  //  连接生命周期
  // ==========================================================================

  async start() {
    this.isManualStop = false
    const account = await prisma.emailAccount.findUnique({
      where: { id: this.accountId }
    })
    if (!account) throw new Error('Email account not found')

    await this.updateAccountStatus('connecting')

    const password = decryptPassword(account.encryptedPassword)

    this.imap = new Imap({
      user: account.email,
      password,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 15000,
      authTimeout: 15000,
      keepalive: {
        interval: 10000,      // NOOP 保活 10s
        idleInterval: 300000, // IDLE 超时 5min
        forceNoop: true       // 即使不支持 IDLE 也发 NOOP
      }
    })

    this.imap.once('ready', () => {
      this.log.info('IMAP connected', { email: account.email })
      this.reconnectAttempts = 0
      this._isConnected = true
      this.openInbox()
      this.startHeartbeat()
    })

    this.imap.once('error', async (err: Error) => {
      this.log.error('IMAP error', { email: account.email, error: err.message })
      this.onDisconnect()
      await this.updateAccountStatus('error', err.message)
      if (!this.isManualStop) this.scheduleReconnect()
    })

    this.imap.once('end', async () => {
      this.log.info('IMAP connection ended', { email: account.email })
      this.onDisconnect()
      if (!this.isManualStop) {
        await this.updateAccountStatus('disconnected')
        this.scheduleReconnect()
      }
    })

    this.imap.connect()
  }

  stop() {
    this.isManualStop = true
    this.onDisconnect()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }

  // ==========================================================================
  //  内部：连接 / 断开清理
  // ==========================================================================

  private onDisconnect() {
    this._isConnected = false
    this.stopHeartbeat()
    this.stopPolling()
    this._pollLock = false
  }

  // ==========================================================================
  //  心跳 (DB lastHeartbeatAt 每 60s 更新)
  // ==========================================================================

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(async () => {
      try {
        await prisma.emailAccount.update({
          where: { id: this.accountId },
          data: { lastHeartbeatAt: new Date() }
        })
      } catch (error) {
        this.log.error('Heartbeat update failed', { error: String(error) })
      }
    }, 60000)
    prisma.emailAccount.update({
      where: { id: this.accountId },
      data: { lastHeartbeatAt: new Date() }
    }).catch(() => {})
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // ==========================================================================
  //  重连（指数退避 5s → 320s）
  // ==========================================================================

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log.error('Max reconnect attempts reached')
      this.createAlert('reconnect_failed', 'error',
        `邮箱监听重连失败，已达最大重试次数 (${this.maxReconnectAttempts})`)
      return
    }

    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 320000)
    this.reconnectAttempts++
    this.log.info(`Reconnecting in ${delay / 1000}s`, { attempt: this.reconnectAttempts })

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      try { await this.start() }
      catch (error) { this.log.error('Reconnect failed', { error: String(error) }) }
    }, delay)
  }

  // ==========================================================================
  //  打开 INBOX → 检测 IDLE → 初始抓取 → 启动轮询
  // ==========================================================================

  private openInbox() {
    if (!this.imap) return

    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        this.log.error('Error opening inbox', { error: String(err) })
        return
      }

      // ── 用 UIDNEXT 初始化水位线 ──
      this.lastSeenUid = (box.uidnext || 1) - 1
      this.log.info('INBOX opened', { uidnext: box.uidnext, lastSeenUid: this.lastSeenUid })

      // ── 检测 IDLE 能力 ──
      const caps: string[] = (this.imap as any)?._caps || []
      this._supportsIdle = Array.isArray(caps) &&
        caps.some((c: any) => String(c).toUpperCase() === 'IDLE')
      this.log.info(`IDLE support: ${this._supportsIdle}`)

      this.updateAccountStatus('connected')

      // ── 初始抓取未读邮件（一次性） ──
      this.fetchUnseenOnce()

      // ── 启动 UID 轮询（核心机制，所有邮箱通用） ──
      this.startPolling()

      // ── IDLE 加速：如果支持，mail 事件触发立即轮询 ──
      if (this._supportsIdle && this.imap) {
        this.imap.on('mail', () => {
          this.log.info('IDLE mail event, triggering immediate poll')
          this.pollForNewEmails()
        })
      }
    })
  }

  // ==========================================================================
  //  初始 UNSEEN 抓取（仅在首次连接时运行一次）
  // ==========================================================================

  private fetchUnseenOnce() {
    if (!this.imap) return

    this.imap.search(['UNSEEN'], (err, seqnos) => {
      if (err || !seqnos || seqnos.length === 0) return

      this.log.info(`Initial UNSEEN fetch: ${seqnos.length} message(s)`)

      const fetch = this.imap!.fetch(seqnos, { bodies: '' })

      fetch.on('message', (msg) => {
        let uid = 0
        msg.on('attributes', (attrs) => { uid = attrs.uid })
        msg.on('body', (stream: any) => {
          simpleParser(stream, async (parseErr, parsed) => {
            if (parseErr) { this.log.error('Parse error', { error: String(parseErr) }); return }
            await this.saveEmail(parsed)
          })
        })
      })

      fetch.once('error', (e) => this.log.error('Initial fetch error', { error: String(e) }))
    })
  }

  // ==========================================================================
  //  UID 轮询：核心新邮件检测（不依赖 UNSEEN / IDLE / 时间戳）
  // ==========================================================================

  private startPolling() {
    this.stopPolling()
    this.pollTimer = setInterval(() => {
      this.pollForNewEmails()
    }, this._pollIntervalMs)
    this.log.info(`Polling started at ${this._pollIntervalMs}ms interval`)
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private pollForNewEmails() {
    if (!this.imap || this._pollLock) return
    this._pollLock = true

    const searchFrom = this.lastSeenUid + 1

    // SEARCH UID <searchFrom>:*
    this.imap.search([['UID', `${searchFrom}:*`]], (err, seqnos) => {
      if (err) {
        this._pollLock = false
        this.log.error('Poll search error', { error: err.message })
        return
      }

      if (!seqnos || seqnos.length === 0) {
        this._pollLock = false
        this.adjustPollInterval(false)
        return
      }

      let newCount = 0
      const fetch = this.imap!.fetch(seqnos, { bodies: '' })

      fetch.on('message', (msg) => {
        let uid = 0
        msg.on('attributes', (attrs) => { uid = attrs.uid })
        msg.on('body', (stream: any) => {
          simpleParser(stream, async (parseErr, parsed) => {
            if (parseErr) { this.log.error('Parse error', { error: String(parseErr) }); return }

            // RFC 3501: UID X:* 可能返回 UID=X 本身（当 X 是最大 UID 时）
            if (uid > 0 && uid <= this.lastSeenUid) return

            if (uid > this.lastSeenUid) this.lastSeenUid = uid
            newCount++
            await this.saveEmail(parsed)
          })
        })
      })

      fetch.once('error', (fetchErr) => {
        this.log.error('Poll fetch error', { error: String(fetchErr) })
        this._pollLock = false
      })

      fetch.once('end', () => {
        this._pollLock = false
        this.adjustPollInterval(newCount > 0)
        if (newCount > 0) {
          this.log.info(`Poll found ${newCount} new email(s)`, { lastUid: this.lastSeenUid })
        }
      })
    })
  }

  // ==========================================================================
  //  动态频率调节：有新邮件 → 30s，空闲渐增到 60s
  // ==========================================================================

  private adjustPollInterval(foundNew: boolean) {
    if (foundNew) {
      this.consecutiveEmptyPolls = 0
      if (this._pollIntervalMs !== POLL_DEFAULT_MS) {
        this._pollIntervalMs = POLL_DEFAULT_MS
        this.startPolling()
      }
    } else {
      this.consecutiveEmptyPolls++
      let target = this._pollIntervalMs

      if (this.consecutiveEmptyPolls >= EMPTY_POLLS_STEP_2 && this._pollIntervalMs < POLL_STEP_2_MS) {
        target = POLL_STEP_2_MS
      } else if (this.consecutiveEmptyPolls >= EMPTY_POLLS_STEP_1 && this._pollIntervalMs < POLL_STEP_1_MS) {
        target = POLL_STEP_1_MS
      }

      if (target !== this._pollIntervalMs) {
        this._pollIntervalMs = target
        this.startPolling()
        this.log.info(`Poll interval adjusted to ${target / 1000}s`, { emptyPolls: this.consecutiveEmptyPolls })
      }
    }
  }

  // ==========================================================================
  //  保存邮件 + 推送
  // ==========================================================================

  private async saveEmail(parsed: any) {
    try {
      const messageId = parsed.messageId || `${Date.now()}-${Math.random()}`

      const existing = await prisma.email.findUnique({ where: { messageId } })
      if (existing) return

      const toAddresses = parsed.to?.value?.map((t: any) => t.address) || []
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
                filename: a.filename, contentType: a.contentType, size: a.size
              })))
            : null,
          headers: parsed.headers ? JSON.stringify(parsed.headers) : null
        }
      })

      this.log.info('Saved email', { subject: email.subject })

      await prisma.emailAccount.update({
        where: { id: this.accountId },
        data: { lastSyncAt: new Date() }
      })

      sendEventToUser(this.userId, {
        type: 'new_email',
        email: {
          id: email.id,
          subject: email.subject,
          fromAddress: email.fromAddress,
          receivedAt: email.receivedAt,
          isRead: email.isRead
        }
      })

      await this.processFilterRules(email)
    } catch (error) {
      this.log.error('Error saving email', { error: String(error) })
    }
  }

  // ==========================================================================
  //  过滤规则 → 推送通道
  // ==========================================================================

  private async processFilterRules(email: any) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: this.accountId },
      include: {
        user: {
          include: {
            filterRules: {
              where: {
                isActive: true,
                OR: [
                  { emailAccountId: this.accountId },
                  { emailAccountId: null }
                ]
              },
              orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
            }
          }
        }
      }
    })
    if (!account) return

    for (const rule of account.user.filterRules) {
      const conditions = JSON.parse(rule.conditions)
      let matches = true

      if (conditions.sender?.length > 0) {
        matches = conditions.sender.some((s: string) =>
          email.fromAddress.toLowerCase().includes(s.toLowerCase()))
      }
      if (matches && conditions.subject?.length > 0) {
        matches = conditions.subject.some((s: string) =>
          email.subject.toLowerCase().includes(s.toLowerCase()))
      }
      if (matches && conditions.keywords?.length > 0) {
        const content = `${email.subject} ${email.body || ''}`.toLowerCase()
        matches = conditions.keywords.some((k: string) => content.includes(k.toLowerCase()))
      }

      if (matches) {
        const actions = JSON.parse(rule.actions)
        await prisma.filterRule.update({
          where: { id: rule.id },
          data: { matchCount: { increment: 1 } }
        })
        if (actions.pushChannels?.length > 0) {
          for (const channelId of actions.pushChannels) {
            await this.pushToChannel(email, channelId)
          }
        }
        if (actions.markAsRead) {
          await prisma.email.update({
            where: { id: email.id },
            data: { isRead: true }
          })
        }
        break
      }
    }
  }

  private async pushToChannel(email: any, channelId: string) {
    try {
      const templateSupport = hasPushTemplateSupport()
      const templateRelation = hasChannelTemplateRelation()

      const channel = await prisma.pushChannel.findFirst({
        where: {
          id: channelId,
          userId: this.userId,
          isActive: true,
          OR: [
            { emailAccountId: this.accountId },
            { emailAccountId: null }
          ]
        },
        include:
          templateSupport && templateRelation
            ? { template: { select: { content: true, type: true, isActive: true } } }
            : undefined
      })
      if (!channel) return

      const canPush = await this.checkRateLimit(channelId)
      if (!canPush) {
        await this.createAlert('rate_limit', 'warning', `推送频率超限: ${channel.name}`)
        return
      }

      const config = JSON.parse(channel.config)
      const channelTemplate = (channel as any).template as
        | { content: string; isActive: boolean } | null | undefined
      let resolvedTemplate = channelTemplate?.isActive ? channelTemplate.content : channel.cardTemplate

      if (!resolvedTemplate && templateSupport) {
        const scopedDefault = await prisma.pushTemplate.findFirst({
          where: { userId: this.userId, type: channel.type, isActive: true, isDefault: true, emailAccountId: this.accountId },
          select: { content: true }
        })
        if (scopedDefault?.content) {
          resolvedTemplate = scopedDefault.content
        } else {
          const globalDefault = await prisma.pushTemplate.findFirst({
            where: { userId: this.userId, type: channel.type, isActive: true, isDefault: true, emailAccountId: null },
            select: { content: true }
          })
          resolvedTemplate = globalDefault?.content || null
        }
      }

      let success = false
      switch (channel.type) {
        case 'wechat':  success = await this.pushToWechat(email, config, resolvedTemplate); break
        case 'feishu':  success = await this.pushToFeishu(email, config, resolvedTemplate); break
        case 'telegram': success = await this.pushToTelegram(email, config, resolvedTemplate); break
      }

      await prisma.pushLog.create({
        data: { emailId: email.id, channelId, status: success ? 'success' : 'failed', errorMessage: success ? null : 'Push failed' }
      })
      if (!success) {
        await this.createAlert('push_failed', 'error', `推送失败: ${channel.name}`)
      }
    } catch (error: any) {
      this.log.error('Push error', { channelId, error: error.message })
      await prisma.pushLog.create({
        data: { emailId: email.id, channelId, status: 'failed', errorMessage: error.message }
      })
    }
  }

  private async checkRateLimit(channelId: string): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentPushes = await prisma.pushLog.count({
      where: { channelId, pushedAt: { gte: oneMinuteAgo } }
    })
    return recentPushes < 10
  }

  // ==========================================================================
  //  推送实现（微信 / 飞书 / Telegram）
  // ==========================================================================

  private async pushToWechat(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const content = this.renderTemplate(email, template, 'markdown')
      const response = await fetch(config.webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'markdown', markdown: { content } })
      })
      return response.ok
    } catch (error) { this.log.error('Wechat push error', { error: String(error) }); return false }
  }

  private async pushToFeishu(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const card = this.renderTemplate(email, template, 'feishu')
      const parsedCard = JSON.parse(card)
      const response = await fetch(config.webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'interactive', card: parsedCard })
      })
      return response.ok
    } catch (error) { this.log.error('Feishu push error', { error: String(error) }); return false }
  }

  private async pushToTelegram(email: any, config: any, template: string | null): Promise<boolean> {
    try {
      const content = this.renderTemplate(email, template, 'html')
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.chatId, text: content, parse_mode: 'HTML' })
      })
      return response.ok
    } catch (error) { this.log.error('Telegram push error', { error: String(error) }); return false }
  }

  private renderTemplate(email: any, template: string | null, format: string): string {
    const time = new Date(email.receivedAt).toLocaleString('zh-CN')
    const preview = (email.body || '').substring(0, 200).trim() || '(无正文内容)'

    const defaultTemplates: Record<string, string> = {
      markdown: `📧 **新邮件**\n\n**发件人:** ${email.fromAddress}\n**主题:** ${email.subject}\n**时间:** ${time}\n\n**内容预览:**\n${preview}`,
      html: `📧 <b>新邮件</b>\n\n<b>发件人:</b> ${email.fromAddress}\n<b>主题:</b> ${email.subject}\n<b>时间:</b> ${time}\n\n<b>内容预览:</b>\n${preview}`,
      feishu: JSON.stringify({
        header: { title: { tag: 'plain_text', content: '📧 新邮件通知' }, template: 'blue' },
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
      const rendered = template
        .replace(/{from}/g, email.fromAddress)
        .replace(/{subject}/g, email.subject)
        .replace(/{time}/g, time)
        .replace(/{preview}/g, preview)
        .replace(/{body}/g, email.body || '')
      if (format === 'feishu') {
        try { JSON.parse(rendered) } catch { return defaultTemplates.feishu }
      }
      return rendered
    }
    return defaultTemplates[format] || defaultTemplates.markdown
  }

  // ==========================================================================
  //  状态更新 / 告警
  // ==========================================================================

  private async updateAccountStatus(status: string, errorMessage?: string) {
    const data: any = { status, errorMessage: errorMessage || null }
    if (status === 'connected') {
      data.lastSyncAt = new Date()
      data.lastHeartbeatAt = new Date()
    }
    await prisma.emailAccount.update({ where: { id: this.accountId }, data })
    if (status === 'error') {
      await this.createAlert('email_error', 'error', `邮箱连接异常: ${errorMessage}`)
    }
  }

  private async createAlert(type: string, severity: string, message: string) {
    await prisma.systemAlert.create({ data: { type, severity, message } })
    await createNotification({
      userId: this.userId,
      title: '系统告警',
      message,
      type: severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
      metadata: { type }
    })
  }
}
