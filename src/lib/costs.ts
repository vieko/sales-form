/**
 * Cost Constants for AI Provider Usage Tracking
 * 
 * This file centralizes all cost calculations for easy maintenance and updates.
 * Update these constants when provider pricing changes.
 */

// OpenAI Pricing (per token)
// Updated: 2025-08-11
// Source: https://openai.com/api/pricing/
export const OPENAI_COSTS = {
  // GPT-4o pricing
  'gpt-4o': {
    input: 0.000005,   // $5.00 / 1M input tokens
    output: 0.000015,  // $15.00 / 1M output tokens
    average: 0.000010, // Rough average for mixed usage
  },
  // GPT-4o-mini pricing
  'gpt-4o-mini': {
    input: 0.00000015, // $0.15 / 1M input tokens
    output: 0.0000006, // $0.60 / 1M output tokens
    average: 0.000000375, // Rough average for mixed usage
  },
  // Default fallback (use GPT-4o average)
  default: 0.000010,
} as const

// Perplexity Pricing (per token)
// Updated: 2025-08-11
// Source: https://docs.perplexity.ai/docs/pricing
export const PERPLEXITY_COSTS = {
  'sonar-pro': {
    input: 0.000001,   // $1.00 / 1M tokens (estimate)
    output: 0.000001,  // $1.00 / 1M tokens (estimate)
    average: 0.000001,
  },
  'sonar': {
    input: 0.0000005,  // $0.50 / 1M tokens (estimate)
    output: 0.0000005, // $0.50 / 1M tokens (estimate)  
    average: 0.0000005,
  },
  // Default fallback
  default: 0.000001,
} as const

// External API Pricing (per operation)
// Updated: 2025-08-11
export const EXTERNAL_API_COSTS = {
  // Exa API pricing
  exa: {
    search: 0.001,           // $0.001 per search (estimate)
    searchWithContent: 0.002, // $0.002 per search with content (estimate)
    default: 0.001,
  },
  
  // Firecrawl pricing  
  firecrawl: {
    perPage: 0.02,           // $0.02 per page crawled (estimate)
    perCredit: 0.01,         // $0.01 per credit (if using credit system)
    default: 0.02,
  },
  
  // Add other external APIs here as needed
} as const

// Cost calculation helper functions
export const CostCalculators = {
  /**
   * Calculate OpenAI cost based on model and token usage
   */
  openai: (tokens: number, model = 'gpt-4o'): number => {
    const modelKey = model in OPENAI_COSTS ? model as keyof typeof OPENAI_COSTS : 'default'
    const rate = typeof OPENAI_COSTS[modelKey] === 'object' 
      ? OPENAI_COSTS[modelKey].average 
      : OPENAI_COSTS.default
    return tokens * rate
  },

  /**
   * Calculate Perplexity cost based on model and token usage
   */
  perplexity: (tokens: number, model = 'sonar-pro'): number => {
    const modelKey = model in PERPLEXITY_COSTS ? model as keyof typeof PERPLEXITY_COSTS : 'default'
    const rate = typeof PERPLEXITY_COSTS[modelKey] === 'object'
      ? PERPLEXITY_COSTS[modelKey].average
      : PERPLEXITY_COSTS.default
    return tokens * rate
  },

  /**
   * Calculate Exa API cost based on operation type
   */
  exa: (operationType = 'search'): number => {
    return EXTERNAL_API_COSTS.exa[operationType as keyof typeof EXTERNAL_API_COSTS.exa] || 
           EXTERNAL_API_COSTS.exa.default
  },

  /**
   * Calculate Firecrawl cost based on pages crawled
   */
  firecrawl: (pages: number): number => {
    return pages * EXTERNAL_API_COSTS.firecrawl.perPage
  },
}

// Provider identification helpers
export const PROVIDER_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
  perplexity: ['sonar-pro', 'sonar'],
} as const

/**
 * Determine provider from model name
 */
export function getProviderFromModel(model: string): 'openai' | 'perplexity' | 'unknown' {
  if (model.startsWith('openai/')) {
    return 'openai'
  }
  if (model.startsWith('perplexity/')) {
    return 'perplexity'
  }
  if (PROVIDER_MODELS.openai.some(m => model.includes(m))) {
    return 'openai'
  }
  if (PROVIDER_MODELS.perplexity.some(m => model.includes(m))) {
    return 'perplexity'
  }
  return 'unknown'
}

/**
 * Extract model name from full model string (e.g., 'openai/gpt-4o' -> 'gpt-4o')
 */
export function extractModelName(model: string): string {
  return model.includes('/') ? model.split('/').pop() || model : model
}

// Cost tracking metadata
export const COST_METADATA = {
  lastUpdated: '2025-08-11',
  sources: {
    openai: 'https://openai.com/api/pricing/',
    perplexity: 'https://docs.perplexity.ai/docs/pricing',
    exa: 'Estimated based on typical API pricing',
    firecrawl: 'Estimated based on typical scraping service pricing',
  },
  notes: [
    'Costs are estimates and may vary based on actual usage patterns',
    'Token costs assume average input/output ratio for mixed usage',
    'External API costs are estimates - check provider documentation for exact pricing',
    'Update these constants when provider pricing changes',
  ],
} as const