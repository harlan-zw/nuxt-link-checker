import {asStringLiteral, createRule, useAnchorLinks} from '../utils'

export const rule = createRule<'addTrailingSlash' | 'removeTrailingSlash', [{ requireTrailingSlash?: boolean }]>({
  name: 'link-trailing-slash',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforces consistent use of trailing slashes in URLs',
      category: 'SEO',
    },
    messages: {
      addTrailingSlash: 'URLs should end with a trailing slash',
      removeTrailingSlash: 'URLs should not end with a trailing slash',
    },
    schema: [
      {
        type: 'object',
        properties: {
          requireTrailingSlash: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: 'code',
  },
  defaultOptions: [{ requireTrailingSlash: false }],
  create(context) {
    const { requireTrailingSlash = false } = context.options[0] || {}

    return useAnchorLinks(context, (link, node) => {
      // Check href or to attributes
      const urlValue = link.href || link.to

      if (!urlValue)
        return

      // Skip external links, anchors, tel:, mailto:, etc.
      if (urlValue.startsWith('http') || urlValue.startsWith('#')
        || urlValue.includes(':') || urlValue === '/' || urlValue === '') {
        return
      }

      const hasTrailingSlash = urlValue.endsWith('/')
      const attrNode = link.hrefNode || link.toNode

      if (!attrNode)
        return

      if (requireTrailingSlash && !hasTrailingSlash) {
        context.report({
          node,
          messageId: 'addTrailingSlash',
          fix(fixer) {
            return fixer.replaceText(attrNode, asStringLiteral(context, `${urlValue}/`))
          },
        })
      }
      else if (!requireTrailingSlash && hasTrailingSlash) {
        context.report({
          node,
          messageId: 'removeTrailingSlash',
          fix(fixer) {
            return fixer.replaceText(attrNode, asStringLiteral(context, urlValue.slice(0, -1)))
          },
        })
      }
    }, { tags: ['a', 'nuxtlink', 'routerlink'] })
  },
})

export default rule
