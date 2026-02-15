import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const emailAccountId = searchParams.get('emailAccountId')
    const isRead = searchParams.get('isRead')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      emailAccount: { userId: user.userId }
    }
    if (emailAccountId) where.emailAccountId = emailAccountId
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { fromAddress: { contains: search } }
      ]
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          emailAccount: {
            select: { email: true, provider: true }
          }
        },
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.email.count({ where })
    ])

    // Parse JSON fields for response
    const parsed = emails.map(e => ({
      ...e,
      toAddresses: JSON.parse(e.toAddresses || '[]'),
      attachments: e.attachments ? JSON.parse(e.attachments) : null,
      headers: e.headers ? JSON.parse(e.headers) : null,
    }))

    return NextResponse.json({ emails: parsed, total })
  } catch (error: any) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
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

    // Batch mark as read
    if (body.ids && Array.isArray(body.ids)) {
      await prisma.email.updateMany({
        where: {
          id: { in: body.ids },
          emailAccount: { userId: user.userId }
        },
        data: { isRead: body.isRead ?? true }
      })
      return NextResponse.json({ success: true, count: body.ids.length })
    }

    // Single update
    const { id, isRead } = body
    const email = await prisma.email.update({
      where: { id },
      data: { isRead }
    })

    return NextResponse.json(email)
  } catch (error: any) {
    console.error('Error updating email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
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
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const email = await prisma.email.findFirst({
      where: { id, emailAccount: { userId: user.userId } }
    })
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    await prisma.email.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email' },
      { status: 500 }
    )
  }
}
