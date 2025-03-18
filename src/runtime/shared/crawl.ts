import { isNonFetchableLink } from './inspections/util'

type MaybePromise<T> = T | Promise<T>

interface LinkResponse { status: number, statusText: string, headers: Record<string, any> }

const responses: Record<string, MaybePromise<LinkResponse>> = {}

const MockSuccessResponse = Promise.resolve({ status: 200, statusText: 'OK', headers: {} })

export async function getLinkResponse({ link, timeout, fetchRemoteUrls, baseURL, isInStorage }: { link: string, baseURL?: string, timeout?: number, fetchRemoteUrls?: boolean, isInStorage: () => boolean }) {
  // if the link has an anchor on it, do the request without the anchor
  if (link.includes('#') && !link.startsWith('#'))
    link = link.split('#')[0]
  link = decodeURI(link)
  if (link in responses) {
    return responses[link]
  }
  if (isNonFetchableLink(link)) {
    return null
  }
  if (isInStorage()) {
    responses[link] = Promise.resolve({ status: 200, statusText: 'OK', headers: { 'X-Nuxt-Prerendered': true } })
    return responses[link]
  }
  // handle absolute links
  if (link.startsWith('http') || link.startsWith('//')) {
    // TODO check they don't include the site URL
    responses[link] = fetchRemoteUrls ? crawlFetch(link, { timeout, baseURL }) : MockSuccessResponse
    return responses[link]
  }
  // relative link in dev?
  responses[link] = crawlFetch(link, { timeout, baseURL })
  return responses[link]
}

export function setLinkResponse(link: string, response: Promise<{ status: number, statusText: string, headers: Record<string, any> }>) {
  responses[link] = response
}

export async function getResolvedLinkResponses() {
  // wait for all responses to resolve
  const data: Record<string, LinkResponse> = {}
  for (const link in responses) {
    data[link] = await responses[link]
  }
  return data
}

export async function crawlFetch(link: string, options: { timeout?: number, baseURL?: string } = {}) {
  const timeout = options.timeout || 5000
  const timeoutController = new AbortController()
  const abortRequestTimeout = setTimeout(() => timeoutController.abort(), timeout)
  const start = Date.now()
  return await globalThis.$fetch.raw(encodeURI(link), {
    baseURL: options.baseURL,
    method: 'HEAD',
    signal: timeoutController.signal,
    retry: 3,
    retryDelay: 250,
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
    .then((res: Response) => {
      let headersObj: Record<string, string> = {}

      if (res.headers) {
        // If headers is a Headers object with entries method
        if (typeof res.headers.entries === 'function') {
          headersObj = Object.fromEntries(Array.from(res.headers.entries()))
        }
        // If headers is already a plain object
        else if (typeof res.headers === 'object') {
          headersObj = { ...res.headers }
        }
      }
      return { status: res.status, statusText: res.statusText, headers: headersObj, time: Date.now() - start }
    })
}
