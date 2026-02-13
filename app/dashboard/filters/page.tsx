'use client'

import { motion } from 'framer-motion'
import { Mail, Plus, Trash2, Power, Filter as FilterIcon, Edit } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function FilterRules() {
  const [rules, setRules] = useState([
    {
      id: '1',
      name: '重要客户邮件',
      isActive: true,
      priority: 10,
      conditions: {
        sender: ['client@important.com', 'vip@company.com'],
        keywords: ['urgent', '紧急']
      },
      actions: {
        pushChannels: ['企业微信', '飞书'],
        markAsRead: false
      },
      matchCount: 45
    },
    {
      id: '2',
      name: 'GitHub 通知',
      isActive: true,
      priority: 5,
      conditions: {
        sender: ['notifications@github.com'],
        subject: ['Pull Request', 'Issue']
      },
      actions: {
        pushChannels: ['Telegram'],
        markAsRead: true
      },
      matchCount: 234
    },
    {
      id: '3',
      name: '营销邮件过滤',
      isActive: false,
      priority: 1,
      conditions: {
        keywords: ['促销', '优惠', 'marketing']
      },
      actions: {
        markAsRead: true,
        delete: false
      },
      matchCount: 567
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            EmailHub
          </span>
        </Link>

        <nav className="space-y-2">
          {[
            { icon: Mail, label: '邮件列表', href: '/dashboard' },
            { icon: Plus, label: '邮箱管理', href: '/dashboard/accounts' },
            { icon: FilterIcon, label: '过滤规则', href: '/dashboard/filters', active: true },
          ].map((item, index) => (
            <motion.div key={index} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              过滤规则
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              自定义邮件过滤和自动化处理规则
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            创建规则
          </motion.button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    rule.isActive
                      ? 'bg-gradient-to-br from-sky-500 to-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}>
                    <FilterIcon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {rule.name}
                      </h3>
                      <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full text-sm font-medium">
                        优先级 {rule.priority}
                      </span>
                      {rule.isActive ? (
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm">
                          运行中
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm">
                          已暂停
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Conditions */}
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          匹配条件:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule.conditions.sender && rule.conditions.sender.map((sender, i) => (
                            <span key={i} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                              发件人: {sender}
                            </span>
                          ))}
                          {rule.conditions.subject && rule.conditions.subject.map((subject, i) => (
                            <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm">
                              主题: {subject}
                            </span>
                          ))}
                          {rule.conditions.keywords && rule.conditions.keywords.map((keyword, i) => (
                            <span key={i} className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-lg text-sm">
                              关键词: {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          执行动作:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule.actions.pushChannels && rule.actions.pushChannels.map((channel, i) => (
                            <span key={i} className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-lg text-sm">
                              推送至: {channel}
                            </span>
                          ))}
                          {rule.actions.markAsRead && (
                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
                              标记已读
                            </span>
                          )}
                          {rule.actions.delete && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                              删除邮件
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        已匹配 <span className="font-semibold text-slate-900 dark:text-slate-100">{rule.matchCount}</span> 封邮件
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Power className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Rule Modal */}
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                创建过滤规则
              </h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    规则名称
                  </label>
                  <input
                    type="text"
                    placeholder="例如：重要客户邮件"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    优先级 (数字越大优先级越高)
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    defaultValue={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    匹配条件
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        发件人 (多个用逗号分隔)
                      </label>
                      <input
                        type="text"
                        placeholder="client@company.com, vip@example.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        主题关键词 (多个用逗号分隔)
                      </label>
                      <input
                        type="text"
                        placeholder="urgent, 紧急, important"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        正文关键词 (多个用逗号分隔)
                      </label>
                      <input
                        type="text"
                        placeholder="合同, contract, 发票"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    执行动作
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        推送到渠道
                      </label>
                      <div className="space-y-2">
                        {['企业微信通知', '飞书工作群', 'Telegram 个人'].map((channel) => (
                          <label key={channel} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                            />
                            <span className="text-slate-900 dark:text-slate-100">{channel}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-1">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-slate-900 dark:text-slate-100">标记为已读</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-1">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-slate-900 dark:text-slate-100">删除邮件</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    创建规则
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    取消
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
