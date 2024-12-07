import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { generateLinkSourcePreviews, generateLinkSources } from '../../src/runtime/shared/diff'
import { VueTemplateMulti, VueTemplateSingle } from '../const'

describe('snippets', () => {
  it('sources single', async () => {
    const sources = generateLinkSources(await fs.readFile(VueTemplateSingle, 'utf8'), '/foo')
    expect(sources).toMatchInlineSnapshot(`
      [
        {
          "columnNumber": 14,
          "end": 32,
          "lineNumber": 2,
          "start": 28,
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
          "end": 72,
          "lineNumber": 6,
          "start": 68,
        },
        {
          "columnNumber": 16,
          "end": 384,
          "lineNumber": 12,
          "start": 380,
        },
      ]
    `)
  })
  it ('preview single', async () => {
    const preview = generateLinkSourcePreviews(await fs.readFile(VueTemplateSingle, 'utf8'), '/foo')
    expect(preview).toMatchInlineSnapshot(`
      [
        {
          "code": "",
          "columnNumber": 14,
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
          "code": "<template>
        <div>
          <NuxtLink to="/foo" data-first>
            Foo
          </NuxtLink>
      ",
          "columnNumber": 16,
          "lineNumber": 6,
        },
        {
          "code": "      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
          </div>
          <NuxtLink to="/foo" data-second>
            Test
          </NuxtLink>
      ",
          "columnNumber": 16,
          "lineNumber": 12,
        },
      ]
    `)
  })
})
