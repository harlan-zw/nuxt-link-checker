import { createRule, useAnchorLinks } from '../utils'

export const rule = createRule<'default', []>({
  name: 'link-requires-href',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures anchor tags have an href attribute for accessibility',
      recommended: true,
      category: 'SEO',
    },
    messages: {
      default: 'For accessibility and UX anchor tags require a href attribute.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return useAnchorLinks(context, (link, node) => {
      // Check if it has a href, to, or role="button" attribute
      const hasHrefOrTo = !!(link.href || link.to)
      const hasRoleButton = link.role === 'button'

      // If it has href/to or role="button", it's valid
      if (hasHrefOrTo || hasRoleButton) {
        return
      }

      const linkNode = link.hrefNode || link.toNode
      // ignore dynamic links
      if (linkNode?.type === 'VExpressionContainer') {
        return
      }

      // Otherwise report the issue
      context.report({
        node,
        messageId: 'default',
      })
    }, { tags: ['a', 'nuxtlink'] })
  },
})

export default rule
