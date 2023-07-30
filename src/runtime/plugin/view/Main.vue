<script setup lang="ts">
import type { NuxtLinkCheckerClient } from '../../types'
import Squiggle from './Squiggle.vue'
import { useEventListener } from './utils'

const props = defineProps<{
  client: NuxtLinkCheckerClient
  inspections: NuxtLinkCheckerClient['inspectionEls']
}>()

function openDevtools(link: string) {
  return props.client.openDevtoolsToLink(link)
}

const renderKey = ref(0)

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    renderKey.value++
    props.client.reset(true)
  })
}

useEventListener(window, 'resize', () => {
  renderKey.value++
})
</script>

<template>
  <div
    :key="renderKey"
  >
    <Squiggle
      v-for="(node, i) in inspections.value"
      :key="i"
      :el="node.el"
      :aria-label="`Open inspection for ${node.link}`"
      :color="node.error.length ? 'red' : 'yellow'"
      @click="openDevtools(node.link)"
    />
  </div>
</template>
