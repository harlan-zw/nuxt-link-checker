import type { ESLintWorkerController } from 'nuxt-analyze-eslint-worker/controller'
import type { Nuxt } from 'nuxt/schema'
import type { NuxtAuditESLintConfigOptions } from '../../eslint-plugin/src/types'
import type { ESLintContainer } from './rpc-types'
import { addTemplate, createResolver, useNuxt } from '@nuxt/kit'
import { createESLintWorker } from 'nuxt-analyze-eslint-worker/controller'
import { useSiteConfig } from 'nuxt-site-config/kit'

export async function setupEslint(nuxt: Nuxt = useNuxt()): Promise<ESLintContainer> {
  const resolve = createResolver(import.meta.url)
  const from = await resolve.resolvePath('../../eslint-plugin/dist/index.mjs')
  const opts = {} as NuxtAuditESLintConfigOptions
  nuxt.hooks.hook('pages:resolved', (ctx) => {
    opts.pages = ctx
  })
  await nuxt.hooks.hook('eslint:config:addons', (ctx) => {
    ctx.push({
      name: 'nuxt/analyze/setup',
      getConfigs() {
        const siteConfig = useSiteConfig(nuxt)
        opts.siteUrl = siteConfig.url
        opts.trailingSlash = siteConfig.trailingSlash
        return {
          imports: [
            {
              from,
              name: 'default',
              as: 'nuxtAnalyze',
            },
          ],
          configs: [
            `nuxtAnalyze(${JSON.stringify(opts, null, 2)})`,
          ],
        }
      },
    })
  })

  // write a template
  const eslintPrerenderConfig = addTemplate({
    filename: 'eslint.prerender.config.mjs',
    write: true,
    getContents() {
      return `
import nuxtAnalyze from "${from}";

export default [
  ...nuxtAnalyze(${JSON.stringify(opts, null, 2)}),
]
`
    },
  })
  const service: ESLintContainer = {
    controller: null as any as ESLintWorkerController,
    init() {
      if (!service.controller) {
        service.controller = createESLintWorker({
          overrideConfigFile: eslintPrerenderConfig.dst,
        })
      }
    },
  }
  return service
}
