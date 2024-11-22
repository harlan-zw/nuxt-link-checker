import type { RuleTestContext } from '../../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import RuleDescriptiveLinkText from '../../../src/runtime/shared/inspections/link-text'
import { runRule } from './util'

describe('rule descriptive text', () => {
  it('works', () => {
    const ctx = {
      siteConfig: {
        trailingSlash: true,
      },
      response: { status: 200, statusText: 'OK', headers: {} },
      link: '/og-image/api/define-og-image',
      textContent: 'defineOgImage',
    } as RuleTestContext

    expect(runRule(ctx, RuleDescriptiveLinkText())).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/og-image/api/define-og-image",
        "link": "/og-image/api/define-og-image",
        "passes": true,
        "textContent": "defineOgImage",
        "warning": [],
      }
    `)
  })
})
