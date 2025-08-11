import { db } from '@/db/drizzle'
import { enrichmentLogs } from '@/db/schemas'
import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get the most recent 10 logs with all fields
    const logs = await db
      .select()
      .from(enrichmentLogs)
      .orderBy(desc(enrichmentLogs.createdAt))
      .limit(10)

    console.log('> Raw database logs:', JSON.stringify(logs, null, 2))

    // Calculate duration for logs that have both timestamps
    const logsWithCalculatedDuration = logs.map((log) => {
      let calculatedDuration = null
      if (log.startedAt && log.completedAt) {
        calculatedDuration =
          new Date(log.completedAt).getTime() -
          new Date(log.startedAt).getTime()
      }

      return {
        ...log,
        calculatedDuration,
        storedDuration: log.duration,
        durationMismatch: log.duration !== calculatedDuration,
      }
    })

    return NextResponse.json({
      success: true,
      totalLogs: logs.length,
      logs: logsWithCalculatedDuration,
      issues: {
        missingLeadId: logs.filter((log) => !log.leadId).length,
        missingCompanyId: logs.filter((log) => !log.companyId).length,
        missingDuration: logs.filter((log) => !log.duration).length,
        missingCost: logs.filter((log) => !log.cost).length,
        missingTokens: logs.filter((log) => !log.tokensUsed).length,
        pendingStatus: logs.filter((log) => log.status === 'pending').length,
      },
    })
  } catch (error) {
    console.error('Debug logs failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

