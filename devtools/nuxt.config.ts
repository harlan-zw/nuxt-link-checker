import { resolve } from 'pathe'

export default defineNuxtConfig({
  extends: ['nuxtseo-layer-devtools'],

  linkChecker: false,

  nitro: {
    prerender: {
      routes: ['/'],
    },
    output: {
      publicDir: resolve(__dirname, '../dist/devtools'),
    },
  },

  app: {
    baseURL: '/__nuxt-link-checker',
  },
})
