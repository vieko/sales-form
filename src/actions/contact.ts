'use server'

import { z } from 'zod'
import type { ContactFormData, ActionResponse } from '@/types/contact'

const contactSchema = z.object({
  companyEmail: z.email(),
  contactName: z.string(),
  contactPhone: z.string().optional(),
  country: z.string(),
  companyWebsite: z.url(),
  companySize: z.string(),
  productInterest: z.string(),
  howCanWeHelp: z.string(),
  privacyPolicy: z.boolean(),
})

export async function submitContact(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const rawData: ContactFormData = {
      companyEmail: formData.get('company-email') as string,
      contactName: formData.get('contact-name') as string,
      contactPhone: formData.get('contact-phone') as string,
      country: formData.get('country') as string,
      companyWebsite: formData.get('company-website') as string,
      companySize: formData.get('company-size') as string,
      productInterest: formData.get('product-interest') as string,
      howCanWeHelp: formData.get('how-can-we-help') as string,
      privacyPolicy: formData.get('privacy-policy') === 'on',
    }

    const validatedData = contactSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        success: false,
        message: 'Please fix the errors in the form',
        errors: validatedData.error.flatten().fieldErrors,
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
