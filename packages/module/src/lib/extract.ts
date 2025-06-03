import type { InferInsertModel } from 'drizzle-orm'
import type { pageImages, pageLinks, pages, pageScripts, pageStyles } from '../db/audit/schema'
import { htmlToMarkdown } from 'mdream'
import { extractionPlugin } from 'mdream/plugins'

// Use Drizzle's InferInsertModel to derive types from schema
export type ExtractedImage = Omit<InferInsertModel<typeof pageImages>, 'pageId' | 'resourceId'> & {
  src: string // Add the src field that we extract before inserting
}

export type ExtractedLink = Omit<InferInsertModel<typeof pageLinks>, 'pageId' | 'resourceId'> & {
  href: string // Add the href field that we extract before inserting
}

export type ExtractedScript = Omit<InferInsertModel<typeof pageScripts>, 'pageId' | 'resourceId' | 'contentHash'> & {
  src?: string | null // Add the src field that we extract before inserting
  content?: string | null // Add content for inline scripts
}

export type ExtractedStyle = Omit<InferInsertModel<typeof pageStyles>, 'pageId' | 'resourceId' | 'contentHash'> & {
  href?: string | null // Add the href field that we extract before inserting
  content?: string | null // Add content for inline styles
}

// Extract SEO and Nuxt data fields from the pages table
type PagesInsert = InferInsertModel<typeof pages>
export type ExtractedSeoData = Pick<PagesInsert, 'title' | 'description' | 'canonical' | 'metaRobots' | 'h1' | 'lang' |
  'viewport' | 'ogTitle' | 'ogDescription' | 'ogImage' | 'structuredData' | 'hreflang'> & {
    wordCount: number
  }

export type ExtractedNuxtData = Pick<PagesInsert, 'nuxtPayload' | 'isServerRendered' | 'isPrerendered' | 'prerenderedAt'> & {
  payloadUrl: string | null
}

export interface ExtractedPageData {
  images: ExtractedImage[]
  links: ExtractedLink[]
  scripts: ExtractedScript[]
  styles: ExtractedStyle[]
  seoData: ExtractedSeoData
  nuxtData: ExtractedNuxtData
}

export async function extractPageMetaConvertToMd(
  body: string,
  origin: string,
): Promise<{ markdown: string, extractedData: ExtractedPageData }> {
  // Helper function to resolve URLs
  function resolveUrl(url: string | null | undefined): string | null {
    if (!url)
      return null

    // Already absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Protocol-relative URL
    if (url.startsWith('//')) {
      const base = new URL(origin)
      return `${base.protocol}${url}`
    }

    // Absolute path
    if (url.startsWith('/')) {
      return `${origin}${url}`
    }

    // Relative path - return as-is for now (would need base path to resolve properly)
    return url
  }

  // Create extraction data storage
  const extractedData: ExtractedPageData = {
    images: [],
    links: [],
    scripts: [],
    styles: [],
    seoData: {
      title: null,
      description: null,
      canonical: null,
      metaRobots: null,
      h1: null,
      lang: null,
      viewport: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      wordCount: 0,
      structuredData: [],
      hreflang: [],
    },
    nuxtData: {
      nuxtPayload: null,
      isServerRendered: null,
      isPrerendered: null,
      prerenderedAt: null,
      payloadUrl: null,
    },
  }

  // Shared counters for ordering
  let scriptOrder = 0
  let styleOrder = 0

  // Build the extraction plugin with all selectors
  const extractionSelectors: Record<string, (element: any) => void> = {
    // Extract images
    'img': (element) => {
      const src = resolveUrl(element.attributes.src)
      if (src) {
        extractedData.images.push({
          src,
          alt: element.attributes.alt || null,
          width: element.attributes.width || null,
          height: element.attributes.height || null,
          loading: element.attributes.loading || null,
          fetchpriority: element.attributes.fetchpriority || null,
          sizes: element.attributes.sizes || null,
          srcset: element.attributes.srcset || null,
          ariaLabel: element.attributes['aria-label'] || null,
        })
      }
    },

    // Extract links
    'a[href]': (element) => {
      const href = resolveUrl(element.attributes.href)
      if (href && !href.startsWith('#')) {
        extractedData.links.push({
          href,
          text: element.textContent || '',
          title: element.attributes.title || null,
          rel: element.attributes.rel || null,
          target: element.attributes.target || null,
          download: element.attributes.download || null,
          hreflang: element.attributes.hreflang || null,
          type: element.attributes.type || null,
          referrerpolicy: element.attributes.referrerpolicy || null,
          ariaLabel: element.attributes['aria-label'] || null,
        })
      }
    },

    // Extract SEO title
    'title': (element) => {
      extractedData.seoData.title = element.textContent || null
    },

    // Extract meta description
    'meta[name="description"]': (element) => {
      extractedData.seoData.description = element.attributes.content || null
    },

    // Extract canonical URL
    'link[rel="canonical"]': (element) => {
      extractedData.seoData.canonical = element.attributes.href || null
    },

    // Extract meta robots
    'meta[name="robots"]': (element) => {
      extractedData.seoData.metaRobots = element.attributes.content || null
    },

    // Extract H1
    'h1': (element) => {
      if (!extractedData.seoData.h1) {
        extractedData.seoData.h1 = element.textContent || null
      }
    },

    // Extract HTML lang
    'html[lang]': (element) => {
      extractedData.seoData.lang = element.attributes.lang || null
    },

    // Extract viewport
    'meta[name="viewport"]': (element) => {
      extractedData.seoData.viewport = element.attributes.content || null
    },

    // Extract Open Graph title
    'meta[property="og:title"]': (element) => {
      extractedData.seoData.ogTitle = element.attributes.content || null
    },

    // Extract Open Graph description
    'meta[property="og:description"]': (element) => {
      extractedData.seoData.ogDescription = element.attributes.content || null
    },

    // Extract Open Graph image
    'meta[property="og:image"]': (element) => {
      extractedData.seoData.ogImage = element.attributes.content || null
    },

    // Extract structured data (JSON-LD)
    'script[type="application/ld+json"]': (element) => {
      try {
        const jsonLd = JSON.parse(element.textContent || '{}')
        extractedData.seoData.structuredData.push(jsonLd)
      }
      catch {
        // Invalid JSON-LD, skip
      }
    },

    // Extract hreflang links
    'link[rel="alternate"][hreflang]': (element) => {
      const hreflangAttr = element.attributes.hreflang
      const href = element.attributes.href
      if (hreflangAttr && href) {
        extractedData.seoData.hreflang.push(`${hreflangAttr}:${href}`)
      }
    },

  }

  // Add script and style extraction
  // All scripts - we'll determine placement programmatically
  extractionSelectors.script = (element) => {
    // Handle __NUXT_DATA__ script here since the specific selector isn't working
    if (element.attributes.id === '__NUXT_DATA__') {
      // Extract payload URL from data-src attribute
      const payloadUrl = resolveUrl(element.attributes['data-src'])

      // Note: Cannot extract payload content due to mdream textContent limitations with script tags
      extractedData.nuxtData = {
        nuxtPayload: null, // Would need alternative approach to extract script content
        isServerRendered: element.attributes['data-ssr'] === 'true',
        isPrerendered: null,
        prerenderedAt: null,
        payloadUrl,
      }
      return
    }

    const src = resolveUrl(element.attributes.src)
    // Simple placement logic - we can't easily determine head vs body in mdream
    const placement = 'head' // Default to head, could be enhanced later

    extractedData.scripts.push({
      src,
      async: 'async' in element.attributes,
      defer: 'defer' in element.attributes,
      type: element.attributes.type || null,
      integrity: element.attributes.integrity || null,
      crossorigin: element.attributes.crossorigin || null,
      placement,
      isInline: !src,
      content: !src ? (element.textContent || null) : null,
      orderInPage: scriptOrder++,
    })
  }

  // Link stylesheets
  extractionSelectors['link[rel="stylesheet"]'] = (element) => {
    const href = resolveUrl(element.attributes.href)
    extractedData.styles.push({
      href,
      media: element.attributes.media || null,
      disabled: element.attributes.disabled !== undefined,
      integrity: element.attributes.integrity || null,
      crossorigin: element.attributes.crossorigin || null,
      placement: 'head', // Simplified placement logic
      isInline: false,
      orderInPage: styleOrder++,
    })
  }

  // Style tags
  extractionSelectors.style = (element) => {
    extractedData.styles.push({
      href: null,
      media: element.attributes.media || null,
      disabled: element.attributes.disabled !== undefined,
      integrity: null,
      crossorigin: null,
      placement: 'head', // Simplified placement logic
      isInline: true,
      content: element.textContent || null,
      orderInPage: styleOrder++,
    })
  }

  const markdown = htmlToMarkdown(body, {
    plugins: [
      extractionPlugin(extractionSelectors),
      {
        processTextNode(textNode) {
          // Calculate word count from body text
          const bodyText = textNode.value?.replace(/\s+/g, ' ').trim()
          extractedData.seoData.wordCount = bodyText ? bodyText.split(' ').length : 0
        },
      },
    ],
  })

  return { markdown, extractedData }
}
