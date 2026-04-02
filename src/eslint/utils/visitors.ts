import type { Rule } from 'eslint'

const LINK_ELEMENTS = new Set(['a', 'NuxtLink', 'nuxt-link', 'RouterLink', 'router-link'])
const LINK_ATTRS = new Set(['to', 'href'])
const SKIP_PREFIXES = ['http://', 'https://', '//', 'mailto:', 'tel:', 'javascript:', 'blob:', 'data:', 'ftp:']
const WHITESPACE_RE = /\s+/
const STATIC_FILE_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.avif',
  '.mp3',
  '.mp4',
  '.webm',
  '.ogg',
  '.wav',
  '.zip',
  '.gz',
  '.tar',
  '.rar',
  '.xml',
  '.txt',
  '.json',
  '.csv',
  '.rss',
  '.atom',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.js',
  '.css',
  '.map',
])

export function shouldSkipLink(link: string): boolean {
  if (!link || link === '#' || link.startsWith('#'))
    return true
  if (SKIP_PREFIXES.some(prefix => link.startsWith(prefix)))
    return true
  // Skip links to static files (served from public/, not vue-router)
  const pathname = (link.split('?')[0] ?? '').split('#')[0] ?? ''
  const lastDot = pathname.lastIndexOf('.')
  if (lastDot !== -1 && STATIC_FILE_EXTENSIONS.has(pathname.slice(lastDot).toLowerCase()))
    return true
  return false
}

export function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

export function stripQueryAndHash(link: string): string {
  const hashIndex = link.indexOf('#')
  const queryIndex = link.indexOf('?')
  const endIndex = Math.min(
    hashIndex === -1 ? link.length : hashIndex,
    queryIndex === -1 ? link.length : queryIndex,
  )
  return link.slice(0, endIndex)
}

type ReportFn = (link: string, node: unknown) => void

function hasRelNofollow(element: any): boolean {
  const attrs = element.startTag?.attributes ?? element.attributes ?? []
  return attrs.some((attr: any) =>
    !attr.directive
    && attr.key?.name === 'rel'
    && typeof attr.value?.value === 'string'
    && attr.value.value.split(WHITESPACE_RE).includes('nofollow'),
  )
}

function createTemplateVisitors(report: ReportFn): Record<string, (node: any) => void> {
  return {
    'VAttribute[directive=false]': function (node: any) {
      if (!LINK_ATTRS.has(node.key?.name))
        return
      const parent = node.parent?.parent
      if (!parent || !LINK_ELEMENTS.has(parent.rawName))
        return
      if (hasRelNofollow(parent))
        return
      const value = node.value?.value
      if (typeof value === 'string' && !shouldSkipLink(value))
        report(value, node)
    },
    'VAttribute[directive=true][key.name.name="bind"]': function (node: any) {
      if (!LINK_ATTRS.has(node.key?.argument?.name))
        return
      const parent = node.parent?.parent
      if (!parent || !LINK_ELEMENTS.has(parent.rawName))
        return
      if (hasRelNofollow(parent))
        return
      const expr = node.value?.expression
      if (expr?.type === 'Literal' && typeof expr.value === 'string' && !shouldSkipLink(expr.value))
        report(expr.value, expr)
    },
  }
}

function createScriptVisitors(report: ReportFn): Record<string, (node: any) => void> {
  return {
    CallExpression(node: any) {
      const callee = node.callee
      if (!callee)
        return

      let isNavCall = false

      if (callee.type === 'Identifier' && callee.name === 'navigateTo')
        isNavCall = true

      if (
        callee.type === 'MemberExpression'
        && callee.object?.type === 'Identifier'
        && callee.object.name === 'router'
        && callee.property?.type === 'Identifier'
        && (callee.property.name === 'push' || callee.property.name === 'replace')
      ) {
        isNavCall = true
      }

      if (!isNavCall)
        return

      const arg = node.arguments?.[0]
      if (arg?.type === 'Literal' && typeof arg.value === 'string' && !shouldSkipLink(arg.value))
        report(arg.value, arg)
    },
  }
}

export function createCombinedVisitors(context: Rule.RuleContext, check: (link: string, node: any) => void): Record<string, (node: any) => void> {
  const isVue = context.filename.endsWith('.vue')
  const scriptVisitors = createScriptVisitors(check)

  if (isVue) {
    const parserServices = context.sourceCode.parserServices as any
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        createTemplateVisitors(check),
        scriptVisitors,
      )
    }
  }

  return scriptVisitors
}
