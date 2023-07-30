<script setup lang="ts">
import type { Lang } from 'shiki-es'
import { computed } from 'vue'
import { renderCodeHighlight } from '../composables/shiki'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: Lang
    lines?: boolean
    transformRendered?: (code: string) => string
  }>(), {
    lines: true,
  },
)

const shiki = renderCodeHighlight(props.code, props.lang)
await shiki.promise

const rendered = computed(() => {
  return props.transformRendered ? props.transformRendered(shiki.code.value || '') : shiki.code.value
})
</script>

<template>
  <pre
    class="n-code-block"
    :class="lines ? 'n-code-block-lines' : ''"
    v-html="rendered"
  />
</template>

<style>
.n-code-block-lines .shiki code {
  counter-reset: step;
  counter-increment: step calc(var(--start, 1) - 1);
}
.n-code-block-lines .shiki code .line::before {
  content: counter(step);
  counter-increment: step;
  width: 2rem;
  padding-right: 0.5rem;
  margin-right: 0.5rem;
  display: inline-block;
  text-align: right;
  --at-apply: text-truegray:50;
}
</style>
