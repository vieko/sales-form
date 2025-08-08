import { inngest } from './client'
import { db } from '@/db/drizzle'
import { submissions, leads, companies } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { generateMockBehavioralData } from '@/lib/utils'
import type { EnrichmentInput } from '@/lib/schemas/enrichment'

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

    const enrichmentInput = await step.run(
      'prepare-enrichment-input',
      async () => {
        const input: EnrichmentInput = {
          contactName: submission.contactName,
          companyEmail: submission.companyEmail,
          companyWebsite: submission.companyWebsite,
          companySize: submission.companySize,
          productInterest: submission.productInterest,
          howCanWeHelp: submission.howCanWeHelp,
          country: submission.country,
          behavioralData: submission.mockBehavioralData
            ? generateMockBehavioralData()
            : undefined,
        }
        return input
      },
    )

    const enrichmentResult = await step.run('call-enrichment-api', async () => {
      console.log('=== CALL === /api/enrich endpoint...')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/enrich`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrichmentInput),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Enrichment API failed: ${response.status} ${errorText}`,
        )
      }

      const result = await response.json()
      console.log(
        `=== RESULT === enrichment completed: ${result.gatheringSteps} steps, ${result.toolCalls} tool calls`,
      )

      return result
    })

    const storageResult = await step.run(
      'store-enrichment-results',
      async () => {
        const enrichmentData = enrichmentResult.data
        const domain = new URL(submission.companyWebsite).hostname.replace(
          'www.',
          '',
        )

        try {
          const [company] = await db
            .insert(companies)
            .values({
              domain,
              name: enrichmentData.company.name,
              industry: enrichmentData.company.industry,
              employeeCount: enrichmentData.company.employeeCount,
              revenue: enrichmentData.company.revenue?.toString(),
              location: enrichmentData.company.location,
              enrichedData: enrichmentData.company.enrichedData,
              enrichmentStatus: 'completed',
              lastEnrichedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: companies.domain,
              set: {
                name: enrichmentData.company.name,
                industry: enrichmentData.company.industry,
                employeeCount: enrichmentData.company.employeeCount,
                revenue: enrichmentData.company.revenue?.toString(),
                location: enrichmentData.company.location,
                enrichedData: enrichmentData.company.enrichedData,
                enrichmentStatus: 'completed',
                lastEnrichedAt: new Date(),
                updatedAt: new Date(),
              },
            })
            .returning()

          const [lead] = await db
            .insert(leads)
            .values({
              companyId: company.id,
              contactName: submission.contactName,
              companyEmail: submission.companyEmail,
              contactPhone: submission.contactPhone,
              companyWebsite: submission.companyWebsite,
              country: submission.country,
              companySize: submission.companySize,
              productInterest: submission.productInterest,
              howCanWeHelp: submission.howCanWeHelp,
              privacyPolicy: submission.privacyPolicy,
              behavioralData: enrichmentInput.behavioralData,
              leadScore: enrichmentData.scoring.overallScore,
              firmographicScore: enrichmentData.scoring.firmographicScore,
              behavioralScore: enrichmentData.scoring.behavioralScore,
              intentScore: enrichmentData.scoring.intentScore,
              technographicScore: enrichmentData.scoring.technographicScore,
              classification: enrichmentData.scoring.classification,
              classificationConfidence:
                enrichmentData.scoring.classificationConfidence,
              intentAnalysis: enrichmentData.intentAnalysis,
              enrichmentStatus: 'completed',
              enrichedAt: new Date(),
            })
            .returning()

          return {
            success: true,
            companyId: company.id,
            leadId: lead.id,
            classification: enrichmentData.scoring.classification,
            score: enrichmentData.scoring.overallScore,
          }
        } catch (error) {
          console.error('Database storage failed:', error)
          throw error
        }
      },
    )

    return {
      success: true,
      submissionId,
      enrichment: enrichmentResult,
      storage: storageResult,
      message: `Lead enriched and classified as ${storageResult.classification} (score: ${storageResult.score})`,
    }
  },
)
