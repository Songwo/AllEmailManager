import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
  userId: z.string(),
  notifications: z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    soundEnabled: z.boolean(),
    quietHoursStart: z.string(),
    quietHoursEnd: z.string()
  }).optional(),
  rateLimit: z.object({
    maxPerMinute: z.number(),
    maxPerHour: z.number()
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean(),
    sessionTimeout: z.number()
  }).optional(),
  general: z.object({
    language: z.string(),
    timezone: z.string(),
    dateFormat: z.string()
  }).optional()
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // In a real app, settings would be stored in database
    // For now, return default settings
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      },
      rateLimit: {
        maxPerMinute: 10,
        maxPerHour: 100
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30
      },
      general: {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD'
      }
    }

    return NextResponse.json(defaultSettings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = settingsSchema.parse(body)

    // In a real app, save settings to database
    // For now, just return success
    console.log('Saving settings:', data)

    return NextResponse.json({ success: true, message: 'Settings saved successfully' })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}
