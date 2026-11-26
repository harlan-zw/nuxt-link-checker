import type { Rule } from '../../types'

const FILE_EXTENSION_RE = /\.([0-9a-z]+)$/i

export function hasConfiguredFileExtension(path: string, fileExtensions: unknown): boolean {
  if (!Array.isArray(fileExtensions))
    return false

  const extension = path.match(FILE_EXTENSION_RE)?.[1]?.toLowerCase()
  return !!extension && fileExtensions.some(extra =>
    typeof extra === 'string' && extra.replace(/^\./, '').toLowerCase() === extension,
  )
}

export function defineRule(rule: Rule): Rule {
  return rule
}

export function isNonFetchableLink(link: string): boolean {
  const trimmedLink = link.trim().toLowerCase()
  return trimmedLink.startsWith('javascript:') || trimmedLink.startsWith('blob:') || trimmedLink.startsWith('data:') || trimmedLink.startsWith('mailto:')
    || trimmedLink.startsWith('tel:') || trimmedLink.startsWith('vbscript:')
    || trimmedLink.startsWith('#')
}

// 300 and 304 are 3xx statuses, but they do not redirect the client
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

export function isRedirectStatus(status: unknown): boolean {
  return typeof status === 'number' && REDIRECT_STATUSES.has(status)
}

export function isErrorStatus(status: unknown): boolean {
  return typeof status === 'number' && (status < 200 || status >= 400)
}
