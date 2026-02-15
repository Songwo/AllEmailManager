import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const pushChannelSchema = z.object({
  type: z.enum(['wechat', 'feishu', 'telegram']),
  name: z.string(),
  emailAccountId: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  config: z.object({
    webhookUrl: z.string().optional(),
    botToken: z.string().optional(),
    chatId: z.string().optional()
  }),
  cardTemplate: z.string().optional()
})

function hasPrismaModel(modelName: string): boolean {
  const runtimeDataModel = (prisma as any)?._runtimeDataModel
  return !!runtimeDataModel?.models?.[modelName]
}

function hasPrismaDelegate(delegateName: string): boolean {
  return typeof (prisma as any)?.[delegateName] !== 'undefined'
}

function hasPrismaField(modelName: string, fieldName: string): boolean {
  const model = (prisma as any)?._runtimeDataModel?.models?.[modelName]
  if (!model?.fields) return false
  return model.fields.some((field: { name: string }) => field.name === fieldName)
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = pushChannelSchema.parse(body)
    const supportsTemplateModel = hasPrismaModel('PushTemplate') && hasPrismaDelegate('pushTemplate')
    const supportsEmailScope = hasPrismaField('PushChannel', 'emailAccountId')
    const supportsTemplateRelation = hasPrismaField('PushChannel', 'template')
    const supportsTemplateBinding =
      supportsTemplateRelation && hasPrismaField('PushChannel', 'templateId')

    if (supportsEmailScope && data.emailAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: { id: data.emailAccountId, userId: user.userId },
        select: { id: true }
      })
      if (!account) {
        return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
      }
    }

    let templateId: string | null = null
    if (supportsTemplateModel && supportsTemplateBinding && data.templateId) {
      const template = await prisma.pushTemplate.findFirst({
        where: { id: data.templateId, userId: user.userId, isActive: true },
        select: { id: true, type: true, emailAccountId: true }
      })

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      if (template.type !== data.type) {
        return NextResponse.json({ error: 'Template type mismatch' }, { status: 400 })
      }

      const templateScopeMatch =
        template.emailAccountId === data.emailAccountId ||
        template.emailAccountId === null
      if (!templateScopeMatch) {
        return NextResponse.json({ error: 'Template scope mismatch' }, { status: 400 })
      }

      templateId = template.id
    }

    const channel = await prisma.pushChannel.create({
      data: {
        userId: user.userId,
        ...(supportsEmailScope ? { emailAccountId: data.emailAccountId || null } : {}),
        ...(supportsTemplateBinding ? { templateId } : {}),
        type: data.type,
        name: data.name,
        config: JSON.stringify(data.config),
        cardTemplate: data.cardTemplate,
        isActive: true
      },
      include: supportsTemplateModel && supportsTemplateBinding
        ? {
            template: { select: { id: true, name: true, type: true, emailAccountId: true } }
          }
        : undefined
    })

    return NextResponse.json({
      ...channel,
      config: (() => {
        try {
          return JSON.parse(channel.config)
        } catch {
          return {}
        }
      })(),
      template: (channel as any).template || null
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

    const { searchParams } = new URL(request.url)
    const emailAccountId = searchParams.get('emailAccountId')
    const supportsTemplateModel = hasPrismaModel('PushTemplate') && hasPrismaDelegate('pushTemplate')
    const supportsEmailScope = hasPrismaField('PushChannel', 'emailAccountId')
    const supportsTemplateRelation = hasPrismaField('PushChannel', 'template')
    const supportsTemplateBinding =
      supportsTemplateRelation && hasPrismaField('PushChannel', 'templateId')

    const where: {
      userId: string
      emailAccountId?: string | null
    } = { userId: user.userId }

    if (supportsEmailScope && emailAccountId && emailAccountId !== 'all') {
      where.emailAccountId = emailAccountId === 'global' ? null : emailAccountId
    }

    const include: any = {
      _count: { select: { pushLogs: true } }
    }
    if (supportsTemplateModel && supportsTemplateBinding) {
      include.template = {
        select: { id: true, name: true, type: true, emailAccountId: true }
      }
    }

    let channels
    try {
      channels = await prisma.pushChannel.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' }
      })
    } catch (e: any) {
      // Fallback for stale generated Prisma Client that has no relation field `template`.
      if (
        supportsTemplateBinding &&
        typeof e?.message === 'string' &&
        e.message.includes('Unknown field `template` for include statement')
      ) {
        channels = await prisma.pushChannel.findMany({
          where,
          include: { _count: { select: { pushLogs: true } } },
          orderBy: { createdAt: 'desc' }
        })
      } else {
        throw e
      }
    }

    return NextResponse.json(
      channels.map((c) => {
        let config: Record<string, string> = {}
        try {
          config = JSON.parse(c.config)
        } catch {
          config = {}
        }
        return {
          ...c,
          config,
          template: (c as any).template || null
        }
      })
    )
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
    const { id, config, emailAccountId, templateId, ...updateData } = body
    const supportsTemplateModel = hasPrismaModel('PushTemplate') && hasPrismaDelegate('pushTemplate')
    const supportsEmailScope = hasPrismaField('PushChannel', 'emailAccountId')
    const supportsTemplateRelation = hasPrismaField('PushChannel', 'template')
    const supportsTemplateBinding =
      supportsTemplateRelation && hasPrismaField('PushChannel', 'templateId')

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
    if (supportsEmailScope && emailAccountId !== undefined) {
      if (emailAccountId) {
        const account = await prisma.emailAccount.findFirst({
          where: { id: emailAccountId, userId: user.userId },
          select: { id: true }
        })
        if (!account) {
          return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
        }
      }
      data.emailAccountId = emailAccountId || null
    }

    if (supportsTemplateModel && supportsTemplateBinding && templateId !== undefined) {
      if (!templateId) {
        data.templateId = null
      } else {
        const targetType = updateData.type || existing.type
        const targetScope =
          emailAccountId !== undefined ? emailAccountId || null : existing.emailAccountId

        const template = await prisma.pushTemplate.findFirst({
          where: { id: templateId, userId: user.userId, isActive: true },
          select: { id: true, type: true, emailAccountId: true }
        })

        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        if (template.type !== targetType) {
          return NextResponse.json({ error: 'Template type mismatch' }, { status: 400 })
        }

        const scopeMatch =
          template.emailAccountId === targetScope ||
          template.emailAccountId === null
        if (!scopeMatch) {
          return NextResponse.json({ error: 'Template scope mismatch' }, { status: 400 })
        }

        data.templateId = template.id
      }
    } else if (updateData.type && updateData.type !== existing.type) {
      // Channel type changed; reset template binding to avoid type mismatch.
      if (supportsTemplateBinding) {
        data.templateId = null
      }
    }

    const include: any =
      supportsTemplateModel && supportsTemplateBinding
        ? {
            template: { select: { id: true, name: true, type: true, emailAccountId: true } }
          }
        : undefined

    const channel = await prisma.pushChannel.update({
      where: { id },
      data,
      include
    })

    return NextResponse.json({
      ...channel,
      config: (() => {
        try {
          return JSON.parse(channel.config)
        } catch {
          return {}
        }
      })(),
      template: (channel as any).template || null
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
