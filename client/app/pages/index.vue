<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { useAuditStore } from '~/composables/state'

const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')

const store = useAuditStore()

const scans = computed(() => {
  return store.value || []
})
onMounted(async () => {
  if (!scans.value.length) {
    navigateTo('/create')
  }
  console.log('scans.value', scans.value)
})

interface ScanResult {
  createdAt: string
  status: string
  queue: {
    size: number
  }
  completed: {
    size: number
  }
}

const rowSelection = ref<ScanResult>({})

// const links = ref([])`

// onRpcConnected(async (ctx) => {
//   // const scans = await linkCheckerRpc.value!.getScans()
//   // links.value = await ctx.$fetch('/__link-checker__/links')
//   // console.log({ scans })
//   console.log({ links: links.value })
// })

// const schema = object({
//   urlDiscovery: enum(['Sitemap', 'Google Search Console', 'Crawl']),
//   limitPages: number().min(1).max(1000),
// })

// type Schema = v.InferOutput<typeof schema>

const columns: TableColumn<ScanResult>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (ctx) => {
      return h(NuxtLink, { class: 'text-blue-400 font-semibold', to: `/audits/${ctx.row.original.id}` }, ctx.getValue())
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
  },
  {
    accessorKey: 'currentTaskStatus',
    header: 'Status',
    cell: ({ row }) => {
      const color = {
        pending: 'neutral' as const,
        pending: 'neutral' as const,
        running: 'warning' as const,
        done: 'success' as const,
        error: 'error' as const,
      }[row.getValue('currentTaskStatus') as string]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.getValue('currentTaskStatus'))
    },
  },
  {
    header: 'Actions',
  },
]
const scanTable = computed(() => {
  return scans.value
    .toSorted((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .map((scan) => {
      return {
        ...scan,
        createdAt: new Date(scan.createdAt).toLocaleString(),
      }
    })
})
</script>

<template>
  <UCard class="w-full max-w-2xl mx-auto">
    <div>
      <UTable
        v-model:row-selection="rowSelection"
        :data="scanTable"
        :columns="columns"
        @select="onSelect"
      />
    </div>
  </UCard>
</template>
