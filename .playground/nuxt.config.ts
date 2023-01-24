import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  alias: {
    'nuxt-link-checker': resolve(__dirname, '../src/module'),
  },
  modules: [
    'nuxt-link-checker',
  ],
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/hidden-path-but-in-sitemap'
      ]
    }
  },
  linkChecker: {
    host: 'https://example.com',
    exclude: [
      '/excluded/**'
    ]
  },
  routeRules: {
    '/secret': { index: false },
    '/about': { sitemap: { changefreq: 'daily', priority: 0.3 } }
  }
})
