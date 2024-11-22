<script setup lang="ts">
import type { NuxtLinkCheckerClient } from '../../../types'
import { computed, type Ref, ref } from 'vue'
import Squiggle from './Squiggle.vue'
import { useEventListener } from './utils'

const props = defineProps<{
  client: NuxtLinkCheckerClient
  highlightedLink: Ref<string | null>
  inspections: NuxtLinkCheckerClient['inspectionEls']
}>()

function openDevtools(link: string) {
  return props.client.openDevtoolsToLink(link)
}

const renderKey = ref(0)

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    renderKey.value++
  })
}

useEventListener(window, 'resize', () => {
  renderKey.value++
})

const showInspections = computed(() => {
  return props.client.showInspections.value
})
</script>

<template>
  <div
    v-if="showInspections"
    :key="renderKey"
  >
    <Squiggle
      v-for="(node, i) in inspections.value"
      :key="i"
      :highlighted="highlightedLink?.value === node.link"
      :el="node.el"
      :aria-label="`Open inspection for ${node.link}`"
      :color="node.error.length ? '#c31616' : '#b1ac18'"
      @click="openDevtools(node.link)"
    />
  </div>
</template>
