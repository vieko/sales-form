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

export function generateMockBehavioralData() {
  return {
    pageViews: Math.floor(Math.random() * 15) + 3, // 3-18 page views
    timeOnSite: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
    visitedResources: [
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
