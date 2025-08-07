export interface ContactFormData {
  companyEmail: string
  contactName: string
  contactPhone?: string
  country: string
  productInterest: string
  howCanWeHelp: string
  privacyPolicy: boolean
}

export interface ActionResponse {
  success: boolean
  message: string
  errors?: {
    [k in keyof ContactFormData]?: string[]
  }
}
