import { defineEventHandler, getQuery, readBody } from 'h3'
import { inspect } from '../../inspect'
import type { RuleTestContext } from '../../types'
import { generateFileLinkDiff, generateFileLinkPreviews } from '../util'
import { isInvalidLinkProtocol } from '../../inspections/util'
import { useNitroApp, useSiteConfig } from '#imports'

// verify a link
export default defineEventHandler(async (e) => {
  const link = decodeURIComponent(getQuery(e).link as string)
  const body = await readBody<{ paths: string[]; ids: string[] }>(e)
  const { ids, paths } = body
  const partialCtx: Partial<RuleTestContext> = {
    ids,
    e,
    siteConfig: useSiteConfig(e),
  }

  let response
  if (isInvalidLinkProtocol(link) || link.startsWith('#')) {
    response = { status: 200, statusText: 'OK', headers: {} }
  }
  else {
    const timeoutController = new AbortController()
    const abortRequestTimeout = setTimeout(() => timeoutController.abort(), 5000)

    response = await $fetch.raw(link, {
      method: 'HEAD',
      signal: timeoutController.signal,
      headers: {
        'user-agent': 'Nuxt Link Checker',
      },
    })
      .catch(() => ({ status: 404, statusText: 'Not Found', headers: {} }))
      .finally(() => clearTimeout(abortRequestTimeout))
  }
  // @ts-expect-error untyped
  const result = inspect({
    ...partialCtx,
    link,
    pageSearch: useNitroApp()._linkCheckerPageSearch,
    response,
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
