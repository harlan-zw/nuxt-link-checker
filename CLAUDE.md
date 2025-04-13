# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development
- Build module: `pnpm build`
- Development: `pnpm dev` (runs playground) or `pnpm client:dev` (runs UI client)
- Prepare dev environment: `pnpm dev:prepare`

## Testing
- Run all tests: `pnpm test`
- Run a single test: `pnpm test path/to/test.test.ts`
- Watch mode: `pnpm test:watch`
- Type checking: `pnpm test:types`

## Linting
- Lint and fix: `pnpm lint`

## Code Style
- Uses `@antfu/eslint-config` for formatting and style
- TypeScript for type safety
- Vue components follow the `.vue` extension
- Imports should be organized: built-ins first, then packages, then internal imports
- Follow Nuxt module conventions for file organization
- Descriptive variable/function names with camelCase
- Tests use Vitest with `describe`, `it`, and `expect` patterns
