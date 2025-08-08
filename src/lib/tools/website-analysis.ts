import { firecrawl } from '@/lib/firecrawl'
import type { CrawlParams } from '@mendable/firecrawl-js'
import { tool } from 'ai'
import { z } from 'zod'

const DESCRIPTION = `
- Analyzes company website using Firecrawl API
- Crawls key pages: /about, /pricing, /customers, /case-studies
- Extracts tech stack, pricing model, target market, and maturity signals
- Returns structured website analysis for lead scoring

Usage notes:
  - Provide full website URL (e.g., "https://stripe.com")
  - Crawls up to 10 pages per website to control costs
  - Focuses on main content, removes navigation/footer noise`

export const websiteAnalysis = tool({
  name: 'websiteAnalysis',
  description: DESCRIPTION,
  inputSchema: z.object({
    urlToCrawl: z
      .url()
      .min(1)
      .max(100)
      .describe('The URL to crawl (including http:// or https://)'),
    maxPages: z
      .number()
      .min(1)
      .max(10)
      .describe('Maximum pages to crawl')
      .default(5),
  }),
  execute: async ({ urlToCrawl, maxPages }) => {
    try {
      const crawlParams: CrawlParams = {
        includePaths: [
          'about',
          'pricing',
          'customers',
          'case-studies',
          'solutions',
        ],
        excludePaths: ['blog', 'news', 'careers'],
        limit: maxPages,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }
      const result = await firecrawl.crawlUrl(urlToCrawl, crawlParams)
      return result
    } catch (error) {
      console.error('Firecrawl website analysis failed:', error)
      return { error: 'Failed to analyze website', details: error }
    }
  },
})
