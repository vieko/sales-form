import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array>
  
  const sessionId = request.headers.get('x-session-id')
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl

      const initialLogs = logger.getLogs(sessionId)
      if (initialLogs.length > 0) {
        const data = `data: ${JSON.stringify({ type: 'initial', logs: initialLogs })}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      const unsubscribe = logger.subscribe((logs) => {
        try {
          const data = `data: ${JSON.stringify({ type: 'update', logs })}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch (error) {
          console.error('SSE error:', error)
        }
      }, sessionId)

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`,
            ),
          )
        } catch (error) {
          console.error('Heartbeat error:', error)
          clearInterval(heartbeat)
        }
      }, 30000) // 30 seconds

      request.signal.addEventListener('abort', () => {
        unsubscribe()
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // Connection already closed
        }
      })
    },

    cancel() {
      // Stream cancelled by client
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
