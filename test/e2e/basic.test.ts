import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { VueTemplateMulti, VueTemplateSingle } from '../const'

const { resolve } = createResolver(import.meta.url)

describe('basic', async () => {
  await setup({
    rootDir: resolve('../fixtures/basic'),
    dev: true,
  })
  it('endpoint inspect single', async () => {
    const singleInspect = await $fetch('/__link-checker__/inspect', {
      method: 'POST',
      body: {
        tasks: [
          {
            paths: [VueTemplateSingle],
            link: '/foo',
            textContent: 'Foo',
          },
        ],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot(`
      [
        {
          "error": [],
          "fix": "/foo",
          "link": "/foo",
          "passes": true,
          "textContent": "Foo",
          "warning": [],
        },
      ]
    `)
  })

  it('endpoint inspect multi', async () => {
    const singleInspect = await $fetch('/__link-checker__/inspect', {
      method: 'POST',
      body: {
        tasks: [
          {
            paths: [VueTemplateMulti],
            link: '/foo',
            textContent: 'Foo',
          },
        ],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot(`
      [
        {
          "error": [],
          "fix": "/foo",
          "link": "/foo",
          "passes": true,
          "textContent": "Foo",
          "warning": [],
        },
      ]
    `)
  })
})
