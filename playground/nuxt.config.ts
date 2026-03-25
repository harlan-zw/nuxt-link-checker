import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../src/module',
    '@nuxtjs/sitemap',
    '@nuxt/content',
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
      crawlLinks: true,
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
    debug: true,
    report: {
      html: true,
      markdown: true,
      json: true,
      publish: true,
    },
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-07-16',
})
