import { joinURL } from 'ufo'
import { defineRule, isInvalidLinkProtocol } from './util'

export default function RuleNoBaseLess() {
  return defineRule({
    test({ link, fromPath, report }) {
      if (link.startsWith('/') || link.startsWith('http') || isInvalidLinkProtocol(link) || link.startsWith('#'))
        return

      report({
        name: 'no-baseless',
        scope: 'warning',
        message: 'Should not have a base.',
        fix: `${joinURL(fromPath, link)}`,
        fixDescription: `Add base ${fromPath}.`,
      })
    },
  })
}
