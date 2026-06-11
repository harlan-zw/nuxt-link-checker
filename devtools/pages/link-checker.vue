<script setup lang="ts">
import { navigateTo, useRoute } from '#imports'
import { loadShiki } from 'nuxtseo-layer-devtools/composables/shiki'
import { isProductionMode, refreshSources } from 'nuxtseo-layer-devtools/composables/state'
import { computed, ref, watch } from 'vue'
import { linkCheckerRpc } from '../lib/link-checker/rpc'
import { linkDb, queueLength, showLiveInspections, useDebugData } from '../lib/link-checker/state'

await loadShiki({
  extraLangs: [
    import('@shikijs/langs/vue-html'),
  ],
})

const { data } = await useDebugData()

const route = useRoute()
const currentTab = computed(() => {
  const p = route.path
  if (p.startsWith('/link-checker/links'))
    return 'links'
  if (p.startsWith('/link-checker/debug'))
    return 'debug'
  if (p.startsWith('/link-checker/docs'))
    return 'docs'
  return 'inspections'
})

const navItems = [
  { value: 'inspections', to: '/link-checker', icon: 'carbon:warning-diamond', label: 'Inspections', devOnly: false },
  { value: 'links', to: '/link-checker/links', icon: 'carbon:checkmark-outline', label: 'Links', devOnly: false },
  { value: 'debug', to: '/link-checker/debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', to: '/link-checker/docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

const loading = ref(false)

async function retryAll() {
  linkDb.value = []
  queueLength.value = 0
  await linkCheckerRpc.value!.reset()
}
async function toggleLiveInspections() {
  showLiveInspections.value = !showLiveInspections.value
  await linkCheckerRpc.value!.toggleLiveInspections(showLiveInspections.value)
}
async function refresh() {
  loading.value = true
  await retryAll()
  refreshSources()
  setTimeout(() => {
    loading.value = false
  }, 300)
}

// Debug data is dev-only; leave the debug tab when the header switches to Production
watch(isProductionMode, (isProd) => {
  if (isProd && currentTab.value === 'debug')
    return navigateTo('/link-checker')
})
</script>

<template>
  <DevtoolsLayout
    v-model:active-tab="currentTab"
    module-name="nuxt-link-checker"
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
    <NuxtPage />
  </DevtoolsLayout>
</template>
