import type { Nuxt } from 'nuxt/schema'
import { getNitroVersion } from '@nuxt/kit'
import NuxtLinkChecker from 'nuxt-link-checker'
import NuxtSiteConfig from 'nuxt-site-config'
import NuxtSeoShared from 'nuxtseo-shared'

// Allow the pinned nightly only in this consumer fixture.
if (process.env.NUXT_TEST_LANE === 'nuxt5') {
  const modules: Array<{ getMeta?: () => Promise<{ compatibility?: { nuxt?: string } }> }> = [NuxtLinkChecker, NuxtSiteConfig, NuxtSeoShared]
  for (const module of modules) {
    const meta = await module.getMeta?.()
    if (!meta)
      throw new Error('The packed module must expose compatibility metadata.')
    meta.compatibility ||= {}
    meta.compatibility.nuxt = '^4.6.0 || ^5.0.0 || 5.0.0-2610052343-36eafab'
  }
}

function verifyBuilder(_options: unknown, nuxt: Nuxt) {
  nuxt.hook('modules:done', () => {
    const expected = process.env.NUXT_TEST_LANE === 'nuxt5' ? 3 : 2
    const actual = getNitroVersion(nuxt)
    if (actual !== expected)
      throw new Error(`Expected Nitro ${expected}, resolved ${actual}`)
  })
}

export default defineNuxtConfig({
  future: { compatibilityVersion: process.env.NUXT_TEST_LANE === 'future5' ? 5 : 4 },
  modules: [verifyBuilder,NuxtLinkChecker],
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
