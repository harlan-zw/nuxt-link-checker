import type { Nuxt } from 'nuxt/schema'
import { getNitroVersion } from '@nuxt/kit'
import NuxtLinkChecker from 'nuxt-link-checker'
import NuxtSiteConfig from 'nuxt-site-config'

function verifyBuilder(_options: unknown, nuxt: Nuxt) {
  nuxt.hook('modules:done', () => {
    const expected = 3
    const actual = getNitroVersion(nuxt)
    if (actual !== expected)
      throw new Error(`Expected Nitro ${expected}, resolved ${actual}`)
  })
}

export default defineNuxtConfig({
  future: { compatibilityVersion: 5 },
  modules: [NuxtSiteConfig, verifyBuilder, NuxtLinkChecker],
  site: { url: process.env.NUXT_SITE_URL || 'https://nuxt-link-checker.com' },
  linkChecker: {
    runOnBuild: true,
    report: { json: true, publish: true },
  },
  nitro: { prerender: { routes: ['/'], crawlLinks: false } },
  runtimeConfig: {
    linkCheckerCompatMarker: 'nuxt-5',
  },
  vite: {
    resolve: {
      dedupe: ['nuxt', 'vue', 'vue-router'],
    },
  },
  compatibilityDate: '2026-06-10',
})
