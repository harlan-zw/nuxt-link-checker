import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

// @ts-expect-error untyped
import pagePaths from '#nuxt-link-checker-sitemap/pages.mjs'

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker']
  const linkDb = [
    ...pagePaths,
  ]
  if (runtimeConfig.hasSitemapModule) {
    // fetch URLs from sitemap data
    const sitemapDebug = await $fetch('/api/__sitemap__/debug')
    // iterate sources
    const entries = sitemapDebug.sources.map(source => source.urls).flat()
    linkDb.push(...entries.map(s => s.loc))
  }
  return [...new Set([...linkDb])]
})
