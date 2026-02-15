/**
 * Environment variable validation module
 * Validates required environment variables at startup
 */

import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ 环境变量验证失败:')
    if (error instanceof z.ZodError) {
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    console.error('\n请检查 .env 文件并确保所有必需的环境变量都已正确配置。')
    console.error('参考 .env.example 文件获取配置示例。\n')
    process.exit(1)
  }
}

export const env = validateEnv()
