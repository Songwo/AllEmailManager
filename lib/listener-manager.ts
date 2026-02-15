import { EmailListener } from './email-listener'
import { createLogger } from './logger'
import { prisma } from './prisma'

const log = createLogger('listener-manager')

class ListenerManager {
  private listeners: Map<string, EmailListener> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private _initialized = false

  async startAll() {
    if (this._initialized) return
    this._initialized = true

    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      include: { user: true }
    })

    log.info(`Auto-starting ${accounts.length} email listener(s)`)

    for (const account of accounts) {
      try {
        await this.start(account.id, account.userId)
      } catch (error) {
        log.error(`Failed to auto-start listener for ${account.email}`, { error: String(error) })
      }
    }

    this.startHealthCheck()
  }

  async start(accountId: string, userId: string) {
    this.stop(accountId)

    const listener = new EmailListener(accountId, userId)
    this.listeners.set(accountId, listener)

    try {
      await listener.start()
      log.info('Listener started', { accountId })
    } catch (error) {
      log.error('Failed to start listener', { accountId, error: String(error) })
      this.listeners.delete(accountId)
    }
  }

  stop(accountId: string) {
    const listener = this.listeners.get(accountId)
    if (listener) {
      listener.stop()
      this.listeners.delete(accountId)
      log.info('Listener stopped', { accountId })
    }
  }

  stopAll() {
    log.info(`Stopping ${this.listeners.size} listener(s)`)
    for (const [, listener] of this.listeners) {
      listener.stop()
    }
    this.listeners.clear()
    this._initialized = false

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  getStatus(accountId: string): 'running' | 'stopped' {
    const listener = this.listeners.get(accountId)
    return listener?.isRunning ? 'running' : 'stopped'
  }

  getDetailedStatus(accountId: string): { status: 'running' | 'stopped'; connected: boolean; mode: string; pollInterval: number } {
    const listener = this.listeners.get(accountId)
    if (!listener) return { status: 'stopped', connected: false, mode: 'unknown', pollInterval: 0 }
    return {
      status: listener.isRunning ? 'running' : 'stopped',
      connected: listener.isConnected,
      mode: listener.supportsIdle ? 'idle' : 'poll',
      pollInterval: listener.currentPollInterval
    }
  }

  getAllStatus(): Record<string, { status: 'running' | 'stopped'; mode: string; pollInterval: number }> {
    const result: Record<string, { status: 'running' | 'stopped'; mode: string; pollInterval: number }> = {}
    for (const [accountId, listener] of this.listeners) {
      result[accountId] = {
        status: listener.isRunning ? 'running' : 'stopped',
        mode: listener.supportsIdle ? 'idle' : 'poll',
        pollInterval: listener.currentPollInterval
      }
    }
    return result
  }

  setPollingInterval(accountId: string, intervalMs: number) {
    const listener = this.listeners.get(accountId)
    if (listener) {
      listener.setPollingInterval(intervalMs)
    }
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) return

    this.healthCheckInterval = setInterval(async () => {
      log.debug('Running health check')

      try {
        const accounts = await prisma.emailAccount.findMany({
          where: { isActive: true },
          include: { user: true }
        })

        for (const account of accounts) {
          const listener = this.listeners.get(account.id)
          const isRunning = listener?.isRunning ?? false

          if (!isRunning) {
            log.info('Restarting listener', { email: account.email })
            await this.start(account.id, account.userId)
          }
        }

        for (const [accountId] of this.listeners) {
          const account = accounts.find(a => a.id === accountId)
          if (!account) {
            log.info('Stopping orphan listener', { accountId })
            this.stop(accountId)
          }
        }
      } catch (error) {
        log.error('Health check error', { error: String(error) })
      }
    }, 3 * 60 * 1000)
  }
}

// Use globalThis singleton pattern (same approach as prisma.ts) to survive HMR in dev
const globalForListeners = globalThis as unknown as {
  listenerManager: ListenerManager | undefined
}

export const listenerManager = globalForListeners.listenerManager ?? new ListenerManager()

if (process.env.NODE_ENV !== 'production') {
  globalForListeners.listenerManager = listenerManager
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, stopping all listeners')
  listenerManager.stopAll()
  process.exit(0)
})

process.on('SIGINT', () => {
  log.info('SIGINT received, stopping all listeners')
  listenerManager.stopAll()
  process.exit(0)
})
