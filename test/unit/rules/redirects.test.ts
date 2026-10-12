import { describe, expect, it } from 'vitest'
import { inspect } from '../../../src/runtime/shared'

const siteConfig = { url: 'https://example.com' }

describe('rule redirects', () => {
  it.each([301, 302, 303, 307, 308])('flags a link that answers %i and fixes it to the Location target', (status) => {
    const result = inspect({
      link: '/old-page',
      siteConfig,
      response: { status, statusText: '', headers: { location: '/new-page' } },
    })

    expect(result.passes).toBe(false)
    expect(result.error).toEqual([])
    expect(result.warning).toEqual([{
      name: 'redirects',
      scope: 'warning',
      message: 'Should not redirect.',
      tip: 'Redirects use up your crawl budget and increase loading times, it\'s recommended to avoid them when possible.',
      fix: '/new-page',
      fixDescription: 'Set to redirect URL /new-page.',
    }])
    expect(result.fix).toBe('/new-page')
  })

  it.each([200, 304])('passes a link that answers %i', (status) => {
    const result = inspect({
      link: '/page',
      siteConfig,
      response: { status, statusText: '', headers: { location: '/elsewhere' } },
    })

    expect(result.passes).toBe(true)
    expect(result.fix).toBe('/page')
  })
})
