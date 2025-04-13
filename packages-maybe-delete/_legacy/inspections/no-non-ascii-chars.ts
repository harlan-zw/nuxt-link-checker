import { defineRule } from './util'

export default function RuleNoNonAsciiChars() {
  return defineRule({
    id: 'no-non-ascii-chars',
    test({ link, url, report }) {
      // test path segments individually
      function test(s: string) {
        // use regex to detect non-ascii chars
        if (/[^\u0020-\u007F]/.test(s)) {
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
