import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get email statistics
    const totalEmails = await prisma.email.count({
      where: {
        emailAccount: {
          userId
        }
      }
    })

    const unreadEmails = await prisma.email.count({
      where: {
        emailAccount: {
          userId
        },
        isRead: false
      }
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEmails = await prisma.email.count({
      where: {
        emailAccount: {
          userId
        },
        receivedAt: {
          gte: todayStart
        }
      }
    })

    const activeAccounts = await prisma.emailAccount.count({
      where: {
        userId,
        isActive: true,
        status: 'connected'
      }
    })

    // Get push statistics
    const totalPushes = await prisma.pushLog.count({
      where: {
        channel: {
          userId
        }
      }
    })

    const successfulPushes = await prisma.pushLog.count({
      where: {
        channel: {
          userId
        },
        status: 'success'
      }
    })

    const successRate = totalPushes > 0
      ? ((successfulPushes / totalPushes) * 100).toFixed(1)
      : '0'

    // Get email trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const emailTrend = await prisma.$queryRaw`
      SELECT
        DATE(received_at) as date,
        COUNT(*) as count
      FROM "Email"
      WHERE email_account_id IN (
        SELECT id FROM "EmailAccount" WHERE user_id = ${userId}
      )
      AND received_at >= ${sevenDaysAgo}
      GROUP BY DATE(received_at)
      ORDER BY date ASC
    `

    // Get top senders
    const topSenders = await prisma.$queryRaw`
      SELECT
        "from" as sender,
        COUNT(*) as count
      FROM "Email"
      WHERE email_account_id IN (
        SELECT id FROM "EmailAccount" WHERE user_id = ${userId}
      )
      GROUP BY "from"
      ORDER BY count DESC
      LIMIT 10
    `

    return NextResponse.json({
      overview: {
        totalEmails,
        unreadEmails,
        todayEmails,
        activeAccounts
      },
      pushStats: {
        totalPushes,
        successfulPushes,
        successRate
      },
      emailTrend,
      topSenders
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
