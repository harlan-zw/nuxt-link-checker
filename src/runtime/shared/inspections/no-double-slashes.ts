import { defineRule } from './util'

export default function RuleNoDoubleSlashes() {
  return defineRule({
    id: 'no-double-slashes',
    test({ link, report }) {
      // we want to match any paths that have double slashes (or triple etc)
      if (link.match(/\/{2,}/)) {
        report({
          name: 'no-double-slashes',
          scope: 'warning',
          message: 'Links should not contain double slashes.',
          fix: link.replaceAll(/\/{2,}/g, '/'),
          fixDescription: 'Remove double slashes.',
        })
      }
    },
  })
}
