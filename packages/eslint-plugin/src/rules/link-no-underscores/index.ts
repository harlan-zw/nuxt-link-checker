import {asStringLiteral, createRule, useAnchorLinks} from '../utils'

export const rule = createRule<'default', []>({
  name: 'link-no-underscores',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures URLs do not contain underscores',
      recommended: true,
      category: 'SEO',
    },
    messages: {
      default: 'Links should not contain underscores.',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    return useAnchorLinks(context, (link, node) => {
      // Check href or to attributes
      const urlValue = link.href || link.to

      if (!urlValue)
        return

      // Skip external URLs
      if (urlValue.match(/^(https?:)?\/\//))
        return

      // Check for underscores in the path
      if (urlValue.includes('_')) {
        const attrNode = link.hrefNode || link.toNode
        if (!attrNode)
          return

        context.report({
          node,
          messageId: 'default',
          fix(fixer) {
            // Replace underscores with hyphens
            const fixedValue = urlValue.replaceAll('_', '-')
            return fixer.replaceText(attrNode, asStringLiteral(context, fixedValue))
          },
        })
      }
    }, { tags: ['a', 'nuxtlink'] })
  },
})

export default rule
