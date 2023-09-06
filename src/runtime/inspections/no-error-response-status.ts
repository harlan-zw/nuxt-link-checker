import type { RuleReport } from '../types'
import { defineRule, isNonFetchableLink } from './util'

export default function RuleNoErrorResponse() {
  return defineRule({
    test({ link, response, report, pageSearch }) {
      if (!response.status || response.status.toString().startsWith('2') || response.status.toString().startsWith('3') || isNonFetchableLink(link))
        return
      const payload: RuleReport = {
        name: 'no-error-response',
        scope: 'error',
        message: `Should not respond with status code ${response.status}${response.statusText ? ` (${response.statusText})` : ''}.`,
      }
      // only for relative links
      if (link.startsWith('/') && pageSearch) {
        const fix = pageSearch.search(link)?.[0]?.item
        if (fix && fix !== link) {
          payload.fix = fix
          payload.fixDescription = `Did you mean ${fix}?`
        }
      }
      else {
        payload.canRetry = true
      }
      report(payload)
    },
  })
}
