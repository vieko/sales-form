'use client'

import { useEffect, startTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'
import Link from 'next/link'


import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { submitContact } from '@/actions/contact'
import { contactSchema, type ContactValues } from '@/lib/validations/contact'
import { countries } from '@/lib/countries'
import { products } from '@/lib/products'
import { sizes } from '@/lib/sizes'
import { isValidEmail } from '@/lib/utils'
import { logger } from '@/lib/logger'

const initialState = {
  success: false,
  message: '',
  errors: undefined,
}

export function SalesForm() {
  const [state, action, isPending] = useActionState(submitContact, initialState)
  
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      companyEmail: '',
      contactName: '',
      contactPhone: '',
      country: '',
      companyWebsite: '',
      companySize: '',
      productInterest: '',
      howCanWeHelp: '',
      privacyPolicy: false,
    },
  })

  // Watch form values for conditional rendering
  const emailValue = form.watch('companyEmail')
  const countryValue = form.watch('country')

  // Determine field visibility with memoization to prevent unnecessary re-renders
  const showNameAndPhone = useMemo(() => {
    // Only validate if email has at least @ symbol to avoid constant validation
    return emailValue.includes('@') && isValidEmail(emailValue)
  }, [emailValue])
  
  const showWebsiteAndSize = useMemo(() => countryValue.length > 0, [countryValue])
  const showPrivacy = useMemo(() => countryValue.length > 0 && countryValue !== 'US', [countryValue])

  // Sync server errors back to the form
  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        if (messages?.[0]) {
          form.setError(field as keyof ContactValues, {
            type: 'server',
            message: messages[0],
          })
        }
      })
    }
  }, [state?.errors, form])

  const onSubmit = (data: ContactValues) => {
    // Log form submission
    logger.info('Form submission started', data)
    
    // Convert form data to FormData with proper field name mapping (camelCase to kebab-case)
    const formData = new FormData()
    formData.append('company-email', data.companyEmail)
    formData.append('contact-name', data.contactName)
    formData.append('contact-phone', data.contactPhone || '')
    formData.append('country', data.country)
    formData.append('company-website', data.companyWebsite || '')
    formData.append('company-size', data.companySize)
    formData.append('product-interest', data.productInterest)
    formData.append('how-can-we-help', data.howCanWeHelp)
    formData.append('privacy-policy', data.privacyPolicy ? 'on' : '')
    
    startTransition(() => {
      action(formData)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-6 mb-2 text-center text-2xl">
          Talk to our Sales team.
        </CardTitle>
        <CardDescription className="align-center flex flex-col justify-center gap-4">
          <div className="text-center text-balance">
            <strong className="text-foreground font-semibold">
              Get a custom demo.
            </strong>{' '}
            Discover the value of Vercel for your enterprise and explore our
            custom plans and pricing.
          </div>
          <div className="text-center text-balance">
            <strong className="text-foreground font-semibold">
              Set up your Enterprise trial.
            </strong>{' '}
            See for yourself how Vercel Enterprise speeds up your workflow &amp;
            impact.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Your email address"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showNameAndPhone && (
              <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Jody Smith"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex-1 flex items-end">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Phone number{' '}
                        <span className="text-muted-foreground">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(201) 555-0123"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex-1 flex items-end">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full [&_span]:!block [&_span]:truncate">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showWebsiteAndSize && (
              <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                <FormField
                  control={form.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Company website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://jodysmith.com"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex-1 flex items-end">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Company size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full [&_span]:!block [&_span]:truncate">
                            <SelectValue placeholder="Select your company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex-1 flex items-end">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="productInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary product interest</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full [&_span]:!block [&_span]:truncate">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="howCanWeHelp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How can we help?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Tell us about your company, team size, and how we can help you get started."
                      className="min-h-48 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPrivacy && (
              <FormField
                control={form.control}
                name="privacyPolicy"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4 rounded border px-6 py-6">
                      <FormLabel className="flex flex-col items-start">
                        <span>Privacy Policy</span>
                        <span className="text-muted-foreground leading-snug font-normal">
                          Yes, I agree to receive marketing communications from Vercel as
                          described in your{' '}
                          <Link
                            href="https://vercel.com/legal/privacy-policy"
                            className="text-foreground hover:underline"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                          . I can withdraw my consent at any time by clicking the
                          unsubscribe link in the emails.
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Privacy Policy"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              size="default"
              className="w-full rounded-full"
              disabled={isPending}
            >
              {isPending ? 'Submitting...' : 'Talk to Vercel'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
