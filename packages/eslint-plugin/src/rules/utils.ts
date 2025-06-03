import type { Rule } from 'eslint'
import type Fuse from 'fuse.js'
import type { RawInput, SerializableHead } from 'unhead/types'
import type { AST } from 'vue-eslint-parser'
import type { RouteRecordNormalized, RouterMatcher } from 'vue-router'

export function createRule<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(
  rule: Readonly<Rule.RuleModule>,
) {
  // const _createRule = ESLintUtils.RuleCreator(
  //   name => `https://nuxtseo.com/analyze/rules/${name}`,
  // )
  return rule as unknown as Rule.RuleModule
}

export function useNuxtOptions(context: Rule.RuleContext) {
  return context.settings as {
    pageSearch: Fuse<RouteRecordNormalized>
    routerMatcher: RouterMatcher
    vueLinkComponents: Record<string, string[]>
    titles: Record<string, number>
    descriptions: Record<string, number>
  }
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
      .filter(child => child.type === 'VText')
      .map(child => child.value.trim()).join(' ')).trim()
  }
  return String(node.children?.filter(child => child.type === 'Text').map(child => child.value.trim()).join(' ')).trim()
}

export function processHtmlHead(context: Rule.RuleContext, processor: ({
  meta?: (ctx: RawInput<'meta'>, node: any) => void
  title?: (ctx: string, node: any) => void
  link?: (ctx: RawInput<'link'>, node: any) => void
  all?: (ctx: SerializableHead) => void
})) {
  if (isVueParser(context)) {
    return {}
  }
  // html parser
  const input: SerializableHead = {}
  return {
    Tag(node) {
      const normalizedAttrs = node.attributes.reduce((acc, attr) => {
        if (attr.key) {
          acc[attr.key.value] = attr.value?.value
        }
        acc[`${attr.key.value}Node`] = attr.value
        return acc
      }, {})
      normalizedAttrs.textContent = extractChildrenStringLiterals(node)
      if (node.name === 'meta' && processor.meta) {
        input.meta = input.meta || []
        input.meta.push(normalizedAttrs)
        processor.meta?.(normalizedAttrs, node)
        return
      }
      if (node.name === 'title') {
        input.title = normalizedAttrs.textContent
        processor.title?.(normalizedAttrs.textContent, node)
        return
      }
      if (node.name === 'link') {
        input.link = input.link || []
        input.link.push(normalizedAttrs)
        processor.link?.(normalizedAttrs, node)
      }
    },
    'Program:exit': function () {
      if (processor.all) {
        processor.all(input)
      }
    },
  }
}

export function useAnchorLinks(context: Rule.RuleContext, processor: (link: { href?: string, textContent?: string } & Record<string, string>, node: any) => void) {
  const { vueLinkComponents } = useNuxtOptions(context)
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

  const componentNames = Object.keys(vueLinkComponents).map(name => name.toLowerCase())
  const parserServices = getParserServices(context)
  const templateBody = parserServices.defineTemplateBodyVisitor
  return templateBody({
    VElement(node) {
      const elementName = node.name.toLowerCase()
      if (!componentNames.includes(elementName)) {
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
