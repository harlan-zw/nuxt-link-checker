import { defineRule } from './util'

export default function RuleNoUnderscores() {
  return defineRule({
    id: 'no-underscores',
    test({ url, report }) {
      if (url.pathname.includes('_')) {
        report({
          name: 'no-underscores',
          scope: 'warning',
          message: 'Links should not contain underscores.',
          fix: url.pathname.replaceAll('_', '-'),
          fixDescription: 'Replace underscores with dashes.',
        })
      }
    },
  })
}
