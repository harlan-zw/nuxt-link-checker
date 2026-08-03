import NuxtLinkChecker from 'nuxt-link-checker'

export default defineNuxtConfig({
  modules: [NuxtLinkChecker],
  linkChecker: {
    runOnBuild: false,
  },
  runtimeConfig: {
    linkCheckerCompatMarker: 'nuxt-5',
  },
  vite: {
    resolve: {
      dedupe: ['nuxt', 'vue', 'vue-router'],
    },
  },
  compatibilityDate: '2026-06-10',
})
