import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startEmailListener, stopEmailListener } from '@/lib/listener-manager'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId, action } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Verify the account belongs to the user
    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId }
    })
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    if (action === 'start') {
      await startEmailListener(accountId)
      return NextResponse.json({ success: true, message: 'Listener started' })
    } else if (action === 'stop') {
      stopEmailListener(accountId)
      return NextResponse.json({ success: true, message: 'Listener stopped' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use start or stop.' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error managing listener:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to manage listener' },
      { status: 500 }
    )
  }
}
