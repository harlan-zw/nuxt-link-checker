<script lang="ts" setup>
defineProps<{
  to: string
}>()
</script>

<template>
  <div class="flex items-center">
    <div class="w-50 border-gray-100 border-solid border-b-2" style="width: 250px;">
      <NuxtLink v-bind="$attrs" :to="to">
        <slot />
      </NuxtLink>
    </div>
    <div class="text-gray-500">
      {{ to }}
    </div>
  </div>
</template>
