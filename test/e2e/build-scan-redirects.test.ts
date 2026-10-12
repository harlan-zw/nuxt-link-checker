import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { buildNuxt, createResolver, loadNuxt } from '@nuxt/kit'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

interface ReportedLink { link: string, issues: { name: string, fix?: string }[] }

const { resolve } = createResolver(import.meta.url)
const rootDir = resolve('../fixtures/build-scan-redirects')
const redirectToAbout = [{ name: 'redirects', fix: '/about' }]

// stands in for the deployed site, where a server middleware redirects /moved
const site = createServer((request, response) => {
  if (request.url === '/moved') {
    response.writeHead(301, { location: '/about' })
    response.end()
    return
  }
  response.statusCode = request.url === '/about' ? 200 : 404
  response.end()
})

let links: ReportedLink[] = []

describe('build scan redirects', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      site.once('error', reject)
      site.listen(0, '127.0.0.1', resolve)
    })
    const { port } = site.address() as AddressInfo
    vi.stubEnv('NUXT_PUBLIC_SITE_URL', `http://127.0.0.1:${port}`)

    const nuxt = await loadNuxt({
      rootDir,
      overrides: {
        nitro: { preset: 'static' },
      },
    })
    await buildNuxt(nuxt)

    const report = JSON.parse(await readFile(resolve(rootDir, '.output/link-checker-report.json'), 'utf8'))
    links = report.flatMap((page: any) => page.reports.map((r: any) => ({
      link: r.link,
      issues: [...r.error, ...r.warning].map((i: any) => ({ name: i.name, fix: i.fix })),
    })))
  }, 120000)

  afterAll(async () => {
    vi.unstubAllEnvs()
    await new Promise<void>((resolve, reject) => {
      site.close(error => error ? reject(error) : resolve())
    })
  })

  it('reports a routeRules redirect that Nitro prerendered', () => {
    expect(links).toContainEqual({ link: '/old-permanent', issues: redirectToAbout })
    expect(links).toContainEqual({ link: '/old-permanent-strict', issues: redirectToAbout })
  })

  it('reports a redirect the build fetches from the site URL', () => {
    expect(links).toContainEqual({ link: '/moved', issues: redirectToAbout })
  })

  it('passes a link to a page that does not redirect', () => {
    expect(links.find(l => l.link === '/about')?.issues ?? []).toEqual([])
  })
})
