import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

const updateSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
  markAllRead: z.boolean().optional()
})

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const where = {
      userId: user.userId,
      ...(unreadOnly ? { isRead: false } : {})
    }

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.notification.count({
        where: {
          userId: user.userId,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        metadata: (() => {
          if (!item.metadata) return null
          try {
            return JSON.parse(item.metadata)
          } catch {
            return null
          }
        })()
      })),
      unreadCount
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
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
    const data = createNotificationSchema.parse(body)

    const item = await prisma.notification.create({
      data: {
        userId: user.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })

    return NextResponse.json({
      ...item,
      metadata: (() => {
        if (!item.metadata) return null
        try {
          return JSON.parse(item.metadata)
        } catch {
          return null
        }
      })()
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    if (data.markAllRead) {
      const result = await prisma.notification.updateMany({
        where: {
          userId: user.userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      return NextResponse.json({ success: true, count: result.count })
    }

    const ids = data.ids?.length ? data.ids : data.id ? [data.id] : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        id: { in: ids }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
