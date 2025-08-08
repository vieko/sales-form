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

    // Step 3: Run enrichment process
    const enrichmentResult = await step.run('run-enrichment', async () => {
      console.log('🚀 Starting AI-powered lead enrichment...', {
        submissionId,
        company: leadData.companyEmail.split('@')[1],
        mockData: leadData.mockBehavioralData,
      })

      const enrichmentStream = leadEnrichmentAgent.streamEnrichment(leadData)
      let finalResult = null

      for await (const update of enrichmentStream) {
        switch (update.step) {
          case 'initializing':
            console.log('🔍 Initializing enrichment pipeline...', {
              submissionId,
              progress: update.progress,
            })
            break

          case 'company_intelligence':
            console.log('🏢 Gathering company intelligence...', {
              submissionId,
              message:
                'Searching for funding, growth signals, and business intelligence',
              progress: update.progress,
            })
            break

          case 'website_analysis':
            console.log('🌐 Analyzing company website...', {
              submissionId,
              message:
                'Crawling key pages for tech stack and business maturity signals',
              progress: update.progress,
            })
            break

          case 'competitive_research':
            console.log('⚔️ Researching competitive landscape...', {
              submissionId,
              message: 'Analyzing market position and competitive intelligence',
              progress: update.progress,
            })
            break

          case 'intent_analysis':
            console.log('🎯 Analyzing buying intent...', {
              submissionId,
              message: 'Processing "how can we help" text for intent signals',
              progress: update.progress,
            })
            break

          case 'final_analysis':
            console.log('🧮 Calculating lead score and classification...', {
              submissionId,
              message: 'Running weighted scoring algorithm',
              progress: update.progress,
            })
            break

          case 'completed':
            finalResult = update.result

            if (finalResult) {
              const { classification, scores } = finalResult

              console.log('✅ Lead enrichment completed!', {
                submissionId,
                totalScore: scores.total,
                classification: classification.result,
                confidence: `${classification.confidence}%`,
                breakdown: {
                  firmographic: scores.firmographic,
                  behavioral: scores.behavioral,
                  intent: scores.intent,
                  technographic: scores.technographic,
                },
              })

              // Log detailed classification result
              if (classification.result === 'SQL') {
                console.log(
                  '🔥 HIGH PRIORITY: Sales Qualified Lead detected!',
                  {
                    submissionId,
                    nextSteps: finalResult.recommendedActions.nextSteps,
                    reasoning: classification.reasoning,
                  },
                )
              } else if (classification.result === 'MQL') {
                console.log(
                  '📈 Marketing Qualified Lead - nurture recommended',
                  {
                    submissionId,
                    nextSteps: finalResult.recommendedActions.nextSteps,
                    reasoning: classification.reasoning,
                  },
                )
              } else {
                console.log(
                  '📋 Unqualified lead - adding to newsletter sequence',
                  {
                    submissionId,
                    reasoning: classification.reasoning,
                  },
                )
              }

              // Log behavioral insights if mock data was used
              if (leadData.mockBehavioralData && leadData.behavioralData) {
                console.log('📊 Mock behavioral data applied:', {
                  submissionId,
                  data: leadData.behavioralData,
                })
              }
            }
            break

          case 'error':
            console.log('❌ Enrichment failed:', {
              submissionId,
              error: update.error,
              message: update.message,
            })
            break
        }

        // Add a small delay to make the progress visible in the console
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      return {
        success: true,
        submissionId,
        message: 'Lead enrichment completed successfully',
        data: finalResult,
      }
    })

    return enrichmentResult
  },
)
