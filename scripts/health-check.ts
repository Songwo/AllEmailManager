#!/usr/bin/env node

/**
 * EmailHub 健康检查脚本
 *
 * 检查系统各组件的运行状态
 */

import { prisma } from '../lib/prisma'
import Redis from 'ioredis'

interface HealthCheckResult {
  component: string
  status: 'healthy' | 'unhealthy' | 'warning'
  message: string
  details?: any
}

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`
    const userCount = await prisma.user.count()
    const emailCount = await prisma.email.count()

    return {
      component: 'Database',
      status: 'healthy',
      message: 'Database connection successful',
      details: {
        users: userCount,
        emails: emailCount
      }
    }
  } catch (error: any) {
    return {
      component: 'Database',
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`
    }
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: () => null
    })

    await redis.ping()
    const info = await redis.info('server')
    redis.disconnect()

    return {
      component: 'Redis',
      status: 'healthy',
      message: 'Redis connection successful',
      details: {
        version: info.match(/redis_version:([^\r\n]+)/)?.[1]
      }
    }
  } catch (error: any) {
    return {
      component: 'Redis',
      status: 'warning',
      message: `Redis connection failed: ${error.message} (Optional service)`
    }
  }
}

async function checkEmailAccounts(): Promise<HealthCheckResult> {
  try {
    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true }
    })

    const connectedCount = accounts.filter(a => a.status === 'connected').length
    const disconnectedCount = accounts.filter(a => a.status === 'disconnected').length
    const errorCount = accounts.filter(a => a.status === 'error').length

    const status = errorCount > 0 ? 'warning' : 'healthy'

    return {
      component: 'Email Accounts',
      status,
      message: `${connectedCount} connected, ${disconnectedCount} disconnected, ${errorCount} errors`,
      details: {
        total: accounts.length,
        connected: connectedCount,
        disconnected: disconnectedCount,
        errors: errorCount
      }
    }
  } catch (error: any) {
    return {
      component: 'Email Accounts',
      status: 'unhealthy',
      message: `Failed to check email accounts: ${error.message}`
    }
  }
}

async function checkPushChannels(): Promise<HealthCheckResult> {
  try {
    const channels = await prisma.pushChannel.findMany({
      where: { isActive: true }
    })

    const recentLogs = await prisma.pushLog.findMany({
      where: {
        pushedAt: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      }
    })

    const successCount = recentLogs.filter(l => l.status === 'success').length
    const failedCount = recentLogs.filter(l => l.status === 'failed').length
    const successRate = recentLogs.length > 0
      ? ((successCount / recentLogs.length) * 100).toFixed(1)
      : '100'

    const status = parseFloat(successRate) < 90 ? 'warning' : 'healthy'

    return {
      component: 'Push Channels',
      status,
      message: `${channels.length} active channels, ${successRate}% success rate (last hour)`,
      details: {
        activeChannels: channels.length,
        recentPushes: recentLogs.length,
        successful: successCount,
        failed: failedCount,
        successRate: `${successRate}%`
      }
    }
  } catch (error: any) {
    return {
      component: 'Push Channels',
      status: 'unhealthy',
      message: `Failed to check push channels: ${error.message}`
    }
  }
}

async function checkSystemAlerts(): Promise<HealthCheckResult> {
  try {
    const unresolvedAlerts = await prisma.systemAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const criticalCount = unresolvedAlerts.filter(a => a.severity === 'error').length
    const warningCount = unresolvedAlerts.filter(a => a.severity === 'warning').length

    const status = criticalCount > 0 ? 'warning' : 'healthy'

    return {
      component: 'System Alerts',
      status,
      message: `${unresolvedAlerts.length} unresolved alerts (${criticalCount} critical, ${warningCount} warnings)`,
      details: {
        total: unresolvedAlerts.length,
        critical: criticalCount,
        warnings: warningCount,
        recentAlerts: unresolvedAlerts.slice(0, 3).map(a => ({
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt
        }))
      }
    }
  } catch (error: any) {
    return {
      component: 'System Alerts',
      status: 'unhealthy',
      message: `Failed to check system alerts: ${error.message}`
    }
  }
}

async function runHealthCheck() {
  console.log('🏥 EmailHub Health Check')
  console.log('========================\n')

  const checks = [
    checkDatabase(),
    checkRedis(),
    checkEmailAccounts(),
    checkPushChannels(),
    checkSystemAlerts()
  ]

  const results = await Promise.all(checks)

  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    console.log(`${icon} ${result.component}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2))
    }
    console.log()
  })

  const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' :
                       results.some(r => r.status === 'unhealthy') ? 'unhealthy' : 'warning'

  console.log('========================')
  console.log(`Overall Status: ${overallStatus === 'healthy' ? '✅ HEALTHY' : overallStatus === 'warning' ? '⚠️ WARNING' : '❌ UNHEALTHY'}`)
  console.log()

  await prisma.$disconnect()

  process.exit(overallStatus === 'unhealthy' ? 1 : 0)
}

runHealthCheck().catch(error => {
  console.error('❌ Health check failed:', error)
  process.exit(1)
})
