<script lang="ts" setup>
import { useRpcConnection } from '~/composables/rpc'
import { useRuleMetadata } from '~/composables/useRuleMetadata'

definePageMeta({
  layout: 'scan',
})

const auditId = useRoute().params.auditId

const ctx = useRpcConnection()
const res = shallowRef(await ctx.getAuditResults(auditId))

const rows = computed(() => {
  const groupedBySeverity = {
    0: [],
    1: [],
    2: [],
  }

  for (const v of res.value) {
    if (v.error) {
      continue
    }

    const messages = v.lintResult?.messages || []
    for (const m in messages) {
      const message = messages[m]
      const { eslintRuleId, severity } = message

      if (!groupedBySeverity[severity]) {
        groupedBySeverity[severity] = {}
      }

      if (!groupedBySeverity[severity][eslintRuleId]) {
        groupedBySeverity[severity][eslintRuleId] = []
      }

      groupedBySeverity[severity][eslintRuleId].push(message)
    }
  }

  return Object.entries(groupedBySeverity).map(([severity, ruleGroups]) => ({
    severity: Number(severity),
    rules: Object.entries(ruleGroups)
      .map(([eslintRuleId, messages]) => ({
        eslintRuleId,
        messages,
        count: messages.length,
      }))
      .sort((a, b) => b.count - a.count), // Sort by occurrence count (descending)
  })).sort((a, b) => b.severity - a.severity) // Sort by severity (descending)
})

function getRuleCategory(eslintRuleId: string) {
  // get the category of the rule from the metadata
  const rule = useRuleMetadata()[eslintRuleId.split('/')[1]]
  if (rule)
    return rule.meta.docs.category
  if (eslintRuleId.includes('a16y')) {
    return 'A16y'
  }
  return 'Unknown'
}

function rowSeverity(severity: number) {
  switch (severity) {
    case 0:
      return 'Notice'
    case 1:
      return 'Warning'
    case 2:
      return 'Error'
  }
}

function rowColor(severity: number) {
  switch (severity) {
    case 0:
      return 'text-blue-400'
    case 1:
      return 'text-yellow-400'
    case 2:
      return 'text-red-400'
  }
}
</script>

<template>
  <UCard v-for="row in rows" :key="row.severity" class="rounded-[calc(var(--ui-radius)*2)] bg-(--ui-bg) ring ring-(--ui-border) divide-y divide-(--ui-border) mb-4">
    <template #header>
      <div class="text-lg font-bold pb-2 border-b-2" :class="rowColor(row.severity)">
        {{ rowSeverity(row.severity) }}{{ row.rules.length > 1 ? 's' : '' }} <span class="text-[var(--ui-text-dimmed)] font-normal text-base">({{ row.rules.length }})</span>
      </div>
    </template>
    <div class="space-y-3 divide-y divide-[var(--ui-border)]">
      <div
        v-for="rule in row.rules"
        :key="rule.eslintRuleId"
        class="py-2 px-5"
      >
        <div class="font-mono flex items-center gap-2">
          <UBadge size="sm" color="info" variant="subtle">
            {{ getRuleCategory(rule.eslintRuleId) }}
          </UBadge>
          {{ rule.count }} page{{ rule.count > 1 ? 's' : '' }} <NuxtLink :to="`/audits/${auditId}/issues/${encodeURIComponent(rule.eslintRuleId)}`" class="text-blue-400">
            {{ rule.eslintRuleId.split('/')[1] }}
          </NuxtLink>
        </div>
        <div class="text-[var(--ui-text-muted)] text-sm">
          {{ rule.messages[0].message }}
        </div>
      </div>
    </div>
  </UCard>
</template>
