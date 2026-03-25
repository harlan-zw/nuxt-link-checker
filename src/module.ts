import type { NuxtPage } from '@nuxt/schema'
import type { CreateStorageOptions } from 'unstorage'
import { mkdir, writeFile } from 'node:fs/promises'
import {
  addPlugin,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  hasNuxtModuleCompatibility,
  resolveModule,
  useLogger,
} from '@nuxt/kit'
import { installNuxtSiteConfig } from 'nuxt-site-config/kit'
import { resolveNuxtContentVersion } from 'nuxtseo-shared/kit'
import { $fetch } from 'ofetch'
import { dirname, join } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { setupDevToolsUI } from './devtools'
import { prerender } from './prerender'
import { crawlFetch } from './runtime/shared/crawl'
import { serializeFilterEntries } from './runtime/shared/sharedUtils'
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
   *
   * Supports:
   * - Exact matches: `/about`
   * - Wildcards: `/admin/**`, `/api/*`
   * - RegExp patterns: `/^\\/blog\\/\\d+$/`
   *
   * Uses radix3 route matching for string patterns.
   *
   * @example
   * ```ts
   * excludeLinks: [
   *   '/admin/**',        // Exclude all admin routes
   *   '/api/*',           // Exclude direct /api children
   *   /^\/blog\/\d+$/,    // Exclude blog posts using regex
   *   'https://example.com/**'  // Exclude external domain
   * ]
   * ```
   */
  excludeLinks: (string | RegExp)[]
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
   * Pages to exclude from link checking entirely.
   *
   * When a page matches, none of its links will be inspected.
   *
   * Supports the same pattern types as `excludeLinks`:
   * - Exact matches: `/about`
   * - Wildcards: `/admin/**`
   * - RegExp patterns: `/^\/blog\/\d+$/`
   *
   * @default []
   */
  excludePages: (string | RegExp)[]
  /**
   * Display debug information.
   *
   * @default false
   */
  debug: boolean
}

export interface ModuleHooks {
}

const excludeUnderscorePathsRe = /^\/_/

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-link-checker',
    compatibility: {
      nuxt: '>=3.9.0',
    },
    configKey: 'linkChecker',
  },
  moduleDependencies: {
    'nuxt-site-config': {
      version: '>=3.2',
    },
    '@nuxt/content': {
      version: '>=2',
      optional: true,
    },
    '@nuxtjs/sitemap': {
      version: '>=7',
      optional: true,
    },
  },
  defaults() {
    return {
      strictNuxtContentPaths: false,
      fetchRemoteUrls: false,
      runOnBuild: true,
      debug: false,
      showLiveInspections: false,
      enabled: true,
      fetchTimeout: 10000,
      failOnError: false,
      excludeLinks: [
        excludeUnderscorePathsRe,
      ],
      excludePages: [],
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

    if (!nuxt.options._prepare && config.fetchRemoteUrls) {
      const { status } = (await crawlFetch('https://nuxtseo.com/robots.txt', { timeout: 400 }).catch(() => ({ status: 404 })))
      config.fetchRemoteUrls = status < 400
      if (!config.fetchRemoteUrls)
        logger.warn('Remote URL fetching is disabled because you appear to be offline. Set `fetchRemoteUrls: false` to avoid this warning.')
    }

    const hasSitemapModule = (hasNuxtModule('@nuxtjs/sitemap') || (hasNuxtModule('nuxt-simple-sitemap') && await hasNuxtModuleCompatibility('nuxt-simple-sitemap', '>=4')))
      //  @ts-expect-error runtime
      && nuxt.options.sitemap?.enabled !== false

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
      const pages: NuxtPage[] = []
      nuxt.hooks.hook('pages:resolved', (resolved) => {
        pages.unshift(...resolved)
      })
      nuxt.hooks.hook('nitro:config', (nitroConfig) => {
        // @ts-expect-error runtime types
        nitroConfig.virtual['#nuxt-link-checker-sitemap/pages.mjs'] = async () => {
          return `export default ${JSON.stringify(convertNuxtPagesToPaths(pages), null, 2)}`
        }
      })
      nuxt.options.nitro.alias = nuxt.options.nitro.alias || {}
      const contentVersion = await resolveNuxtContentVersion()
      const isNuxtContentV3 = contentVersion && contentVersion.version === 3
      if (contentVersion) {
        if (isNuxtContentV3) {
          if (await hasNuxtModuleCompatibility('@nuxt/content', '<3.6.0')) {
            nuxt.options.alias['@nuxt/content/nitro'] = resolve('./runtime/server/content-compat')
            nuxt.options.alias['#link-checker/content-v3-nitro-path'] = resolve(dirname(resolveModule('@nuxt/content')), 'runtime/nitro')
          }
          nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/content-v3')
        }
        else {
          nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/content-v2')
        }
      }
      else {
        nuxt.options.nitro.alias['#link-checker/content-provider'] = resolve('./runtime/server/providers/noop')
      }
      nuxt.options.alias['#link-checker'] = resolve('./runtime')
      nuxt.options.runtimeConfig.public['nuxt-link-checker'] = {
        version,
        hasSitemapModule,
        rootDir: nuxt.options.rootDir,
        excludeLinks: serializeFilterEntries(config.excludeLinks),
        excludePages: serializeFilterEntries(config.excludePages),
        skipInspections: config.skipInspections,
        fetchTimeout: config.fetchTimeout,
        showLiveInspections: config.showLiveInspections,
        fetchRemoteUrls: config.fetchRemoteUrls,
      }
      setupDevToolsUI(config, resolve)
    }

    // Collect route-to-file mapping for console output (#43)
    const routeFileMap: Record<string, string> = {}
    nuxt.hooks.hook('pages:resolved', (resolved) => {
      for (const entry of convertNuxtPagesToPaths(resolved)) {
        if (entry.file)
          routeFileMap[entry.link] = entry.file
      }
    })

    // ESLint integration: write route data for eslint rules
    const routesDir = join(nuxt.options.buildDir, 'link-checker')
    const routesPath = join(routesDir, 'routes.json')
    let staticRoutes: string[] = []
    let dynamicRoutes: string[] = []

    const writeRoutesFile = async (): Promise<void> => {
      await mkdir(routesDir, { recursive: true })
      await writeFile(routesPath, JSON.stringify({ staticRoutes, dynamicRoutes }))
    }

    nuxt.hooks.hook('pages:resolved', async (resolved) => {
      const allPaths = convertNuxtPagesToPaths(resolved, { keepDynamic: true })
      staticRoutes = allPaths.filter(p => !p.link.includes(':')).map(p => p.link)
      dynamicRoutes = allPaths.filter(p => p.link.includes(':')).map(p => p.link)
      await writeRoutesFile()
    })

    // Enrich with sitemap URLs once dev server is ready
    if (hasSitemapModule && nuxt.options.dev) {
      let debounceTimer: ReturnType<typeof setTimeout> | undefined
      nuxt.hooks.hook('listen', (_server, listener) => {
        const baseURL = `http://localhost:${listener.port}`
        const enrichRoutes = async (): Promise<void> => {
          const debug = await $fetch<{ globalSources: { urls: { loc: string }[] }[] }>(`${baseURL}/__sitemap__/debug.json`).catch(() => null)
          if (!debug)
            return
          const baseOrigin = new URL(baseURL).origin
          const sitemapPaths = debug.globalSources
            .flatMap(s => s.urls)
            .map((u) => {
              const parsed = new URL(u.loc, baseURL)
              if (parsed.origin !== baseOrigin)
                return null
              return parsed.pathname || '/'
            })
            .filter((p): p is string => !!p && p.startsWith('/'))
          staticRoutes = [...new Set([...staticRoutes, ...sitemapPaths])]
          await writeRoutesFile()
        }
        enrichRoutes()
        nuxt.hooks.hook('builder:watch', () => {
          clearTimeout(debounceTimer)
          debounceTimer = setTimeout(enrichRoutes, 500)
        })
      })
    }

    // @nuxt/eslint auto-registration
    // @ts-expect-error untyped hook from @nuxt/eslint
    nuxt.hook('eslint:config:addons', (addons) => {
      addons.push({
        name: 'nuxt-link-checker',
        getConfigs: () => ({
          imports: [{ from: 'nuxt-link-checker/eslint', name: 'default', as: 'linkCheckerPlugin' }],
          configs: [
            `{
              name: 'nuxt-link-checker/valid-route',
              files: ['**/*.vue', '**/*.ts'],
              plugins: { 'link-checker': linkCheckerPlugin },
              rules: {
                'link-checker/valid-route': 'error',
                'link-checker/valid-sitemap-link': 'warn',
              },
            }`,
            `{
              name: 'nuxt-link-checker/valid-route-markdown',
              files: ['**/*.md'],
              plugins: { 'link-checker': linkCheckerPlugin },
              processor: 'link-checker/markdown',
              rules: {
                'link-checker/valid-route': 'error',
                'link-checker/valid-sitemap-link': 'warn',
              },
            }`,
          ],
        }),
      })
    })

    if (config.runOnBuild) {
      prerender(config, version, routeFileMap)
    }
  },
})
