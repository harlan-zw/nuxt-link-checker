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

describe('link-no-whitespace', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-no-whitespace', rule, {
      valid: [
        // Valid <a> tags
        '<template><a href="/valid-link">Valid Link</a></template>',
        '<template><a href="/valid-link-with-dashes">Valid Link</a></template>',

        // Valid NuxtLink with to prop
        '<template><NuxtLink to="/valid-link">Valid Link</NuxtLink></template>',

        // Valid NuxtLink with href prop
        '<template><NuxtLink href="/valid-link">Valid Link</NuxtLink></template>',

        // Should ignore other elements
        '<template><div to="/with space">Not a link</div></template>',

        // Should ignore directives
        '<template><NuxtLink :to="dynamicPath">Dynamic link</NuxtLink></template>',
        '<template><a :href="dynamicPath">Dynamic link</a></template>',
      ],
      invalid: [
        // Invalid <a> tags with spaces
        {
          code: '<template><a href="/invalid link">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="/invalid%20link">Invalid Link</a></template>',
        },

        // Invalid NuxtLink with spaces in to prop
        {
          code: '<template><NuxtLink to="/page with spaces">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink to="/page%20with%20spaces">Invalid Link</NuxtLink></template>',
        },

        // Invalid NuxtLink with spaces in href prop
        {
          code: '<template><NuxtLink href="/another invalid">Invalid Link</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><NuxtLink href="/another%20invalid">Invalid Link</NuxtLink></template>',
        },

        // Leading/trailing whitespace
        {
          code: '<template><a href="  /path/with/spaces  ">Invalid Link</a></template>',
          errors: [{ messageId: 'default' }],
          output: '<template><a href="%20%20/path/with/spaces%20%20">Invalid Link</a></template>',
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-no-whitespace', rule, {
      valid: [
        // Valid <a> tags
        '<a href="/valid-link">Valid Link</a>',
        '<a href="/valid-link-with-dashes">Valid Link</a>',

        // Should ignore other elements
        '<div to="/with space">Not a link</div>',
      ],
      invalid: [
        // Invalid <a> tags with spaces
        {
          code: '<a href="/invalid link">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/invalid%20link">Invalid Link</a>',
        },

        // Multiple spaces
        {
          code: '<a href="/page with many spaces">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/page%20with%20many%20spaces">Invalid Link</a>',
        },

        // Leading/trailing whitespace
        {
          code: '<a href="  /path/with/spaces  ">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="%20%20/path/with/spaces%20%20">Invalid Link</a>',
        },

        // Spaces in query parameters
        {
          code: '<a href="/path?param name=value with spaces">Invalid Link</a>',
          errors: [{ messageId: 'default' }],
          output: '<a href="/path?param%20name=value%20with%20spaces">Invalid Link</a>',
        },
      ],
    })
  })
})
