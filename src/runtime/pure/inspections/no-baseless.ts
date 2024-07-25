import { joinURL } from 'ufo'
import { defineRule, isNonFetchableLink } from './util'

export default function RuleNoBaseLess() {
  return defineRule({
    id: 'no-baseless',
    test({ link, fromPath, report }) {
      if (link.startsWith('/') || link.startsWith('http') || isNonFetchableLink(link))
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
