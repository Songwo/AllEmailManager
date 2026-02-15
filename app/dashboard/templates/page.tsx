'use client'

import { motion } from 'framer-motion'
import { Plus, Trash2, Star, Loader2, RefreshCw, LayoutTemplate, Power } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

type TemplateType = 'wechat' | 'feishu' | 'telegram'
type ScopeType = 'all' | 'global' | string

interface EmailAccount {
  id: string
  email: string
  provider: string
}

interface PushTemplate {
  id: string
  name: string
  type: TemplateType
  content: string
  emailAccountId: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  _count?: {
    channels: number
  }
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<PushTemplate[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [scope, setScope] = useState<ScopeType>('all')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    type: 'wechat' as TemplateType,
    emailAccountId: 'global' as ScopeType,
    content: '',
    isDefault: false
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [accountData, templateData] = await Promise.all([
        api.get<EmailAccount[]>('/api/email-accounts'),
        api.get<PushTemplate[]>('/api/push-templates')
      ])
      setAccounts(accountData)
      setTemplates(templateData)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredTemplates = templates.filter((template) => {
    if (scope === 'all') return true
    if (scope === 'global') return template.emailAccountId === null
    return template.emailAccountId === scope
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'wechat',
      emailAccountId: 'global',
      content: '',
      isDefault: false
    })
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/push-templates', {
        name: formData.name,
        type: formData.type,
        content: formData.content,
        emailAccountId: formData.emailAccountId === 'global' ? null : formData.emailAccountId,
        isDefault: formData.isDefault
      })
      setShowCreate(false)
      resetForm()
      await fetchData()
    } catch (err: any) {
      setError(err.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该模板？已绑定渠道会回退默认模板。')) return
    try {
      await api.delete(`/api/push-templates?id=${id}`)
      await fetchData()
    } catch (err: any) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleToggleActive = async (template: PushTemplate) => {
    try {
      await api.patch('/api/push-templates', {
        id: template.id,
        isActive: !template.isActive
      })
      await fetchData()
    } catch (err: any) {
      alert('更新失败: ' + err.message)
    }
  }

  const handleSetDefault = async (template: PushTemplate) => {
    try {
      await api.patch('/api/push-templates', {
        id: template.id,
        isDefault: true
      })
      await fetchData()
    } catch (err: any) {
      alert('设置默认失败: ' + err.message)
    }
  }

  const accountLabel = (emailAccountId: string | null) => {
    if (!emailAccountId) return '全局'
    const account = accounts.find((a) => a.id === emailAccountId)
    return account?.email || '未知账号'
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">模板管理</h1>
          <p className="text-muted-foreground">配置并复用推送模板，按邮箱隔离管理</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchData}
            className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            新建模板
          </motion.button>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-border bg-secondary/20 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">显示范围:</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
        >
          <option value="all">全部模板</option>
          <option value="global">全局模板</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.email}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20">
          <LayoutTemplate className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">暂无模板</h3>
          <p className="text-muted-foreground text-sm mb-6">创建模板后可在渠道中直接复用</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`bg-background rounded-2xl border p-6 shadow-sm ${
                template.isActive ? 'border-border hover:border-primary/50' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">默认</span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.type.toUpperCase()} · {accountLabel(template.emailAccountId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetDefault(template)}
                    className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-600"
                    title="设为默认"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                    title={template.isActive ? '停用' : '启用'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <pre className="bg-secondary/40 border border-border rounded-lg p-3 text-xs whitespace-pre-wrap break-words text-foreground max-h-48 overflow-auto">
                {template.content}
              </pre>

              <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>被渠道引用: {template._count?.channels || 0}</span>
                <span>{new Date(template.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl border border-border p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">新建模板</h2>

            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">模板名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="例如：告警通知模板"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">平台类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TemplateType })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="wechat">企业微信</option>
                    <option value="feishu">飞书</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">模板范围</label>
                  <select
                    value={formData.emailAccountId}
                    onChange={(e) => setFormData({ ...formData, emailAccountId: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="global">全局</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模板内容</label>
                <textarea
                  rows={10}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="支持变量: {from}, {subject}, {time}, {preview}, {body}"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                设为该范围内默认模板
              </label>

              <div className="flex gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm disabled:opacity-50"
                >
                  {submitting ? '创建中...' : '创建模板'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    resetForm()
                  }}
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
