import type { Rule, RuleReport } from '../../types'
import { UNREACHABLE_STATUS } from '../crawl'
import { defineRule, isNonFetchableLink } from './util'

export default function RuleNoErrorResponse(): Rule {
  return defineRule({
    id: 'no-error-response',
    externalLinks: true,
    test({ link, response, report, pageSearch }) {
      if (!response || typeof response.status !== 'number' || (response.status >= 200 && response.status < 400) || isNonFetchableLink(link))
        return
      const payload: RuleReport = {
        name: 'no-error-response',
        scope: 'error',
        message: response.status === UNREACHABLE_STATUS
          ? `Could not reach the link (${response.statusText}).`
          : `Should not respond with status code ${response.status}${response.statusText ? ` (${response.statusText})` : ''}.`,
      }
      // only for relative links
      if (link.startsWith('/') && pageSearch) {
        const related = pageSearch.search(link)?.[0]?.item
        if (related?.link && related.link !== link) {
          payload.fix = related.link
          payload.fixDescription = `Did you mean ${related.link}?`
        }
      }
      else {
        payload.canRetry = true
      }
      report(payload)
    },
  })
}
