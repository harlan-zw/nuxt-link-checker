import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoBaseLess from '../../../src/runtime/pure/inspections/no-baseless'
import { runRule } from './util'

describe('rule no-baseless', () => {
  it('works', () => {
    const ctx = {
      link: 'my-post',
      response: { status: 200 },
      fromPath: '/my-blog',
    } as RuleTestContext

    expect(runRule(ctx, RuleNoBaseLess())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/my-blog/my-post",
        "link": "my-post",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/my-blog/my-post",
            "fixDescription": "Add base /my-blog.",
            "message": "Should not have a base.",
            "name": "no-baseless",
            "scope": "warning",
          },
        ],
      }
    `)
  })
})
