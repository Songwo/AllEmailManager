'use client'

import { motion } from 'framer-motion'
import { Plus, Trash2, Power, Filter, Zap, ChevronRight, CheckCircle, Send, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

interface FilterRule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: {
    sender?: string[];
    subject?: string[];
    keywords?: string[];
  };
  actions: {
    pushChannels?: string[];
    markAsRead?: boolean;
    delete?: boolean;
  };
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface PushChannel {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function FilterRules() {
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [channels, setChannels] = useState<PushChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    senderList: [''],
    subjectKeywords: [''],
    bodyKeywords: [''],
    selectedChannels: [] as string[],
    markAsRead: false,
    deleteEmail: false,
    priority: 0
  })

  // Load filter rules and push channels
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [rulesData, channelsData] = await Promise.all([
          api.get<FilterRule[]>('/api/filter-rules'),
          api.get<PushChannel[]>('/api/push-channels')
        ])
        setFilters(rulesData)
        setChannels(channelsData.filter(c => c.isActive))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Toggle rule active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch('/api/filter-rules', { id, isActive: !currentStatus })
      setFilters(filters.map(f => f.id === id ? { ...f, isActive: !currentStatus } : f))
    } catch (err: any) {
      alert('切换状态失败: ' + err.message)
    }
  }

  // Delete rule
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条规则吗？')) return
    try {
      await api.delete(`/api/filter-rules?id=${id}`)
      setFilters(filters.filter(f => f.id !== id))
    } catch (err: any) {
      alert('删除失败: ' + err.message)
    }
  }

  // Create new rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.name.trim()) {
      alert('请输入规则名称')
      return
    }

    try {
      const newRule = await api.post<FilterRule>('/api/filter-rules', {
        name: formData.name,
        conditions: {
          sender: formData.senderList.filter(s => s.trim()),
          subject: formData.subjectKeywords.filter(s => s.trim()),
          keywords: formData.bodyKeywords.filter(s => s.trim())
        },
        actions: {
          pushChannels: formData.selectedChannels,
          markAsRead: formData.markAsRead,
          delete: formData.deleteEmail
        },
        priority: formData.priority
      })

      setFilters([newRule, ...filters])
      setShowAddModal(false)

      // Reset form
      setFormData({
        name: '',
        senderList: [''],
        subjectKeywords: [''],
        bodyKeywords: [''],
        selectedChannels: [],
        markAsRead: false,
        deleteEmail: false,
        priority: 0
      })
    } catch (err: any) {
      alert('创建规则失败: ' + err.message)
    }
  }

  // Helper to add input field
  const addField = (field: 'senderList' | 'subjectKeywords' | 'bodyKeywords') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] })
  }

  // Helper to update field value
  const updateField = (field: 'senderList' | 'subjectKeywords' | 'bodyKeywords', index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({ ...formData, [field]: newArray })
  }

  // Helper to remove field
  const removeField = (field: 'senderList' | 'subjectKeywords' | 'bodyKeywords', index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) })
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">加载失败: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
            过滤规则
          </h1>
          <p className="text-muted-foreground">
            自动化处理您的邮件：自动标记、转发或删除
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          新建规则
        </motion.button>
      </div>

      {/* Filters List */}
      <div className="space-y-4">
        {filters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无过滤规则</p>
            <p className="text-sm mt-2">点击"新建规则"创建第一条规则</p>
          </div>
        ) : (
          filters.map((filter, index) => (
            <motion.div
              key={filter.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background rounded-2xl border border-border p-6 hover:border-primary/50 transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${filter.isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-muted-foreground'
                    }`}>
                    <Filter className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                      {filter.name}
                      {!filter.isActive && (
                        <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-xs font-normal">
                          已禁用
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        优先级: {filter.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end mr-4">
                    <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      操作
                    </span>
                    <span className="text-sm font-medium px-2 py-1 bg-secondary rounded-lg text-foreground">
                      {filter.actions.delete ? '直接删除' :
                        filter.actions.markAsRead ? '标记为已读' :
                        filter.actions.pushChannels && filter.actions.pushChannels.length > 0 ? `推送到 ${filter.actions.pushChannels.length} 个渠道` : '无操作'}
                    </span>
                  </div>
                  <div className="h-10 w-[1px] bg-border mx-2" />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleActive(filter.id, filter.isActive)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                    title={filter.isActive ? '禁用规则' : '启用规则'}
                  >
                    <Power className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(filter.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                    title="删除规则"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Conditions Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                {filter.conditions.sender && filter.conditions.sender.length > 0 && (
                  filter.conditions.sender.map((sender, i) => (
                    <div key={`sender-${i}`} className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-sm flex items-center gap-2">
                      <span className="text-muted-foreground">发件人</span>
                      <span className="font-medium text-primary">包含</span>
                      <span className="font-semibold text-foreground">"{sender}"</span>
                    </div>
                  ))
                )}
                {filter.conditions.subject && filter.conditions.subject.length > 0 && (
                  filter.conditions.subject.map((subject, i) => (
                    <div key={`subject-${i}`} className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-sm flex items-center gap-2">
                      <span className="text-muted-foreground">主题</span>
                      <span className="font-medium text-primary">包含</span>
                      <span className="font-semibold text-foreground">"{subject}"</span>
                    </div>
                  ))
                )}
                {filter.conditions.keywords && filter.conditions.keywords.length > 0 && (
                  filter.conditions.keywords.map((keyword, i) => (
                    <div key={`keyword-${i}`} className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-sm flex items-center gap-2">
                      <span className="text-muted-foreground">正文</span>
                      <span className="font-medium text-primary">包含</span>
                      <span className="font-semibold text-foreground">"{keyword}"</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Filter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl border border-border p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              创建过滤规则
            </h2>

            <form onSubmit={handleCreateRule} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  规则名称 *
                </label>
                <input
                  type="text"
                  placeholder="例如：自动分类账单"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  优先级（数字越大优先级越高）
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  发件人条件（包含以下任一发件人）
                </label>
                <div className="space-y-2">
                  {formData.senderList.map((sender, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="例如：@company.com 或 boss@example.com"
                        value={sender}
                        onChange={(e) => updateField('senderList', index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary text-foreground ml-0"
                      />
                      {formData.senderList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField('senderList', index)}
                          className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('senderList')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> 添加发件人条件
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  主题关键词（包含以下任一关键词）
                </label>
                <div className="space-y-2">
                  {formData.subjectKeywords.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="例如：账单、发票"
                        value={keyword}
                        onChange={(e) => updateField('subjectKeywords', index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary text-foreground ml-0"
                      />
                      {formData.subjectKeywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField('subjectKeywords', index)}
                          className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('subjectKeywords')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> 添加主题关键词
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  正文关键词（包含以下任一关键词）
                </label>
                <div className="space-y-2">
                  {formData.bodyKeywords.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="例如：紧急、重要"
                        value={keyword}
                        onChange={(e) => updateField('bodyKeywords', index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary text-foreground ml-0"
                      />
                      {formData.bodyKeywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField('bodyKeywords', index)}
                          className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('bodyKeywords')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> 添加正文关键词
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  执行以下操作
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-all">
                    <input
                      type="checkbox"
                      checked={formData.markAsRead}
                      onChange={(e) => setFormData({ ...formData, markAsRead: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-sm">标记为已读</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-all">
                    <input
                      type="checkbox"
                      checked={formData.deleteEmail}
                      onChange={(e) => setFormData({ ...formData, deleteEmail: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <Trash2 className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-sm">直接删除</span>
                  </label>

                  {channels.length > 0 && (
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Send className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-sm">推送到渠道</span>
                      </div>
                      <div className="space-y-2 ml-7">
                        {channels.map((channel) => (
                          <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selectedChannels.includes(channel.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, selectedChannels: [...formData.selectedChannels, channel.id] })
                                } else {
                                  setFormData({ ...formData, selectedChannels: formData.selectedChannels.filter(id => id !== channel.id) })
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{channel.name} ({channel.type})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm"
                >
                  创建规则
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
