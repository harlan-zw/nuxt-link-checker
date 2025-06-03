import { createRule, processHtmlHead, useNuxtOptions } from '../../utils'

export const rule = createRule<'duplicate', []>({
  name: 'duplicate-title',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure page titles are unique across the site',
      action: 'duplicate title tags',
      recommended: true,
      category: 'SEO',
      headInput: {
        title: 'Unique Title',
      },
    },
    messages: {
      duplicate: 'The title "{{title}}" is used on {{count}} other page(s)',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { titles } = useNuxtOptions(context)
    if (!titles) {
      return {}
    }
    // HTML parser only
    return processHtmlHead(context, {
      title(input, node) {
        const titleText = input.trim()
        if (titleText && titles[titleText] > 1) {
          context.report({
            node,
            messageId: 'duplicate',
            data: {
              title: titleText,
              count: titles[titleText] - 1,
            },
          })
        }
      },
    })
  },
})
