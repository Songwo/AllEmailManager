'use client'

import { motion } from 'framer-motion'
import { Mail, Zap, Shield, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-zinc-900 selection:text-zinc-50 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              EmailHub
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              登录
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              开始使用
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground mb-8">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
              </span>
              v2.0 全新发布
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground">
              重塑您的
              <span className="text-zinc-500 dark:text-zinc-400 block mt-2">邮件管理体验</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              不仅仅是聚合。我们将所有邮箱统一到一个极简的界面中，剔除噪音，让您专注于真正重要的沟通。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="group px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-all flex items-center gap-2"
              >
                立即开始
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-medium text-base hover:bg-secondary/80 transition-all"
              >
                了解更多
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Feature */}
            <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-background border border-border hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-8">
                <Mail className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">全平台邮箱聚合</h3>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
                不再需要在多个 App 之间切换。无论是 Gmail、Outlook、亦或是公司企业邮箱，EmailHub 都能完美支持。统一的收件箱，统一的操作体验。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
                {['Gmail', 'Outlook', 'QQ 邮箱', '163 邮箱', '企业微信', '自定义 IMAP'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Feature 1 */}
            <div className="p-10 rounded-3xl bg-background border border-border hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-500">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-8">
                <Zap className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">实时推送</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                毫秒级延迟。邮件到达的同时，您的微信或 Telegram 就会收到通知。
              </p>
            </div>

            {/* Secondary Feature 2 */}
            <div className="p-10 rounded-3xl bg-background border border-border hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-500">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-8">
                <Shield className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">隐私安全</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                本地加密存储，直接与邮件服务器通信。我们无法查看您的邮件内容。
              </p>
            </div>

            {/* Call to Action */}
            <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-primary text-primary-foreground flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">准备好提升效率了吗？</h3>
                <p className="text-primary-foreground/70">加入超过 10,000+ 用户，开始使用最智能的邮件管理工具。</p>
              </div>
              <div className="mt-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
                >
                  免费开始使用 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Mail className="w-3 h-3" />
            </div>
            <span className="font-semibold text-sm">EmailHub</span>
          </div>
          <p className="text-xs text-muted-foreground">© {currentYear} EmailHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
