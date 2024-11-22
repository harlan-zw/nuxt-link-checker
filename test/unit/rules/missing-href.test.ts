import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoMissingHref from '../../../src/runtime/shared/inspections/no-missing-href'
import { runRule } from './util'

describe('rule missing-href', () => {
  it('no role', () => {
    const ctx = {
      link: '',
      textContent: 'Click me',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoMissingHref())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "",
        "link": "",
        "passes": false,
        "textContent": "Click me",
        "warning": [
          {
            "message": "For accessibility and UX anchor tags require a href attribute.",
            "name": "no-missing-href",
            "scope": "warning",
            "tip": "Use a button element with type="button" instead if the link is not navigational.",
          },
        ],
      }
    `)
  })
  it('with role', () => {
    const ctx = {
      link: '',
      textContent: 'Click me',
      role: 'button',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoMissingHref())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "",
        "link": "",
        "passes": true,
        "textContent": "Click me",
        "warning": [],
      }
    `)
  })
})
