import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { inspect } from '../../../src/runtime/shared'
import RuleTrailingSlash from '../../../src/runtime/shared/inspections/trailing-slash'
import { runRule } from './util'

describe('rule trailing-slash', () => {
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
