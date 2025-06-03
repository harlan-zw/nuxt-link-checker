import { joinURL, parseURL, withLeadingSlash } from 'ufo'
import { asStringLiteral, createRule, useAnchorLinks } from '../../utils'

export const rule = createRule<'default', []>({
  name: 'link-no-double-slashes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures URLs do not contain double slashes in the path',
      recommended: true,
      category: 'SEO',
    },
    messages: {
      default: 'Link "{{url}}" should not contain double slashes.',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    return useAnchorLinks(context, (link, node) => {
      // Process both href and to attributes
      const urlValue = link.href || link.to
      if (!urlValue) {
        return
      }
      const url = parseURL(urlValue)
      // Skip protocol-relative URLs (//example.com)
      if (url.protocol || url.host) {
        return
      }

      // test for multiple slashes in a row
      if (!url.pathname.match(/\/{2,}/)) {
        // Skip root URLs
        return
      }

      // Check for double slashes in the path segment (but not at the beginning of protocol-relative URLs)
      context.report({
        node,
        messageId: 'default',
        data: {
          url: urlValue,
        },
        fix(fixer) {
          // Replace consecutive slashes with a single slash
          // but preserve protocol slashes if present
          const fixedPath = withLeadingSlash(
            url.pathname
              .split('/')
              .filter(Boolean)
              .reduce((acc, part) => {
                return joinURL(acc, part.replace('/', ''))
              }, ''),
          )
          const fixedURL = `${fixedPath}${url.search}${url.hash}`
          const node = link.hrefNode || link.toNode
          return fixer.replaceText(node, asStringLiteral(context, fixedURL))
        },
      })
    })
  },
})
