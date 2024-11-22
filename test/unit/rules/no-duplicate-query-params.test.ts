import type { RuleTestContext } from '../../../src/runtime/types'
import { parseURL } from 'ufo'
import { describe, expect, it } from 'vitest'
import RuleNoDuplicateQueryParams from '../../../src/runtime/shared/inspections/no-duplicate-query-params'
import { runRule } from './util'

describe('rule no-duplicate-query-params', () => {
  it('works', () => {
    expect(runRule({ link: 'http://example.com/page?a=1&a=2&c=3&d=4', url: parseURL('http://example.com/page?a=1&a=2&c=3&d=4') } as RuleTestContext, RuleNoDuplicateQueryParams())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "http://example.com/page?a=2&c=3&d=4",
        "link": "http://example.com/page?a=1&a=2&c=3&d=4",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "http://example.com/page?a=2&c=3&d=4",
            "fixDescription": "Remove duplicate query parameter.",
            "message": "Links should not contain duplicated query parameters.",
            "name": "no-duplicate-query-params",
            "scope": "warning",
            "tip": "Duplicate query parameters can cause canonical URL issues.",
          },
        ],
      }
    `)

    expect(runRule({ link: '/page?filter=red&filter=red', url: parseURL('/page?filter=red&filter=red') } as RuleTestContext, RuleNoDuplicateQueryParams())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/page?filter=red",
        "link": "/page?filter=red&filter=red",
        "passes": false,
        "textContent": undefined,
        "warning": [
          {
            "fix": "/page?filter=red",
            "fixDescription": "Remove duplicate query parameter.",
            "message": "Links should not contain duplicated query parameters.",
            "name": "no-duplicate-query-params",
            "scope": "warning",
            "tip": "Duplicate query parameters can cause canonical URL issues.",
          },
        ],
      }
    `)
  })
})
