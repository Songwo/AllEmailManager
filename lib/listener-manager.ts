import { EmailListener } from './email-listener'
import { prisma } from './prisma'

class ListenerManager {
  private listeners: Map<string, EmailListener> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  async startAll() {
    // Get all active email accounts
    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      include: { user: true }
    })

    console.log(`Starting ${accounts.length} email listeners...`)

    for (const account of accounts) {
      await this.start(account.id, account.userId)
    }

    // Start health check
    this.startHealthCheck()
  }

  async start(accountId: string, userId: string) {
    // Stop existing listener if any
    this.stop(accountId)

    const listener = new EmailListener(accountId, userId)
    this.listeners.set(accountId, listener)

    try {
      await listener.start()
      console.log(`[${accountId}] Listener started`)
    } catch (error) {
      console.error(`[${accountId}] Failed to start listener:`, error)
      this.listeners.delete(accountId)
    }
  }

  stop(accountId: string) {
    const listener = this.listeners.get(accountId)
    if (listener) {
      listener.stop()
      this.listeners.delete(accountId)
      console.log(`[${accountId}] Listener stopped`)
    }
  }

  stopAll() {
    console.log(`Stopping ${this.listeners.size} listeners...`)
    for (const [accountId, listener] of this.listeners) {
      listener.stop()
    }
    this.listeners.clear()

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  getStatus(accountId: string): 'running' | 'stopped' {
    return this.listeners.has(accountId) ? 'running' : 'stopped'
  }

  getAllStatus(): Record<string, 'running' | 'stopped'> {
    const status: Record<string, 'running' | 'stopped'> = {}
    for (const accountId of this.listeners.keys()) {
      status[accountId] = 'running'
    }
    return status
  }

  private startHealthCheck() {
    // Check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      console.log('[HealthCheck] Running health check...')

      const accounts = await prisma.emailAccount.findMany({
        where: { isActive: true },
        include: { user: true }
      })

      for (const account of accounts) {
        const isRunning = this.listeners.has(account.id)

        if (!isRunning) {
          console.log(`[HealthCheck] Restarting listener for ${account.email}`)
          await this.start(account.id, account.userId)
        }
      }
    }, 5 * 60 * 1000)
  }
}

// Singleton instance
export const listenerManager = new ListenerManager()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping all listeners...')
  listenerManager.stopAll()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping all listeners...')
  listenerManager.stopAll()
  process.exit(0)
})
