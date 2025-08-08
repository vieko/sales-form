import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const extractDomain = (urlOrEmail: string): string => {
  try {
    if (urlOrEmail.includes('@')) {
      return urlOrEmail.split('@')[1]
    }
    const url = new URL(
      urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`,
    )
    return url.hostname.replace(/^www\./, '')
  } catch {
    return urlOrEmail
  }
}

export const extractCompanyName = (email: string, domain: string): string => {
  const domainParts = domain.split('.')
  const companyPart = domainParts[0]
  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
}

export function formDataToObject(
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
