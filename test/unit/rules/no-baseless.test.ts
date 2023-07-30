import { describe, expect, it } from 'vitest'
import RuleNoBaseLess from '../../../src/runtime/inspections/no-baseless'
import type { RuleContext } from '../../../src/runtime/inspect/runner'
import { mockEvent, runRule } from './util'

describe('rule no-baseless', () => {
  it('works', () => {
    const ctx = {
      link: 'my-post',
      response: { status: 200 },
      e: mockEvent('/my-blog'),
    } as RuleContext

    expect(runRule(ctx, RuleNoBaseLess())).toMatchInlineSnapshot(`
      {
        "error": [],
        "warning": [
          {
            "message": "Links should not have a base.",
            "name": "no-baseless",
            "scope": "warning",
            "suggestion": "/my-blog/my-post",
          },
        ],
      }
    `)
  })
})
