import { inngest } from './client'
import { db } from '@/db/drizzle'
import { submissions, leads, companies } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { generateMockBehavioralData } from '@/lib/utils'
import { determineRouting } from '@/lib/routing/router'
import { serverLogger } from '@/lib/server-logger'
import type { EnrichmentInput } from '@/lib/schemas/enrichment'

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

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      const response = await fetch(
        `${baseUrl}/api/enrich`,
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
              leadScore: Math.round(enrichmentData.scoring.overallScore),
              firmographicScore: Math.round(enrichmentData.scoring.firmographicScore),
              behavioralScore: Math.round(enrichmentData.scoring.behavioralScore),
              intentScore: Math.round(enrichmentData.scoring.intentScore),
              technographicScore: Math.round(enrichmentData.scoring.technographicScore),
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

    // Log enrichment completion to UI console
    await step.run('log-enrichment-completion', async () => {
      await serverLogger.success(
        `Lead enriched and classified as ${storageResult.classification}`,
        {
          leadId: storageResult.leadId,
          score: storageResult.score,
          classification: storageResult.classification,
          contactName: submission.contactName
        }
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
    const { leadId, classification, score, contactName } = event.data

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
        await serverLogger.success(routingDecision.message, {
          leadId,
          classification,
          score,
          action: routingDecision.action,
          priority: routingDecision.priority
        })

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
            'CRM fast-track workflow'
          ]
          console.log('WOULD SEND: Slack notification to sales team')
          console.log('WOULD SEND: High-priority email to sales reps')
          console.log('WOULD TRIGGER: CRM fast-track workflow')
          break
        case 'marketing_nurture':
          notificationDetails = [
            'Marketing automation sequence',
            'Lead scoring workflow'
          ]
          console.log('WOULD TRIGGER: Marketing automation sequence')
          console.log('WOULD ADD TO: Lead scoring workflow')
          break
        case 'newsletter_signup':
          notificationDetails = [
            'Newsletter list signup',
            'Welcome email sequence'
          ]
          console.log('WOULD ADD TO: Newsletter list')
          console.log('WOULD TRIGGER: Welcome email sequence')
          break
      }
      
      // Log to UI console
      await serverLogger.info(
        `Triggered ${notificationDetails.length} ${routingDecision.action} actions`,
        { 
          actions: notificationDetails,
          priority: routingDecision.priority 
        }
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
