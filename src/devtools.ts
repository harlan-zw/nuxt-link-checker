import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import type { Nuxt } from 'nuxt/schema'
import type { Resolver } from '@nuxt/kit'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { diffArrays } from 'diff'
import { extendPages, useNuxt } from '@nuxt/kit'
import { generateLinkDiff } from './runtime/server/util'
import type { ClientFunctions, ServerFunctions } from './rpc-types'
import { convertNuxtPagesToPaths, useViteWebSocket } from './util'
import type { ModuleOptions } from './module'

const DEVTOOLS_UI_ROUTE = '/__nuxt-link-checker'
const DEVTOOLS_UI_LOCAL_PORT = 3030
const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export function setupDevToolsUI(options: ModuleOptions, resolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()) {
  const clientPath = resolve('./client')
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

  const viteServerWs = useViteWebSocket()
  onDevToolsInitialized(async () => {
    const rpc = extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
      getOptions() {
        return options
      },
      async reset() {
        const ws = await viteServerWs
        ws.send('nuxt-link-checker:reset')
      },
      async applyLinkFixes(filepath, original, replacement) {
        filepath = resolve(filepath)
        // don't allow modifying files outside the root dir
        if (!filepath.startsWith(nuxt.options.rootDir))
          return
        const contents = await readFile(filepath, 'utf8')
        const diff = generateLinkDiff(contents, original, replacement)
        await writeFile(filepath, diff.code, 'utf8')

        const ws = await viteServerWs
        ws.send('nuxt-link-checker:reset')
      },
    })
    viteServerWs.then((ws) => {
      ws.on('nuxt-link-checker:queueWorking', payload => rpc.broadcast.queueWorking(payload).catch(() => {}))
      ws.on('nuxt-link-checker:updated', () => rpc.broadcast.updated().catch(() => {}))
      ws.on('nuxt-link-checker:filter', payload => rpc.broadcast.filter(payload).catch(() => {}))

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
  })
}