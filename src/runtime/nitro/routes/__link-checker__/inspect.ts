import { defineEventHandler, getHeader, readBody } from 'h3'
import { fixSlashes } from 'site-config-stack/urls'
import { parseURL } from 'ufo'
import { resolve } from 'pathe'
import { inspect } from '../../../pure/inspect'
import type { RuleTestContext } from '../../../types'
import { generateFileLinkDiff, generateFileLinkPreviews, lruFsCache } from '../../../pure/diff'
import { getLinkResponse } from '../../../pure/crawl'
import { isNonFetchableLink } from '../../../pure/inspections/util'
import { isInternalRoute } from '../../util'
import { useNitroApp, useNitroOrigin, useRuntimeConfig, useSiteConfig } from '#imports'

// this is stubbed with content-mock.ts
// @ts-expect-error optional module
import { serverQueryContent } from '#content/server'

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
  const pageSearch = useNitroApp()._linkCheckerPageSearch
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
