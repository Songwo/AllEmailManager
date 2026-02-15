'use client'

import { motion } from 'framer-motion'
import { Mail, TrendingUp, BarChart3, PieChart, Activity, Loader2, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

interface AnalyticsData {
  overview: {
    totalEmails: number
    unreadEmails: number
    todayEmails: number
    activeAccounts: number
    totalAccounts: number
  }
  pushStats: {
    totalPushes: number
    successfulPushes: number
    failedPushes: number
    successRate: string
  }
  emailTrend: { date: string; count: number }[]
  topSenders: { sender: string; count: number }[]
  accounts: {
    id: string
    email: string
    provider: string
    status: string
    _count: { emails: number }
  }[]
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await api.get<AnalyticsData>('/api/analytics')
        setData(result)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        加载统计数据失败
      </div>
    )
  }

  const maxTrend = Math.max(...data.emailTrend.map(d => d.count), 1)
  const maxSender = data.topSenders.length > 0 ? data.topSenders[0].count : 1
  const totalSenderEmails = data.topSenders.reduce((sum, s) => sum + s.count, 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          统计分析
        </h1>
        <p className="text-muted-foreground">
          查看邮件接收和推送的详细统计数据
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '总邮件', value: data.overview.totalEmails, icon: Mail, color: 'from-blue-500 to-indigo-500' },
          { label: '未读', value: data.overview.unreadEmails, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
          { label: '今日接收', value: data.overview.todayEmails, icon: BarChart3, color: 'from-emerald-500 to-green-500' },
          { label: '推送成功率', value: `${data.pushStats.successRate}%`, icon: Activity, color: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-background rounded-xl border border-border p-5"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Email Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">邮件接收趋势</h2>
            <p className="text-sm text-muted-foreground">最近 7 天</p>
          </div>
        </div>

        {data.emailTrend.length > 0 ? (
          <div className="flex items-end justify-between gap-4 h-64">
            {data.emailTrend.map((item, index) => (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.count / maxTrend) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full min-h-[4px] bg-gradient-to-t from-sky-500 to-emerald-500 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                    {item.count} 封
                  </div>
                </motion.div>
                <span className="text-xs text-muted-foreground mt-2">
                  {item.date.slice(5)}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            暂无趋势数据
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Senders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">发件人排行</h2>
              <p className="text-sm text-muted-foreground">邮件数量最多的发件人</p>
            </div>
          </div>

          {data.topSenders.length > 0 ? (
            <div className="space-y-4">
              {data.topSenders.map((sender, index) => (
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
                      <span className="font-medium text-sm truncate max-w-[200px]">
                        {sender.sender}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {sender.count} 封
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(sender.count / totalSenderEmails) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">暂无数据</div>
          )}
        </motion.div>

        {/* Account Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">邮箱账户分布</h2>
              <p className="text-sm text-muted-foreground">各账户邮件数量</p>
            </div>
          </div>

          {data.accounts.length > 0 ? (
            <div className="space-y-4">
              {data.accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">{account.email}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${account.status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-destructive/10 text-destructive'
                      }`}>
                      {account.status === 'connected' ? '已连接' : account.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{account.provider}</span>
                    <span className="font-semibold">{account._count.emails} 封</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              暂无邮箱账户
            </div>
          )}

          {/* Push Stats Summary */}
          {data.pushStats.totalPushes > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">推送统计</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold">{data.pushStats.totalPushes}</div>
                  <div className="text-xs text-muted-foreground">总推送</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.pushStats.successfulPushes}</div>
                  <div className="text-xs text-muted-foreground">成功</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-destructive">{data.pushStats.failedPushes}</div>
                  <div className="text-xs text-muted-foreground">失败</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
