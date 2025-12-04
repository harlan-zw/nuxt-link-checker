import { joinURL } from 'ufo'
import { defineRule, isNonFetchableLink } from './util'

export default function RuleNoDocumentRelative() {
  return defineRule({
    id: 'no-baseless', // TODO rename to no-document-relative
    test({ link, fromPath, report }) {
      if (link.startsWith('#') || link.startsWith('/') || link.startsWith('http') || isNonFetchableLink(link))
        return

      report({
        name: 'no-baseless',
        scope: 'warning',
        message: 'Links should be root relative.',
        fix: `${joinURL(fromPath, link)}`,
        fixDescription: `Add base ${fromPath}.`,
      })
    },
  })
}
