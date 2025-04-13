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

describe('link-no-underscores', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-no-underscores', rule, {
      valid: [
        // Valid <a> tags with hyphens instead of underscores
        '<template><a href="/valid-link">Valid Link</a></template>',
        '<template><a href="/valid-link-with-dashes">Valid Link</a></template>',
        '<template><a href="/valid-path">Valid Link</a></template>',

        // Valid NuxtLink with to prop
        '<template><NuxtLink to="/valid-link">Valid Link</NuxtLink></template>',

        // Valid NuxtLink with href prop
        '<template><NuxtLink href="/valid-link">Valid Link</NuxtLink></template>',

        // External URLs should be ignored
        '<template><a href="https://example.com/valid_link">Valid External Link</a></template>',
        '<template><a href="//example.com/valid_link">Valid External Link</a></template>',

        // Should ignore other elements
        '<template><div to="/with_underscore">Not a link</div></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic link</NuxtLink></template>',
        '<template><a :href="dynamicPath">Dynamic link</a></template>',
      ],
      invalid: [
        // Invalid <a> tags with underscores
        {
          code: '<template><a href="/about_us">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/about-us">Invalid Link</a></template>',
        },

        // Invalid NuxtLink with underscores in to prop
        {
          code: '<template><NuxtLink to="/contact_form">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink to="/contact-form">Invalid Link</NuxtLink></template>',
        },

        // Invalid NuxtLink with underscores in href prop
        {
          code: '<template><NuxtLink href="/blog_posts">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink href="/blog-posts">Invalid Link</NuxtLink></template>',
        },

        // Multiple underscores
        {
          code: '<template><a href="/path_to_page">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path-to-page">Invalid Link</a></template>',
        },

        // Underscores in query parameters
        {
          code: '<template><a href="/path?param_name=value">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path?param-name=value">Invalid Link</a></template>',
        },

        // Underscores in hash fragment
        {
          code: '<template><a href="/path#section_title">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path#section-title">Invalid Link</a></template>',
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-no-underscores', rule, {
      valid: [
        // Valid <a> tags with hyphens instead of underscores
        '<a href="/valid-link">Valid Link</a>',
        '<a href="/valid-link-with-dashes">Valid Link</a>',
        '<a href="/valid-path">Valid Link</a>',

        // External URLs should be ignored
        '<a href="https://example.com/valid_link">Valid External Link</a>',
        '<a href="//example.com/valid_link">Valid External Link</a>',

        // Should ignore other elements
        '<div to="/with_underscore">Not a link</div>',
      ],
      invalid: [
        // Invalid <a> tags with underscores
        {
          code: '<a href="/about_us">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/about-us">Invalid Link</a>',
        },

        // Multiple underscores
        {
          code: '<a href="/path_to_page">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path-to-page">Invalid Link</a>',
        },

        // Underscores in query parameters
        {
          code: '<a href="/path?param_name=value">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path?param-name=value">Invalid Link</a>',
        },

        // Underscores in hash fragment
        {
          code: '<a href="/path#section_title">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path#section-title">Invalid Link</a>',
        },
      ],
    })
  })
})
