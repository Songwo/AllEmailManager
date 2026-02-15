'use client'

import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  Clock,
  User,
  Trash2,
  MailOpen,
  Paperclip,
  Send,
  Reply,
  ReplyAll,
  Forward
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { ComposeEmail } from '@/components/ui/compose-email'
import { EmailBodyViewer } from '@/components/ui/email-body-viewer'

interface EmailDetail {
  id: string
  subject: string
  fromAddress: string
  toAddresses: string[]
  body: string | null
  bodyHtml: string | null
  headers: Record<string, unknown> | null
  receivedAt: string
  isRead: boolean
  messageId: string
  attachments: Array<{
    filename: string
    size: number
    contentType: string
  }> | null
  emailAccount: {
    id: string
    email: string
    provider: string
  }
  pushLogs: Array<{
    id: string
    status: string
    pushedAt: string
    channel: {
      name: string
      type: string
    }
  }>
}

interface EmailAccount {
  id: string
  email: string
  provider: string
}

type ComposeMode = 'reply' | 'replyAll' | 'forward' | null

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [emailData, accountsData] = await Promise.all([
          api.get<EmailDetail>(`/api/emails/${params.id}`),
          api.get<EmailAccount[]>('/api/email-accounts')
        ])

        setEmail(emailData)
        setAccounts(accountsData)

        if (!emailData.isRead) {
          try {
            await api.post(`/api/emails/${params.id}`, { action: 'markAsRead' })
            setEmail({ ...emailData, isRead: true })
          } catch {
            // Best effort.
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleMarkAsUnread = async () => {
    if (!email) return
    try {
      setActionLoading(true)
      await api.post(`/api/emails/${params.id}`, { action: 'markAsUnread' })
      setEmail({ ...email, isRead: false })
    } catch (err: any) {
      alert('操作失败: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!email || !confirm('确定要删除这封邮件吗？')) return
    try {
      setActionLoading(true)
      await api.post(`/api/emails/${params.id}`, { action: 'delete' })
      router.push('/dashboard')
    } catch (err: any) {
      alert('删除失败: ' + err.message)
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const extractOriginalCc = (headers: Record<string, unknown> | null): string[] => {
    if (!headers) return []
    const cc = headers.cc
    if (typeof cc === 'string') {
      return cc
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">加载失败: {error || '邮件不存在'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            返回仪表盘
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6 flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setComposeMode('reply')}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Reply className="w-5 h-5" />
            回复
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setComposeMode('replyAll')}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ReplyAll className="w-5 h-5" />
            回复全部
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setComposeMode('forward')}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Forward className="w-5 h-5" />
            转发
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMarkAsUnread}
            disabled={actionLoading || !email.isRead}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MailOpen className="w-5 h-5" />
            标记未读
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            删除
          </motion.button>
        </div>
      </div>

      <div className="bg-background rounded-2xl border border-border shadow-sm">
        <div className="p-8 border-b border-border">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            {email.subject || '(无主题)'}
          </h1>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">发件人</p>
                <p className="font-medium text-foreground break-all">{email.fromAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">收件人</p>
                <p className="font-medium text-foreground break-all">
                  {email.toAddresses.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">接收时间</p>
                <p className="font-medium text-foreground">{formatDate(email.receivedAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">所属邮箱</p>
                <p className="font-medium text-foreground break-all">
                  {email.emailAccount.email} ({email.emailAccount.provider})
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-b border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">邮件内容</h3>
          <EmailBodyViewer body={email.body} bodyHtml={email.bodyHtml} />
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="p-8 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Paperclip className="w-5 h-5" />
              附件 ({email.attachments.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border"
                >
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {attachment.contentType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {email.pushLogs && email.pushLogs.length > 0 && (
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Send className="w-5 h-5" />
              推送记录 ({email.pushLogs.length})
            </h3>
            <div className="space-y-3">
              {email.pushLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        log.status === 'success'
                          ? 'bg-green-500'
                          : log.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {log.channel.name} ({log.channel.type})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.pushedAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      log.status === 'success'
                        ? 'bg-green-500/10 text-green-600'
                        : log.status === 'failed'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}
                  >
                    {log.status === 'success'
                      ? '成功'
                      : log.status === 'failed'
                      ? '失败'
                      : '处理中'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {composeMode && (
        <ComposeEmail
          isOpen={!!composeMode}
          onClose={() => setComposeMode(null)}
          accounts={accounts}
          defaultAccountId={email.emailAccount.id}
          mode={composeMode}
          replyTo={{
            emailId: email.id,
            fromAddress: email.fromAddress,
            subject: email.subject || '(无主题)',
            body: email.body || '',
            messageId: email.messageId
          }}
          originalTo={email.toAddresses}
          originalCc={extractOriginalCc(email.headers)}
        />
      )}
    </div>
  )
}
