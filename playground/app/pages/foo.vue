<script setup lang="ts">
useSeoMeta({
  title: 'foo',
  description: 'foo description',
  ogImage: '/broken.png',
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
