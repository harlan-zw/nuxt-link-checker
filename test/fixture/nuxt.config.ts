import { defineNuxtConfig } from 'nuxt/config'
import NuxtLinkChecker from '../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtLinkChecker,
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  devtools: {
    enabled: true,
  },
})
