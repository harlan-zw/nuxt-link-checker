import { defineRule } from './util'

export default function RuleNoUnderscores() {
  return defineRule({
    id: 'no-underscores',
    test({ link, report }) {
      if (link.includes('_')) {
        report({
          name: 'no-underscores',
          scope: 'warning',
          message: 'Links should not contain underscores.',
          fix: link.replaceAll('_', '-'),
          fixDescription: 'Replace underscores with dashes.',
        })
      }
    },
  })
}
