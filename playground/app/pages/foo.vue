<script setup lang="ts">
useHead({
  title: 'foo',
})
</script>

<template>
  <div>
    foo
    <NuxtLink to="/about">
      About Us
    </NuxtLink>
  </div>
</template>
