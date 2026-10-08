import type { Nuxt } from 'nuxt/schema'
import { getNitroVersion } from '@nuxt/kit'
import NuxtLinkChecker from 'nuxt-link-checker'
import NuxtSiteConfig from 'nuxt-site-config'
import NuxtSeoShared from 'nuxtseo-shared'

// Allow the pinned nightly only in this consumer fixture.
{
  const modules: Array<{ getMeta?: () => Promise<{ compatibility?: { nuxt?: string } }> }> = [NuxtLinkChecker, NuxtSiteConfig, NuxtSeoShared]
  for (const module of modules) {
    const meta = await module.getMeta?.()
    if (!meta)
      throw new Error('The packed module must expose compatibility metadata.')
    meta.compatibility ||= {}
    meta.compatibility.nuxt = '^4.6.0 || ^5.0.0 || 5.0.0-2610061032-c7ad8cd'
  }
}

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
  modules: [verifyBuilder, NuxtLinkChecker],
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
