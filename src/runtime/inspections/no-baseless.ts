import { isScriptProtocol, joinURL } from 'ufo'
import { getHeader } from 'h3'
import { defineRule } from './util'

export default function RuleNoBaseLess() {
  return defineRule({
    test({ link, e, report }) {
      if (link.startsWith('/') || link.startsWith('http') || isScriptProtocol(link) || link.startsWith('#'))
        return

      // get referrer
      const fromPath = getHeader(e, 'referer') || ''

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
