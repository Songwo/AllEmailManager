import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.userId

    // Overview stats
    const [totalEmails, unreadEmails, todayEmails, activeAccounts, totalAccounts] = await Promise.all([
      prisma.email.count({
        where: { emailAccount: { userId } }
      }),
      prisma.email.count({
        where: { emailAccount: { userId }, isRead: false }
      }),
      prisma.email.count({
        where: {
          emailAccount: { userId },
          receivedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.emailAccount.count({
        where: { userId, isActive: true, status: 'connected' }
      }),
      prisma.emailAccount.count({
        where: { userId }
      })
    ])

    // Push stats
    const [totalPushes, successfulPushes, failedPushes] = await Promise.all([
      prisma.pushLog.count({
        where: { channel: { userId } }
      }),
      prisma.pushLog.count({
        where: { channel: { userId }, status: 'success' }
      }),
      prisma.pushLog.count({
        where: { channel: { userId }, status: 'failed' }
      })
    ])

    const successRate = totalPushes > 0
      ? ((successfulPushes / totalPushes) * 100).toFixed(1)
      : '100.0'

    // Email trend (last 7 days) - using Prisma groupBy with SQLite-compatible approach
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Get recent emails and group in JS for SQLite compatibility
    const recentEmails = await prisma.email.findMany({
      where: {
        emailAccount: { userId },
        receivedAt: { gte: sevenDaysAgo }
      },
      select: { receivedAt: true },
      orderBy: { receivedAt: 'asc' }
    })

    // Group by date in JavaScript
    const trendMap: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      trendMap[dateStr] = 0
    }
    for (const e of recentEmails) {
      const dateStr = new Date(e.receivedAt).toISOString().split('T')[0]
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr]++
      }
    }
    const emailTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }))

    // Top senders
    const allEmails = await prisma.email.findMany({
      where: { emailAccount: { userId } },
      select: { fromAddress: true },
      take: 5000
    })

    const senderMap: Record<string, number> = {}
    for (const e of allEmails) {
      senderMap[e.fromAddress] = (senderMap[e.fromAddress] || 0) + 1
    }
    const topSenders = Object.entries(senderMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([sender, count]) => ({ sender, count }))

    // Account breakdown
    const accounts = await prisma.emailAccount.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        provider: true,
        status: true,
        _count: { select: { emails: true } }
      }
    })

    return NextResponse.json({
      overview: {
        totalEmails,
        unreadEmails,
        todayEmails,
        activeAccounts,
        totalAccounts
      },
      pushStats: {
        totalPushes,
        successfulPushes,
        failedPushes,
        successRate
      },
      emailTrend,
      topSenders,
      accounts
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
