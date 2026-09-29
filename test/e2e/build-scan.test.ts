import { readFile } from 'node:fs/promises'
import { buildNuxt, createResolver, loadNuxt } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
const rootDir = resolve('../fixtures/build-scan')

describe('build scan', () => {
  it('inspects every link a prerendered page renders', async () => {
    const nuxt = await loadNuxt({
      rootDir,
      overrides: {
        nitro: { preset: 'static', prerender: { routes: ['/', '/about'] } },
      },
    })
    await buildNuxt(nuxt)

    const report = JSON.parse(await readFile(resolve(rootDir, '.output/link-checker-report.json'), 'utf8'))
    const links = report.flatMap((page: any) => page.reports.map((r: any) => ({
      link: r.link,
      issues: [...r.error, ...r.warning].map((i: any) => i.name),
    })))

    // an anchor without href reaches the no-missing-href rule
    expect(links).toContainEqual({ link: '', issues: ['no-missing-href'] })
    // a link teleported to <body> renders outside #__nuxt and is still inspected
    expect(links.find((l: any) => l.link === '/About')?.issues).toContain('no-uppercase-chars')

    const markdown = await readFile(resolve(rootDir, '.output/link-checker-report.md'), 'utf8')
    expect(markdown).toContain('**Pages checked:** 3')
  })

  it('says so when a build prerenders no pages', async () => {
    const nuxt = await loadNuxt({
      rootDir,
      overrides: {
        nitro: { preset: 'node-server' },
      },
    })
    const logs: string[] = []
    nuxt.hook('nitro:build:before', (nitro) => {
      const info = nitro.logger.info.bind(nitro.logger)
      nitro.logger.info = ((...args: unknown[]) => {
        logs.push(args.map(String).join(' '))
        return info(...args)
      }) as typeof nitro.logger.info
    })
    await buildNuxt(nuxt)

    expect(logs.some(line => line.includes('Nuxt Link Checker scanned no pages'))).toBe(true)
  })
})
