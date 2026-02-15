// ============================================================================
// Structured logging module
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): string {
  const ts = formatTimestamp()
  const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
  return `${ts} [${level.toUpperCase()}] [${scope}] ${message}${metaStr}`
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
  child(subscope: string): Logger
}

export function createLogger(scope: string): Logger {
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('debug')) console.debug(formatMessage('debug', scope, message, meta))
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('info')) console.log(formatMessage('info', scope, message, meta))
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('warn')) console.warn(formatMessage('warn', scope, message, meta))
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('error')) console.error(formatMessage('error', scope, message, meta))
    },
    child(subscope: string): Logger {
      return createLogger(`${scope}:${subscope}`)
    },
  }
}
