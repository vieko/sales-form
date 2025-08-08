import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
  decimal,
  varchar,
} from 'drizzle-orm/pg-core'
import { leads } from './leads'
import { companies } from './companies'

export const enrichmentLogs = pgTable(
  'enrichment_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    leadId: uuid('lead_id').references(() => leads.id),
    companyId: uuid('company_id').references(() => companies.id),

    // exa, firecrawl, openai, perplexity
    provider: varchar('provider', { length: 50 }).notNull(),

    // search, crawl, analyze, etc.
    operation: varchar('operation', { length: 100 }).notNull(),

    requestData: jsonb('request_data'),
    responseData: jsonb('response_data'),

    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
    duration: integer('duration'), // ms

    tokensUsed: integer('tokens_used'),
    cost: decimal('cost', { precision: 10, scale: 6 }),
    currency: varchar('currency', { length: 3 }).default('USD'),

    // pending, success, failed, timeout
    status: varchar('status', { length: 20 }).notNull(),

    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index('enrichment_logs_lead_id_idx').on(table.leadId),
    companyIdIdx: index('enrichment_logs_company_id_idx').on(table.companyId),
    providerIdx: index('enrichment_logs_provider_idx').on(table.provider),
    statusIdx: index('enrichment_logs_status_idx').on(table.status),
    createdAtIdx: index('enrichment_logs_created_at_idx').on(table.createdAt),
  }),
)

export type EnrichmentLog = typeof enrichmentLogs.$inferSelect
export type NewEnrichmentLog = typeof enrichmentLogs.$inferInsert
