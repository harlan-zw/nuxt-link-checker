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
  it('endpoint previews', async () => {
    const singlePreview = await $fetch('/api/__link_checker__/previews', {
      query: {
        filepath: VueTemplateSingle,
        link: '/foo',
      },
    })
    expect(singlePreview).toMatchInlineSnapshot(`
      {
        "lang": "vue",
        "previews": [
          {
            "code": "<template>
      <NuxtLink to=\\"/foo\\">
                 ^
        Foo",
            "columnNumber": 12,
            "lineNumber": 2,
          },
        ],
      }
    `)
    const multiPreview = await $fetch('/api/__link_checker__/previews', {
      query: {
        filepath: VueTemplateMulti,
        link: '/foo',
      },
    })
    expect(multiPreview).toMatchInlineSnapshot(`
      {
        "lang": "vue",
        "previews": [
          {
            "code": "  <div>
          <NuxtLink to=\\"/foo\\" data-first>
                     ^
            Foo",
            "columnNumber": 16,
            "lineNumber": 6,
          },
          {
            "code": "    </div>
          <NuxtLink to=\\"/foo\\" data-second>
                     ^
            Test",
            "columnNumber": 16,
            "lineNumber": 12,
          },
        ],
      }
    `)
  }, 60000)

  it('endpoint diffs', async () => {
    const singleDiff = await $fetch('/api/__link_checker__/diff', {
      query: {
        filepath: VueTemplateSingle,
        original: '/foo',
        replacement: '/foo-new-link/',
      },
    })
    expect(singleDiff).toMatchInlineSnapshot(`
      {
        "content": "<template>
      <NuxtLink to=\\"/foo-new-link/foo\\">
        Foo
      </NuxtLink>
      </template>
      ",
        "diff": {
          "added": [
            2,
          ],
          "removed": [
            1,
          ],
          "result": "<template>
      <NuxtLink to=\\"/foo\\">
      <NuxtLink to=\\"/foo-new-link/foo\\">
        Foo
      </NuxtLink>
      </template>",
        },
      }
    `)
    const multiDiff = await $fetch('/api/__link_checker__/diff', {
      query: {
        filepath: VueTemplateMulti,
        original: '/foo',
        replacement: '/foo-new-link/',
      },
    })
    expect(multiDiff).toMatchInlineSnapshot(`
      {
        "content": "<script setup>
      </script>

      <template>
        <div>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-first>
            Foo
          </NuxtLink>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-second>
            Test
          </NuxtLink>
        </div>
      </template>
      ",
        "diff": {
          "added": [
            6,
            13,
          ],
          "removed": [
            5,
            12,
          ],
          "result": "<script setup>
      </script>

      <template>
        <div>
          <NuxtLink to=\\"/foo\\" data-first>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-first>
            Foo
          </NuxtLink>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to=\\"/foo\\" data-second>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-second>
            Test
          </NuxtLink>
        </div>
      </template>",
        },
      }
    `)
  }, 60000)

  it('endpoint inspect', async () => {
    const singleInspect = await $fetch('/api/__link_checker__/inspect', {
      method: 'POST',
      body: {
        links: [
          {
            link: '/foo',
            paths: [VueTemplateSingle],
          },
        ],
        ids: [],
      },
    })
    expect(singleInspect).toMatchInlineSnapshot('{}')
  })

  it('endpoint fix', async () => {
    const singleFix = await $fetch('/api/__link_checker__/fix', {
      query: {
        filepath: VueTemplateSingle,
        original: '/foo',
        replacement: '/foo-new-link/',
        readonly: true,
      },
    })
    expect(singleFix).toMatchInlineSnapshot(`
      {
        "content": "<template>
      <NuxtLink to=\\"/foo-new-link/foo\\">
        Foo
      </NuxtLink>
      </template>
      ",
      }
    `)

    const multiFix = await $fetch('/api/__link_checker__/fix', {
      query: {
        filepath: VueTemplateMulti,
        original: '/foo',
        replacement: '/foo-new-link/',
        readonly: true,
      },
    })
    expect(multiFix).toMatchInlineSnapshot(`
      {
        "content": "<script setup>
      </script>

      <template>
        <div>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-first>
            Foo
          </NuxtLink>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to=\\"/foo-new-link/foo\\" data-second>
            Test
          </NuxtLink>
        </div>
      </template>
      ",
      }
    `)
  }, 60000)
})
