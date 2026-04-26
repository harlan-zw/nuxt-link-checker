import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { markdownProcessor } from '../../../src/eslint/processor'

function makeMessage(overrides: Partial<Linter.LintMessage>): Linter.LintMessage {
  return {
    ruleId: null,
    severity: 2,
    message: '',
    line: 1,
    column: 1,
    nodeType: null,
    ...overrides,
  }
}

describe('markdownProcessor', () => {
  it('extracts markdown links into a virtual JS file', () => {
    const md = '# Title\n\n[Home](/home) and [About](/about)\n'
    const result = markdownProcessor.preprocess!(md, 'README.md')
    expect(result).toEqual([
      { text: 'navigateTo(\'/home\')\nnavigateTo(\'/about\')', filename: '0.js' },
    ])
    // drain stack
    markdownProcessor.postprocess!([[]], 'README.md')
  })

  it('returns no virtual files when there are no links', () => {
    const result = markdownProcessor.preprocess!('# No links here\n', 'README.md')
    expect(result).toEqual([])
    markdownProcessor.postprocess!([[]], 'README.md')
  })

  it('filters out messages from rules outside this plugin', () => {
    markdownProcessor.preprocess!('[Home](/home)\n', 'README.md')
    const messages = markdownProcessor.postprocess!([[
      makeMessage({ ruleId: '@stylistic/semi', message: 'Missing semicolon.', line: 1, column: 20 }),
      makeMessage({ ruleId: '@stylistic/eol-last', message: 'Newline required at end of file.', line: 1, column: 20 }),
      makeMessage({ ruleId: 'nuxt-link-checker/valid-route', message: 'Invalid route.', line: 1, column: 1 }),
    ]], 'README.md')
    expect(messages).toHaveLength(1)
    expect(messages[0]!.ruleId).toBe('nuxt-link-checker/valid-route')
  })

  it('filters out messages with no ruleId (e.g. parsing errors on the synthetic file)', () => {
    markdownProcessor.preprocess!('[Home](/home)\n', 'README.md')
    const messages = markdownProcessor.postprocess!([[
      makeMessage({ ruleId: null, message: 'Parsing error.', line: 1, column: 1 }),
    ]], 'README.md')
    expect(messages).toEqual([])
  })

  it('keeps own-rule messages regardless of plugin namespace prefix', () => {
    markdownProcessor.preprocess!('[Home](/home)\n', 'README.md')
    const messages = markdownProcessor.postprocess!([[
      makeMessage({ ruleId: 'link-checker/valid-route', line: 1, column: 1 }),
      makeMessage({ ruleId: 'link-checker/valid-sitemap-link', line: 1, column: 1 }),
      makeMessage({ ruleId: 'valid-route', line: 1, column: 1 }),
    ]], 'README.md')
    expect(messages.map(m => m.ruleId)).toEqual([
      'link-checker/valid-route',
      'link-checker/valid-sitemap-link',
      'valid-route',
    ])
  })

  it('remaps virtual line/column back to the original markdown location', () => {
    const md = '# Title\n\nSome text [About](/about) here.\n'
    markdownProcessor.preprocess!(md, 'README.md')
    const messages = markdownProcessor.postprocess!([[
      makeMessage({ ruleId: 'nuxt-link-checker/valid-route', message: 'Invalid route.', line: 1, column: 12 }),
    ]], 'README.md')
    expect(messages).toHaveLength(1)
    expect(messages[0]!.line).toBe(3)
    expect(messages[0]!.column).toBe(18)
  })
})
