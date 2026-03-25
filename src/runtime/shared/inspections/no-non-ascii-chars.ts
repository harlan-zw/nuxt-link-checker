import type { Rule } from '../../types'
import { defineRule } from './util'

const nonAsciiRe = /[^\u0020-\u007F]/

export default function RuleNoNonAsciiChars(): Rule {
  return defineRule({
    id: 'no-non-ascii-chars',
    test({ link, url, report }) {
      if (link.startsWith('#'))
        return
      // test path segments individually
      function test(s: string): void {
        if (nonAsciiRe.test(s)) {
          report({
            name: 'no-non-ascii-chars',
            scope: 'warning',
            message: 'Links should not contain non-ascii characters.',
            // fix is to uri encode the link
            fix: encodeURI(s),
            fixDescription: 'Encode non-ascii characters.',
          })
        }
      }
      // test each path segment
      test(url.pathname)
      test(url.search)
      if (link.includes('#')) {
        const hash = link.split('#')[1]
        if (hash)
          test(hash)
      }
    },
  })
}
