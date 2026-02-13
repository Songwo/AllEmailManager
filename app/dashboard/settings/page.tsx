'use client'

import { motion } from 'framer-motion'
import { Mail, Settings, Bell, Moon, Sun, Globe, Shield, Database } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    },
    rateLimit: {
      maxPerMinute: 10,
      maxPerHour: 100
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30
    },
    general: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD'
    }
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
            { icon: Mail, label: '邮件列表', href: '/dashboard' },
            { icon: Settings, label: '系统设置', href: '/dashboard/settings', active: true },
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
            系统设置
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            配置系统参数和个人偏好
          </p>
        </div>

        <div className="space-y-6">
          {/* Notifications Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  通知设置
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  管理通知和静默时段
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    邮件通知
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    接收新邮件时发送通知
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                  })}
                  className="w-12 h-6 rounded-full appearance-none bg-slate-300 dark:bg-slate-700 checked:bg-sky-500 relative cursor-pointer transition-colors before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    推送通知
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    启用推送到第三方平台
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNotifications: e.target.checked }
                  })}
                  className="w-12 h-6 rounded-full appearance-none bg-slate-300 dark:bg-slate-700 checked:bg-sky-500 relative cursor-pointer transition-colors before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    声音提示
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    新邮件到达时播放提示音
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.soundEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, soundEnabled: e.target.checked }
                  })}
                  className="w-12 h-6 rounded-full appearance-none bg-slate-300 dark:bg-slate-700 checked:bg-sky-500 relative cursor-pointer transition-colors before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="font-medium text-slate-900 dark:text-slate-100 mb-4">
                  静默时段
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                      开始时间
                    </label>
                    <input
                      type="time"
                      value={settings.notifications.quietHoursStart}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, quietHoursStart: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                      结束时间
                    </label>
                    <input
                      type="time"
                      value={settings.notifications.quietHoursEnd}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, quietHoursEnd: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rate Limit Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  频率限制
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  防止推送过于频繁
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每分钟最大推送数
                </label>
                <input
                  type="number"
                  value={settings.rateLimit.maxPerMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    rateLimit: { ...settings.rateLimit, maxPerMinute: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每小时最大推送数
                </label>
                <input
                  type="number"
                  value={settings.rateLimit.maxPerHour}
                  onChange={(e) => setSettings({
                    ...settings,
                    rateLimit: { ...settings.rateLimit, maxPerHour: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </motion.div>

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  通用设置
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  语言、时区和显示格式
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  语言
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  时区
                </label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                  <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
                  <option value="America/New_York">美国东部时间 (UTC-5)</option>
                  <option value="Europe/London">格林威治时间 (UTC+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  日期格式
                </label>
                <select
                  value={settings.general.dateFormat}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, dateFormat: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="YYYY-MM-DD">2026-02-13</option>
                  <option value="MM/DD/YYYY">02/13/2026</option>
                  <option value="DD/MM/YYYY">13/02/2026</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              重置
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              保存设置
            </motion.button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
