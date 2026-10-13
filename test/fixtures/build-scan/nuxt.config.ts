import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  routeRules: {
    // public/demo/index.html is a static file: the Nitro crawler would render /demo/ as a Nuxt page and 404
    '/demo/**': { prerender: false },
  },

  linkChecker: {
    report: {
      json: true,
      markdown: true,
    },
  },

  compatibilityDate: '2025-01-20',
})
