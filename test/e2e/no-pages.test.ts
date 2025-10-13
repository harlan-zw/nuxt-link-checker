import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

describe('no-pages', async () => {
  await setup({
    rootDir: resolve('../fixtures/no-pages'),
    dev: true,
  })

  it('starts dev without hanging', async () => {
    const html = await $fetch('/')
    expect(html).toContain('No Pages Fixture')
  })

  it('debug endpoint works', async () => {
    const debug = await $fetch('/__link-checker__/debug.json')
    expect(debug).toBeDefined()
  })
})
