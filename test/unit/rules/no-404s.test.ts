import { describe, expect, it } from 'vitest'
import type { RuleContext } from '../../../src/runtime/inspect/runner'
import RuleNoErrorResponse from '../../../src/runtime/inspections/no-error-response-status'
import { runRule } from './util'

describe('rule no-404s', () => {
  it('works', () => {
    const ctx = {
      link: '/abot',
      response: { status: 404 },
    } as RuleContext

    expect(runRule(ctx, RuleNoErrorResponse())).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "message": "Links should not respond with 404.",
            "name": "no-404s",
            "scope": "error",
            "suggestion": "/about",
          },
        ],
        "warning": [],
      }
    `)
  })
})
