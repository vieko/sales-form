import { enrichLead } from '@/lib/enrichment/enrichment-engine'
import { db } from '@/db/drizzle'
import { enrichmentLogs } from '@/db/schemas'
import { desc, eq } from 'drizzle-orm'
import type { EnrichmentInput } from '@/lib/schemas/enrichment'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('> Testing Phase 1: Enrichment Logging System')

    // Test input data - don't use leadId initially to avoid FK constraints
    const testInput: EnrichmentInput = {
      // leadId: 'test-lead-' + Date.now(), // Comment out to test without FK
      contactName: 'John Doe',
      companyEmail: 'john@testcompany.com',
      companyWebsite: 'https://www.stripe.com',
      companySize: '51-200',
      productInterest: 'API Integration',
      howCanWeHelp:
        'We need help integrating payments into our e-commerce platform. Looking for a scalable solution that can handle high transaction volumes.',
      country: 'United States',
      behavioralData: {
        pageViews: 5,
        timeOnSite: 12,
        visitedResources: ['pricing', 'docs', 'api'],
        emailEngagement: {
          opened: 2,
          clicked: 1,
        },
        previousVisits: 3,
      },
    }

    console.log('> Starting enrichment for:', testInput.companyWebsite)
    console.log('> Lead ID:', testInput.leadId || 'Not specified')

    // Check logs before (only if leadId is provided)
    const logsBefore = testInput.leadId
      ? await db
          .select()
          .from(enrichmentLogs)
          .where(eq(enrichmentLogs.leadId, testInput.leadId))
      : []

    console.log(`> Logs before enrichment: ${logsBefore.length}`)

    // Run enrichment
    console.log('> Running enrichment...')
    const startTime = Date.now()

    const result = await enrichLead(testInput)

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`> Enrichment completed in ${duration}ms`)
    console.log(`> Classification: ${result.data.scoring.classification}`)
    console.log(`> Score: ${result.data.scoring.overallScore}`)
    console.log(`> Tool calls: ${result.toolCalls}`)
    console.log(`> Gathering steps: ${result.gatheringSteps}`)

    // Check logs after - get all recent logs if no leadId
    console.log('> Checking enrichment logs...')

    const logsAfter = testInput.leadId
      ? await db
          .select()
          .from(enrichmentLogs)
          .where(eq(enrichmentLogs.leadId, testInput.leadId))
          .orderBy(desc(enrichmentLogs.createdAt))
      : await db
          .select()
          .from(enrichmentLogs)
          .orderBy(desc(enrichmentLogs.createdAt))
          .limit(10) // Get recent logs

    console.log(`> Total logs created: ${logsAfter.length}`)

    const logSummary = logsAfter.map((log, index) => ({
      order: index + 1,
      provider: log.provider.toUpperCase(),
      operation: log.operation,
      status: log.status,
      started: log.startedAt.toISOString(),
      completed: log.completedAt?.toISOString() || 'N/A',
      tokens: log.tokensUsed || 0,
      cost: log.cost ? parseFloat(log.cost) : 0,
      error: log.errorMessage || null,
    }))

    // Calculate metrics
    const totalCost = logsAfter
      .filter((log) => log.cost)
      .reduce((sum, log) => sum + parseFloat(log.cost || '0'), 0)

    const successCount = logsAfter.filter(
      (log) => log.status === 'success',
    ).length
    const failureCount = logsAfter.filter(
      (log) => log.status === 'failed',
    ).length
    const successRate = (successCount / (successCount + failureCount)) * 100

    const testResults = {
      success: true,
      message: 'Phase 1 test completed successfully!',
      enrichmentResults: {
        classification: result.data.scoring.classification,
        score: result.data.scoring.overallScore,
        toolCalls: result.toolCalls,
        gatheringSteps: result.gatheringSteps,
        duration,
      },
      loggingResults: {
        totalLogs: logsAfter.length,
        logSummary,
        metrics: {
          totalCost: parseFloat(totalCost.toFixed(4)),
          successRate: parseFloat(successRate.toFixed(1)),
          successCount,
          failureCount,
        },
      },
      testInput: {
        leadId: testInput.leadId,
        companyWebsite: testInput.companyWebsite,
      },
    }

    console.log('* Test Results:', JSON.stringify(testResults, null, 2))

    return NextResponse.json(testResults)
  } catch (error) {
    console.error('x Test failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Phase 1 test failed',
      },
      { status: 500 },
    )
  }
}

