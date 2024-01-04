<script setup lang="ts">
defineProps<{
  item: any
}>()
</script>

<template>
  <div text-sm class="flex w-full gap-5">
    <div style="min-width: 600px;">
      <NLink external target="_blank" :to="item.link" font-mono mb3>
        {{ item.link }}
      </NLink>
    </div>
    <div class="flex gap-2 items-center w-full">
      <div style="flex-basis: 4rem;">
        <span class="text-green-800 text-xs flex items-center font-medium dark:text-green-300">
          <span i-carbon-checkmark-outline mr-1 text-xs />
          Pass
        </span>
      </div>
    </div>
  </div>
</template>
