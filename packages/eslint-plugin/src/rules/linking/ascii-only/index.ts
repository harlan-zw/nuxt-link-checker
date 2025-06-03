import { asStringLiteral, createRule, useAnchorLinks } from '../../utils'

export const rule = createRule<'default', []>({
  name: 'link-ascii-only',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures URLs do not contain non-ASCII characters',
      recommended: true,
      category: 'Linking',
    },
    messages: {
      default: 'Link "{{url}}" should not contain non-ASCII characters.',
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

      // Check for non-ASCII characters
      if (/[^\u0020-\u007F]/.test(urlValue)) {
        const attrNode = link.hrefNode || link.toNode
        if (!attrNode)
          return

        context.report({
          node,
          messageId: 'default',
          data: {
            url: urlValue,
          },
          fix(fixer) {
            // Replace non-ASCII characters with encoded versions
            const encodedValue = encodeURI(urlValue)
            return fixer.replaceText(attrNode, asStringLiteral(context, encodedValue))
          },
        })
      }
    })
  },
})

export default rule
