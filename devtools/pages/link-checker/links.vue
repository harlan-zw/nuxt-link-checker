<script setup lang="ts">
import { externalLinks, internalLinks } from '../../lib/link-checker/state'
</script>

<template>
  <div class="space-y-4">
    <DevtoolsSection icon="carbon:chart-network" text="Internal Links">
      <LinkPassing v-for="(item, index) of internalLinks" :key="index" :item="item" />
      <DevtoolsEmptyState v-if="!internalLinks.length" icon="carbon:link" title="No internal links" />
    </DevtoolsSection>
    <DevtoolsSection icon="carbon:launch" text="External Links">
      <LinkPassing v-for="(item, index) of externalLinks" :key="index" :item="item" />
      <DevtoolsEmptyState v-if="!externalLinks.length" icon="carbon:link" title="No external links" />
    </DevtoolsSection>
  </div>
</template>
