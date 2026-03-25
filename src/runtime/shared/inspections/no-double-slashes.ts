import type { Rule } from '../../types'
import { defineRule } from './util'

const doubleSlashRe = /^\/{2,}|\/{2,}/g
const doubleSlashTestRe = /^\/{2,}|\/{2,}/

export default function RuleNoDoubleSlashes(): Rule {
  return defineRule({
    id: 'no-double-slashes',
    test({ url, link, report }) {
      // malformed protocol relative link
      if (link.startsWith('//') && !link.includes('.')) {
        report({
          name: 'no-double-slashes',
          scope: 'warning',
          message: 'Links should not contain double slashes.',
          fix: link.replaceAll(doubleSlashRe, '/'),
          fixDescription: 'Remove double slashes.',
        })
      }
      // we want to match any paths that have double slashes (or triple etc)
      else if (doubleSlashTestRe.test(url.pathname)) {
        report({
          name: 'no-double-slashes',
          scope: 'warning',
          message: 'Links should not contain double slashes.',
          fix: link.replace(url.pathname, url.pathname.replaceAll(doubleSlashRe, '/')),
          fixDescription: 'Remove double slashes.',
        })
      }
    },
  })
}
