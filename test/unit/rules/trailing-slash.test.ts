import { describe, expect, it } from 'vitest'
import RuleTrailingSlash from '../../../src/runtime/inspections/trailing-slash'
import type { RuleTestContext } from '../../../src/runtime/types'
import { runRule } from './util'

describe('rule trailing-slash', () => {
  it('works', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      link: '/test',
    } as RuleTestContext

    expect(runRule(ctx, RuleTrailingSlash())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/test/",
        "link": "/test",
        "passes": false,
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
})
