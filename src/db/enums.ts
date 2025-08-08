import { pgEnum } from 'drizzle-orm/pg-core'

export const enrichmentStatusEnum = pgEnum('enrichment_status', [
  'pending',
  'enriching', 
  'completed',
  'failed'
])

export const routingStatusEnum = pgEnum('routing_status', [
  'pending',
  'routed',
  'notified'
])
