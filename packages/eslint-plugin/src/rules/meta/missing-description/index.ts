import { createRule, processHtmlHead } from '../../utils'

export const rule = createRule<'missing' | 'empty', []>({
  name: 'meta-description',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure head has a meta description tag with content',
      action: 'missing meta description tags',
      recommended: true,
      category: 'SEO',
      headInput: {
        meta: [
          { name: 'description', content: 'This is a description of the page' },
        ],
      },
    },
    messages: {
      missing: 'The head element is missing a meta description tag',
      empty: 'The meta description content must not be empty',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Return early for Vue templates as we only check HTML
    return processHtmlHead(context, {
      meta(input, node) {
        if (input.name === 'description' && !input.content?.trim()) {
          context.report({
            node,
            messageId: 'empty',
          })
        }
      },
      all(input) {
        if (!input.meta?.some(meta => meta.name === 'description')) {
          context.report({
            messageId: 'missing',
            loc: {
              end: {
                column: 0,
                line: 0,
              },
              start: {
                column: 0,
                line: 0,
              },
            },
          })
        }
      },
    })
  },
})
