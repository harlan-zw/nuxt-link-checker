import type { Rule, RuleTestContext } from '../../../src/runtime/types'
import { inspect } from '../../../src/runtime/shared/inspect'

export function runRule(ctx: RuleTestContext, rule: Rule): ReturnType<typeof inspect> {
  return inspect(ctx, [rule])
}
