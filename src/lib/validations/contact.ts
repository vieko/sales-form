import { z } from 'zod'
import { countries } from '@/lib/countries'
import { sizes } from '@/lib/sizes'
import { products } from '@/lib/products'

const countryValues = countries.map(country => country.value)
const sizeValues = sizes.map(size => size.value) 
const productValues = products.map(product => product.value)

export const contactSchema = z.object({
  contactName: z.string().trim().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  companyEmail: z.string().trim().email('Please enter a valid email address'),
  contactPhone: z.string().trim().optional(),
  companyWebsite: z.string().trim().url('Please enter a valid URL'),
  country: z.enum(countryValues as [string, ...string[]], { message: 'Please select a country' }),
  companySize: z.enum(sizeValues as [string, ...string[]], { message: 'Please select a company size' }),
  productInterest: z.enum(productValues as [string, ...string[]], { message: 'Please select a product' }),
  howCanWeHelp: z.string().trim().min(20, 'Please provide at least 20 characters describing how we can help'),
  privacyPolicy: z.boolean().refine(val => val === true, { message: 'You must accept the privacy policy' })
})

export type ContactValues = z.infer<typeof contactSchema>
