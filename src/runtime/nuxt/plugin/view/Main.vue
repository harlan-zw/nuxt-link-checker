<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NuxtLinkCheckerClient } from '../../../types'
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
      :el="node.el"
      :aria-label="`Open inspection for ${node.link}`"
      :color="node.error.length ? '#991b1b' : '#854d0e'"
      @click="openDevtools(node.link)"
    />
  </div>
</template>
