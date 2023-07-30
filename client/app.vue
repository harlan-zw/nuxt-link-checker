<script setup lang="ts">
import { computed, ref } from 'vue'
import FixActionDialog from './components/FixActionDialog.vue'
import { linkCheckerRpc } from './composables/rpc'
import { linkDb, linkFilter, queueLength, visibleLinks } from './composables/state'

const refreshSnippets = ref(0)

const interval = setInterval(() => {
  refreshSnippets.value++
  if (refreshSnippets.value >= 3)
    clearInterval(interval)
}, 2000)

const nodes = computed(() => {
  const validLinks = visibleLinks.value
  let n = [...linkDb.value]
  if (linkFilter.value)
    n = n.filter(node => node.link === linkFilter.value)
  else
    n = n.filter(node => validLinks.includes(node.link))
  // sort by whether or not they have a fix
  return n.sort((a, b) => {
    return a.fix && !b.fix ? 1 : -1
  })
})

const passingCount = computed(() => {
  return nodes.value.filter(n => n.passes).length
})
const errorCount = computed(() => {
  let count = 0
  nodes.value.map(n => n.error.length).forEach((n) => {
    count += n
  })
  return count
})
const warningCount = computed(() => {
  let count = 0
  nodes.value.map(n => n.warning.length).forEach((n) => {
    count += n
  })
  return count
})

const visibleLinkCount = computed(() => {
  return visibleLinks.value.length
})

async function retryAll() {
  linkDb.value = []
  queueLength.value = 0
  await linkCheckerRpc.value.reset()
}
</script>

<template>
  <div class="relative p8 n-bg-base flex flex-col h-screen">
    <div>
      <div class="flex justify-between" mb4>
        <div>
          <h2 text-lg mb2 flex items-center gap-2>
            <NIcon icon="carbon:cloud-satellite-link" op50 />
            Link Inspections
          </h2>
          <p text-sm op60 mb3>
            Discover issues with your links that may be negatively effecting your SEO.
          </p>
        </div>
        <div v-if="!linkFilter && nodes.length">
          <button class="hover:shadow-lg text-sm transition items-center gap-2 inline-flex border-green-500/50 border-1 rounded-lg shadow-sm px-3 py-1" @click="retryAll">
            <NIcon icon="carbon:retry-failed" />
            <div>
              Retry All
            </div>
          </button>
        </div>
      </div>
      <p v-if="linkFilter" text-sm flex items-center gap-1 mb6>
        <NIcon icon="carbon:filter" /> Filtering Results. <button type="button" underline @click="linkFilter = false">
          Show All
        </button>
      </p>
      <div v-if="!linkFilter">
        <div flex items-center gap-3 mb7 text-sm>
          <div mr5>
            <span v-if="queueLength">
              <NIcon icon="carbon:progress-bar-round" class="animated animate-spin op50 text-xs" />
              {{ Math.abs(queueLength - visibleLinkCount) }} /
            </span>
            {{ visibleLinkCount }} Links
          </div>
          <div text-xs>
            <NIcon icon="carbon:error" h-4 w-4 text-red-500 />
            {{ errorCount }}
            Errors
          </div>
          <div text-xs>
            <NIcon icon="carbon:warning" h-4 w-4 text-red-500 />
            {{ warningCount }}
            Warnings
          </div>
          <div text-xs>
            <NIcon icon="carbon:checkmark-outline" h-4 w-4 text-green-500 />
            {{ passingCount }}
            Passing
          </div>
        </div>
        <LinkInspection v-for="(item, index) of nodes.filter(n => n.error.length)" :key="index" :item="item" />
        <LinkInspection v-for="(item, index) of nodes.filter(n => n.warning.length)" :key="index" :item="item" />
        <LinkInspection v-for="(item, index) of nodes.filter(n => n.passes)" :key="index" :item="item" />
      </div>
      <div v-else>
        <LinkInspection v-for="(item, index) of nodes" :key="index" :item="item" />
      </div>
      <FixActionDialog />
    </div>
    <div class="flex-auto" />
  </div>
</template>
