import { join } from 'pathe'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
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
  it('matches dynamic routes and returns pattern', () => {
    const match = createRouteMatcher(['/blog/:slug', '/users/:id', '/users/:id/posts/:postId'])
    expect(match('/blog/hello')).toBe('/blog/:slug')
    expect(match('/blog/any-slug')).toBe('/blog/:slug')
    expect(match('/users/123')).toBe('/users/:id')
    expect(match('/users/123/posts/456')).toBe('/users/:id/posts/:postId')
  })

  it('returns null for non-matching paths', () => {
    const match = createRouteMatcher(['/blog/:slug', '/users/:id'])
    expect(match('/about')).toBeNull()
    expect(match('/blog/slug/extra')).toBeNull()
  })
})

describe('loadRoutes without a routes file', () => {
  it('warns once that link checks are off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    onTestFinished(() => warn.mockRestore())
    const routesFile = '/nonexistent/warn-once/routes.json'
    loadRoutes({ routesFile })
    loadRoutes({ routesFile })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain(routesFile)
    expect(warn.mock.calls[0]![0]).toContain('nuxt prepare')
  })
})
