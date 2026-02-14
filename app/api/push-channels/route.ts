import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const pushChannelSchema = z.object({
  type: z.enum(['wechat', 'feishu', 'telegram']),
  name: z.string(),
  config: z.object({
    webhookUrl: z.string().optional(),
    botToken: z.string().optional(),
    chatId: z.string().optional()
  }),
  cardTemplate: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = pushChannelSchema.parse(body)

    const channel = await prisma.pushChannel.create({
      data: {
        userId: user.userId,
        type: data.type,
        name: data.name,
        config: JSON.stringify(data.config),
        cardTemplate: data.cardTemplate,
        isActive: true
      }
    })

    return NextResponse.json({
      ...channel,
      config: JSON.parse(channel.config)
    })
  } catch (error: any) {
    console.error('Error creating push channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create push channel' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channels = await prisma.pushChannel.findMany({
      where: { userId: user.userId },
      include: {
        _count: { select: { pushLogs: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(channels.map(c => ({
      ...c,
      config: JSON.parse(c.config)
    })))
  } catch (error: any) {
    console.error('Error fetching push channels:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch push channels' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, config, ...updateData } = body

    const existing = await prisma.pushChannel.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const data: any = { ...updateData }
    if (config) {
      data.config = JSON.stringify(config)
    }

    const channel = await prisma.pushChannel.update({
      where: { id },
      data
    })

    return NextResponse.json({
      ...channel,
      config: JSON.parse(channel.config)
    })
  } catch (error: any) {
    console.error('Error updating push channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update push channel' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    const existing = await prisma.pushChannel.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    await prisma.pushChannel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting push channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete push channel' },
      { status: 500 }
    )
  }
}
