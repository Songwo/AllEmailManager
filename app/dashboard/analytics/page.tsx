'use client'

import { motion } from 'framer-motion'
import { Mail, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function Analytics() {
  const [stats] = useState({
    emailTrend: [
      { date: '02-07', count: 45 },
      { date: '02-08', count: 52 },
      { date: '02-09', count: 38 },
      { date: '02-10', count: 61 },
      { date: '02-11', count: 48 },
      { date: '02-12', count: 55 },
      { date: '02-13', count: 45 }
    ],
    topSenders: [
      { sender: 'GitHub', count: 234, percentage: 18.8 },
      { sender: 'Vercel', count: 156, percentage: 12.5 },
      { sender: 'AWS', count: 123, percentage: 9.9 },
      { sender: 'Google', count: 98, percentage: 7.9 },
      { sender: 'Microsoft', count: 87, percentage: 7.0 }
    ],
    channelStats: [
      { name: '企业微信', pushes: 234, success: 233, rate: 99.6 },
      { name: '飞书', pushes: 156, success: 156, rate: 100 },
      { name: 'Telegram', pushes: 89, success: 88, rate: 98.9 }
    ]
  })

  const maxCount = Math.max(...stats.emailTrend.map(d => d.count))

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
            { icon: TrendingUp, label: '统计分析', href: '/dashboard/analytics', active: true },
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            统计分析
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            查看邮件接收和推送的详细统计数据
          </p>
        </div>

        {/* Email Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                邮件接收趋势
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                最近 7 天
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-64">
            {stats.emailTrend.map((item, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(item.count / maxCount) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full bg-gradient-to-t from-sky-500 to-emerald-500 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {item.count} 封
                  </div>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {item.date}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Senders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  发件人排行
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  邮件数量最多的发件人
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {stats.topSenders.map((sender, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {sender.sender}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {sender.count} 封
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sender.percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Channel Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  推送渠道表现
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  各渠道推送成功率
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {stats.channelStats.map((channel, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {channel.name}
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {channel.rate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-1">
                        总推送
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {channel.pushes}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-1">
                        成功
                      </div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {channel.success}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.rate}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
