import { useRuntimeConfig } from '#imports'
// @ts-expect-error untyped
import contentLinkProvider from '#link-checker/content-provider'
// @ts-expect-error untyped
import pagePaths from '#nuxt-link-checker-sitemap/pages.mjs'
import { defineCachedEventHandler } from 'nitropack/runtime'

export default defineCachedEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker'] || {} as any
  const linkDb = [
    ...pagePaths,
  ]
  if (runtimeConfig.hasSitemapModule) {
    // fetch URLs from sitemap data
    const sitemapDebug = (await $fetch('/__sitemap__/debug.json')) as { globalSources: { urls: { loc: string }[] }[] }
    // iterate sources
    const entries = sitemapDebug.globalSources.map(source => source.urls).flat()
    linkDb.push(...entries.map(s => ({ path: s.loc, title: '' })))
  }
  if (contentLinkProvider) {
    const links = await contentLinkProvider(e)
    linkDb.push(...links)
  }

  return linkDb
}, {
  maxAge: 10, // avoid thrashing
})
