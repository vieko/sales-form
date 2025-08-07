'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useActionState } from 'react'

import { submitContact } from '@/actions/contact'
import { countries } from '@/lib/countries'
import { products } from '@/lib/products'
import { sizes } from '@/lib/sizes'

const initialState = {
  success: false,
  message: '',
  errors: undefined,
}

export function SalesForm() {
  const [state, action, isPending] = useActionState(submitContact, initialState)
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
        <form action={action} className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="company-email">Company email</Label>
            <Input
              id="company-email"
              name="company-email"
              type="email"
              placeholder="Your email address"
              aria-describedby="company-email-error"
              className={cn(
                'text-sm',
                state?.errors?.companyEmail && 'border-destructive',
              )}
              required
            />
            {state?.errors?.companyEmail && (
              <p id="company-email-error" className="text-destructive">
                {state.errors.companyEmail}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Label htmlFor="contact-name">Your name</Label>
              <Input
                id="contact-name"
                name="contact-name"
                type="text"
                placeholder="Jody Smith"
                aria-describedby="contact-name-error"
                className={cn(
                  'text-sm',
                  state?.errors?.contactName && 'border-destructive',
                )}
                required
              />
              {state?.errors?.contactName && (
                <p id="contact-name-error" className="text-destructive">
                  {state.errors.contactName}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="contact-phone">
                Phone number
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="contact-phone"
                name="contact-phone"
                type="tel"
                placeholder="(201) 555-0123"
                aria-describedby="contact-phone-error"
                className={cn(
                  'text-sm',
                  state?.errors?.contactPhone && 'border-destructive',
                )}
              />
              {state?.errors?.contactPhone && (
                <p id="contact-phone-error" className="text-destructive">
                  {state.errors.contactPhone}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="country">Country</Label>
            <Select name="country" required>
              <SelectTrigger
                id="country"
                aria-describedby="country-error"
                className={cn(
                  'w-full [&_span]:!block [&_span]:truncate',
                  state?.errors?.country && 'border-destructive',
                )}
                aria-label="Select your country"
              >
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.country && (
              <p id="country-error" className="text-destructive">
                {state.errors.country}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Label htmlFor="company-website">Company website</Label>
              <Input
                id="company-website"
                name="company-website"
                type="url"
                placeholder="https://jodysmith.com"
                aria-describedby="company-website-error"
                className={cn(
                  'text-sm',
                  state?.errors?.companyWebsite && 'border-destructive',
                )}
                required
              />
              {state?.errors?.companyWebsite && (
                <p id="company-website-error" className="text-destructive">
                  {state.errors.companyWebsite}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="company-size">Company size</Label>
              <Select name="company-size" required>
                <SelectTrigger
                  id="company-size"
                  aria-describedby="company-size-error"
                  className={cn(
                    'w-full [&_span]:!block [&_span]:truncate',
                    state?.errors?.companySize && 'border-destructive',
                  )}
                  aria-label="Select your company size"
                >
                  <SelectValue placeholder="Select your company size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.companySize && (
                <p id="company-size-error" className="text-destructive">
                  {state.errors.companySize}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="product-interest">Primary product interest</Label>
            <Select name="product-interest" required>
              <SelectTrigger
                id="product-interest"
                aria-describedby="product-interest-error"
                className={cn(
                  'w-full [&_span]:!block [&_span]:truncate',
                  state?.errors?.productInterest && 'border-destructive',
                )}
                aria-label="Select a product"
              >
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.productInterest && (
              <p id="product-interest-error" className="text-destructive">
                {state.errors.productInterest}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="how-can-we-help">How can we help?</Label>
            <Textarea
              rows={6}
              id="how-can-we-help"
              name="how-can-we-help"
              placeholder="Tell us about your company, team size, and how we can help you get started."
              aria-describedby="how-can-we-help-error"
              className={cn(
                'min-h-48 text-sm',
                state?.errors?.howCanWeHelp && 'border-destructive',
              )}
              required
            />
            {state?.errors?.howCanWeHelp && (
              <p id="how-can-we-help-error" className="text-destructive">
                {state.errors.howCanWeHelp}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded border px-6 py-6">
            <Label
              htmlFor="privacy-policy"
              className="flex flex-col items-start"
            >
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
            </Label>
            <Switch
              id="privacy-policy"
              name="privacy-policy"
              defaultChecked={false}
              aria-label="Privacy Policy"
              aria-describedby="privacy-policy-error"
            />
            {state?.errors?.privacyPolicy && (
              <p id="privacy-policy-error" className="text-destructive">
                {state.errors.privacyPolicy}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="default"
            className="w-full rounded-full"
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Talk to Vercel'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
