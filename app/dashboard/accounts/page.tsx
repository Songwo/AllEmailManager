'use client'

import { motion } from 'framer-motion'
import { Mail, Plus, Trash2, Power, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([
    {
      id: '1',
      email: 'work@example.com',
      provider: 'Gmail',
      status: 'connected',
      lastSyncAt: new Date(),
      emailCount: 847
    },
    {
      id: '2',
      email: 'personal@outlook.com',
      provider: 'Outlook',
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 300000),
      emailCount: 234
    },
    {
      id: '3',
      email: 'business@qq.com',
      provider: 'QQ Mail',
      status: 'error',
      lastSyncAt: new Date(Date.now() - 3600000),
      emailCount: 166,
      errorMessage: 'Authentication failed'
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Same as dashboard */}
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
            { icon: Plus, label: '邮箱管理', href: '/dashboard/accounts', active: true },
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
              邮箱管理
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              添加和管理您的邮箱账户
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            添加邮箱
          </motion.button>
        </div>

        {/* Email Accounts Grid */}
        <div className="grid gap-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    account.status === 'connected'
                      ? 'bg-gradient-to-br from-sky-500 to-emerald-500'
                      : 'bg-gradient-to-br from-red-500 to-orange-500'
                  }`}>
                    <Mail className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {account.email}
                      </h3>
                      {account.status === 'connected' ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          已连接
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm">
                          <AlertCircle className="w-4 h-4" />
                          连接失败
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                      <span>提供商: {account.provider}</span>
                      <span>邮件数: {account.emailCount}</span>
                      <span>
                        最后同步: {new Date(account.lastSyncAt).toLocaleString('zh-CN')}
                      </span>
                    </div>

                    {account.errorMessage && (
                      <div className="mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {account.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

        {/* Add Email Modal */}
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
                添加邮箱账户
              </h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    邮箱提供商
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100">
                    <option>Gmail</option>
                    <option>Outlook</option>
                    <option>QQ Mail</option>
                    <option>163 Mail</option>
                    <option>自定义</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      IMAP 主机
                    </label>
                    <input
                      type="text"
                      placeholder="imap.gmail.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      IMAP 端口
                    </label>
                    <input
                      type="number"
                      placeholder="993"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    密码或应用专用密码
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    建议使用应用专用密码以提高安全性
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
