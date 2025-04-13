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

describe('link-requires-href', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-requires-href', rule, {
      valid: [
        // Valid <a> tags with href attribute
        '<template><a href="/path">Valid Link</a></template>',
        '<template><a href="#">Valid Link with hash</a></template>',

        // Dynamic href is also valid
        '<template><a :href="dynamicPath">Valid Link</a></template>',
        '<template><a v-bind:href="dynamicPath">Valid Link V-Bind</a></template>',

        // Adding role="button" differently
        '<template><a role="button" href="#" @click="handleClick">Button</a></template>',

        // Other elements shouldn't trigger this rule
        '<template><div>Not a link</div></template>',
        '<template><button>Not a link</button></template>',

        '<template><a role="button" @click="handleClick">Button</a></template>',
      ],
      invalid: [
        // <a> tag without href or role="button"
        {
          code: '<template><a>Missing href</a></template>',
          errors: [{ messageId: 'default' }],
        },

        // <a> tag with other attributes but no href
        {
          code: '<template><a class="link" @click="handleClick">Missing href</a></template>',
          errors: [{ messageId: 'default' }],
        },

        // <a> tag with role that is not "button" and no href
        {
          code: '<template><a role="navigation">Missing href</a></template>',
          errors: [{ messageId: 'default' }],
        },
        {
          code: '<template><NuxtLink>Missing href</NuxtLink></template>',
          errors: [{ messageId: 'default' }],
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-requires-href', rule, {
      valid: [
        // Valid <a> tags with href attribute
        '<a href="/path">Valid Link</a>',
        '<a href="#">Valid Link with hash</a>',
        // '<a href="">Valid Link with empty href</a>',

        // Adding role="button" as exception
        '<a role="button" href="#" onclick="handleClick()">Button</a>',

        // Other elements shouldn't trigger this rule
        '<div>Not a link</div>',
        '<button>Not a link</button>',

        // Role button is valid without href
        '<a role="button" onclick="handleClick()">Button</a>',
      ],
      invalid: [
        // <a> tag without href or role="button"
        {
          code: '<a>Missing href</a>',
          errors: [{ messageId: 'default' }],
        },

        // <a> tag with other attributes but no href
        {
          code: '<a class="link" onclick="handleClick()">Missing href</a>',
          errors: [{ messageId: 'default' }],
        },

        // <a> tag with role that is not "button" and no href
        {
          code: '<a role="navigation">Missing href</a>',
          errors: [{ messageId: 'default' }],
        },
      ],
    })
  })
})
