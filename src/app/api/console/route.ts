import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/server-logger-db'

export const dynamic = 'force-dynamic'

// GET: Get logs for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter required' },
        { status: 400 }
      )
    }
    
    const logs = await logger.getLogs(sessionId, limit)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Console API error:', error)
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    )
  }
}

// DELETE: Clear all logs for a session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter required' },
        { status: 400 }
      )
    }
    
    await logger.clear(sessionId)
    return NextResponse.json({ success: true, message: 'Console cleared' })
  } catch (error) {
    console.error('Console clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear console' },
      { status: 500 }
    )
  }
}

// POST: Add log entry (for manual logging)
export async function POST(request: NextRequest) {
  try {
    const { level, message, data, sessionId } = await request.json()
    
    if (!level || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: level, message, sessionId' },
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
    
    await logger[level as keyof typeof logger](message, data, sessionId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Console API error:', error)
    return NextResponse.json(
      { error: 'Failed to add log entry' },
      { status: 500 }
    )
  }
}
