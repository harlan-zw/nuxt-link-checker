import { readFileSync, statSync } from 'node:fs'
import Fuse from 'fuse.js'
import { join } from 'pathe'
import { createRouter } from 'radix3'

export interface RoutesData {
  staticRoutes: string[]
  dynamicRoutes: string[]
}

let cachedRoutes: RoutesData | undefined
let cachedMtime: number | undefined
let cachedPath: string | undefined

export function loadRoutes(options?: { routesFile?: string, rootDir?: string }): RoutesData {
  const routesFile = options?.routesFile
    ?? join(options?.rootDir ?? process.cwd(), '.nuxt/link-checker/routes.json')

  let mtime: number
  try {
    mtime = statSync(routesFile).mtimeMs
  }
  catch {
    return { staticRoutes: [], dynamicRoutes: [] }
  }

  if (cachedRoutes && cachedPath === routesFile && cachedMtime === mtime)
    return cachedRoutes

  try {
    const data = JSON.parse(readFileSync(routesFile, 'utf-8')) as RoutesData
    cachedRoutes = data
    cachedMtime = mtime
    cachedPath = routesFile
    return data
  }
  catch {
    return { staticRoutes: [], dynamicRoutes: [] }
  }
}

export function createSuggester(routes: string[]) {
  const fuse = new Fuse(routes, { threshold: 0.5 })
  return (link: string): string | undefined => {
    const result = fuse.search(link)?.[0]?.item
    return result !== link ? result : undefined
  }
}

export function createRouteMatcher(dynamicRoutes: string[]) {
  const router = createRouter<{ pattern: string }>()
  for (const route of dynamicRoutes) {
    router.insert(route, { pattern: route })
  }
  return (path: string): string | null => {
    const match = router.lookup(path)
    return match ? match.pattern : null
  }
}
