<script setup lang="ts">
import type { BundledLanguage } from 'shiki'
import { ref } from 'vue'

const props = defineProps<{
  code: string
  lang?: BundledLanguage
  diff: { added: number[], removed: number[], result: string }
}>()

const start = ref(props.diff.added[0] - 2)

function transformRendered(code: string) {
  let count = 0
  const linesToInclude = new Set<number>()
  const diffed = code
    .replace(/class="shiki/, 'class="shiki diff')
    .replace(/class="line"/g, (_) => {
      count++
      const hasAdded = props.diff.added.includes(count - 1)
      const hasRemoved = props.diff.removed.includes(count - 1)
      // add 3 before and 3 after to linesToInclude
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
  // get inner contents of pre and replace lines
  return diffed.replace(/<code>([\s\S]*)<\/code>/, (_, p1) => {
    const lines = p1.split('\n')
    const filtered = lines.filter((_: any, i: number) => linesToInclude.has(i + 1))
    return `<code>${filtered.join('\n')}</code>`
  })
}

const elRef = ref<HTMLDivElement>()
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
