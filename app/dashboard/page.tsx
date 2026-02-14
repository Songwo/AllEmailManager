'use client'

import { Mail, Bell, TrendingUp, Settings, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  overview: {
    totalEmails: number
    unreadEmails: number
    todayEmails: number
    activeAccounts: number
  }
}

interface EmailItem {
  id: string
  fromAddress: string
  subject: string
  textContent: string | null
  receivedAt: string
  isRead: boolean
  hasAttachments: boolean
  emailAccount: {
    email: string
    provider: string
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [stats, setStats] = useState({
    totalEmails: 0,
    unread: 0,
    todayReceived: 0,
    activeAccounts: 0
  })
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const token = localStorage.getItem('token')
    if (!token) return

    // Fetch analytics
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` }

        const [analyticsRes, emailsRes] = await Promise.all([
          fetch('/api/analytics', { headers }),
          fetch('/api/emails?limit=10', { headers })
        ])

        if (analyticsRes.ok) {
          const analytics: AnalyticsData = await analyticsRes.json()
          setStats({
            totalEmails: analytics.overview.totalEmails,
            unread: analytics.overview.unreadEmails,
            todayReceived: analytics.overview.todayEmails,
            activeAccounts: analytics.overview.activeAccounts
          })
        }

        if (emailsRes.ok) {
          const emailData = await emailsRes.json()
          setEmails(emailData.emails || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin}分钟前`
    if (diffHour < 24) return `${diffHour}小时前`
    if (diffDay < 7) return `${diffDay}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          仪表盘
        </h1>
        <p className="text-muted-foreground text-sm">
          欢迎回来，{user?.name || 'User'}。这里是您的今日概览。
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: '总邮件数',
            value: stats.totalEmails,
            icon: Mail,
            color: 'text-blue-600 dark:text-blue-400'
          },
          {
            label: '未读邮件',
            value: stats.unread,
            icon: Bell,
            color: 'text-amber-600 dark:text-amber-400'
          },
          {
            label: '今日接收',
            value: stats.todayReceived,
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400'
          },
          {
            label: '活跃账户',
            value: stats.activeAccounts,
            icon: Settings,
            color: 'text-violet-600 dark:text-violet-400'
          }
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-background rounded-xl p-5 border border-border hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight mb-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Email List */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
          <h2 className="text-base font-semibold">
            最近邮件
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-primary hover:underline"
          >
            查看全部
          </button>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无邮件</p>
              <p className="text-xs mt-1">添加邮箱账户后，新邮件将显示在这里</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="p-4 hover:bg-muted/30 cursor-pointer transition-colors group"
                onClick={() => router.push(`/dashboard/email/${email.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${email.isRead ? 'bg-transparent' : 'bg-indigo-500'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {email.fromAddress.split('<')[0].trim() || email.fromAddress}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline-block">
                        &lt;{email.emailAccount?.email}&gt;
                      </span>
                      {email.hasAttachments && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded border border-border">
                          附件
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                      {email.textContent?.substring(0, 100) || '(无内容预览)'}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                    {formatTime(email.receivedAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
