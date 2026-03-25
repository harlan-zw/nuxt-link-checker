import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { createRouteMatcher, createSuggester, loadRoutes } from '../../../src/eslint/utils/routes'

const routesFile = join(__dirname, '../../fixtures/eslint/routes.json')

describe('loadRoutes', () => {
  it('loads routes from fixture', () => {
    const routes = loadRoutes({ routesFile })
    expect(routes.staticRoutes).toContain('/about')
    expect(routes.staticRoutes).toContain('/blog/hello-world')
    expect(routes.dynamicRoutes).toContain('/blog/:slug')
  })

  it('returns empty for missing file', () => {
    const routes = loadRoutes({ routesFile: '/nonexistent/routes.json' })
    expect(routes.staticRoutes).toEqual([])
    expect(routes.dynamicRoutes).toEqual([])
  })

  it('caches by mtime', () => {
    const a = loadRoutes({ routesFile })
    const b = loadRoutes({ routesFile })
    expect(a).toBe(b)
  })
})

describe('createSuggester', () => {
  it('suggests similar routes', () => {
    const suggest = createSuggester(['/about', '/contact', '/blog/hello-world'])
    expect(suggest('/abot')).toBe('/about')
    expect(suggest('/contac')).toBe('/contact')
  })

  it('returns undefined for no match', () => {
    const suggest = createSuggester(['/about', '/contact'])
    expect(suggest('/zzzzzzzzz')).toBeUndefined()
  })
})

describe('createRouteMatcher', () => {
  it('matches dynamic routes', () => {
    const match = createRouteMatcher(['/blog/:slug', '/users/:id', '/users/:id/posts/:postId'])
    expect(match('/blog/hello')).toBe(true)
    expect(match('/blog/any-slug')).toBe(true)
    expect(match('/users/123')).toBe(true)
    expect(match('/users/123/posts/456')).toBe(true)
  })

  it('rejects non-matching paths', () => {
    const match = createRouteMatcher(['/blog/:slug', '/users/:id'])
    expect(match('/about')).toBe(false)
    expect(match('/blog/slug/extra')).toBe(false)
  })
})
