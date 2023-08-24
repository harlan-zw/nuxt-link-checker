import {
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule, extendPages,
  hasNuxtModule, useLogger,
} from '@nuxt/kit'
import { installNuxtSiteConfig, updateSiteConfig } from 'nuxt-site-config-kit'
import type { NuxtPage } from '@nuxt/schema'
import { provider } from 'std-env'
import { prerender } from './prerender'
import { setupDevToolsUI } from './devtools'
import type { DefaultInspections } from './runtime/inspect'
import { convertNuxtPagesToPaths } from './util'
import { crawlFetch } from './runtime/sharedUtils'

export interface ModuleOptions {
  /**
   * Whether the build should fail when a 404 is encountered.
   */
  failOnError: boolean
  /**
   * Skip specific inspections from running.
   */
  skipInspections: (Partial<keyof typeof DefaultInspections>)[]
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
   * @default true (disabled in stackblitz)
   */
  fetchRemoteUrls: boolean
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
  /**
   * Should the URLs be inserted with a trailing slash.
   *
   * @default false
   * @deprecated use site config
   */
  trailingSlash?: boolean
  /**
   * Your site hostname. Used to determine if absolute links are internal.
   *
   * @default false
   *
   * @deprecated use site config
   */
  host?: string
}

export interface ModuleHooks {
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-link-checker',
    compatibility: {
      nuxt: '^3.6.2',
      bridge: false,
    },
    configKey: 'linkChecker',
  },
  defaults: {
    fetchRemoteUrls: provider !== 'stackblitz',
    runOnBuild: true,
    debug: false,
    showLiveInspections: true,
    enabled: true,
    fetchTimeout: 5000,
    failOnError: false,
    excludeLinks: [],
    skipInspections: [],
  },
  async setup(config, nuxt) {
    const logger = useLogger('nuxt-link-checker')
    logger.level = (config.debug || nuxt.options.debug) ? 4 : 3
    if (config.enabled === false) {
      logger.debug('The module is disabled, skipping setup.')
      return
    }
    const { resolve } = createResolver(import.meta.url)

    await installNuxtSiteConfig()
    if (config.trailingSlash || config.host) {
      updateSiteConfig({
        _context: 'nuxt-link-checker',
        trailingSlash: config.trailingSlash,
        host: config.host,
      })
    }

    if (config.fetchRemoteUrls) {
      config.fetchRemoteUrls = (await crawlFetch('https://google.com')).status === 200
      if (!config.fetchRemoteUrls)
        logger.warn('Remote URL fetching is disabled because https://google.com could not be fetched.')
    }

    const isDevToolsEnabled = typeof nuxt.options.devtools === 'boolean' ? nuxt.options.devtools : nuxt.options.devtools.enabled
    if (nuxt.options.dev && isDevToolsEnabled) {
      addPlugin({
        src: resolve('./runtime/plugin/ui.client'),
        mode: 'client',
      })
      addServerHandler({
        route: '/api/__link_checker__/inspect',
        handler: resolve('./runtime/server/api/inspect'),
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
      addServerPlugin(resolve('./runtime/plugin/search.nitro'))
      addServerHandler({
        route: '/api/__link_checker__/links',
        handler: resolve('./runtime/server/api/links'),
      })
      nuxt.options.runtimeConfig.public['nuxt-link-checker'] = {
        hasSitemapModule: hasNuxtModule('nuxt-simple-sitemap'),
        excludeLinks: config.excludeLinks,
        skipInspections: config.skipInspections,
        fetchTimeout: config.fetchTimeout,
        showLiveInspections: config.showLiveInspections,
        fetchRemoteUrls: config.fetchRemoteUrls,
      }
      setupDevToolsUI(config, resolve)
    }

    if (config.runOnBuild)
      prerender(config)
  },
})
