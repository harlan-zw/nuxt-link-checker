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

describe('link-no-double-slashes', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-no-double-slashes', rule, {
      valid: [
        // Valid <a> tags with proper paths
        '<template><a href="/valid/link">Valid Link</a></template>',
        '<template><a href="/valid/link/with/segments">Valid Link</a></template>',
        '<template><a href="/">Valid root link</a></template>',

        // Valid protocol URLs (we don't modify these)
        '<template><a href="https://example.com/path">External link</a></template>',
        '<template><a href="http://example.com/path">External link</a></template>',

        // Valid protocol-relative URLs
        '<template><a href="//example.com">Protocol-relative link</a></template>',

        // Valid NuxtLink
        '<template><NuxtLink to="/valid/path">Valid Link</NuxtLink></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic link</NuxtLink></template>',

        '<template><a href="//path">Passes as domain</a></template>',
      ],
      invalid: [

        // Double slashes in the middle
        {
          code: '<template><a href="/path//to/page">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path/to/page">Invalid Link</a></template>',
        },

        // Multiple occurrences of double slashes
        {
          code: '<template><a href="/path//to///page">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/path/to/page">Invalid Link</a></template>',
        },

        // NuxtLink with double slashes
        {
          code: '<template><NuxtLink to="/about//us">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink to="/about/us">Invalid Link</NuxtLink></template>',
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-no-double-slashes', rule, {
      valid: [
        // Valid <a> tags with proper paths
        '<a href="/valid/link">Valid Link</a>',
        '<a href="/valid/link/with/segments">Valid Link</a>',
        '<a href="/">Valid root link</a>',

        // Valid protocol URLs (we don't modify these)
        '<a href="https://example.com/path">External link</a>',
        '<a href="http://example.com/path">External link</a>',

        // Valid protocol-relative URLs
        '<a href="//example.com">Protocol-relative link</a>',
      ],
      invalid: [

        // Double slashes in the middle
        {
          code: '<a href="/path//to/page">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path/to/page">Invalid Link</a>',
        },

        // Multiple occurrences of double slashes
        {
          code: '<a href="/path//to///page">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path/to/page">Invalid Link</a>',
        },
      ],
    })
  })
})
