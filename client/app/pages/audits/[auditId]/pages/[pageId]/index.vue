<script lang="ts" setup>
import { useRpcConnection } from '~/composables/rpc'

definePageMeta({
  layout: 'scan',
})
const auditId = useRoute().params.auditId
const pageId = useRoute().params.pageId
const rpc = useRpcConnection()
const results = await rpc.getAuditResults(auditId)
const page = computed(() => {
  return results.find(r => r.id === pageId)
})
</script>

<template>
  <div>
    <div>Path: {{ page.url }}</div>
    <div>Title: {{ page.title }}</div>
    <div>Description: {{ page.description }}</div>
    <div>Title: {{ page.title }}</div>
    <div>Images: {{ page.images.length }}</div>
    <div>{{ JSON.stringify(page) }}</div>
    page id {{ page?.id }}
  </div>
</template>
