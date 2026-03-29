import { RuleTester } from 'eslint'
import { join } from 'pathe'
import { describe, it } from 'vitest'
import * as vueParser from 'vue-eslint-parser'
import rule from '../../../src/eslint/rules/valid-sitemap-link'

const routesFile = join(__dirname, '../../fixtures/eslint/routes.json')
const opts = { routesFile }
const vueCase = (code: string) => ({ code, filename: 'test.vue', options: [opts] })
const vueInvalid = (code: string) => ({ ...vueCase(code), errors: [{ messageId: 'notInSitemap' as const }] })

describe('valid-sitemap-link', () => {
  const vueTester = new RuleTester({
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  })

  const tsTester = new RuleTester({
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  })

  it('vue templates', () => {
    vueTester.run('valid-sitemap-link', rule, {
      valid: [
        vueCase('<template><NuxtLink to="/about" /></template>'),
        vueCase('<template><NuxtLink to="/blog/hello-world" /></template>'),
        vueCase('<template><a href="https://example.com" /></template>'),
        vueCase('<template><a href="#section" /></template>'),
        // trailing slash normalization
        vueCase('<template><NuxtLink to="/about/" /></template>'),
        vueCase('<template><NuxtLink to="/blog/hello-world/" /></template>'),
      ],
      invalid: [
        // /blog/unknown-slug matches dynamic route /blog/:slug
        // and other /blog/* URLs exist in sitemap, so this warns
        vueInvalid('<template><NuxtLink to="/blog/unknown-slug" /></template>'),
      ],
    })
  })

  it('ts/js navigateTo calls', () => {
    tsTester.run('valid-sitemap-link', rule, {
      valid: [
        { code: 'navigateTo("/about")', options: [opts] },
        { code: 'navigateTo("/contact")', options: [opts] },
      ],
      invalid: [
        { code: 'navigateTo("/blog/not-in-sitemap")', options: [opts], errors: [{ messageId: 'notInSitemap' }] },
      ],
    })
  })
})
