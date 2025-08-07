'use server'

import { leadEnrichmentAgent } from '@/lib/agents/lead-enrichment'

// Mock behavioral data generator
function generateMockBehavioralData() {
  return {
    pageViews: Math.floor(Math.random() * 15) + 3, // 3-18 page views
    timeOnSite: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
    downloadedResources: [
      // AGENT: search the Vercel website for relevant pages instead of downloaded documents. Use visitedResources instead
      'Product Overview PDF',
      'Pricing Guide',
      'Integration Documentation',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    emailEngagement: {
      opened: Math.floor(Math.random() * 5) + 1, // 1-5 opens
      clicked: Math.floor(Math.random() * 3), // 0-2 clicks
    },
    previousVisits: Math.floor(Math.random() * 5) + 1, // 1-5 previous visits
  }
}

export async function enrichLeadWithConsoleUpdates(formData: FormData) {
  try {
    // Extract form data
    const leadData = {
      contactName: formData.get('contact-name') as string,
      companyEmail: formData.get('company-email') as string,
      contactPhone: (formData.get('contact-phone') as string) || undefined,
      companyWebsite: formData.get('company-website') as string,
      country: formData.get('country') as string,
      companySize: formData.get('company-size') as string,
      productInterest: formData.get('product-interest') as string,
      howCanWeHelp: formData.get('how-can-we-help') as string,
      mockBehavioralData: formData.get('mock-behavioral-data') === 'on',
      behavioralData:
        formData.get('mock-behavioral-data') === 'on'
          ? generateMockBehavioralData()
          : undefined,
    }

    console.log('🚀 Starting AI-powered lead enrichment...', {
      company: leadData.companyEmail.split('@')[1],
      mockData: leadData.mockBehavioralData,
    })

    // Use the streaming enrichment to provide real-time console updates
    const enrichmentStream = leadEnrichmentAgent.streamEnrichment(leadData)

    let finalResult = null

    for await (const update of enrichmentStream) {
      switch (update.step) {
        case 'initializing':
          console.log('🔍 Initializing enrichment pipeline...', {
            progress: update.progress,
          })
          break

        case 'company_intelligence':
          console.log('🏢 Gathering company intelligence...', {
            message:
              'Searching for funding, growth signals, and business intelligence',
            progress: update.progress,
          })
          break

        case 'website_analysis':
          console.log('🌐 Analyzing company website...', {
            message:
              'Crawling key pages for tech stack and business maturity signals',
            progress: update.progress,
          })
          break

        case 'competitive_research':
          console.log('⚔️ Researching competitive landscape...', {
            message: 'Analyzing market position and competitive intelligence',
            progress: update.progress,
          })
          break

        case 'intent_analysis':
          console.log('🎯 Analyzing buying intent...', {
            message: 'Processing "how can we help" text for intent signals',
            progress: update.progress,
          })
          break

        case 'final_analysis':
          console.log('🧮 Calculating lead score and classification...', {
            message: 'Running weighted scoring algorithm',
            progress: update.progress,
          })
          break

        case 'completed':
          finalResult = update.result

          if (finalResult) {
            const { classification, scores } = finalResult

            console.log('✅ Lead enrichment completed!', {
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
              console.log('🔥 HIGH PRIORITY: Sales Qualified Lead detected!', {
                nextSteps: finalResult.recommendedActions.nextSteps,
                reasoning: classification.reasoning,
              })
            } else if (classification.result === 'MQL') {
              console.log('📈 Marketing Qualified Lead - nurture recommended', {
                nextSteps: finalResult.recommendedActions.nextSteps,
                reasoning: classification.reasoning,
              })
            } else {
              console.log(
                '📋 Unqualified lead - adding to newsletter sequence',
                {
                  reasoning: classification.reasoning,
                },
              )
            }

            // Log behavioral insights if mock data was used
            if (leadData.mockBehavioralData && leadData.behavioralData) {
              console.log(
                '📊 Mock behavioral data applied:',
                leadData.behavioralData,
              )
            }
          }
          break

        case 'error':
          console.log('❌ Enrichment failed:', {
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
      message: 'Lead enrichment completed successfully',
      data: finalResult,
    }
  } catch (error) {
    console.error('❌ Enrichment system error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return {
      success: false,
      message: 'Enrichment failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
