import { createRule, processHtmlHead } from '../../utils'

export const rule = createRule<'missing' | 'empty', []>({
  name: 'missing-title',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure head has a title tag with content',
      action: 'missing title tags',
      recommended: true,
      category: 'SEO',
      headInput: {
        title: 'Hello World',
      },
    },
    messages: {
      missing: 'The head element is missing a title tag',
      empty: 'The title tag must not be empty',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // HTML parser only
    return processHtmlHead(context, {
      title(input, node) {
        if (!input.trim()) {
          context.report({
            node,
            messageId: 'empty',
          })
        }
      },
      all(input) {
        if (typeof input.title === 'undefined') {
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
