import { NextResponse } from 'next/server'
import { getUserFromRequest, verifyToken } from '@/lib/auth'

// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const headerUser = getUserFromRequest(request)
  const token = new URL(request.url).searchParams.get('token')
  const queryUser = token ? verifyToken(token) : null
  const user = headerUser || queryUser
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Store connection for this user
      connections.set(user.userId, controller)

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const data = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          clearInterval(heartbeat)
          connections.delete(user.userId)
        }
      }, 30000)

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        connections.delete(user.userId)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Helper function to send events to specific user
export function sendEventToUser(userId: string, event: any) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      const encoder = new TextEncoder()
      const data = `data: ${JSON.stringify(event)}\n\n`
      controller.enqueue(encoder.encode(data))
      return true
    } catch (error) {
      console.error('Error sending event to user:', error)
      connections.delete(userId)
      return false
    }
  }
  return false
}

// Export for use in other modules
export { connections }
