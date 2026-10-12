import type { Rule } from '../../types'

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
