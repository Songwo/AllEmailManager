#!/usr/bin/env node

/**
 * EmailHub 数据清理脚本
 *
 * 清理旧数据以保持数据库性能
 */

import { prisma } from '../lib/prisma'

interface CleanupStats {
  emails: number
  pushLogs: number
  rateLimitLogs: number
  resolvedAlerts: number
}

async function cleanupOldEmails(days: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const result = await prisma.email.deleteMany({
    where: {
      receivedAt: {
        lt: cutoffDate
      },
      isRead: true
    }
  })

  return result.count
}

async function cleanupOldPushLogs(days: number = 7): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const result = await prisma.pushLog.deleteMany({
    where: {
      pushedAt: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}

async function cleanupOldRateLimitLogs(hours: number = 24): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - hours)

  const result = await prisma.rateLimitLog.deleteMany({
    where: {
      windowStart: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}

async function cleanupResolvedAlerts(days: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const result = await prisma.systemAlert.deleteMany({
    where: {
      isResolved: true,
      resolvedAt: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}

async function runCleanup() {
  console.log('🧹 EmailHub Data Cleanup')
  console.log('========================\n')

  const stats: CleanupStats = {
    emails: 0,
    pushLogs: 0,
    rateLimitLogs: 0,
    resolvedAlerts: 0
  }

  try {
    // Clean up old read emails (30 days)
    console.log('📧 Cleaning up old read emails (30+ days)...')
    stats.emails = await cleanupOldEmails(30)
    console.log(`   Deleted ${stats.emails} emails\n`)

    // Clean up old push logs (7 days)
    console.log('📤 Cleaning up old push logs (7+ days)...')
    stats.pushLogs = await cleanupOldPushLogs(7)
    console.log(`   Deleted ${stats.pushLogs} push logs\n`)

    // Clean up old rate limit logs (24 hours)
    console.log('🚦 Cleaning up old rate limit logs (24+ hours)...')
    stats.rateLimitLogs = await cleanupOldRateLimitLogs(24)
    console.log(`   Deleted ${stats.rateLimitLogs} rate limit logs\n`)

    // Clean up resolved alerts (30 days)
    console.log('🔔 Cleaning up resolved alerts (30+ days)...')
    stats.resolvedAlerts = await cleanupResolvedAlerts(30)
    console.log(`   Deleted ${stats.resolvedAlerts} resolved alerts\n`)

    // Summary
    console.log('========================')
    console.log('✅ Cleanup completed successfully!')
    console.log()
    console.log('Summary:')
    console.log(`  - Emails deleted: ${stats.emails}`)
    console.log(`  - Push logs deleted: ${stats.pushLogs}`)
    console.log(`  - Rate limit logs deleted: ${stats.rateLimitLogs}`)
    console.log(`  - Resolved alerts deleted: ${stats.resolvedAlerts}`)
    console.log(`  - Total records deleted: ${Object.values(stats).reduce((a, b) => a + b, 0)}`)
    console.log()

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runCleanup().catch(error => {
  console.error('❌ Cleanup script failed:', error)
  process.exit(1)
})
