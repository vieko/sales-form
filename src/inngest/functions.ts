import { inngest } from './client'
import { db } from '@/db/drizzle'
import { submissions, leads, companies } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { generateMockBehavioralData } from '@/lib/utils'
import { determineRouting } from '@/lib/routing/router'
import { logger } from '@/lib/logger'
import { enrichLead } from '@/lib/enrichment/enrichment-engine'
import { updateEnrichmentLogsWithIds } from '@/lib/enrichment-logger'
import type { EnrichmentInput } from '@/lib/schemas/enrichment'

export const enrichLeadFunction = inngest.createFunction(
  { id: 'enrich-lead', name: 'Enrich Lead Submission' },
  { event: 'lead/submitted' },
  async ({ event, step }) => {
    console.log('=== EVENT DATA ===', JSON.stringify(event.data, null, 2))

    // Handle both normal events and re-run events (where data is nested)
    const submissionId =
      event.data.submissionId || event.data.data?.submissionId
    const sessionId = 
      event.data.sessionId || event.data.data?.sessionId

    if (!submissionId) {
      console.error(
        '=== RERUN ERROR === submissionId is undefined in event data',
      )
      return {
        success: false,
        error:
          'Cannot process event: submissionId is undefined. This appears to be a failed event from before the fix was applied.',
        message:
          'Event skipped due to missing submissionId. Future submissions will not have this issue.',
      }
    }

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
          // Use submissionId as leadId for now - we'll update with actual leadId later
          leadId: submissionId,
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

    const enrichmentResult = await step.run('call-enrichment-engine', async () => {
      console.log('=== CALL === enrichment engine directly...')

      const result = await enrichLead(enrichmentInput)
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
              leadScore: Math.round(enrichmentData.scoring.overallScore),
              firmographicScore: Math.round(
                enrichmentData.scoring.firmographicScore,
              ),
              behavioralScore: Math.round(
                enrichmentData.scoring.behavioralScore,
              ),
              intentScore: Math.round(enrichmentData.scoring.intentScore),
              technographicScore: Math.round(
                enrichmentData.scoring.technographicScore,
              ),
              classification: enrichmentData.scoring.classification,
              classificationConfidence:
                enrichmentData.scoring.classificationConfidence.toString(),
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

    // Update enrichment logs with final IDs
    await step.run('update-enrichment-logs', async () => {
      await updateEnrichmentLogsWithIds({
        submissionId,
        leadId: storageResult.leadId,
        companyId: storageResult.companyId,
      })
    })

    // Log enrichment completion to UI console
    await step.run('log-enrichment-completion', () => {
      logger.success(
        `Lead enriched and classified as ${storageResult.classification}`,
        {
          leadId: storageResult.leadId,
          score: storageResult.score,
          classification: storageResult.classification,
          contactName: submission.contactName,
        },
        sessionId
      )
    })

    // Trigger routing after enrichment completes
    await step.sendEvent('trigger-routing', {
      name: 'lead/enriched',
      data: {
        leadId: storageResult.leadId,
        classification: storageResult.classification,
        score: storageResult.score,
        contactName: submission.contactName,
        sessionId: sessionId,
      },
    })

    return {
      success: true,
      submissionId,
      enrichment: enrichmentResult,
      storage: storageResult,
      message: `Lead enriched and classified as ${storageResult.classification} (score: ${storageResult.score})`,
    }
  },
)

export const routeLead = inngest.createFunction(
  { id: 'route-lead', name: 'Route Classified Lead' },
  { event: 'lead/enriched' },
  async ({ event, step }) => {
    const { leadId, classification, score, contactName, sessionId } = event.data

    const routingDecision = await step.run('determine-routing', async () => {
      return determineRouting(classification, score, contactName)
    })

    const routingResult = await step.run('apply-routing', async () => {
      try {
        await db
          .update(leads)
          .set({
            routingStatus: 'routed',
            routingAction: routingDecision.action,
            routingMessage: routingDecision.message,
            routedAt: new Date(),
          })
          .where(eq(leads.id, leadId))

        console.log(`=== ROUTING === ${routingDecision.message}`)

        // Log to UI console
        logger.success(routingDecision.message, {
          leadId,
          classification,
          score,
          action: routingDecision.action,
          priority: routingDecision.priority,
        }, sessionId)

        return {
          success: true,
          leadId,
          action: routingDecision.action,
          message: routingDecision.message,
          priority: routingDecision.priority,
        }
      } catch (error) {
        console.error('Routing failed:', error)
        throw error
      }
    })

    // NOTE: For POC, just log the action that would be taken
    await step.run('send-notifications', async () => {
      console.log(
        `=== NOTIFICATION === Routing action: ${routingDecision.action}`,
      )
      console.log(`=== NOTIFICATION === Priority: ${routingDecision.priority}`)
      let notificationDetails: string[] = []

      switch (routingDecision.action) {
        case 'sales_notification':
          notificationDetails = [
            'Slack notification to sales team',
            'High-priority email to sales reps',
            'CRM fast-track workflow',
          ]
          console.log('WOULD SEND: Slack notification to sales team')
          console.log('WOULD SEND: High-priority email to sales reps')
          console.log('WOULD TRIGGER: CRM fast-track workflow')
          break
        case 'marketing_nurture':
          notificationDetails = [
            'Marketing automation sequence',
            'Lead scoring workflow',
          ]
          console.log('WOULD TRIGGER: Marketing automation sequence')
          console.log('WOULD ADD TO: Lead scoring workflow')
          break
        case 'newsletter_signup':
          notificationDetails = [
            'Newsletter list signup',
            'Welcome email sequence',
          ]
          console.log('WOULD ADD TO: Newsletter list')
          console.log('WOULD TRIGGER: Welcome email sequence')
          break
      }

      // Log to UI console
      logger.info(
        `Triggered ${notificationDetails.length} ${routingDecision.action} actions`,
        {
          actions: notificationDetails,
          priority: routingDecision.priority,
        },
        sessionId
      )

      return { notificationsSent: true }
    })

    return {
      success: true,
      leadId,
      routing: routingResult,
      message: `Lead routed successfully: ${routingDecision.message}`,
    }
  },
)
