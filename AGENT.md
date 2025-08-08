# AGENT.md

## Commands
- **Dev**: `pnpm dev` (with Turbopack)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Format**: `prettier --write .`
- **Type check**: `npx tsc --noEmit`
- **Database**: `pnpm db:generate` → `pnpm db:migrate`
- **Queue Dev**: `pnpm queue:dev` (Inngest local development)
- **Package Manager**: Uses pnpm (not npm)
- **Testing**: No tests configured yet

## Architecture
- Next.js 15 App Router with TypeScript and TailwindCSS v4
- Path aliases: `@/*` → `./src/*`
- Structure: `src/app/` (pages), `src/components/` (UI), `src/lib/` (utils), `src/actions/` (server actions), `src/types/` (types)
- Database: Drizzle ORM with Neon PostgreSQL, schemas in `src/db/schemas/`
- AI: Vercel AI SDK with OpenAI/Perplexity providers
- Queue: Inngest for background job processing in `src/inngest/`
- Uses shadcn/ui components with "new-york" style

## Code Style
- **Format**: Prettier with 2 spaces, single quotes, no semicolons, trailing commas
- **Imports**: Use `@/` aliases, group by external → internal → relative
- **Components**: Use `cn()` utility for className merging with clsx + tailwind-merge
- **Types**: Strict TypeScript, prefer interfaces over types for objects
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Files**: kebab-case for file names, PascalCase for component files
