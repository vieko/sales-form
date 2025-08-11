# Enrichment Logs Implementation Specification

## Overview

Implementation plan for AI tool usage tracking and cost optimization system in the lead enrichment pipeline. This feature provides observability, cost control, and performance monitoring for all AI provider calls (OpenAI, Perplexity, Exa, Firecrawl).

## Database Schema

The `enrichment_logs` table (already exists) tracks:
- **Cost tracking**: `tokensUsed`, `cost`, `currency`
- **Performance**: `startedAt`, `completedAt`, `duration`
- **Observability**: `provider`, `operation`, `requestData`, `responseData`
- **Reliability**: `status`, `errorMessage`, `retryCount`
- **Association**: Links to `leadId` and `companyId`

## Implementation Plan (Next.js 15 App Router)

### Phase 1: Core Logging Infrastructure

#### 1.1 Enrichment Logger Service
**File**: `src/lib/enrichment-logger.ts`

```typescript
// Server-side logging service
export async function startEnrichmentLog(params: {
  leadId?: string
  companyId?: string
  provider: 'openai' | 'perplexity' | 'exa' | 'firecrawl'
  operation: string
  requestData: unknown
}): Promise<string> // Returns logId

export async function completeEnrichmentLog(params: {
  logId: string
  responseData: unknown
  tokensUsed?: number
  cost?: number
}): Promise<void>

export async function failEnrichmentLog(params: {
  logId: string
  errorMessage: string
  retryCount?: number
}): Promise<void>
```

#### 1.2 Tool Instrumentation
**Files**: `src/lib/tools/*.ts` (modify existing)

- Wrap each AI tool with logging decorators
- Use function composition pattern (not complex middleware)
- Capture timing, tokens, and costs transparently
- Handle errors without breaking enrichment flow

#### 1.3 Enrichment Engine Updates
**File**: `src/lib/enrichment/enrichment-engine.ts` (modify existing)

- Pass `leadId`/`companyId` to all tools
- Aggregate costs per enrichment session

### Phase 2: Analytics Dashboard (Server Components)

#### 2.1 Server Actions
**File**: `src/actions/enrichment-analytics.ts`

```typescript
'use server'

export async function getEnrichmentCosts(params: {
  leadId?: string
  dateRange?: { from: Date; to: Date }
  provider?: string
})

export async function getPerformanceMetrics()

export async function getUsageTrends()
```

#### 2.2 Analytics Page
**File**: `src/app/analytics/enrichment/page.tsx`

```typescript
// Server Component - zero client JS
export default async function EnrichmentAnalytics() {
  const costs = await getEnrichmentCosts()
  const performance = await getPerformanceMetrics()
  
  return (
    <div>
      <Suspense fallback={<MetricsSkeleton />}>
        <CostBreakdown data={costs} />
      </Suspense>
      <Suspense fallback={<ChartsSkeleton />}>
        <PerformanceCharts data={performance} />
      </Suspense>
    </div>
  )
}
```

#### 2.3 Analytics Components
**Files**: `src/components/analytics/`

- `CostBreakdown.tsx` - Cost by provider/operation
- `PerformanceCharts.tsx` - Success rates, timing
- `UsageTrends.tsx` - Token consumption over time
- `LeadCostDetails.tsx` - Per-lead cost breakdown

### Phase 3: Console Integration

#### 3.1 Real-time Cost Display
- Add cost information to console logs during enrichment
- Show cumulative costs per lead in the UI console
- Display provider performance metrics

#### 3.2 Cost Alerts
- Warning when daily/monthly limits approached
- Circuit breaker for failing providers
- Smart caching suggestions for optimization

## Technical Approach

### Next.js 15 Best Practices
- **Server Actions**: Direct database queries, no API routes
- **Server Components**: Zero client JS for analytics
- **Streaming**: Suspense for progressive loading
- **Type Safety**: Full TypeScript integration with Drizzle

### Performance Considerations
- **Async logging**: Don't slow enrichment pipeline
- **Database indexing**: Optimized queries for analytics
- **Caching**: Smart caching to reduce duplicate API calls

### Error Handling
- **Logging failures**: Don't break enrichment flow
- **Retry logic**: Automatic retry with exponential backoff
- **Circuit breakers**: Fail fast for problematic providers

## Success Metrics

1. **Cost Visibility**: Track spending per provider/lead
2. **Performance Monitoring**: Success rates and response times
3. **Usage Analytics**: Token consumption patterns
4. **Cost Optimization**: Identify expensive operations
5. **Production Readiness**: Full observability for AI tools

## File Structure

```
src/
├── lib/
│   ├── enrichment-logger.ts          # Core logging service
│   └── tools/                        # Instrumented AI tools
├── actions/
│   └── enrichment-analytics.ts       # Server actions for data
├── app/
│   └── analytics/
│       └── enrichment/
│           └── page.tsx              # Analytics dashboard
└── components/
    └── analytics/                    # Analytics components
```

## Implementation Priority

1. **Phase 1**: Core logging (essential for cost tracking)
2. **Phase 3**: Console integration (immediate user value)  
3. **Phase 2**: Analytics dashboard (long-term insights)

This approach leverages Next.js 15 App Router patterns while providing comprehensive AI tool observability and cost control.