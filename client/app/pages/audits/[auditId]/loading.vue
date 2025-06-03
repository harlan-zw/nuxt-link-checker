<script lang="ts" setup>
import type { StepperItem } from '@nuxt/ui'
import { useRpcConnection } from '~/composables/rpc'
import { useActiveAudit, useAuditStore } from '~/composables/state'

const rpc = useRpcConnection()
const audit = useActiveAudit()
const data = useAuditStore()

const auditId = useRoute().params.auditId as string
const ctx = useRpcConnection()
const results = await ctx.getAuditResults(auditId)

if (!audit.value && Array.isArray(data.value)) {
  // redirect to create audit
  navigateTo(`/create`)
}

const step = ref(0)

const stepperItems = computed<StepperItem[]>(() => [
  ...(audit.value?.scanType === 'default'
    ? [
        {
          title: 'Build',
          description: 'Your Nuxt App will be built with node_server preset.',
          icon: 'carbon:tools',
          task: 'build',
        } satisfies StepperItem,
        {
          title: 'Serve',
          description: 'Your Nuxt App will be served on a random port.',
          icon: 'carbon:connection-signal',
          task: 'serve',
        } satisfies StepperItem,
      ]
    : []),
  {
    title: 'Crawl',
    description: 'Recursively crawls your app to discover all pages.',
    icon: 'carbon:bot',
    task: 'crawl',
  } satisfies StepperItem,
  {
    title: 'Analyze',
    description: 'Run the audit against the crawled data.',
    icon: 'carbon:checkmark-outline-warning',
    task: 'analyze',
  } satisfies StepperItem,
].map((item, i) => {
  return {
    ...item,
    id: i,
    ui: {
      trigger: audit.value?.tasks[item.task]?.status === 'error' ? '!ring-error' : '',
    },
  }
}))

watch(audit, () => {
  console.log(audit)
  const stepItemTask = stepperItems.value[step.value]?.task
  if (stepItemTask === 'build' && audit.value?.tasks.build.status === 'done') {
    step.value++
  }
  if (stepItemTask === 'serve' && audit.value?.tasks.serve.status === 'done') {
    step.value++
  }
  if (stepItemTask === 'crawl' && audit.value?.tasks.crawl.status === 'done') {
    step.value++
  }
  if (stepItemTask === 'analyze' && audit.value?.tasks.analyze.status === 'done') {
    navigateTo(`/audits/${audit.value.id}`)
  }
}, {
  immediate: true,
})
</script>

<template>
  <div v-if="audit">
    <UCard>
      <template #header>
        <div>
          Audit <span class="text-blue-300">{{
            audit?.name
          }}</span> <small class="text-gray-500">#{{ audit?.id }}</small>
        </div>
      </template>
      <div class="p-4">
        <p class="text-sm text-neutral-300 mb-4">
          Running Nuxt Analyze, please hold tight as this can take several minutes depending on your application size.
        </p>
        <UStepper :model-value="step" :items="stepperItems" class="w-full" color="success">
          <template #indicator="{ item }">
            <UIcon v-if="step > item.id" name="carbon:checkmark-outline" class="text-green-400 size-6" />
            <UIcon v-else-if="item.id === step && audit.tasks[item.task].status === 'error'" name="carbon:error" class="text-red-400" />
            <UIcon v-else-if="item.id === step" name="carbon:in-progress" class="text-yellow-400 size-6" />
            <UIcon v-else :name="item.icon" class="text-blue-300 h-8 w-8" />
          </template>
          <template #description="{ item }">
            <div v-if="step > item.id" class="text-xs text-neutral-500">
              Done in {{ Math.round(audit.tasks[item.task].timeTaken / 1000) }}s
            </div>
            <div v-else class="text-xs text-neutral-500">
              {{ item.description }}
            </div>
          </template>
          <template #content="{ item }">
            <div>
              <div>
                <div v-if="audit.tasks[item.task].status === 'error'">
                  <p class="text-sm font-semibold mt-1 text-neutral-300 mb-3 flex items-center gap-1">
                    <UIcon name="carbon:error" class="text-red-400" />
                    Error <span class="text-sm font-normal text-neutral-400">{{ audit.tasks[item.task].error }}</span>
                  </p>
                  <UButton icon="carbon:reset" variant="soft" color="neutral" @click="() => rpc.retryTask(audit.id, item.task)">
                    Retry
                  </UButton>
                </div>
                <div v-else-if="audit.tasks[item.task].status === 'done'">
                  <p class="text-sm font-semibold mt-1 text-neutral-300 mb-3 flex items-center gap-1">
                    <UIcon name="carbon:checkmark-outline" class="text-green-400 size-6" />
                    Done
                  </p>
                  <UButton icon="carbon:reset" variant="soft" color="neutral" @click="() => rpc.retryTask(audit.id, item.task)">
                    Restart
                  </UButton>
                </div>
                <div v-else-if="audit.tasks[item.task].status === 'pending'">
                  <p class="text-sm font-semibold mt-1 text-neutral-300 mb-3 flex items-center gap-1">
                    <UIcon name="carbon:warning" class="text-neutral-400" />
                    Pending...
                  </p>
                </div>
                <div v-else>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1">
                      <UIcon name="carbon:in-progress" class="text-blue-400" />
                      <div>In Progress...</div>
                    </div>
                    <UButton icon="carbon:stop" variant="soft" color="neutral" @click="() => rpc.terminateTask(audit.id, item.task)">
                      Terminate
                    </UButton>
                  </div>
                </div>
                <div class="max-w-full mt-5">
                  <AnsiRenderer v-if="audit.tasks[item.task].terminal?.length" :ansi="audit.tasks[item.task].terminal" />
                </div>
              </div>
            </div>
          </template>
        </UStepper>
      </div>
    </UCard>
  </div>
</template>
