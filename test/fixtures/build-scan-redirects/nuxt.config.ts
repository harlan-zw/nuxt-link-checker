import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },

  routeRules: {
    // the crawler follows the links to these, so Nitro prerenders each redirect
    '/old-permanent': { redirect: { to: '/about', statusCode: 301 } },
    '/old-permanent-strict': { redirect: { to: '/about', statusCode: 308 } },
    // a server middleware on the deployed site redirects this path, so the build fetches it from the site URL
    '/moved': { prerender: false },
  },

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
  },

  linkChecker: {
    report: {
      json: true,
    },
  },

  compatibilityDate: '2025-01-20',
})
