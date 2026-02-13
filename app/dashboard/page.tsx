'use client'

import { motion } from 'framer-motion'
import { Mail, Plus, Settings, Bell, Filter, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats] = useState({
    totalEmails: 1247,
    unread: 23,
    todayReceived: 45,
    activeAccounts: 3
  })

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
            { icon: Mail, label: '邮件列表', href: '/dashboard', active: true },
            { icon: Plus, label: '邮箱管理', href: '/dashboard/accounts' },
            { icon: Bell, label: '推送渠道', href: '/dashboard/channels' },
            { icon: Filter, label: '过滤规则', href: '/dashboard/filters' },
            { icon: TrendingUp, label: '统计分析', href: '/dashboard/analytics' },
            { icon: Settings, label: '系统设置', href: '/dashboard/settings' }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            邮件管理中心
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            实时监控您的所有邮箱账户
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: '总邮件数',
              value: stats.totalEmails,
              icon: Mail,
              color: 'from-sky-500 to-blue-500',
              change: '+12%'
            },
            {
              label: '未读邮件',
              value: stats.unread,
              icon: Bell,
              color: 'from-emerald-500 to-green-500',
              change: '-5%'
            },
            {
              label: '今日接收',
              value: stats.todayReceived,
              icon: TrendingUp,
              color: 'from-amber-500 to-orange-500',
              change: '+8%'
            },
            {
              label: '活跃账户',
              value: stats.activeAccounts,
              icon: Settings,
              color: 'from-purple-500 to-pink-500',
              change: '100%'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Email List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              最近邮件
            </h2>
            <button className="px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all">
              查看全部
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {[
              {
                from: 'GitHub <notifications@github.com>',
                subject: '[anthropics/claude-code] New release: v2.1.0',
                preview: 'We are excited to announce the release of Claude Code v2.1.0...',
                time: '5分钟前',
                unread: true,
                hasAttachment: false
              },
              {
                from: 'Vercel <no-reply@vercel.com>',
                subject: 'Your deployment is ready',
                preview: 'Your project "email-manager" has been successfully deployed...',
                time: '1小时前',
                unread: true,
                hasAttachment: false
              },
              {
                from: 'AWS <no-reply@aws.amazon.com>',
                subject: 'Monthly billing statement',
                preview: 'Your AWS bill for January 2026 is now available...',
                time: '3小时前',
                unread: false,
                hasAttachment: true
              }
            ].map((email, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ backgroundColor: 'var(--card-hover)' }}
                className="p-6 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${email.unread ? 'bg-sky-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${email.unread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {email.from}
                      </span>
                      {email.hasAttachment && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                          附件
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mb-1 ${email.unread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      {email.subject}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 truncate">
                      {email.preview}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
                    {email.time}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
