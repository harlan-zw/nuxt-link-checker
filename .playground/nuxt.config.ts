import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    resolve(__dirname, '../src/module'),
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
