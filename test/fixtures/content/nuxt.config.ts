import { defineNuxtConfig } from 'nuxt/config'
import NuxtLinkChecker from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtLinkChecker,
    '@nuxt/content',
  ],

  site: {
    url: 'https://nuxt-link-checker.com',
  },

  content: {
    documentDriven: true,
  },
  devtools: {
    enabled: true,
  },
})
