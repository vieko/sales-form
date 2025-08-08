import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
  decimal,
  varchar
} from 'drizzle-orm/pg-core'
import { enrichmentStatusEnum } from '@/db/enums'

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    domain: varchar('domain', { length: 255 }).notNull().unique(),
    name: text('name').notNull(),

    industry: varchar('industry', { length: 100 }),
    employeeCount: integer('employee_count'),
    revenue: decimal('revenue', { precision: 15, scale: 2 }),
    location: text('location'),

    enrichmentStatus: enrichmentStatusEnum('enrichment_status')
      .notNull()
      .default('pending'),
    lastEnrichedAt: timestamp('last_enriched_at'),
    enrichmentVersion: integer('enrichment_version').default(1),

    enrichedData: jsonb('enriched_data').$type<{
      funding?: {
        totalRaised?: number
        lastRound?: string
        investors?: string[]
      }
      techStack?: string[]
      competitors?: string[]
      newsSignals?: Array<{
        title: string
        url: string
        date: string
        sentiment: 'positive' | 'neutral' | 'negative'
      }>
      website?: {
        pages: Array<{
          url: string
          content: string
          analysis: string
        }>
        pricing?: {
          hasPublicPricing: boolean
          pricePoints?: number[]
          model: 'freemium' | 'subscription' | 'one-time' | 'enterprise'
        }
      }
      socialPresence?: {
        linkedin?: string
        twitter?: string
        crunchbase?: string
      }
    }>(),

    dataCachedUntil: timestamp('data_cached_until'),
    enrichmentCost: decimal('enrichment_cost', { precision: 10, scale: 4 }),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    domainIdx: index('companies_domain_idx').on(table.domain),
    industryIdx: index('companies_industry_idx').on(table.industry),
    enrichmentStatusIdx: index('companies_enrichment_status_idx').on(
      table.enrichmentStatus,
    ),
  }),
)

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
