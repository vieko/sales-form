'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea'

import { countries } from '@/lib/countries'
import { products } from '@/lib/products'

export function SalesForm() {
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
        <form action="" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="company-email">Company email</Label>
            <Input
              id="company-email"
              type="email"
              placeholder="Your email address"
              className="text-sm"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Label htmlFor="contact-name">Your name</Label>
              <Input
                id="contat-name"
                type="text"
                placeholder="Jody Smith"
                className="text-sm"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="contact-phone">
                Phone number
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="(201) 555-0123"
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="country">Country</Label>
            <Select required>
              <SelectTrigger
                id="country"
                className="w-full [&_span]:!block [&_span]:truncate"
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
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="product-interest">Primary product interest</Label>
            <Select required>
              <SelectTrigger
                id="product-interest"
                className="w-full [&_span]:!block [&_span]:truncate"
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
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="how-can-we-help">How can we help?</Label>
            <Textarea
              rows={6}
              id="how-can-we-help"
              placeholder="Tell us about your company, team size, and how we can help you get started."
              className="min-h-48 text-sm"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded border px-6 py-6">
            <Label
              htmlFor="privacy-policy"
              className="flex flex-col items-start"
            >
              <span>Privacy Policy</span>
              <span className="text-muted-foreground leading-snug font-normal">
                Yes, I agree to receive marketing communications from Vercel as
                described in your Privacy Policy. I can withdraw my consent at
                any time by clicking the unsubscribe link in the emails.
              </span>
            </Label>
            <Switch
              id="privacy-policy"
              defaultChecked={false}
              aria-label="Privacy Policy"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button size="default" className="w-full rounded-full">
          Talk to Vercel
        </Button>
      </CardFooter>
    </Card>
  )
}
