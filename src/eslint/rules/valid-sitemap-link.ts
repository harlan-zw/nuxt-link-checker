import type { Rule } from 'eslint'
import { createRouteMatcher, createSuggester, loadRoutes } from '../utils/routes'
import { createCombinedVisitors, stripQueryAndHash } from '../utils/visitors'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Validate that relative URLs exist in the sitemap',
    },
    schema: [{
      type: 'object',
      properties: {
        routesFile: { type: 'string' },
        rootDir: { type: 'string' },
      },
      additionalProperties: false,
    }],
    messages: {
      notInSitemap: 'Link "{{link}}" is not in the sitemap.{{suggestion}}',
    },
  },
  create(context) {
    const options = context.options[0] as { routesFile?: string, rootDir?: string } | undefined
    const routes = loadRoutes({ routesFile: options?.routesFile, rootDir: options?.rootDir })

    if (!routes.staticRoutes.length)
      return {}

    const staticSet = new Set(routes.staticRoutes)
    const matchDynamic = createRouteMatcher(routes.dynamicRoutes)
    const suggest = createSuggester(routes.staticRoutes)

    // Build a set of dynamic patterns that have at least one URL in the sitemap
    // so we can warn when a dynamic route's specific URL is missing from sitemap
    const patternsWithSitemapEntries = new Set<string>()
    for (const url of routes.staticRoutes) {
      const match = matchDynamic(url)
      if (match)
        patternsWithSitemapEntries.add(url)
    }

    const check = (link: string, node: any) => {
      if (!link.startsWith('/'))
        return

      const pathname = stripQueryAndHash(link)

      // Already in sitemap, all good
      if (staticSet.has(pathname))
        return

      // If it matches a dynamic route, only warn if other URLs
      // with the same pattern exist in the sitemap (suggesting this one should too)
      if (matchDynamic(pathname)) {
        // Check if any sibling URLs exist in the sitemap for this pattern
        // If the pattern has no sitemap entries at all, skip the warning
        // (user may have intentionally excluded the whole pattern)
        const hasSiblings = routes.staticRoutes.some(url => matchDynamic(url))
        if (!hasSiblings)
          return
      }

      const suggested = suggest(pathname)
      const suggestion = suggested ? ` Did you mean "${suggested}"?` : ''

      context.report({
        node,
        messageId: 'notInSitemap',
        data: { link: pathname, suggestion },
      })
    }

    return createCombinedVisitors(context, check)
  },
}

export default rule
