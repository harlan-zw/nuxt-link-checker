import type { NuxtAuditESLintConfigOptions } from 'nuxt-analyze-eslint-plugin'
import type { Nuxt } from 'nuxt/schema'
import { createResolver, useNuxt } from '@nuxt/kit'
import { useSiteConfig } from 'nuxt-site-config/kit'

export async function setupEslint(nuxt: Nuxt = useNuxt()) {
  const resolve = createResolver(import.meta.url)
  const from = await resolve.resolvePath('../../eslint-plugin/dist/index.mjs')
  const toProps = ['href', 'to']
  const opts = {
    vueLinkComponents: {
      NuxtLink: toProps,
      VueRouter: toProps,
    },
    titles: {},
    descriptions: {},
    pages: [],
  } as NuxtAuditESLintConfigOptions
  if (nuxt.options.modules.some(s => String(s).includes('@nuxt/ui'))) {
    // add nuxt/ui vue component links
    opts.vueLinkComponents.UButton = toProps
    opts.vueLinkComponents.ULink = toProps
  }
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
  // const service: ESLintContainer = {
  //   controller: null as any as ESLintWorkerPool,
  //   init() {
  //     if (!service.controller) {
  //       service.controller = createESLintWorkerPool({
  //         overrideConfigFile: eslintPrerenderConfig.dst,
  //       })
  //     }
  //   },
  //   options: opts,
  //   patchConfig: async () => { /* noop */ },
  // }
  // write a template
//   const eslintPrerenderConfig = addTemplate({
//     filename: 'eslint.prerender.config.mjs',
//     write: true,
//     getContents() {
//       return `
// import nuxtAnalyze from "${from}";
//
// export default [
//   ...nuxtAnalyze(${JSON.stringify(opts, null, 2)}),
//   {
//     ignores: ['!**/node_modules/']
//   },
// ]
// `
//     },
//   })
  // service.patchConfig = async (options: NuxtAuditESLintConfigOptions) => {
  //   for (const key in options) {
  //     // @ts-expect-error untyped
  //     service.options[key] = options[key]
  //   }
  //   await updateTemplates({
  //     filter: template => template.dst === eslintPrerenderConfig.dst,
  //   })
  // }
}
