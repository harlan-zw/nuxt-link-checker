import { describe, expect, it } from 'vitest'
import RuleTrailingSlash from '../../../src/runtime/inspections/trailing-slash'
import { runRule } from './util'
import {RuleTestContext} from "../../../src/runtime/types";

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
