import { resolve } from 'pathe'

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/ui-pro',
    '@nuxt/content',
  ],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            light: 'vitesse-light',
            default: 'vitesse-light',
            dark: 'material-theme-palenight',
          },
          langs: [
            'ts',
            'vue',
            'html',
          ],
        },
      },
    },
  },

  uiPro: {
    mdc: true,
    content: true,
    license: 'oss',
  },

  mdc: {
    highlight: {
      noApiRoute: true,
    },
  },

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__nuxt-link-checker',
  },

  compatibilityDate: '2025-01-20',
  css: ['~/assets/css/main.css'],
  future: {
    compatibilityVersion: 4,
  },
})
