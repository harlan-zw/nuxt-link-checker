export async function crawlFetch(link: string, options: { fetch?: typeof globalThis.fetch; timeout?: number } = {}) {
  const fetch = options.fetch || globalThis.fetch
  const timeout = options.timeout || 5000
  const timeoutController = new AbortController()
  const abortRequestTimeout = setTimeout(() => timeoutController.abort(), timeout)

  return await fetch(link, {
    method: 'HEAD',
    signal: timeoutController.signal,
    headers: {
      'user-agent': 'Nuxt Link Checker',
    },
  })
    .catch(() => ({ status: 404, statusText: 'Not Found', headers: {} }))
    .finally(() => clearTimeout(abortRequestTimeout))
}
