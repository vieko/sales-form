## Modern Contact Sales Form

An intelligent lead enrichment and scoring system built with Next.js 15 that
automatically enriches, scores, and classifies sales leads using AI agents and
modern web tools.

[Planning Board](https://www.figma.com/board/ilLYIgWHEmz0u8Kx2civhI/modern-sales-form-using-ai-sdk?node-id=3-385&t=rrguyBs8zI7p7cao-1)

## Features

- **Smart Lead Capture**: Responsive contact form with real-time validation
- **AI-Powered Enrichment**: Automatic lead enrichment using multiple data
  sources
- **Intelligent Scoring**: ML-based lead scoring with weighted criteria
- **Lead Classification**: Automatic SQL/MQL/UNQUALIFIED routing
- **Real-time Updates**: Live progress tracking during enrichment
- **Cost Optimization**: Smart caching and rate limiting
- **Analytics Dashboard**: Performance monitoring and insights

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **AI**: Vercel AI SDK 5 with OpenAI & Perplexity providers
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Queue**: Inngest for background job processing
- **Data Sources**: Exa API, Firecrawl, Perplexity Sonar

## Architecture

### Lead Enrichment Pipeline

`Contact Form` → `Immediate Storage` → `Background Enrichment` → `Scoring` →
`Classification` → `Routing`

### Data Sources

- **Exa API**: Company intelligence (funding, growth, news)
- **Firecrawl**: Website analysis (tech stack, pricing, customers)
- **OpenAI GPT-4**: Intent analysis and data synthesis
- **Perplexity Sonar**: Competitive intelligence

### Scoring System

Weighted scoring algorithm (0-100 points):

- **Firmographic Fit** (35%): Company size, revenue, industry, geography
- **Behavioral Signals** (25%): Engagement, pages viewed, content downloaded
- **Intent Signals** (25%): Urgency, budget mentions, buying stage
- **Technographic Fit** (15%): Compatible tech stack

### Lead Classification

- **SQL** (Score 70+): High intent, meets BANT criteria → Immediate sales
  notification
- **MQL** (Score 40-69): Good fit, needs nurturing → Marketing sequence
- **UNQUALIFIED** (Score <40): Poor fit → Newsletter + education

### Resources

- [HubSpot's Lead Scoring Guide (2025)](https://blog.hubspot.com/marketing/lead-scoring-instructions)

- [Gartner's B2B Lead Scoring Using Buyer Intent Signals](https://www.gartner.com/en/digital-markets/insights/lead-scoring-intent-signals)

- [Salesforce Ben's Advanced Lead Scoring Framework Guide (2024-2025)](https://www.salesforceben.com/advance-your-salesforce-lead-scoring-framework-in-2024/)

- [Build An Agent in 10 mins with AI SDK 5 with Nico Albanese from Vercel, AI Demo Days](https://www.youtube.com/watch?v=TjAbtsPC-Sw)
