# Nuxt Analyze ESLint Plugin

This ESLint plugin provides rules for analyzing HTML and Vue files for SEO, accessibility, and best practices.

## Configurations

### Nuxt Configuration (Default)

For Nuxt projects with Vue components and HTML files:

```javascript
// eslint.config.js
import nuxtAnalyze from 'nuxt-analyze-eslint-plugin'

export default [
  ...nuxtAnalyze({
    // Options
    trailingSlash: false,
    pages: [], // Nuxt pages for router validation
    linkComponents: ['a', 'NuxtLink', 'RouterLink', 'ULink']
  })
]
```

### HTML-Only Configuration

For static HTML projects without Vue/Nuxt:

```javascript
// eslint.config.js
import { htmlAnalyze } from 'nuxt-analyze-eslint-plugin'

export default [
  ...htmlAnalyze({
    // Options
    trailingSlash: false,
    linkComponents: ['a'] // Only standard HTML anchor tags
  })
]
```

## Available Rules

### Meta Rules
- `nuxt-analyze/meta/missing-title` - Ensures pages have title tags
- `nuxt-analyze/meta/missing-description` - Ensures pages have meta descriptions
- `nuxt-analyze/meta/duplicate-title` - Prevents duplicate title tags
- `nuxt-analyze/meta/duplicate-description` - Prevents duplicate meta descriptions

### Linking Rules
- `nuxt-analyze/linking/require-descriptive-text` - Ensures links have descriptive text
- `nuxt-analyze/linking/no-whitespace` - Prevents whitespace in URLs
- `nuxt-analyze/linking/ascii-only` - Ensures URLs contain only ASCII characters
- `nuxt-analyze/linking/only-lowercase` - Enforces lowercase URLs
- `nuxt-analyze/linking/no-double-slashes` - Prevents double slashes in URLs
- `nuxt-analyze/linking/no-underscores` - Prevents underscores in URLs
- `nuxt-analyze/linking/require-href` - Ensures links have href attributes
- `nuxt-analyze/linking/trailing-slash` - Enforces trailing slash consistency
- `nuxt-analyze/linking/valid-router-path` - Validates router paths (Nuxt/Vue only)

## Rule Examples

### `linking/require-descriptive-text`

```html
<!-- Bad: Non-descriptive link text -->
<a href="/docs">Click here</a>
<NuxtLink to="/docs">Learn more</NuxtLink>

<!-- Good: Descriptive link text -->
<a href="/docs">View documentation</a>
<NuxtLink to="/docs">API Documentation</NuxtLink>

<!-- Also acceptable: Using title or aria-label -->
<a href="/docs" title="API Documentation">
  <img src="docs-icon.png" alt="Documentation icon">
</a>
```

## Benefits

Using these ESLint rules provides real-time feedback during development, helping to:

1. Improve SEO by ensuring links have descriptive text
2. Enhance accessibility for screen reader users
3. Catch issues early in the development process
4. Maintain consistency with the runtime checks performed by Nuxt Link Checker

## Future Rules

More rules will be added over time to match the functionality of the runtime Nuxt Link Checker rules.
