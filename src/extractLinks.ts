// copied from nitropack prerender.ts
import type { ParsedURL } from 'ufo'
import { hasProtocol, parseURL } from 'ufo'
import { load } from 'cheerio'
import type { ModuleOptions } from './module'

export const linkMap: Record<string, ExtractedLink[]> = {}

const EXT_REGEX = /\.[\da-z]+$/
const allowedExtensions = new Set(['', '.json'])
function getExtension(path: string): string {
  return (path.match(EXT_REGEX) || [])[0] || ''
}

interface ExtractedLink {
  url: ParsedURL
  pathname: string
  element: string
  badTrailingSlash: boolean
  badAbsolute: boolean
}
export function extractLinks(
  html: string,
  from: string,
  { host, trailingSlash }: ModuleOptions,
): ExtractedLink[] {
  const links: ExtractedLink[] = []

  const hostname = parseURL(host).host
  const $ = load(html)

  $('[href]').each((i, el) => {
    const href = $(el).attr('href')
    if (!href)
      return
    // create a URL from href
    const url = parseURL(href)
    // ignore external links which aren't our host
    if (hasProtocol(href) && !href.startsWith('/') && url.host !== hostname)
      return
    // ignore anchor links
    if (href.startsWith('#'))
      return
    // ignore links with extensions
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

  return links
}
