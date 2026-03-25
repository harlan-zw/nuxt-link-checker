import type { NuxtPage } from '@nuxt/schema'
import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'

export function convertNuxtPagesToPaths(pages: NuxtPage[], options?: { keepDynamic?: boolean }): { title: string, link: string, file?: string }[] {
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
