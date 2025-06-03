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

describe('meta-description', () => {
  it('html validates successfully', () => {
    htmlRuleTester.run('meta-description', rule, {
      valid: [
        // Valid HTML with meta description tag
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="This is a description of the page">
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,

        // Meta description in different position
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>My Website</title>
          <meta name="description" content="A website about interesting things">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>`,
      ],
      invalid: [
        // Missing meta description tag
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>My Page Title</title>
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'missing' }],
        },
        // Empty meta description content
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>My Page Title</title>
            <meta name="description" content="">
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>Content</h1>
          </body>
          </html>`,
          errors: [{ messageId: 'empty' }],
        },
        // Meta description with only whitespace
        {
          code: `<!DOCTYPE html>
          <html>
          <head>
            <title>My Page Title</title>
            <meta name="description" content="   ">
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
