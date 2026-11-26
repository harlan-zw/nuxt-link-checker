import type { LinkResponse } from '../../src/runtime/shared/crawl'
import { describe, expect, it } from 'vitest'
import { resolvePrerenderRedirect } from '../../src/prerender'
import { UNREACHABLE_STATUS } from '../../src/runtime/shared/crawl'

const prerenderedOk: LinkResponse = {
  status: 200,
  statusText: '',
  headers: { 'Content-Type': 'text/html' },
}

function createResponder(routes: Record<string, LinkResponse>) {
  const requested: string[] = []
  const fetch = async (path: string): Promise<LinkResponse> => {
    requested.push(path)
    return routes[path] ?? { status: 404, statusText: 'Page not found', headers: {} }
  }
  return { fetch, requested }
}

describe('resolvePrerenderRedirect', () => {
  it('returns undefined when a meta refresh route is not an HTTP redirect', async () => {
    const { fetch } = createResponder({
      '/auto-refresh': { status: 200, statusText: 'OK', headers: {} },
    })

    expect(await resolvePrerenderRedirect('/auto-refresh', prerenderedOk, { fetch })).toBeUndefined()
  })

  it('follows a two-hop local chain to a missing terminal page', async () => {
    const { fetch, requested } = createResponder({
      '/old-bad': { status: 301, statusText: 'Moved Permanently', headers: { location: '/middle-bad' } },
      '/middle-bad': { status: 302, statusText: 'Found', headers: { location: '/missing' } },
    })

    const result = await resolvePrerenderRedirect('/old-bad', prerenderedOk, { fetch })

    expect(requested).toEqual(['/old-bad', '/middle-bad', '/missing'])
    expect(result).toEqual({
      status: 404,
      statusText: 'Page not found',
      headers: {},
      redirect: { status: 301, location: '/missing' },
    })
  })

  it('follows a working local chain and preserves the first-hop status with the terminal location', async () => {
    const { fetch, requested } = createResponder({
      '/old-good': { status: 308, statusText: 'Permanent Redirect', headers: { location: '/middle-good' } },
      '/middle-good': { status: 302, statusText: 'Found', headers: { location: '/guide#intro' } },
      '/guide': { status: 200, statusText: 'OK', headers: { 'content-type': 'text/html' } },
    })

    const result = await resolvePrerenderRedirect('/old-good', prerenderedOk, { fetch })

    expect(requested).toEqual(['/old-good', '/middle-good', '/guide'])
    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/html' },
      redirect: { status: 308, location: '/guide#intro' },
    })
  })

  it('resolves document-relative redirect locations against the current hop', async () => {
    const { fetch, requested } = createResponder({
      '/docs/old': { status: 301, statusText: '', headers: { location: 'middle' } },
      '/docs/middle': { status: 301, statusText: '', headers: { location: '../guide' } },
      '/guide': { status: 200, statusText: 'OK', headers: {} },
    })

    const result = await resolvePrerenderRedirect('/docs/old', prerenderedOk, { fetch })

    expect(requested).toEqual(['/docs/old', '/docs/middle', '/guide'])
    expect(result).toMatchObject({ status: 200, redirect: { status: 301, location: '/guide' } })
  })

  it('applies baseURL to local hops without duplicating an existing prefix', async () => {
    const { fetch, requested } = createResponder({
      '/site/old': { status: 301, statusText: '', headers: { location: '/middle' } },
      '/site/middle': { status: 301, statusText: '', headers: { location: '/site/guide' } },
      '/site/guide': { status: 200, statusText: 'OK', headers: {} },
    })

    const result = await resolvePrerenderRedirect('/old', prerenderedOk, { baseURL: '/site/', fetch })

    expect(requested).toEqual(['/site/old', '/site/middle', '/site/guide'])
    expect(result).toMatchObject({ status: 200, redirect: { status: 301, location: '/site/guide' } })
  })

  it('stops before fetching an external target and keeps the prerendered response', async () => {
    const { fetch, requested } = createResponder({
      '/old-ext': { status: 301, statusText: '', headers: { location: '/middle-ext' } },
      '/middle-ext': { status: 302, statusText: '', headers: { location: 'https://example.org/docs' } },
    })

    const result = await resolvePrerenderRedirect('/old-ext', prerenderedOk, { fetch })

    expect(requested).toEqual(['/old-ext', '/middle-ext'])
    expect(result).toEqual({
      ...prerenderedOk,
      redirect: { status: 301, location: 'https://example.org/docs' },
    })
  })

  it.each([
    ['self cycle', '/self', { '/self': { status: 302, statusText: '', headers: { location: '/self' } } }, ['/self']],
    ['two-hop cycle', '/a', {
      '/a': { status: 302, statusText: '', headers: { location: '/b' } },
      '/b': { status: 302, statusText: '', headers: { location: '/a' } },
    }, ['/a', '/b']],
  ])('detects a %s without looping', async (_label, start, routes, expectedRequests) => {
    const { fetch, requested } = createResponder(routes)

    const result = await resolvePrerenderRedirect(start, prerenderedOk, { fetch })

    expect(requested).toEqual(expectedRequests)
    expect(result).toMatchObject({
      status: UNREACHABLE_STATUS,
      statusText: 'Redirect loop',
      redirect: { status: 302 },
    })
  })

  it('stops with Too many redirects when the chain exceeds maxHops', async () => {
    const { fetch, requested } = createResponder({
      '/hop-0': { status: 302, statusText: '', headers: { location: '/hop-1' } },
      '/hop-1': { status: 302, statusText: '', headers: { location: '/hop-2' } },
      '/hop-2': { status: 302, statusText: '', headers: { location: '/hop-3' } },
      '/hop-3': { status: 200, statusText: 'OK', headers: {} },
    })

    const result = await resolvePrerenderRedirect('/hop-0', prerenderedOk, { fetch, maxHops: 2 })

    expect(requested).toEqual(['/hop-0', '/hop-1', '/hop-2'])
    expect(result).toMatchObject({
      status: UNREACHABLE_STATUS,
      statusText: 'Too many redirects',
      redirect: { status: 302, location: '/hop-3' },
    })
  })
})
