import { createRule, useAnchorLinks } from '../utils'

const listOfBadDescriptiveLinkTexts = [
  'click here',
  'click this',
  'go',
  'here',
  'this',
  'start',
  'right here',
  'more',
  'learn more',
  'read more',
  'continue',
  'link',
  'view',
  'details',
  'read',
  'discover',
  'more',
]

export const rule = createRule<'default', []>({
  name: 'link-descriptive-text',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures links have descriptive text content for better SEO and accessibility',
      recommended: true,
      category: 'Accessibility',
    },
    messages: {
      default: 'Link text "{{ textContent }}" should be more descriptive.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return useAnchorLinks(context, (link, node) => {
      const anchorLabel = link.textContent || link.title || link['aria-label']

      // Check if link text exists
      if (!anchorLabel) {
        context.report({
          node,
          messageId: 'default',
          data: { textContent: 'Missing link textContent, title or aria-label.' },
        })
        return
      }

      if (typeof anchorLabel === 'object') {
        return
      }

      const uniformLinkText = anchorLabel.trim().toLowerCase()

      // Check against list of non-descriptive texts
      if (listOfBadDescriptiveLinkTexts.includes(uniformLinkText)) {
        context.report({
          node,
          messageId: 'default',
          data: { textContent: anchorLabel },
        })
      }
    }, { tags: ['a', 'nuxtlink'] })
  },
})
