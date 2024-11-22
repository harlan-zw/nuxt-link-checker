import { defineRule } from './util'

export default function RuleNoMissingHref() {
  return defineRule({
    id: 'no-missing-href',
    test({ report, link, role }) {
      if (link.trim().length > 0 || role === 'button') {
        return
      }

      report({
        name: 'no-missing-href',
        scope: 'warning',
        message: 'For accessibility and UX anchor tags require a href attribute.',
        tip: 'Use a button element with type="button" instead if the link is not navigational.',
      }, true)
    },
  })
}
