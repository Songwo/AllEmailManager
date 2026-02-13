import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const filterRuleSchema = z.object({
  userId: z.string(),
  name: z.string(),
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
    const body = await request.json()
    const data = filterRuleSchema.parse(body)

    const rule = await prisma.filterRule.create({
      data: {
        userId: data.userId,
        name: data.name,
        conditions: data.conditions,
        actions: data.actions,
        priority: data.priority,
        isActive: true
      }
    })

    return NextResponse.json(rule)
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const rules = await prisma.filterRule.findMany({
      where: { userId },
      orderBy: { priority: 'desc' }
    })

    return NextResponse.json(rules)
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
    const body = await request.json()
    const { id, ...updateData } = body

    const rule = await prisma.filterRule.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(rule)
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    await prisma.filterRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting filter rule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete filter rule' },
      { status: 500 }
    )
  }
}
