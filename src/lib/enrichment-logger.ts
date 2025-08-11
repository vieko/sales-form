import { db } from '@/db/drizzle'
import { enrichmentLogs } from '@/db/schemas'
import type { NewEnrichmentLog } from '@/db/schemas/enrichment-logs'
import { eq } from 'drizzle-orm'
import { CostCalculators } from '@/lib/costs'

export type EnrichmentProvider = 'openai' | 'perplexity' | 'exa' | 'firecrawl'

export interface StartLogParams {
  leadId?: string
  companyId?: string
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
      leadId: params.leadId || null,
      companyId: params.companyId || null,
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

// Global context for the current enrichment session
let currentEnrichmentContext: EnrichmentContext = {}

/**
 * Set the enrichment context for the current session
 * This should be called at the start of each enrichment
 */
export function setEnrichmentContext(context: EnrichmentContext): void {
  currentEnrichmentContext = context
}

/**
 * Clear the enrichment context
 */
export function clearEnrichmentContext(): void {
  currentEnrichmentContext = {}
}

/**
 * Get the current enrichment context
 */
export function getEnrichmentContext(): EnrichmentContext {
  return currentEnrichmentContext
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
    await db
      .update(enrichmentLogs)
      .set({
        leadId: params.leadId,
        companyId: params.companyId,
      })
      .where(eq(enrichmentLogs.leadId, params.submissionId)) // Update logs that used submissionId as temporary leadId
  } catch (error) {
    console.error('Failed to update enrichment logs with final IDs:', error)
  }
}

/**
 * Utility function to wrap any AI tool with logging
 * Uses function composition pattern for clean integration
 */
export function withEnrichmentLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  tool: T,
  provider: EnrichmentProvider,
  operation: string,
): T {
  return (async (...args: Parameters<T>) => {
    const context = getEnrichmentContext()
    const logId = await startEnrichmentLog({
      leadId: context.leadId,
      companyId: context.companyId,
      provider,
      operation,
      requestData: args,
    })

    try {
      const result = await tool(...args)
      
      // Extract token/cost info from different response formats
      let tokensUsed: number | undefined
      let cost: number | undefined
      
      // AI SDK responses (OpenAI, Perplexity)
      if (result?.usage?.totalTokens) {
        tokensUsed = result.usage.totalTokens
        
        // Calculate cost using centralized cost calculators
        if (provider === 'openai' && tokensUsed) {
          cost = CostCalculators.openai(tokensUsed)
        } else if (provider === 'perplexity' && tokensUsed) {
          cost = CostCalculators.perplexity(tokensUsed)
        }
      }
      
      // External API cost estimates
      if (result?.estimatedCost) {
        cost = result.estimatedCost // Exa
      } else if (result?.costTracking?.estimatedCost) {
        cost = result.costTracking.estimatedCost // Firecrawl
      }
      
      // Fallback token extraction
      if (!tokensUsed && result?.tokens) {
        tokensUsed = result.tokens
      }
      
      await completeEnrichmentLog({
        logId,
        responseData: result,
        tokensUsed,
        cost,
      })
      
      return result
    } catch (error) {
      await failEnrichmentLog({
        logId,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      
      // Re-throw the error to maintain the original behavior
      throw error
    }
  }) as T
}