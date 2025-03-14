import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { ExtractedPayload, InspectionContext, PathReport } from './build/report'
import type { ModuleOptions } from './module'
import { existsSync } from 'node:fs'
import { useNuxt } from '@nuxt/kit'
import { colors } from 'consola/utils'
import Fuse from 'fuse.js'
import { useSiteConfig } from 'nuxt-site-config/kit'
import { resolve } from 'pathe'
import { withoutLeadingSlash } from 'ufo'
import { ELEMENT_NODE, parse, walkSync } from 'ultrahtml'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { generateReports } from './build/report'
import { getLinkResponse, setLinkResponse } from './runtime/shared/crawl'
import { inspect } from './runtime/shared/inspect'
import { createFilter } from './runtime/shared/sharedUtils'

const { gray, yellow, dim, red, white } = colors

const linkMap: Record<string, ExtractedPayload> = {}

export async function extractPayload(html: string, rootNodeId = '#__nuxt'): Promise<ExtractedPayload> {
  if (String(rootNodeId).length) {
    rootNodeId = rootNodeId[0] === '#' ? rootNodeId : `#${rootNodeId}`
  }

  const ast = parse(html
    // vue template comments that cause issues
    .replaceAll('<!--]-->', '')
    .replaceAll('<!--[-->', '')
    .replaceAll('<!---->', '')
    // ultrahtml can't pass this (from tailwind)
    .replaceAll('&amp;>', '&amp;&gt;'),
  )
  const title: string[] = []
  const ids: string[] = []
  const links: { role: string, link: string, textContent: string }[] = []

  let enteredRoot = !rootNodeId
  walkSync(ast, (node) => {
    if (node.attributes?.id === rootNodeId.substring(1)) {
      enteredRoot = true
    }
    if (!enteredRoot) {
      return
    }
    // Extract title
    if (node.type === ELEMENT_NODE && node.name === 'title') {
      if (node.children && node.children.length > 0) {
        title.push(node.children[0].value || '')
      }
    }

    // Extract IDs from elements inside rootNodeId
    if (node.type === ELEMENT_NODE && node.attributes?.id) {
      ids.push(node.attributes.id)
    }

    // Extract links from elements inside rootNodeId
    if (node.type === ELEMENT_NODE && node.name === 'a') {
      links.push({
        role: node.attributes?.role || '',
        link: node.attributes?.href || '',
        textContent: getTextContent(node),
      })
    }
  })

  return { title: title[0] || '', ids, links } satisfies ExtractedPayload
}

// Helper function to get text content from node
function getTextContent(node: any): string {
  const text: string[] = []

  if (typeof node.value === 'string' && node.value) {
    return node.value
  }

  if (node.attributes?.['aria-label'])
    return node.attributes['aria-label']
  if (node.attributes?.title)
    return node.attributes.title

  // Extract text from children
  if (node.children) {
    for (const child of node.children) {
      text.push(getTextContent(child))
    }
  }

  return text.filter(Boolean).map(s => s.trim()).join(' ')
}

export function isNuxtGenerate(nuxt: Nuxt = useNuxt()) {
  return nuxt.options._generate || nuxt.options.nitro.static || nuxt.options.nitro.preset === 'static'
}

export function prerender(config: ModuleOptions, nuxt = useNuxt()) {
  const urlFilter = createFilter({
    exclude: config.excludeLinks,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    const siteConfig = useSiteConfig()
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      const route = decodeURI(ctx.route)
      if (ctx.contents && !ctx.error && ctx.fileName?.endsWith('.html') && !route.endsWith('.html') && urlFilter(route))
        linkMap[route] = await extractPayload(ctx.contents, nuxt.options.app.rootAttrs?.id || '')

      setLinkResponse(route, Promise.resolve({ status: Number(ctx.error?.statusCode) || 200, statusText: ctx.error?.statusMessage || '', headers: {} }))
    })
    nitro.hooks.hook('prerender:done', async () => {
      const payloads = Object.entries(linkMap)
      if (!payloads?.length)
        return

      const { storage, storageFilepath } = createReportStorage(config, nuxt, nitro)
      const pageSearcher = createPageSearcher(payloads)

      nitro.logger.info('Running link inspections...')
      const inspectionCtx = {
        urlFilter,
        config,
        nuxt,
        pageSearcher,
        siteConfig,
        nitro,
        storage,
        storageFilepath,
      } satisfies InspectionContext
      const { allReports, errorCount } = await runInspections(payloads, inspectionCtx)

      const reportsWithContent = allReports.filter(
        ({ reports }) => reports.some(r => r.error?.length || r.warning?.length),
      )

      await generateReports(reportsWithContent as PathReport[], inspectionCtx)

      if (errorCount > 0 && config.failOnError) {
        nitro.logger.error(`Nuxt Link Checker found ${errorCount} errors, failing build.`)
        nitro.logger.log(gray('You can disable this by setting "linkChecker: { failOnError: false }" in your nuxt.config.'))
        process.exit(1)
      }
    })
  })
}

function createReportStorage(config: ModuleOptions, nuxt: Nuxt, nitro: Nitro) {
  const storageFilepath = typeof config.report?.storage === 'string'
    ? resolve(nuxt.options.rootDir, config.report?.storage)
    : nitro.options.output.dir

  const storage = createStorage(
    config.report?.storage && typeof config.report.storage !== 'string'
      ? config.report?.storage
      : {
          driver: fsDriver({
            base: storageFilepath,
          }),
        },
  )

  return { storage, storageFilepath }
}

function createPageSearcher(payloads: [route: string, payload: ExtractedPayload][]) {
  const links = payloads?.map(([route, payload]) => ({
    link: route,
    title: payload.title,
  })).flat()

  return new Fuse<{ link: string, title?: string }>(links, {
    keys: ['link', 'title'],
    threshold: 0.5,
  })
}

async function runInspections(payloads: [route: string, payload: ExtractedPayload][], opts: any) {
  const { urlFilter, config, nuxt, pageSearcher, siteConfig, nitro } = opts
  let routeCount = 0
  let errorCount = 0

  const allReports = (await Promise.all(payloads.map(async ([route, payload]) => {
    const reports = await Promise.all(payload.links?.map(async ({ link, textContent }) => {
      if (!urlFilter(link) || !link)
        return { error: [], warning: [], link }

      const response = await getLinkResponse({
        link,
        timeout: config.fetchTimeout,
        fetchRemoteUrls: config.fetchRemoteUrls,
        isInStorage() {
          return existsSync(resolve(nuxt.options.rootDir, nuxt.options.dir.public, withoutLeadingSlash(link)))
        },
      })

      return inspect({
        ids: linkMap[route].ids,
        fromPath: route,
        pageSearch: pageSearcher,
        siteConfig,
        link,
        textContent,
        response,
        skipInspections: config.skipInspections,
      })
    }))

    const errors = reports.filter(r => r.error?.length).length
    errorCount += errors
    const warnings = reports.filter(r => r.warning?.length).length

    if (errors || warnings) {
      const statusString = [
        errors > 0 ? red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
        warnings > 0 ? yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
      ].filter(Boolean).join(gray(', '))

      nitro.logger.log(gray(
        `  ${Number(routeCount + 1) === payload.links.length - 1 ? '└─' : '├─'} ${white(route)} ${gray('[')}${statusString}${gray(']')}`,
      ))

      reports.forEach((report) => {
        if (report.error?.length || report.warning?.length) {
          nitro.logger.log(dim(`    ${report.textContent} ${report.link}`))

          report.error?.forEach((error) => {
            nitro.logger.log(red(`        ✖ ${error.message}`) + gray(` (${error.name})`))
            if (error.fix)
              nitro.logger.log(gray(`          ${error.fixDescription}`))
          })

          report.warning?.forEach((warning) => {
            nitro.logger.log(yellow(`        ⚠ ${warning.message}`) + gray(` (${warning.name})`))
            if (warning.fix)
              nitro.logger.log(gray(`          ${warning.fixDescription}`))
          })
        }
      })
      routeCount++
    }

    return { route, reports } satisfies PathReport
  }))).flat()

  return { allReports, errorCount }
}
