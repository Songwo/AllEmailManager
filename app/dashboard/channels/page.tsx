'use client'

import { motion } from 'framer-motion'
import { Mail, Plus, Trash2, Power, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function PushChannels() {
  const [channels, setChannels] = useState([
    {
      id: '1',
      name: '企业微信通知',
      type: 'wechat',
      isActive: true,
      pushCount: 234,
      successRate: 99.5
    },
    {
      id: '2',
      name: '飞书工作群',
      type: 'feishu',
      isActive: true,
      pushCount: 156,
      successRate: 100
    },
    {
      id: '3',
      name: 'Telegram 个人',
      type: 'telegram',
      isActive: false,
      pushCount: 89,
      successRate: 98.8
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<'wechat' | 'feishu' | 'telegram'>('wechat')

  const channelIcons = {
    wechat: '💬',
    feishu: '🚀',
    telegram: '✈️'
  }

  const channelColors = {
    wechat: 'from-green-500 to-emerald-500',
    feishu: 'from-blue-500 to-sky-500',
    telegram: 'from-sky-500 to-cyan-500'
  }

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
            { icon: Send, label: '推送渠道', href: '/dashboard/channels', active: true },
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
              推送渠道
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              配置微信、飞书、Telegram 等推送渠道
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            添加渠道
          </motion.button>
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel, index) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${channelColors[channel.type]} flex items-center justify-center text-3xl`}>
                  {channelIcons[channel.type]}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-lg transition-colors ${
                      channel.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </motion.button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {channel.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">推送次数</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {channel.pushCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">成功率</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {channel.successRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">状态</span>
                  <span className={`font-medium ${
                    channel.isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}>
                    {channel.isActive ? '运行中' : '已暂停'}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                编辑配置
              </motion.button>
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => setShowAddModal(true)}
            className="bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 dark:hover:border-sky-500 transition-all min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Plus className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              添加新渠道
            </p>
          </motion.div>
        </div>

        {/* Add Channel Modal */}
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
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                添加推送渠道
              </h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    选择平台
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['wechat', 'feishu', 'telegram'] as const).map((type) => (
                      <motion.div
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedType(type)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedType === type
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="text-4xl mb-2 text-center">
                          {channelIcons[type]}
                        </div>
                        <div className="text-sm font-medium text-center text-slate-900 dark:text-slate-100">
                          {type === 'wechat' ? '企业微信' : type === 'feishu' ? '飞书' : 'Telegram'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    渠道名称
                  </label>
                  <input
                    type="text"
                    placeholder="例如：工作通知群"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {selectedType === 'wechat' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {selectedType === 'feishu' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {selectedType === 'telegram' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bot Token
                      </label>
                      <input
                        type="text"
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Chat ID
                      </label>
                      <input
                        type="text"
                        placeholder="123456789"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    消息模板（可选）
                  </label>
                  <textarea
                    rows={4}
                    placeholder="自定义消息格式，留空使用默认模板"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 resize-none"
                  />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    可用变量: {'{from}'}, {'{subject}'}, {'{time}'}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    测试并添加
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
