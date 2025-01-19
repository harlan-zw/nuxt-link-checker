import type { RuleTestContext } from '../../../src/runtime/types'
import Fuse from 'fuse.js'
import { describe, expect, it } from 'vitest'
import RuleNoErrorResponse from '../../../src/runtime/shared/inspections/no-error-response'
import { runRule } from './util'

describe('rule no-404s', () => {
  it('works', () => {
    const ctx = {
      link: '/abot',
      response: { status: 404 },
      pageSearch: new Fuse([{ link: '/about', title: 'About' }], {
        keys: ['link', 'title'],
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
