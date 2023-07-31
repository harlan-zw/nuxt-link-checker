import type { Rule, RuleTestContext } from '../../../src/runtime/types'
import { inspect } from '../../../src/runtime/inspect'

export function runRule(ctx: RuleTestContext, rule: Rule) {
  return inspect(ctx, [rule])
}
