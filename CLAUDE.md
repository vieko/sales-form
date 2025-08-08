# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is an intelligent lead enrichment and scoring system built with Next.js 15. The application automatically enriches, scores, and classifies sales leads using AI agents and modern web tools. It features a smart contact form, AI-powered enrichment pipeline, intelligent scoring system, and real-time lead classification.

## Development Commands

- **Development server**: `pnpm dev` (runs with Turbopack)
- **Build**: `pnpm build`
- **Production server**: `pnpm start`
- **Linting**: `pnpm lint`
- **Inngest Dev Server**: `pnpm queue:dev` (for background job processing)
- **Database Generate**: `pnpm db:generate` (generate Drizzle migrations)
- **Database Migrate**: `pnpm db:migrate` (run Drizzle migrations)

## Development Server Management

The development server often runs in a separate tmux pane for persistence across
sessions:

- **Session**: `SUMMONING DEMONS` (default)
- **Window**: `coven`
- **Pane**: `1` (development server pane)

## Architecture & Structure

### Framework & Tooling

- Next.js 15 with App Router architecture
- TypeScript with strict mode enabled
- TailwindCSS v4 with custom theme configuration
- shadcn/ui component system with "new-york" style
- Lucide React for icons
- pnpm workspace configuration

### Database & Background Jobs

- **Database**: Neon PostgreSQL with Drizzle ORM
- **Background Jobs**: Inngest for async lead enrichment processing
- **Schemas**: Companies, leads, submissions, enrichment-logs
- **Migrations**: Located in `/migrations/` directory

### AI & Data Sources

- **Vercel AI SDK**: GPT-4 integration for lead analysis
- **Exa API**: Company intelligence and market research
- **Firecrawl**: Website crawling and analysis
- **Perplexity API**: Competitive intelligence gathering

### Directory Structure

- `src/app/` - Next.js App Router pages, layouts, and API routes
- `src/components/` - React components (SalesForm, Console, UI components)
- `src/lib/` - Utilities, AI tools, prompts, and validation schemas
- `src/db/` - Database configuration and schemas
- `src/inngest/` - Background job functions and client setup
- `src/actions/` - Server actions for form handling
- `src/types/` - TypeScript type definitions
- `@/components/ui` - shadcn/ui components (alias configured)
- `@/lib/utils` - Utility functions (alias configured)

### Key Files

- `src/lib/utils.ts` - Contains the `cn()` utility for className merging using clsx and tailwind-merge
- `src/inngest/functions.ts` - Background job functions for lead enrichment and routing
- `src/db/drizzle.ts` - Database connection and configuration
- `src/lib/tools/` - AI tools for company intelligence, competitive analysis, etc.
- `src/lib/prompts/` - AI prompts for lead enrichment and SDR research
- `drizzle.config.ts` - Drizzle ORM configuration for database migrations
- `components.json` - shadcn/ui configuration with New York style and RSC enabled
- `src/app/globals.css` - TailwindCSS imports with custom theme variables and dark mode variant

### Styling & Theme

- Uses TailwindCSS v4 with CSS variables for theming
- Custom dark mode implementation via `@custom-variant dark (&:is(.dark *))`
- Geist fonts (Sans and Mono) loaded from Google Fonts
- Extensive CSS custom properties for sidebar, chart, and UI component theming

### TypeScript Configuration

- Path aliases: `@/*` maps to `./src/*`
- Strict TypeScript settings enabled
- Next.js plugin configured for optimal development experience

## Lead Enrichment Pipeline

This application implements a multi-stage pipeline for lead processing:

1. **Form Submission** → Immediate storage in `submissions` table
2. **Background Enrichment** → Inngest job triggers AI-powered data gathering
3. **Scoring & Classification** → Weighted algorithm determines lead quality
4. **Routing** → Automatic assignment to sales/marketing/newsletter workflows

### Inngest Functions

- `enrichLead`: Main enrichment function that processes submissions using AI tools
- `routeLead`: Routes classified leads to appropriate workflows based on score

### AI Tools Architecture

Located in `src/lib/tools/`, each tool provides specific enrichment capabilities:
- Company intelligence gathering
- Competitive analysis
- Website technical analysis
- Intent signal detection

## Component Development

When creating new components:

- Use the established shadcn/ui pattern with the `cn()` utility
- Follow the "new-york" style configuration
- Leverage the configured aliases for imports
- Utilize the extensive CSS custom properties for consistent theming

## Database Development

- Use Drizzle ORM for all database operations
- Generate migrations with `pnpm db:generate`
- Run migrations with `pnpm db:migrate`
- Schema files are located in `src/db/schemas/`

