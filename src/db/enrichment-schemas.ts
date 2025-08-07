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
  varchar
} from 'drizzle-orm/pg-core'

// Companies table - separate from leads to avoid duplicate enrichment
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Core company identifiers
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  name: text('name').notNull(),
  
  // High-query fields as native columns (Oracle recommendation)
  industry: varchar('industry', { length: 100 }),
  employeeCount: integer('employee_count'),
  revenue: decimal('revenue', { precision: 15, scale: 2 }),
  location: text('location'),
  
  // Enrichment status and metadata
  enrichmentStatus: varchar('enrichment_status', { length: 20 })
    .notNull()
    .default('pending'), // pending, enriching, completed, failed
  lastEnrichedAt: timestamp('last_enriched_at'),
  enrichmentVersion: integer('enrichment_version').default(1),
  
  // Flexible enriched data storage (JSONB for complex data)
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
  
  // Cache TTL and cost tracking
  dataCachedUntil: timestamp('data_cached_until'),
  enrichmentCost: decimal('enrichment_cost', { precision: 10, scale: 4 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  domainIdx: index('companies_domain_idx').on(table.domain),
  industryIdx: index('companies_industry_idx').on(table.industry),
  enrichmentStatusIdx: index('companies_enrichment_status_idx').on(table.enrichmentStatus),
}))

// Enhanced leads table
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Link to company
  companyId: uuid('company_id').references(() => companies.id),
  
  // Original form fields
  contactName: text('contact_name').notNull(),
  companyEmail: text('company_email').notNull(),
  contactPhone: text('contact_phone'),
  companyWebsite: text('company_website').notNull(),
  country: text('country').notNull(),
  companySize: text('company_size').notNull(),
  productInterest: text('product_interest').notNull(),
  howCanWeHelp: text('how_can_we_help').notNull(),
  privacyPolicy: boolean('privacy_policy').default(false),
  
  // Behavioral data (mock switch from tweaks.md)
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
  
  // Lead scoring and classification - native columns for performance
  leadScore: integer('lead_score'), // 0-100
  firmographicScore: integer('firmographic_score'), // 35% weight
  behavioralScore: integer('behavioral_score'), // 25% weight
  intentScore: integer('intent_score'), // 25% weight
  technographicScore: integer('technographic_score'), // 15% weight
  
  classification: varchar('classification', { length: 20 }), // SQL, MQL, UNQUALIFIED
  classificationConfidence: decimal('classification_confidence', { precision: 5, scale: 2 }),
  
  // Intent analysis from "how can we help" field
  intentAnalysis: jsonb('intent_analysis').$type<{
    urgency: 'low' | 'medium' | 'high'
    budgetMentioned: boolean
    buyingStage: 'awareness' | 'consideration' | 'decision'
    painPoints: string[]
    timeline: string
    decisionMakers: boolean
  }>(),
  
  // Processing status and routing
  enrichmentStatus: varchar('enrichment_status', { length: 20 })
    .notNull()
    .default('pending'), // pending, enriching, completed, failed
  routingStatus: varchar('routing_status', { length: 20 })
    .notNull()
    .default('pending'), // pending, routed, notified
  
  // Metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  enrichedAt: timestamp('enriched_at'),
}, (table) => ({
  companyIdIdx: index('leads_company_id_idx').on(table.companyId),
  emailIdx: index('leads_email_idx').on(table.companyEmail),
  scoreIdx: index('leads_score_idx').on(table.leadScore),
  classificationIdx: index('leads_classification_idx').on(table.classification),
  enrichmentStatusIdx: index('leads_enrichment_status_idx').on(table.enrichmentStatus),
  routingStatusIdx: index('leads_routing_status_idx').on(table.routingStatus),
  createdAtIdx: index('leads_created_at_idx').on(table.createdAt),
}))

// Enrichment logs for tracking API calls, costs, and performance
export const enrichmentLogs = pgTable('enrichment_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Links
  leadId: uuid('lead_id').references(() => leads.id),
  companyId: uuid('company_id').references(() => companies.id),
  
  // API call details
  provider: varchar('provider', { length: 50 }).notNull(), // exa, firecrawl, openai, perplexity
  operation: varchar('operation', { length: 100 }).notNull(), // search, crawl, analyze, etc.
  
  // Request/response tracking
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  
  // Performance metrics
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  
  // Cost and usage tracking
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Status and error handling
  status: varchar('status', { length: 20 }).notNull(), // pending, success, failed, timeout
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  leadIdIdx: index('enrichment_logs_lead_id_idx').on(table.leadId),
  companyIdIdx: index('enrichment_logs_company_id_idx').on(table.companyId),
  providerIdx: index('enrichment_logs_provider_idx').on(table.provider),
  statusIdx: index('enrichment_logs_status_idx').on(table.status),
  createdAtIdx: index('enrichment_logs_created_at_idx').on(table.createdAt),
}))

// Lead activities for tracking engagement (future expansion)
export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  leadId: uuid('lead_id').references(() => leads.id).notNull(),
  
  // Activity details
  activityType: varchar('activity_type', { length: 50 }).notNull(), // email_open, page_view, download, etc.
  description: text('description'),
  metadata: jsonb('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  leadIdIdx: index('lead_activities_lead_id_idx').on(table.leadId),
  activityTypeIdx: index('lead_activities_type_idx').on(table.activityType),
  createdAtIdx: index('lead_activities_created_at_idx').on(table.createdAt),
}))

// Type exports
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type EnrichmentLog = typeof enrichmentLogs.$inferSelect
export type NewEnrichmentLog = typeof enrichmentLogs.$inferInsert
export type LeadActivity = typeof leadActivities.$inferSelect
export type NewLeadActivity = typeof leadActivities.$inferInsert
