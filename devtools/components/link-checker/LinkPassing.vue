<script setup lang="ts">
defineProps<{
  item: any
}>()
</script>

<template>
  <div class="text-sm flex w-full gap-5">
    <div class="min-w-0 flex-1">
      <a :href="item.link" target="_blank" class="font-mono mb-3 text-[var(--color-primary)] hover:underline">
        {{ item.link }}
      </a>
    </div>
    <div class="flex gap-2 items-center">
      <div style="flex-basis: 4rem;">
        <span class="text-green-800 text-xs flex items-center font-medium dark:text-green-300">
          <UIcon name="carbon:checkmark-outline" class="mr-1 text-xs" />
          Pass
        </span>
      </div>
    </div>
  </div>
</template>
