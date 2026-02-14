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

    const alerts = await prisma.systemAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(alerts)
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
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
    const { id } = body

    const alert = await prisma.systemAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date()
      }
    })

    return NextResponse.json(alert)
  } catch (error: any) {
    console.error('Error resolving alert:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resolve alert' },
      { status: 500 }
    )
  }
}
