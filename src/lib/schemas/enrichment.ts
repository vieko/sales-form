import { z } from 'zod'

export const companyEnrichmentSchema = z.object({
  name: z.string().describe('Official company name'),
  industry: z.string().describe('Primary industry'),
  employeeCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Number of employees'),
  revenue: z.number().positive().optional().describe('Annual revenue in USD'),
  location: z.string().optional().describe('Company location/headquarters'),

  enrichedData: z
    .object({
      funding: z
        .object({
          totalRaised: z
            .number()
            .optional()
            .describe('Total funding raised in USD'),
          lastRound: z.string().optional().describe('Last funding round type'),
          investors: z.array(z.string()).optional().describe('Known investors'),
        })
        .optional(),

      techStack: z
        .array(z.string())
        .optional()
        .describe('Technologies used by company'),

      competitors: z.array(z.string()).optional().describe('Main competitors'),

      newsSignals: z
        .array(
          z.object({
            title: z.string().describe('News article title'),
            url: z.url().describe('Article URL'),
            date: z.string().describe('Publication date'),
            sentiment: z
              .enum(['positive', 'neutral', 'negative'])
              .describe('Article sentiment'),
          }),
        )
        .optional()
        .describe('Recent news about the company'),

      website: z
        .object({
          pages: z
            .array(
              z.object({
                url: z.url().describe('Page URL'),
                content: z.string().describe('Key content extracted'),
                analysis: z.string().describe('Analysis of the page'),
              }),
            )
            .describe('Analyzed website pages'),

          pricing: z
            .object({
              hasPublicPricing: z
                .boolean()
                .describe('Whether pricing is publicly available'),
              pricePoints: z
                .array(z.number())
                .optional()
                .describe('Price points found'),
              model: z
                .enum(['freemium', 'subscription', 'one-time', 'enterprise'])
                .describe('Pricing model'),
            })
            .optional(),
        })
        .optional(),

      socialPresence: z
        .object({
          linkedin: z.url().optional().describe('LinkedIn company page'),
          twitter: z.url().optional().describe('Twitter profile'),
          crunchbase: z.url().optional().describe('Crunchbase profile'),
        })
        .optional(),
    })
    .describe('Enriched company data from external APIs'),
})

export const intentAnalysisSchema = z.object({
  urgency: z
    .enum(['low', 'medium', 'high'])
    .describe('Urgency level based on language'),
  budgetMentioned: z.boolean().describe('Whether budget/pricing is mentioned'),
  buyingStage: z
    .enum(['awareness', 'consideration', 'decision'])
    .describe('Current buying stage'),
  painPoints: z.array(z.string()).describe('Identified pain points'),
  timeline: z.string().describe('Implementation timeline mentioned or implied'),
  decisionMakers: z.boolean().describe('Whether decision makers are involved'),
  keywords: z.array(z.string()).describe('Key intent keywords'),
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Overall sentiment'),
  intentScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Intent strength score 0-100'),
  reasoning: z.string().describe('Reasoning behind the analysis'),
})

export const scoringSchema = z.object({
  firmographicScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Company fit score (35% weight)'),
  behavioralScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Engagement score (25% weight)'),
  intentScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Intent strength score (25% weight)'),
  technographicScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Tech stack fit score (15% weight)'),
  overallScore: z.number().min(0).max(100).describe('Weighted total score'),
  classification: z
    .enum(['SQL', 'MQL', 'UNQUALIFIED'])
    .describe('Lead classification'),
  classificationConfidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence in classification'),
  reasoning: z
    .object({
      firmographic: z.string().describe('Firmographic scoring reasoning'),
      behavioral: z.string().describe('Behavioral scoring reasoning'),
      intent: z.string().describe('Intent scoring reasoning'),
      technographic: z.string().describe('Technographic scoring reasoning'),
      overall: z.string().describe('Overall classification reasoning'),
    })
    .describe('Detailed reasoning for each score component'),
})

export const enrichmentResponseSchema = z.object({
  company: companyEnrichmentSchema.describe('Enriched company data'),
  intentAnalysis: intentAnalysisSchema.describe(
    'Intent analysis from form text',
  ),
  scoring: scoringSchema.describe('Complete lead scoring breakdown'),
  enrichmentMetadata: z
    .object({
      apiCalls: z
        .array(
          z.object({
            provider: z
              .enum(['exa', 'firecrawl', 'openai', 'perplexity'])
              .describe('API provider'),
            operation: z.string().describe('Operation performed'),
            tokensUsed: z.number().optional().describe('Tokens consumed'),
            cost: z.number().optional().describe('Cost in USD'),
            success: z.boolean().describe('Whether call succeeded'),
          }),
        )
        .describe('API calls made during enrichment'),
      totalCost: z.number().describe('Total enrichment cost'),
      processingTime: z.number().describe('Processing time in milliseconds'),
      cacheHits: z.number().describe('Number of cache hits'),
      dataFreshness: z.string().describe('How fresh the enriched data is'),
    })
    .describe('Metadata about the enrichment process'),
})

export const enrichmentInputSchema = z.object({
  contactName: z.string().describe('Contact person name'),
  companyEmail: z.email().describe('Company email'),
  companyWebsite: z.url().describe('Company website'),
  companySize: z.string().describe('Company size'),
  productInterest: z.string().describe('Product interest'),
  howCanWeHelp: z.string().describe('How can we help text for intent analysis'),
  country: z.string().describe('Company country'),
  behavioralData: z
    .object({
      pageViews: z.number().optional(),
      timeOnSite: z.number().optional(),
      visitedResources: z.array(z.string()).optional(),
      emailEngagement: z
        .object({
          opened: z.number(),
          clicked: z.number(),
        })
        .optional(),
      previousVisits: z.number().optional(),
    })
    .optional()
    .describe('Behavioral data for scoring'),
})

export type CompanyEnrichment = z.infer<typeof companyEnrichmentSchema>
export type IntentAnalysis = z.infer<typeof intentAnalysisSchema>
export type Scoring = z.infer<typeof scoringSchema>
export type EnrichmentResponse = z.infer<typeof enrichmentResponseSchema>
export type EnrichmentInput = z.infer<typeof enrichmentInputSchema>
