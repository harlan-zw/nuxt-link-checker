import type { NuxtPage } from '@nuxt/schema'
import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'

export function convertNuxtPagesToPaths(pages: NuxtPage[]) {
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
    .filter(p => !p.path.includes(':'))
    .map(p => ({
      title: p.page?.meta?.title || '',
      link: p.path,
    }))
}

export function useViteWebSocket(nuxt: Nuxt = useNuxt()) {
  return new Promise<WebSocketServer>((_resolve) => {
    nuxt.hooks.hook('vite:serverCreated', (viteServer) => {
      _resolve(viteServer.ws)
    })
  })
}

export function useNitro(nuxt: Nuxt = useNuxt()) {
  return new Promise<any>((_resolve) => {
    nuxt.hooks.hook('nitro:init', (nitro) => {
      _resolve(nitro)
    })
  })
}

export { runParallel } from './lib/concurrency'
