import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  linkChecker: {
    report: {
      json: true,
      markdown: true,
    },
  },

  compatibilityDate: '2025-01-20',
})
