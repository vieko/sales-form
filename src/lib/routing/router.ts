interface RoutingDecision {
  action: 'sales_notification' | 'marketing_nurture' | 'newsletter_signup'
  message: string
  priority: 'immediate' | 'standard' | 'low'
}

export function determineRouting(
  classification: string,
  score: number,
  contactName: string,
): RoutingDecision {
  switch (classification) {
    case 'SQL':
      return {
        action: 'sales_notification',
        message: `High-priority lead ${contactName} routed to sales team - immediate follow-up recommended (Score: ${score})`,
        priority: 'immediate',
      }

    case 'MQL':
      return {
        action: 'marketing_nurture',
        message: `Marketing qualified lead ${contactName} added to nurture sequence (Score: ${score})`,
        priority: 'standard',
      }

    case 'UNQUALIFIED':
    default:
      return {
        action: 'newsletter_signup',
        message: `Lead ${contactName} added to newsletter and long-term education flow (Score: ${score})`,
        priority: 'low',
      }
  }
}

export function getRoutingActionDescription(action: string): string {
  switch (action) {
    case 'sales_notification':
      return 'Immediate sales team notification and fast-track CRM workflow'
    case 'marketing_nurture':
      return 'Marketing automation sequence and lead scoring workflow'
    case 'newsletter_signup':
      return 'Newsletter signup and long-term nurture campaign'
    default:
      return 'Unknown routing action'
  }
}
