import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
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
