// copied from nitropack prerender.ts
import { isRelative, parseURL } from 'ufo'
import { load } from 'cheerio'
import type { ModuleOptions } from './module'

export const linkMap: Record<string, ExtractedLink[]> = {}

const EXT_REGEX = /\.[\da-z]+$/
const allowedExtensions = new Set(['', '.json'])
function getExtension(path: string): string {
  return (path.match(EXT_REGEX) || [])[0] || ''
}

interface ExtractedLink {
  href: string
  element: string
  badTrailingSlash: boolean
}
export function extractLinks(
  html: string,
  from: string,
  { host, trailingSlash }: ModuleOptions,
): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const _links: ExtractedLink[] = []

  const $ = load(html)

  $('[href]').each((i, el) => {
    const href = $(el).attr('href')
    if (!href)
      return
    if (host && !isRelative(href) && href.startsWith(host))
      return
    if (!allowedExtensions.has(getExtension(href)))
      return

    links.push({
      pathname: url.pathname || '/',
      url,
      badAbsolute: Boolean(hostname) && hostname === url.host,
      badTrailingSlash: url.pathname !== '/' && ((trailingSlash && !url.pathname.endsWith('/')) || (!trailingSlash && url.pathname.endsWith('/'))),
      element: $.html(el) || '',
    })
  })

  for (const link of _links.filter(Boolean)) {
    const parsed = parseURL(link.href)
    if (parsed.protocol)
      continue

    let { pathname } = parsed
    if (!pathname.startsWith('/')) {
      const fromURL = new URL(from, 'http://localhost')
      pathname = new URL(pathname, fromURL).pathname
    }
    links.push({
      ...link,
      href: pathname,
    })
  }
  return links
}
