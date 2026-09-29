import type { NuxtPage } from '@nuxt/schema'
import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import { useNuxt } from '@nuxt/kit'
import { expandCompactLocaleRoute } from 'nuxtseo-shared/i18n'
import { joinURL } from 'ufo'

export function convertNuxtPagesToPaths(pages: NuxtPage[], options?: { keepDynamic?: boolean, locales?: string[] }): { title: string, link: string, file?: string }[] {
  return pages
    .map((page) => {
      return page.children?.length
        ? page.children.map((child) => {
            return {
              path: joinURL(page.path, child.path),
              page: child,
            }
          })
        : { page, path: page.path }
    })
    .flat()
    // Expand compacted i18n routes (`/:locale(en|fr)/about`) into one path per locale so
    // localized links validate exactly instead of being treated as dynamic routes.
    .flatMap((p) => {
      const expanded = expandCompactLocaleRoute(p.path, options?.locales)
      return expanded ? expanded.map(e => ({ ...p, path: e.path })) : [p]
    })
    .filter(p => options?.keepDynamic || !p.path.includes(':'))
    .map(p => ({
      title: p.page?.meta?.title || '',
      link: p.path,
      file: p.page?.file,
    }))
}

export function resolveViteWebSocket(nuxt: Nuxt = useNuxt()): Promise<WebSocketServer> {
  return new Promise<WebSocketServer>((_resolve) => {
    nuxt.hooks.hook('vite:serverCreated', (viteServer) => {
      _resolve(viteServer.ws)
    })
  })
}

// v1 options that v2 removed or moved to site config, mapped to their replacement
const removedOptions: [key: string, replacement: string][] = [
  ['failOn404', 'linkChecker.failOnError'],
  ['exclude', 'linkChecker.excludeLinks'],
  ['siteUrl', 'site.url'],
  ['trailingSlash', 'site.trailingSlash'],
]

/**
 * Warnings for removed options in the user's `linkChecker` config, which the module would otherwise ignore silently.
 */
export function findRemovedOptions(config: Record<string, unknown>): string[] {
  return removedOptions
    .filter(([key]) => config[key] !== undefined)
    .map(([key, replacement]) => `\`linkChecker.${key}\` was removed. Use \`${replacement}\`.`)
}
