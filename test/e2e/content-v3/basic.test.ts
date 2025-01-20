import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../../fixtures/content-v3'),
  dev: true,
})

export const FooMarkdown = resolve('../../fixtures/content-v3/content/foo.md')

describe('nuxt/content v3', () => {
  it('basic', async () => {
    const singleInspect = await $fetch<{ diff: [], sources: [] }[]>('/__link-checker__/inspect', {
      method: 'POST',
      body: {
        tasks: [
          {
            paths: [FooMarkdown],
            link: '/about-us',
            textContent: 'About Us',
          },
        ],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot(`
      [
        {
          "diff": [],
          "error": [
            {
              "message": "Should not respond with status code 404 (Not Found).",
              "name": "no-error-response",
              "scope": "error",
            },
          ],
          "fix": "/about-us",
          "link": "/about-us",
          "passes": false,
          "sources": [],
          "textContent": "About Us",
          "warning": [],
        },
      ]
    `)
    const res = singleInspect.map((r) => {
      return {
        ...r,
        diff: r.diff.map((d: { filepath: string }) => {
          return {
            ...d,
            filepath: d.filepath.split('/').pop(),
          }
        }),
        sources: r.sources.map((s: { filepath: string }) => {
          return {
            ...s,
            filepath: s.filepath.split('/').pop(),
          }
        }),
      }
    })
    expect(res).toMatchInlineSnapshot(`
      [
        {
          "diff": [],
          "error": [
            {
              "message": "Should not respond with status code 404 (Not Found).",
              "name": "no-error-response",
              "scope": "error",
            },
          ],
          "fix": "/about-us",
          "link": "/about-us",
          "passes": false,
          "sources": [],
          "textContent": "About Us",
          "warning": [],
        },
      ]
    `)
  }, 60000)
})
