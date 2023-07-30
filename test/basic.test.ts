import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { VueTemplateMulti, VueTemplateSingle } from './unit/snippets.test'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixture'),
  dev: true,
})
describe('basic', () => {
  it('endpoint inspect', async () => {
    const singleInspect = await $fetch('/api/__link_checker__/inspect', {
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

  it('endpoint inspect', async () => {
    const singleInspect = await $fetch('/api/__link_checker__/inspect', {
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
