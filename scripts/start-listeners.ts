#!/usr/bin/env node

/**
 * Email Listener Service
 *
 * This script starts email listeners for all active email accounts.
 * It should be run as a background service.
 */

import { prisma } from '../lib/prisma'
import { startEmailListener } from '../lib/listener-manager'

async function startAllListeners() {
  try {
    console.log('🚀 Starting email listener service...')

    // Get all active email accounts
    const accounts = await prisma.emailAccount.findMany({
      where: {
        isActive: true,
        status: 'connected'
      }
    })

    console.log(`📧 Found ${accounts.length} active email accounts`)

    // Start listener for each account
    for (const account of accounts) {
      try {
        await startEmailListener(account.id)
        console.log(`✅ Listener started for: ${account.email}`)
      } catch (error: any) {
        console.error(`❌ Failed to start listener for ${account.email}:`, error.message)
      }
    }

    console.log('✨ Email listener service started successfully')
  } catch (error) {
    console.error('❌ Failed to start email listener service:', error)
    process.exit(1)
  }
}

// Start the service
startAllListeners()

// Keep the process running
process.on('SIGTERM', () => {
  console.log('📴 Shutting down email listener service...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📴 Shutting down email listener service...')
  process.exit(0)
})
