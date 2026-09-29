import { describe, expect, it } from 'vitest'
import { findRemovedOptions } from '../../src/util'

describe('findRemovedOptions', () => {
  it('names the replacement for each removed v1 option', () => {
    expect(findRemovedOptions({ failOn404: true, exclude: ['/a'], siteUrl: 'https://a.com', trailingSlash: true })).toEqual([
      '`linkChecker.failOn404` was removed. Use `linkChecker.failOnError`.',
      '`linkChecker.exclude` was removed. Use `linkChecker.excludeLinks`.',
      '`linkChecker.siteUrl` was removed. Use `site.url`.',
      '`linkChecker.trailingSlash` was removed. Use `site.trailingSlash`.',
    ])
  })

  it('returns nothing for current options', () => {
    expect(findRemovedOptions({ failOnError: true, excludeLinks: [] })).toEqual([])
  })
})
