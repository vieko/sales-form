import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

export const logs = pgTable(
  'logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: varchar('session_id', { length: 100 }).notNull(),
    level: varchar('level', { length: 10 }).notNull(), // info, warn, error, success
    message: text('message').notNull(),
    data: jsonb('data'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index('logs_session_id_idx').on(table.sessionId),
    levelIdx: index('logs_level_idx').on(table.level),
    timestampIdx: index('logs_timestamp_idx').on(table.timestamp),
  }),
)

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert