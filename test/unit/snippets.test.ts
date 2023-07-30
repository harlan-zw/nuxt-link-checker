import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { generateLinkSourcePreviews, generateLinkSources } from '../../src/runtime/server/util'

const { resolve } = createResolver(import.meta.url)

export const VueTemplateSingle = resolve('../fixture/components/VueTemplateSingle.vue')
export const VueTemplateMulti = resolve('../fixture/components/VueTemplateMulti.vue')

describe('snippets', () => {
  it('sources single', async () => {
    const sources = generateLinkSources(await fs.readFile(VueTemplateSingle, 'utf8'), '/foo')
    expect(sources).toMatchInlineSnapshot(`
      [
        {
          "columnNumber": 12,
          "end": 26,
          "lineNumber": 2,
          "start": 22,
        },
      ]
    `)
  })
  it('sources multiple', async () => {
    const sources = generateLinkSources(await fs.readFile(VueTemplateMulti, 'utf8'), '/foo')
    expect(sources).toMatchInlineSnapshot(`
      [
        {
          "columnNumber": 16,
          "end": 64,
          "lineNumber": 6,
          "start": 60,
        },
        {
          "columnNumber": 16,
          "end": 370,
          "lineNumber": 12,
          "start": 366,
        },
      ]
    `)
  })
  it ('preview single', async () => {
    const preview = generateLinkSourcePreviews(await fs.readFile(VueTemplateSingle, 'utf8'), '/foo')
    expect(preview).toMatchInlineSnapshot(`
      [
        {
          "code": "<template>
      <NuxtLink to=\\"/foo\\">
                 ^
        Foo",
          "columnNumber": 12,
          "lineNumber": 2,
        },
      ]
    `)
  })
  it ('preview multi', async () => {
    const preview = generateLinkSourcePreviews(await fs.readFile(VueTemplateMulti, 'utf8'), '/foo')
    expect(preview).toMatchInlineSnapshot(`
      [
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
      ]
    `)
  })
})
