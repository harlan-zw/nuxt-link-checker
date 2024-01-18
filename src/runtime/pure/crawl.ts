import { $fetch } from 'ofetch'
import { isNonFetchableLink } from './inspections/util'

const responses: Record<string, Promise<{ status: number, statusText: string, headers: Record<string, any> }>> = {}
export async function getLinkResponse({ link, timeout, fetchRemoteUrls, baseURL, isInStorage }: { link: string, baseURL?: string, timeout?: number, fetchRemoteUrls?: boolean, isInStorage: () => boolean }) {
  // if the link has an anchor on it, do the request without the anchor
  if (link.includes('#') && !link.startsWith('#'))
    link = link.split('#')[0]
  const response = responses[link]
  if (!response) {
    if (isNonFetchableLink(link)
      // skip remote urls if we're not allowed to fetch them
      || (link.startsWith('http') && !fetchRemoteUrls)
      || isInStorage()
    ) {
      responses[link] = Promise.resolve({ status: 200, statusText: 'OK', headers: {} })
    }
    else {
      // do fetch
      responses[link] = crawlFetch(link, { timeout, baseURL })
    }
  }
  return responses[link]
}

export function setLinkResponse(link: string, response: Promise<{ status: number, statusText: string, headers: Record<string, any> }>) {
  responses[link] = response
}

export async function crawlFetch(link: string, options: { timeout?: number, baseURL?: string } = {}) {
  const timeout = options.timeout || 5000
  const timeoutController = new AbortController()
  const abortRequestTimeout = setTimeout(() => timeoutController.abort(), timeout)

  return await $fetch.raw(link, {
    baseURL: options.baseURL,
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
    .then(res => ({ status: res.status, statusText: res.statusText, headers: res.headers }))
}
