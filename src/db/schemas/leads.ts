import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
  decimal,
  varchar,
} from 'drizzle-orm/pg-core'
import { enrichmentStatusEnum, routingStatusEnum } from '@/db/enums'
import { companies } from './companies'

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    companyId: uuid('company_id').references(() => companies.id),

    contactName: text('contact_name').notNull(),
    companyEmail: text('company_email').notNull(),
    contactPhone: text('contact_phone'),
    companyWebsite: text('company_website').notNull(),
    country: text('country').notNull(),
    companySize: text('company_size').notNull(),
    productInterest: text('product_interest').notNull(),
    howCanWeHelp: text('how_can_we_help').notNull(),
    privacyPolicy: boolean('privacy_policy').default(false),

    // TODO: replace with real-time behavioral data
    mockBehavioralData: boolean('mock_behavioral_data').default(false),
    behavioralData: jsonb('behavioral_data').$type<{
      pageViews?: number
      timeOnSite?: number
      downloadedResources?: string[]
      emailEngagement?: {
        opened: number
        clicked: number
      }
      previousVisits?: number
    }>(),

    leadScore: integer('lead_score'), // 0-100
    firmographicScore: integer('firmographic_score'), // 35% weight
    behavioralScore: integer('behavioral_score'), // 25% weight
    intentScore: integer('intent_score'), // 25% weight
    technographicScore: integer('technographic_score'), // 15% weight

    classification: varchar('classification', { length: 20 }), // SQL, MQL, UNQUALIFIED
    classificationConfidence: decimal('classification_confidence', {
      precision: 5,
      scale: 2,
    }),

    intentAnalysis: jsonb('intent_analysis').$type<{
      urgency: 'low' | 'medium' | 'high'
      budgetMentioned: boolean
      buyingStage: 'awareness' | 'consideration' | 'decision'
      painPoints: string[]
      timeline: string
      decisionMakers: boolean
    }>(),

    enrichmentStatus: enrichmentStatusEnum('enrichment_status')
      .notNull()
      .default('pending'),
    routingStatus: routingStatusEnum('routing_status')
      .notNull()
      .default('pending'),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    enrichedAt: timestamp('enriched_at'),
  },
  (table) => ({
    companyIdIdx: index('leads_company_id_idx').on(table.companyId),
    emailIdx: index('leads_email_idx').on(table.companyEmail),
    scoreIdx: index('leads_score_idx').on(table.leadScore),
    classificationIdx: index('leads_classification_idx').on(
      table.classification,
    ),
    enrichmentStatusIdx: index('leads_enrichment_status_idx').on(
      table.enrichmentStatus,
    ),
    routingStatusIdx: index('leads_routing_status_idx').on(table.routingStatus),
    createdAtIdx: index('leads_created_at_idx').on(table.createdAt),
  }),
)

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
