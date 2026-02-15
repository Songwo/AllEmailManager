import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const templateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['wechat', 'feishu', 'telegram']),
  content: z.string().min(1),
  emailAccountId: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional()
})

function hasPushTemplateModel(): boolean {
  const runtimeDataModel = (prisma as any)?._runtimeDataModel
  return !!runtimeDataModel?.models?.PushTemplate && typeof (prisma as any)?.pushTemplate !== 'undefined'
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hasPushTemplateModel()) {
      return NextResponse.json(
        { error: 'PushTemplate model is not available. Please run prisma generate and restart dev server.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = templateSchema.parse(body)

    if (data.emailAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: { id: data.emailAccountId, userId: user.userId },
        select: { id: true }
      })
      if (!account) {
        return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
      }
    }

    if (data.isDefault) {
      await prisma.pushTemplate.updateMany({
        where: {
          userId: user.userId,
          type: data.type,
          emailAccountId: data.emailAccountId || null
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.pushTemplate.create({
      data: {
        userId: user.userId,
        emailAccountId: data.emailAccountId || null,
        name: data.name,
        type: data.type,
        content: data.content,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true
      },
      include: {
        _count: { select: { channels: true } }
      }
    })

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
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
    if (!hasPushTemplateModel()) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const emailAccountId = searchParams.get('emailAccountId')
    const type = searchParams.get('type')

    const where: {
      userId: string
      emailAccountId?: string | null
      type?: 'wechat' | 'feishu' | 'telegram'
      isActive?: boolean
    } = { userId: user.userId }

    if (emailAccountId && emailAccountId !== 'all') {
      where.emailAccountId = emailAccountId === 'global' ? null : emailAccountId
    }

    if (type && ['wechat', 'feishu', 'telegram'].includes(type)) {
      where.type = type as 'wechat' | 'feishu' | 'telegram'
    }

    const templates = await prisma.pushTemplate.findMany({
      where,
      include: {
        _count: { select: { channels: true } }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
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
    if (!hasPushTemplateModel()) {
      return NextResponse.json(
        { error: 'PushTemplate model is not available. Please run prisma generate and restart dev server.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { id, ...payload } = body
    const data = templateSchema.partial().parse(payload)

    const existing = await prisma.pushTemplate.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (data.emailAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: { id: data.emailAccountId, userId: user.userId },
        select: { id: true }
      })
      if (!account) {
        return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
      }
    }

    const targetType = data.type || existing.type
    const targetAccountId =
      data.emailAccountId !== undefined ? data.emailAccountId || null : existing.emailAccountId

    if (data.isDefault) {
      await prisma.pushTemplate.updateMany({
        where: {
          userId: user.userId,
          type: targetType,
          emailAccountId: targetAccountId
        },
        data: { isDefault: false }
      })
    }

    const updated = await prisma.pushTemplate.update({
      where: { id },
      data: {
        ...data,
        emailAccountId:
          data.emailAccountId !== undefined ? data.emailAccountId || null : undefined
      },
      include: {
        _count: { select: { channels: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
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
    if (!hasPushTemplateModel()) {
      return NextResponse.json(
        { error: 'PushTemplate model is not available. Please run prisma generate and restart dev server.' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const existing = await prisma.pushTemplate.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.pushTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}
