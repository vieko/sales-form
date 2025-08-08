import FirecrawlApp from '@mendable/firecrawl-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY environment variable is required')
}

export const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
})
