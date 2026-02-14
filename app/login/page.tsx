'use client'

import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Loader2, Github } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const action = isLogin ? 'login' : 'register'
      const response = await fetch(`/api/auth?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data and JWT token
        const { token, ...userData } = data
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', token)
        router.push('/dashboard')
      } else {
        alert(data.error || '操作失败')
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground selection:bg-zinc-900 selection:text-zinc-50 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground group-hover:bg-primary/90 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {isLogin ? '欢迎回来' : '创建账户'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? '请输入您的凭证以继续访问' : '注册以开始管理您的邮件'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 sm:p-8">

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="用户名"
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="邮箱地址"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="密码"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? '登录' : '注册'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? '还没有账户？' : '已有账户？'}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-foreground hover:underline underline-offset-4"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <p className="text-center mt-8 text-xs text-muted-foreground">
          点击按钮即表示您同意
          <a href="#" className="hover:text-foreground underline underline-offset-2 mx-1">服务条款</a>
          和
          <a href="#" className="hover:text-foreground underline underline-offset-2 mx-1">隐私政策</a>
        </p>
      </motion.div>
    </div>
  )
}
