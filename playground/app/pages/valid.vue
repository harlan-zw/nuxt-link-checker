<script setup lang="ts">
definePageMeta({
  title: 'VALID',
  name: 'yahoo',
})
</script>

<template>
  <div>
    <div>valid page</div>
    <NuxtLink to="/">
      home
    </NuxtLink>
    <NuxtLink to="https://example.com/test">
      external link
    </NuxtLink>
  </div>
</template>
