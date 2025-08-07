import { tool } from 'ai'
import { z } from 'zod'

const DESCRIPTION = `
- Searches and fetches content from Wikipedia
- Takes a search query and optional language code as input
- Returns Wikipedia article summaries and content
- Use this tool when you need to retrieve encyclopedic information

Usage notes:
  - The query should be a search term or topic you want to learn about
  - Language defaults to English ('en') but can be changed
  - Returns article title, summary, and full content
  - Results are automatically formatted for readability`

export const wikipediaSearch = tool({
  name: 'wikipediaSearch',
  description: DESCRIPTION,
  inputSchema: z.object({
    query: z.string().describe('The search query or topic to look up on Wikipedia'),
    language: z
      .string()
      .describe('Language code (e.g., "en", "es", "fr") - defaults to "en"')
      .default('en'),
    limit: z
      .number()
      .describe('Maximum number of results to return (1-10)')
      .min(1)
      .max(10)
      .default(3),
  }),
  execute: async ({ query, language, limit }) => {
    try {
      // Search for articles
      const searchUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'SalesForm/1.0 (https://github.com/vieko/sales-form)',
        },
      })

      if (!response.ok) {
        // If direct lookup fails, try search API
        const searchApiUrl = `https://${language}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${limit}`
        
        const searchResponse = await fetch(searchApiUrl, {
          headers: {
            'User-Agent': 'SalesForm/1.0 (https://github.com/vieko/sales-form)',
          },
        })

        if (!searchResponse.ok) {
          throw new Error(`Wikipedia search failed: ${searchResponse.statusText}`)
        }

        const searchData = await searchResponse.json()
        const results = []

        for (const page of searchData.query?.search?.slice(0, limit) || []) {
          try {
            const pageUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`
            const pageResponse = await fetch(pageUrl, {
              headers: {
                'User-Agent': 'SalesForm/1.0 (https://github.com/vieko/sales-form)',
              },
            })

            if (pageResponse.ok) {
              const pageData = await pageResponse.json()
              results.push({
                title: pageData.title,
                url: pageData.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                summary: pageData.extract || page.snippet?.replace(/<[^>]*>/g, '') || 'No summary available',
                thumbnail: pageData.thumbnail?.source,
              })
            }
          } catch (error) {
            console.error(`Error fetching page ${page.title}:`, error)
          }
        }

        return results
      }

      const data = await response.json()
      return [{
        title: data.title,
        url: data.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        summary: data.extract || 'No summary available',
        thumbnail: data.thumbnail?.source,
      }]
    } catch (error) {
      console.error('Wikipedia search error:', error)
      return [{
        title: 'Error',
        url: '',
        summary: `Failed to search Wikipedia: ${error instanceof Error ? error.message : 'Unknown error'}`,
        thumbnail: null,
      }]
    }
  },
})
