import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
  varchar,
} from 'drizzle-orm/pg-core'
import { leads } from './leads'

export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    leadId: uuid('lead_id')
      .references(() => leads.id)
      .notNull(),

    // email_open, page_view, download, etc.
    activityType: varchar('activity_type', { length: 50 }).notNull(),

    description: text('description'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index('lead_activities_lead_id_idx').on(table.leadId),
    activityTypeIdx: index('lead_activities_type_idx').on(table.activityType),
    createdAtIdx: index('lead_activities_created_at_idx').on(table.createdAt),
  }),
)

export type LeadActivity = typeof leadActivities.$inferSelect
export type NewLeadActivity = typeof leadActivities.$inferInsert
