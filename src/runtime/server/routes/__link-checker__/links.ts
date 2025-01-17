import { defineCachedEventHandler, useRuntimeConfig } from '#imports'
// @ts-expect-error untyped
import contentLinkProvider from '#link-checker/content-provider'

// @ts-expect-error untyped
import pagePaths from '#nuxt-link-checker-sitemap/pages.mjs'
import { createDefu } from 'defu'

const merger = createDefu((obj, key, value) => {
  // merge arrays using a set
  if (Array.isArray(obj[key]) && Array.isArray(value))
    // @ts-expect-error untyped
    obj[key] = Array.from(new Set([...obj[key], ...value]))
  return obj[key]
})

function mergeOnKey<T, K extends keyof T>(arr: T[], key: K) {
  const res: Record<string, T> = {}
  arr.forEach((item) => {
    const k = item[key] as string
    // @ts-expect-error untyped
    res[k] = merger(item, res[k] || {})
  })
  return Object.values(res)
}

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

  return mergeOnKey(linkDb, 'link')
}, {
  maxAge: 10, // avoid thrashing
})
