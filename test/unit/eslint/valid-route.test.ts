import { RuleTester } from 'eslint'
import { join } from 'pathe'
import { describe, it } from 'vitest'
import * as vueParser from 'vue-eslint-parser'
import rule from '../../../src/eslint/rules/valid-route'

const routesFile = join(__dirname, '../../fixtures/eslint/routes.json')
const vueOpts = { routesFile }
const vueCase = (code: string) => ({ code, filename: 'test.vue', options: [vueOpts] })
const vueInvalid = (code: string) => ({ ...vueCase(code), errors: [{ messageId: 'invalidRoute' as const }] })

describe('valid-route', () => {
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
    vueTester.run('valid-route', rule, {
      valid: [
        vueCase('<template><NuxtLink to="/about" /></template>'),
        vueCase('<template><NuxtLink to="/blog/hello-world" /></template>'),
        vueCase('<template><NuxtLink to="/blog/any-dynamic-slug" /></template>'),
        vueCase('<template><a href="https://example.com" /></template>'),
        vueCase('<template><a href="mailto:test@example.com" /></template>'),
        vueCase('<template><a href="#section" /></template>'),
        vueCase('<template><NuxtLink to="/users/123" /></template>'),
        vueCase('<template><NuxtLink to="/users/123/posts/456" /></template>'),
        vueCase('<template><NuxtLink to="/about?ref=home" /></template>'),
        vueCase('<template><NuxtLink to="/about#section" /></template>'),
        vueCase('<template><router-link to="/contact" /></template>'),
        vueCase('<template><NuxtLink :to="dynamicVar" /></template>'),
      ],
      invalid: [
        vueInvalid('<template><NuxtLink to="/abot" /></template>'),
        vueInvalid('<template><NuxtLink to="/nonexistent" /></template>'),
        vueInvalid('<template><a href="/missing-page" /></template>'),
        vueInvalid('<template><nuxt-link to="/abot" /></template>'),
      ],
    })
  })

  it('ts/js navigateTo and router calls', () => {
    tsTester.run('valid-route', rule, {
      valid: [
        { code: 'navigateTo("/about")', options: [vueOpts] },
        { code: 'navigateTo("/blog/some-slug")', options: [vueOpts] },
        { code: 'router.push("/contact")', options: [vueOpts] },
        { code: 'router.replace("/about")', options: [vueOpts] },
        { code: 'navigateTo("https://example.com")', options: [vueOpts] },
        { code: 'navigateTo(someVariable)', options: [vueOpts] },
      ],
      invalid: [
        { code: 'navigateTo("/abot")', options: [vueOpts], errors: [{ messageId: 'invalidRoute' }] },
        { code: 'router.push("/nonexistent")', options: [vueOpts], errors: [{ messageId: 'invalidRoute' }] },
      ],
    })
  })
})
