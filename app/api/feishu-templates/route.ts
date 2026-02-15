import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { feishuCardPresets, renderFeishuPresetContent } from '@/lib/feishu-card-templates'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const applySchema = z.object({
  presetId: z.string().min(1),
  channelId: z.string().optional(),
  emailAccountId: z.string().nullable().optional(),
  templateName: z.string().optional(),
  setAsDefault: z.boolean().optional()
})

function hasPushTemplateSupport(): boolean {
  const runtimeDataModel = (prisma as any)?._runtimeDataModel
  return (
    !!runtimeDataModel?.models?.PushTemplate &&
    typeof (prisma as any)?.pushTemplate !== 'undefined'
  )
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    presets: feishuCardPresets
  })
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPushTemplateSupport()) {
      return NextResponse.json(
        { error: 'PushTemplate model is unavailable. Please run prisma generate and restart server.' },
        { status: 400 }
      )
    }

    const body = applySchema.parse(await request.json())
    const content = renderFeishuPresetContent(body.presetId)
    if (!content) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 })
    }

    const preset = feishuCardPresets.find((item) => item.id === body.presetId)
    const emailAccountId = body.emailAccountId || null

    if (emailAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: { id: emailAccountId, userId: user.userId },
        select: { id: true }
      })
      if (!account) {
        return NextResponse.json({ error: '邮箱账号不存在' }, { status: 404 })
      }
    }

    if (body.setAsDefault) {
      await prisma.pushTemplate.updateMany({
        where: {
          userId: user.userId,
          type: 'feishu',
          emailAccountId
        },
        data: { isDefault: false }
      })
    }

    const createdTemplate = await prisma.pushTemplate.create({
      data: {
        userId: user.userId,
        emailAccountId,
        type: 'feishu',
        name: body.templateName || `${preset?.name || '飞书模板'} ${new Date().toLocaleString('zh-CN')}`,
        content,
        isDefault: !!body.setAsDefault,
        isActive: true
      }
    })

    let boundChannelId: string | null = null
    if (body.channelId) {
      const channel = await prisma.pushChannel.findFirst({
        where: {
          id: body.channelId,
          userId: user.userId,
          type: 'feishu'
        },
        select: { id: true }
      })
      if (!channel) {
        return NextResponse.json({ error: '飞书渠道不存在' }, { status: 404 })
      }

      await prisma.pushChannel.update({
        where: { id: channel.id },
        data: { templateId: createdTemplate.id }
      })
      boundChannelId = channel.id
    }

    await createNotification({
      userId: user.userId,
      title: '模板应用成功',
      message: `已应用飞书模板「${preset?.name || body.presetId}」`,
      type: 'success',
      metadata: {
        templateId: createdTemplate.id,
        channelId: boundChannelId,
        emailAccountId
      }
    })

    return NextResponse.json({
      success: true,
      template: createdTemplate,
      boundChannelId
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to apply feishu template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
