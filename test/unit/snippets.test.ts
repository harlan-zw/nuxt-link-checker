import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { generateLinkSourcePreviews, generateLinkSources } from '../../src/runtime/shared/diff'
import { VueTemplateMulti, VueTemplateSingle } from '../const'

async function linkSources(file: string) {
  // get the column number
  const source = await fs.readFile(file, 'utf8')
  return generateLinkSources(source.trim().split('\n').map(l => l.trim()).join('\n'), '/foo')
}

async function linkSourcesPreview(file: string) {
  // get the column number
  const source = await fs.readFile(file, 'utf8')
  return generateLinkSourcePreviews(source.trim().split('\n').map(l => l.trim()).join('\n'), '/foo')
}

describe('snippets', () => {
  it('sources single', async () => {
    const sources = await linkSources(VueTemplateSingle)
    expect(sources).toMatchInlineSnapshot(`
      [
        {
          "columnNumber": 12,
          "end": 29,
          "lineNumber": 2,
          "start": 25,
        },
      ]
    `)
  })
  it('sources multiple', async () => {
    const sources = await linkSources(VueTemplateMulti)
    expect(sources).toMatchInlineSnapshot(`
      [
        {
          "columnNumber": 12,
          "end": 61,
          "lineNumber": 6,
          "start": 57,
        },
        {
          "columnNumber": 12,
          "end": 339,
          "lineNumber": 12,
          "start": 335,
        },
      ]
    `)
  })
  it ('preview single', async () => {
    const preview = await linkSourcesPreview(VueTemplateSingle)
    expect(preview).toMatchInlineSnapshot(`
      [
        {
          "code": "",
          "columnNumber": 12,
          "lineNumber": 2,
        },
      ]
    `)
  })
  it ('preview multi', async () => {
    const preview = await linkSourcesPreview(VueTemplateMulti)
    expect(preview).toMatchInlineSnapshot(`
      [
        {
          "code": "<template>
      <div>
      <NuxtLink to="/foo" data-first>
      Foo
      </NuxtLink>",
          "columnNumber": 12,
          "lineNumber": 6,
        },
        {
          "code": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci alias amet at commodi consectetur cum dolores, earum, eveniet id illum molestias mollitia nesciunt nisi nulla quaerat quia similique temporibus unde.
      </div>
      <NuxtLink to="/foo" data-second>
      Test
      </NuxtLink>",
          "columnNumber": 12,
          "lineNumber": 12,
        },
      ]
    `)
  })
})
