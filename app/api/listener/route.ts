import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { listenerManager } from '@/lib/listener-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, accountId } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Verify account ownership
    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    switch (action) {
      case 'start':
        await listenerManager.start(accountId, user.userId)
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { status: 'connecting' }
        })
        return NextResponse.json({ success: true, message: 'Listener started' })

      case 'stop':
        listenerManager.stop(accountId)
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { status: 'disconnected' }
        })
        return NextResponse.json({ success: true, message: 'Listener stopped' })

      case 'restart':
        listenerManager.stop(accountId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await listenerManager.start(accountId, user.userId)
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { status: 'connecting' }
        })
        return NextResponse.json({ success: true, message: 'Listener restarted' })

      case 'status': {
        const detailed = listenerManager.getDetailedStatus(accountId)
        return NextResponse.json(detailed)
      }

      case 'setInterval': {
        const interval = body.interval
        if (!interval || typeof interval !== 'number' || interval < 10000 || interval > 300000) {
          return NextResponse.json({ error: 'interval 需为 10000-300000 之间的毫秒数' }, { status: 400 })
        }
        listenerManager.setPollingInterval(accountId, interval)
        return NextResponse.json({ success: true, message: `轮询间隔已设为 ${interval / 1000}s` })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Listener control error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to control listener' },
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

    const allStatus = listenerManager.getAllStatus()
    return NextResponse.json({ listeners: allStatus })
  } catch (error: any) {
    console.error('Error fetching listener status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
