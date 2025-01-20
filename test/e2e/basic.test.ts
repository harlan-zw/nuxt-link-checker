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
    for (const inspect of singleInspect) {
      for (const source of inspect.sources) {
        source.filepath = source.filepath.replace(resolve('../fixtures/basic'), '')
      }
      // for diff
      for (const diff of inspect.diff) {
        diff.filepath = diff.filepath.replace(resolve('../fixtures/basic'), '')
      }
    }
    expect(singleInspect).toMatchInlineSnapshot(`
      [
        {
          "diff": [
            {
              "code": "<template>
        <NuxtLink to="/foo">
          Foo
        </NuxtLink>
      </template>
      ",
              "diff": {
                "added": [],
                "removed": [],
                "result": "<template>
        <NuxtLink to="/foo">
          Foo
        </NuxtLink>
      </template>",
              },
              "filepath": "/components/VueTemplateSingle.vue",
            },
          ],
          "error": [
            {
              "message": "Should not respond with status code 404 (Not Found).",
              "name": "no-error-response",
              "scope": "error",
            },
          ],
          "fix": "/foo",
          "link": "/foo",
          "passes": false,
          "sources": [
            {
              "filepath": "/components/VueTemplateSingle.vue",
              "lang": "vue",
              "previews": [
                {
                  "code": "",
                  "columnNumber": 14,
                  "lineNumber": 2,
                },
              ],
            },
          ],
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
    for (const inspect of singleInspect) {
      for (const source of inspect.sources) {
        source.filepath = source.filepath.replace(resolve('../fixtures/basic'), '')
      }
      // for diff
      for (const diff of inspect.diff) {
        diff.filepath = diff.filepath.replace(resolve('../fixtures/basic'), '')
      }
    }
    expect(singleInspect).toMatchInlineSnapshot(`
      [
        {
          "diff": [
            {
              "code": "<script setup>
      </script>

      <template>
        <div>
          <NuxtLink to="/foo" data-first>
            Foo
          </NuxtLink>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to="/foo" data-second>
            Test
          </NuxtLink>
        </div>
      </template>
      ",
              "diff": {
                "added": [],
                "removed": [],
                "result": "<script setup>
      </script>

      <template>
        <div>
          <NuxtLink to="/foo" data-first>
            Foo
          </NuxtLink>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to="/foo" data-second>
            Test
          </NuxtLink>
        </div>
      </template>",
              },
              "filepath": "/components/VueTemplateMulti.vue",
            },
          ],
          "error": [
            {
              "message": "Should not respond with status code 404 (Not Found).",
              "name": "no-error-response",
              "scope": "error",
            },
          ],
          "fix": "/foo",
          "link": "/foo",
          "passes": false,
          "sources": [
            {
              "filepath": "/components/VueTemplateMulti.vue",
              "lang": "vue",
              "previews": [
                {
                  "code": "<template>
        <div>
          <NuxtLink to="/foo" data-first>
            Foo
          </NuxtLink>",
                  "columnNumber": 16,
                  "lineNumber": 6,
                },
                {
                  "code": "      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to="/foo" data-second>
            Test
          </NuxtLink>",
                  "columnNumber": 16,
                  "lineNumber": 12,
                },
              ],
            },
          ],
          "textContent": "Foo",
          "warning": [],
        },
      ]
    `)
  })
})
