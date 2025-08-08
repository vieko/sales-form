import { NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'

// never cache this route
export const dynamic = 'force-dynamic'

export async function GET() {
  await inngest.send({
    name: 'test/hello.world',
    data: {
      email: 'hello@vieko.dev',
    },
  })

  return NextResponse.json({ message: 'Event sent' })
}
