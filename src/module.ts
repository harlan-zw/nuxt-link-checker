import type { NuxtPage } from '@nuxt/schema'
import type { CreateStorageOptions } from 'unstorage'
import {
  addPlugin,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  extendPages,
  hasNuxtModule,
  hasNuxtModuleCompatibility,
  resolveModule,
  useLogger,
} from '@nuxt/kit'
import { installNuxtSiteConfig } from 'nuxt-site-config/kit'
import { dirname } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { setupDevToolsUI } from './devtools'
import { isNuxtGenerate, prerender } from './prerender'
import { crawlFetch } from './runtime/shared/crawl'
import { convertNuxtPagesToPaths } from './util'

export interface ModuleOptions {
  /**
   * Whether the build should fail when a 404 is encountered.
   */
  failOnError: boolean
  /**
   * Skip specific inspections from running.
   */
  skipInspections: string[]
  /**
   * The timeout for fetching a URL.
   *
   * @default 5000
   */
  fetchTimeout: number
  /**
   * Links to ignore when running inspections.
   */
  excludeLinks: string[]
  /**
   * Generate a report when using nuxt build` or `nuxt generate`.
   */
  report?: {
    /**
     * Whether to output a HTML report.
     */
    html?: boolean
    /**
     * Whether to output a JSON report.
     */
    markdown?: boolean
    /**
     * Whether to output a JSON report.
     */
    json?: boolean
    /**
     * Where to store the files.
     *
     * Either provide a path relative to the nuxt root or an object with options for `unstorage`.
     *
     * By default, they'll be in your .output directory.
     */
    storage?: string | CreateStorageOptions
  }
  /**
   * Whether to show live inspections in your Nuxt app.
   */
  showLiveInspections: boolean
  /**
   * Whether to run the module on `nuxt build` or `nuxt generate`.
   */
  runOnBuild: boolean
  /**
   * Should remote URLs be fetched.
   *
   * @default false
   */
  fetchRemoteUrls: boolean
  /**
   * Enable when your nuxt/content files match your pages. This will automatically detect link sources
   * for the current page.
   *
   * This is the same behavior to using `nuxt/content` with `documentDriven: true`.
   */
  strictNuxtContentPaths: boolean
  /**
   * Whether the module is enabled.
   *
   * @default true
   */
  enabled: boolean
  /**
   * Display debug information.
   *
   * @default false
   */
  debug: boolean
}

export interface ModuleHooks {
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-link-checker',
    compatibility: {
      nuxt: '>=3.9.0',
      bridge: false,
    },
    configKey: 'linkChecker',
  },
  defaults: {
    strictNuxtContentPaths: false,
    fetchRemoteUrls: false, // provider !== 'stackblitz',
    runOnBuild: true,
    debug: false,
    showLiveInspections: false,
    enabled: true,
    fetchTimeout: 10000,
    failOnError: false,
    excludeLinks: [],
    skipInspections: [],
  },
  async setup(config, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger('nuxt-link-checker')
    logger.level = (config.debug || nuxt.options.debug) ? 4 : 3
    const { name, version } = await readPackageJSON(resolve('../package.json'))
    if (config.enabled === false) {
      logger.debug(`The ${name} module is disabled, skipping setup.`)
      return
    }

    await installNuxtSiteConfig()

    if (config.fetchRemoteUrls) {
      config.fetchRemoteUrls = (await crawlFetch('https://google.com')).status === 200
      if (!config.fetchRemoteUrls)
        logger.warn('Remote URL fetching is disabled because you appear to be offline.')
    }

    const isDevToolsEnabled = typeof nuxt.options.devtools === 'boolean' ? nuxt.options.devtools : nuxt.options.devtools.enabled
    if (nuxt.options.dev && isDevToolsEnabled !== false) {
      addPlugin({
        src: resolve('./runtime/app/plugins/ui.client'),
        mode: 'client',
      })
      addServerHandler({
        route: '/__link-checker__/inspect',
        handler: resolve('./runtime/server/routes/__link-checker__/inspect'),
      })
      addServerHandler({
        route: '/__link-checker__/links',
        handler: resolve('./runtime/server/routes/__link-checker__/links'),
      })
      addServerHandler({
        route: '/__link-checker__/debug.json',
        handler: resolve('./runtime/server/routes/__link-checker__/debug'),
      })
      const pagePromise = new Promise<NuxtPage[]>((_resolve) => {
        extendPages((pages) => {
          _resolve(pages)
        })
      })
      nuxt.hooks.hook('nitro:config', (nitroConfig) => {
        // @ts-expect-error runtime types
        nitroConfig.virtual['#nuxt-link-checker-sitemap/pages.mjs'] = async () => {
          const pages = await pagePromise
          return `export default ${JSON.stringify(convertNuxtPagesToPaths(pages), null, 2)}`
        }
      })
      const hasSitemapModule = (hasNuxtModule('@nuxtjs/sitemap') || (hasNuxtModule('nuxt-simple-sitemap') && await hasNuxtModuleCompatibility('nuxt-simple-sitemap', '>=4')))
        //  @ts-expect-error runtime
        && nuxt.options.sitemap?.enabled !== false
      nuxt.options.nitro.alias = nuxt.options.nitro.alias || {}
      const usingNuxtContent = hasNuxtModule('@nuxt/content')
      const isNuxtContentV3 = usingNuxtContent && await hasNuxtModuleCompatibility('@nuxt/content', '^3')
      console.log({ usingNuxtContent, isNuxtContentV3 })
      if (usingNuxtContent) {
        if (isNuxtContentV3) {
          nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/content-v3')
          nuxt.options.alias['#sitemap/content-v3-nitro-path'] = resolve(dirname(resolveModule('@nuxt/content')), 'runtime/nitro')
        } else {
          nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/content-v2')
        }
      }
      else {
        nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/content-mock')
      }
      nuxt.options.alias['#link-checker'] = resolve('./runtime')
      nuxt.options.runtimeConfig.public['nuxt-link-checker'] = {
        version,
        hasSitemapModule,
        rootDir: nuxt.options.rootDir,
        excludeLinks: config.excludeLinks,
        skipInspections: config.skipInspections,
        fetchTimeout: config.fetchTimeout,
        showLiveInspections: config.showLiveInspections,
        fetchRemoteUrls: config.fetchRemoteUrls,
      }
      setupDevToolsUI(config, resolve)
    }

    if (config.runOnBuild) {
      const isRenderingAllRoutes = isNuxtGenerate(nuxt) && !nuxt.options.nitro.prerender?.crawlLinks
      if (!nuxt.options._prepare && !nuxt.options.dev && nuxt.options.build && !isRenderingAllRoutes) {
        // disable no-error-response
        config.skipInspections.push('no-error-response')
      }
      prerender(config)
    }
  },
})
