<script setup lang="ts">
import FixActionDialog from '../../components/link-checker/FixActionDialog.vue'
import {
  errorCount,
  failingNodes,
  linkFilter,
  nodes,
  queueLength,
  visibleLinkCount,
  warningCount,
} from '../../lib/link-checker/state'
</script>

<template>
  <div class="space-y-2">
    <DevtoolsToolbar>
      <DevtoolsMetric
        v-if="queueLength"
        icon="carbon:progress-bar-round"
        :value="`${visibleLinkCount ? Math.round((Math.abs(queueLength - visibleLinkCount) / visibleLinkCount) * 100) : 0}%`"
      />
      <DevtoolsMetric
        v-if="errorCount"
        icon="carbon:error"
        :value="errorCount"
        label="Errors"
        variant="danger"
      />
      <DevtoolsMetric
        v-if="warningCount"
        icon="carbon:warning"
        :value="warningCount"
        label="Warnings"
        variant="warning"
      />
      <DevtoolsMetric
        v-if="!warningCount && !errorCount"
        icon="carbon:checkmark-outline"
        value="All links passing"
        variant="success"
      />
    </DevtoolsToolbar>

    <p v-if="linkFilter" class="text-sm flex items-center gap-1 mb-4">
      <UIcon name="carbon:filter" />
      Filtering Results.
      <button type="button" class="underline" @click="linkFilter = false">
        Show All
      </button>
    </p>

    <div v-if="!linkFilter">
      <template v-if="failingNodes.length">
        <LinkInspection
          v-for="(item, index) of failingNodes"
          :key="index"
          :item="item"
          class="odd:bg-[var(--color-bg-elevated)] p-2"
        />
      </template>
      <DevtoolsEmptyState
        v-else-if="!queueLength"
        icon="carbon:checkmark-outline"
        title="No issues found"
        description="All visible links are passing validation."
      />
    </div>
    <div v-else>
      <LinkInspection v-for="(item, index) of nodes" :key="index" :item="item" />
    </div>
    <FixActionDialog />
  </div>
</template>
