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

describe('link-ascii-only', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-ascii-only', rule, {
      valid: [
        // Valid <a> tags with ASCII characters
        '<template><a href="/valid-link">Valid Link</a></template>',
        '<template><a href="/valid-link-with-dashes?param=value">Valid Link</a></template>',
        '<template><a href="/valid-path#fragment">Valid Link</a></template>',

        // Valid NuxtLink with to prop
        '<template><NuxtLink to="/valid-link">Valid Link</NuxtLink></template>',

        // Valid NuxtLink with href prop
        '<template><NuxtLink href="/valid-link">Valid Link</NuxtLink></template>',

        // Should ignore other elements
        '<template><div to="/with-non-ascii-café">Not a link</div></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic link</NuxtLink></template>',
        '<template><a :href="dynamicPath">Dynamic link</a></template>',
      ],
      invalid: [
        // Invalid <a> tags with non-ASCII characters
        {
          code: '<template><a href="/café">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/caf%C3%A9">Invalid Link</a></template>',
        },

        // Invalid NuxtLink with non-ASCII characters in to prop
        {
          code: '<template><NuxtLink to="/página">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink to="/p%C3%A1gina">Invalid Link</NuxtLink></template>',
        },

        // Invalid NuxtLink with non-ASCII characters in href prop
        {
          code: '<template><NuxtLink href="/über">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink href="/%C3%BCber">Invalid Link</NuxtLink></template>',
        },

        // Non-ASCII in query parameters
        {
          code: '<template><a href="/path?search=café">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path?search=caf%C3%A9">Invalid Link</a></template>',
        },

        // Non-ASCII in hash fragment
        {
          code: '<template><a href="/path#sección">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path#secci%C3%B3n">Invalid Link</a></template>',
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-ascii-only', rule, {
      valid: [
        // Valid <a> tags with ASCII characters
        '<a href="/valid-link">Valid Link</a>',
        '<a href="/valid-link-with-dashes?param=value">Valid Link</a>',
        '<a href="/valid-path#fragment">Valid Link</a>',

        // Should ignore other elements
        '<div to="/with-non-ascii-café">Not a link</div>',
      ],
      invalid: [
        // Invalid <a> tags with non-ASCII characters
        {
          code: '<a href="/café">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/caf%C3%A9">Invalid Link</a>',
        },

        // Non-ASCII in query parameters
        {
          code: '<a href="/path?search=café">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path?search=caf%C3%A9">Invalid Link</a>',
        },

        // Non-ASCII in hash fragment
        {
          code: '<a href="/path#sección">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path#secci%C3%B3n">Invalid Link</a>',
        },
      ],
    })
  })
})
