import { NextResponse } from 'next/server'
import { startEmailListener, stopEmailListener } from '@/lib/listener-manager'

export async function POST(request: Request) {
  try {
    const { accountId, action } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
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
        { error: 'Invalid action' },
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
