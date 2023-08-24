import { createRouter, toRouteMatcher } from 'radix3'
import { $fetch } from 'ofetch'

export interface CreateFilterOptions {
  include?: (string | RegExp)[]
  exclude?: (string | RegExp)[]
}

export function createFilter(options: CreateFilterOptions = {}): (path: string) => boolean {
  const include = options.include || []
  const exclude = options.exclude || []
  if (include.length === 0 && exclude.length === 0)
    return () => true

  return function (path: string): boolean {
    for (const v of [{ rules: exclude, result: false }, { rules: include, result: true }]) {
      const regexRules = v.rules.filter(r => r instanceof RegExp) as RegExp[]
      if (regexRules.some(r => r.test(path)))
        return v.result

      const stringRules = v.rules.filter(r => typeof r === 'string') as string[]
      if (stringRules.length > 0) {
        const routes = {}
        for (const r of stringRules) {
          // quick scan of literal string matches
          if (r === path)
            return v.result

          // need to flip the array data for radix3 format, true value is arbitrary
          // @ts-expect-error untyped
          routes[r] = true
        }
        const routeRulesMatcher = toRouteMatcher(createRouter({ routes, ...options }))
        if (routeRulesMatcher.matchAll(path).length > 0)
          return Boolean(v.result)
      }
    }
    return include.length === 0
  }
}

export async function crawlFetch(link: string, options: { fetch?: typeof globalThis.fetch; timeout?: number } = {}) {
  const $ = options.fetch || $fetch
  const timeout = options.timeout || 5000
  const timeoutController = new AbortController()
  const abortRequestTimeout = setTimeout(() => timeoutController.abort(), timeout)

  return await $(link, {
    method: 'HEAD',
    signal: timeoutController.signal,
    headers: {
      'user-agent': 'Nuxt Link Checker',
    },
  })
    .catch((error) => {
      if (error.name === 'AbortError')
        return { status: 408, statusText: 'Request Timeout', headers: {} }
      // make sure we have a 404 and not a timeout
      return { status: 404, statusText: 'Not Found', headers: {} }
    })
    .finally(() => clearTimeout(abortRequestTimeout))
}
