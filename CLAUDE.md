# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Next.js 15 project built with TypeScript, TailwindCSS v4, and set up
for shadcn/ui components. The project uses pnpm as the package manager and is
configured for Turbopack development mode.

## Development Commands

- **Development server**: `pnpm dev` (runs with Turbopack)
- **Build**: `pnpm build`
- **Production server**: `pnpm start`
- **Linting**: `pnpm lint`

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

### Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Utility functions and shared libraries
- `@/components/ui` - shadcn/ui components (alias configured)
- `@/lib/utils` - Utility functions (alias configured)

### Key Files

- `src/lib/utils.ts` - Contains the `cn()` utility for className merging using
  clsx and tailwind-merge
- `components.json` - shadcn/ui configuration with New York style and RSC
  enabled
- `src/app/globals.css` - TailwindCSS imports with custom theme variables and
  dark mode variant

### Styling & Theme

- Uses TailwindCSS v4 with CSS variables for theming
- Custom dark mode implementation via `@custom-variant dark (&:is(.dark *))`
- Geist fonts (Sans and Mono) loaded from Google Fonts
- Extensive CSS custom properties for sidebar, chart, and UI component theming

### TypeScript Configuration

- Path aliases: `@/*` maps to `./src/*`
- Strict TypeScript settings enabled
- Next.js plugin configured for optimal development experience

## Component Development

When creating new components:

- Use the established shadcn/ui pattern with the `cn()` utility
- Follow the "new-york" style configuration
- Leverage the configured aliases for imports
- Utilize the extensive CSS custom properties for consistent theming

