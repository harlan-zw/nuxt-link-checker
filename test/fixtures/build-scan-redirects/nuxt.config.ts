import { defineNuxtModule } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module',
    defineNuxtModule({
      setup(_, nuxt) {
        nuxt.hook('modules:done', () => {
          nuxt.options.linkChecker?.excludeLinks?.push('/old-late-excluded')
        })
      },
    }),
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },

  routeRules: {
    // the crawler follows the links to these, so Nitro prerenders each redirect
    '/old-permanent': { redirect: { to: '/about', statusCode: 301 } },
    '/old-permanent-strict': { redirect: { to: '/about', statusCode: 308 } },
    '/old-removed': { redirect: '/removed' },
    '/old-static-excluded': { redirect: '/about' },
    '/old-late-excluded': { redirect: '/about' },
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
    excludeLinks: ['/old-static-excluded'],
    report: {
      json: true,
    },
  },

  compatibilityDate: '2025-01-20',
})
