# ESLint Worker for Nuxt Analyze

This package provides a Node.js worker implementation for running ESLint in a separate thread, which improves performance by offloading linting work from the main thread.

## Features

- Run ESLint in a separate worker thread to avoid blocking the main thread
- Support for all ESLint configuration options
- Customizable output formatting
- Optional automatic fixing of linting issues
- Simple Promise-based API

## Installation

```bash
# npm
npm install nuxt-analyze-eslint-worker eslint

# yarn
yarn add nuxt-analyze-eslint-worker eslint

# pnpm
pnpm add nuxt-analyze-eslint-worker eslint
```

## Usage

### Basic Usage

```javascript
import { createESLintWorker } from 'nuxt-analyze-eslint-worker/controller'

async function lintFiles() {
  // Create a worker with options
  const worker = createESLintWorker({
    cache: true,
    fix: false,
    // Any ESLint options can be provided here
    useEslintrc: true,
  })

  try {
    // Lint a single file
    const results = await worker.lintFiles('/path/to/your/file.js')
    console.log('Lint results:', results)

    // Or lint multiple files
    const multiResults = await worker.lintFiles([
      '/path/to/file1.js',
      '/path/to/file2.js',
    ])
    console.log('Multiple file results:', multiResults)
  }
  finally {
    // Always terminate the worker when done
    await worker.terminate()
  }
}

lintFiles().catch(console.error)
```

### With Custom ESLint Configuration

```javascript
import { createESLintWorker } from 'nuxt-analyze-eslint-worker/controller'

const worker = createESLintWorker({
  // ESLint instance options
  cache: true,
  fix: true, // Auto-fix issues
  useEslintrc: false, // Don't use .eslintrc files

  // Provide custom configuration
  overrideConfig: {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
    },
  },

  // Use a custom formatter
  formatter: 'json',
})

async function run() {
  try {
    const results = await worker.lintFiles('src/**/*.ts')
    console.log(JSON.stringify(results, null, 2))
  }
  finally {
    await worker.terminate()
  }
}

run().catch(console.error)
```

## API

### `createESLintWorker(options)`

Creates a new ESLint worker controller.

**Parameters:**
- `options` (optional): An object containing ESLint configuration options

**Returns:**
- An `ESLintWorkerController` instance

### ESLintWorkerController Methods

#### `lintFiles(files, options)`

Lints the specified files.

**Parameters:**
- `files`: A string or array of strings with file paths to lint
- `options` (optional): Override ESLint options for this specific lint operation

**Returns:**
- A Promise that resolves to the lint results

#### `ensureReady()`

Ensures the worker is ready before proceeding.

**Returns:**
- A Promise that resolves when the worker is ready

#### `terminate()`

Terminates the worker thread.

**Returns:**
- A Promise that resolves when the worker has been terminated

## License

MIT
