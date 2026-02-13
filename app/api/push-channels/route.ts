import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pushChannelSchema = z.object({
  userId: z.string(),
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
    const body = await request.json()
    const data = pushChannelSchema.parse(body)

    const channel = await prisma.pushChannel.create({
      data: {
        userId: data.userId,
        type: data.type,
        name: data.name,
        config: data.config,
        cardTemplate: data.cardTemplate,
        isActive: true
      }
    })

    return NextResponse.json(channel)
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const channels = await prisma.pushChannel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(channels)
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
    const body = await request.json()
    const { id, ...updateData } = body

    const channel = await prisma.pushChannel.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(channel)
  } catch (error: any) {
    console.error('Error updating push channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update push channel' },
      { status: 500 }
    )
  }
}
