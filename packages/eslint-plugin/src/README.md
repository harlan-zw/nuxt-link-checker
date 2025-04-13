# Nuxt Link Checker ESLint Rules

This directory contains ESLint rules that implement the same checks as the Nuxt Link Checker runtime rules.

## Available Rules

### `link-descriptive-text`

This rule ensures that link text is descriptive for better SEO and accessibility. It mimics the functionality of the `link-text.ts` rule from the Nuxt Link Checker.

#### Rule Details

This rule checks:
- That links have text content, a title attribute, or an aria-label
- That the text content is descriptive (not generic phrases like "click here" or "learn more")

#### Examples

```html
<!-- Bad: Non-descriptive link text -->
<a href="/docs">Click here</a>
<NuxtLink to="/docs">Learn more</NuxtLink>

<!-- Good: Descriptive link text -->
<a href="/docs">View documentation</a>
<NuxtLink to="/docs">API Documentation</NuxtLink>

<!-- Also acceptable: Using title or aria-label when no text content -->
<a href="/docs" title="API Documentation"><img src="docs-icon.png" alt="Documentation icon"></a>
<NuxtLink to="/docs" aria-label="View documentation"><Icon name="docs" /></NuxtLink>
```

## Usage in ESLint Config

```javascript
// eslint.config.js
import antfu from '@antfu/eslint-config'
import nuxtLinkCheckerPlugin from './src/nuxt-analyze/eslint-rules/index.js'

export default antfu({
  rules: {
    'nuxt-link-checker/link-descriptive-text': 'warn'
  },
  plugins: {
    'nuxt-link-checker': nuxtLinkCheckerPlugin
  }
})
```

## Benefits

Using these ESLint rules provides real-time feedback during development, helping to:

1. Improve SEO by ensuring links have descriptive text
2. Enhance accessibility for screen reader users
3. Catch issues early in the development process
4. Maintain consistency with the runtime checks performed by Nuxt Link Checker

## Future Rules

More rules will be added over time to match the functionality of the runtime Nuxt Link Checker rules.
