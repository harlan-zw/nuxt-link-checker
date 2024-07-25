import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
    '@nuxt/content',
  ],

  // @ts-expect-error untyped
  site: {
    url: 'https://nuxt-link-checker.com',
  },

  content: {
    documentDriven: true,
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',
})
