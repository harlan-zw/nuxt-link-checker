import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { ExtractedPayload, InspectionContext, PathReport } from './build/report'
import type { ModuleOptions } from './module'
import type { LinkInspectionResult } from './runtime/types'
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
import { runParallel } from './build/util'
import { getLinkResponse, getResolvedLinkResponses, setLinkResponse } from './runtime/shared/crawl'
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
  return nuxt.options.nitro.static || (nuxt.options as any)._generate /* TODO: remove in future */ || nuxt.options.nitro.static || nuxt.options.nitro.preset === 'static'
}

export function prerender(config: ModuleOptions, version?: string, nuxt = useNuxt()) {
  if (config.report?.publish) {
    // make paths non indexable using X-Robots-Tag
    nuxt.options.nitro.routeRules = nuxt.options.nitro.routeRules || {}
    nuxt.options.nitro.routeRules['/__link-checker__/*'] = {
      headers: {
        'X-Robots-Tag': 'noindex',
      },
    }
    // Nuxt Robots integration
    // @ts-expect-error untyped
    nuxt.hooks.hook('robots:config', (config) => {
      // @ts-expect-error untyped
      const catchAll = config.groups?.find(g => g.userAgent?.includes('*'))
      if (catchAll) {
        catchAll.disallow.push('/__link-checker__')
      }
    })
  }
  const urlFilter = createFilter({
    exclude: config.excludeLinks,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    const siteConfig = useSiteConfig()
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      const route = decodeURI(ctx.route)
      if (ctx.contents && !ctx.error && ctx.fileName?.endsWith('.html') && !route.endsWith('.html') && urlFilter(route))
        linkMap[route] = await extractPayload(ctx.contents, nuxt.options.app.rootAttrs?.id || '')

      setLinkResponse(route, Promise.resolve({
        status: Number(ctx.error?.statusCode) || 200,
        statusText: ctx.error?.statusMessage || '',
        headers: {
          'Content-Type': ctx.contentType,
        },
      }))
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
        version,
        storage,
        storageFilepath,
        isPrerenderingAllRoutes: isNuxtGenerate(nuxt) || Boolean(nuxt.options.nitro.prerender?.crawlLinks),
        totalRoutes: payloads.length,
      } satisfies InspectionContext
      const { allReports, errorCount } = await runInspections(payloads, inspectionCtx)

      const reportsWithContent = allReports.filter(
        ({ reports }) => reports.some(r => r.error?.length || r.warning?.length),
      )

      await generateReports(reportsWithContent as PathReport[], inspectionCtx)

      if (config.debug) {
        // write the link responses
        await storage.setItem('debug-link-responses.json', JSON.stringify(await getResolvedLinkResponses()))
      }

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
    : (config.report?.publish ? `${nitro.options.output.publicDir}/__link-checker__/` : nitro.options.output.dir)

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

/**
 * Run link inspections on all pages and generate reports
 * @param payloads Array of route and payload pairs from prerendering
 * @param context Inspection context containing all needed dependencies
 * @returns Object with all reports and error count
 */
async function runInspections(
  payloads: [route: string, payload: ExtractedPayload][],
  context: InspectionContext,
): Promise<{ allReports: PathReport[], errorCount: number }> {
  const { config, nitro } = context
  let errorCount = 0
  let warningCount = 0
  let routeWithIssuesCount = 0
  const totalRoutes = payloads.length
  const allReports: PathReport[] = []

  // Create a set of inputs for parallel processing
  const inputs = new Set<[route: string, payload: ExtractedPayload]>(payloads)

  // Process routes in parallel
  await runParallel<[route: string, payload: ExtractedPayload]>(
    inputs,
    async ([route, payload]) => {
      const reports = await processRouteLinks(route, payload, context)

      // Update counts
      const routeErrors = reports.filter(r => r.error?.length).length
      const routeWarnings = reports.filter(r => r.warning?.length).length

      if (routeErrors || routeWarnings) {
        // Use atomic updates to avoid race conditions
        errorCount += routeErrors
        warningCount += routeWarnings
        routeWithIssuesCount++

        // Only log detailed results if reports are not enabled
        if (!hasReportsEnabled(config)) {
          logRouteIssues(route, reports, routeErrors, routeWarnings, nitro)
        }
      }

      // Add to reports collection
      allReports.push({ route, reports } satisfies PathReport)
    },
    { concurrency: 5, interval: 10 }, // Process 5 routes in parallel with small delay between starts
  )

  // Show summary at the end
  logSummary(
    totalRoutes,
    routeWithIssuesCount,
    errorCount,
    warningCount,
    nitro,
  )

  return { allReports, errorCount }
}

/**
 * Process all links for a single route
 */
async function processRouteLinks(
  route: string,
  payload: ExtractedPayload,
  context: InspectionContext,
) {
  const { urlFilter, config, nuxt, siteConfig, pageSearcher } = context

  // Process links in parallel but with controlled concurrency
  const links = payload.links || []
  const allReports: Partial<LinkInspectionResult>[] = []

  // Create a set of inputs for parallel processing
  const inputs = new Set<ExtractedPayload['links'][number]>(links)

  await runParallel<ExtractedPayload['links'][number]>(
    inputs,
    async ({ link, textContent }) => {
      if (!urlFilter(link) || !link) {
        allReports.push({ error: [], warning: [], link })
        return
      }

      const response = await getLinkResponse({
        link,
        timeout: config.fetchTimeout,
        fetchRemoteUrls: config.fetchRemoteUrls,
        isInStorage() {
          return existsSync(resolve(nuxt.options.rootDir, nuxt.options.dir.public, withoutLeadingSlash(link)))
        },
      })

      const report = inspect({
        ids: linkMap[route].ids,
        fromPath: route,
        pageSearch: pageSearcher,
        siteConfig,
        link,
        textContent,
        response,
        skipInspections: config.skipInspections,
      })

      // Add to report collection
      allReports.push(report)
    },
    { concurrency: 5, interval: 5 }, // Process 5 links in parallel with small delay
  )

  return allReports
}

/**
 * Log summary of inspection results
 */
function logSummary(
  totalRoutes: number,
  routesWithIssues: number,
  errorCount: number,
  warningCount: number,
  nitro: Nitro,
) {
  // Always show the summary header with check mark or x
  nitro.logger.info(`Nuxt Link Checker Summary`)

  // Main stats
  nitro.logger.log(`  ${white('Failing Pages:')} ${routesWithIssues} of ${totalRoutes}`)

  if (errorCount > 0) {
    nitro.logger.log(`  ${red('❌ Total errors:')} ${errorCount}`)
  }
  else {
    nitro.logger.log(`  ${white('Total errors:')} 0`)
  }

  if (warningCount > 0) {
    nitro.logger.log(`  ${yellow('⚠️ Total warnings:')} ${warningCount}`)
  }
  else {
    nitro.logger.log(`  ${white('Total warnings:')} 0`)
  }
}

/**
 * Check if any reports are enabled in configuration
 */
function hasReportsEnabled(config: ModuleOptions): boolean {
  return Boolean(
    config.report?.html
    || config.report?.markdown
    || config.report?.json,
  )
}

/**
 * Log issues for a single route (used when no reports are enabled)
 */
function logRouteIssues(
  route: string,
  reports: any[],
  errors: number,
  warnings: number,
  nitro: Nitro,
): void {
  const statusString = [
    errors > 0 ? red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
    warnings > 0 ? yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
  ].filter(Boolean).join(gray(', '))

  nitro.logger.log(gray(''))
  nitro.logger.log(`${white(route)} ${gray('[')}${statusString}${gray(']')}`)

  const reportsByLink = groupReportsByLink(reports)

  Object.entries(reportsByLink).forEach(([link, issues], index, array) => {
    const isLast = index === array.length - 1
    const prefix = isLast ? '└─' : '├─'

    nitro.logger.log(gray(`  ${prefix} ${white(truncateString(link, 60))}`))

    if (issues.textContent) {
      nitro.logger.log(gray(`  ${isLast ? '   ' : '│  '} "${issues.textContent}"`))
    }

    // Log errors
    issues.errors.forEach((error, idx, arr) => {
      const errorPrefix = idx === arr.length - 1 && issues.warnings.length === 0 ? '└─' : '├─'
      nitro.logger.log(`  ${isLast ? '   ' : '│  '} ${errorPrefix} ${red(error.message)} ${dim(`(${error.name})`)}`)

      if (error.fix) {
        nitro.logger.log(gray(`  ${isLast ? '   ' : '│  '} ${idx === arr.length - 1 && issues.warnings.length === 0 ? '   ' : '│  '} Fix: ${error.fixDescription}`))
      }
    })

    // Log warnings
    issues.warnings.forEach((warning, idx, arr) => {
      const warnPrefix = idx === arr.length - 1 ? '└─' : '├─'
      nitro.logger.log(`  ${isLast ? '   ' : '│  '} ${warnPrefix} ${yellow(warning.message)} ${dim(`(${warning.name})`)}`)

      if (warning.fix) {
        nitro.logger.log(gray(`  ${isLast ? '   ' : '│  '} ${idx === arr.length - 1 ? '   ' : '│  '} Fix: ${warning.fixDescription}`))
      }
    })
  })
}

/**
 * Group reports by link for cleaner logging
 */
function groupReportsByLink(reports: any[]): Record<string, { textContent: string, errors: any[], warnings: any[] }> {
  const result: Record<string, { textContent: string, errors: any[], warnings: any[] }> = {}

  reports.forEach((report) => {
    if ((report.error?.length || 0) + (report.warning?.length || 0) === 0) {
      return
    }

    if (!result[report.link]) {
      result[report.link] = {
        textContent: report.textContent || '',
        errors: [],
        warnings: [],
      }
    }

    if (report.error?.length) {
      result[report.link].errors.push(...report.error)
    }

    if (report.warning?.length) {
      result[report.link].warnings.push(...report.warning)
    }
  })

  return result
}

/**
 * Helper function to truncate long strings
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return `${str.substring(0, maxLength - 3)}...`
}
