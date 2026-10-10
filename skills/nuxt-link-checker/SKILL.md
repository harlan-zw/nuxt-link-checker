---
name: nuxt-link-checker
description: Find and fix broken or SEO unfriendly links in a Nuxt app with the nuxt-link-checker module. Use when a task mentions broken links, 404 links, link checking on build, failOnError, excludeLinks, excludePages, skipInspections, link checker reports, live inspections, the linkChecker config key, or the link-checker/valid-route ESLint rule. Gives the build scan scope, verified config, and the traps that make the checker pass silently or flag valid links.
license: MIT
compatibility: "Requires a project using nuxt-link-checker. Requires Node.js ^22.22.3 || ^24.15.0 || >=26.0.0. Requires Nuxt ^4.6.0 || ^5.0.0."
---

# nuxt-link-checker

Tested against the `nuxt-link-checker` release after 5.3.0 on Nuxt 4.5 (peer range Nuxt 3.9 to 5).
The module inspects every `<a href>` in rendered HTML with 15 rules, at build time and in dev.
It also ships two ESLint rules. Docs: https://nuxtseo.com/docs/link-checker

## Setup

Config key: `linkChecker`. The module installs `nuxt-site-config` for you.
`@nuxtjs/seo` already includes this module. Do not add it twice.

Set `site.url` to the production origin. The checker resolves internal links against it (see Traps).
The `trailing-slash` rule reads `site.trailingSlash`, not a `linkChecker` option.

## Automatic behaviour

- **Build scan.** After prerendering, the module inspects the links on each prerendered HTML page. It prints a tree per page, then a summary.
- **Only prerendered pages are scanned.** A plain `nuxt build` with no prerendered routes runs no inspections and logs `Nuxt Link Checker scanned no pages`. Use `nuxt generate`, or add routes to `nitro.prerender.routes`.
- **The whole page is scanned**, including `<Teleport to="body">` links. An `<a>` without `href` gets a `no-missing-href` warning unless it has `role="button"`.
- **Default exclusions.** `excludeLinks` starts with `/^\/_/` and `/^\/llms(-[\w-]+)?\.txt$/`. Your entries are added to these; they do not replace them. With a non root `app.baseURL`, the base URL is also excluded.
- **External links are not fetched.** `fetchRemoteUrls` is `false`, so every absolute external link counts as a 200.
- **Links to files in `public/` pass** without a request.
- **Dev.** With Nuxt DevTools on, the module adds a Link Checker DevTools tab and `/__link-checker__/*` server routes. On page squiggles need `showLiveInspections: true`.
- **ESLint.** With `@nuxt/eslint`, the module registers `link-checker/valid-route` (error) and `link-checker/valid-sitemap-link` (warn) for `.vue`, `.ts`, and `.md` files.

## Fail CI on broken links

```ts
export default defineNuxtConfig({
  modules: ['nuxt-link-checker'],
  site: { url: 'https://example.com' },
  nitro: { prerender: { routes: ['/'], crawlLinks: true } },
  linkChecker: {
    failOnError: true,
    report: { json: true, markdown: true },
  },
})
```

Only errors fail the build. Errors come from `no-error-response`, `missing-hash`, and `no-javascript`. Every other rule is a warning.
The count is the number of links with an error, not the number of errors.

With `crawlLinks: true`, Nitro crawls the broken link too and fails the build on its 404 before `failOnError` matters. To keep the build green and still get the report, set `nitro.prerender.failOnError: false`.

## Reports

`report.html`, `report.markdown`, and `report.json` write `link-checker-report.<ext>` to `.output/`.
When any report is on, the console shows only the summary. Read the report file for the link list.

- `report.storage`: a path relative to the root, or `unstorage` options.
- `report.publish: true` writes to `.output/public/__link-checker__/`. It adds `X-Robots-Tag: noindex` and a robots.txt disallow. The report is still public.

The JSON report is an array of `{ route, reports }`. Each report has `link`, `textContent`, `error[]`, `warning[]`, and `fix`. `fix` is the suggested link, such as `/about` for a typo `/abot`.

## Exclude links and pages

```ts
export default defineNuxtConfig({
  linkChecker: {
    excludeLinks: ['/admin/**', '/api/*', /\.(pdf|zip)$/],
    excludePages: ['/embed/**'],
    skipInspections: ['link-text', 'no-underscores'],
  },
})
```

- `excludeLinks` matches the link. `excludePages` matches the page that contains the link and skips all its links.
- String patterns are radix3 routes, not globs. `*` is one whole segment and `**` is any depth. `/_nuxt/file_*.pdf` never matches. Use a RegExp for part of a segment.
- `skipInspections` takes rule ids. The ids are: `absolute-site-urls`, `link-text`, `missing-hash`, `no-baseless`, `no-double-slashes`, `no-duplicate-query-params`, `no-error-response`, `no-javascript`, `no-missing-href`, `no-non-ascii-chars`, `no-underscores`, `no-uppercase-chars`, `no-whitespace`, `redirects`, `trailing-slash`. An unknown id does nothing and gives no warning.

## ESLint without @nuxt/eslint

```js
// eslint.config.mjs
import linkCheckerPlugin from 'nuxt-link-checker/eslint'
import vueParser from 'vue-eslint-parser'

export default [
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: { parser: vueParser },
    plugins: { 'link-checker': linkCheckerPlugin },
    rules: {
      'link-checker/valid-route': 'error',
      'link-checker/valid-sitemap-link': 'warn',
    },
  },
  // Markdown: same plugin and rules, plus processor: 'link-checker/markdown'
]
```

The rules read `.nuxt/link-checker/routes.json`. Run `nuxt prepare` or `nuxt dev` before `eslint` in CI.
`valid-sitemap-link` checks nothing until `nuxt dev` merges the `@nuxtjs/sitemap` URLs into that file.
Pass `{ rootDir }` or `{ routesFile }` as the rule option when ESLint runs from another directory.
Only literal links that start with `/` are checked. Skip one link with `rel="nofollow"` or an `eslint-disable-next-line` comment.

## Traps

- **No `routes.json`, no ESLint errors.** Without `nuxt prepare`, both ESLint rules pass every link. ESLint prints one `[nuxt-link-checker] ... not found` warning, and still exits 0.
- **Links to pages that are not prerendered are checked against the live site.** The module sends a `HEAD` request to `site.url` + path. A new SSR only page that is not deployed yet reports a 404. A page that exists only in production passes. Add such pages to `excludeLinks`, or prerender them.
- **Read the failure message, not only the rule id.** An HTTP error reports the status the server sent. A server that rejects `HEAD` with 405 or 501 gets a `GET` retry. A DNS error or a refused connection reports `Could not reach the link (ENOTFOUND)` with the cause code. A timeout reports 408.
- **Rules chain on the fix.** When one rule proposes a fix, later rules test the fixed link. `/about/` that 404s reports only the 404, not the trailing slash.
- **Different results per mode.** Build scans read prerender status codes. Dev scans fetch the dev server. ESLint reads route patterns only and ignores `excludeLinks`.

## Version limits

These v1 options are gone. The module logs a warning that names the replacement, then ignores them:

- `exclude`: use `excludeLinks`.
- `failOn404`: use `failOnError`.
- `siteUrl` and `trailingSlash`: set `site.url` and `site.trailingSlash`.

The ESLint rules and `nuxt-link-checker/eslint` exist from v5.0.0.

## Config

- `enabled` (`true`), `runOnBuild` (`true`), `failOnError` (`false`), `debug` (`false`).
- `fetchTimeout` (`10000` ms), `fetchRemoteUrls` (`false`). With `fetchRemoteUrls: true` the module checks that you are online first and turns itself off if not.
- Full reference: https://nuxtseo.com/docs/link-checker/api/config

## Debug

- `/__link-checker__/debug.json` in dev shows the resolved config, including the serialized exclude patterns.
- `debug: true` writes `debug-link-responses.json` next to the reports, with the status the module used for each link.
