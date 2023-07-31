import { describe, expect, it } from 'vitest'
import RuleMissingHash from '../../../src/runtime/inspections/missing-hash'
import type { RuleTestContext } from '../../../src/runtime/types'
import { mockEvent, runRule } from './util'

describe('rule missing-hash', () => {
  it('works', () => {
    const ctx = {
      link: '/about#tem',
      ids: [
        'foo',
        'bar',
        'team',
      ],
      fromPath: '/about',
    } as RuleTestContext

    expect(runRule(ctx, RuleMissingHash())).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "fix": "/about#team",
            "fixDescription": "Did you mean /about#team?",
            "message": "No element with id \\"tem\\" found.",
            "name": "missing-hash",
            "scope": "error",
          },
        ],
        "fix": "/about#team",
        "link": "/about#tem",
        "passes": false,
        "warning": [],
      }
    `)
  })
})
