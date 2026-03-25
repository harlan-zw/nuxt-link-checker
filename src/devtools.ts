import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './module'
import type { ClientFunctions, ServerFunctions } from './rpc-types'
import { readFile, writeFile } from 'node:fs/promises'
import { extendPages, useNuxt } from '@nuxt/kit'
import { diffArrays } from 'diff'
import { setupDevToolsUI as _setupDevToolsUI, setupDevToolsRpc } from 'nuxtseo-shared/devtools'
import { resolve } from 'pathe'
import { generateLinkDiff } from './runtime/shared/diff'
import { convertNuxtPagesToPaths, resolveViteWebSocket } from './util'

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()): void {
  _setupDevToolsUI({
    route: '/__nuxt-link-checker',
    name: 'nuxt-link-checker',
    title: 'Link Checker',
    icon: 'carbon:cloud-satellite-link',
  }, moduleResolve, nuxt)

  let isConnected = false
  const viteServerWs = resolveViteWebSocket()

  const rpc = setupDevToolsRpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
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
        const rootDirFolderName = nuxt.options.rootDir.split('/').pop()
        const filepathWithoutRoot = filepath
          .replace(new RegExp(`^${nuxt.options.rootDir}/`), '')
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
  } as ServerFunctions, nuxt)

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

    let lastRoutes: { title: string, link: string }[] = []
    extendPages(async (pages) => {
      const routes = convertNuxtPagesToPaths(pages)
      if (lastRoutes.length) {
        const routeDiff = diffArrays(lastRoutes, routes)
        if (routeDiff?.some(diff => diff.added || diff.removed))
          ws.send('nuxt-link-checker:reset')
      }
      lastRoutes = routes
    })
  })
}
