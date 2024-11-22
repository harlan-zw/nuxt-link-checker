import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoWhitespace from '../../../src/runtime/shared/inspections/no-whitespace'
import { runRule } from './util'

describe('rule no-whitespace', () => {
  it('works', () => {
    expect(runRule({ link: '/this/ is / a link' } as RuleTestContext, RuleNoWhitespace())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/this/ is / a link",
        "link": "/this/ is / a link",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "message": "Links should not contain whitespace.",
            "name": "no-whitespace",
            "scope": "warning",
            "tip": "Use hyphens to separate words instead of spaces.",
          },
        ],
      }
    `)

    expect(runRule({ link: ' /trimmable ' } as RuleTestContext, RuleNoWhitespace())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/trimmable",
        "link": " /trimmable ",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/trimmable",
            "fixDescription": "Remove whitespace from start and end of link.",
            "message": "Links should not start or end with whitespace.",
            "name": "no-whitespace",
            "scope": "warning",
          },
        ],
      }
    `)
  })
})
