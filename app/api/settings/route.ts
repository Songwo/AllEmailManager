import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  maxPerMinute: z.number().optional(),
  maxPerHour: z.number().optional(),
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId }
    })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.userId }
      })
    }

    // Also get user profile info
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    })

    return NextResponse.json({
      profile: userInfo,
      notifications: {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        soundEnabled: settings.soundEnabled,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd
      },
      rateLimit: {
        maxPerMinute: settings.maxPerMinute,
        maxPerHour: settings.maxPerHour
      },
      security: {
        twoFactorEnabled: settings.twoFactorEnabled,
        sessionTimeout: settings.sessionTimeout
      },
      general: {
        language: settings.language,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat
      }
    })
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = settingsUpdateSchema.parse(body)

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        ...data
      },
      update: data
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// Update user profile (name, password)
export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, currentPassword, newPassword } = body

    const updateData: any = {}
    if (name) updateData.name = name

    if (newPassword) {
      const bcrypt = (await import('bcryptjs')).default
      const existingUser = await prisma.user.findUnique({
        where: { id: user.userId }
      })
      if (!existingUser?.password || !await bcrypt.compare(currentPassword, existingUser.password)) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: { id: true, email: true, name: true }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
