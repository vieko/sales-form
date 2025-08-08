import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { enrichLead, routeLead } from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [enrichLead, routeLead],
})
