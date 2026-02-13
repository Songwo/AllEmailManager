import { EmailListener } from '@/lib/email-listener'

// Store active listeners
const activeListeners = new Map<string, EmailListener>()

export async function startEmailListener(accountId: string) {
  // Stop existing listener if any
  if (activeListeners.has(accountId)) {
    activeListeners.get(accountId)?.stop()
  }

  // Create and start new listener
  const listener = new EmailListener(accountId)
  activeListeners.set(accountId, listener)

  try {
    await listener.start()
    console.log(`Email listener started for account: ${accountId}`)
  } catch (error) {
    console.error(`Failed to start listener for account ${accountId}:`, error)
    activeListeners.delete(accountId)
    throw error
  }
}

export function stopEmailListener(accountId: string) {
  const listener = activeListeners.get(accountId)
  if (listener) {
    listener.stop()
    activeListeners.delete(accountId)
    console.log(`Email listener stopped for account: ${accountId}`)
  }
}

export function stopAllListeners() {
  activeListeners.forEach((listener, accountId) => {
    listener.stop()
    console.log(`Email listener stopped for account: ${accountId}`)
  })
  activeListeners.clear()
}

// Graceful shutdown
process.on('SIGTERM', stopAllListeners)
process.on('SIGINT', stopAllListeners)
