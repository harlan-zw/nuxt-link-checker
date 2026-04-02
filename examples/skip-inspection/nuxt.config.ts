export default defineNuxtConfig({
  modules: ['nuxt-link-checker'],

  site: {
    url: 'https://example.com',
  },

  linkChecker: {
    skipInspections: ['missing-hash', 'no-error-response'],
  },

  compatibilityDate: '2025-01-01',
})
