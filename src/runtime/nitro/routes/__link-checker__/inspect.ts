import { useNitroOrigin, useRuntimeConfig, useSiteConfig } from '#imports'
import Fuse from 'fuse.js'
import { defineEventHandler, getHeader, readBody } from 'h3'
import { resolve } from 'pathe'
import { fixSlashes } from 'site-config-stack/urls'
import { parseURL } from 'ufo'
// @ts-expect-error untyped
import { generateFileLinkDiff, generateFileLinkPreviews, getLinkResponse, inspect, isNonFetchableLink, lruFsCache } from '#link-checker/pure'

// this is stubbed with content-mock.ts
// @ts-expect-error optional module
import { serverQueryContent } from '#content/server'

function isInternalRoute(path: string) {
  const lastSegment = path.split('/').pop() || path
  return lastSegment.includes('.') || path.startsWith('/__') || path.startsWith('@')
}

// verify a link
export default defineEventHandler(async (e) => {
  const { tasks, ids } = await readBody<{ tasks: { link: string, textContent: string, paths: string[] }[], ids: string[] }>(e)
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker'] || {} as any
  const partialCtx = {
    ids,
    fromPath: fixSlashes(false, parseURL(getHeader(e, 'referer') || '/').pathname),
    siteConfig: useSiteConfig(e),
  } as const
  const extraPaths: string[] = []
  if (serverQueryContent) {
    // let's fetch from the content document
    const contentDocument = await serverQueryContent(e, partialCtx.fromPath).findOne()
    if (contentDocument)
      extraPaths.push(resolve(runtimeConfig.rootDir, 'content', contentDocument._file))
  }
  // allow editing files to trigger a cache clear
  lruFsCache.clear()
  const links = await $fetch('/__link-checker__/links')
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
        pageSearch: new Fuse(links, {
          keys: ['path', 'title'],
          threshold: 0.5,
        }),
        response,
        skipInspections: runtimeConfig.skipInspections,
      })
      const filePaths = [
        ...extraPaths,
        ...paths.map((p) => {
          const [filepath] = p.split(':')
          return filepath
        }),
      ]
      if (!result.passes) {
        result.sources = (await Promise.all(filePaths.map(async filepath => await generateFileLinkPreviews(filepath, link))))
          .filter(s => s.previews.length)
        result.diff = (await Promise.all((result.sources || []).map(async ({ filepath }) => generateFileLinkDiff(filepath, link, result.fix!))))
      }
      return result
    }),
  )
})
