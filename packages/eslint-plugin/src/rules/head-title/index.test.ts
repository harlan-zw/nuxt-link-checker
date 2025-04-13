import htmlParser from '@html-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import { rule } from './index'

const htmlRuleTester = new RuleTester({
  languageOptions: {
    parser: htmlParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

describe('head-title', () => {
  it('html validates successfully', () => {
    htmlRuleTester.run('head-title', rule, {
      valid: [
        // Valid HTML with title tag
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Page Title</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,

        // Title with content
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>My Website</title>
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,
      ],
      invalid: [
        // Missing title tag
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'missing' }],
        },
        // Empty title tag
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title></title>
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'empty' }],
        },
        // Title with only whitespace
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>   </title>
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'empty' }],
        },
      ],
    })
  })
})
