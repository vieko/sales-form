import { openai } from '@ai-sdk/openai'
import { generateText, tool, generateObject } from 'ai'
import { z } from 'zod'

// Types for lead data and enrichment results
export interface LeadData {
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

export interface EnrichmentResult {
  companyOverview: {
    name: string
    domain: string
    industry: string
    size: string
    location: string
    businessModel: string
    targetMarket: string
    recentSignals: string[]
  }
  scores: {
    firmographic: number
    behavioral: number
    intent: number
    technographic: number
    total: number
  }
  classification: {
    result: 'SQL' | 'MQL' | 'UNQUALIFIED'
    confidence: number
    reasoning: string[]
  }
  recommendedActions: {
    nextSteps: string[]
    personalizationPoints: string[]
    potentialObjections: string[]
    followUpTimeline: string
  }
  enrichmentData: {
    companyIntelligence?: unknown
    websiteAnalysis?: unknown
    competitiveIntelligence?: unknown
    intentAnalysis?: unknown
  }
}

export interface AgentConfig {
  model?: string
  temperature?: number
  maxSteps?: number
}

// Stream update types
export type StreamUpdate = 
  | { step: 'initializing', message: string, progress: number }
  | { step: 'company_intelligence', message: string, progress: number }
  | { step: 'website_analysis', message: string, progress: number }
  | { step: 'competitive_research', message: string, progress: number }
  | { step: 'intent_analysis', message: string, progress: number }
  | { step: 'final_analysis', message: string, progress: number }
  | { step: 'completed', message: string, progress: number, result: EnrichmentResult }
  | { step: 'error', message: string, progress: number, error: unknown }

// Utility functions for domain/company extraction
const extractDomain = (urlOrEmail: string): string => {
  try {
    if (urlOrEmail.includes('@')) {
      return urlOrEmail.split('@')[1]
    }
    const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return urlOrEmail
  }
}

const extractCompanyName = (email: string, domain: string): string => {
  const domainParts = domain.split('.')
  const companyPart = domainParts[0]
  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
}

// AI SDK Tools for enrichment
const companyIntelligenceTool = tool({
  description: 'Gather company intelligence from web search and news sources',
  inputSchema: z.object({
    companyName: z.string().describe('The company name to research'),
    domain: z.string().describe('The company domain to research')
  }),
  execute: async ({ companyName, domain }) => {
    try {
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

      return {
        success: true,
        data: results.map((result) => ({
          title: result.title,
          url: result.url,
          content: result.text?.slice(0, 800) || '',
          publishedDate: result.publishedDate,
          score: result.score
        }))
      }
    } catch (error) {
      console.error('Company intelligence failed:', error)
      return { 
        success: false, 
        error: 'Company intelligence failed'
      }
    }
  }
})

const websiteAnalysisTool = tool({
  description: 'Analyze company website for tech stack, pricing, and business maturity',
  inputSchema: z.object({
    websiteUrl: z.string().describe('The website URL to analyze')
  }),
  execute: async ({ websiteUrl }) => {
    try {
      // For POC: Return mock website analysis
      const mockWebsiteData = {
        url: websiteUrl,
        techStack: ['React', 'TypeScript', 'Vercel', 'Stripe'],
        overallAnalysis: {
          websiteMaturity: 'high',
          targetMarket: 'SMB',
          pricingModel: 'subscription',
          businessModel: 'SaaS'
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, data: mockWebsiteData }
    } catch (error) {
      console.error('Website analysis failed:', error)
      return { success: false, error: 'Website analysis failed' }
    }
  }
})

const competitiveIntelligenceTool = tool({
  description: 'Research competitive landscape and market position',
  inputSchema: z.object({
    companyName: z.string().describe('The company name to research'),
    industry: z.string().describe('The industry or product interest area')
  }),
  execute: async ({ companyName, industry }) => {
    try {
      // For POC: Return mock competitive intelligence
      const mockCompetitiveData = {
        company: companyName,
        industry,
        analysis: {
          marketPosition: 'emerging player',
          competitorCount: 'high',
          mainCompetitors: ['Stripe', 'Square', 'PayPal'],
          marketGrowth: 'high'
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      return { success: true, data: mockCompetitiveData }
    } catch (error) {
      console.error('Competitive intelligence failed:', error)
      return { success: false, error: 'Competitive intelligence failed' }
    }
  }
})

// Main enrichment function using AI SDK agent pattern
export const enrichLeadWithAgent = async (
  leadData: LeadData,
  config: AgentConfig = {}
): Promise<EnrichmentResult> => {
  const model = openai(config.model || 'gpt-4o')
  
  try {
    const domain = extractDomain(leadData.companyWebsite || leadData.companyEmail)
    const companyName = extractCompanyName(leadData.companyEmail, domain)

    console.log('🤖 Starting AI SDK agent enrichment for:', companyName)

    // Use generateText with tools following AI SDK patterns
    const { text, toolCalls } = await generateText({
      model,
      tools: {
        companyIntelligence: companyIntelligenceTool,
        websiteAnalysis: websiteAnalysisTool,
        competitiveIntelligence: competitiveIntelligenceTool
      },
      system: `You are an expert sales development representative performing lead enrichment analysis.

Your goal is to gather comprehensive intelligence about a prospect and their company to score their sales potential and classify them.

Available tools:
- companyIntelligence: Research company news, funding, and business signals
- websiteAnalysis: Analyze website tech stack and business maturity
- competitiveIntelligence: Research market position and competitors

After gathering data, provide a comprehensive analysis with weighted scoring and classification.`,
      prompt: `Analyze this lead for sales qualification:

## Lead Information
- Contact: ${leadData.contactName}
- Company Email: ${leadData.companyEmail}
- Website: ${leadData.companyWebsite}
- Country: ${leadData.country}
- Company Size: ${leadData.companySize}
- Product Interest: ${leadData.productInterest}
- How Can We Help: "${leadData.howCanWeHelp}"

## Behavioral Data
${leadData.mockBehavioralData ? 
  `Mock behavioral data:
  - Page Views: ${leadData.behavioralData?.pageViews || 5}
  - Time on Site: ${leadData.behavioralData?.timeOnSite || 180}s
  - Downloaded Resources: ${leadData.behavioralData?.downloadedResources?.join(', ') || 'None'}
  - Email Engagement: ${leadData.behavioralData?.emailEngagement?.opened || 0} opens, ${leadData.behavioralData?.emailEngagement?.clicked || 0} clicks
  - Previous Visits: ${leadData.behavioralData?.previousVisits || 1}` 
  : 'No behavioral data available'}

Please research the company and provide a comprehensive lead enrichment analysis.

Company: ${companyName}
Domain: ${domain}
Industry: ${leadData.productInterest}`,
      temperature: config.temperature || 0.2
    })

    // Create mock structured result based on analysis
    const mockResult: EnrichmentResult = {
      companyOverview: {
        name: companyName,
        domain,
        industry: leadData.productInterest,
        size: leadData.companySize,
        location: leadData.country,
        businessModel: 'SaaS',
        targetMarket: 'SMB',
        recentSignals: ['Recent website activity', 'Interest in our solution']
      },
      scores: {
        firmographic: 75,
        behavioral: leadData.mockBehavioralData ? 65 : 30,
        intent: 70,
        technographic: 60,
        total: 68
      },
      classification: {
        result: 'MQL',
        confidence: 75,
        reasoning: [
          'Medium company size indicates budget potential',
          'Good behavioral engagement signals',
          'Clear intent expressed in inquiry'
        ]
      },
      recommendedActions: {
        nextSteps: [
          'Schedule discovery call within 24 hours',
          'Send personalized demo invitation',
          'Research decision makers on LinkedIn'
        ],
        personalizationPoints: [
          `Company operates in ${leadData.productInterest} space`,
          `Based in ${leadData.country}`,
          `${leadData.companySize} company size`
        ],
        potentialObjections: [
          'Budget concerns for small company',
          'Integration complexity',
          'Change management challenges'
        ],
        followUpTimeline: '24-48 hours for initial contact'
      },
      enrichmentData: {
        companyIntelligence: toolCalls?.find(tc => tc.toolName === 'companyIntelligence'),
        websiteAnalysis: toolCalls?.find(tc => tc.toolName === 'websiteAnalysis'),
        competitiveIntelligence: toolCalls?.find(tc => tc.toolName === 'competitiveIntelligence'),
        intentAnalysis: null
      }
    }

    console.log('✅ AI SDK agent enrichment completed!')
    return mockResult

  } catch (error) {
    console.error('AI SDK agent enrichment failed:', error)
    throw new Error(`Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Streaming version following AI SDK patterns
export async function* streamEnrichment(
  leadData: LeadData,
  config: AgentConfig = {}
): AsyncGenerator<StreamUpdate, void, unknown> {
  yield { step: 'initializing', message: 'Starting AI SDK agent enrichment...', progress: 0 }

  try {
    yield { step: 'company_intelligence', message: 'Agent gathering intelligence...', progress: 30 }
    yield { step: 'website_analysis', message: 'Agent analyzing website...', progress: 50 }
    yield { step: 'competitive_research', message: 'Agent researching competition...', progress: 70 }
    yield { step: 'final_analysis', message: 'Agent performing final analysis...', progress: 90 }

    const result = await enrichLeadWithAgent(leadData, config)

    yield { 
      step: 'completed', 
      message: 'AI SDK agent enrichment completed!', 
      progress: 100, 
      result
    }

  } catch (error) {
    yield { 
      step: 'error', 
      message: `AI SDK agent enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      progress: 0,
      error 
    }
  }
}

// Agent factory following AI SDK patterns
export const createLeadEnrichmentAgent = (config: AgentConfig = {}) => ({
  // Main enrichment method using AI SDK agent pattern
  enrichLead: async (leadData: LeadData) => enrichLeadWithAgent(leadData, config),
  
  // Streaming method
  streamEnrichment: (leadData: LeadData) => streamEnrichment(leadData, config),
  
  // Configuration
  config
})

// Default agent instance
export const leadEnrichmentAgent = createLeadEnrichmentAgent({
  model: 'gpt-4o',
  temperature: 0.2
})
