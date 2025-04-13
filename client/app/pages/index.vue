<script lang="ts" setup>
// import { object, number , enum } from 'valibot'
import { useRpcConnection } from '~/composables/rpc'

const scans = ref()
const ctx = useRpcConnection()

onMounted(async () => {
  scans.value = (await ctx).scans.value
  console.log('scans.value', scans.value)
})

const rowSelection = ref<Record<string, boolean>>({})

function onSelect(row: TableRow<Payment>, e?: Event) {
  /* If you decide to also select the column you can do this  */
  row.toggleSelected(!row.getIsSelected())

  // let's go to the page
  navigateTo('/scan/1')
  console.log(e)
}

// const links = ref([])

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

const state = reactive({
  urlDiscovery: 'Sitemap',
  limitPages: 100,
})

async function newCrawl() {
  scans.value = await (await ctx).rpc.newScan(state)
  console.log('New scan started', scans.value)
  // await linkCheckerRpc.value!.newScan()
  // await linkCheckerRpc.value!.work()
}

const columns = [
  {
    accessorKey: 'createdAt',
    header: 'Created At',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'results',
    header: 'Total URLs crawled',
  },
  {
    accessorKey: 'queue',
    header: 'URL Queue',
  },
  {
    header: 'Actions',
  },
]
const scanTable = computed(() => {

  return scans.value?.scans.map((scan) => {
    return {
      createdAt: new Date(scan.createdAt).toLocaleString(),
      status: scan.queue.length > 0 ? 'In Progress' : 'Completed',
      queue: scan.queue.length,
      results: scan.results.length,
    }
  })
})
</script>

<template>
  <UCard class="w-full max-w-2xl mx-auto">
    <div v-if="!scans?.scans?.length">
      <UForm :state="state" class="space-y-4" @submit="newCrawl">
        <UFormField label="URL Discovery" name="urlDiscovery">
          <USelectMenu v-model="state.urlDiscovery" :options="['Sitemap', 'Google Search Console', 'Crawl']" />
        </UFormField>
        <UFormField label="Limit Pages" name="limitPages">
          <UInputNumber v-model="state.limitPages" />
        </UFormField>
        <p class="mb-3 text-sm">
          Nuxt Audit will scan all of your pages using your sitemap.xml. It will statically analyze the HTML for issues.
        </p>
        <UButton type="submit">
          Start New Crawl
        </UButton>
      </UForm>
    </div>
    <div v-else>
    <UTable
      v-model:row-selection="rowSelection"
      :data="scanTable"
      :columns="columns"
      @select="onSelect"
    />
    </div>
  </UCard>
</template>
