import type { RuleReport } from 'nuxt-link-checker/src/runtime/types'
import { defineRule } from './util'

export default function RuleRedirects() {
  return defineRule({
    id: 'redirects',
    test({ report, response }) {
      if (response?.status !== 301 && response?.status !== 302)
        return

      const payload: RuleReport = {
        name: 'redirects',
        scope: 'warning',
        message: 'Should not redirect.',
        tip: 'Redirects use up your crawl budget and increase loading times, it\'s recommended to avoid them when possible.',
      }

      const fix = typeof response.headers?.get === 'function' ? response.headers.get('location') : response.headers?.location || false
      if (fix) {
        payload.fix = fix
        payload.fixDescription = `Set to redirect URL ${fix}.`
      }

      report(payload)
    },
  })
}
