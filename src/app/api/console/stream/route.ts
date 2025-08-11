// This file is deprecated - SSE has been replaced with simple polling
// Keeping it for compatibility but it should not be used

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { 
      error: 'SSE endpoint deprecated',
      message: 'Use GET /api/console with polling instead' 
    },
    { status: 410 }
  )
}