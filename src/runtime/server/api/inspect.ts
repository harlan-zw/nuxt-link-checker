import { defineEventHandler, getHeader, getQuery, readBody } from 'h3'
import { fixSlashes } from 'site-config-stack'
import { parseURL } from 'ufo'
import { inspect } from '../../inspect'
import type { RuleTestContext } from '../../types'
import { generateFileLinkDiff, generateFileLinkPreviews } from '../util'
import { isInvalidLinkProtocol } from '../../inspections/util'
import { crawlFetch } from '../../sharedUtils'
import { useNitroApp, useRuntimeConfig, useSiteConfig } from '#imports'

// verify a link
export default defineEventHandler(async (e) => {
  const link = decodeURIComponent(getQuery(e).link as string)

  // do a quick check for links that are always safe
  if (link.startsWith('mailto:') || link.startsWith('tel:'))
    return { passes: true }

  const body = await readBody<{ paths: string[]; ids: string[] }>(e)
  const { ids, paths } = body
  const partialCtx: Partial<RuleTestContext> = {
    ids,
    fromPath: fixSlashes(false, parseURL(getHeader(e, 'referer') || '/').pathname),
    siteConfig: useSiteConfig(e),
  }
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker']

  let response
  if (isInvalidLinkProtocol(link) || link.startsWith('#')) {
    response = { status: 200, statusText: 'OK', headers: {} }
  }
  else {
    response = await crawlFetch(link, {
      fetch: $fetch.raw,
      timeout: runtimeConfig.timeout,
    })
  }
  // @ts-expect-error untyped
  const result = inspect({
    ...partialCtx,
    link,
    pageSearch: useNitroApp()._linkCheckerPageSearch,
    response,
    skipInspections: runtimeConfig.skipInspections,
  })
  const filePaths = paths.map((p) => {
    const [filepath] = p.split(':')
    return filepath
  })
  if (!result.passes) {
    result.sources = (await Promise.all(filePaths.map(async filepath => await generateFileLinkPreviews(filepath, link))))
      .filter(s => s.previews.length)
    result.diff = await Promise.all((result.sources || []).map(async ({ filepath }) => generateFileLinkDiff(filepath, link, result.fix!)))
  }
  return result
})
