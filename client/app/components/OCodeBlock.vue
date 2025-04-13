<script setup lang="ts">
import type { BuiltinLanguage } from 'shiki'
import { computed } from 'vue'
import { renderCodeHighlight } from '../composables/shiki'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: BuiltinLanguage
    lines?: boolean
    transformRendered?: (code: string) => string
  }>(),
  {
    lines: true,
  },
)
const rendered = computed(() => {
  const code = renderCodeHighlight(props.code, 'html')
  return props.transformRendered ? props.transformRendered(code.value || '') : code.value
})
</script>

<template>
<ProsePre v-html="rendered">
</ProsePre>
</template>
