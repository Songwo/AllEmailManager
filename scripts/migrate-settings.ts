import { execSync } from 'node:child_process'
import path from 'node:path'

type SqliteQuery = {
  all: () => Array<{ name: string }>
}

type SqliteDatabase = {
  prepare: (sql: string) => SqliteQuery
  close: () => void
}

type BetterSqlite3Factory = (
  filename: string,
  options?: { fileMustExist?: boolean }
) => SqliteDatabase

const createDatabase = (require('better-sqlite3') as BetterSqlite3Factory)

function run(command: string) {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit' })
}

function assertColumn(db: SqliteDatabase, table: string, column: string) {
  const rows = db.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all() as Array<{ name: string }>
  const exists = rows.some((row) => row.name === column)
  if (!exists) {
    throw new Error(`Migration verification failed: ${table}.${column} is missing`)
  }
}

try {
  run('npm run db:push')
  run('npm run db:generate')

  const dbPath = path.resolve(process.cwd(), 'dev.db')
  const db = createDatabase(dbPath, { fileMustExist: true })
  try {
    assertColumn(db, 'User', 'avatarUrl')
    assertColumn(db, 'User', 'twoFactorEnabled')
    assertColumn(db, 'PushChannel', 'templateId')
    assertColumn(db, 'PushTemplate', 'emailAccountId')
    assertColumn(db, 'Notification', 'isRead')
  } finally {
    db.close()
  }

  console.log('\nSettings/Security/Notification migration completed and verified.')
} catch (error) {
  console.error('\nMigration failed:', error)
  process.exit(1)
}
