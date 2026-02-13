#!/usr/bin/env node

/**
 * EmailHub 数据统计脚本
 *
 * 生成系统使用统计报告
 */

import { prisma } from '../lib/prisma'
import { format } from 'date-fns'

async function generateReport() {
  console.log('📊 EmailHub Statistics Report')
  console.log('=============================')
  console.log(`Generated at: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log()

  // User statistics
  const userCount = await prisma.user.count()
  console.log('👥 Users')
  console.log(`   Total: ${userCount}`)
  console.log()

  // Email account statistics
  const totalAccounts = await prisma.emailAccount.count()
  const activeAccounts = await prisma.emailAccount.count({
    where: { isActive: true }
  })
  const connectedAccounts = await prisma.emailAccount.count({
    where: { status: 'connected' }
  })

  console.log('📧 Email Accounts')
  console.log(`   Total: ${totalAccounts}`)
  console.log(`   Active: ${activeAccounts}`)
  console.log(`   Connected: ${connectedAccounts}`)
  console.log()

  // Email statistics
  const totalEmails = await prisma.email.count()
  const unreadEmails = await prisma.email.count({
    where: { isRead: false }
  })
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEmails = await prisma.email.count({
    where: {
      receivedAt: { gte: todayStart }
    }
  })

  console.log('✉️  Emails')
  console.log(`   Total: ${totalEmails}`)
  console.log(`   Unread: ${unreadEmails}`)
  console.log(`   Today: ${todayEmails}`)
  console.log()

  // Push channel statistics
  const totalChannels = await prisma.pushChannel.count()
  const activeChannels = await prisma.pushChannel.count({
    where: { isActive: true }
  })
  const channelsByType = await prisma.pushChannel.groupBy({
    by: ['type'],
    _count: true
  })

  console.log('📤 Push Channels')
  console.log(`   Total: ${totalChannels}`)
  console.log(`   Active: ${activeChannels}`)
  channelsByType.forEach(item => {
    console.log(`   ${item.type}: ${item._count}`)
  })
  console.log()

  // Push log statistics
  const totalPushes = await prisma.pushLog.count()
  const successfulPushes = await prisma.pushLog.count({
    where: { status: 'success' }
  })
  const failedPushes = await prisma.pushLog.count({
    where: { status: 'failed' }
  })
  const successRate = totalPushes > 0
    ? ((successfulPushes / totalPushes) * 100).toFixed(2)
    : '0'

  console.log('📊 Push Statistics')
  console.log(`   Total pushes: ${totalPushes}`)
  console.log(`   Successful: ${successfulPushes}`)
  console.log(`   Failed: ${failedPushes}`)
  console.log(`   Success rate: ${successRate}%`)
  console.log()

  // Filter rule statistics
  const totalRules = await prisma.filterRule.count()
  const activeRules = await prisma.filterRule.count({
    where: { isActive: true }
  })

  console.log('🎯 Filter Rules')
  console.log(`   Total: ${totalRules}`)
  console.log(`   Active: ${activeRules}`)
  console.log()

  // System alert statistics
  const totalAlerts = await prisma.systemAlert.count()
  const unresolvedAlerts = await prisma.systemAlert.count({
    where: { isResolved: false }
  })
  const alertsBySeverity = await prisma.systemAlert.groupBy({
    by: ['severity'],
    where: { isResolved: false },
    _count: true
  })

  console.log('🔔 System Alerts')
  console.log(`   Total: ${totalAlerts}`)
  console.log(`   Unresolved: ${unresolvedAlerts}`)
  alertsBySeverity.forEach(item => {
    console.log(`   ${item.severity}: ${item._count}`)
  })
  console.log()

  // Top senders (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const topSenders = await prisma.$queryRaw<Array<{ from: string; count: bigint }>>`
    SELECT "from", COUNT(*) as count
    FROM "Email"
    WHERE "receivedAt" >= ${thirtyDaysAgo}
    GROUP BY "from"
    ORDER BY count DESC
    LIMIT 10
  `

  console.log('📬 Top Senders (Last 30 Days)')
  topSenders.forEach((sender, index) => {
    console.log(`   ${index + 1}. ${sender.from} (${sender.count} emails)`)
  })
  console.log()

  console.log('=============================')
  console.log('✅ Report generated successfully!')
  console.log()

  await prisma.$disconnect()
}

generateReport().catch(error => {
  console.error('❌ Report generation failed:', error)
  process.exit(1)
})
