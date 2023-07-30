import { describe, expect, it } from 'vitest'
import RuleNoErrorResponse from '../../../src/runtime/inspections/no-error-response-status'
import type { RuleTestContext } from '../../../src/runtime/types'
import { runRule } from './util'
import Fuse from "fuse.js";

describe('rule no-404s', () => {
  it('works', () => {
    const ctx = {
      link: '/abot',
      response: { status: 404 },
      pageSearch: new Fuse(['/about'], {
        threshold: 0.5,
      })
    } as RuleTestContext

    expect(runRule(ctx, RuleNoErrorResponse())).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "fix": "/about",
            "fixDescription": "Did you mean /about?",
            "message": "Should not respond with 404 undefined.",
            "name": "no-error-response",
            "scope": "error",
          },
        ],
        "fix": "/about",
        "link": "/abot",
        "passes": false,
        "warning": [],
      }
    `)
  })
})
