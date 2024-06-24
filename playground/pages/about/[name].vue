<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div>Hello {{ route.params.name }}!</div>
</template>
