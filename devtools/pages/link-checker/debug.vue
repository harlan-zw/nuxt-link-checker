<script setup lang="ts">
import { computed } from 'vue'
import { useDebugData } from '../../lib/link-checker/state'

const { data } = useDebugData()

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
</script>

<template>
  <DevtoolsSection icon="carbon:settings" text="Runtime Config">
    <DevtoolsKeyValue :items="runtimeConfigItems" striped />
  </DevtoolsSection>
</template>
