import type { Resolver } from '@nuxt/kit'
import type { BirpcGroup } from 'birpc'
import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from '../module'
import type { Audit, CreateAuditInput, Tasks } from '../types'
import type { AuditStore, ClientFunctions, NuxtAnalyzeDevtoolsServerContext, ServerFunctions } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { useNuxt } from '@nuxt/kit'
import { eq } from 'drizzle-orm'
import { resolve } from 'pathe'
import { audits } from '../db/root/schema'
import { initAndMigrateDb } from '../db/utils'
import { setupAuditRpc } from './rpc/audit'
import { setupHandshakeRpc } from './rpc/handshake'

const DEVTOOLS_UI_ROUTE = '/__nuxt-link-checker'
const DEVTOOLS_UI_LOCAL_PORT = 3030
const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

// async function postProcessReport(ctx: { results: { payload: ExtractedPayload }[], storageContainer: any, currentScan: any, eslintContainer: ESLintContainer }): Promise<void> {
//   console.log('[nuxt-link-checker] post process report')
//   // collect all titles and descriptions so we can do unique check
//   // const lintResult = payload ? await eslintContainer.controller.lintText(payload, `index.html`) : null
//   // payload.links.link
//   const titleOccurrences: Record<string, number> = {}
//   const descriptionOccurrences: Record<string, number> = {}
//   const imageOccurrences: Record<string, number> = {}
//   const payloads = ctx.results.map(result => result.payload).filter(Boolean)
//   payloads.forEach((payload) => {
//     if (payload?.title) {
//       const title = payload.title
//       const count = titleOccurrences[title] || 0
//       titleOccurrences[title] = count + 1
//     }
//     if (payload?.description) {
//       const description = payload.description
//       const count = descriptionOccurrences[description] || 0
//       descriptionOccurrences[description] = count + 1
//     }
//     if (payload?.images) {
//       for (const image of payload.images) {
//         const count = imageOccurrences[image.src] || 0
//         imageOccurrences[image.src] = count + 1
//       }
//     }
//     // if (payload?.links) {
//     //   payload.links.link.forEach((link) => {
//     //     const count = internalLinkDistribution.get(link) || 0
//     //     internalLinkDistribution.set(link, count + 1)
//     //   })
//     // }
//   })
//   // do batch processing of images
//   const brokenImageMap: Record<string, number> = {}
//   const imagePaths = new Set(Object.keys(imageOccurrences))
//   await runParallel(imagePaths, async (imagePath) => {
//     const res = await $fetch.raw(imagePath, {
//       method: 'HEAD',
//       baseURL: useNitroOrigin(),
//     })
//     brokenImageMap[imagePath] = res.status
//   }, {
//     concurrency: 3,
//     interval: 100,
//   })
//   console.log({
//     titles: titleOccurrences,
//     descriptions: descriptionOccurrences,
//     brokenImageMap,
//   })
//   await ctx.eslintContainer.patchConfig({
//     titles: titleOccurrences,
//     descriptions: descriptionOccurrences,
//     brokenImageMap,
//   })
//   // now run eslint on the folder with all of the html files
//   const res = await ctx.eslintContainer.controller.lintFiles(
//     ctx.results.map(result => result.htmlPath).filter(Boolean),
//     {
//       cwd: (await ctx.storageContainer).storageFilepath,
//       ignorePatterns: ['!**/node_modules/'],
//       ignore: false,
//     },
//   )
//   // TODO nuxt hook - call ollama
//   // write to file
//   await (await ctx.storageContainer).storage.setItem(`last-eslint-results.json`, res)
//   const resultMap = new Map<string, any>()
//   res.results.forEach((result) => {
//     resultMap.set(result.filePath, result)
//   })
//   for (const result of ctx.results) {
//     const eslintResult = resultMap.get(result.htmlPath)
//     console.log('[nuxt-link-checker] eslint result', { eslintResult: !!eslintResult, result })
//     if (eslintResult) {
//       result.lintResult = eslintResult
//       console.log('[nuxt-link-checker] eslint result for', result.htmlPath)
//     }
//     else {
//       console.warn('[nuxt-link-checker] no eslint result for', result.path)
//     }
//   }
//
//   ctx.currentScan.ready = true
// }

export async function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()) {
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

  const db = await initAndMigrateDb(
    resolve(nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir as string, 'db.sqlite3'),
    moduleResolve('./db/root/migrations'),
  )

  onDevToolsInitialized(async () => {
    // const storageContainer = new Promise<{ storage: Storage, storageFilepath: string }>(async (resolve) => {
    //   nitroInstance.then((nitro) => {
    //     resolve(createNuxtAuditStorage(options, nuxt, nitro))
    //   })
    // })
    const createAudit = async (audit: CreateAuditInput): Promise<Audit> => {
      const tasksJson: Tasks = {
        build: { status: 'pending' },
        serve: { status: 'pending' },
        crawl: { status: 'pending' },
        analyze: { status: 'pending' },
      }
      // Insert into database
      // Return the audit in the expected format
      const newAudit = (await db.insert(audits).values({
        name: audit.name,
        tasks: tasksJson,
        currentTask: null,
        currentTaskStatus: 'pending',
        scanType: audit.scanType || 'default',
        // origin: audit.origin, // Temporarily removed until migration
      }).returning())[0]

      // Create the audit-specific directory structure
      const auditStorageDir = resolve(nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir as string, String(newAudit.id))
      if (!existsSync(auditStorageDir)) {
        mkdirSync(auditStorageDir, { recursive: true })
      }

      return newAudit
    }

    let rpc: BirpcGroup<ClientFunctions, ServerFunctions>
    const ctx = Object.assign(
      {
        nuxtAnalyzeOptions: options,
        // storageContainer,
        state: {},
        refreshNuxtAnalyzeDevtools() {
          rpc!.broadcast.refresh.asEvent('queryAllAudits')
        },
        createAudit,
        queryAllAudits: () => db.select().from(audits),
        async updateAudit(data: Partial<Audit>) {
          if (!data.id)
            throw new Error('Audit ID is required for update')

          // Update database
          await db.update(audits).set({
            name: data.name,
            tasks: data.tasks,
            currentTask: data.currentTask,
            currentTaskStatus: data.currentTaskStatus,
            scanType: data.scanType,
            // origin: data.origin, // Temporarily removed until migration
            updatedAt: Date.now(),
          }).where(eq(audits.id, data.id))
        },
      },
      // @ts-expect-error untyped
      nuxt.devtools,
    ) as NuxtAnalyzeDevtoolsServerContext
    const fns = {
      ...setupHandshakeRpc(ctx),
      ...setupAuditRpc(ctx),
    } satisfies ServerFunctions
    rpc = extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, fns)
  })
}
