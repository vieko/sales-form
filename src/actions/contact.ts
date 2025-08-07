'use server'

import { z } from 'zod'
import { contactSchema } from '@/lib/validations/contact'
import type { ActionResponse } from '@/types/contact'

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
  }

  const result: Record<string, string | boolean> = {}

  for (const [kebabKey, value] of Object.entries(entries)) {
    const camelKey = fieldMapping[kebabKey]
    if (camelKey) {
      result[camelKey] =
        camelKey === 'privacyPolicy' ? value === 'on' : (value as string)
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

    console.log('contact data', validatedData.data)

    return {
      success: true,
      message: 'Contact form submitted successfully.',
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}
