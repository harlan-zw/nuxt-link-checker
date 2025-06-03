import type { NuxtPage } from '@nuxt/schema'
import type { CreateStorageOptions } from 'unstorage'
import {
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
  hasNuxtModule,
  hasNuxtModuleCompatibility,
  useLogger,
} from '@nuxt/kit'
import { installNuxtSiteConfig } from 'nuxt-site-config/kit'
import { readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { setupDevToolsUI } from './devtools/devtools'
import { setupEslint } from './eslint'
import { prerender } from './prerender'
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
    /**
     * Whether to publish the reports with the build.
     *
     * By default, will output files at `.output/public/__link-checker__/link-checker-report.<format>`.
     */
    publish?: boolean
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
  defaults(nuxt) {
    return {
      fetchRemoteUrls: nuxt.options._build && provider !== 'stackblitz',
      runOnBuild: true,
      debug: false,
      showLiveInspections: false,
      enabled: true,
      fetchTimeout: 10000,
      failOnError: false,
      excludeLinks: [],
      skipInspections: [],
    }
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

    config.nuxtAnalyzeCliPath = import.meta.filename.endsWith('.ts') ? resolve('./cli/index.ts') : resolve('../bin/cli.mjs')
    console.log({ nuxtAnalyzeCliPath: config.nuxtAnalyzeCliPath })

    await setupEslint()

    if (import.meta.env.NUXT_ANALYZE_SUBPROCESS) {
      // force prerendering off
      nuxt.options.nitro.prerender = {
        routes: [],
        crawlLinks: false,
      }
      // force node server preset
      // nuxt.options.nitro.preset = 'node-server'
    }

    if (config.fetchRemoteUrls) {
      const { status } = (await crawlFetch('https://nuxtseo.com/robots.txt').catch(() => ({ status: 404 })))
      config.fetchRemoteUrls = status < 400
      if (!config.fetchRemoteUrls)
        logger.warn('Remote URL fetching is disabled because you appear to be offline.')
    }

    const isDevToolsEnabled = typeof nuxt.options.devtools === 'boolean' ? nuxt.options.devtools : nuxt.options.devtools.enabled
    if (nuxt.options.dev && isDevToolsEnabled !== false) {
      addPlugin({
        src: resolve('./runtime/app/plugins/ui.client'),
        mode: 'client',
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
      nuxt.options.alias['#link-checker'] = resolve('./runtime')
      nuxt.options.runtimeConfig.nuxtAnalyze = {
        storageDir: resolve(nuxt.options.rootDir, `.data/analyze`),
      }
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
      await setupDevToolsUI(config, resolve)
    }

    if (config.runOnBuild) {
      prerender(config, version)
    }
  },
})
