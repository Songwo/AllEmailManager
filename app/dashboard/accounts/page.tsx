'use client'

import { motion } from 'framer-motion'
import { Mail, Plus, Trash2, Power, AlertCircle, CheckCircle, Loader2, Play, Square, RefreshCw } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { emailProviders } from '@/lib/constants'

interface EmailAccount {
  id: string
  email: string
  provider: string
  imapHost: string
  imapPort: number
  smtpHost: string | null
  smtpPort: number | null
  isActive: boolean
  lastSyncAt: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  _count: { emails: number }
}

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    provider: 'gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    password: ''
  })

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.get<EmailAccount[]>('/api/email-accounts')
      setAccounts(data)
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleProviderChange = (providerValue: string) => {
    const provider = emailProviders.find(p => p.value === providerValue)
    if (provider) {
      setFormData(prev => ({
        ...prev,
        provider: providerValue,
        imapHost: provider.imapHost,
        imapPort: provider.imapPort,
        smtpHost: provider.smtpHost || '',
        smtpPort: provider.smtpPort || 587,
      }))
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const provider = emailProviders.find(p => p.value === formData.provider)
      await api.post('/api/email-accounts', {
        email: formData.email,
        provider: provider?.name || formData.provider,
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        smtpHost: formData.smtpHost || undefined,
        smtpPort: formData.smtpPort || undefined,
        password: formData.password
      })
      setShowAddModal(false)
      setFormData({ email: '', provider: 'gmail', imapHost: 'imap.gmail.com', imapPort: 993, smtpHost: 'smtp.gmail.com', smtpPort: 587, password: '' })
      await fetchAccounts()
    } catch (err: any) {
      setError(err.message || '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (account: EmailAccount) => {
    try {
      await api.patch('/api/email-accounts', {
        id: account.id,
        isActive: !account.isActive
      })
      await fetchAccounts()
    } catch (err: any) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此邮箱账户吗？所有相关邮件也会被删除。')) return
    try {
      await api.delete(`/api/email-accounts?id=${id}`)
      await fetchAccounts()
    } catch (err: any) {
      console.error('Delete failed:', err)
    }
  }

  const handleListener = async (accountId: string, action: 'start' | 'stop') => {
    try {
      await api.post('/api/listener', { accountId, action })
      await fetchAccounts()
    } catch (err: any) {
      console.error('Listener action failed:', err)
    }
  }

  const selectedProvider = emailProviders.find(p => p.value === formData.provider)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            邮箱管理
          </h1>
          <p className="text-muted-foreground">
            添加和管理您的邮箱账户
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchAccounts}
            className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            添加邮箱
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">暂无邮箱账户</h3>
          <p className="text-muted-foreground text-sm mb-6">添加邮箱账户以开始接收和管理邮件</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            添加第一个邮箱
          </motion.button>
        </div>
      ) : (
        <div className="grid gap-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-background rounded-2xl border p-6 transition-all ${account.isActive ? 'border-border hover:border-primary/50' : 'border-border/50 opacity-60'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${account.status === 'connected'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive'
                    }`}>
                    <Mail className="w-7 h-7" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {account.email}
                      </h3>
                      {account.status === 'connected' ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          已连接
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {account.status === 'error' ? '连接失败' : account.status}
                        </span>
                      )}
                      {!account.isActive && (
                        <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-sm">
                          已禁用
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>提供商: {account.provider}</span>
                      <span>邮件数: {account._count?.emails ?? 0}</span>
                      <span>
                        最后同步: {account.lastSyncAt
                          ? new Date(account.lastSyncAt).toLocaleString('zh-CN')
                          : '从未同步'}
                      </span>
                    </div>

                    {account.errorMessage && (
                      <div className="mt-3 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium">
                        {account.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleListener(account.id, 'start')}
                    title="启动监听"
                    className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400"
                  >
                    <Play className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleListener(account.id, 'stop')}
                    title="停止监听"
                    className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors text-amber-600 dark:text-amber-400"
                  >
                    <Square className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleActive(account)}
                    title={account.isActive ? '禁用' : '启用'}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                  >
                    <Power className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(account.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Email Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl border border-border p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">
              添加邮箱账户
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  邮箱提供商
                </label>
                <select
                  value={formData.provider}
                  onChange={e => handleProviderChange(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  {emailProviders.map(p => (
                    <option key={p.value} value={p.value}>{p.name}</option>
                  ))}
                </select>
                {selectedProvider?.instructions && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    💡 {selectedProvider.instructions}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    IMAP 主机
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.imapHost}
                    onChange={e => setFormData(prev => ({ ...prev, imapHost: e.target.value }))}
                    placeholder="imap.gmail.com"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    IMAP 端口
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.imapPort}
                    onChange={e => setFormData(prev => ({ ...prev, imapPort: parseInt(e.target.value) || 993 }))}
                    placeholder="993"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  密码或应用专用密码
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      测试连接中...
                    </>
                  ) : (
                    '测试并添加'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => { setShowAddModal(false); setError('') }}
                  className="px-6 py-3 bg-secondary text-foreground rounded-xl font-medium"
                >
                  取消
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
