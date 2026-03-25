import type { Rule } from 'eslint'
import { createRouteMatcher, createSuggester, loadRoutes } from '../utils/routes'
import { createCombinedVisitors, stripQueryAndHash } from '../utils/visitors'

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate that relative URLs match a known vue-router route pattern',
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
      invalidRoute: 'Link "{{link}}" does not match any known route.{{suggestion}}',
    },
  },
  create(context) {
    const options = context.options[0] as { routesFile?: string, rootDir?: string } | undefined
    const routes = loadRoutes({ routesFile: options?.routesFile, rootDir: options?.rootDir })

    if (!routes.staticRoutes.length && !routes.dynamicRoutes.length)
      return {}

    const allStaticSet = new Set(routes.staticRoutes)
    const matchDynamic = createRouteMatcher(routes.dynamicRoutes)
    const suggest = createSuggester(routes.staticRoutes)

    const check = (link: string, node: any): void => {
      // Only check relative links starting with /
      if (!link.startsWith('/'))
        return

      const pathname = stripQueryAndHash(link)

      // Check exact match against static routes
      if (allStaticSet.has(pathname))
        return

      // Check dynamic route patterns
      if (matchDynamic(pathname))
        return

      const suggested = suggest(pathname)
      const suggestion = suggested ? ` Did you mean "${suggested}"?` : ''

      context.report({
        node,
        messageId: 'invalidRoute',
        data: { link: pathname, suggestion },
      })
    }

    return createCombinedVisitors(context, check)
  },
}

export default rule
