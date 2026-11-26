import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { Storage } from 'unstorage'
import type { ExtractedPayload, InspectionContext, PathReport } from './build/report'
import type { ModuleOptions } from './module'
import type { LinkResponse } from './runtime/shared/crawl'
import type { LinkInspectionResult } from './runtime/types'
import { existsSync } from 'node:fs'
import { extendRouteRules, getNitroVersion, useNuxt, useRuntimeConfig } from '@nuxt/kit'
import { colors } from 'consola/utils'
import Fuse from 'fuse.js'
import { useSiteConfig } from 'nuxt-site-config/kit'
import { isNuxtGenerate } from 'nuxtseo-shared/kit'
import { createPrerenderFetch } from 'nuxtseo-shared/prerender'
import { resolve } from 'pathe'
import { withBase, withoutLeadingSlash } from 'ufo'
import { ELEMENT_NODE, parse, walkSync } from 'ultrahtml'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { generateReports } from './build/report.ts'
import { runParallel, truncateString } from './build/util.ts'
import { crawlFetch, getLinkResponse, getResolvedLinkResponses, setLinkResponse, UNREACHABLE_STATUS } from './runtime/shared/crawl.ts'
import { inspect } from './runtime/shared/inspect.ts'
import { isRedirectStatus } from './runtime/shared/inspections/util.ts'
import { createPublicDirectoryIndexLookup } from './runtime/shared/public-dir.ts'
import { createFilter } from './runtime/shared/sharedUtils.ts'

const { gray, yellow, dim, red, white } = colors

const linkMap: Record<string, ExtractedPayload> = {}

// h3 and Nuxt answer a redirect with a body that holds this tag, and Nitro prerenders that body as the page
const META_REFRESH_RE = /<meta[^>]+http-equiv=["']?refresh/i
const MAX_REDIRECT_HOPS = 20
const LOCAL_REDIRECT_ORIGIN = 'http://prerender.invalid'

function safeDecodeURI(path: string): string {
  try {
    return decodeURI(path)
  }
  catch {
    return path
  }
}

function readRedirect(response: LinkResponse): { status: number, location: string } | undefined {
  if (response.redirect)
    return response.redirect
  const location = response.headers?.location
  if (isRedirectStatus(response.status) && typeof location === 'string' && location)
    return { status: response.status, location }
  return undefined
}

function resolveLocalRedirect(location: string, fromPath: string, baseURL: string): { fetchPath: string, location: string } | undefined {
  const trimmed = location.trim()
  if (!trimmed || trimmed.startsWith('//') || /^[a-z][a-z\d+\-.]*:/i.test(trimmed))
    return undefined
  try {
    const url = new URL(trimmed, new URL(fromPath, LOCAL_REDIRECT_ORIGIN))
    if (url.origin !== LOCAL_REDIRECT_ORIGIN)
      return undefined
    // Keep root-relative locations as written; resolve document-relative hops against the current path.
    const nextLocation = trimmed.startsWith('/') ? trimmed : `${url.pathname}${url.search}${url.hash}`
    return {
      fetchPath: withBase(`${url.pathname}${url.search}`, baseURL),
      location: nextLocation,
    }
  }
  catch {
    return undefined
  }
}

function normalizeVisitKey(path: string): string {
  const url = new URL(path, LOCAL_REDIRECT_ORIGIN)
  return `${url.pathname}${url.search}`
}

/**
 * Follow local redirects for a prerendered meta refresh route against the prerender app.
 * Stops at the first non-redirect response, an external target, a cycle, or the hop limit.
 */
export async function resolvePrerenderRedirect(
  route: string,
  prerenderedResponse: LinkResponse,
  options: {
    baseURL?: string
    fetch: (path: string) => Promise<LinkResponse>
    maxHops?: number
  },
): Promise<LinkResponse | undefined> {
  const baseURL = options.baseURL || '/'
  const maxHops = options.maxHops ?? MAX_REDIRECT_HOPS
  let currentPath = withBase(route, baseURL)
  let current = await options.fetch(currentPath)
  const firstHop = readRedirect(current)
  if (!firstHop)
    return undefined

  let lastLocation = firstHop.location.trim()
  const visited = new Set([normalizeVisitKey(currentPath)])

  for (let hops = 0; ; hops++) {
    const hop = readRedirect(current)
    if (!hop)
      break

    const resolved = resolveLocalRedirect(hop.location, currentPath, baseURL)
    if (!resolved) {
      // Redirects to another site keep the prerendered response instead of making an external request.
      return {
        status: prerenderedResponse.status,
        statusText: prerenderedResponse.statusText,
        headers: prerenderedResponse.headers,
        redirect: { status: firstHop.status, location: hop.location.trim() },
      }
    }

    lastLocation = resolved.location
    const visitKey = normalizeVisitKey(resolved.fetchPath)
    if (visited.has(visitKey)) {
      return {
        status: UNREACHABLE_STATUS,
        statusText: 'Redirect loop',
        headers: {},
        redirect: { status: firstHop.status, location: lastLocation },
      }
    }
    if (hops >= maxHops) {
      return {
        status: UNREACHABLE_STATUS,
        statusText: 'Too many redirects',
        headers: {},
        redirect: { status: firstHop.status, location: lastLocation },
      }
    }

    visited.add(visitKey)
    currentPath = resolved.fetchPath
    current = await options.fetch(safeDecodeURI(currentPath))
  }

  return {
    status: current.status,
    statusText: current.statusText,
    headers: current.headers,
    redirect: { status: firstHop.status, location: lastLocation },
  }
}

/**
 * Extract the title, element ids, and links from a rendered page.
 *
 * Reads the whole document: `<Teleport to="body">` renders before the app root and `#teleports` after it,
 * and both hold links the user sees.
 */
export async function extractPayload(html: string): Promise<ExtractedPayload> {
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

  walkSync(ast, (node) => {
    // Extract title
    if (node.type === ELEMENT_NODE && node.name === 'title') {
      if (node.children && node.children.length > 0) {
        title.push(node.children[0]?.value || '')
      }
    }

    // Extract IDs
    if (node.type === ELEMENT_NODE && node.attributes?.id) {
      ids.push(node.attributes.id)
    }

    // Extract links, including anchors without an href, so no-missing-href can report them
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

export function prerender(config: ModuleOptions, version?: string, routeFileMap: Record<string, string> = {}, nuxt = useNuxt()): void {
  if (config.report?.publish) {
    // make paths non indexable using X-Robots-Tag
    extendRouteRules('/__link-checker__/*', {
      headers: {
        'X-Robots-Tag': 'noindex',
      },
    })
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
  const { baseURL } = useRuntimeConfig().app
  const pageFilter = createFilter({
    exclude: config.excludePages,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    // Nuxt resolves module options before modules:done hooks can add exclusions.
    const lateConfig = nuxt.options.linkChecker || undefined
    const excludedLinks = new Set([...config.excludeLinks, ...lateConfig?.excludeLinks ?? []])
    if (baseURL && baseURL.length > 2)
      excludedLinks.add(baseURL)
    const urlFilter = createFilter({ exclude: [...excludedLinks] })
    let prerenderClient: ReturnType<typeof createPrerenderFetch> | undefined
    // prerendered routes that rendered a meta refresh, keyed without app.baseURL, so each may be a redirect
    const refreshRoutes = new Map<string, LinkResponse>()
    nitro.hooks.hook('prerender:init', (renderer) => {
      const major = getNitroVersion(nuxt)
      if (major !== 2 && major !== 3)
        throw new Error(`Unsupported Nitro prerender builder: ${major}`)
      prerenderClient = createPrerenderFetch(renderer, major)
    })
    const siteConfig = useSiteConfig()
    // Nitro skips prerendering, and so prerender:done, when a build has no routes to prerender
    let scanned = false
    nitro.hooks.hook('compiled', () => {
      if (scanned || nuxt.options.dev || nuxt.options._prepare)
        return
      nitro.logger.info('Nuxt Link Checker scanned no pages: the build prerendered no HTML pages. Use `nuxt generate` or add routes to `nitro.prerender.routes`. To hide this message, set `linkChecker.runOnBuild: false`.')
    })
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      const route = decodeURI(ctx.route)
      if (ctx.contents && !ctx.error && ctx.fileName?.endsWith('.html') && !route.endsWith('.html') && pageFilter(route))
        linkMap[route] = await extractPayload(ctx.contents)

      // Nitro 2 sets statusCode and statusMessage on the error, Nitro 3 sets status and statusText
      const error = ctx.error as { statusCode?: number, statusMessage?: string, status?: number, statusText?: string } | undefined
      const response: LinkResponse = {
        status: Number(error?.statusCode ?? error?.status) || 200,
        statusText: error?.statusMessage ?? error?.statusText ?? '',
        headers: {
          'Content-Type': ctx.contentType,
        },
      }
      setLinkResponse(route, Promise.resolve(response))
      // Nitro passes no response status to prerender hooks, so a prerendered redirect reads as a 200 page
      if (ctx.contents && !ctx.error && META_REFRESH_RE.test(ctx.contents))
        refreshRoutes.set(route, response)
    })
    nitro.hooks.hook('prerender:done', async () => {
      // sort by route: prerendering finishes in a different order on every build, and both the
      // page search index and the report inherit whatever order we hand them
      const payloads = Object.entries(linkMap).sort(([a], [b]) => a.localeCompare(b))
      if (!payloads.length)
        return
      scanned = true

      // ask the prerender app for each meta refresh route and follow local redirect chains to where the link lands
      const client = prerenderClient
      if (client) {
        const fetchOptions = { fetch: client.fetch, timeout: config.fetchTimeout, followRedirects: false }
        await Promise.all([...refreshRoutes].map(async ([route, response]) => {
          const resolved = await resolvePrerenderRedirect(route, response, {
            baseURL: nitro.options.baseURL,
            fetch: target => crawlFetch(target, fetchOptions),
          })
          if (resolved)
            setLinkResponse(route, Promise.resolve(resolved))
        }))
      }

      const { storage, storageFilepath } = createReportStorage(config, nuxt, nitro)
      const pageSearcher = createPageSearcher(payloads)

      nitro.logger.info('Running link inspections...')
      const inspectionCtx = {
        urlFilter,
        pageFilter,
        config,
        nuxt,
        pageSearcher,
        siteConfig,
        fetch: prerenderClient?.fetch,
        nitro,
        version,
        storage,
        storageFilepath,
        isPrerenderingAllRoutes: isNuxtGenerate(nuxt) || Boolean(nuxt.options.nitro.prerender?.crawlLinks),
        totalRoutes: payloads.length,
        routeFileMap,
      } satisfies InspectionContext
      const { allReports, errorCount } = await runInspections(payloads, inspectionCtx).finally(() => prerenderClient?.close())

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

function createReportStorage(config: ModuleOptions, nuxt: Nuxt, nitro: Nitro): { storage: Storage, storageFilepath: string } {
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

function createPageSearcher(payloads: [route: string, payload: ExtractedPayload][]): Fuse<{ link: string, title?: string }> {
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
  // keep a slot per route so the report order does not depend on which worker finishes first
  const reportSlots: (PathReport | undefined)[] = Array.from({ length: totalRoutes })

  // Process routes in parallel
  await runParallel<[route: string, payload: ExtractedPayload]>(
    payloads,
    async ([route, payload], index) => {
      reportSlots[index] = {
        route,
        reports: await processRouteLinks(route, payload, context),
      } satisfies PathReport
    },
    { concurrency: 5 }, // Process 5 routes in parallel
  )
  // a route whose inspection threw leaves an empty slot
  const allReports = reportSlots.filter(Boolean) as PathReport[]

  // Count and log in route order, so the output is the same on every build
  for (const { route, reports } of allReports) {
    const routeErrors = reports.filter(r => r.error?.length).length
    const routeWarnings = reports.filter(r => r.warning?.length).length
    if (!routeErrors && !routeWarnings) {
      continue
    }
    errorCount += routeErrors
    warningCount += routeWarnings
    routeWithIssuesCount++

    // Only log detailed results if reports are not enabled
    if (!hasReportsEnabled(config)) {
      logRouteIssues(route, reports, routeErrors, routeWarnings, nitro, context.routeFileMap)
    }
  }

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
): Promise<Partial<LinkInspectionResult>[]> {
  const { urlFilter, config, nuxt, siteConfig, pageSearcher } = context
  const publicDir = resolve(nuxt.options.rootDir, nuxt.options.dir.public)
  const isPublicDirectoryIndex = createPublicDirectoryIndexLookup(publicDir)

  // Process links in parallel but with controlled concurrency
  const links = payload.links || []
  // keep a slot per link so the report order does not depend on which worker finishes first
  const reportSlots: (Partial<LinkInspectionResult> | undefined)[] = Array.from({ length: links.length })

  await runParallel<ExtractedPayload['links'][number]>(
    links,
    async ({ link, role, textContent }, index) => {
      if (link && !urlFilter(link)) {
        reportSlots[index] = { error: [], warning: [], link }
        return
      }

      // an anchor without an href has nothing to fetch; the rules still run so no-missing-href can report it
      const response = !link
        ? null
        : await getLinkResponse({
            link,
            baseURL: siteConfig.url,
            fetch: context.fetch,
            timeout: config.fetchTimeout,
            fetchRemoteUrls: config.fetchRemoteUrls,
            isInStorage() {
              return existsSync(resolve(publicDir, withoutLeadingSlash(link)))
            },
          })

      const report = inspect({
        ids: linkMap[route]!.ids,
        role,
        fromPath: route,
        pageSearch: pageSearcher,
        siteConfig,
        link,
        textContent,
        response,
        skipInspections: config.skipInspections,
        isPublicDirectoryIndex,
      })

      // Add to report collection
      reportSlots[index] = report
    },
    { concurrency: 5 }, // Process 5 links in parallel
  )

  // a link whose inspection threw leaves an empty slot
  return reportSlots.filter(Boolean) as Partial<LinkInspectionResult>[]
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
): void {
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
  routeFileMap: Record<string, string> = {},
): void {
  const statusString = [
    errors > 0 ? red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
    warnings > 0 ? yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
  ].filter(Boolean).join(gray(', '))

  const filePath = routeFileMap[route]
  nitro.logger.log(gray(''))
  nitro.logger.log(`${white(route)} ${gray('[')}${statusString}${gray(']')}${filePath ? ` ${dim(filePath)}` : ''}`)

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
      result[report.link]!.errors.push(...report.error)
    }

    if (report.warning?.length) {
      result[report.link]!.warnings.push(...report.warning)
    }
  })

  return result
}
