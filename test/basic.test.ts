import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { VueTemplateMulti, VueTemplateSingle } from './unit/snippets.test'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixture'),
  dev: true,
})
describe('basic', () => {
  it('endpoint inspect single', async () => {
    const singleInspect = await $fetch('/__link-checker__/inspect', {
      method: 'POST',
      query: {
        link: '/foo',
      },
      body: {
        paths: [VueTemplateSingle],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/foo",
        "link": "/foo",
        "passes": true,
        "warning": [],
      }
    `)
  })

  it('endpoint inspect multi', async () => {
    const singleInspect = await $fetch('/__link-checker__/inspect', {
      method: 'POST',
      query: {
        link: '/foo',
      },
      body: {
        paths: [VueTemplateMulti],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot(`
      {
        "error": [],
        "fix": "/foo",
        "link": "/foo",
        "passes": true,
        "warning": [],
      }
    `)
  })
})
