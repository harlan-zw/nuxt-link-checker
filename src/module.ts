import {
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
  hasNuxtModule, useLogger,
} from '@nuxt/kit'
import { installNuxtSiteConfig, updateSiteConfig } from 'nuxt-site-config-kit'
import { prerender } from './prerender'
import { setupDevToolsUI } from './devtools'

export interface ModuleOptions {
  /**
   * Whether the build should fail when a 404 is encountered.
   */
  failOn404: boolean
  /**
   * Paths to ignore when checking links.
   */
  exclude: string[]
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
    debug: false,
    enabled: true,
    failOn404: true,
    exclude: [],
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

    if (nuxt.options.dev) {
      addPlugin({
        src: resolve('./runtime/plugin/ui.client.ts'),
        mode: 'client',
      })
      addServerHandler({
        route: '/api/__link_checker__/inspect',
        handler: resolve('./runtime/server/api/inspect'),
      })
      addServerPlugin(resolve('./runtime/plugin/search.nitro.ts'))
      const hasLinksEndpoint = hasNuxtModule('nuxt-simple-sitemap')
      if (hasLinksEndpoint) {
        addServerHandler({
          route: '/api/__link_checker__/links',
          handler: resolve('./runtime/server/api/links'),
        })
      }
      nuxt.options.runtimeConfig['nuxt-link-checker'] = {
        hasSitemapModule: hasNuxtModule('nuxt-simple-sitemap'),
        hasLinksEndpoint,
      }
      setupDevToolsUI(nuxt, resolve)
    }

    prerender(config)
  },
})
