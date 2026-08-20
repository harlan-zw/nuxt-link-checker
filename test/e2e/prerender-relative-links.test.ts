import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { buildNuxt, createResolver, loadNuxt } from '@nuxt/kit'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

describe('prerender relative links', () => {
  it('checks a skipped route against the site URL', async () => {
    const requests: { method?: string, url?: string }[] = []
    const server = createServer((request, response) => {
      requests.push({ method: request.method, url: request.url })
      response.statusCode = request.url === '/live-only' ? 200 : 404
      response.end()
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    onTestFinished(() => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    }))

    const { port } = server.address() as AddressInfo
    vi.stubEnv('NUXT_PUBLIC_SITE_URL', `http://127.0.0.1:${port}`)

    const { resolve } = createResolver(import.meta.url)
    const rootDir = resolve('../fixtures/prerender-relative-links')
    const nuxt = await loadNuxt({
      rootDir,
      overrides: {
        nitro: { preset: 'static' },
        _generate: true,
      },
    })
    await buildNuxt(nuxt)

    const report = JSON.parse(await readFile(
      resolve(rootDir, '.output/public/__link-checker__/link-checker-report.json'),
      'utf8',
    ))

    expect(report).toEqual([])
    expect(requests).toContainEqual({ method: 'HEAD', url: '/live-only' })
  })
})
