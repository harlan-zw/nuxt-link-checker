import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },

  routeRules: {
    '/live-only': { prerender: false },
  },

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
  },

  linkChecker: {
    report: {
      json: true,
      publish: true,
    },
  },

  compatibilityDate: '2025-01-20',
})
