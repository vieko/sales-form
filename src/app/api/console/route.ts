import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// DELETE: Clear all logs
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    logger.clear(sessionId)
    return NextResponse.json({ success: true, message: 'Console cleared' })
  } catch (error) {
    console.error('Console clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear console' },
      { status: 500 }
    )
  }
}

// POST: Add log entry from server-side processes
export async function POST(request: NextRequest) {
  try {
    const { level, message, data } = await request.json()
    const sessionId = request.headers.get('x-session-id')
    
    if (!level || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: level, message' },
        { status: 400 }
      )
    }
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    // Validate log level
    if (!['info', 'warn', 'error', 'success'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid log level' },
        { status: 400 }
      )
    }
    
    logger[level as keyof typeof logger](message, data, sessionId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Console API error:', error)
    return NextResponse.json(
      { error: 'Failed to add log entry' },
      { status: 500 }
    )
  }
}

// GET: Get current logs (fallback for non-SSE clients)
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    const logs = logger.getLogs(sessionId)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Console API error:', error)
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    )
  }
}
