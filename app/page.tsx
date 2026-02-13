'use client'

import { motion } from 'framer-motion'
import { Mail, Zap, Shield, Bell, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transition-all duration-300">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
              EmailHub
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-4"
          >
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              登录
            </Link>
            <Link
              href="/dashboard"
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-lg hover:shadow-xl hover:shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-medium"
            >
              开始使用
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6 sm:mb-8"
            >
              <div className="px-4 py-2 bg-gradient-to-r from-sky-100 to-emerald-100 dark:from-sky-900/30 dark:to-emerald-900/30 rounded-full text-sky-600 dark:text-sky-400 text-sm font-medium shadow-lg shadow-sky-500/10 backdrop-blur-sm border border-sky-200/50 dark:border-sky-800/50">
                ✨ 智能邮件管理平台
              </div>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 bg-gradient-to-r from-slate-900 via-sky-700 to-emerald-700 dark:from-slate-100 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-transparent leading-tight tracking-tight px-4">
              统一管理所有邮箱
              <br />
              实时推送重要消息
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 font-normal">
              支持多邮箱绑定，智能过滤规则，接入微信、飞书、Telegram 等平台，让重要邮件不再错过
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
            >
              <Link
                href="/dashboard"
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                立即开始
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="#features"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-slate-200 dark:border-slate-700 text-base sm:text-lg"
              >
                了解更多
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4"
            id="features"
          >
            {[
              {
                icon: Mail,
                title: '多邮箱管理',
                description: '支持 Gmail、Outlook、QQ 等主流邮箱，统一管理',
                color: 'from-sky-500 to-blue-500'
              },
              {
                icon: Zap,
                title: '实时推送',
                description: '接入微信、飞书、Telegram，第一时间收到通知',
                color: 'from-emerald-500 to-green-500'
              },
              {
                icon: Shield,
                title: '智能过滤',
                description: '自定义规则，按发件人、主题、关键词精准过滤',
                color: 'from-amber-500 to-orange-500'
              },
              {
                icon: Bell,
                title: '防骚扰策略',
                description: '频率限制、静默时段，避免消息轰炸',
                color: 'from-violet-500 to-purple-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-sky-500/10 hover:border-sky-300/50 dark:hover:border-sky-700/50 transition-all duration-300 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white/60 to-sky-50/60 dark:from-slate-900/60 dark:to-slate-800/60 backdrop-blur-md border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center">
            {[
              { value: '10+', label: '支持邮箱类型' },
              { value: '3', label: '推送平台' },
              { value: '99.9%', label: '消息送达率' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                className="group"
              >
                <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center text-slate-600 dark:text-slate-400">
          <p className="text-sm sm:text-base">© {currentYear} EmailHub. 让邮件管理更简单.</p>
        </div>
      </footer>
    </div>
  )
}
