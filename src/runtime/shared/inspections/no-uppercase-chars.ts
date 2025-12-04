import { defineRule } from './util'

export default function RuleNoUppercaseChars() {
  return defineRule({
    id: 'no-uppercase-chars',
    test({ report, link }) {
      if (link.startsWith('#'))
        return
      if (link.match(/[A-Z]/)) {
        report({
          name: 'no-uppercase-chars',
          scope: 'warning',
          message: 'Links should not contain uppercase characters.',
          fix: link.toLowerCase(),
          fixDescription: 'Convert to lowercase.',
        })
      }
    },
  })
}
