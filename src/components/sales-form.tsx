import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'

import { countries } from '@/lib/countries'

const productOptions = [
  { value: 'vercel', label: 'Vercel' },
  { value: 'v0', label: 'v0' },
  { value: 'vercel-and-v0', label: 'Vercel and v0' },
]

export function SalesForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Talk to our Sales team.</CardTitle>
        <CardDescription className="text-balance">
          Get a custom demo. Discover the value of Vercel for your enterprise
          and explore our custom plans and pricing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="company-email">Company email</Label>
          <Input
            id="company-email"
            type="email"
            placeholder="Your email address"
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="country">Country</Label>
          <Select>
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
          <Select>
            <SelectTrigger
              id="product-interest"
              className="w-full [&_span]:!block [&_span]:truncate"
              aria-label="Select a product"
            >
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {productOptions.map((option) => (
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
            className="min-h-28 text-sm"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button size="default" className="w-full rounded-full">
          Talk to Vercel
        </Button>
      </CardFooter>
    </Card>
  )
}
