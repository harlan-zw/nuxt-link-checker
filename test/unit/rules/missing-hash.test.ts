import { describe, expect, it } from 'vitest'
import type { RuleContext } from '../../../src/runtime/inspect/runner'
import RuleMissingHash from '../../../src/runtime/inspections/missing-hash'
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
      e: mockEvent('/about'),
    } as RuleContext

    expect(runRule(ctx, RuleMissingHash())).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "message": "Link hash does not exist.",
            "name": "missing-hash",
            "scope": "error",
            "suggestion": "/about#team",
          },
        ],
        "warning": [],
      }
    `)
  })
})
