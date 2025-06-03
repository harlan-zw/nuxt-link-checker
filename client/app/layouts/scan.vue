<script lang="ts" setup>
import { useActiveAudit, useAuditStore } from '~/composables/state'

const route = useRoute()
const data = useAuditStore()

if (!route.params.auditId) {
  navigateTo(`/create`)
}

const audit = useActiveAudit()

watch([audit, data], () => {
  if (audit.value?.tasks.crawl.status !== 'done') {
    // redirect to loading
    navigateTo(`/audits/${route.params.auditId}/loading`)
  }
}, {
  immediate: true,
})

const createdAt = computed(() => {
  return audit.value?.createdAt ? new Date(audit.value.createdAt).toLocaleString() : 'Loading...'
})

// Navigation sections configuration
const navigationSections = [
  {
    title: 'Navigation',
    items: [
      {
        name: 'overview',
        label: 'Overview',
        icon: 'i-lucide-layout-dashboard',
        to: `/audits/${route.params.auditId}`,
        active: route.path === `/audits/${route.params.auditId}`,
      },
      {
        name: 'pages',
        label: 'Page Explorer',
        icon: 'i-lucide-file-text',
        to: `/audits/${route.params.auditId}/pages`,
        active: route.path.includes('/pages') && !route.path.includes('/error-pages'),
      },
      {
        name: 'issues',
        label: 'All Issues',
        icon: 'i-lucide-alert-triangle',
        to: `/audits/${route.params.auditId}/issues`,
        active: route.path.includes('/issues'),
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        name: 'error-pages',
        label: 'Error Pages',
        icon: 'i-lucide-x-circle',
        to: `/audits/${route.params.auditId}/reports/error-pages`,
        active: route.path.includes('/error-pages'),
      },
      {
        name: 'performance',
        label: 'Performance',
        icon: 'i-lucide-zap',
        to: `/audits/${route.params.auditId}/reports/performance`,
        active: route.path.includes('/performance'),
      },
      {
        name: 'crawlability',
        label: 'Crawlability',
        icon: 'i-lucide-search',
        to: `/audits/${route.params.auditId}/reports/crawlability`,
        active: route.path.includes('/crawlability'),
      },
      {
        name: 'internal-linking',
        label: 'Internal Linking',
        icon: 'i-lucide-link',
        to: `/audits/${route.params.auditId}/reports/internal-linking`,
        active: route.path.includes('/internal-linking'),
      },
      {
        name: 'open-graph',
        label: 'Open Graph',
        icon: 'i-lucide-share-2',
        to: `/audits/${route.params.auditId}/reports/open-graph`,
        active: route.path.includes('/open-graph'),
      },
      {
        name: 'content-analysis',
        label: 'Content Analysis',
        icon: 'i-lucide-file-check',
        to: `/audits/${route.params.auditId}/reports/content-analysis`,
        active: route.path.includes('/content-analysis'),
      },
    ],
  },
  {
    title: 'Technical',
    items: [
      {
        name: 'redirects',
        label: 'Redirects',
        icon: 'i-lucide-corner-up-right',
        to: `/audits/${route.params.auditId}/reports/redirects`,
        active: route.path.includes('/redirects'),
      },
    ],
  },
]
</script>

<template>
  <div class="flex gap-10 mt-5">
    <nav class="lg:sticky top-3 self-start mb-5">
      <div class="space-y-6">
        <div v-for="section in navigationSections" :key="section.title">
          <div class="mb-3 px-2">
            <span class="text-gray-500 font-semibold text-xs uppercase tracking-wide">{{ section.title }}</span>
          </div>
          <UNavigationMenu
            open
            orientation="vertical"
            highlight
            :items="section.items"
            class="w-[180px]"
          />
        </div>
      </div>
    </nav>

    <div class="space-y-5 flex-grow">
      <div class="flex items-center justify-between">
        <div class="text-gray-500 text-sm whitespace-nowrap">
          {{ audit?.name }} • {{ createdAt }}
        </div>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <UIcon name="i-lucide-clock" class="w-3 h-3" />
          <span>Last updated: {{ createdAt }}</span>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>
