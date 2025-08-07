import { tool } from 'ai'
import { z } from 'zod'
import { exa } from '@/lib/exa'

export const webScraper = tool({
  description: 'Scrape a website for information',
  inputSchema: z.object({
    websiteUrl: z.string().describe('The URL for the website to scrape'),
  }),
  execute: async ({ websiteUrl }) => {
    const { results } = await exa.searchAndContents(websiteUrl, {
      type: 'keyword',
      numResults: 1,
      livecrawl: 'always',
    })
    return results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.text.slice(0, 1000),
      publishedDate: result.publishedDate,
    }))
  },
})
