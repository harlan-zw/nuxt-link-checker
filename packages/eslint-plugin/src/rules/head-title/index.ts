import {createRule, extractChildrenStringLiterals, isVueParser} from '../utils'

export const rule = createRule<'missing' | 'empty', []>({
  name: 'head-title',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure head has a title tag with content',
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
    // Return early for Vue templates as we only check HTML
    if (isVueParser(context)) {
      return {}
    }

    let titleNode
    let headNode
    return {
      // Check for head tag
      Tag(node) {
        if (node.name === 'title') {
          titleNode = node
        } else if (node.name === 'head') {
          headNode = node
        }
      },
      'Program:exit'() {
        if (!titleNode && headNode) {
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
        if (titleNode) {
          const titleContent = extractChildrenStringLiterals(titleNode)
          if (!titleContent.trim().length) {
            context.report({
              node: titleNode,
              messageId: 'empty',
            })
          }
        }
      },
    }
  },
})
