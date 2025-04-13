import type { ESLint } from 'eslint'
import type {
  ESLintInstance,
  ESLintPluginOptions,
} from '../types'
import { parentPort, workerData } from 'node:worker_threads'
import {
  initializeESLint,
} from './utils'

// Only run worker code if this is not the main thread
// Extract options from worker data
const options = workerData?.options as ESLintPluginOptions

// ESLint components to be initialized
let eslintInstance: ESLintInstance

// Initialize ESLint and required components
const initPromise = initializeESLint(options).then((result) => {
  eslintInstance = result.eslintInstance
  return result
})

// Listen for messages from the parent thread
parentPort?.on('message', async (message) => {
  console.log('[WORKER] got message', message)
  try {
    // Ensure ESLint is initialized before processing
    if (!eslintInstance)
      await initPromise

    // Handle different message types
    if (typeof message === 'string' || Array.isArray(message)) {
      // If message is a string or array, treat it as file(s) to lint
      const files = Array.isArray(message) ? message : [message]

      // Process files through ESLint
      const results = await eslintInstance.lintFiles(files)

      // Send results back to parent thread
      parentPort?.postMessage({ type: 'result', data: results })
    }
    else if (message && typeof message === 'object') {
      // Handle structured message objects
      if (message.type === 'lint') {
        let results: ESLint.LintResult[] = []
        if ('files' in message) {
          const files = Array.isArray(message.files) ? message.files : [message.files]
          results = await eslintInstance.lintFiles(files)
        }
        else if ('text' in message) {
          const text = Array.isArray(message.text) ? message.text : [message.text]
          results = await eslintInstance.lintText(text.join('\n'), {
            filePath: message.filePath,
            ...message.options,
          })
        }

        let formattedResults
        if (options.formatter) {
          const formatter = await eslintInstance.loadFormatter(options.formatter)
          formattedResults = JSON.parse(await formatter.format(results))
        }

        parentPort?.postMessage({
          type: 'result',
          id: message.id,
          data: formattedResults || results,
        })
      }
    }
  }
  catch (error) {
    // Handle errors and send them back to the parent thread
    parentPort?.postMessage({
      type: 'error',
      error: error instanceof Error
        ? { message: error.message, stack: error.stack }
        : String(error),
    })
  }
})

// Signal that worker is ready
parentPort?.postMessage({ type: 'ready' })
