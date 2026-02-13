import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailAccountId = searchParams.get('emailAccountId')
    const isRead = searchParams.get('isRead')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (emailAccountId) where.emailAccountId = emailAccountId
    if (isRead !== null) where.isRead = isRead === 'true'

    const emails = await prisma.email.findMany({
      where,
      include: {
        emailAccount: {
          select: {
            email: true,
            provider: true
          }
        },
        pushLogs: {
          include: {
            channel: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.email.count({ where })

    return NextResponse.json({ emails, total })
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
    const body = await request.json()
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      )
    }

    await prisma.email.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email' },
      { status: 500 }
    )
  }
}
