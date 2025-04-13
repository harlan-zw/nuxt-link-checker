import {asStringLiteral, createRule, useAnchorLinks} from '../utils'

export const rule = createRule<'default', []>({
  name: 'link-no-whitespace',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures the link href or to does not contain any whitespace characters.',
      category: 'SEO',
    },
    messages: {
      default: 'Link URL should not contain whitespace characters.',
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

      // Check for whitespace in the URL
      if (/\s/.test(urlValue)) {
        const attrNode = link.hrefNode || link.toNode
        if (!attrNode)
          return

        context.report({
          node,
          messageId: 'default',
          fix(fixer) {
            // Replace whitespace characters with their encoded versions
            const encodedValue = urlValue.replace(/\s/g, match => encodeURIComponent(match))
            return fixer.replaceText(attrNode, asStringLiteral(context, encodedValue))
          },
        })
      }
    }, { tags: ['a', 'nuxtlink'] })
  },
})

export default rule
