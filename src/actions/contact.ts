'use server'

import { db } from '@/db/drizzle'
import { submissions } from '@/db/schemas'
import { contactSchema } from '@/lib/validations/contact'
import type { ActionResponse } from '@/types/contact'
import { headers } from 'next/headers'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import { formDataToObject } from '@/lib/utils'
import { serverLogger } from '@/lib/server-logger'

export async function submitContact(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const rawData = formDataToObject(formData)
    const validatedData = contactSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        success: false,
        message: 'Please resolve the errors in the form',
        errors: Object.fromEntries(
          Object.entries(
            z.treeifyError(validatedData.error).properties || {},
          ).map(([key, value]) => [key, value?.errors || []]),
        ),
      }
    }

    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const [submission] = await db
      .insert(submissions)
      .values({
        ...validatedData.data,
        ipAddress,
        userAgent,
      })
      .returning()

    if (!submission?.id) {
      throw new Error('Failed to create submission - no ID returned')
    }

    // Log form submission to console
    await serverLogger.info(
      `New form submission received from ${validatedData.data.contactName}`,
      {
        submissionId: submission.id,
        company: validatedData.data.companyWebsite,
        companySize: validatedData.data.companySize,
        productInterest: validatedData.data.productInterest,
        country: validatedData.data.country,
      },
    )

    // ==> trigger lead enrichment via Inngest
    await inngest
      .send({
        name: 'lead/submitted',
        data: { submissionId: submission.id },
      })
      .then(async () => {
        await serverLogger.info('Lead enrichment pipeline started', {
          submissionId: submission.id,
          pipeline: 'AI enrichment → scoring → classification → routing',
        })
      })
      .catch(async (error) => {
        console.error('Failed to queue enrichment:', error)
        await serverLogger.error('Failed to start enrichment pipeline', {
          submissionId: submission.id,
          error: error.message,
        })
      })

    return {
      success: true,
      message: `Contact form submitted successfully. Submission ID: ${submission.id}`,
    }
  } catch (error) {
    console.error('Database error:', error)
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
