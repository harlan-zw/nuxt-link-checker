import * as cheerio from 'cheerio'
import { describe, expect, it } from 'vitest'
import {
  extractImages,
  extractLinks,
  extractNuxtData,
  extractPageData,
  extractScripts,
  extractSeoData,
  extractStyles,
} from '../../src/lib/extract'

describe('analyze', () => {
  const baseUrl = new URL('https://example.com')

  describe('extractImages', () => {
    it('extracts basic image attributes', () => {
      const html = `
        <div>
          <img src="/image.jpg" alt="Test image" width="100" height="200">
        </div>
      `
      const $ = cheerio.load(html)
      const images = extractImages($, baseUrl)

      expect(images).toEqual([
        {
          src: 'https://example.com/image.jpg',
          alt: 'Test image',
          width: '100',
          height: '200',
          loading: undefined,
          fetchpriority: undefined,
          sizes: undefined,
          srcset: undefined,
          ariaLabel: undefined,
        },
      ])
    })

    it('extracts images with modern attributes', () => {
      const html = `
        <div>
          <img
            src="/modern.webp"
            alt="Modern image"
            loading="lazy"
            fetchpriority="high"
            sizes="(max-width: 768px) 100vw, 50vw"
            srcset="/small.webp 400w, /large.webp 800w"
            aria-label="Descriptive label"
          >
        </div>
      `
      const $ = cheerio.load(html)
      const images = extractImages($, baseUrl)

      expect(images).toEqual([
        {
          src: 'https://example.com/modern.webp',
          alt: 'Modern image',
          width: undefined,
          height: undefined,
          loading: 'lazy',
          fetchpriority: 'high',
          sizes: '(max-width: 768px) 100vw, 50vw',
          srcset: '/small.webp 400w, /large.webp 800w',
          ariaLabel: 'Descriptive label',
        },
      ])
    })

    it('filters out images without src', () => {
      const html = `
        <div>
          <img alt="No source">
          <img src="/valid.jpg" alt="Valid">
        </div>
      `
      const $ = cheerio.load(html)
      const images = extractImages($, baseUrl)

      expect(images).toHaveLength(1)
      expect(images[0].src).toBe('https://example.com/valid.jpg')
    })

    it('handles absolute URLs', () => {
      const html = `
        <div>
          <img src="https://cdn.example.com/image.jpg" alt="CDN image">
        </div>
      `
      const $ = cheerio.load(html)
      const images = extractImages($, baseUrl)

      expect(images[0].src).toBe('https://cdn.example.com/image.jpg')
    })
  })

  describe('extractLinks', () => {
    it('extracts basic link attributes', () => {
      const html = `
        <div>
          <a href="/page" title="Test link">Link text</a>
        </div>
      `
      const $ = cheerio.load(html)
      const links = extractLinks($, baseUrl)

      expect(links).toEqual([
        {
          href: 'https://example.com/page',
          text: 'Link text',
          title: 'Test link',
          rel: undefined,
          target: undefined,
          download: undefined,
          hreflang: undefined,
          type: undefined,
          referrerpolicy: undefined,
          ariaLabel: undefined,
        },
      ])
    })

    it('extracts links with advanced attributes', () => {
      const html = `
        <div>
          <a
            href="/download.pdf"
            rel="nofollow"
            target="_blank"
            download="file.pdf"
            hreflang="en"
            type="application/pdf"
            referrerpolicy="no-referrer"
            aria-label="Download PDF"
          >Download</a>
        </div>
      `
      const $ = cheerio.load(html)
      const links = extractLinks($, baseUrl)

      expect(links).toEqual([
        {
          href: 'https://example.com/download.pdf',
          text: 'Download',
          title: undefined,
          rel: 'nofollow',
          target: '_blank',
          download: 'file.pdf',
          hreflang: 'en',
          type: 'application/pdf',
          referrerpolicy: 'no-referrer',
          ariaLabel: 'Download PDF',
        },
      ])
    })

    it('filters out links without href', () => {
      const html = `
        <div>
          <a>No href</a>
          <a href="/valid">Valid link</a>
        </div>
      `
      const $ = cheerio.load(html)
      const links = extractLinks($, baseUrl)

      expect(links).toHaveLength(1)
      expect(links[0].href).toBe('https://example.com/valid')
    })

    it('filters out hash-only links', () => {
      const html = `
        <div>
          <a href="#section">Hash link</a>
          <a href="/valid">Valid link</a>
        </div>
      `
      const $ = cheerio.load(html)
      const links = extractLinks($, baseUrl)

      expect(links).toHaveLength(1)
      expect(links[0].href).toBe('https://example.com/valid')
    })

    it('handles absolute URLs', () => {
      const html = `
        <div>
          <a href="https://external.com/page">External link</a>
        </div>
      `
      const $ = cheerio.load(html)
      const links = extractLinks($, baseUrl)

      expect(links[0].href).toBe('https://external.com/page')
    })
  })

  describe('extractScripts', () => {
    it('extracts head scripts with crawlAssets enabled', () => {
      const html = `
        <html>
          <head>
            <script src="/app.js" async defer type="module"></script>
            <script>console.log('inline')</script>
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const scripts = extractScripts($, baseUrl, true)

      expect(scripts).toHaveLength(2)
      expect(scripts[0]).toEqual({
        src: 'https://example.com/app.js',
        async: true,
        defer: true,
        type: 'module',
        integrity: undefined,
        crossorigin: undefined,
        placement: 'head',
        isInline: false,
        content: null,
        orderInPage: 0,
      })
      expect(scripts[1]).toEqual({
        src: undefined,
        async: false,
        defer: false,
        type: undefined,
        integrity: undefined,
        crossorigin: undefined,
        placement: 'head',
        isInline: true,
        content: 'console.log(\'inline\')',
        orderInPage: 1,
      })
    })

    it('extracts body scripts with correct placement', () => {
      const html = `
        <html>
          <head></head>
          <body>
            <div>content</div>
            <script src="/early.js"></script>
            <div>more content</div>
            <div>more content</div>
            <div>more content</div>
            <script src="/late.js"></script>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const scripts = extractScripts($, baseUrl, true)

      expect(scripts).toHaveLength(2)
      expect(scripts[0].placement).toBe('body-start')
      expect(scripts[1].placement).toBe('body-end')
    })

    it('returns empty array when crawlAssets is false', () => {
      const html = `
        <html>
          <head>
            <script src="/app.js"></script>
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const scripts = extractScripts($, baseUrl, false)

      expect(scripts).toEqual([])
    })

    it('extracts script security attributes', () => {
      const html = `
        <html>
          <head>
            <script
              src="/secure.js"
              integrity="sha256-abc123"
              crossorigin="anonymous"
            ></script>
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const scripts = extractScripts($, baseUrl, true)

      expect(scripts[0]).toMatchObject({
        integrity: 'sha256-abc123',
        crossorigin: 'anonymous',
      })
    })
  })

  describe('extractStyles', () => {
    it('extracts stylesheet links with crawlAssets enabled', () => {
      const html = `
        <html>
          <head>
            <link rel="stylesheet" href="/style.css" media="screen">
            <style>body { color: red; }</style>
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const styles = extractStyles($, baseUrl, true)

      expect(styles).toHaveLength(2)
      expect(styles[0]).toEqual({
        href: 'https://example.com/style.css',
        media: 'screen',
        disabled: false,
        integrity: undefined,
        crossorigin: undefined,
        placement: 'head',
        isInline: false,
        orderInPage: 0,
      })
      expect(styles[1]).toEqual({
        href: null,
        media: undefined,
        disabled: false,
        integrity: null,
        crossorigin: null,
        placement: 'head',
        isInline: true,
        content: 'body { color: red; }',
        orderInPage: 1,
      })
    })

    it('returns empty array when crawlAssets is false', () => {
      const html = `
        <html>
          <head>
            <link rel="stylesheet" href="/style.css">
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const styles = extractStyles($, baseUrl, false)

      expect(styles).toEqual([])
    })

    it('extracts stylesheet security attributes', () => {
      const html = `
        <html>
          <head>
            <link
              rel="stylesheet"
              href="/secure.css"
              integrity="sha256-def456"
              crossorigin="use-credentials"
              disabled
            >
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const styles = extractStyles($, baseUrl, true)

      expect(styles[0]).toMatchObject({
        integrity: 'sha256-def456',
        crossorigin: 'use-credentials',
        disabled: true,
      })
    })
  })

  describe('extractSeoData', () => {
    it('extracts basic SEO metadata', () => {
      const html = `
        <html lang="en">
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="canonical" href="https://example.com/canonical">
          </head>
          <body>
            <h1>Main Heading</h1>
            <p>Some content here with multiple words for counting.</p>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const response = { headers: {} }
      const seoData = extractSeoData($, response)

      expect(seoData).toEqual({
        title: 'Test Page',
        description: 'Test description',
        canonical: 'https://example.com/canonical',
        metaRobots: null,
        h1: 'Main Heading',
        lang: 'en',
        viewport: 'width=device-width, initial-scale=1',
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        wordCount: 10, // "Some content here with multiple words for counting."
        structuredData: [],
        hreflang: [],
      })
    })

    it('extracts Open Graph metadata', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const response = { headers: {} }
      const seoData = extractSeoData($, response)

      expect(seoData).toMatchObject({
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        ogImage: 'https://example.com/image.jpg',
      })
    })

    it('extracts robots metadata from header and meta tag', () => {
      const html = `
        <html>
          <head>
            <meta name="robots" content="noindex, nofollow">
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const response = { headers: { 'x-robots-tag': 'noarchive' } }
      const seoData = extractSeoData($, response)

      // Should prefer header over meta tag
      expect(seoData.metaRobots).toBe('noarchive')
    })

    it('extracts structured data (JSON-LD)', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {"@type": "Organization", "name": "Test Org"}
            </script>
            <script type="application/ld+json">
              {"@type": "WebPage", "name": "Test Page"}
            </script>
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const response = { headers: {} }
      const seoData = extractSeoData($, response)

      expect(seoData.structuredData).toEqual([
        { '@type': 'Organization', 'name': 'Test Org' },
        { '@type': 'WebPage', 'name': 'Test Page' },
      ])
    })

    it('extracts hreflang links', () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" hreflang="en" href="https://example.com/en">
            <link rel="alternate" hreflang="es" href="https://example.com/es">
          </head>
          <body></body>
        </html>
      `
      const $ = cheerio.load(html)
      const response = { headers: {} }
      const seoData = extractSeoData($, response)

      expect(seoData.hreflang).toEqual([
        'en:https://example.com/en',
        'es:https://example.com/es',
      ])
    })

    it('handles missing SEO elements gracefully', () => {
      const html = `<html><body></body></html>`
      const $ = cheerio.load(html)
      const response = { headers: {} }
      const seoData = extractSeoData($, response)

      expect(seoData).toEqual({
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
      })
    })
  })

  describe('extractNuxtData', () => {
    it('returns null data when no Nuxt script found', () => {
      const html = `<html><body></body></html>`
      const $ = cheerio.load(html)
      const nuxtData = extractNuxtData($, baseUrl)

      expect(nuxtData).toEqual({
        payload: null,
        isServerRendered: null,
        isPrerendered: null,
        prerenderedAt: null,
        payloadUrl: null,
      })
    })

    it('extracts payload URL from data-src', () => {
      const html = `
        <html>
          <body>
            <script id="__NUXT_DATA__" data-src="/_payload.json"></script>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const nuxtData = extractNuxtData($, baseUrl)

      expect(nuxtData.payloadUrl).toBe('https://example.com/_payload.json')
    })

    it('extracts SSR flag from data-ssr attribute', () => {
      const html = `
        <html>
          <body>
            <script id="__NUXT_DATA__" data-ssr="true">[[]]</script>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const nuxtData = extractNuxtData($, baseUrl)

      expect(nuxtData.isServerRendered).toBe(true)
    })

    it('handles invalid JSON payload gracefully', () => {
      const html = `
        <html>
          <body>
            <script id="__NUXT_DATA__">invalid json</script>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const nuxtData = extractNuxtData($, baseUrl)

      expect(nuxtData.payload).toBe(null)
    })
  })

  describe('extractPageData', () => {
    it('integrates all extraction functions', () => {
      const html = `
        <html lang="en">
          <head>
            <title>Integration Test</title>
            <link rel="stylesheet" href="/style.css">
            <script src="/app.js"></script>
          </head>
          <body>
            <h1>Test Page</h1>
            <img src="/image.jpg" alt="Test">
            <a href="/link">Test Link</a>
            <script id="__NUXT_DATA__">[[]]</script>
          </body>
        </html>
      `
      const $ = cheerio.load(html)
      const request = { loadedUrl: 'https://example.com/test' }
      const response = { headers: {} }

      const pageData = extractPageData($, response, request, true)

      expect(pageData).toHaveProperty('images')
      expect(pageData).toHaveProperty('links')
      expect(pageData).toHaveProperty('scripts')
      expect(pageData).toHaveProperty('styles')
      expect(pageData).toHaveProperty('seoData')
      expect(pageData).toHaveProperty('nuxtData')

      expect(pageData.images).toHaveLength(1)
      expect(pageData.links).toHaveLength(1)
      expect(pageData.scripts).toHaveLength(2) // app.js + inline __NUXT_DATA__
      expect(pageData.styles).toHaveLength(1)
      expect(pageData.seoData.title).toBe('Integration Test')
      expect(pageData.nuxtData.payload).toEqual([])
    })
  })
})
