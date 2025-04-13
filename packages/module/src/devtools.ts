import type { Resolver } from '@nuxt/kit'
import type { BirpcGroup } from 'birpc'
import type { Nuxt } from 'nuxt/schema'
import type { Storage } from 'unstorage'
import type { ModuleOptions } from './module'
import type { ClientFunctions, ESLintContainer, ServerFunctions } from './rpc-types'
import { existsSync } from 'node:fs'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { useNuxt } from '@nuxt/kit'
import { useNitroOrigin } from 'nuxt-site-config/kit'
import {$fetch, FetchError} from 'ofetch'
import { createNuxtAuditStorage, extractPayload } from './prerender'
import { useNitro, useViteWebSocket } from './util'

const DEVTOOLS_UI_ROUTE = '/__nuxt-link-checker'
const DEVTOOLS_UI_LOCAL_PORT = 3030
const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], eslintContainer: ESLintContainer, nuxt: Nuxt = useNuxt()) {
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
      title: 'Audit',
      // any icon from Iconify, or a URL to an image
      icon: 'carbon:ibm-engineering-test-mgmt',
      // iframe view
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })

  let isConnected = false
  const nitroInstance = useNitro()
  const viteServerWs = useViteWebSocket()
  const rpc = new Promise<BirpcGroup<ClientFunctions, ServerFunctions>>((promiseResolve) => {
    onDevToolsInitialized(async () => {
      // eslint-disable-next-line no-async-promise-executor
      const storageContainer = new Promise<{ storage: Storage, storageFilepath: string }>(async (resolve) => {
        nitroInstance.then((nitro) => {
          resolve(createNuxtAuditStorage(options, nuxt, nitro))
        })
      })
      const getScanMeta = async (): Promise<{ currentScanId: number, scans: any[] }> => {
        return await (await storageContainer).storage.getItem('scan-meta.json')
      }
      const rpc = extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
        getOptions() {
          return options
        },
        async reset() {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:reset')
        },
        // async scrollToLink(link: string) {
        //   const ws = await viteServerWs
        //   ws.send('nuxt-link-checker:scroll-to-link', link)
        // },
        // async applyLinkFixes(diff, original, replacement) {
        //   for (const { filepath } of diff) {
        //     // if filepath contains the same segment as the last root dir, we remove it
        //     const rootDirFolderName = nuxt.options.rootDir.split('/').pop()
        //     const filepathWithoutRoot = filepath
        //       .replace(new RegExp(`^${nuxt.options.rootDir}/`), '')
        //       // need to replace dirname only if the string starts with it, use regex
        //       .replace(new RegExp(`^${rootDirFolderName}/`), '')
        //     const fp = resolve(nuxt.options.rootDir, filepathWithoutRoot)
        //     const contents = await readFile(fp, 'utf8')
        //     const diff = generateLinkDiff(contents, original, replacement)
        //     await writeFile(fp, diff.code, 'utf8')
        //   }
        //   const ws = await viteServerWs
        //   ws.send('nuxt-link-checker:reset')
        // },
        // async toggleLiveInspections(enabled) {
        //   const ws = await viteServerWs
        //   ws.send('nuxt-link-checker:live-inspections', { enabled })
        // },
        async connected() {
          const ws = await viteServerWs
          ws.send('nuxt-link-checker:connected')
          await eslintContainer.init()
          const res = await getScanMeta()
          isConnected = true
          if (typeof res?.currentScanId !== 'undefined') {
            res.results = await (await storageContainer).storage.getItem(`scan-${res.currentScanId}.json`) || []
          }
          return res
        },
        getScans: getScanMeta,
        async work() {
          // const ws = await viteServerWs
          const scans = await getScanMeta()
          // pop from the queue of the current scan
          if (scans) {
            const currentScanId = scans.currentScanId
            const currentScan = scans.scans.find(scan => scan.id === currentScanId)
            if (currentScan && currentScan.queue.length > 0) {
              const nextPath = currentScan.queue.pop()
              console.log('[nuxt-link-checker] audit', nextPath)
              let error
              const payload = await $fetch(nextPath, {
                baseURL: useNitroOrigin(),
              }).catch((err: FetchError) => {
                error = {
                  status: err.status,
                  statusText: err.statusText,
                }
                return null
              })
              console.log(payload)
              const lintResult = payload ? await eslintContainer.controller.lintText(payload, `index.html`) : null
              console.log({ lintResult })
              // add to results
              currentScan.results.push({
                path: nextPath,
              })
              await (await storageContainer).storage.setItem('scan-meta.json', scans)
              // we need toi push results to own storage
              const results: any[] = await (await storageContainer).storage.getItem(`scan-${currentScanId}.json`) || []
              results.push({
                path: nextPath,
                payload: payload ? await extractPayload(payload) : null,
                lintResult,
                error,
              })
              await (await storageContainer).storage.setItem(`scan-${currentScanId}.json`, results)
              // ws.send('nuxt-link-checker:queueWorking', { queueLength: currentScan.queue.length })
              return lintResult
            }
          }
        },
        async newScan() {
          console.log('news scan!')
          // await eslintContainer.init()
          //
          const scans = await getScanMeta() || {
            currentScanId: -1,
            scans: [],
          }
          const links = await $fetch('/__link-checker__/links', {
            baseURL: useNitroOrigin(),
          })
          console.log({ links })
          scans.currentScanId++
          scans.scans.push({
            createdAt: Date.now(),
            id: scans.currentScanId,
            queue: links.map(link => link.link || link.path).filter(Boolean),
            results: [],
            // options & results
          })
          // write to
          await (await storageContainer).storage.setItem('scan-meta.json', JSON.stringify(scans))
          console.log({ scans })
          return scans
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
    ws.on('nuxt-link-checker:audit', async (payload) => {
      if (isConnected) {
        // const _rpc = await rpc
        // console.log('[nuxt-link-checker] audit', payload)
        // const lintResult = await eslintContainer.controller.lintText(payload, 'index.html')
        // console.log(lintResult)
        // _rpc.broadcast.results(lintResult)
      }
    })
  })
}
