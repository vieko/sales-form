import { ModeToggle } from '@/components/mode-toggle'
import { Separator } from '@/components/ui/separator'

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="-ml-1">
          <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
            <path d="m37.59.25 36.95 64H.64l36.95-64z" />
          </svg>
        </div>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">sales form</h1>
        <div className="-mr-2 ml-auto flex items-center">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
