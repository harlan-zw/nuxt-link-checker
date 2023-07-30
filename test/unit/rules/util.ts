import type { H3Event } from 'h3'
import type { Rule, RuleContext } from '../../../src/runtime/inspect/runner'
import { inspect } from '../../../src/runtime/inspect/runner'

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

export function runRule(ctx: RuleContext, rule: Rule) {
  if (!ctx.e)
    ctx.e = mockEvent()
  return inspect(ctx, [rule])
}
