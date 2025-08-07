import { tool } from 'ai'
import { z } from 'zod'
import { exa } from '@/lib/exa'

const DESCRIPTION = `
- Fetches content from a specified URL
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to markdown
- Returns the model's response about the content
- Use this tool when you need to retrieve and analyze web content

Usage notes:
  - The URL must be a fully-formed valid URL
  - HTTP URLs will be automatically upgraded to HTTPS
  - The prompt should describe what information you want to extract from the page
  - Results may be summarized if the content is very large`

export const webFetch = tool({
  name: 'webfetch',
  description: DESCRIPTION,
  inputSchema: z.object({
    url: z.string().describe('The URL to fetch content from'),
    format: z
      .enum(['text', 'markdown', 'html'])
      .describe('The format to return the content in (text, markdown, html)'),
    timeout: z
      .number()
      .describe('Optional timeout in seconds (max 120)')
      .optional(),
  }),
  execute: async ({ url }) => {
    const { results } = await exa.searchAndContents(url, {
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
