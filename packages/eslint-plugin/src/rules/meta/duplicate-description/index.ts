import { createRule, processHtmlHead, useNuxtOptions } from '../../utils'

export const rule = createRule<'duplicate', []>({
  name: 'duplicate-description',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure meta descriptions are unique across the site',
      action: 'duplicate meta descriptions',
      recommended: true,
      category: 'SEO',
      headInput: {
        meta: [
          { name: 'description', content: 'Unique description for this page' },
        ],
      },
    },
    messages: {
      duplicate: 'This meta description "{{description}}" is used on {{count}} other page(s)',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { descriptions } = useNuxtOptions(context)
    if (!descriptions) {
      return {}
    }
    return processHtmlHead(context, {
      meta(input, node) {
        if (input.name === 'description') {
          const content = input.content?.trim()
          if (content && descriptions[content] > 1) {
            context.report({
              node,
              messageId: 'duplicate',
              data: {
                description: content,
                count: descriptions[content] - 1,
              },
            })
          }
        }
      },
    })
  },
})
