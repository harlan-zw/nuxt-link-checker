import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoUppercaseChars from '../../../src/runtime/shared/inspections/no-uppercase-chars'
import { runRule } from './util'

describe('rule no-uppercase-chars', () => {
  it('works', () => {
    expect(runRule({ link: 'https://example.com/PAGE' } as RuleTestContext, RuleNoUppercaseChars())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "https://example.com/page",
        "link": "https://example.com/PAGE",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "https://example.com/page",
            "fixDescription": "Convert to lowercase.",
            "message": "Links should not contain uppercase characters.",
            "name": "no-uppercase-chars",
            "scope": "warning",
          },
        ],
      }
    `)

    expect(runRule({ link: '/this/IS/a/TEEST' } as RuleTestContext, RuleNoUppercaseChars())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/this/is/a/teest",
        "link": "/this/IS/a/TEEST",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/this/is/a/teest",
            "fixDescription": "Convert to lowercase.",
            "message": "Links should not contain uppercase characters.",
            "name": "no-uppercase-chars",
            "scope": "warning",
          },
        ],
      }
    `)
  })
})
