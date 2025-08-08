import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),

  contactName: text('contact_name').notNull(),
  companyEmail: text('company_email').notNull(),
  contactPhone: text('contact_phone'),
  companyWebsite: text('company_website').notNull(),
  country: text('country').notNull(),
  companySize: text('company_size').notNull(),
  productInterest: text('product_interest').notNull(),
  howCanWeHelp: text('how_can_we_help').notNull(),
  privacyPolicy: boolean('privacy_policy').default(false),
  mockBehavioralData: boolean('mock_behavioral_data').default(false),

  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
