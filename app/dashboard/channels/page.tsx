'use client'

import { motion } from 'framer-motion'
import { Plus, Trash2, Power, Loader2, Send } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { pushChannelTypes } from '@/lib/constants'

type ChannelType = 'wechat' | 'feishu' | 'telegram'

interface PushChannel {
  id: string
  type: ChannelType
  name: string
  config: Record<string, string>
  isActive: boolean
  cardTemplate: string | null
  createdAt: string
  _count: { pushLogs: number }
}

export default function PushChannels() {
  const [channels, setChannels] = useState<PushChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedType, setSelectedType] = useState<ChannelType>('wechat')
  const [formName, setFormName] = useState('')
  const [formConfig, setFormConfig] = useState<Record<string, string>>({})
  const [formTemplate, setFormTemplate] = useState('')

  const channelIcons: Record<ChannelType, string> = {
    wechat: '💬', feishu: '🚀', telegram: '✈️'
  }
  const channelColors: Record<ChannelType, string> = {
    wechat: 'from-green-500 to-emerald-500',
    feishu: 'from-blue-500 to-sky-500',
    telegram: 'from-sky-500 to-cyan-500'
  }

  const fetchChannels = useCallback(async () => {
    try {
      const data = await api.get<PushChannel[]>('/api/push-channels')
      setChannels(data)
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  const resetForm = () => {
    setFormName('')
    setFormConfig({})
    setFormTemplate('')
    setSelectedType('wechat')
    setError('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/push-channels', {
        type: selectedType,
        name: formName,
        config: formConfig,
        cardTemplate: formTemplate || undefined
      })
      setShowAddModal(false)
      resetForm()
      await fetchChannels()
    } catch (err: any) {
      setError(err.message || '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (channel: PushChannel) => {
    try {
      await api.patch('/api/push-channels', {
        id: channel.id,
        isActive: !channel.isActive
      })
      await fetchChannels()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此推送渠道？')) return
    try {
      await api.delete(`/api/push-channels?id=${id}`)
      await fetchChannels()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const currentTypeConfig = pushChannelTypes.find(t => t.type === selectedType)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">推送渠道</h1>
          <p className="text-muted-foreground">配置微信、飞书、Telegram 等推送渠道</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          添加渠道
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel, index) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`bg-background rounded-2xl border border-border p-6 transition-all shadow-sm ${channel.isActive ? 'hover:border-primary/50' : 'opacity-60'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${channelColors[channel.type]} flex items-center justify-center text-3xl shadow-sm`}>
                  {channelIcons[channel.type]}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggle(channel)}
                    className={`p-2 rounded-lg transition-colors ${channel.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-secondary text-muted-foreground'
                      }`}
                  >
                    <Power className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(channel.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{channel.name}</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">推送次数</span>
                  <span className="font-medium">{channel._count?.pushLogs ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">类型</span>
                  <span className="font-medium">
                    {channel.type === 'wechat' ? '企业微信' : channel.type === 'feishu' ? '飞书' : 'Telegram'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <span className={`font-medium ${channel.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {channel.isActive ? '运行中' : '已暂停'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => setShowAddModal(true)}
            className="bg-secondary/30 rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
              <Plus className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">添加新渠道</p>
          </motion.div>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl border border-border p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">添加推送渠道</h2>

            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">选择平台</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['wechat', 'feishu', 'telegram'] as const).map((type) => (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedType(type); setFormConfig({}) }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="text-4xl mb-2 text-center">{channelIcons[type]}</div>
                      <div className="text-sm font-medium text-center">
                        {type === 'wechat' ? '企业微信' : type === 'feishu' ? '飞书' : 'Telegram'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">渠道名称</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="例如：工作通知群"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              {currentTypeConfig?.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={formConfig[field.name] || ''}
                    onChange={e => setFormConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              ))}

              {currentTypeConfig?.instructions && (
                <p className="text-sm text-muted-foreground">
                  💡 {currentTypeConfig.instructions}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">消息模板（可选）</label>
                <textarea
                  rows={3}
                  value={formTemplate}
                  onChange={e => setFormTemplate(e.target.value)}
                  placeholder="自定义消息格式，留空使用默认模板"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  可用变量: {'{from}'}, {'{subject}'}, {'{time}'}, {'{preview}'}
                </p>
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
                    <><Loader2 className="w-4 h-4 animate-spin" />添加中...</>
                  ) : (
                    <><Send className="w-4 h-4" />添加渠道</>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm() }}
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
