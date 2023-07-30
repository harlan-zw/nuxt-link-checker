<template>
<div>
  <div class="mb-5">
    <h2 class="text-lg font-bold mb-4">Valid</h2>
    <LinkDebug to="/#anchor">valid anchor</LinkDebug>
    <LinkDebug to="/valid">valid link</LinkDebug>
  </div>
  <div class="mb-5">
    <h2 class="text-lg font-bold mb-4">Errors</h2>
    <LinkDebug to="/abt">page typo with magic fix</LinkDebug>
    <LinkDebug to="/#broken-anchor">broken anchor dd</LinkDebug>
    <LinkDebug to="/404link">404 links</LinkDebug>
    <LinkDebug to="https://example.com/absolute">absolute 404 link</LinkDebug>
    <LinkDebug to="javascript:history.back()">javacript link</LinkDebug>
    <LinkDebug to="/error">to an error page</LinkDebug>
    <LinkDebug to="/completely-broken">error and warning</LinkDebug>
    <LinkDebug to="/about">page typo with magic fix - AGAIN 123</LinkDebug>
  </div>
  <div>
    <h2 class="text-lg font-bold mb-4">Warnings test</h2>
    <LinkDebug to="/trailingslash">trailing slash</LinkDebug>
    <LinkDebug to="/redirected">redirect link</LinkDebug>
    <LinkDebug to="/about">Absolute internal link</LinkDebug>
  </div>
  <div id="anchor" />
</div>
</template>
<script setup lang="ts">
</script>
