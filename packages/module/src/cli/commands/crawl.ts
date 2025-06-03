import type { Request, Response, Source } from 'crawlee'
import type { useDrizzle } from '../../db/db'
import type { ExtractedPageData } from '../../lib/extract'
import { HttpCrawler, purgeDefaultStorages } from 'crawlee'
import { eq } from 'drizzle-orm'
import { withTrailingSlash } from 'ufo'
import { pageImages, pageLinks, pages, pageScripts, pageStyles, resources } from '../../db/audit/schema'
import { extractPageMetaConvertToMd } from '../../lib/extract'
import { calculateInternalLinkRanks } from '../../lib/ranking'
import { database, ensureStorageDir, storage } from '../util'
import { commandDb } from './db'

type DatabaseInstance = Awaited<ReturnType<typeof useDrizzle>>

interface ResourceMaps {
  imageResourceMap: Map<string, number>
  linkResourceMap: Map<string, number>
  scriptResourceMap: Map<string, number>
  styleResourceMap: Map<string, number>
}

interface CrawlCommandArgs {
  url: string
  crawlAssets?: boolean
}

async function getOrCreateResource(
  db: DatabaseInstance,
  url: string,
  resourceMap: Map<string, number>,
  resourceType: string = 'unknown',
): Promise<number | undefined> {
  const cachedResourceId = resourceMap.get(url)
  if (cachedResourceId)
    return cachedResourceId

  const resourceId = (await db.insert(resources).values({ url }).onConflictDoNothing().returning())?.[0]?.resourceId
  if (resourceId) {
    resourceMap.set(url, resourceId)
  }
  return resourceId
}

function isInternalLink(href: string, baseOrigin: string): boolean {
  try {
    // Handle relative URLs (always internal)
    if (href.startsWith('/') && !href.startsWith('//')) {
      return true
    }

    // Handle protocol-relative URLs
    if (href.startsWith('//')) {
      href = `https:${href}`
    }

    // Handle other protocols (mailto, tel, etc.) as external
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      return false
    }

    const linkUrl = new URL(href)
    const baseUrl = new URL(baseOrigin)

    return linkUrl.origin === baseUrl.origin
  }
  catch {
    // If URL parsing fails, assume external
    return false
  }
}

function isAssetUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Known asset file extensions that should be treated as resources
    const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.pdf', '.json', '.xml', '.txt', '.woff', '.woff2', '.ttf', '.eot', '.map']
    return assetExtensions.some(ext => pathname.toLowerCase().endsWith(ext))
  }
  catch {
    return false
  }
}

function createPageData(
  extractedData: ExtractedPageData,
  request: Request,
  response: Response,
  body: string,
  responseTime: number,
  crawlDepth: number,
): typeof pages.$inferInsert {
  const { seoData, nuxtData } = extractedData
  return {
    requestId: request.id!,
    statusCode: response.statusCode,
    headers: { ...response.headers },
    errorMessages: request.errorMessages,
    title: seoData.title,
    description: seoData.description,
    url: request.url,
    loadedUrl: request.loadedUrl || null,
    path: new URL(request.loadedUrl || request.url).pathname,
    contentLength: response?.headers?.['content-length'] ? Number.parseInt(response.headers['content-length'] as string, 10) : Buffer.byteLength(body, 'utf8'),
    canonical: seoData.canonical,
    metaRobots: seoData.metaRobots,
    h1: seoData.h1,
    wordCount: seoData.wordCount,
    lang: seoData.lang,
    viewport: seoData.viewport,
    ogTitle: seoData.ogTitle,
    ogDescription: seoData.ogDescription,
    ogImage: seoData.ogImage,
    responseTime,
    structuredData: seoData.structuredData.length > 0 ? seoData.structuredData : null,
    hreflang: seoData.hreflang.length > 0 ? seoData.hreflang : null,
    cacheControl: response.headers['cache-control'] as string || null,
    lastModified: response.headers['last-modified'] as string || null,
    etag: response.headers.etag as string || null,
    expires: response.headers.expires as string || null,
    crawlDepth,
    nuxtPayload: nuxtData.payload,
    isServerRendered: nuxtData.isServerRendered,
    isPrerendered: nuxtData.isPrerendered,
    prerenderedAt: nuxtData.prerenderedAt,
  }
}

async function persistPageData(
  db: DatabaseInstance,
  extractedData: ExtractedPageData,
  request: Request,
  response: Response,
  body: string,
  responseTime: number,
  resourceMaps: ResourceMaps,
  crawler: HttpCrawler,
  crawlAssets: boolean,
  baseOrigin: string,
): Promise<typeof pages.$inferSelect> {
  const { images, links, scripts, styles, nuxtData } = extractedData

  // Calculate crawl depth from request userData or use 0 for root page
  const path = new URL(request.loadedUrl || request.url).pathname
  const crawlDepth = request.userData?.depth ?? (path === '/' ? 0 : path.split('/').filter(Boolean).length)

  // Create page data object
  const pageData = createPageData(extractedData, request, response, body, responseTime, crawlDepth)
  console.log(`Inserting page: URL=${request.url}, LoadedURL=${request.loadedUrl}, Path=${pageData.path}`)

  // Insert page with conflict handling
  const page = (await db.insert(pages).values(pageData).onConflictDoUpdate({
    target: pages.path,
    set: pageData,
  }).returning()
  )[0]

  // Handle Nuxt payload if available
  if (nuxtData.payloadUrl) {
    try {
      console.log(`DEBUG: Processing Nuxt payload URL: ${nuxtData.payloadUrl} for page: ${request.url}`)
      const payloadResourceId = await getOrCreateResource(db, nuxtData.payloadUrl, resourceMaps.scriptResourceMap, 'nuxt-payload')
      if (payloadResourceId) {
        console.log(`DEBUG: Queueing payload request: ${nuxtData.payloadUrl} with resourceId: ${payloadResourceId}`)
        await crawler.addRequests([{
          url: nuxtData.payloadUrl,
          userData: { resourceId: payloadResourceId, pageId: page.pageId, resourceType: 'nuxt-payload' },
        }])
      }
      else {
        console.warn(`DEBUG: Failed to create resource for payload: ${nuxtData.payloadUrl}`)
      }
    }
    catch (error) {
      console.warn(`Failed to queue payload ${nuxtData.payloadUrl}:`, error)
    }
  }

  // Insert images and collect new sources to crawl
  const newImageSrcs: Source[] = []
  for (const image of images) {
    const resourceId = await getOrCreateResource(db, image.src!, resourceMaps.imageResourceMap, 'image')
    if (!resourceId) {
      console.warn(`Resource ${image.src} failed, skipping insert.`)
      continue
    }

    const isNewResource = !resourceMaps.imageResourceMap.has(image.src)
    if (isNewResource) {
      newImageSrcs.push({ url: image.src!, userData: { resourceId } })
    }

    await db.insert(pageImages).values({
      pageId: page.pageId,
      resourceId,
      alt: image.alt || null,
      width: image.width || null,
      height: image.height || null,
      loading: image.loading || null,
      fetchpriority: image.fetchpriority || null,
      sizes: image.sizes || null,
      srcset: image.srcset || null,
      ariaLabel: image.ariaLabel || null,
    })
  }

  // Insert links - create resources for all links but classify them properly
  for (const link of links) {
    const isInternal = isInternalLink(link.href!, baseOrigin)
    const isAsset = isAssetUrl(link.href!)

    // Determine resource type based on whether it's an asset or page
    const resourceType = isAsset ? 'asset-link' : (isInternal ? 'internal-page-link' : 'external-page-link')

    const resourceId = await getOrCreateResource(db, link.href!, resourceMaps.linkResourceMap, resourceType)
    if (!resourceId) {
      console.warn(`Resource ${link.href} failed, skipping insert.`)
      continue
    }

    await db.insert(pageLinks).values({
      pageId: page.pageId,
      resourceId,
      textContent: link.text || '',
      title: link.title || null,
      rel: link.rel || null,
      target: link.target || null,
      download: link.download || null,
      hreflang: link.hreflang || null,
      type: link.type || null,
      referrerpolicy: link.referrerpolicy || null,
      ariaLabel: link.ariaLabel || null,
      isInternal,
    })
  }

  // Insert scripts
  for (const script of scripts) {
    let resourceId = null
    if (script.src) {
      resourceId = await getOrCreateResource(db, script.src, resourceMaps.scriptResourceMap, 'script')
      if (!resourceId) {
        console.warn(`Resource ${script.src} failed, skipping insert.`)
        continue
      }

      const isNewResource = !resourceMaps.scriptResourceMap.has(script.src)
      if (isNewResource && crawlAssets && script.src.startsWith('/')) {
        await crawler.addRequests([{
          url: script.src,
          userData: { resourceId },
        }])
      }
    }

    await db.insert(pageScripts).values({
      pageId: page.pageId,
      resourceId,
      async: script.async,
      defer: script.defer,
      type: script.type || null,
      integrity: script.integrity || null,
      crossorigin: script.crossorigin || null,
      placement: script.placement,
      isInline: script.isInline,
      orderInPage: script.orderInPage,
    })
  }

  // Insert styles
  for (const style of styles) {
    let resourceId = null
    if (style.href) {
      resourceId = await getOrCreateResource(db, style.href, resourceMaps.styleResourceMap, 'style')
      if (!resourceId) {
        console.warn(`Resource ${style.href} failed, skipping insert.`)
        continue
      }

      const isNewResource = !resourceMaps.styleResourceMap.has(style.href)
      if (isNewResource && crawlAssets && style.href.startsWith('/')) {
        await crawler.addRequests([{
          url: style.href,
          userData: { resourceId },
        }])
      }
    }

    await db.insert(pageStyles).values({
      pageId: page.pageId,
      resourceId,
      media: style.media || null,
      disabled: style.disabled,
      integrity: style.integrity || null,
      crossorigin: style.crossorigin || null,
      placement: style.placement,
      isInline: style.isInline,
      orderInPage: style.orderInPage,
    })
  }

  // Add new image sources to crawl queue if asset crawling is enabled
  if (crawlAssets && newImageSrcs.length) {
    await crawler.addRequests(newImageSrcs)
  }

  return page
}

async function calculateInternalLinkRank(db: DatabaseInstance, baseUrl: string): Promise<void> {
  // Get all pages and their internal links
  const allPages = await db.select({
    pageId: pages.pageId,
    url: pages.url,
    path: pages.path,
    crawlDepth: pages.crawlDepth,
  }).from(pages)

  const allLinks = await db.select({
    pageId: pageLinks.pageId,
    resourceId: pageLinks.resourceId,
    url: resources.url,
  }).from(pageLinks).innerJoin(resources, eq(pageLinks.resourceId, resources.resourceId))

  // Use the extracted ranking logic
  const rankUpdates = calculateInternalLinkRanks(allPages, allLinks, baseUrl)

  // Update all page ranks in database
  for (const update of rankUpdates) {
    await db.update(pages)
      .set({ internalLinkRank: update.rank })
      .where(eq(pages.pageId, update.pageId))
  }

  console.log(`Updated internal link ranks for ${rankUpdates.length} pages`)
}

export async function commandCrawl(args: CrawlCommandArgs): Promise<void> {
  ensureStorageDir()
  const db = await database('crawl')
  const store = storage()

  // Migrate the db
  await commandDb('crawl')

  // Truncate the tables
  await db.delete(pageImages)
  await db.delete(pageLinks)
  await db.delete(pageScripts)
  await db.delete(pageStyles)
  await db.delete(pages)
  await db.delete(resources)

  // Resource caching maps
  const resourceMaps: ResourceMaps = {
    imageResourceMap: new Map<string, number>(),
    linkResourceMap: new Map<string, number>(),
    scriptResourceMap: new Map<string, number>(),
    styleResourceMap: new Map<string, number>(),
  }

  const crawler = new HttpCrawler({
    additionalMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ],
    failedRequestHandler: async ({ request, log }, error) => {
      const job = crawler.stats.requestsInProgress.get(request.id)
      const responseTime = job ? Date.now() - job.lastRunAt : 0

      log.error(`Failed to crawl ${request.loadedUrl || request.url}: ${error.message}`)

      // For HTML pages, still create a database record to track the failure
      if (!request.userData?.resourceId) {
        // Calculate crawl depth for failed page
        const path = new URL(request.loadedUrl || request.url).pathname
        const crawlDepth = request.userData?.depth ?? (path === '/' ? 0 : path.split('/').filter(Boolean).length)

        // Insert failed page record
        await db.insert(pages).values({
          requestId: request.id!,
          statusCode: 500, // Default to 500 for failed requests
          headers: {},
          errorMessages: [error.message],
          title: null,
          description: null,
          url: request.url,
          loadedUrl: request.loadedUrl || null,
          path,
          contentLength: 0,
          // SEO columns - all null for failed pages
          canonical: null,
          metaRobots: null,
          h1: null,
          wordCount: 0,
          lang: null,
          viewport: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          // Performance/Advanced columns
          responseTime,
          structuredData: null,
          hreflang: null,
          // Caching columns - all null for failed pages
          cacheControl: null,
          lastModified: null,
          etag: null,
          expires: null,
          // Crawl tracking
          crawlDepth,
          // Internal link rank will be calculated later (likely very low due to no content)
          internalLinkRank: null,
          // Nuxt payload data - null for failed pages
          nuxtPayload: null,
          isServerRendered: null,
          isPrerendered: null,
          prerenderedAt: null,
          payloadSize: null,
        }).onConflictDoNothing()
      }
      else {
        // For resources (images, scripts, styles), update the resource record
        await db.update(resources)
          .set({
            statusCode: 500,
            headers: {},
            loadedUrl: request.loadedUrl,
            contentLength: 0,
            contentType: null,
            responseTime,
          })
          .where(eq(resources.resourceId, Number(request.userData.resourceId)))
      }
    },
    async requestHandler({ crawler, contentType, response, request, enqueueLinks, log, body }) {
      const html = typeof body === 'string' ? body : body.toString('utf8')
      // Only debug payload requests
      if (request.userData?.resourceType === 'nuxt-payload') {
        console.log(`DEBUG: Processing payload request - URL: ${request.url}, Content-Type: ${contentType.type}`)
      }

      const job = crawler.stats.requestsInProgress.get(request.id)
      const responseTime = Date.now() - job.lastRunAt
      log.info(`${response.statusCode} ${request.loadedUrl} (${responseTime}ms)`)

      if (contentType.type === 'text/html') {
        // Store HTML for analysis
        await store.set(`html/${request.id}.html`, html)

        // Extract page data and convert to markdown
        const baseUrl = new URL(request.loadedUrl || request.url)
        const { markdown, extractedData } = await extractPageMetaConvertToMd(
          html,
          baseUrl.origin,
        )

        // Store the markdown
        await store.set(`md/${request.id}.md`, markdown)

        // Persist to database
        await persistPageData(
          db,
          extractedData,
          request,
          response,
          body,
          responseTime,
          resourceMaps,
          crawler,
          !!args.crawlAssets,
          baseUrl.origin,
        )

        const internalLinks = extractedData.links.filter((link) => {
          return link.href && isInternalLink(link.href, baseUrl.origin)
        })

        // Add internal links to crawling queue
        if (internalLinks.length > 0) {
          await enqueueLinks({
            urls: internalLinks.map(link => link.href),
            exclude: [
              /\/__/, // ignore links starting with /_*
              /\.md$/, // ignore .md files
              // IGNORE CDN-CGI
              /cdn-cgi\//, // ignore Cloudflare CDN links
            ],
            userData: {
              depth: (request.userData?.depth ?? 0) + 1,
            },
          })
        }
      }
      else {
        // Handle resource responses (images, scripts, styles)
        const contentLength = response?.headers?.['content-length'] ? Number.parseInt(response.headers['content-length'] as string, 10) : Buffer.byteLength(body, 'utf8')

        await db.update(resources)
          .set({
            statusCode: response.statusCode,
            headers: { ...response.headers },
            loadedUrl: request.loadedUrl,
            contentLength,
            contentType: contentType.type,
            cacheControl: response.headers['cache-control'] as string || null,
            lastModified: response.headers['last-modified'] as string || null,
            etag: response.headers.etag as string || null,
            expires: response.headers.expires as string || null,
            responseTime,
            contentEncoding: response.headers['content-encoding'] as string || null,
          })
          .where(eq(resources.resourceId, Number(request.userData.resourceId)))

        // If this is a Nuxt payload file, update the page's payloadSize
        if (request.userData.pageId && request.userData.resourceType === 'nuxt-payload') {
          await db.update(pages)
            .set({ payloadSize: contentLength })
            .where(eq(pages.pageId, Number(request.userData.pageId)))

          log.info(`Updated payload size for page ${request.userData.pageId}: ${contentLength} bytes`)
        }
      }
    },
    maxRequestsPerCrawl: 5_000,
    maxConcurrency: 30,
    minConcurrency: 5,
    respectRobotsTxtFile: false,
  })

  await crawler.run([withTrailingSlash(args.url)])

  // Calculate internal link ranks after crawling is complete
  await calculateInternalLinkRank(db, args.url)

  await purgeDefaultStorages()
}
