import {asStringLiteral, createRule, useAnchorLinks} from '../utils'

export const rule = createRule<'default', []>({
  name: 'link-lowercase',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures URLs do not contain uppercase characters',
      recommended: true,
      category: 'SEO',
    },
    messages: {
      default: 'Links should not contain uppercase characters.',
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

      // Check for uppercase characters
      if (urlValue.match(/[A-Z]/)) {
        const attrNode = link.hrefNode || link.toNode
        if (!attrNode)
          return

        context.report({
          node,
          messageId: 'default',
          fix(fixer) {
            // Convert to lowercase
            return fixer.replaceText(attrNode, asStringLiteral(context, urlValue.toLowerCase()))
          },
        })
      }
    }, { tags: ['a', 'nuxtlink'] })
  },
})

export default rule
