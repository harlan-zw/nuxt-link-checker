<script setup lang="ts">
import type { BundledLanguage } from 'shiki'

const props = defineProps<{
  code: string
  lang?: BundledLanguage
  diff: { added: number[], removed: number[], result: string }
}>()

const start = ref(props.diff.added[0] - 2)

const shikiClassRe = /class="shiki/
const lineClassRe = /class="line"/g
const codeContentRe = /<code>([\s\S]*)<\/code>/

function transformRendered(code: string) {
  let count = 0
  const linesToInclude = new Set<number>()
  const diffed = code
    .replace(shikiClassRe, 'class="shiki diff')
    .replace(lineClassRe, (_) => {
      count++
      const hasAdded = props.diff.added.includes(count - 1)
      const hasRemoved = props.diff.removed.includes(count - 1)
      if (hasAdded || hasRemoved) {
        for (let i = count - 3; i < count + 3; i++) {
          if (i >= 0)
            linesToInclude.add(i)
        }
      }
      if (hasAdded)
        return 'class="line line-added"'
      if (hasRemoved)
        return 'class="line line-removed"'
      return _
    })
  return diffed.replace(codeContentRe, (_, p1) => {
    const lines = p1.split('\n')
    const filtered = lines.filter((_: any, i: number) => linesToInclude.has(i + 1))
    return `<code>${filtered.join('\n')}</code>`
  })
}

const elRef = useTemplateRef<HTMLDivElement>('elRef')
</script>

<template>
  <OCodeBlock
    ref="elRef"
    :code="diff.result"
    :lang="lang"
    :transform-rendered="transformRendered"
    :style="`--start: ${start};`"
  />
</template>
