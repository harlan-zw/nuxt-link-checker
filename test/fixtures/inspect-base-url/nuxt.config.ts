export default defineNuxtConfig({
  app: { baseURL: '/site/' },
  modules: ['nuxt-link-checker'],
  linkChecker: { fetchRemoteUrls: false },
  devtools: { enabled: true },
  compatibilityDate: '2026-06-10',
})
