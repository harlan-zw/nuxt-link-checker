# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nuxt Analyze

You're creating a project called Nuxt Analyze, think of it as a Site Audit tool that is provided by Ahrefs or
Semrush, however, it's built as a Nuxt module providing a tighter integration with end-users sites.

There are several steps to auditing a site, for now we'll focus on auditing a development (or production) site.

### Step 1. Crawl

The crawler is powered by `crawlee`.

We extract all relevant data we can from the page, for the analysis of data we run step 2.

### Step 2. Analyze

The analysis is powered by `eslint` and `eslint-plugin-nuxt-analyze`, it will process the HTML payload
of the page to determine any issues with the page.

Some rules we apply outside the html, for example the response status code of the page.

## Build & Development
- Build module: `pnpm build`
- Development: `pnpm dev` (runs playground) or `pnpm client:dev` (runs UI client)
- Prepare dev environment: `pnpm dev:prepare`
- Build client only: `pnpm client:build`
- Run playground in production mode: `pnpm play:prod`

## Testing
- Run all tests: `pnpm test`
- Run a single test: `pnpm test path/to/test.test.ts`
- Watch mode: `pnpm test:watch`
- Type checking: `pnpm test:types`

## Linting
- Lint and fix: `pnpm lint`

## CLI Commands
The project includes a CLI tool for crawling and analyzing sites:
- `pnpm _crawl --url <site>`: Crawl a specific site
- `pnpm _analyze`: Analyze crawled data
- `pnpm _db <name>`: Database operations
- Database migrations: `pnpm db:migrate:audit` or `pnpm db:migrate:root`

## Project Architecture
- **Module Structure**: Monorepo using pnpm workspaces with packages in `/packages` directory
- **Core Components**:
  - `packages/module`: Main Nuxt module implementation with CLI commands, database layer, and DevTools integration
  - `packages/eslint-plugin`: ESLint rules for link checking organized by categories (linking, meta)
  - `packages/eslint-worker`: Worker thread implementation for ESLint operations
  - `client/app`: Nuxt app for displaying link checker results in DevTools UI
- **CLI System**: Built with `cac`, provides commands for crawling (`_crawl`), analyzing (`_analyze`), and database operations (`_db`)
- **Database Layer**: Uses Drizzle ORM with SQLite for storing crawl results, pages, and resources data
- **DevTools Integration**: Custom DevTools tab with RPC communication between client and server
- **Rules System**: Rules are organized in categories (linking, meta) and stored in their respective directories with a standard pattern: index.ts, index.test.ts, and index.md

## Code Style
- Uses `@antfu/eslint-config` for formatting and style
- TypeScript for type safety
- Vue components follow the `.vue` extension
- Imports should be organized: built-ins first, then packages, then internal imports
- Follow Nuxt module conventions for file organization
- Descriptive variable/function names with camelCase
- Tests use Vitest with `describe`, `it`, and `expect` patterns

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
