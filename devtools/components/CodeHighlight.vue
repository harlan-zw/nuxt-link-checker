<script setup lang="ts">
import type { BundledLanguage } from 'shiki'

const props = defineProps<{
  code: string
  lang: BundledLanguage
  link: string
}>()

function transformRendered(code: string) {
  return code.replace(props.link, `<span class="highlight">${props.link}</span>`)
}

const elRef = useTemplateRef<HTMLDivElement>('elRef')
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

.vitesse-dark .highlight {
  background-color: #5c0000;
}
</style>
