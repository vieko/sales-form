import { perplexity } from '@ai-sdk/perplexity'
import { generateText, tool } from 'ai'
import { z } from 'zod'

const DESCRIPTION = `
- Performs competitive intelligence research using Perplexity Sonar
- Searches for competitive landscape, market positioning, and differentiation
- Returns competitive analysis including market position and competitor insights
- Use this tool to understand how the lead's company fits in the competitive landscape

Usage notes:
  - Provide company name and industry context
  - Searches for recent competitive intelligence data (last month)
  - Returns structured competitive analysis`

export const competitiveIntelligence = tool({
  name: 'competitiveIntelligence',
  description: DESCRIPTION,
  inputSchema: z.object({
    company: z.string().describe('Company name to research'),
    industry: z.string().describe('Industry or sector context'),
    focus: z
      .enum(['competitors', 'market-position', 'differentiation'])
      .describe('Focus area for competitive research')
      .default('competitors'),
  }),
  execute: async ({ company, industry, focus }) => {
    try {
      const searchQuery = `${company} ${industry} competitive landscape market position competitors analysis`

      const prompt =
        focus === 'competitors'
          ? `Research and identify the main competitors of ${company} in the ${industry} industry. Provide a comprehensive competitive analysis including direct and indirect competitors, their market positioning, and key differentiators.`
          : focus === 'market-position'
            ? `Analyze the market position of ${company} in the ${industry} industry. Include market share insights, competitive advantages, and positioning relative to key players.`
            : `Identify the key differentiators and unique value propositions of ${company} compared to competitors in the ${industry} space. Focus on what sets them apart.`

      const result = await generateText({
        model: perplexity('sonar-pro'),
        prompt: `${prompt}\n\nSearch Query: ${searchQuery}`,
        temperature: 0.3,
      })

      return {
        company,
        industry,
        focus,
        analysis: result.text,
        searchQuery,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Perplexity competitive intelligence failed:', error)
      return {
        error: 'Failed to fetch competitive intelligence',
        details: error,
      }
    }
  },
})
