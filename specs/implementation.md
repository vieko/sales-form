Build an AI-powered lead enrichment and scoring system for the existing Next.js
15 sales contact form.

## Project Overview

Create a production-ready lead enrichment system that automatically enriches,
scores, and classifies leads using AI agents and modern web tools. The contact
form and project setup are already complete.

## Tech Stack

- Next.js 15 with App Router
- Server Components and Server Actions
- AI SDK 5 (Vercel AI SDK)
- Neon Database with Drizzle ORM
- Zod
- TypeScript
- Shadcn
- Tailwind CSS
- Reack Hook Form

## Core Features

### 1. Database Schema (Drizzle + Neon)

Create these tables:

- `leads` table with fields for form inputs, enrichment status, scoring data,
  and classification (SQL/MQL/UNQUALIFIED)
- `enrichment_logs` table to track API calls, costs, and performance
- `lead_activities` table for tracking engagement
- Use JSONB columns for flexible enriched data storage
- Add proper indexes for email, status, classification, and score

### 2. AI-Powered Enrichment System

Build an enrichment agent using AI SDK 5 that:

**Uses these tools:**

- Exa API for company intelligence gathering (funding, growth, news)
- Firecrawl for website analysis (tech stack, pricing, customers)
- OpenAI GPT-4 for intent analysis and data synthesis
- Perplexity Sonar for competitive intelligence

**Performs these analyses:**

- Company intelligence (size, funding, growth indicators)
- Web presence analysis (maturity, target market, pricing tier)
- Intent signal extraction from "how can we help" field
- Tech stack detection
- Competitive landscape assessment

### 3. Lead Scoring & Classification

Implement a scoring system that:

**Calculates scores (0-100) for:**

- Firmographic fit (35% weight) - company size, revenue, industry, geography
- Behavioral signals (25% weight) - engagement, pages viewed, content downloaded
- Intent signals (25% weight) - urgency, budget mentions, buying stage
- Technographic fit (15% weight) - compatible tech stack

**Classifies leads as:**

- SQL (Sales Qualified): Score 70+, high intent, meets BANT criteria
- MQL (Marketing Qualified): Score 40-69, good fit but needs nurturing
- UNQUALIFIED: Score <40 or poor fit

**Routes based on classification:**

- SQL → Immediate sales notification + fast-track CRM workflow
- MQL → Marketing nurture sequence
- UNQUALIFIED → Newsletter + long-term education

### 4. Background Processing

- Use Inngest to process enrichment queue
- Implement retry logic for failed enrichments
- Add rate limiting and cost tracking
- Cache enrichment results intelligently (TTL based on data type)

## Implementation Steps

### Phase 1: Database & Schema

1. Create database schema with Drizzle ORM
2. Set up migrations for leads, enrichment_logs, and lead_activities tables
3. Add JSONB columns for flexible data storage
4. Create indexes for query optimization
5. Build data access layer with type-safe queries

### Phase 2: AI Enrichment Agent

1. Set up AI SDK 5 with tool definitions
2. Integrate Exa API for company intelligence
3. Integrate Firecrawl for website analysis
4. Set up OpenAI GPT-4 for intent analysis
5. Add Perplexity Sonar for competitive intelligence
6. Implement structured data extraction from all sources
7. Add comprehensive error handling for each tool

### Phase 3: Scoring Algorithm

1. Implement weighted scoring system
2. Build firmographic scoring (company size, revenue, industry)
3. Create behavioral scoring from engagement data
4. Extract and score intent signals from text
5. Assess technographic fit
6. Implement SQL/MQL/UNQUALIFIED classification logic
7. Create routing rules based on classification

### Phase 4: Background Processing

1. Set up Inngest for queue processing
2. Build job queue system for enrichment tasks
3. Implement retry logic with exponential backoff
4. Add rate limiting per API provider
5. Track costs per enrichment
6. Build intelligent caching layer with TTL

## Key Code Patterns to Follow

1. **Store lead immediately, enrich asynchronously** - Never block the user
2. **Log every API call** - Track costs and performance meticulously
3. **Use structured outputs** - Always use response_format: json_object with
   GPT-4
4. **Implement circuit breakers** - Fail fast when APIs are down
5. **Cache aggressively** - Company data rarely changes daily
6. **Handle failures gracefully** - Always have fallback enrichment strategies
7. **Stream progress updates** - Keep users informed during long operations

## API Integration Details

### Exa Integration

- Use neural search for finding recent company signals
- Search for: funding announcements, leadership changes, growth metrics
- Limit to 5 results per query to control costs
- Cache results for 7 days

### Firecrawl Integration

- Crawl up to 10 pages per website
- Focus on: /about, /pricing, /customers, /case-studies
- Extract only main content to reduce token usage
- Cache results for 30 days

### OpenAI Integration

- Use GPT-4-turbo for complex analysis
- Set temperature to 0.2 for consistency
- Always request JSON output format
- Implement token counting for cost tracking

### Perplexity Integration

- Use Sonar Pro model for real-time data
- Enable web search for competitive intelligence
- Set search_recency to "month" for recent data
- Cache results for 3 days

Please build this system incrementally, starting with the database schema, then
adding the AI enrichment agent, followed by the scoring system, and finally the
background processing and real-time features. Prioritize reliability and cost
efficiency throughout the implementation.
