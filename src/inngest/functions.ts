import { inngest } from './client'
import { db } from '@/db/drizzle'
import { submissions } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { leadEnrichmentAgent } from '@/lib/agents/lead-enrichment'
import { generateMockBehavioralData } from '@/lib/utils'

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    await step.sleep('wait-a-moment', '1s')
    return { message: `Hello, ${event.data.email}!` }
  },
)

export const enrichLead = inngest.createFunction(
  { id: 'enrich-lead', name: 'Enrich Lead Submission' },
  { event: 'lead/submitted' },
  async ({ event, step }) => {
    const { submissionId } = event.data

    // Step 1: Fetch submission data from database
    const submission = await step.run('fetch-submission', async () => {
      const [result] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, submissionId))
        .limit(1)

      if (!result) {
        throw new Error(`Submission not found: ${submissionId}`)
      }

      return result
    })

    // Step 2: Prepare enrichment data (add behavioral data if needed)
    const leadData = await step.run('prepare-lead-data', async () => {
      return {
        ...submission,
        contactPhone: submission.contactPhone || undefined,
        mockBehavioralData: submission.mockBehavioralData || undefined,
        behavioralData: submission.mockBehavioralData
          ? generateMockBehavioralData()
          : undefined,
      }
    })

    // Step 3: Return prepared lead data
    const enrichmentResult = await step.run(
      'return-prepared-data',
      async () => {
        return {
          success: true,
          submissionId,
          message: 'Lead data prepared and ready',
          data: leadData,
        }
      },
    )

    return enrichmentResult
  },
)
