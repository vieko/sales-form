import { db } from '@/db/drizzle'
import { enrichmentLogs } from '@/db/schemas'
import type { NewEnrichmentLog } from '@/db/schemas/enrichment-logs'
import { eq, sql } from 'drizzle-orm'
import { CostCalculators } from '@/lib/costs'

export type EnrichmentProvider = 'openai' | 'perplexity' | 'exa' | 'firecrawl'

export interface StartLogParams {
  context: EnrichmentContext
  provider: EnrichmentProvider
  operation: string
  requestData: unknown
}

export interface CompleteLogParams {
  logId: string
  responseData: unknown
  tokensUsed?: number
  cost?: number
}

export interface FailLogParams {
  logId: string
  errorMessage: string
  retryCount?: number
}

/**
 * Start logging an enrichment operation
 * @returns Promise<string> - The log ID for tracking this operation
 */
export async function startEnrichmentLog(params: StartLogParams): Promise<string> {
  try {
    const logData: NewEnrichmentLog = {
      leadId: params.context.leadId || null,
      companyId: params.context.companyId || null,
      provider: params.provider,
      operation: params.operation,
      requestData: params.requestData as object,
      startedAt: new Date(),
      status: 'pending',
      currency: 'USD',
    }

    const [insertedLog] = await db
      .insert(enrichmentLogs)
      .values(logData)
      .returning({ id: enrichmentLogs.id })

    return insertedLog.id
  } catch (error) {
    // Don't let logging errors break the enrichment flow
    console.error('Failed to start enrichment log:', error)
    // Return a placeholder ID so the flow can continue
    return `error-${Date.now()}`
  }
}

/**
 * Complete an enrichment operation successfully
 */
export async function completeEnrichmentLog(params: CompleteLogParams): Promise<void> {
  try {
    // Skip if this is an error placeholder ID
    if (params.logId.startsWith('error-')) {
      return
    }

    const completedAt = new Date()
    
    // Get the original log to calculate duration
    const [originalLog] = await db
      .select({ startedAt: enrichmentLogs.startedAt })
      .from(enrichmentLogs)
      .where(eq(enrichmentLogs.id, params.logId))
      .limit(1)
    
    const duration = originalLog 
      ? completedAt.getTime() - originalLog.startedAt.getTime()
      : null
    
    await db
      .update(enrichmentLogs)
      .set({
        responseData: params.responseData as object,
        completedAt,
        duration,
        tokensUsed: params.tokensUsed || null,
        cost: params.cost?.toString() || null,
        status: 'success',
      })
      .where(eq(enrichmentLogs.id, params.logId))
  } catch (error) {
    // Don't let logging errors break the enrichment flow
    console.error('Failed to complete enrichment log:', error)
  }
}

/**
 * Mark an enrichment operation as failed
 */
export async function failEnrichmentLog(params: FailLogParams): Promise<void> {
  try {
    // Skip if this is an error placeholder ID
    if (params.logId.startsWith('error-')) {
      return
    }

    const completedAt = new Date()
    
    await db
      .update(enrichmentLogs)
      .set({
        completedAt,
        duration: null, // Will be calculated in a trigger or computed column later
        status: 'failed',
        errorMessage: params.errorMessage,
        retryCount: params.retryCount || 0,
      })
      .where(eq(enrichmentLogs.id, params.logId))
  } catch (error) {
    // Don't let logging errors break the enrichment flow
    console.error('Failed to update enrichment log with failure:', error)
  }
}

/**
 * Context object for enrichment logging
 */
export interface EnrichmentContext {
  leadId?: string
  companyId?: string
}

/**
 * Update enrichment logs to link them to the final leadId/companyId
 * This is useful when enrichment happens before database records are created
 */
export async function updateEnrichmentLogsWithIds(params: {
  submissionId: string
  leadId: string
  companyId: string
}): Promise<void> {
  try {

    // Update logs with the submissionId in requestData (since leadId is null initially)
    await db
      .update(enrichmentLogs)
      .set({
        leadId: params.leadId,
        companyId: params.companyId,
      })
      .where(sql`${enrichmentLogs.requestData}->>'submissionId' = ${params.submissionId}`)

  } catch (error) {
    console.error('Failed to update enrichment logs with final IDs:', error)
  }
}

/**
 * Get cost summary for a specific enrichment session
 */
export async function getEnrichmentCostSummary(leadId: string): Promise<{
  totalCost: number
  operationsCount: number
  costByProvider: Record<string, { cost: number; operations: number }>
  topOperation: { operation: string; cost: number } | null
}> {
  try {
    const logs = await db
      .select()
      .from(enrichmentLogs)
      .where(eq(enrichmentLogs.leadId, leadId))

    let totalCost = 0
    const costByProvider: Record<string, { cost: number; operations: number }> = {}
    let topOperation: { operation: string; cost: number } | null = null

    logs.forEach(log => {
      const cost = log.cost ? parseFloat(log.cost) : 0
      totalCost += cost

      // Track by provider
      if (!costByProvider[log.provider]) {
        costByProvider[log.provider] = { cost: 0, operations: 0 }
      }
      costByProvider[log.provider].cost += cost
      costByProvider[log.provider].operations += 1

      // Track top operation
      if (!topOperation || cost > topOperation.cost) {
        topOperation = { operation: log.operation, cost }
      }
    })

    return {
      totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
      operationsCount: logs.length,
      costByProvider,
      topOperation,
    }
  } catch (error) {
    console.error('Failed to get enrichment cost summary:', error)
    return {
      totalCost: 0,
      operationsCount: 0,
      costByProvider: {},
      topOperation: null,
    }
  }
}

/**
 * Get real-time cost updates for ongoing enrichment
 */
export async function getRealtimeEnrichmentCosts(leadId: string): Promise<{
  completedOperations: number
  totalCompletedCost: number
  pendingOperations: number
  estimatedTotalCost: number
}> {
  try {
    const logs = await db
      .select()
      .from(enrichmentLogs)
      .where(eq(enrichmentLogs.leadId, leadId))

    const completedLogs = logs.filter(log => log.status === 'success')
    const pendingLogs = logs.filter(log => log.status === 'pending')
    
    const totalCompletedCost = completedLogs.reduce((sum, log) => {
      return sum + (log.cost ? parseFloat(log.cost) : 0)
    }, 0)

    // Rough estimate for pending operations based on averages
    const avgCostPerOperation = completedLogs.length > 0 
      ? totalCompletedCost / completedLogs.length 
      : 0.1 // Default estimate
    
    const estimatedPendingCost = pendingLogs.length * avgCostPerOperation
    const estimatedTotalCost = totalCompletedCost + estimatedPendingCost

    return {
      completedOperations: completedLogs.length,
      totalCompletedCost: Math.round(totalCompletedCost * 10000) / 10000,
      pendingOperations: pendingLogs.length,
      estimatedTotalCost: Math.round(estimatedTotalCost * 10000) / 10000,
    }
  } catch (error) {
    console.error('Failed to get realtime enrichment costs:', error)
    return {
      completedOperations: 0,
      totalCompletedCost: 0,
      pendingOperations: 0,
      estimatedTotalCost: 0,
    }
  }
}

/**
 * Tool name to provider mapping for automatic logging
 */
const TOOL_PROVIDER_MAP: Record<string, EnrichmentProvider> = {
  companyIntelligence: 'exa',
  websiteAnalysis: 'firecrawl',
  competitiveIntelligence: 'perplexity',
  intentAnalysis: 'openai',
}

/**
 * Log tool calls from AI SDK generateText result
 */
export async function logToolCalls(
  context: EnrichmentContext,
  toolCalls: Array<{
    toolCallId: string
    toolName: string
    input: unknown
    result?: unknown
  }>,
  mainLogId?: string
): Promise<void> {
  const logPromises = toolCalls.map(async (toolCall) => {
    const provider = TOOL_PROVIDER_MAP[toolCall.toolName] || 'openai'
    
    const logId = await startEnrichmentLog({
      context,
      provider,
      operation: toolCall.toolName,
      requestData: {
        toolCallId: toolCall.toolCallId,
        input: toolCall.input,
        parentLogId: mainLogId,
      },
    })

    try {
      // Calculate cost based on the tool result
      let cost: number | undefined
      let tokensUsed: number | undefined

      const result = toolCall.result
      if (result && typeof result === 'object') {
        // Exa API results
        if ('estimatedCost' in result) {
          cost = result.estimatedCost as number
        }
        // Firecrawl results  
        else if ('costTracking' in result && result.costTracking && typeof result.costTracking === 'object' && 'estimatedCost' in result.costTracking) {
          cost = result.costTracking.estimatedCost as number
        }
        // Usage-based cost calculation
        else if ('usage' in result && result.usage && typeof result.usage === 'object' && 'totalTokens' in result.usage) {
          tokensUsed = result.usage.totalTokens as number
          if (provider === 'openai' && tokensUsed) {
            cost = CostCalculators.openai(tokensUsed)
          } else if (provider === 'perplexity' && tokensUsed) {
            cost = CostCalculators.perplexity(tokensUsed)
          }
        }
      }

      await completeEnrichmentLog({
        logId,
        responseData: toolCall.result,
        tokensUsed,
        cost,
      })
    } catch (error) {
      await failEnrichmentLog({
        logId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error in tool call logging',
      })
    }
  })

  await Promise.allSettled(logPromises)
}