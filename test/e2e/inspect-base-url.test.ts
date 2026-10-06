import { createResolver } from '@nuxt/kit'
import { setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

describe('development inspection beneath an app base URL', async () => {
  await setup({ rootDir: resolve('../fixtures/inspect-base-url'), dev: true })

  it('accepts a deployed page link and reports a real missing page', async () => {
    const origin = url('/')
    const page = await fetch(new URL('/site/about', origin))
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('Deployed inspection target')

    const response = await fetch(new URL('/site/__link-checker__/inspect', origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '/about',
        ids: [],
        tasks: ['/site/about', '/site/missing'].map(link => ({ link, textContent: 'Destination page', paths: [] })),
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      expect.objectContaining({ link: '/site/about', passes: true, error: [] }),
      expect.objectContaining({
        link: '/site/missing',
        passes: false,
        error: expect.arrayContaining([expect.objectContaining({ name: 'no-error-response', message: expect.stringContaining('404') })]),
      }),
    ])
  })
})
