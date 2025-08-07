import { openai } from '@ai-sdk/openai'
import { generateObject, streamText } from 'ai'
import { z } from 'zod'
import { getPrompt } from '@/lib/prompts'
import {
  companyIntelligence,
  websiteAnalysis,
  competitiveIntelligence,
  intentAnalysis
} from '@/lib/tools'

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
    companyIntelligence: z.any().optional(),
    websiteAnalysis: z.any().optional(),
    competitiveIntelligence: z.any().optional(),
    intentAnalysis: z.any().optional()
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
  async enrichLead(leadData: LeadData, onProgress?: (step: string, data?: any) => void): Promise<EnrichmentResult> {
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
    return await companyIntelligence.execute({ 
      company: domain || companyName,
      focus: 'general'
    })
  }

  private async analyzeWebsite(websiteUrl: string) {
    return await websiteAnalysis.execute({ 
      websiteUrl,
      maxPages: 5
    })
  }

  private async gatherCompetitiveIntelligence(companyName: string, industry: string) {
    return await competitiveIntelligence.execute({
      company: companyName,
      industry,
      focus: 'competitors'
    })
  }

  private async analyzeIntent(howCanWeHelpText: string, companyContext: string) {
    return await intentAnalysis.execute({
      howCanWeHelpText,
      companyContext
    })
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

  private buildAnalysisPrompt(leadData: LeadData, enrichmentData: any): string {
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
