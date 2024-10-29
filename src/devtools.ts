import type { Resolver } from '@nuxt/kit'
import type { BirpcGroup } from 'birpc'
import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './module'
import type { ClientFunctions, ServerFunctions } from './rpc-types'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { extendPages, useNuxt } from '@nuxt/kit'
import { diffArrays } from 'diff'
import { resolve } from 'pathe'
import { generateLinkDiff } from './runtime/pure/diff'
import { convertNuxtPagesToPaths, useViteWebSocket } from './util'

const DEVTOOLS_UI_ROUTE = '/__nuxt-link-checker'
const DEVTOOLS_UI_LOCAL_PORT = 3030
const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()) {
  const clientPath = moduleResolve('./client')
  const isProductionBuild = existsSync(clientPath)

  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      server.middlewares.use(
        DEVTOOLS_UI_ROUTE,
        sirv(clientPath, { dev: true, single: true }),
      )
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    nuxt.hook('vite:extendConfig', (config) => {
      config.server = config.server || {}
      config.server.proxy = config.server.proxy || {}
      config.server.proxy[DEVTOOLS_UI_ROUTE] = {
        target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
        changeOrigin: true,
        followRedirects: true,
        rewrite: path => path.replace(DEVTOOLS_UI_ROUTE, ''),
      }
    })
  }

  nuxt.hook('devtools:customTabs', (tabs) => {
    tabs.push({
      // unique identifier
      name: 'nuxt-link-checker',
      // title to display in the tab
      title: 'Link Checker',
      // any icon from Iconify, or a URL to an image
      icon: 'carbon:cloud-satellite-link',
      // iframe view
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })

  let isConnected = false
  const viteServerWs = useViteWebSocket()
  const rpc = new Promise<BirpcGroup<ClientFunctions, ServerFunctions>>((promiseResolve) => {
    onDevToolsInitialized(async () => {
      const rpc = extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
        getOptions() {
          return options
        },
        async reset() {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:reset')
        },
        async scrollToLink(link: string) {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:scroll-to-link', link)
        },
        async applyLinkFixes(diff, original, replacement) {
          for (const { filepath } of diff) {
            // if filepath contains the same segment as the last root dir, we remove it
            const rootDirFolderName = nuxt.options.rootDir.split('/').pop()
            const filepathWithoutRoot = filepath
              .replace(new RegExp(`^${nuxt.options.rootDir}/`), '')
              // need to replace dirname only if the string starts with it, use regex
              .replace(new RegExp(`^${rootDirFolderName}/`), '')
            const fp = resolve(nuxt.options.rootDir, filepathWithoutRoot)
            const contents = await readFile(fp, 'utf8')
            const diff = generateLinkDiff(contents, original, replacement)
            await writeFile(fp, diff.code, 'utf8')
          }
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:reset')
        },
        async toggleLiveInspections(enabled) {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:live-inspections', { enabled })
        },
        async connected() {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:connected')
          isConnected = true
        },
      })
      promiseResolve(rpc)
    })
  })
  viteServerWs.then((ws) => {
    ws.on('nuxt-link-checker:queueWorking', async (payload) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.queueWorking(payload).catch(() => {})
      }
    })
    ws.on('nuxt-link-checker:updated', async () => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.updated().catch(() => {})
      }
    })
    ws.on('nuxt-link-checker:filter', async (payload) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.filter(payload).catch(() => {})
      }
    })

    let lastRoutes: string[] = []
    extendPages(async (pages) => {
      // convert pages to routes
      const routes = convertNuxtPagesToPaths(pages)
      if (lastRoutes.length) {
        const routeDiff = diffArrays(lastRoutes, routes)
        if (routeDiff.some(diff => diff.added || diff.removed))
          ws.send('nuxt-link-checker:reset')
      }
      lastRoutes = routes
    })
  })
}
