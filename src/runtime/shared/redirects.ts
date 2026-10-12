import type { Rule, RuleReport } from '../types'
import { defineRule, isRedirectStatus } from './inspections/util'

function readLocation(headers: any): string | undefined {
  const location = typeof headers?.get === 'function' ? headers.get('location') : headers?.location
  return typeof location === 'string' && location ? location : undefined
}

/**
 * The first hop of a link. When `crawlFetch` follows a redirect, it records the first hop as `response.redirect`.
 * A response that was not followed is its own first hop.
 */
function firstHop(response: any): { status: unknown, location?: string } | undefined {
  if (!response)
    return
  if (response.redirect)
    return response.redirect
  return { status: response.status, location: readLocation(response.headers) }
}

export default function RuleRedirects(): Rule {
  return defineRule({
    id: 'redirects',
    test({ report, response }) {
      const hop = firstHop(response)
      if (!hop || !isRedirectStatus(hop.status))
        return

      const payload: RuleReport = {
        name: 'redirects',
        scope: 'warning',
        message: 'Should not redirect.',
        tip: 'Redirects use up your crawl budget and increase loading times, it\'s recommended to avoid them when possible.',
      }

      if (hop.location) {
        payload.fix = hop.location
        payload.fixDescription = `Set to redirect URL ${hop.location}.`
      }

      report(payload)
    },
  })
}
