import { defineRule } from './util'

export default function RuleNoWhitespace() {
  return defineRule({
    id: 'no-whitespace',
    test({ link, report }) {
      // if it starts with or ends with whitespace we can safely fix it
      if (link.trim() !== link) {
        report({
          name: 'no-whitespace',
          scope: 'warning',
          message: 'Links should not start or end with whitespace.',
          fix: link.trim(),
          fixDescription: 'Remove whitespace from start and end of link.',
        })
      }
      // test for whitespace
      if (link.trim().match(/\s/)) {
        report({
          name: 'no-whitespace',
          scope: 'warning',
          message: 'Links should not contain whitespace.',
          tip: 'Use hyphens to separate words instead of spaces.',
        })
      }
    },
  })
}
