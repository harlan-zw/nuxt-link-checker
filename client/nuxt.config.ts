import { resolve } from 'pathe'

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/devtools-ui-kit',
  ],

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__nuxt-link-checker',
  },

  compatibilityDate: '2025-01-17',
})
