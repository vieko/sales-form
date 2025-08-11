import {
  enrichmentInputSchema,
  enrichmentResponseSchema,
} from '@/lib/schemas/enrichment'
import {
  companyIntelligence,
  competitiveIntelligence,
  intentAnalysis,
  websiteAnalysis,
} from '@/lib/tools/instrumented'
// Using Vercel AI Gateway - no provider imports needed
import { generateObject, generateText, stepCountIs } from 'ai'
import type { EnrichmentInput } from '@/lib/schemas/enrichment'
import { 
  setEnrichmentContext, 
  clearEnrichmentContext,
  startEnrichmentLog,
  completeEnrichmentLog,
  failEnrichmentLog
} from '@/lib/enrichment-logger'
import { CostCalculators } from '@/lib/costs'
import { logger } from '@/lib/logger'

const DATA_GATHERING_PROMPT = `
You are an expert lead enrichment researcher. Your job is to intelligently gather data about a company and lead using the available tools.

AVAILABLE TOOLS:
- companyIntelligence: Get funding, growth, and news data via Exa API
- websiteAnalysis: Analyze company website structure and content via Firecrawl  
- competitiveIntelligence: Research competitive landscape via Perplexity
- intentAnalysis: Analyze prospect intent from form text via OpenAI

STRATEGY:
1. Start with intent analysis - this is crucial for understanding the prospect
2. Analyze the website to understand the company's positioning and maturity
3. If the company seems significant, gather intelligence about funding/growth
4. Research competitive landscape if needed for context

Be efficient: Don't call tools if you already have sufficient data. Focus on gathering the most valuable data for lead scoring and classification.
`

const SYNTHESIS_PROMPT = `
You are an expert lead enrichment analyst. You have been provided with real data gathered from multiple external APIs about a company and lead. 

Your task is to synthesize this data into comprehensive lead enrichment with accurate scoring and classification.

SCORING FRAMEWORK:
- Firmographic (35%): Company size, revenue, industry fit, geography
- Behavioral (25%): Engagement, website activity, previous interactions
- Intent (25%): Urgency, budget mentions, buying stage, pain points  
- Technographic (15%): Compatible tech stack, integration potential

CLASSIFICATION RULES:
- SQL (Sales Qualified): 70+ score, high intent, meets BANT criteria
- MQL (Marketing Qualified): 40-69 score, good fit but needs nurturing
- UNQUALIFIED: <40 score or poor fit

Analyze the provided tool results and original lead data to create accurate, comprehensive enrichment with detailed reasoning for all scores.
`

export async function enrichLead(input: EnrichmentInput, sessionId?: string) {
  const validatedInput = enrichmentInputSchema.parse(input)

  // Set enrichment context for logging
  setEnrichmentContext({
    leadId: validatedInput.leadId,
    companyId: validatedInput.companyId,
  })

  const domain = new URL(validatedInput.companyWebsite).hostname.replace(
    'www.',
    '',
  )

  const leadContext = `
LEAD TO ENRICH:
- Contact: ${validatedInput.contactName}
- Email: ${validatedInput.companyEmail}
- Website: ${validatedInput.companyWebsite} (domain: ${domain})
- Company Size: ${validatedInput.companySize}
- Product Interest: ${validatedInput.productInterest}
- Country: ${validatedInput.country}
- How Can We Help: "${validatedInput.howCanWeHelp}"

${
  validatedInput.behavioralData
    ? `BEHAVIORAL DATA:
- Page Views: ${validatedInput.behavioralData.pageViews}
- Time on Site: ${validatedInput.behavioralData.timeOnSite} minutes
- Visited Resources: ${validatedInput.behavioralData.visitedResources?.join(', ') || 'None'}
- Email Engagement: ${validatedInput.behavioralData.emailEngagement ? `${validatedInput.behavioralData.emailEngagement.opened} opens, ${validatedInput.behavioralData.emailEngagement.clicked} clicks` : 'No data'}
- Previous Visits: ${validatedInput.behavioralData.previousVisits || 'Unknown'}`
    : ''
}

TASK: Gather comprehensive data about this lead using the available tools. Be strategic and efficient in your tool usage.
`

  console.log('=== STEP 1 === Gathering enrichment data with tools...')

  // Log the main data gathering operation
  const dataGatheringLogId = await startEnrichmentLog({
    leadId: validatedInput.leadId,
    companyId: validatedInput.companyId,
    provider: 'openai',
    operation: 'data-gathering',
    requestData: { leadContext, tools: ['companyIntelligence', 'websiteAnalysis', 'competitiveIntelligence', 'intentAnalysis'] },
  })

  try {
    const dataGathering = await generateText({
      model: 'openai/gpt-4o',
      system: DATA_GATHERING_PROMPT,
      prompt: leadContext,
      tools: {
        companyIntelligence,
        websiteAnalysis,
        competitiveIntelligence,
        intentAnalysis,
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(6), // Reasonable limit for data gathering
    })

    await completeEnrichmentLog({
      logId: dataGatheringLogId,
      responseData: {
        steps: dataGathering.steps.length,
        toolCalls: dataGathering.toolCalls.length,
        text: dataGathering.text.slice(0, 500) + '...',
      },
      tokensUsed: dataGathering.usage?.totalTokens,
      cost: dataGathering.usage?.totalTokens ? CostCalculators.openai(dataGathering.usage.totalTokens) : undefined,
    })

    console.log(
      `=== STEP 1 === completed: ${dataGathering.steps.length} steps, ${dataGathering.toolCalls.length} tool calls`,
    )

    // Log data gathering completion with cost info
    if (sessionId && dataGathering.usage?.totalTokens) {
      const gatheringCost = CostCalculators.openai(dataGathering.usage.totalTokens)
      logger.info(
        `Data gathering completed: ${dataGathering.toolCalls.length} tool calls`,
        {
          stepsCost: `$${gatheringCost.toFixed(4)}`,
          tokensUsed: dataGathering.usage.totalTokens,
          toolsUsed: dataGathering.toolCalls.length,
          status: 'proceeding to synthesis'
        },
        sessionId
      )
    }

    console.log('=== STEP 2 === Synthesizing enrichment data...')

    const synthesisPrompt = `
ORIGINAL LEAD DATA:
${leadContext}

GATHERED TOOL RESULTS:
${JSON.stringify(dataGathering.toolResults, null, 2)}

AI RESEARCH SUMMARY:
${dataGathering.text}

SYNTHESIS TASK:
Based on the original lead data and the gathered tool results above, create comprehensive lead enrichment with accurate scoring and classification. Use the actual data from the tool results to inform your analysis, not assumptions.
`

    // Log the synthesis operation
    const synthesisLogId = await startEnrichmentLog({
      leadId: validatedInput.leadId,
      companyId: validatedInput.companyId,
      provider: 'openai',
      operation: 'enrichment-synthesis',
      requestData: { synthesisPrompt: synthesisPrompt.slice(0, 500) + '...' },
    })

    try {
      const enrichmentResult = await generateObject({
        model: 'openai/gpt-4o',
        system: SYNTHESIS_PROMPT,
        prompt: synthesisPrompt,
        schema: enrichmentResponseSchema,
        temperature: 0.2, // For consistency
      })

      await completeEnrichmentLog({
        logId: synthesisLogId,
        responseData: {
          classification: enrichmentResult.object.scoring.classification,
          overallScore: enrichmentResult.object.scoring.overallScore,
        },
        tokensUsed: enrichmentResult.usage?.totalTokens,
        cost: enrichmentResult.usage?.totalTokens ? CostCalculators.openai(enrichmentResult.usage.totalTokens) : undefined,
      })

      console.log('=== STEP 2 === Enrichment synthesis completed')

      // Log synthesis completion with cost info
      if (sessionId && enrichmentResult.usage?.totalTokens) {
        const synthesisCost = CostCalculators.openai(enrichmentResult.usage.totalTokens)
        logger.info(
          `Enrichment synthesis completed: ${enrichmentResult.object.scoring.classification}`,
          {
            synthesisCost: `$${synthesisCost.toFixed(4)}`,
            tokensUsed: enrichmentResult.usage.totalTokens,
            finalScore: enrichmentResult.object.scoring.overallScore,
            classification: enrichmentResult.object.scoring.classification
          },
          sessionId
        )
      }

      // Clear context at the end
      clearEnrichmentContext()

      return {
        success: true,
        data: enrichmentResult.object,
        domain,
        gatheringSteps: dataGathering.steps.length,
        toolCalls: dataGathering.toolCalls.length,
        gatheringSummary: dataGathering.text.slice(0, 200) + '...',
      }
    } catch (synthesisError) {
      await failEnrichmentLog({
        logId: synthesisLogId,
        errorMessage: synthesisError instanceof Error ? synthesisError.message : String(synthesisError),
      })
      throw synthesisError
    }
  } catch (dataGatheringError) {
    await failEnrichmentLog({
      logId: dataGatheringLogId,
      errorMessage: dataGatheringError instanceof Error ? dataGatheringError.message : String(dataGatheringError),
    })
    
    // Clear context on error
    clearEnrichmentContext()
    throw dataGatheringError
  }
}
