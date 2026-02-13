#!/usr/bin/env node

/**
 * EmailHub 数据库备份脚本
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

const BACKUP_DIR = path.join(process.cwd(), 'backups')
const DATABASE_URL = process.env.DATABASE_URL || ''

async function createBackup() {
  console.log('📦 EmailHub Database Backup')
  console.log('===========================\n')

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`✅ Created backup directory: ${BACKUP_DIR}\n`)
  }

  // Parse database URL
  const dbUrlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  if (!dbUrlMatch) {
    console.error('❌ Invalid DATABASE_URL format')
    process.exit(1)
  }

  const [, user, password, host, port, database] = dbUrlMatch

  // Generate backup filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`)

  console.log(`📝 Backup file: ${backupFile}`)
  console.log(`🗄️  Database: ${database}`)
  console.log(`🖥️  Host: ${host}:${port}`)
  console.log()

  try {
    // Set password environment variable
    process.env.PGPASSWORD = password

    // Run pg_dump
    console.log('⏳ Creating backup...')
    const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${backupFile}"`

    await execAsync(command)

    // Get file size
    const stats = fs.statSync(backupFile)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)

    console.log(`✅ Backup created successfully!`)
    console.log(`📊 Size: ${fileSizeMB} MB`)
    console.log()

    // Clean up old backups (keep last 7 days)
    cleanOldBackups()

  } catch (error: any) {
    console.error(`❌ Backup failed: ${error.message}`)
    process.exit(1)
  } finally {
    delete process.env.PGPASSWORD
  }
}

function cleanOldBackups() {
  console.log('🧹 Cleaning old backups...')

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time)

  // Keep last 7 backups
  const toDelete = files.slice(7)

  toDelete.forEach(file => {
    fs.unlinkSync(file.path)
    console.log(`   Deleted: ${file.name}`)
  })

  if (toDelete.length === 0) {
    console.log('   No old backups to delete')
  }

  console.log(`✅ Kept ${Math.min(files.length, 7)} most recent backups`)
  console.log()
}

createBackup().catch(error => {
  console.error('❌ Backup script failed:', error)
  process.exit(1)
})
