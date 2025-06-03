<script lang="ts" setup>
import type { CheckboxGroupItem } from '#ui/components/CheckboxGroup.vue'
import type { Audit, CreateAuditInput } from '../../../packages/module/src/types'
import { useRpcConnection } from '~/composables/rpc'

const rpc = useRpcConnection()
const auditName = await rpc.generateCreateDefaults()
const state = reactive({
  name: auditName.name.development,
  scanType: 'development',
  origin: auditName.origin.development,
} satisfies CreateAuditInput)

watch(state, () => {
  if (state.scanType === 'live') {
    state.origin = auditName.origin.live
  }
  else if (state.scanType === 'default') {
    state.origin = auditName.origin.default
  }
  else {
    state.origin = auditName.origin.development
  }
}, {
  deep: true,
})

async function newCrawl() {
  const audit = await rpc.createAudit(state)
  navigateTo(`/audits/${audit.id}/loading`)
}

const items = ref<CheckboxGroupItem[]>([
  {
    label: 'Development',
    description: 'Test against the current development environment.',
    id: 'development' satisfies Audit['scanType'],
    pros: [
      'Fastest scan type',
      'No rate-limiting',
      'Best for quick feedback',
    ],
    cons: [
      'May flag false-positives',
      'Not suitable for production testing',
    ],
  },
  {
    label: 'Production Live',
    description: 'Test against your production site.',
    id: 'live' satisfies Audit['scanType'],
    pros: [
      'Accurate results',
      'Best for production testing',
    ],
    cons: [
      'May get rate-limited',
      'Slower than development scan',
    ],
  },
  {
    label: 'Production Local',
    description: 'Test against your local production build.',
    id: 'default' satisfies Audit['scanType'],
    pros: [
      'Accurate results',
      'No rate-limiting',
      'Best for production testing',
    ],
    cons: [
      'Slower than development scan',
      'Requires local build',
    ],
  },
])
</script>

<template>
  <UCard>
    <template #header>
      <div>Configure Your Audit</div>
    </template>
    <div class="p-4">
      <UForm :state="state" class="space-y-6" @submit="newCrawl">
        <UFormField label="Scan Type" name="name" class="max-w-4xl">
          <URadioGroup v-model="state.scanType" variant="table" value-key="id" :items="items" orientation="horizontal" class="mt-2">
            <template #description="{ item }">
              <div class="text-xs w-[300px] mt-2 mb-1.5">
                {{ item.description }}
              </div>
              <ul class="space-y-0.5">
                <li v-for="(pro, index) in item.pros" :key="index" class="text-xs flex items-center">
                  <UIcon name="carbon:checkmark" class="inline-block mr-1 text-green-400 " />
                  <span>{{ pro }}</span>
                </li>
                <li v-for="(con, index) in item.cons" :key="index" class="text-xs text-neutral-500 flex items-center">
                  <UIcon name="carbon:error" class="inline-block mr-1  " />
                  <span class="">{{ con }}</span>
                </li>
              </ul>
            </template>
          </URadioGroup>
        </UFormField>
        <UFormField v-if="state.origin" label="Origin" name="origin">
          <UInput v-model="state.origin" type="text" disabled placeholder="Enter a name for the scan" size="lg" class="mt-2 w-xl" />
        </UFormField>
        <UFormField label="Audit Name" name="name">
          <UInput v-model="state.name" type="text" placeholder="Enter a name for the scan" size="lg" class="mt-2 w-xl" />
          <p class="mt-1 text-neutral-400 text-xs">
            Your audit will be saved locally under this name allowing you to view results in the future.
          </p>
        </UFormField>
        <!-- Coming soon checkbox for enable javascript crawling -->
        <UCheckbox v-model="state.enableJavaScript" disabled name="enableJavaScript" label="Enable JavaScript Crawling" class="mt-2">
          <template #label>
            <span class="text-sm mr-2">Enable JavaScript Crawling</span>
            <UBadge variant="soft" size="sm" color="warning">
              Coming Soon
            </UBadge>
          </template>
          <template #description>
            <div class="text-xs text-neutral-500">
              Enable this option to allow crawling of pages that require JavaScript to render content.
            </div>
          </template>
        </UCheckbox>
        <UButton type="submit">
          Start Audit
        </UButton>
        <p class="text-sm text-neutral-400 max-w-xl">
          This will take several minutes and will require you keep your Nuxt dev instance running.
        </p>
      </UForm>
    </div>
  </UCard>
</template>
