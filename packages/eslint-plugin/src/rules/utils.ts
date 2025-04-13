import type { Rule } from 'eslint'
import type { AST } from 'vue-eslint-parser'
import { ESLintUtils } from '@typescript-eslint/utils'

export function createRule<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(
  rule: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
) {
  const _createRule = ESLintUtils.RuleCreator(
    name => `https://nuxtseo.com/analyze/rules/${name}`,
  )
  return _createRule(rule) as unknown as Rule.RuleModule
}

interface VueTemplateListener extends Rule.NodeListener {
  VAttribute?: (node: AST.VAttribute) => void
  VElement?: (node: AST.VElement) => void
  VText?: (node: AST.VText) => void
}

export function isVueParser(context: Rule.RuleContext) {
  const parserServices = getParserServices(context)
  return !!parserServices?.defineTemplateBodyVisitor
}

export function asStringLiteral(context: Rule.RuleContext, s: string): string {
  return isVueParser(context) ? `"${s}"` : s
}

export function extractChildrenStringLiterals(
  node: AST.VElement | AST.VText,
): string[] {
  if (node.type === 'VElement') {
    return String(node.children
      .filter((child) => child.type === 'VText')
      .map((child) => child.value.trim()).join(' ')).trim()
  }
  return String(node.children?.filter((child => child.type === 'Text')).map((child) => child.value.trim()).join(' ')).trim()
}

export function useAnchorLinks(context: Rule.RuleContext, processor: (link: { href?: string, textContent?: string } & Record<string, string>, node: any) => void, opts: { tags: string[] }) {
  if (!isVueParser(context)) {
    return {
      Tag(node) {
        if (node.name === 'a') {
          const textContent = node.children?.[0]?.value
          processor({
            ...node.attributes.reduce((acc, attr) => {
              if (attr.key) {
                acc[attr.key.value] = attr.value?.value
              }
              acc[`${attr.key.value}Node`] = attr.value
              return acc
            }, {}),
            textContent,
          }, node)
        }
      },
    }
  }

  const parserServices = getParserServices(context)
  const templateBody = parserServices.defineTemplateBodyVisitor
  return templateBody({
    VElement(node) {
      const elementName = node.name.toLowerCase()
      if (!opts.tags.includes(elementName)) {
        return
      }

      // Try to get text content from element
      let textContent = ''
      if (node.children) {
        node.children.forEach((child) => {
          if (child.type === 'VText' && child.value.trim()) {
            textContent = child.value.trim()
          }
        })
      }
      const props = node.startTag.attributes.reduce((acc, attr) => {
        let keyName = attr.key?.name
        if (attr.key.type === 'VDirectiveKey') {
          keyName = attr.key.argument?.name
        }
        // only include literals
        if (attr.key && attr.value.type === 'VLiteral') {
          acc[keyName] = attr.value?.value
        }
        acc[`${keyName}Node`] = attr.value
        return acc
      }, {})
      processor({
        ...props,
        textContent,
      }, node)
    },
  })
}

// Taken directly from eslint-plugin-vue
function defineTemplateBodyVisitor(
  context: Rule.RuleContext,
  templateVisitor: VueTemplateListener,
  scriptVisitor?: Rule.RuleListener,
) {
  const parserServices = getParserServices(context)
  if (!parserServices?.defineTemplateBodyVisitor) {
    return {}
  }
  return parserServices.defineTemplateBodyVisitor(
    templateVisitor,
    scriptVisitor,
  )
}

/**
 * This function is API compatible with eslint v8.x and eslint v9 or later.
 * @see https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/#from-context-to-sourcecode
 */
function getParserServices(context: Rule.RuleContext) {
  const legacy = context.sourceCode

  return legacy ? legacy.parserServices : context.parserServices
}

export default defineTemplateBodyVisitor
