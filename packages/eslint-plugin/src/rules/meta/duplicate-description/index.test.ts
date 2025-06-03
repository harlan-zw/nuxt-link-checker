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
  settings: {
    descriptions: {
      'This description is duplicated across multiple pages': 2,
      'This is a unique description for this page': 1,
    },
  },
})

describe('duplicate-description', () => {
  it('html validates successfully', () => {
    htmlRuleTester.run('duplicate-description', rule, {
      valid: [
        // Valid HTML with unique description
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="This is a unique description for this page">
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,
      ],
      invalid: [
        // Duplicate description
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>My Page Title</title>
            <meta name="description" content="This description is duplicated across multiple pages">
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'duplicate', data: { count: 1 } }],
        },
      ],
    })
  })
})
