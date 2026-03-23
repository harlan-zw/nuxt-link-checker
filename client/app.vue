<script setup lang="ts">
import { computed, ref } from 'vue'
import FixActionDialog from './components/FixActionDialog.vue'
import { linkCheckerRpc } from './composables/rpc'
import {
  data,
  linkDb,
  linkFilter,
  queueLength,
  refreshSources,
  showLiveInspections,
  visibleLinks,
} from './composables/state'
import './composables/rpc'

await loadShiki({
  extraLangs: [
    import('@shikijs/langs/vue-html'),
  ],
})

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
  return n.sort((a, b) => {
    return a.fix && !b.fix ? 1 : -1
  })
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
  await linkCheckerRpc.value!.reset()
}
async function toggleLiveInspections() {
  showLiveInspections.value = !showLiveInspections.value
  await linkCheckerRpc.value!.toggleLiveInspections(showLiveInspections.value)
}

const tab = ref('inspections')
const loading = ref(false)

const navItems = [
  { value: 'inspections', icon: 'carbon:warning-diamond', label: 'Inspections' },
  { value: 'links', icon: 'carbon:checkmark-outline', label: 'Links' },
  { value: 'debug', icon: 'carbon:debug', label: 'Debug' },
  { value: 'docs', icon: 'carbon:book', label: 'Docs' },
]

async function refresh() {
  loading.value = true
  data.value = null
  await retryAll()
  await refreshSources()
  setTimeout(() => {
    loading.value = false
  }, 300)
}
</script>

<template>
  <DevtoolsLayout
    v-model:active-tab="tab"
    title="Link Checker"
    icon="carbon:cloud-satellite-link"
    :version="data?.runtimeConfig?.version"
    :nav-items="navItems"
    github-url="https://github.com/harlan-zw/nuxt-link-checker"
    :loading="loading"
    @refresh="refresh"
  >
    <template #actions>
      <UButton
        :icon="showLiveInspections ? 'carbon:view-off' : 'carbon:view'"
        variant="ghost"
        size="xs"
        :label="showLiveInspections ? 'Hide Inspections' : 'Show Inspections'"
        @click="toggleLiveInspections"
      />
    </template>

    <!-- Inspections tab -->
    <div v-if="tab === 'inspections'" class="space-y-2">
      <div class="flex items-center gap-3 text-sm px-1 py-2">
        <div v-if="queueLength" class="flex items-center gap-1.5">
          <UIcon name="carbon:progress-bar-round" class="animate-spin text-[var(--color-text-muted)]" />
          <span class="text-xs">{{ Math.round((Math.abs(queueLength - visibleLinkCount) / visibleLinkCount) * 100) }}%</span>
        </div>
        <div v-if="errorCount" class="flex items-center gap-1 text-xs">
          <UIcon name="carbon:error" class="text-red-500" />
          {{ errorCount }} Errors
        </div>
        <div v-if="warningCount" class="flex items-center gap-1 text-xs">
          <UIcon name="carbon:warning" class="text-yellow-500" />
          {{ warningCount }} Warnings
        </div>
        <div v-if="!warningCount && !errorCount" class="flex items-center gap-1 text-xs">
          <UIcon name="carbon:checkmark-outline" class="text-green-500" />
          All links passing
        </div>
      </div>

      <p v-if="linkFilter" class="text-sm flex items-center gap-1 mb-4">
        <UIcon name="carbon:filter" />
        Filtering Results.
        <button type="button" class="underline" @click="linkFilter = false">Show All</button>
      </p>

      <div v-if="!linkFilter">
        <LinkInspection
          v-for="(item, index) of [...nodes.filter(n => n.error.length), ...nodes.filter(n => n.warning.length)]"
          :key="index"
          :item="item"
          class="odd:bg-[var(--color-bg-elevated)] p-2"
        />
      </div>
      <div v-else>
        <LinkInspection v-for="(item, index) of nodes" :key="index" :item="item" />
      </div>
      <FixActionDialog />
    </div>

    <!-- Links tab -->
    <div v-else-if="tab === 'links'" class="space-y-4">
      <DevtoolsSection icon="carbon:chart-network" text="Internal Links">
        <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && n.link.startsWith('/'))" :key="index" :item="item" />
      </DevtoolsSection>
      <DevtoolsSection icon="carbon:launch" text="External Links">
        <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && !n.link.startsWith('/'))" :key="index" :item="item" />
      </DevtoolsSection>
    </div>

    <!-- Debug tab -->
    <div v-else-if="tab === 'debug'" class="space-y-4">
      <DevtoolsSection icon="carbon:settings" text="Runtime Config">
        <DevtoolsSnippet
          :code="JSON.stringify(data?.runtimeConfig || {}, null, 2)"
          lang="json"
          label="Runtime Config"
        />
      </DevtoolsSection>
    </div>

    <!-- Docs tab -->
    <DevtoolsDocs v-else-if="tab === 'docs'" url="https://nuxtseo.com/link-checker" />
  </DevtoolsLayout>
</template>
