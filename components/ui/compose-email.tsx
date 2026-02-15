'use client'

import { motion } from 'framer-motion'
import { X, Send, Paperclip } from 'lucide-react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useToast } from './toast'

interface EmailAccount {
  id: string;
  email: string;
  provider: string;
}

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  defaultAccountId?: string;
  replyTo?: {
    emailId: string;
    fromAddress: string;
    subject: string;
    body: string;
    messageId: string;
  };
  mode?: 'compose' | 'reply' | 'replyAll' | 'forward';
  originalTo?: string[];
  originalCc?: string[];
}

const EMPTY_ADDRESS_LIST: string[] = []

function normalizeAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/)
  if (match?.[1]) return match[1].trim()
  return raw.trim()
}

function parseAddressList(list: string[]): string[] {
  const deduped = new Set<string>()
  for (const item of list) {
    const value = normalizeAddress(item)
    if (value) deduped.add(value.toLowerCase())
  }
  return Array.from(deduped)
}

export function ComposeEmail({
  isOpen,
  onClose,
  accounts,
  defaultAccountId,
  replyTo,
  mode = 'compose',
  originalTo = EMPTY_ADDRESS_LIST,
  originalCc = EMPTY_ADDRESS_LIST
}: ComposeEmailProps) {
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)

  const accountIdByEmail = useMemo(() => {
    const map: Record<string, string> = {}
    for (const account of accounts) {
      map[account.email.toLowerCase()] = account.id
    }
    return map
  }, [accounts])

  const createInitialFormData = useCallback(() => {
    const fallbackAccountId = defaultAccountId || accounts[0]?.id || ''
    const ownEmails = new Set(accounts.map((a) => a.email.toLowerCase()))

    const senderAddress = replyTo ? normalizeAddress(replyTo.fromAddress) : ''
    const guessedAccountId =
      accountIdByEmail[senderAddress.toLowerCase()] || fallbackAccountId

    const toListForReplyAll = parseAddressList([
      senderAddress,
      ...(originalTo || [])
    ]).filter((email) => !ownEmails.has(email))

    const ccListForReplyAll = parseAddressList(originalCc || []).filter(
      (email) => !ownEmails.has(email) && !toListForReplyAll.includes(email)
    )

    const baseSubject = replyTo?.subject || ''

    return {
      accountId: guessedAccountId,
      to:
        mode === 'reply'
          ? senderAddress
          : mode === 'replyAll'
          ? toListForReplyAll.join(', ')
          : '',
      cc: mode === 'replyAll' ? ccListForReplyAll.join(', ') : '',
      bcc: '',
      subject: replyTo
        ? mode === 'forward'
          ? baseSubject.toLowerCase().startsWith('fwd:')
            ? baseSubject
            : `Fwd: ${baseSubject}`
          : baseSubject.toLowerCase().startsWith('re:')
          ? baseSubject
          : `Re: ${baseSubject}`
        : '',
      body: '',
      includeOriginal: mode !== 'compose'
    }
  }, [defaultAccountId, accounts, accountIdByEmail, mode, originalTo, originalCc, replyTo])

  const [formData, setFormData] = useState(createInitialFormData)

  useEffect(() => {
    if (!isOpen) return
    setFormData(createInitialFormData())
  }, [isOpen, createInitialFormData])

  const handleSend = async () => {
    if (!formData.accountId || !formData.to || !formData.subject || !formData.body) {
      showToast('error', '请填写收件人、主题和正文')
      return
    }

    try {
      setSending(true)

      let finalBody = formData.body

      // Include original email if replying/forwarding
      if (formData.includeOriginal && replyTo) {
        const separator = '\n\n------- 原始邮件 -------\n'
        const original = `发件人: ${replyTo.fromAddress}\n主题: ${replyTo.subject}\n\n${replyTo.body}`
        finalBody = `${formData.body}${separator}${original}`
      }

      await api.post('/api/emails/send', {
        emailAccountId: formData.accountId,
        to: formData.to.split(',').map(e => e.trim()),
        cc: formData.cc ? formData.cc.split(',').map(e => e.trim()) : undefined,
        bcc: formData.bcc ? formData.bcc.split(',').map(e => e.trim()) : undefined,
        subject: formData.subject,
        body: finalBody,
        inReplyTo: mode === 'reply' || mode === 'replyAll' ? replyTo?.messageId : undefined,
        references: mode === 'reply' || mode === 'replyAll' ? replyTo?.messageId : undefined
      })

      showToast('success', '邮件发送成功')
      onClose()

      // Reset form
      setFormData({
        accountId: defaultAccountId || accounts[0]?.id || '',
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        includeOriginal: false
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误'
      showToast('error', '发送失败: ' + message)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'reply' ? '回复邮件' :
             mode === 'replyAll' ? '回复全部' :
             mode === 'forward' ? '转发邮件' : '撰写邮件'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              发件账号
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              disabled={accounts.length === 0}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {accounts.length === 0 && (
                <option value="">暂无可用账号</option>
              )}
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email} ({account.provider})
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              收件人 *
            </label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="多个收件人用逗号分隔"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              抄送 (CC)
            </label>
            <input
              type="text"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              placeholder="多个抄送人用逗号分隔"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
            />
          </div>

          {/* BCC */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              密送 (BCC)
            </label>
            <input
              type="text"
              value={formData.bcc}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
              placeholder="多个密送人用逗号分隔"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              主题 *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="邮件主题"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              正文 *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="邮件正文..."
              rows={12}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none ml-0"
            />
          </div>

          {/* Include Original */}
          {mode !== 'compose' && replyTo && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeOriginal}
                onChange={(e) => setFormData({ ...formData, includeOriginal: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">引用原文</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 bg-secondary text-foreground rounded-xl font-medium"
            >
              取消
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={sending || accounts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {sending ? '发送中...' : '发送'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
