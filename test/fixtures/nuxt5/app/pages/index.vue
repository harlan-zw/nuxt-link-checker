<script setup lang="ts">
import { inspect } from '#link-checker/app'

const inspection = inspect({ link: 'javascript:alert(1)' })
</script>

<template>
  <div>
    <a href="/Target">Uppercase target</a>
    <a href="/missing">Missing page</a>
    <p id="alias-app">{{ inspection.error?.[0]?.name }}</p>
  </div>
</template>
