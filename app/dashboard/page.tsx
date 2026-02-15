'use client'

import { Mail, Bell, TrendingUp, Settings, Loader2, Search, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  overview: {
    totalEmails: number
    unreadEmails: number
    todayEmails: number
    activeAccounts: number
  }
  accounts?: AccountItem[]
}

interface EmailItem {
  id: string
  fromAddress: string
  subject: string
  body: string | null
  bodyHtml: string | null
  receivedAt: string
  isRead: boolean
  emailAccount: {
    email: string
    provider: string
  }
}

interface AccountItem {
  id: string
  email: string
  provider: string
  status: string
}

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: '7days', label: '最近7天' },
  { value: '30days', label: '最近30天' },
] as const

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
  const [emailsLoading, setEmailsLoading] = useState(false)

  // Filter states
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dateRange, setDateRange] = useState<string>('all')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accounts, setAccounts] = useState<AccountItem[]>([])

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build email query URL from current filters
  const buildEmailUrl = useCallback((keyword: string, range: string, accountId: string) => {
    const params = new URLSearchParams({ limit: '50' })
    if (keyword.trim()) params.set('search', keyword.trim())
    if (range !== 'all') params.set('dateRange', range)
    if (accountId) params.set('emailAccountId', accountId)
    return `/api/emails?${params.toString()}`
  }, [])

  // Fetch only emails with current filters
  const fetchEmails = useCallback(async (keyword: string, range: string, accountId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setEmailsLoading(true)
    try {
      const res = await fetch(buildEmailUrl(keyword, range, accountId), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails || [])
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setEmailsLoading(false)
    }
  }, [buildEmailUrl])

  // Fetch analytics + initial emails
  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const headers = { 'Authorization': `Bearer ${token}` }

      const [analyticsRes, emailsRes] = await Promise.all([
        fetch('/api/analytics', { headers }),
        fetch(buildEmailUrl(searchKeyword, dateRange, selectedAccountId), { headers })
      ])

      if (analyticsRes.ok) {
        const analytics: AnalyticsData = await analyticsRes.json()
        setStats({
          totalEmails: analytics.overview.totalEmails,
          unread: analytics.overview.unreadEmails,
          todayReceived: analytics.overview.todayEmails,
          activeAccounts: analytics.overview.activeAccounts
        })
        if (analytics.accounts) {
          setAccounts(analytics.accounts)
        }
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

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchEmails(value, dateRange, selectedAccountId)
    }, 300)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      fetchEmails(searchKeyword, dateRange, selectedAccountId)
    }
  }

  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    fetchEmails(searchKeyword, range, selectedAccountId)
  }

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId)
    fetchEmails(searchKeyword, dateRange, accountId)
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Initial fetch
    fetchData()

    // Connect to SSE for real-time updates
    const token = localStorage.getItem('token')
    if (!token) return

    const eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`, {
      withCredentials: true
    })

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'new_email') {
          console.log('New email received:', data.email)
          // Refresh data immediately
          fetchData()
        } else if (data.type === 'heartbeat') {
          console.log('SSE heartbeat')
        } else if (data.type === 'connected') {
          console.log('SSE connected')
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error)
      }
    }

    eventSource.onerror = () => {
      // EventSource onerror does not expose useful details in browsers.
      // Avoid noisy {} logs and simply close the broken stream.
      console.warn('SSE connection dropped')
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
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
        <div className="p-5 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              最近邮件
            </h2>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索主题、发件人或正文..."
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Date Range Buttons */}
            <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
              {DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDateRangeChange(option.value)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    dateRange === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="relative flex-shrink-0">
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">全部邮箱</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-border">
          {loading || emailsLoading ? (
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
                    </div>
                    <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                      {email.body?.substring(0, 100) || '(无内容预览)'}
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
