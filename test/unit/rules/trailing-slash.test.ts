import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { inspect } from '../../../src/runtime/shared'
import RuleTrailingSlash from '../../../src/runtime/shared/inspections/trailing-slash'
import { runRule } from './util'

describe('rule trailing-slash', () => {
  it.each([200, 404])('skips the slash warning for a configured file with HTTP %s', (status) => {
    const link = '/downloads/sample.mrc?download=1'
    const result = inspect({
      link,
      siteConfig: { trailingSlash: true, fileExtensions: ['.MRC'] },
      response: { status, statusText: '', headers: {} },
    })

    expect(result.warning).toEqual([])
    expect(result.fix).toBe(link)
    expect(result.error?.map(error => error.name)).toEqual(status === 404 ? ['no-error-response'] : [])
  })

  it.each(['/downloads/sample.mrc', '/docs/version.2'])('still enforces trailing slashes for %s without a matching extension', (link) => {
    const result = inspect({
      link,
      siteConfig: { trailingSlash: true, fileExtensions: ['pdb'] },
    })

    expect(result.warning?.map(warning => warning.name)).toEqual(['trailing-slash'])
    expect(result.fix).toBe(`${link}/`)
  })

  it('reports a missing STL download without suggesting a trailing slash', () => {
    const link = '/downloads/model.stl'
    const result = inspect({
      link,
      siteConfig: { trailingSlash: true },
      response: { status: 404, statusText: 'Not Found', headers: {} },
    })

    expect(result.error?.map(error => error.name)).toEqual(['no-error-response'])
    expect(result.warning).toEqual([])
    expect(result.fix).toBe(link)
  })

  it('works', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      response: { status: 200, statusText: 'OK', headers: {} },
      link: '/test',
    } as RuleTestContext

    expect(runRule(ctx, RuleTrailingSlash())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/test/",
        "link": "/test",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/test/",
            "fixDescription": "Add trailing slash.",
            "message": "Should have a trailing slash.",
            "name": "trailing-slash",
            "scope": "warning",
            "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
          },
        ],
      }
    `)
  })

  it('works with fragment-only links', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      response: { status: 200, statusText: 'OK', headers: {} },
      link: '#abc',
    } as RuleTestContext

    expect(runRule(ctx, RuleTrailingSlash())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "#abc",
        "link": "#abc",
        "passes": true,
        "textContent": undefined,
        "warning": [],
      }
    `)
  })

  it('works with links containing fragments', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      response: { status: 200, statusText: 'OK', headers: {} },
      link: '/a#abc',
    } as RuleTestContext

    expect(runRule(ctx, RuleTrailingSlash())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/a/#abc",
        "link": "/a#abc",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/a/#abc",
            "fixDescription": "Add trailing slash.",
            "message": "Should have a trailing slash.",
            "name": "trailing-slash",
            "scope": "warning",
            "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
          },
        ],
      }
    `)
  })
})

describe('rule trailing-slash on a public directory index', () => {
  // public/demo/index.html loads its assets with relative URLs, which resolve against /demo/ only
  const isPublicDirectoryIndex = (path: string): boolean => path === '/demo' || path === '/demo/'
  const response = { status: 200, statusText: 'OK', headers: {} }

  it.each([false, true])('passes /demo/ when site.trailingSlash is %s', (trailingSlash) => {
    const result = inspect({
      link: '/demo/?present=1#top',
      siteConfig: { url: 'https://example.com', trailingSlash },
      response,
      isPublicDirectoryIndex,
    })

    expect(result.warning).toEqual([])
    expect(result.passes).toBe(true)
  })

  it.each([false, true])('fixes /demo to /demo/ when site.trailingSlash is %s', (trailingSlash) => {
    const result = inspect({
      link: '/demo?present=1',
      siteConfig: { url: 'https://example.com', trailingSlash },
      response,
      isPublicDirectoryIndex,
    })

    expect(result.warning.map(w => w.message)).toEqual(['Should have a trailing slash.'])
    expect(result.fix).toBe('/demo/?present=1')
  })

  it('fixes /demo/index.html to /demo/ when the host redirects it, and /demo/ then passes', () => {
    const siteConfig = { url: 'https://example.com', trailingSlash: false }
    const redirected = inspect({
      link: '/demo/index.html',
      siteConfig,
      response: { status: 307, statusText: '', headers: { location: '/demo/' } },
      isPublicDirectoryIndex,
    })

    expect(redirected.warning.map(w => w.name)).toEqual(['redirects'])
    expect(redirected.fix).toBe('/demo/')

    const fixed = inspect({ link: redirected.fix!, siteConfig, response, isPublicDirectoryIndex })
    expect(fixed.passes).toBe(true)
  })

  it('keeps the site.trailingSlash rule for other paths', () => {
    const result = inspect({
      link: '/about/',
      siteConfig: { url: 'https://example.com', trailingSlash: false },
      response,
      isPublicDirectoryIndex,
    })

    expect(result.fix).toBe('/about')
  })
})
