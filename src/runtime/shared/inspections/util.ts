import type { Rule } from '../../types'

export function defineRule(rule: Rule) {
  return rule
}

export function isNonFetchableLink(link: string) {
  const trimmedLink = link.trim().toLowerCase()
  return trimmedLink.startsWith('javascript:') || trimmedLink.startsWith('blob:') || trimmedLink.startsWith('data:') || trimmedLink.startsWith('mailto:')
    || trimmedLink.startsWith('tel:') || trimmedLink.startsWith('vbscript:')
    || trimmedLink.startsWith('#')
}
