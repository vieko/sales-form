# AGENT.md

## Commands
- **Dev**: `pnpm dev` (with Turbopack)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Format**: `prettier --write .`
- **Type check**: `npx tsc --noEmit`
- **Package Manager**: Uses pnpm (not npm)

## Development Server Management
The development server often runs in a separate tmux pane for persistence across sessions:
- **Session**: `SUMMONING DEMONS` (default)
- **Window**: `coven` 
- **Pane**: `1` (development server pane)

**Tmux Commands:**
- `tmux send-keys -t "SUMMONING DEMONS:coven.1" C-c` - Stop dev server
- `tmux send-keys -t "SUMMONING DEMONS:coven.1" "pnpm dev" Enter` - Start dev server
- `tmux capture-pane -t "SUMMONING DEMONS:coven.1" -p` - View dev server output

## Architecture
- Next.js 15 App Router with TypeScript and TailwindCSS v4
- Path aliases: `@/*` → `./src/*`
- Structure: `src/app/` (pages), `src/components/` (UI), `src/lib/` (utils), `src/actions/` (server actions), `src/types/` (types)
- Uses shadcn/ui components with "new-york" style
- Zod for validation, Lucide React for icons

## Code Style
- **Format**: Prettier with 2 spaces, single quotes, no semicolons, trailing commas
- **Imports**: Use `@/` aliases, group by external → internal → relative
- **Components**: Use `cn()` utility for className merging with clsx + tailwind-merge
- **Types**: Strict TypeScript, prefer interfaces over types for objects
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Files**: kebab-case for file names, PascalCase for component files

## Function Conventions (React 19 + Next.js 15)
- **Arrow functions by default**: For components, callbacks, and smaller utility methods
- **Regular functions**: For named functions (better stack traces), large shared components, and main class methods
- **Functional components**: Use proper TypeScript typing with interface props
- **Factory patterns**: Use arrow functions for instance creation and singleton patterns
- **Private methods**: Use arrow functions for better `this` binding and callback usage
- **Classes for stateful services**: Use classes for loggers, caches, and other stateful utilities

## AI SDK Agent Patterns
- **Tool-based agents**: Use `generateText` with tools for multi-step workflows
- **Functional composition**: Prefer functional patterns over class-based agents
- **Agent factory functions**: Create configurable agent instances with `createAgent(config)`
- **Streaming workflows**: Use async generators for real-time progress updates
- **AI SDK tools**: Define tools with `inputSchema` (not `parameters`) and `execute` functions
- **Sequential/parallel processing**: Choose based on dependencies between enrichment steps

## Database & Drizzle Best Practices
- **Migration commands**: `pnpm drizzle-kit generate` → `pnpm drizzle-kit migrate`
- **Always review generated migrations** before applying - Drizzle auto-generation can have logical errors
- **Manual migration editing** is required for complex type changes (varchar → enum, etc.)
- **Safe enum creation pattern**:
  ```sql
  DO $$ BEGIN
   CREATE TYPE "public"."enum_name" AS ENUM('value1', 'value2');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  ```
- **Type change with defaults sequence**: DROP DEFAULT → ALTER TYPE (with USING clause) → SET DEFAULT
- **USING clause for type conversion**: `USING "column"::text::"public"."enum_name"`
- **Clean migration state**: Remove problematic migrations from both `/migrations/` and `/migrations/meta/` 
- **Schema organization**: Use separate files per table in `schemas/` with `index.ts` re-exports
