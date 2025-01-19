import { useNitroOrigin, useRuntimeConfig, useSiteConfig } from '#imports'
import { createDefu } from 'defu'
import Fuse from 'fuse.js'
import { defineEventHandler, readBody } from 'h3'
import { fixSlashes } from 'nuxt-site-config/urls'
import { resolve } from 'pathe'
import { generateFileLinkDiff, generateFileLinkPreviews, getLinkResponse, inspect, isNonFetchableLink, lruFsCache } from '../../../shared'

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

function isInternalRoute(path: string) {
  const lastSegment = path.split('/').pop() || path
  return lastSegment.includes('.') || path.startsWith('/__') || path.startsWith('@')
}

// verify a link
export default defineEventHandler(async (e) => {
  const { tasks, ids, path } = await readBody<{ path: string, tasks: { link: string, textContent: string, paths: string[] }[], ids: string[] }>(e)
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker'] || {} as any
  const partialCtx = {
    ids,
    fromPath: fixSlashes(false, path),
    siteConfig: useSiteConfig(e),
  } as const
  // allow editing files to trigger a cache clear
  lruFsCache.clear()
  const links = await $fetch('/__link-checker__/links')
  const pageSearch = new Fuse<{ link: string, title: string }>(mergeOnKey(links, 'link'), {
    keys: ['link', 'title'],
    threshold: 0.5,
  })
  return Promise.all(
    tasks.map(async ({ link, paths, textContent }) => {
      // do a quick check for links that are always safe
      if (isNonFetchableLink(link) || isInternalRoute(link))
        return { passes: true }

      const response = await getLinkResponse({
        link,
        timeout: runtimeConfig.fetchTimeout,
        fetchRemoteUrls: runtimeConfig.fetchRemoteUrls,
        baseURL: useNitroOrigin(e),
        isInStorage() {
          return false
        },
      })
      const result = inspect({
        ...partialCtx,
        link,
        textContent,
        pageSearch,
        response,
        skipInspections: runtimeConfig.skipInspections,
      })
      const filePaths = [
        resolve(runtimeConfig.rootDir, links.find(l => l.file && l.link === path)?.file),
        ...paths.map((p) => {
          const [filepath] = p.split(':')
          return filepath
        }),
      ].filter(Boolean)
      if (!result.passes) {
        result.sources = (await Promise.all(filePaths.map(async filepath => await generateFileLinkPreviews(filepath, link))))
          .filter(s => s.previews.length)
        result.diff = (await Promise.all((result.sources || []).map(async ({ filepath }) => generateFileLinkDiff(filepath, link, result.fix!))))
      }
      return result
    }),
  )
})
