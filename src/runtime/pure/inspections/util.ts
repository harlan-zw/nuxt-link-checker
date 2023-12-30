import type { Rule } from '../../types'

export function defineRule(rule: Rule) {
  return rule
}

export function isNonFetchableLink(link: string) {
  return link.startsWith('javascript:') || link.startsWith('blob:') || link.startsWith('data:') || link.startsWith('mailto:')
    || link.startsWith('tel:')
    || link.startsWith('#')
}
