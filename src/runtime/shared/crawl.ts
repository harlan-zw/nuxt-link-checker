import { isNonFetchableLink } from './inspections/util'

type MaybePromise<T> = T | Promise<T>

interface LinkResponse { status: number, statusText: string, headers: Record<string, any> }

const responses: Record<string, MaybePromise<LinkResponse>> = {}

const MockSuccessResponse = Promise.resolve({ status: 200, statusText: 'OK', headers: {} })

export async function getLinkResponse({ link, timeout, fetchRemoteUrls, baseURL, isInStorage }: { link: string, baseURL?: string, timeout?: number, fetchRemoteUrls?: boolean, isInStorage: () => boolean }): Promise<LinkResponse | null> {
  // if the link has an anchor on it, do the request without the anchor
  if (link.includes('#') && !link.startsWith('#'))
    link = link.split('#')[0]!
  link = decodeURI(link)
  if (link in responses) {
    return responses[link]!
  }
  if (isNonFetchableLink(link)) {
    return null
  }
  if (isInStorage()) {
    responses[link] = Promise.resolve({ status: 200, statusText: 'OK', headers: { 'X-Nuxt-Prerendered': true } })
    return responses[link]!
  }
  // handle absolute links
  if (link.startsWith('http') || link.startsWith('//')) {
    // TODO check they don't include the site URL
    responses[link] = fetchRemoteUrls ? crawlFetch(link, { timeout, baseURL }) : MockSuccessResponse
    return responses[link]!
  }
  // relative link in dev?
  responses[link] = crawlFetch(link, { timeout, baseURL })
  return responses[link]!
}

export function setLinkResponse(link: string, response: Promise<{ status: number, statusText: string, headers: Record<string, any> }>): void {
  responses[link] = response
}

export async function getResolvedLinkResponses(): Promise<Record<string, LinkResponse>> {
  // wait for all responses to resolve
  const data: Record<string, LinkResponse> = {}
  for (const link in responses) {
    data[link] = await responses[link]!
  }
  return data
}

/**
 * Status for a link the checker could not reach at all: DNS failure, refused connection, TLS error.
 */
export const UNREACHABLE_STATUS = 0

// servers that do not implement HEAD answer with one of these
const HEAD_NOT_SUPPORTED = new Set([405, 501])

function toHeaders(headers: unknown): Record<string, string> {
  if (!headers)
    return {}
  if (typeof (headers as Headers).entries === 'function')
    return Object.fromEntries(Array.from((headers as Headers).entries()))
  if (typeof headers === 'object')
    return { ...headers } as Record<string, string>
  return {}
}

// ofetch wraps undici's TypeError('fetch failed'), which wraps the cause: a system error with a code
// such as ECONNREFUSED, or a plain Error such as 'bad port'. Report the code, else the deepest message.
function describeNetworkError(error: any): string {
  let deepest: string | undefined
  for (let e = error?.cause; e; e = e.cause) {
    if (typeof e.code === 'string')
      return e.code
    if (typeof e.message === 'string' && e.message)
      deepest = e.message
  }
  return deepest || error?.message || 'Network Error'
}

export async function crawlFetch(link: string, options: { timeout?: number, baseURL?: string } = {}): Promise<LinkResponse & { time: number }> {
  const timeout = options.timeout || 5000
  const start = Date.now()
  const request = async (method: 'HEAD' | 'GET'): Promise<LinkResponse> => {
    const timeoutController = new AbortController()
    const abortRequestTimeout = setTimeout(() => timeoutController.abort(), timeout)
    return await globalThis.$fetch.raw(encodeURI(link), {
      baseURL: options.baseURL,
      method,
      signal: timeoutController.signal,
      retry: 3,
      retryDelay: 250,
      // the GET fallback only needs the status: stream the body and cancel it unread
      ...(method === 'GET' ? { responseType: 'stream' as const } : {}),
      headers: {
        'user-agent': 'Nuxt Link Checker',
      },
    })
      .then((res: any) => {
        res._data?.cancel?.().catch(() => {
          // safe to ignore: the status is already known, and a failed cancel only delays socket reuse
        })
        return { status: res.status, statusText: res.statusText, headers: toHeaders(res.headers) }
      })
      .catch((error: any): LinkResponse => {
        if (error?.name === 'AbortError' || timeoutController.signal.aborted)
          return { status: 408, statusText: 'Request Timeout', headers: {} }
        // an HTTP error response: report the status the server sent
        if (error?.response)
          return { status: error.response.status, statusText: error.response.statusText || '', headers: toHeaders(error.response.headers) }
        // no response at all: the link could not be reached
        return { status: UNREACHABLE_STATUS, statusText: describeNetworkError(error), headers: {} }
      })
      .finally(() => clearTimeout(abortRequestTimeout))
  }
  let res = await request('HEAD')
  if (HEAD_NOT_SUPPORTED.has(res.status))
    res = await request('GET')
  return { ...res, time: Date.now() - start }
}
