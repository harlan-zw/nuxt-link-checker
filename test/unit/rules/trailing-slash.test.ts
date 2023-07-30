import { describe, expect, it } from 'vitest'
import type { RuleContext } from '../../../src/runtime/inspect/runner'
import RuleTrailingSlash from '../../../src/runtime/inspections/trailing-slash'
import { runRule } from './util'

describe('rule trailing-slash', () => {
  it('works', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      link: '/test',
    } as RuleContext

    expect(runRule(ctx, RuleTrailingSlash())).toMatchInlineSnapshot(`
      {
        "error": [],
        "warning": [
          {
            "fix": "/test/",
            "message": "Links should have a trailing slash.",
            "name": "trailing-slash",
            "scope": "warning",
          },
        ],
      }
    `)
  })
})
