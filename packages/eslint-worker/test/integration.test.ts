import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createESLintWorker } from '../src/controller'

// This test requires a real ESLint installation
describe('eslint Worker Integration', () => {
  let tempDir: string
  let testFilePath: string
  let worker: any

  // Create a temporary file for ESLint to analyze
  beforeAll(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-worker-test-'))

    // Create test file with linting errors
    testFilePath = path.join(tempDir, 'test-file.js')
    await fs.writeFile(testFilePath, `
      // This file has linting errors
      const foo = 'bar'   // Extra spaces

      function hello() {
        console.log('Hello World');  // Semicolon when it should use none
        return 42
      }

      // No newline at end of file
    `)

    // Initialize worker with ESLint configuration
    worker = createESLintWorker({
      cache: false,
      fix: false,
      useEslintrc: false,
      overrideConfig: {
        rules: {
          'semi': ['error', 'never'],
          'no-console': ['warn'],
          'eol-last': ['error'],
          'no-trailing-spaces': ['error'],
        },
      },
    })
  })

  afterAll(async () => {
    // Clean up resources
    if (worker) {
      await worker.terminate()
    }

    // Clean up temp directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('should lint a file and return results', async () => {
    // Run lint on the test file
    const results = await worker.lintFiles(testFilePath)

    // Assertions
    expect(results).toBeDefined()
    expect(results.results).toBeDefined()
    expect(results.results.length).toBe(1)

    // Check that we detected the expected errors
    const messages = results.results[0].messages

    // Should find the semicolon error
    expect(messages.some((msg: any) =>
      msg.ruleId === 'semi' && msg.line === 6)).toBe(true)

    // Should find the console.log warning
    expect(messages.some((msg: any) =>
      msg.ruleId === 'no-console' && msg.line === 6)).toBe(true)

    // Should find trailing spaces
    expect(messages.some((msg: any) =>
      msg.ruleId === 'no-trailing-spaces')).toBe(true)

    // Should find missing newline at end of file
    expect(messages.some((msg: any) =>
      msg.ruleId === 'eol-last')).toBe(true)
  })

  it('should fix linting errors when fix option is enabled', async () => {
    // Create a copy of the file for fixing
    const fixableFilePath = path.join(tempDir, 'fixable-file.js')
    await fs.copyFile(testFilePath, fixableFilePath)

    // Create a new worker with fix enabled
    const fixWorker = createESLintWorker({
      cache: false,
      fix: true,
      useEslintrc: false,
      overrideConfig: {
        rules: {
          'semi': ['error', 'never'],
          'no-console': ['warn'],
          'eol-last': ['error'],
          'no-trailing-spaces': ['error'],
        },
      },
    })

    try {
      // Lint and fix the file
      await fixWorker.lintFiles(fixableFilePath)

      // Read file content after fixing
      const content = await fs.readFile(fixableFilePath, 'utf-8')

      // Check if fixes were applied
      expect(content).not.toContain(');') // semicolons should be removed
      expect(content.endsWith('\n')).toBe(true) // should have newline at end

      // Extra spaces should be removed
      const lines = content.split('\n')
      for (const line of lines) {
        if (line.includes('foo =')) {
          expect(line.includes('bar')).toBe(false) // No extra spaces
        }
      }
    }
    finally {
      await fixWorker.terminate()
    }
  })

  it('should handle multiple files', async () => {
    // Create a second test file
    const secondFilePath = path.join(tempDir, 'second-file.js')
    await fs.writeFile(secondFilePath, `
      // This is a second file
      const bar = "baz"  // Using double quotes instead of single

      if (bar) {
          console.log(bar)  // Over-indented line
      }
    `)

    // Lint both files
    const results = await worker.lintFiles([testFilePath, secondFilePath])

    // Assertions
    expect(results).toBeDefined()
    expect(results.results).toBeDefined()
    expect(results.results.length).toBe(2)

    // Verify that results contain both files
    const filePaths = results.results.map((result: any) => result.filePath)
    expect(filePaths).toContain(testFilePath)
    expect(filePaths).toContain(secondFilePath)
  })
})
