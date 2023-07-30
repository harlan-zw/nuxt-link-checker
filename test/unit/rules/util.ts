import type { H3Event } from 'h3'
import type { Rule, RuleTestContext } from '../../../src/runtime/types'
import { inspect } from '../../../src/runtime/inspect'

export function mockEvent(referer: string = '/') {
  return {
    node: {
      req: {
        headers: {
          referer,
        },
      },
    },
  } as H3Event
}

export function runRule(ctx: RuleTestContext, rule: Rule) {
  if (!ctx.e)
    ctx.e = mockEvent()
  return inspect(ctx, [rule])
}
