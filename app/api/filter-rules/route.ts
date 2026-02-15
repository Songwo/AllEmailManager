import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const filterRuleSchema = z.object({
  name: z.string(),
  emailAccountId: z.string().nullable().optional(),
  conditions: z.object({
    sender: z.array(z.string()).optional(),
    subject: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional()
  }),
  actions: z.object({
    pushChannels: z.array(z.string()).optional(),
    markAsRead: z.boolean().optional(),
    delete: z.boolean().optional()
  }),
  priority: z.number().default(0)
})

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = filterRuleSchema.parse(body)

    if (data.emailAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: { id: data.emailAccountId, userId: user.userId },
        select: { id: true }
      })
      if (!account) {
        return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
      }
    }

    if (data.actions.pushChannels?.length) {
      const channels = await prisma.pushChannel.findMany({
        where: {
          id: { in: data.actions.pushChannels },
          userId: user.userId,
          isActive: true
        },
        select: { id: true, emailAccountId: true }
      })

      if (channels.length !== data.actions.pushChannels.length) {
        return NextResponse.json({ error: 'Contains invalid push channel' }, { status: 400 })
      }

      const outOfScope = channels.some(
        (c) =>
          c.emailAccountId !== null &&
          c.emailAccountId !== data.emailAccountId
      )
      if (outOfScope) {
        return NextResponse.json(
          { error: 'Push channel scope mismatch with selected email account' },
          { status: 400 }
        )
      }
    }

    const rule = await prisma.filterRule.create({
      data: {
        userId: user.userId,
        emailAccountId: data.emailAccountId || null,
        name: data.name,
        conditions: JSON.stringify(data.conditions),
        actions: JSON.stringify(data.actions),
        priority: data.priority,
        isActive: true
      }
    })

    return NextResponse.json({
      ...rule,
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions)
    })
  } catch (error: any) {
    console.error('Error creating filter rule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create filter rule' },
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
    const where: { userId: string; emailAccountId?: string | null } = { userId: user.userId }

    if (emailAccountId && emailAccountId !== 'all') {
      where.emailAccountId = emailAccountId === 'global' ? null : emailAccountId
    }

    const rules = await prisma.filterRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    })

    return NextResponse.json(rules.map(r => ({
      ...r,
      conditions: JSON.parse(r.conditions),
      actions: JSON.parse(r.actions)
    })))
  } catch (error: any) {
    console.error('Error fetching filter rules:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch filter rules' },
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
    const { id, conditions, actions, emailAccountId, ...updateData } = body

    const existing = await prisma.filterRule.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const data: any = { ...updateData }
    if (conditions) data.conditions = JSON.stringify(conditions)
    if (actions) data.actions = JSON.stringify(actions)

    if (emailAccountId !== undefined) {
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

    if (actions?.pushChannels?.length) {
      const targetAccountId =
        emailAccountId !== undefined ? emailAccountId || null : existing.emailAccountId

      const channels = await prisma.pushChannel.findMany({
        where: {
          id: { in: actions.pushChannels },
          userId: user.userId,
          isActive: true
        },
        select: { id: true, emailAccountId: true }
      })

      if (channels.length !== actions.pushChannels.length) {
        return NextResponse.json({ error: 'Contains invalid push channel' }, { status: 400 })
      }

      const outOfScope = channels.some(
        (c) =>
          c.emailAccountId !== null &&
          c.emailAccountId !== targetAccountId
      )
      if (outOfScope) {
        return NextResponse.json(
          { error: 'Push channel scope mismatch with selected email account' },
          { status: 400 }
        )
      }
    }

    const rule = await prisma.filterRule.update({
      where: { id },
      data
    })

    return NextResponse.json({
      ...rule,
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions)
    })
  } catch (error: any) {
    console.error('Error updating filter rule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update filter rule' },
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
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const existing = await prisma.filterRule.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await prisma.filterRule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting filter rule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete filter rule' },
      { status: 500 }
    )
  }
}
