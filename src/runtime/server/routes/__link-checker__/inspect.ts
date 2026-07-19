import { createDefu } from 'defu'
import Fuse from 'fuse.js'
import { createError, defineEventHandler, readBody } from 'h3'
import { fixSlashes } from 'nuxt-site-config/urls'
import { resolve } from 'pathe'
import { getNitroOrigin, getSiteConfig, useRuntimeConfig } from '#imports'
import { generateFileLinkDiff, generateFileLinkPreviews, getLinkResponse, inspect, isNonFetchableLink, lruFsCache } from '../../../shared'

interface InspectTask {
  link: string
  textContent: string
  paths: string[]
}

interface InspectRequestBody {
  path?: string
  tasks: InspectTask[]
  ids: string[]
}

const merger = createDefu((obj, key, value) => {
  // merge arrays using a set
  if (Array.isArray(obj[key]) && Array.isArray(value))
    // @ts-expect-error untyped
    obj[key] = Array.from(new Set([...obj[key], ...value]))
  return obj[key]
})

function mergeOnKey<T, K extends keyof T>(arr: T[], key: K): T[] {
  const res: Record<string, T> = {}
  arr.forEach((item) => {
    const k = item[key] as string
    // @ts-expect-error untyped
    res[k] = merger(item, res[k] || {})
  })
  return Object.values(res)
}

function isInternalRoute(path: string): boolean {
  const lastSegment = path.split('/').pop() || path
  return lastSegment.includes('.') || path.startsWith('/__') || path.startsWith('@')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function parseInspectTasks(value: unknown): InspectTask[] | undefined {
  if (!Array.isArray(value))
    return

  const tasks = value.filter((task): task is InspectTask => {
    return isRecord(task)
      && typeof task.link === 'string'
      && typeof task.textContent === 'string'
      && isStringArray(task.paths)
  })

  return tasks.length === value.length ? tasks : undefined
}

function parseInspectRequestBody(body: unknown): InspectRequestBody {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid link checker inspection payload.',
    })
  }

  const tasks = parseInspectTasks(body.tasks)
  const ids = isStringArray(body.ids) ? body.ids : undefined
  const path = body.path

  if (!tasks || !ids || (path !== undefined && typeof path !== 'string')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid link checker inspection payload.',
    })
  }

  return { tasks, ids, path }
}

// verify a link
export default defineEventHandler(async (e) => {
  const { tasks, ids, path } = parseInspectRequestBody(await readBody(e))
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker'] || {} as any
  const partialCtx = {
    ids,
    fromPath: fixSlashes(false, path ?? '/'),
    siteConfig: getSiteConfig(e),
  } as const
  // allow editing files to trigger a cache clear
  lruFsCache.clear()
  // @ts-expect-error excessive stack depth from $fetch type inference
  const links: { link: string, title: string, file?: string }[] = await $fetch('/__link-checker__/links')
  const pageSearch = new Fuse<{ link: string, title?: string }>(mergeOnKey(links, 'link'), {
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
        baseURL: getNitroOrigin(e),
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
        resolve(runtimeConfig.rootDir, links.find(l => l.file && l.link === path)?.file || ''),
        ...paths.map((p) => {
          const [filepath] = p.split(':')
          return filepath
        }),
      ].filter(Boolean) as string[]
      if (!result.passes) {
        result.sources = (await Promise.all(filePaths.map(async filepath => await generateFileLinkPreviews(filepath, link))))
          .filter(s => s.previews.length)
        result.diff = (await Promise.all((result.sources || []).map(async ({ filepath }) => generateFileLinkDiff(filepath, link, result.fix!))))
      }
      return result
    }),
  )
})
