// import type { Linter } from 'eslint'
// import type { NuxtAuditESLintConfigOptions } from '../types'
// import { defu } from 'defu'
// import Fuse from 'fuse.js'
// import parserVue from 'vue-eslint-parser'
// import { createRouterMatcher } from 'vue-router'
// import rules from '../rules'
//
// export default function nuxtAnalyzeHTML(_options: NuxtAuditESLintConfigOptions): Linter.Config[] {
//   const options = defu(_options, {
//     linkComponents: [
//       'a',
//       'NuxtLink',
//       'RouterLink',
//       'ULink',
//     ],
//     pages: [],
//     trailingSlash: false,
//   })
//   // create vue router instance
//   const routeMatcher = createRouterMatcher(options.pages, {})
//   const staticPaths = routeMatcher.getRoutes()
//     .filter(route => !route.record.path.includes(':'))
//     .map(route => ({ path: route.record.path, name: String(route.record.name) }))
//   const pageSearch = new Fuse<{ path: string, name: string }>(staticPaths, {
//     keys: ['path', 'name'],
//     threshold: 0.5,
//   })
//   return [
//     {
//       name: 'nuxt/analyze/setup',
//       settings: {
//         routeMatcher,
//         pageSearch,
//       },
//       plugins: {
//         'nuxt-analyze': {
//           meta: {
//             name: 'nuxt-analyze-eslint-plugin',
//           },
//           rules,
//         },
//       },
//     },
//     {
//       // recommended configuration included in the plugin
//       name: 'nuxt/analyze/rules',
//       languageOptions: {
//         parser: parserVue,
//       },
//       files: ['**/*.html'],
//       rules: {
//         // ===== BEST PRACTICE =====
//         // '@html-eslint/no-duplicate-attrs': 'error',
//         // '@html-eslint/no-duplicate-id': 'error',
//         // '@html-eslint/no-obsolete-tags': 'off',
//         // '@html-eslint/require-li-container': 'error',
//         // '@html-eslint/use-baseline': 'off',
//         // '@html-eslint/no-inline-styles': 'off',
//         // '@html-eslint/no-nested-interactive': 'off', // seems unstable
//         // '@html-eslint/no-restricted-attr-values': 'off',
//         // '@html-eslint/no-restricted-attrs': 'off',
//         // '@html-eslint/no-target-blank': 'error',
//         // '@html-eslint/prefer-https': 'error',
//         // '@html-eslint/require-attrs': 'error',
//         // '@html-eslint/require-meta-charset': 'error',
//         // // Disabled formatting rules
//         // '@html-eslint/no-extra-spacing-text': 'off',
//         // '@html-eslint/no-script-style-type': 'off',
//         // '@html-eslint/require-button-type': 'off',
//         // '@html-eslint/require-closing-tags': 'off',
//         // '@html-eslint/require-doctype': 'off',
//         //
//         // // ===== SEO =====
//         // '@html-eslint/no-multiple-h1': 'error',
//         // '@html-eslint/require-lang': 'error',
//         // '@html-eslint/require-title': 'error',
//         // '@html-eslint/require-meta-description': 'error',
//         // '@html-eslint/require-open-graph-protocol': 'error',
//         //
//         // // ===== ACCESSIBILITY =====
//         // '@html-eslint/require-img-alt': 'error',
//         // '@html-eslint/no-abstract-roles': 'error',
//         // '@html-eslint/no-accesskey-attrs': 'error',
//         // '@html-eslint/no-aria-hidden-body': 'error',
//         // '@html-eslint/no-heading-inside-button': 'error',
//         // '@html-eslint/no-invalid-role': 'error',
//         // '@html-eslint/no-non-scalable-viewport': 'error',
//         // '@html-eslint/no-positive-tabindex': 'error',
//         // '@html-eslint/no-skip-heading-levels': 'error',
//         // '@html-eslint/require-form-method': 'error',
//         // '@html-eslint/require-frame-title': 'error',
//         // '@html-eslint/require-input-label': 'error',
//         // '@html-eslint/require-meta-viewport': 'error',
//         //
//         // // ===== STYLE (all disabled) =====
//         // '@html-eslint/attrs-newline': 'off',
//         // '@html-eslint/element-newline': 'off',
//         // '@html-eslint/id-naming-convention': 'off',
//         // '@html-eslint/indent': 'off',
//         // '@html-eslint/lowercase': 'off',
//         // '@html-eslint/max-element-depth': 'off',
//         // '@html-eslint/no-extra-spacing-attrs': 'off',
//         // '@html-eslint/no-multiple-empty-lines': 'off',
//         // '@html-eslint/no-trailing-spaces': 'off',
//         // '@html-eslint/quotes': 'off',
//         // '@html-eslint/sort-attrs': 'off',
//
//         'nuxt-analyze/link-descriptive-text': 'error',
//         'nuxt-analyze/link-no-whitespace': 'error',
//         'nuxt-analyze/link-ascii-only': 'error',
//         'nuxt-analyze/link-lowercase': 'error',
//         'nuxt-analyze/link-no-double-slashes': 'error',
//         'nuxt-analyze/link-no-underscores': 'error',
//         'nuxt-analyze/link-requires-href': 'error',
//         'nuxt-analyze/link-trailing-slash': ['error', { requireTrailingSlash: options.trailingSlash }],
//         'nuxt-analyze/link-valid-router-path': 'error',
//       },
//     },
//   ]
// }
