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

describe('link-lowercase', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-lowercase', rule, {
      valid: [
        // Valid <a> tags with lowercase characters
        '<template><a href="/valid-link">Valid Link</a></template>',
        '<template><a href="/valid-link-with-dashes?param=value">Valid Link</a></template>',
        '<template><a href="/valid-path#fragment">Valid Link</a></template>',

        // Valid NuxtLink with to prop
        '<template><NuxtLink to="/valid-link">Valid Link</NuxtLink></template>',

        // Valid NuxtLink with href prop
        '<template><NuxtLink href="/valid-link">Valid Link</NuxtLink></template>',

        // Should ignore other elements
        '<template><div to="/with-Uppercase">Not a link</div></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic link</NuxtLink></template>',
        '<template><a :href="dynamicPath">Dynamic link</a></template>',
      ],
      invalid: [
        // Invalid <a> tags with uppercase characters
        {
          code: '<template><a href="/About-Us">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/about-us">Invalid Link</a></template>',
        },

        // Invalid NuxtLink with uppercase characters in to prop
        {
          code: '<template><NuxtLink to="/Contact">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink to="/contact">Invalid Link</NuxtLink></template>',
        },

        // Invalid NuxtLink with uppercase characters in href prop
        {
          code: '<template><NuxtLink href="/Blog/Posts">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink href="/blog/posts">Invalid Link</NuxtLink></template>',
        },

        // Uppercase in query parameters
        {
          code: '<template><a href="/path?Search=value">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path?search=value">Invalid Link</a></template>',
        },

        // Uppercase in hash fragment
        {
          code: '<template><a href="/path#Section">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path#section">Invalid Link</a></template>',
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-lowercase', rule, {
      valid: [
        // Valid <a> tags with lowercase characters
        '<a href="/valid-link">Valid Link</a>',
        '<a href="/valid-link-with-dashes?param=value">Valid Link</a>',
        '<a href="/valid-path#fragment">Valid Link</a>',

        // Should ignore other elements
        '<div to="/with-Uppercase">Not a link</div>',
      ],
      invalid: [
        // Invalid <a> tags with uppercase characters
        {
          code: '<a href="/About-Us">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/about-us">Invalid Link</a>',
        },

        // Uppercase in query parameters
        {
          code: '<a href="/path?Search=value">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path?search=value">Invalid Link</a>',
        },

        // Uppercase in hash fragment
        {
          code: '<a href="/path#Section">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path#section">Invalid Link</a>',
        },

        // Multiple uppercase segments
        {
          code: '<a href="/Blog/Posts">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/blog/posts">Invalid Link</a>',
        },
      ],
    })
  })
})
