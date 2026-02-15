'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Plus, Trash2, Power, AlertCircle, CheckCircle, Loader2, Play, Square, RefreshCw, Wifi, WifiOff, Clock, Activity } from 'lucide-react'
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
  lastHeartbeatAt: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  _count: { emails: number }
}

interface DiagStep {
  name: string
  status: 'success' | 'error' | 'skipped'
  message: string
  duration: number
}

interface DiagResult {
  steps: DiagStep[]
  overall: 'success' | 'error'
  suggestion: string
}

interface ListenerInfo {
  status: 'running' | 'stopped'
  mode: string
  pollInterval: number
}

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Test connection state
  const [testingId, setTestingId] = useState<string | null>(null)
  const [diagResult, setDiagResult] = useState<DiagResult | null>(null)
  const [diagAccountId, setDiagAccountId] = useState<string | null>(null)

  // Listener runtime info (mode, pollInterval)
  const [listenerInfo, setListenerInfo] = useState<Record<string, ListenerInfo>>({})
  const [settingInterval, setSettingInterval] = useState<string | null>(null)

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

  const fetchListenerInfo = useCallback(async () => {
    try {
      const data = await api.get<{ listeners: Record<string, ListenerInfo> }>('/api/listener')
      setListenerInfo(data.listeners || {})
    } catch {
      // 静默失败，不影响主界面
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchListenerInfo()
  }, [fetchAccounts, fetchListenerInfo])

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
      // If deactivating, also stop the listener
      if (account.isActive) {
        await api.post('/api/listener', { accountId: account.id, action: 'stop' }).catch(() => {})
      }
      await fetchAccounts()
    } catch (err: any) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此邮箱账户吗？所有相关邮件也会被删除。')) return
    try {
      await api.post('/api/listener', { accountId: id, action: 'stop' }).catch(() => {})
      await api.delete(`/api/email-accounts?id=${id}`)
      if (diagAccountId === id) {
        setDiagResult(null)
        setDiagAccountId(null)
      }
      await fetchAccounts()
    } catch (err: any) {
      console.error('Delete failed:', err)
    }
  }

  const handleListener = async (accountId: string, action: 'start' | 'stop') => {
    try {
      await api.post('/api/listener', { accountId, action })
      await fetchAccounts()
      await fetchListenerInfo()
    } catch (err: any) {
      console.error('Listener action failed:', err)
    }
  }

  const handleTestConnection = async (accountId: string) => {
    setTestingId(accountId)
    setDiagResult(null)
    setDiagAccountId(accountId)

    try {
      const result = await api.post<DiagResult>(`/api/email-accounts/${accountId}/test`)
      setDiagResult(result)
      await fetchAccounts()
      await fetchListenerInfo()
    } catch (err: any) {
      setDiagResult({
        steps: [{ name: '诊断请求', status: 'error', message: err.message || '请求失败', duration: 0 }],
        overall: 'error',
        suggestion: '无法执行诊断，请检查服务器状态。'
      })
    } finally {
      setTestingId(null)
    }
  }

  const handleSetInterval = async (accountId: string, intervalMs: number) => {
    setSettingInterval(accountId)
    try {
      await api.post('/api/listener', { accountId, action: 'setInterval', interval: intervalMs })
      await fetchListenerInfo()
    } catch (err: any) {
      console.error('Set interval failed:', err)
    } finally {
      setSettingInterval(null)
    }
  }

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '从未'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)

    if (diffSec < 60) return `${diffSec}秒前`
    if (diffMin < 60) return `${diffMin}分钟前`
    if (diffHour < 24) return `${diffHour}小时前`
    return date.toLocaleString('zh-CN')
  }

  const getStatusConfig = (account: EmailAccount) => {
    switch (account.status) {
      case 'connected':
        return { icon: CheckCircle, label: '已连接', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
      case 'connecting':
        return { icon: Loader2, label: '连接中...', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' }
      case 'error':
        return { icon: AlertCircle, label: '连接失败', color: 'text-destructive', bg: 'bg-destructive/10' }
      case 'disconnected':
      default:
        return { icon: WifiOff, label: '已断开', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
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
            添加和管理您的邮箱账户，监听会在服务启动时自动恢复
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
          {accounts.map((account, index) => {
            const statusConfig = getStatusConfig(account)
            const StatusIcon = statusConfig.icon
            const info = listenerInfo[account.id]

            return (
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
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      account.status === 'connected'
                        ? 'bg-primary/10 text-primary'
                        : account.status === 'connecting'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-destructive/10 text-destructive'
                    }`}>
                      <Mail className="w-7 h-7" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {account.email}
                        </h3>
                        <span className={`flex items-center gap-1 px-3 py-1 ${statusConfig.bg} ${statusConfig.color} rounded-full text-sm`}>
                          <StatusIcon className={`w-4 h-4 ${account.status === 'connecting' ? 'animate-spin' : ''}`} />
                          {statusConfig.label}
                        </span>
                        {!account.isActive && (
                          <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-sm">
                            已禁用
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>提供商: {account.provider}</span>
                        <span>邮件数: {account._count?.emails ?? 0}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          最后同步: {formatRelativeTime(account.lastSyncAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          心跳: {formatRelativeTime(account.lastHeartbeatAt)}
                        </span>
                        {info && info.status === 'running' && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            info.mode === 'idle'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}>
                            {info.mode === 'idle' ? 'IDLE 实时' : `轮询 ${info.pollInterval / 1000}s`}
                          </span>
                        )}
                      </div>

                      {/* 轮询间隔调节（仅 poll 模式 + 运行中） */}
                      {info && info.status === 'running' && info.mode === 'poll' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">轮询间隔:</span>
                          {[
                            { label: '15s', ms: 15000 },
                            { label: '30s', ms: 30000 },
                            { label: '45s', ms: 45000 },
                            { label: '60s', ms: 60000 },
                          ].map(opt => (
                            <button
                              key={opt.ms}
                              disabled={settingInterval === account.id}
                              onClick={() => handleSetInterval(account.id, opt.ms)}
                              className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                                info.pollInterval === opt.ms
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

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
                      onClick={() => handleTestConnection(account.id)}
                      disabled={testingId === account.id}
                      title="测试连接"
                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-600 dark:text-blue-400 disabled:opacity-50"
                    >
                      {testingId === account.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Wifi className="w-5 h-5" />
                      )}
                    </motion.button>
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

                {/* Diagnostic Results Panel */}
                <AnimatePresence>
                  {diagAccountId === account.id && diagResult && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold">连接诊断结果</h4>
                          <button
                            onClick={() => { setDiagResult(null); setDiagAccountId(null) }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            关闭
                          </button>
                        </div>

                        <div className="space-y-2">
                          {diagResult.steps.map((step, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-3 px-3 py-2 rounded-lg text-sm ${
                                step.status === 'success'
                                  ? 'bg-emerald-500/5'
                                  : step.status === 'error'
                                    ? 'bg-destructive/5'
                                    : 'bg-muted/30'
                              }`}
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                {step.status === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : step.status === 'error' ? (
                                  <AlertCircle className="w-4 h-4 text-destructive" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{step.name}</span>
                                  {step.duration > 0 && (
                                    <span className="text-xs text-muted-foreground">{step.duration}ms</span>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-xs mt-0.5 break-all">
                                  {step.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {diagResult.suggestion && (
                          <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${
                            diagResult.overall === 'success'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          }`}>
                            {diagResult.suggestion}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
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
                    {selectedProvider.instructions}
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
