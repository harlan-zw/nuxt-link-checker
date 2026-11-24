import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

describe('configured file extensions', async () => {
  await setup({
    rootDir: resolve('../fixtures/basic'),
    dev: true,
    nuxtConfig: {
      // @ts-expect-error module augments NuxtConfig
      site: {
        trailingSlash: true,
        fileExtensions: ['stl'],
      },
    },
  })

  it('reports a missing download without suggesting a trailing slash', async () => {
    const link = '/downloads/missing.stl'
    const [result] = await $fetch('/__link-checker__/inspect', {
      method: 'POST',
      body: {
        tasks: [{ paths: [], link, textContent: 'Download model' }],
        ids: [],
      },
    })

    expect(result.error).toEqual([expect.objectContaining({
      name: 'no-error-response',
      message: expect.stringContaining('404'),
    })])
    expect(result.warning).toEqual([])
    expect(result.fix).toBe(link)
  })
})
