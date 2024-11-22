import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleNoDoubleSlashes from '../../../src/runtime/shared/inspections/no-double-slashes'
import { runRule } from './util'

describe('rule double-slash', () => {
  it('no double slashes', () => {
    const ctx = {
      link: '/this/is//a/test',
      textContent: 'Click me',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoDoubleSlashes())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/this/is/a/test",
        "link": "/this/is//a/test",
        "passes": false,
        "textContent": "Click me",
        "warning": [
          {
            "fix": "/this/is/a/test",
            "fixDescription": "Remove double slashes.",
            "message": "Links should not contain double slashes.",
            "name": "no-double-slashes",
            "scope": "warning",
          },
        ],
      }
    `)
  })
  it('no triple slashes + combined', () => {
    const ctx = {
      link: '/this///is//a/////test/test',
      textContent: 'Click me',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoDoubleSlashes())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/this/is/a/test/test",
        "link": "/this///is//a/////test/test",
        "passes": false,
        "textContent": "Click me",
        "warning": [
          {
            "fix": "/this/is/a/test/test",
            "fixDescription": "Remove double slashes.",
            "message": "Links should not contain double slashes.",
            "name": "no-double-slashes",
            "scope": "warning",
          },
        ],
      }
    `)
  })
  it('no double slashes root', () => {
    const ctx = {
      link: '//this/is/a/test',
      textContent: 'Click me',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoDoubleSlashes())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/this/is/a/test",
        "link": "//this/is/a/test",
        "passes": false,
        "textContent": "Click me",
        "warning": [
          {
            "fix": "/this/is/a/test",
            "fixDescription": "Remove double slashes.",
            "message": "Links should not contain double slashes.",
            "name": "no-double-slashes",
            "scope": "warning",
          },
        ],
      }
    `)
  })

  it('no double slashes root solo', () => {
    const ctx = {
      link: '//',
      textContent: 'Click me',
    } as RuleTestContext
    expect(runRule(ctx, RuleNoDoubleSlashes())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/",
        "link": "//",
        "passes": false,
        "textContent": "Click me",
        "warning": [
          {
            "fix": "/",
            "fixDescription": "Remove double slashes.",
            "message": "Links should not contain double slashes.",
            "name": "no-double-slashes",
            "scope": "warning",
          },
        ],
      }
    `)
  })
})
