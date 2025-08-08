import { tool } from 'ai'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'

const SYSTEM = `
You are an expert sales development representative analyzing prospect intent. Analyze the provided text for buying signals and intent indicators:

HIGH URGENCY signals:
- Time pressure ("ASAP", "urgent", "immediately", "this quarter")
- Problems causing pain ("losing customers", "inefficient", "breaking")
- Competitive threats ("considering alternatives", "evaluating options")

BUDGET signals:
- Direct mentions ("budget allocated", "willing to invest", "price range")
- Indirect hints ("ROI focused", "cost-effective", "value proposition")

BUYING STAGE indicators:
- Awareness: General research, learning, understanding needs
- Consideration: Comparing solutions, evaluating features, ROI analysis  
- Decision: Ready to move forward, timeline mentioned, decision criteria

DECISION MAKER signals:
- Authority language ("I decide", "my team", "we need")
- Title implications ("CEO", "CTO", "Director", "VP")
- Budget authority ("approved budget", "investment ready")

Score 0-100 based on buying readiness and intent strength.`

const DESCRIPTION = `
- Analyzes "how can we help" text for intent signals and buying stage
- Extracts urgency, budget mentions, pain points, and decision-making signals
- Returns structured intent analysis for lead scoring
- Use this tool to understand prospect intent and buying readiness

Usage notes:
  - Provide the full "how can we help" text from the form
  - Uses GPT-4 for sophisticated intent analysis
  - Returns structured data including urgency, budget, timeline, pain points
  - Critical for intent scoring (25% of total lead score)`

const intentAnalysisSchema = z.object({
  urgency: z
    .enum(['low', 'medium', 'high'])
    .describe('Urgency level based on language used'),
  budgetMentioned: z
    .boolean()
    .describe('Whether budget/pricing concerns are mentioned'),
  buyingStage: z
    .enum(['awareness', 'consideration', 'decision'])
    .describe('Buying stage indicators'),
  painPoints: z
    .array(z.string())
    .describe('Identified pain points or challenges'),
  timeline: z
    .string()
    .describe('Mentioned or implied timeline for implementation'),
  decisionMakers: z
    .boolean()
    .describe('Whether decision makers are mentioned or implied'),
  keywords: z.array(z.string()).describe('Key intent keywords found'),
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Overall sentiment'),
  intentScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Intent score based on analysis'),
  reasoning: z.string().describe('Explanation of the intent analysis'),
})

export const intentAnalysis = tool({
  name: 'intentAnalysis',
  description: DESCRIPTION,
  inputSchema: z.object({
    howCanWeHelpText: z
      .string()
      .describe('The "how can we help" text from the form'),
    companyContext: z
      .string()
      .describe('Additional company context for better analysis')
      .optional(),
  }),
  execute: async ({ howCanWeHelpText, companyContext = '' }) => {
    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        system: SYSTEM,
        prompt: `Analyze this prospect's intent:
        
        Text: "${howCanWeHelpText}"
        ${companyContext ? `Company Context: "${companyContext}"` : ''}
        
        Provide detailed intent analysis with specific reasoning.`,
        schema: intentAnalysisSchema,
        temperature: 0.2, // consistency
      })
      return result.object
    } catch (error) {
      console.error('Intent analysis failed:', error)
      return {
        error: 'Failed to analyze intent',
        details: error,
        fallback: {
          urgency: 'medium' as const,
          budgetMentioned: false,
          buyingStage: 'consideration' as const,
          painPoints: [],
          timeline: 'unknown',
          decisionMakers: false,
          keywords: [],
          sentiment: 'neutral' as const,
          intentScore: 50,
          reasoning: 'Analysis failed, using fallback values',
        },
      }
    }
  },
})
