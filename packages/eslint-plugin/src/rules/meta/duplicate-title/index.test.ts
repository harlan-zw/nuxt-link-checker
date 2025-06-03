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
    titles: {
      'Duplicate Title': 2,
      'Unique Title': 1,
    },
  },
})

describe('duplicate-title', () => {
  it('html validates successfully', () => {
    htmlRuleTester.run('duplicate-title', rule, {
      valid: [
        // Valid HTML with unique title
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Unique Title</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,
      ],
      invalid: [
        // Duplicate title
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>Duplicate Title</title>
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
