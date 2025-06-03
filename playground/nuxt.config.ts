import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'
import Module from '../packages/module/src/module'

export default defineNuxtConfig({
  modules: [
    Module,
    '@nuxt/ui',

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

  site: {
    url: 'https://nuxt-link-checker.com',
    // trailingSlash: true,
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    prerender: {
      routes: [
        '/',
      ],
      crawlLinks: true,
      failOnError: false,
    },
  },

  routeRules: {
    redirect: {
      redirect: '/redirected',
    },
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',

  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    typedPages: true,
  },
})
