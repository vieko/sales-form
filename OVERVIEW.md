# Intelligent Lead Enrichment \+ Scoring MVP

## Modern contact form prototype for Vercel

## Problem

Lead qualification is often slow, manual, and inconsistent. SDRs and AEs waste
valuable time researching low-quality leads instead of engaging prospects ready
to buy.

## Solution

A prototype contact sales form that automatically enriches, scores, and routes
leads using the **Vercel AI SDK** and modern web tooling \- giving SDRs and AEs
prioritized prospects to engage.

## Workflow

1. **Lead Capture** – Responsive, validated Next.js form
2. **AI Enrichment** – Background job augments lead data from integrated APIs
3. **Scoring** – Weighted model (Firmographic, Intent, Technographic)
4. **Classification** – SQL / MQL / Unqualified thresholds
5. **Routing** – Automatic assignment to sales or nurture workflows

## Data Sources

- **Vercel AI SDK 5** – Prompt orchestration and streaming responses
- **OpenAI GPT-4** – Intent analysis from free-text answers
- **Exa API** – Company intelligence (funding, growth, news, market position)
- **Firecrawl** – Website analysis (tech stack, pricing models, customer base)
- **Perplexity Sonar** – Competitive intelligence and market research

## Technical Stack

- **Frontend:** Next.js 15 (App Router) \+ TypeScript \+ Tailwind CSS v4 \+
  shadcn/ui
- **Backend:** Server Actions \+ Inngest (background jobs)
- **Database:** Neon PostgreSQL \+ Drizzle ORM
- **AI:** Vercel AI SDK \+ OpenAI \+ Exa API \+ Firecrawl \+ Perplexity Sonar

## Business Impact

- **Prioritize the right leads** – Surface SQLs with the highest close
- **Respond faster** – Real-time enrichment enables near-instant outreach
- **Spend more time selling** – Cut research time considerably
- **Improve win rates** – Higher conversion from first touch through better
  targeting

## Live Demo

1. Submit lead and see real-time enrichment in action
2. View scoring breakdown and classification outcome

