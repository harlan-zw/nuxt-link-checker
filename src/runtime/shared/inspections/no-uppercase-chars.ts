import type { Rule } from '../../types'
import { defineRule } from './util'

const uppercaseRe = /[A-Z]/

export default function RuleNoUppercaseChars(): Rule {
  return defineRule({
    id: 'no-uppercase-chars',
    test({ report, link }) {
      if (link.startsWith('#'))
        return
      if (uppercaseRe.test(link)) {
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
