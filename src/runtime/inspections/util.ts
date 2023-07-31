import type { Rule } from '../types'

export function defineRule(rule: Rule) {
  return rule
}

export function isInvalidLinkProtocol(link: string) {
  return link.startsWith('javascript:') || link.startsWith('blob:') || link.startsWith('data:')
}
