import { describe, expect, it } from 'vitest'
import Fuse from 'fuse.js'
import RuleNoErrorResponse from '../../../src/runtime/pure/inspections/no-error-response-status'
import type { RuleTestContext } from '../../../src/runtime/types'
import { runRule } from './util'

describe('rule no-404s', () => {
  it('works', () => {
    const ctx = {
      link: '/abot',
      response: { status: 404 },
      pageSearch: new Fuse([{ link: '/about', textContent: 'About' }], {
        keys: ['link', 'textContent'],
        threshold: 0.5,
      }),
    } as any as RuleTestContext

    expect(runRule(ctx, RuleNoErrorResponse())).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "fix": "/about",
            "fixDescription": "Did you mean /about?",
            "message": "Should not respond with status code 404.",
            "name": "no-error-response",
            "scope": "error",
          },
        ],
        "fix": "/about",
        "link": "/abot",
        "passes": false,
        "textContent": undefined,
        "warning": [],
      }
    `)
  })
})
