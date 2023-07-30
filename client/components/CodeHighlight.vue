<script setup lang="ts">
import { ref } from '#imports'
import type { Lang } from 'shiki-es'

const props = defineProps<{
  code: string
  lang: Lang
  link: string
}>()

function transformRendered(code: string) {
  return code.replace(props.link, `<span class="highlight">${props.link}</span>`)
}

const elRef = ref<HTMLDivElement>()
</script>

<template>
  <OCodeBlock
    ref="elRef"
    :code="code"
    :lang="lang"
    :transform-rendered="transformRendered"
    v-bind="$attrs"
  />
</template>

<style>
.highlight {
  background-color: #ffd5d5;
}
</style>
