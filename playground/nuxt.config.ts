import { resolve } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { defineNuxtModule } from '@nuxt/kit'
import { startSubprocess } from '@nuxt/devtools-kit'

export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
    '@nuxtjs/sitemap',
    '@nuxt/ui',
    '@nuxt/content',

    /**
     * Start a sub Nuxt Server for developing the client
     *
     * The terminal output can be found in the Terminals tab of the devtools.
     */
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev)
          return

        const subprocess = startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3030'],
            cwd: resolve(__dirname, '../client'),
          },
          {
            id: 'nuxt-link-checker:client',
            name: 'Nuxt Link Checker Client Dev',
          },
        )
        subprocess.getProcess().stdout?.on('data', (data) => {
          // eslint-disable-next-line no-console
          console.log(` sub: ${data.toString()}`)
        })

        process.on('exit', () => {
          subprocess.terminate()
        })

        // process.getProcess().stdout?.pipe(process.stdout)
        // process.getProcess().stderr?.pipe(process.stderr)
      },
    }),
  ],

  // @ts-expect-error untyped
  site: {
    url: 'https://nuxt-link-checker.com',
    // trailingSlash: true,
  },

  nitro: {
    prerender: {
      routes: [
        '/',
      ],
      failOnError: false,
    },
  },

  routeRules: {
    // redirect: {
    //   redirect: '/valid',
    // },
  },

  linkChecker: {
    excludeLinks: ['/ignored'],
    skipInspections: ['missing-hash'],
    report: {
      html: true,
      markdown: true,
      json: true,
    },
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',
})
