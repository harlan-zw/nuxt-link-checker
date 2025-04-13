<script lang="ts" setup>
import {useRpcConnection} from "~/composables/rpc";
import {queryCollection} from "#imports";

const scanId = useRoute().params.scanId
const breadcrumbItems = [
  {
    to: '/',
    label: 'Scans',
  },
  {
    label: `Scan #${scanId}`,
  }
]

const res = ref(null)
const ctx = useRpcConnection()
onMounted(async () => {
  res.value = (await ctx).scans.value.results
  console.log('scans.value', res.value)
})

const { data: ruleContent } = await useAsyncData(() => {
  return queryCollection('rules').all()
})

function getRuleCategory(ruleId: string) {
  // get the category of the rule from the metadata
  const rule = res.value.metadata.rulesMeta[ruleId]
  if (rule)
    return rule.docs.category
  return 'Unknown'
}

const pagesTable = computed(() => {
  return res.value?.map((res) => {
    return {
      path: res.path,
      issues: res.lintResult.results[0].messages.length,
    }
  }) || []
})
</script>
<template>
<div>
  <div class="flex items-center gap-3.5 mb-4">
  <UBreadcrumb
    :items="breadcrumbItems"
    />
    <UBadge color="info" variant="subtle" size="sm">
      Completed
    </UBadge>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12">
    <!-- Sidebar -->
    <aside class="lg:sticky top-14 self-start">
      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-background-subtle)] px-2.5 py-4 shadow-sm">
        <UNavigationMenu
          orientation="vertical"
          :items="[
                { name: 'overview', label: 'By Page', icon: 'carbon:warning-diamond' },
                { name: 'docs', label: 'By Rule', icon: 'carbon:book' },
              ]" class="w-full py-3"
        />
      </div>
    </aside>

    <!-- Main Content -->
    <div class="space-y-5">
      <div>table</div>
      <UTable
      :data="pagesTable"
      :columns="[{ header: 'Page', accessorKey: 'path'}, { header: 'Issues', accessorKey: 'issues', }]"
      />
      <UPageAccordion
        v-if="res?.results?.[0]?.messages"
        :items="res.results[0].messages"
        default-value="1"
        :ui="{ wrapper: 'border-t border-[var(--ui-border)] pt-3' }"
      >
        <template #body="{ item: r, open }">
        <div class="flex justify-between items-start mb-3">
          <div class="font-mono text-sm text-[var(--ui-text-muted)] bg-[var(--ui-background-muted)] px-2 py-1 rounded">
            <span class="text-[var(--ui-text-dimmed)]">{{ r.ruleId.split('/')[0] }}</span>/{{ r.ruleId.split('/')[1] }}
          </div>
        </div>
        <div v-if="open" class="prose prose-sm mt-2 text-[var(--ui-text)]">
          <SourceCodePartial :source="res.results[0].source" :message="r" />
          <ContentRenderer
            v-if="ruleContent?.find(c => c.title === r.ruleId.split('/')[1])"
            :value="ruleContent.find(c => c.title === r.ruleId.split('/')[1])"
            :components="{ h1: 'ProseHidden' }"
          />
        </div>
        </template>
        <template #default="{ item: r }">
        <div class="cursor-pointer">
          <div class="text-base flex items-center gap-2">
            <UBadge v-if="r.severity === 2" size="sm" color="error" variant="soft">
              error
            </UBadge>
            <UBadge size="sm" color="info" variant="subtle">
              {{ getRuleCategory(r.ruleId) }}
            </UBadge>
            {{ r.message }}
          </div>
        </div>
        </template>
      </UPageAccordion>
    </div>
  </div>
</div>
</template>
