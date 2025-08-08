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
