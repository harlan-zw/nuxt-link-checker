import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixtures/content'),
  dev: true,
})

export const FooMarkdown = resolve('./fixtures/content/content/foo.md')

describe('nuxt/content documentDriven', () => {
  it('basic', async () => {
    const singleInspect = await $fetch('/__link-checker__/inspect', {
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
    const res = singleInspect.map((r) => {
      return {
        ...r,
        diff: r.diff.map((d) => {
          return {
            ...d,
            filepath: d.filepath.split('/').pop(),
          }
        }),
        sources: r.sources.map((s) => {
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
          "diff": [
            {
              "code": "This is a link to an about page that does not exist:

      - [About Us](/about-us)
      ",
              "diff": {
                "added": [],
                "removed": [],
                "result": "This is a link to an about page that does not exist:

      - [About Us](/about-us)",
              },
              "filepath": "index.md",
            },
          ],
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
          "sources": [
            {
              "filepath": "index.md",
              "lang": "md",
              "previews": [
                {
                  "code": "This is a link to an about page that does not exist:

      - [About Us](/about-us)
      ",
                  "columnNumber": 67,
                  "lineNumber": 3,
                },
              ],
            },
          ],
          "textContent": "About Us",
          "warning": [],
        },
      ]
    `)
  }, 60000)
})
