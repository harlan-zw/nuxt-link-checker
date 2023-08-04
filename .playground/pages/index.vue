<template>
<div>
  <div class="mb-5">
    <h2 class="text-lg font-bold mb-4">Valid</h2>
    <LinkDebug to="/#anchor">valid anchor</LinkDebug>
    <LinkDebug to="/valid">valid link</LinkDebug>
    <LinkDebug to="/ignored">valid because ignored</LinkDebug>
    <LinkDebug to="mailto:harlan@harlanzw.com">mail to link</LinkDebug>
  </div>
  <div class="mb-5">
    <h2 class="text-lg font-bold mb-4">Errors</h2>
    <LinkDebug to="this is a very bad link">very bad link</LinkDebug>
    <LinkDebug to="/abot">page typo with magic fix</LinkDebug>
    <LinkDebug to="/#broken-anchor">broken anchor</LinkDebug>
    <LinkDebug to="/404link">404 links</LinkDebug>
    <LinkDebug to="https://example.com/absolute">absolute 404 link</LinkDebug>
    <LinkDebug to="javascript:history.back()">javacript link</LinkDebug>
    <LinkDebug to="/error">to an error page</LinkDebug>
    <LinkDebug to="/completely-broken/">error and warning</LinkDebug>
    <LinkDebug to="/abt">page typo with magic fix - AGAIN 123</LinkDebug>
  </div>
  <div>
    <h2 class="text-lg font-bold mb-4">Warnings test</h2>
    <LinkDebug to="/trailingslash/">trailing slash</LinkDebug>
    <LinkDebug to="/redirect">redirect link</LinkDebug>
    <LinkDebug to="https://nuxt-link-checker.com/about">Absolute internal link</LinkDebug>
  </div>
  <div id="anchor" />
</div>
</template>
<script setup lang="ts">
</script>
