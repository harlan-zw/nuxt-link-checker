import type { NuxtPage } from '@nuxt/schema'
import { describe, expect, it } from 'vitest'
import { convertNuxtPagesToPaths } from '../../src/util'

describe('convertNuxtPagesToPaths', () => {
  it('keeps static routes and drops dynamic ones', () => {
    const pages: NuxtPage[] = [
      { name: 'about', path: '/about', file: 'pages/about.vue' },
      { name: 'post', path: '/posts/:slug', file: 'pages/posts/[slug].vue' },
    ]
    expect(convertNuxtPagesToPaths(pages).map(p => p.link)).toEqual(['/about'])
  })

  it('expands compacted i18n locale routes into per-locale paths', () => {
    const pages: NuxtPage[] = [
      { name: 'about___en', path: '/about', file: 'pages/about.vue' },
      { name: 'about', path: '/:locale(fr|de)/about', file: 'pages/about.vue', meta: { __i18nCompact: true } },
    ]
    const links = convertNuxtPagesToPaths(pages, { locales: ['en', 'fr', 'de'] }).map(p => p.link)
    expect(links).toEqual(['/about', '/fr/about', '/de/about'])
  })

  it('does not expand a genuine :locale param with no known locale tokens', () => {
    const pages: NuxtPage[] = [
      { name: 'page', path: '/:locale(foo|bar)/page', file: 'pages/[locale]/page.vue' },
    ]
    // not a locale route -> treated as dynamic and dropped
    expect(convertNuxtPagesToPaths(pages, { locales: ['en', 'fr'] })).toEqual([])
  })
})
