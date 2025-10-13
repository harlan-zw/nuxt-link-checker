import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  linkChecker: {
    debug: true,
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2025-01-20',
})
