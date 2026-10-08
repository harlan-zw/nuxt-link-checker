import { describe, expect, it } from 'vitest'
import { generateLinkSourcePreviews, generateLinkSources } from '../../src/runtime/shared/diff'

const VueTemplateSingle = `<template>
  <NuxtLink to="/foo">
    Foo
  </NuxtLink>
</template>`

const VueTemplateMulti = `<script setup>
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
</template>`

function normalizeSource(source: string) {
  return source.trim().split('\n').map(l => l.trim()).join('\n')
}

function linkSources(source: string) {
  return generateLinkSources(normalizeSource(source), '/foo')
}

function linkSourcesPreview(source: string) {
  return generateLinkSourcePreviews(normalizeSource(source), '/foo')
}

describe('snippets', () => {
  it('sources single', () => {
    const sources = linkSources(VueTemplateSingle)
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
  it('sources multiple', () => {
    const sources = linkSources(VueTemplateMulti)
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
  it('preview single', () => {
    const preview = linkSourcesPreview(VueTemplateSingle)
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
  it('preview multi', () => {
    const preview = linkSourcesPreview(VueTemplateMulti)
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
