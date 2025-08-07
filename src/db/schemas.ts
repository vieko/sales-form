import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const salesFormSubmissions = pgTable('sales_form_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Form fields matching ContactValues schema
  contactName: text('contact_name').notNull(),
  companyEmail: text('company_email').notNull(),
  contactPhone: text('contact_phone'),
  companyWebsite: text('company_website').notNull(),
  country: text('country').notNull(),
  companySize: text('company_size').notNull(),
  productInterest: text('product_interest').notNull(),
  howCanWeHelp: text('how_can_we_help').notNull(),
  privacyPolicy: boolean('privacy_policy').default(false),
  
  // Metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type SalesFormSubmission = typeof salesFormSubmissions.$inferSelect
export type NewSalesFormSubmission = typeof salesFormSubmissions.$inferInsert
