import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getPrompt } from '@/lib/prompts'
// Tools imported for potential future use in AI SDK workflow
// Currently using direct API calls for POC simplicity

// Lead enrichment result schema
const enrichmentResultSchema = z.object({
  companyOverview: z.object({
    name: z.string(),
    domain: z.string(),
    industry: z.string(),
    size: z.string(),
    location: z.string(),
    businessModel: z.string(),
    targetMarket: z.string(),
    recentSignals: z.array(z.string())
  }),
  scores: z.object({
    firmographic: z.number().min(0).max(100),
    behavioral: z.number().min(0).max(100),
    intent: z.number().min(0).max(100),
    technographic: z.number().min(0).max(100),
    total: z.number().min(0).max(100)
  }),
  classification: z.object({
    result: z.enum(['SQL', 'MQL', 'UNQUALIFIED']),
    confidence: z.number().min(0).max(100),
    reasoning: z.array(z.string())
  }),
  recommendedActions: z.object({
    nextSteps: z.array(z.string()),
    personalizationPoints: z.array(z.string()),
    potentialObjections: z.array(z.string()),
    followUpTimeline: z.string()
  }),
  enrichmentData: z.object({
  companyIntelligence: z.unknown().optional(),
  websiteAnalysis: z.unknown().optional(),
  competitiveIntelligence: z.unknown().optional(),
  intentAnalysis: z.unknown().optional()
  })
})

export type EnrichmentResult = z.infer<typeof enrichmentResultSchema>

interface LeadData {
  contactName: string
  companyEmail: string
  contactPhone?: string
  companyWebsite: string
  country: string
  companySize: string
  productInterest: string
  howCanWeHelp: string
  mockBehavioralData?: boolean
  behavioralData?: {
    pageViews?: number
    timeOnSite?: number
    downloadedResources?: string[]
    emailEngagement?: {
      opened: number
      clicked: number
    }
    previousVisits?: number
  }
}

export class LeadEnrichmentAgent {
  private model = openai('gpt-4o')

  /**
   * Enrich a lead with comprehensive analysis and scoring
   */
  async enrichLead(leadData: LeadData, onProgress?: (step: string, data?: unknown) => void): Promise<EnrichmentResult> {
    try {
      onProgress?.('Starting lead enrichment analysis...')

      // Extract company domain from website or email
      const domain = this.extractDomain(leadData.companyWebsite || leadData.companyEmail)
      const companyName = this.extractCompanyName(leadData.companyEmail, domain)

      onProgress?.('Gathering company intelligence...', { domain, companyName })

      // Run enrichment tools concurrently for better performance
      const [
        companyIntel,
        websiteData,
        competitiveData,
        intentData
      ] = await Promise.allSettled([
        this.gatherCompanyIntelligence(companyName, domain),
        this.analyzeWebsite(leadData.companyWebsite),
        this.gatherCompetitiveIntelligence(companyName, leadData.productInterest),
        this.analyzeIntent(leadData.howCanWeHelp, `${companyName} - ${leadData.companySize} company`)
      ])

      onProgress?.('Analyzing data and calculating scores...')

      // Prepare enrichment data for analysis
      const enrichmentData = {
        companyIntelligence: companyIntel.status === 'fulfilled' ? companyIntel.value : null,
        websiteAnalysis: websiteData.status === 'fulfilled' ? websiteData.value : null,
        competitiveIntelligence: competitiveData.status === 'fulfilled' ? competitiveData.value : null,
        intentAnalysis: intentData.status === 'fulfilled' ? intentData.value : null
      }

      onProgress?.('Generating final analysis and classification...')

      // Generate comprehensive analysis using all gathered data
      const result = await generateObject({
        model: this.model,
        system: getPrompt('leadEnrichment'),
        prompt: this.buildAnalysisPrompt(leadData, enrichmentData),
        schema: enrichmentResultSchema,
        temperature: 0.2
      })

      onProgress?.('Enrichment completed!', { classification: result.object.classification })

      return {
        ...result.object,
        enrichmentData
      }

    } catch (error) {
      console.error('Lead enrichment failed:', error)
      throw new Error(`Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stream enrichment progress with real-time updates
   */
  async *streamEnrichment(leadData: LeadData) {
    yield { step: 'initializing', message: 'Starting lead enrichment...', progress: 0 }

    try {
      const domain = this.extractDomain(leadData.companyWebsite || leadData.companyEmail)
      const companyName = this.extractCompanyName(leadData.companyEmail, domain)

      yield { step: 'company_intelligence', message: 'Gathering company intelligence...', progress: 20 }
      const companyIntel = await this.gatherCompanyIntelligence(companyName, domain)

      yield { step: 'website_analysis', message: 'Analyzing company website...', progress: 40 }
      const websiteData = await this.analyzeWebsite(leadData.companyWebsite)

      yield { step: 'competitive_research', message: 'Researching competitive landscape...', progress: 60 }
      const competitiveData = await this.gatherCompetitiveIntelligence(companyName, leadData.productInterest)

      yield { step: 'intent_analysis', message: 'Analyzing buying intent...', progress: 80 }
      const intentData = await this.analyzeIntent(leadData.howCanWeHelp, `${companyName} - ${leadData.companySize} company`)

      yield { step: 'final_analysis', message: 'Calculating scores and classification...', progress: 90 }

      const enrichmentData = { companyIntel, websiteData, competitiveData, intentData }
      
      const result = await generateObject({
        model: this.model,
        system: getPrompt('leadEnrichment'),
        prompt: this.buildAnalysisPrompt(leadData, enrichmentData),
        schema: enrichmentResultSchema,
        temperature: 0.2
      })

      yield { 
        step: 'completed', 
        message: 'Enrichment completed!', 
        progress: 100, 
        result: { ...result.object, enrichmentData }
      }

    } catch (error) {
      yield { 
        step: 'error', 
        message: `Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        progress: 0,
        error 
      }
    }
  }

  private async gatherCompanyIntelligence(companyName: string, domain: string) {
    try {
      // For POC: Call the underlying exa API directly
      const { exa } = await import('@/lib/exa')
      const company = domain || companyName
      const searchQuery = `${company} company news recent developments business`
      
      const { results } = await exa.searchAndContents(searchQuery, {
        type: 'neural',
        numResults: 5,
        startPublishedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        text: {
          maxCharacters: 1000,
          includeHtmlTags: false
        }
      })

      return results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 800) || '',
        publishedDate: result.publishedDate,
        score: result.score,
        highlights: []
      }))
    } catch (error) {
      console.error('Company intelligence failed:', error)
      return { error: 'Company intelligence failed' }
    }
  }

  private async analyzeWebsite(websiteUrl: string) {
    try {
      // For POC: Return mock website analysis
      const mockWebsiteData = {
        url: websiteUrl,
        pages: [
          {
            url: `${websiteUrl}/about`,
            title: 'About Us',
            content: 'Mock content about the company mission, team size, and target market...',
            analysis: {
              teamSize: 'startup',
              targetMarket: 'SMB',
              maturitySignals: ['modern_design', 'testimonials', 'case_studies']
            }
          },
          {
            url: `${websiteUrl}/pricing`,
            title: 'Pricing',
            content: 'Mock pricing information with tiers and costs...',
            analysis: {
              hasPublicPricing: true,
              pricePoints: [29, 99, 299],
              model: 'subscription'
            }
          }
        ],
        techStack: ['React', 'TypeScript', 'Vercel', 'Stripe'],
        overallAnalysis: {
          websiteMaturity: 'high',
          targetMarket: 'SMB',
          pricingModel: 'subscription',
          businessModel: 'SaaS'
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      return mockWebsiteData
    } catch (error) {
      console.error('Website analysis failed:', error)
      return { error: 'Website analysis failed' }
    }
  }

  private async gatherCompetitiveIntelligence(companyName: string, industry: string) {
    try {
      // For POC: Return mock competitive intelligence
      const mockCompetitiveData = {
        company: companyName,
        industry,
        focus: 'competitors',
        analysis: {
          marketPosition: 'emerging player',
          competitorCount: 'high',
          mainCompetitors: [
            'Stripe (payments)',
            'Square (SMB focus)',
            'PayPal (consumer)'
          ],
          competitiveLandscape: {
            marketLeader: 'Stripe',
            emergingPlayers: [companyName],
            marketGrowth: 'high',
            differentiation: [
              'focus on SMB market',
              'simplified onboarding',
              'industry-specific features'
            ]
          },
          marketInsights: [
            'Payment processing market growing 15% YoY',
            'SMB segment underserved by traditional players',
            'Regulatory changes driving innovation'
          ]
        },
        sources: [
          'TechCrunch market analysis',
          'CB Insights competitive map',
          'Company press releases'
        ],
        lastUpdated: new Date().toISOString()
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      return mockCompetitiveData
    } catch (error) {
      console.error('Competitive intelligence failed:', error)
      return { error: 'Competitive intelligence failed' }
    }
  }

  private async analyzeIntent(howCanWeHelpText: string, companyContext: string) {
    try {
      // Use GPT-4 for intent analysis - this actually works with AI SDK
      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `You are an expert sales development representative analyzing prospect intent.
        
        Analyze the provided text for buying signals and intent indicators:
        
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
        
        Score 0-100 based on buying readiness and intent strength.`,
        prompt: `Analyze this prospect's intent:
        
        Text: "${howCanWeHelpText}"
        ${companyContext ? `Company Context: "${companyContext}"` : ''}
        
        Provide detailed intent analysis with specific reasoning.`,
        schema: z.object({
          urgency: z.enum(['low', 'medium', 'high']).describe('Urgency level based on language used'),
          budgetMentioned: z.boolean().describe('Whether budget/pricing concerns are mentioned'),
          buyingStage: z.enum(['awareness', 'consideration', 'decision']).describe('Buying stage indicators'),
          painPoints: z.array(z.string()).describe('Identified pain points or challenges'),
          timeline: z.string().describe('Mentioned or implied timeline for implementation'),
          decisionMakers: z.boolean().describe('Whether decision makers are mentioned or implied'),
          keywords: z.array(z.string()).describe('Key intent keywords found'),
          sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment'),
          intentScore: z.number().min(0).max(100).describe('Intent score based on analysis'),
          reasoning: z.string().describe('Explanation of the intent analysis')
        }),
        temperature: 0.2
      })

      return result.object
    } catch (error) {
      console.error('Intent analysis failed:', error)
      return { 
        error: 'Intent analysis failed',
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
          reasoning: 'Analysis failed, using fallback values'
        }
      }
    }
  }

  private extractDomain(urlOrEmail: string): string {
    try {
      // If it's an email, extract domain
      if (urlOrEmail.includes('@')) {
        return urlOrEmail.split('@')[1]
      }
      // If it's a URL, extract domain
      const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`)
      return url.hostname.replace(/^www\./, '')
    } catch {
      return urlOrEmail
    }
  }

  private extractCompanyName(email: string, domain: string): string {
    // Try to extract company name from domain
    const domainParts = domain.split('.')
    const companyPart = domainParts[0]
    
    // Capitalize first letter and handle common patterns
    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
  }

  private buildAnalysisPrompt(leadData: LeadData, enrichmentData: unknown): string {
    return `Analyze this lead for scoring and classification:

## Lead Information
- Contact: ${leadData.contactName}
- Company: ${leadData.companyEmail}
- Website: ${leadData.companyWebsite}
- Country: ${leadData.country}
- Company Size: ${leadData.companySize}
- Product Interest: ${leadData.productInterest}
- How Can We Help: "${leadData.howCanWeHelp}"

## Behavioral Data
${leadData.mockBehavioralData ? 
  `Mock behavioral data enabled:
  - Page Views: ${leadData.behavioralData?.pageViews || 5}
  - Time on Site: ${leadData.behavioralData?.timeOnSite || 180}s
  - Downloaded Resources: ${leadData.behavioralData?.downloadedResources?.join(', ') || 'None'}
  - Email Engagement: ${leadData.behavioralData?.emailEngagement?.opened || 0} opens, ${leadData.behavioralData?.emailEngagement?.clicked || 0} clicks
  - Previous Visits: ${leadData.behavioralData?.previousVisits || 1}` 
  : 'No behavioral data available'}

## Enrichment Data
${JSON.stringify(enrichmentData, null, 2)}

Please provide a comprehensive analysis following the lead scoring framework with specific scores for each category and a final classification with reasoning.`
  }
}

// Export singleton instance
export const leadEnrichmentAgent = new LeadEnrichmentAgent()
