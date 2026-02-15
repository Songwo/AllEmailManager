import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  maxPerMinute: z.number().int().min(1).max(1000).optional(),
  maxPerHour: z.number().int().min(1).max(10000).optional(),
  sessionTimeout: z.number().int().min(5).max(24 * 60).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional()
})

const profileUpdateSchema = z.object({
  name: z.string().trim().max(64).nullable().optional(),
  avatarUrl: z.string().max(2 * 1024 * 1024).nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional()
})

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [settings, userInfo] = await Promise.all([
      prisma.userSettings.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId },
        update: {}
      }),
      prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          twoFactorEnabled: true,
          createdAt: true
        }
      })
    ])

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
        twoFactorEnabled: userInfo.twoFactorEnabled,
        sessionTimeout: settings.sessionTimeout
      },
      general: {
        language: settings.language,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings'
    return NextResponse.json({ error: message }, { status: 500 })
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

    await createNotification({
      userId: user.userId,
      title: '设置已更新',
      message: '系统设置保存成功',
      type: 'success'
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid settings payload' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()
    const body = profileUpdateSchema.parse(rawBody)

    const existingUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, password: true, email: true, name: true, avatarUrl: true }
    })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: {
      name?: string | null
      avatarUrl?: string | null
      password?: string
    } = {}

    if (body.name !== undefined) {
      const normalized = typeof body.name === 'string' ? body.name.trim() : body.name
      updateData.name = normalized ? normalized : null
    }

    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: '请输入当前密码' }, { status: 400 })
      }
      if (!existingUser.password || !await bcrypt.compare(body.currentPassword, existingUser.password)) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(body.newPassword, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    })

    await createNotification({
      userId: user.userId,
      title: '个人资料已更新',
      message: '头像或资料信息已保存',
      type: 'success'
    })

    return NextResponse.json(updatedUser)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid profile payload' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
