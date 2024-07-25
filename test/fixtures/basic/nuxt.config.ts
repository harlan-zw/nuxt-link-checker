import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
  ],

  // @ts-expect-error untyped
  site: {
    url: 'https://nuxt-link-checker.com',
  },

  devtools: {
    enabled: true,
  },
})
