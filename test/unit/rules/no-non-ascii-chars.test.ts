import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoNonAsciiChars from '../../../src/runtime/shared/inspections/no-non-ascii-chars'
import { runRule } from './util'

describe('rule no-non-ascii-chars', () => {
  it('works', () => {
    expect(runRule({ link: '/café/menu' } as RuleTestContext, RuleNoNonAsciiChars()).passes).toBe(false)
    expect(runRule({ link: '/商店/北京/產品' } as RuleTestContext, RuleNoNonAsciiChars()).passes).toBe(false)
    expect(runRule({ link: '/사용자/관리자-2023/문서.pdf' } as RuleTestContext, RuleNoNonAsciiChars()).passes).toBe(false)
    expect(runRule({ link: '/users/👨‍👩‍👦/photos/🌅-vacation' } as RuleTestContext, RuleNoNonAsciiChars()).passes).toBe(false)
    expect(runRule({ link: '/москва/كتاب/δοκιμή/יִשְׂרָאֵל' } as RuleTestContext, RuleNoNonAsciiChars()).passes).toBe(false)
  })
})
