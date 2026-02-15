#!/usr/bin/env node

/**
 * Email listener bootstrap script.
 * Starts listeners for all active accounts.
 * This can be run as a standalone process or the listeners will auto-start
 * via instrumentation.ts when the Next.js server boots.
 */

import { prisma } from '../lib/prisma'
import { listenerManager } from '../lib/listener-manager'

async function startAllListeners() {
  try {
    console.log('Starting email listener service...')

    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        userId: true,
        status: true
      }
    })

    console.log(`Found ${accounts.length} active email account(s)`)

    for (const account of accounts) {
      try {
        await listenerManager.start(account.id, account.userId)
        console.log(`Listener started for: ${account.email}`)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Failed to start listener for ${account.email}:`, message)
      }
    }

    console.log('Email listener service started successfully')
    console.log('Press Ctrl+C to stop')
  } catch (error: unknown) {
    console.error('Failed to start email listener service:', error)
    process.exit(1)
  }
}

startAllListeners()

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down listener service...')
  listenerManager.stopAll()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down listener service...')
  listenerManager.stopAll()
  process.exit(0)
})
