import htmlParser from '@html-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import * as vueParser from 'vue-eslint-parser'
import { rule } from './index'

// Configure RuleTester with flat config style
const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

const htmlRuleTester = new RuleTester({
  languageOptions: {
    parser: htmlParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

describe('link-trailing-slash', () => {
  it('vue validates successfully with default options (no trailing slash)', () => {
    ruleTester.run('link-trailing-slash', rule, {
      valid: [
        // Valid <a> tags without trailing slash
        '<template><a href="/about">About</a></template>',
        '<template><a href="/products/1">Product</a></template>',

        // Valid NuxtLink with to prop
        '<template><NuxtLink to="/home">Home</NuxtLink></template>',

        // Valid RouterLink
        '<template><RouterLink to="/contact">Contact</RouterLink></template>',

        // Should ignore special URLs
        '<template><a href="https://example.com/">External</a></template>',
        '<template><a href="#section">Anchor</a></template>',
        '<template><a href="mailto:info@example.com">Email</a></template>',
        '<template><a href="tel:+1234567890">Call</a></template>',
        '<template><a href="/">Root</a></template>',
        '<template><a href="">Empty</a></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic</NuxtLink></template>',
        '<template><a :href="dynamicPath">Dynamic</a></template>',
      ],
      invalid: [
        // Invalid links with trailing slash when they shouldn't have one
        {
          code: '<template><a href="/about/">About</a></template>',
          errors: [{ messageId: 'removeTrailingSlash' }],
          output: '<template><a href="/about">About</a></template>',
        },
        {
          code: '<template><NuxtLink to="/home/">Home</NuxtLink></template>',
          errors: [{ messageId: 'removeTrailingSlash' }],
          output: '<template><NuxtLink to="/home">Home</NuxtLink></template>',
        },
        {
          code: '<template><RouterLink to="/contact/">Contact</RouterLink></template>',
          errors: [{ messageId: 'removeTrailingSlash' }],
          output: '<template><RouterLink to="/contact">Contact</RouterLink></template>',
        },
      ],
    })
  })

  it('vue validates successfully with requireTrailingSlash option', () => {
    ruleTester.run('link-trailing-slash', rule, {
      valid: [
        // Valid <a> tags with trailing slash
        {
          code: '<template><a href="/about/">About</a></template>',
          options: [{ requireTrailingSlash: true }],
        },
        {
          code: '<template><NuxtLink to="/home/">Home</NuxtLink></template>',
          options: [{ requireTrailingSlash: true }],
        },

        // Should ignore special URLs
        {
          code: '<template><a href="https://example.com">External</a></template>',
          options: [{ requireTrailingSlash: true }],
        },
        {
          code: '<template><a href="/">Root</a></template>',
          options: [{ requireTrailingSlash: true }],
        },
      ],
      invalid: [
        // Invalid links without trailing slash when they should have one
        {
          code: '<template><a href="/about">About</a></template>',
          options: [{ requireTrailingSlash: true }],
          errors: [{ messageId: 'addTrailingSlash' }],
          output: '<template><a href="/about/">About</a></template>',
        },
        {
          code: '<template><NuxtLink to="/home">Home</NuxtLink></template>',
          options: [{ requireTrailingSlash: true }],
          errors: [{ messageId: 'addTrailingSlash' }],
          output: '<template><NuxtLink to="/home/">Home</NuxtLink></template>',
        },
        {
          code: '<template><RouterLink to="/contact">Contact</RouterLink></template>',
          options: [{ requireTrailingSlash: true }],
          errors: [{ messageId: 'addTrailingSlash' }],
          output: '<template><RouterLink to="/contact/">Contact</RouterLink></template>',
        },
      ],
    })
  })

  it('html validates successfully with default options (no trailing slash)', () => {
    htmlRuleTester.run('link-trailing-slash', rule, {
      valid: [
        // Valid <a> tags without trailing slash
        '<a href="/about">About</a>',
        '<a href="/products/1">Product</a>',

        // Should ignore special URLs
        '<a href="https://example.com/">External</a>',
        '<a href="#section">Anchor</a>',
        '<a href="mailto:info@example.com">Email</a>',
        '<a href="tel:+1234567890">Call</a>',
        '<a href="/">Root</a>',
        '<a href="">Empty</a>',
      ],
      invalid: [
        // Invalid links with trailing slash when they shouldn't have one
        {
          code: '<a href="/about/">About</a>',
          errors: [{ messageId: 'removeTrailingSlash' }],
          output: '<a href="/about">About</a>',
        },
        {
          code: '<a href="/contact/">Contact</a>',
          errors: [{ messageId: 'removeTrailingSlash' }],
          output: '<a href="/contact">Contact</a>',
        },
      ],
    })
  })

  it('html validates successfully with requireTrailingSlash option', () => {
    htmlRuleTester.run('link-trailing-slash', rule, {
      valid: [
        // Valid <a> tags with trailing slash
        {
          code: '<a href="/about/">About</a>',
          options: [{ requireTrailingSlash: true }],
        },
        {
          code: '<a href="/products/1/">Product</a>',
          options: [{ requireTrailingSlash: true }],
        },

        // Should ignore special URLs
        {
          code: '<a href="https://example.com">External</a>',
          options: [{ requireTrailingSlash: true }],
        },
        {
          code: '<a href="/">Root</a>',
          options: [{ requireTrailingSlash: true }],
        },
      ],
      invalid: [
        // Invalid links without trailing slash when they should have one
        {
          code: '<a href="/about">About</a>',
          options: [{ requireTrailingSlash: true }],
          errors: [{ messageId: 'addTrailingSlash' }],
          output: '<a href="/about/">About</a>',
        },
        {
          code: '<a href="/contact">Contact</a>',
          options: [{ requireTrailingSlash: true }],
          errors: [{ messageId: 'addTrailingSlash' }],
          output: '<a href="/contact/">Contact</a>',
        },
      ],
    })
  })
})
