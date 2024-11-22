import { defineRule } from './util'

export default function RuleNoNonAsciiChars() {
  return defineRule({
    id: 'no-non-ascii-chars',
    test({ link, report }) {
      // use regex to detect non-ascii chars
      if (/[^\u0020-\u007F]/.test(link)) {
        report({
          name: 'no-non-ascii-chars',
          scope: 'warning',
          message: 'Links should not contain non-ascii characters.',
          // fix is to uri encode the link
          fix: encodeURI(link),
          fixDescription: 'Encode non-ascii characters.',
        })
      }
    },
  })
}
