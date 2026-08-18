import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
    '@harlan-zw/comark-content',
  ],

  // @ts-expect-error untyped
  site: {
    url: 'https://nuxt-link-checker.com',
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',
})
