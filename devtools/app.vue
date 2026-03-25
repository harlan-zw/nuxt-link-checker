<script setup lang="ts">
import FixActionDialog from './components/FixActionDialog.vue'
import { linkCheckerRpc } from './composables/rpc'
import {
  linkDb,
  linkFilter,
  queueLength,
  showLiveInspections,
  useDebugData,
  visibleLinks,
} from './composables/state'

await loadShiki({
  extraLangs: [
    import('@shikijs/langs/vue-html'),
  ],
})

const { data } = await useDebugData()

const refreshSnippets = ref(0)

onMounted(() => {
  const timer = setInterval(() => {
    refreshSnippets.value++
    if (refreshSnippets.value >= 3)
      clearInterval(timer)
  }, 2000)

  onUnmounted(() => {
    clearInterval(timer)
  })
})

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

const failingNodes = computed(() => {
  const seen = new Set<string>()
  return nodes.value.filter((n) => {
    if (!n.error.length && !n.warning.length)
      return false
    if (seen.has(n.link))
      return false
    seen.add(n.link)
    return true
  })
})

const internalLinks = computed(() => nodes.value.filter(n => n.passes && n.link.startsWith('/')))
const externalLinks = computed(() => nodes.value.filter(n => n.passes && !n.link.startsWith('/')))

const errorCount = computed(() => {
  return nodes.value.reduce((count, n) => count + n.error.length, 0)
})
const warningCount = computed(() => {
  return nodes.value.reduce((count, n) => count + n.warning.length, 0)
})

const visibleLinkCount = computed(() => {
  return visibleLinks.value.length
})

const runtimeConfigItems = computed(() => {
  const config = data.value?.runtimeConfig || {}
  return Object.entries(config)
    .filter(([key]) => key !== 'version')
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? ''),
      mono: true,
      copyable: true,
      code: typeof value === 'object' ? 'json' as const : undefined,
    }))
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
  { value: 'inspections', icon: 'carbon:warning-diamond', label: 'Inspections', devOnly: false },
  { value: 'links', icon: 'carbon:checkmark-outline', label: 'Links', devOnly: false },
  { value: 'debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

async function refresh() {
  loading.value = true
  await retryAll()
  refreshSources()
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
      <DevtoolsToolbar>
        <DevtoolsMetric
          v-if="queueLength"
          icon="carbon:progress-bar-round"
          :value="`${visibleLinkCount ? Math.round((Math.abs(queueLength - visibleLinkCount) / visibleLinkCount) * 100) : 0}%`"
        />
        <DevtoolsMetric
          v-if="errorCount"
          icon="carbon:error"
          :value="errorCount"
          label="Errors"
          variant="danger"
        />
        <DevtoolsMetric
          v-if="warningCount"
          icon="carbon:warning"
          :value="warningCount"
          label="Warnings"
          variant="warning"
        />
        <DevtoolsMetric
          v-if="!warningCount && !errorCount"
          icon="carbon:checkmark-outline"
          value="All links passing"
          variant="success"
        />
      </DevtoolsToolbar>

      <p v-if="linkFilter" class="text-sm flex items-center gap-1 mb-4">
        <UIcon name="carbon:filter" />
        Filtering Results.
        <button type="button" class="underline" @click="linkFilter = false">
          Show All
        </button>
      </p>

      <div v-if="!linkFilter">
        <template v-if="failingNodes.length">
          <LinkInspection
            v-for="(item, index) of failingNodes"
            :key="index"
            :item="item"
            class="odd:bg-[var(--color-bg-elevated)] p-2"
          />
        </template>
        <DevtoolsEmptyState
          v-else-if="!queueLength"
          icon="carbon:checkmark-outline"
          title="No issues found"
          description="All visible links are passing validation."
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
        <LinkPassing v-for="(item, index) of internalLinks" :key="index" :item="item" />
        <DevtoolsEmptyState v-if="!internalLinks.length" icon="carbon:link" title="No internal links" />
      </DevtoolsSection>
      <DevtoolsSection icon="carbon:launch" text="External Links">
        <LinkPassing v-for="(item, index) of externalLinks" :key="index" :item="item" />
        <DevtoolsEmptyState v-if="!externalLinks.length" icon="carbon:link" title="No external links" />
      </DevtoolsSection>
    </div>

    <!-- Debug tab -->
    <div v-else-if="tab === 'debug'" class="space-y-4">
      <DevtoolsSection icon="carbon:settings" text="Runtime Config">
        <DevtoolsKeyValue :items="runtimeConfigItems" striped />
      </DevtoolsSection>
    </div>

    <!-- Docs tab -->
    <DevtoolsDocs v-else-if="tab === 'docs'" url="https://nuxtseo.com/link-checker" />
  </DevtoolsLayout>
</template>
