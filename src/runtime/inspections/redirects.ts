import type { RuleReport } from '../types'
import { defineRule } from './util'

export default function RuleRedirects() {
  return defineRule({
    test({ report, response }) {
      if (response.status !== 301 && response.status !== 302)
        return

      const payload: RuleReport = {
        name: 'redirects',
        scope: 'warning',
        message: 'Should not redirect.',
        tip: 'Redirects use up your crawl budget and increase loading times, it\'s recommended to avoid them when possible.',
      }

      const fix = response.headers.get('location')!
      if (fix) {
        payload.fix = fix
        payload.fixDescription = `Set to redirected URL ${fix}.`
      }

      report(payload)
    },
  })
}
