<template>
<div>
  <h1>Hello world</h1>
  <p>Welcome to my website</p>
  <nuxt-link to="/#anchor">anchor</nuxt-link>
  <NuxtLink to="/valid">valid link</NuxtLink>
  <NuxtLink to="/trailingslash/">trailing slash</NuxtLink>
  <NuxtLink to="/404link">404 link</NuxtLink>
  <NuxtLink to="/redirect">redirect link</NuxtLink>
  <NuxtLink to="https://example.com/absolute">absolute link</NuxtLink>
  <a href="javascript:history.back()">previous page</a>
  <a href="https://example.com/valid/">absolute URL</a>
  <a href="https://external-site.com/valid/">external link</a>
  <a href="#anchor">anchor link</a>
  <div id="anchor">
    this is anchored
  </div>
</div>
</template>
