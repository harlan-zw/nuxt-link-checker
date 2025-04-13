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

describe('link-descriptive-text', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-descriptive-text', rule, {
      valid: [
        // Links with descriptive text
        '<template><a href="/about">Learn more about our company</a></template>',
        '<template><a href="/products">Browse our products</a></template>',
        '<template><a href="/contact">Contact our support team</a></template>',

        // Text that might be confused with bad text but isn't exactly the same
        '<template><a href="/about">Learn more about accessibility</a></template>',
        '<template><a href="/guide">Click here for the best results</a></template>',

        // Non-link elements should be ignored
        '<template><div>click here</div></template>',
        '<template><button>here</button></template>',
      ],
      invalid: [
        // Missing text content
        {
          code: '<template><a href="/about"></a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'Missing link textContent, title or aria-label.' },
          }],
        },

        // Bad descriptive texts
        {
          code: '<template><a href="/about">click here</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'click here' },
          }],
        },
        {
          code: '<template><a href="/contact">here</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'here' },
          }],
        },
        {
          code: '<template><a href="/start">start</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'start' },
          }],
        },
        {
          code: '<template><a href="/blog">learn more</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'learn more' },
          }],
        },
        {
          code: '<template><a href="/products">more</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'more' },
          }],
        },
        {
          code: '<template><a href="/docs">this</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'this' },
          }],
        },
        {
          code: '<template><a href="/guide">click this</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'click this' },
          }],
        },
        {
          code: '<template><a href="/details">right here</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'right here' },
          }],
        },
        {
          code: '<template><a href="/info">go</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'go' },
          }],
        },

        // Case insensitivity check
        {
          code: '<template><a href="/blog">CLICK HERE</a></template>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'CLICK HERE' },
          }],
        },
      ],
    })
  })
  it('html validates successfully', () => {
    htmlRuleTester.run('link-descriptive-text', rule, {
      valid: [
        // Links with descriptive text
        '<a href="/about">Learn more about our company</a>',
        '<a href="/products">Browse our products</a>',
        '<a href="/contact">Contact our support team</a>',

        // Text that might be confused with bad text but isn't exactly the same
        '<a href="/about">Learn more about accessibility</a>',
        '<a href="/guide">Click here for the best results</a>',

        // Non-link elements should be ignored
        '<div>click here</div>',
        '<button>here</button>',
      ],
      invalid: [
        // Missing text content
        {
          code: '<a href="/about"></a>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'Missing link textContent, title or aria-label.' },
          }],
        },

        // Bad descriptive texts
        {
          code: '<div><a href="/about">click here</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'click here' },
          }],
        },
        {
          code: '<div><a href="/contact">here</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'here' },
          }],
        },
        {
          code: '<div><a href="/start">start</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'start' },
          }],
        },
        {
          code: '<div><a href="/blog">learn more</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'learn more' },
          }],
        },
        {
          code: '<div><a href="/products">more</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'more' },
          }],
        },
        {
          code: '<div><a href="/docs">this</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'this' },
          }],
        },
        {
          code: '<div><a href="/guide">click this</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'click this' },
          }],
        },
        {
          code: '<div><a href="/details">right here</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'right here' },
          }],
        },
        {
          code: '<div><a href="/info">go</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'go' },
          }],
        },

        // Case insensitivity check
        {
          code: '<div><a href="/blog">CLICK HERE</a></div>',
          errors: [{
            messageId: 'default',
            data: { textContent: 'CLICK HERE' },
          }],
        },
      ],
    })
  })
})
