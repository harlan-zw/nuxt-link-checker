import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../../fixtures/comark-content'),
  dev: true,
})

describe('comark-content', () => {
  it('lists comark collection pages as link sources', async () => {
    const links = await $fetch<{ link: string, title: string, file: string }[]>('/__link-checker__/links')
    const contentLinks = links.filter(entry => entry.file?.endsWith('.md')).map(entry => entry.link).sort()
    expect(contentLinks).toEqual(['/', '/foo'])
  }, 60000)
})
