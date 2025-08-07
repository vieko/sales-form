'use server'

import { z } from 'zod'
import { contactSchema } from '@/lib/validations/contact'
import type { ActionResponse } from '@/types/contact'
import { db } from '@/db/drizzle'
import { salesFormSubmissions } from '@/db/schemas'
import { headers } from 'next/headers'
import { enrichLeadWithConsoleUpdates } from './lead-enrichment'

function formDataToObject(
  formData: FormData,
): Record<string, string | boolean> {
  const entries = Object.fromEntries(formData)

  const fieldMapping: Record<string, string> = {
    'company-email': 'companyEmail',
    'contact-name': 'contactName',
    'contact-phone': 'contactPhone',
    country: 'country',
    'company-website': 'companyWebsite',
    'company-size': 'companySize',
    'product-interest': 'productInterest',
    'how-can-we-help': 'howCanWeHelp',
    'privacy-policy': 'privacyPolicy',
    'mock-behavioral-data': 'mockBehavioralData',
  }

  const result: Record<string, string | boolean> = {}
  // ==> kebab-case to camelCase
  for (const [kk, value] of Object.entries(entries)) {
    const ck = fieldMapping[kk]
    if (ck) {
      result[ck] =
        ck === 'privacyPolicy' || ck === 'mockBehavioralData'
          ? value === 'on'
          : (value as string)
    }
  }

  return result
}

export async function submitContact(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const rawData = formDataToObject(formData)
    const validatedData = contactSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        success: false,
        message: 'Please fix the errors in the form',
        errors: Object.fromEntries(
          Object.entries(
            z.treeifyError(validatedData.error).properties || {},
          ).map(([key, value]) => [key, value?.errors || []]),
        ),
      }
    }

    // Get client metadata
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Insert into database
    const [submission] = await db
      .insert(salesFormSubmissions)
      .values({
        ...validatedData.data,
        ipAddress,
        userAgent,
      })
      .returning()

    // Trigger lead enrichment in the background (fire and forget for POC)
    // In production, this would use a proper queue system like Inngest
    enrichLeadWithConsoleUpdates(formData).catch((error) => {
      console.error('Background enrichment failed:', error)
    })

    return {
      success: true,
      message: `Contact form submitted successfully. Submission ID: ${submission.id}`,
    }
  } catch (error) {
    console.error('Database error:', error)

    // Handle database-specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return {
          success: false,
          message: 'This submission already exists.',
        }
      }
      if (error.message.includes('connection')) {
        return {
          success: false,
          message: 'Database connection failed. Please try again.',
        }
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred while saving your submission.',
    }
  }
}
