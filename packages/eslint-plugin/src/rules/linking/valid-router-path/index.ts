import { asStringLiteral, createRule, useAnchorLinks, useNuxtOptions } from '../../utils'

export const rule = createRule<'invalidPath' | 'validationError', [{ matcher?: any, matcherKey?: string }]>({
  name: 'link-valid-router-path',
  meta: {
    type: 'problem',
    docs: {
      action: 'invalid path',
      description: 'Enforce valid vue-router paths',
      recommended: true,
      category: 'SEO',
    },
    messages: {
      invalidPath: 'Invalid router path: \`{{path}}\` does not match any registered route',
      validationError: 'Error validating router path: \'{{path}}\'',
    },
    schema: [
      {
        type: 'object',
        properties: {
          matcher: {
            type: 'object',
          },
          matcherKey: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    hasSuggestions: true,
  },
  defaultOptions: [{ matcher: undefined, matcherKey: undefined }],
  create(context) {
    // Try to get the matcher from options or shared state
    const { routerMatcher: matcher, pageSearch: searcher } = useNuxtOptions(context)

    if (!matcher) {
      return {}
    }

    return useAnchorLinks(context, (link, node) => {
      // Get path from href or to attribute
      const path = link.href || link.to

      if (!path)
        return

      // explicit external link
      if (link.external) {
        return
      }

      // Skip external links, anchors, tel:, mailto:, etc.
      if (path.startsWith('http') || path.startsWith('#')
        || path.includes(':') || path === '/' || path === '') {
        return
      }

      const pathAttribute = link.hrefNode || link.toNode
      if (!pathAttribute)
        return

      try {
        // Try to resolve the path using the provided matcher
        const { matched } = matcher.resolve({ path }, { meta: {}, params: {}, matched: [], name: 'index', path: '/' })

        // If the match failed (returns undefined or null)
        if (!matched?.length) {
          // try and find a suggestion
          if (searcher) {
            const results = searcher.search(path)
            if (results.length > 0) {
              const suggestions = results.map(result => result.item.path)

              context.report({
                node,
                messageId: 'invalidPath',
                data: { path },
                suggest: suggestions.map(suggestion => ({
                  desc: `Change to '${suggestion}'`,
                  fix: (fixer) => {
                    return fixer.replaceText(
                      pathAttribute,
                      asStringLiteral(context, suggestion),
                    )
                  },
                })),
              })
              return
            }
          }
          context.report({
            node,
            messageId: 'invalidPath',
            data: { path },
          })
        }
      }
      catch (error) {
        context.report({
          node,
          messageId: 'validationError',
          data: { path },
        })
      }
    })
  },
})

export default rule
