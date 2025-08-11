/**
 * Instrumented versions of AI tools with enrichment logging
 * These wrap the original tools with cost tracking and performance monitoring
 */

import { withEnrichmentLogging } from '@/lib/enrichment-logger'
import {
  companyIntelligence as originalCompanyIntelligence,
  competitiveIntelligence as originalCompetitiveIntelligence,
  intentAnalysis as originalIntentAnalysis,
  websiteAnalysis as originalWebsiteAnalysis,
} from './index'

// Wrap each tool with logging while preserving the original tool interface
export const companyIntelligence = {
  ...originalCompanyIntelligence,
  execute: withEnrichmentLogging(
    originalCompanyIntelligence.execute,
    'exa',
    'company-intelligence'
  )
}

export const competitiveIntelligence = {
  ...originalCompetitiveIntelligence,
  execute: withEnrichmentLogging(
    originalCompetitiveIntelligence.execute,
    'perplexity',
    'competitive-intelligence'
  )
}

export const intentAnalysis = {
  ...originalIntentAnalysis,
  execute: withEnrichmentLogging(
    originalIntentAnalysis.execute,
    'openai',
    'intent-analysis'
  )
}

export const websiteAnalysis = {
  ...originalWebsiteAnalysis,
  execute: withEnrichmentLogging(
    originalWebsiteAnalysis.execute,
    'firecrawl',
    'website-analysis'
  )
}