import { tool } from 'ai'
import { z } from 'zod'
import { exa } from '@/lib/exa'
import { CostCalculators } from '@/lib/costs'

const DESCRIPTION = `
- Searches for company intelligence and recent signals using Exa API
- Takes a company domain/name and searches for funding, growth, leadership news
- Returns recent company intelligence including funding rounds, growth metrics, news signals
- Use this tool to gather recent company intelligence for lead scoring

Usage notes:
  - Works best with company domain (e.g., "stripe.com") or official company name
  - Searches for funding announcements, leadership changes, growth metrics
  - Returns up to 5 recent results to control costs`

export const companyIntelligence = tool({
  name: 'companyIntelligence',
  description: DESCRIPTION,
  inputSchema: z.object({
    company: z.string().describe('Company domain or official name'),
    focus: z
      .enum(['funding', 'growth', 'leadership', 'general'])
      .describe('Type of intelligence to focus on')
      .default('general'),
  }),
  execute: async ({ company, focus }) => {
    try {
      const searchQueries = {
        funding: `${company} funding round investment raised venture capital`,
        growth: `${company} revenue growth hiring expansion customers`,
        leadership: `${company} CEO founder leadership team hiring executive`,
        general: `${company} company news recent developments business`,
      }

      const { results } = await exa.searchAndContents(searchQueries[focus], {
        type: 'neural',
        numResults: 5,
        startPublishedDate: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Last 90 days
        text: {
          maxCharacters: 1000,
          includeHtmlTags: false,
        },
      })

      const mappedResults = results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 800) || '',
        publishedDate: result.publishedDate,
        score: result.score,
        highlights: [],
      }))
      
      return {
        results: mappedResults,
        estimatedCost: CostCalculators.exa('search'),
        searchCount: 1,
        apiProvider: 'exa'
      }
    } catch (error) {
      console.error('Company intelligence search failed:', error)
      return { error: 'Failed to fetch company intelligence', details: error }
    }
  },
})
