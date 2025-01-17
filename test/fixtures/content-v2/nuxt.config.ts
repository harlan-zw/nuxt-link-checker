import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
    '@nuxt/content',
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  alias: {
    '@nuxt/content': '@nuxt/content-v2',
  },

  content: {
    documentDriven: true,
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',
})
