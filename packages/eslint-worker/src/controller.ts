import type { ESLintPluginOptions, WorkerMessage } from './types'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Default ESLint worker options
 */
const defaultOptions: Partial<ESLintPluginOptions> = {
  cache: false,
  fix: false,
  eslintPath: 'eslint',
  formatter: 'json-with-metadata',
}

/**
 * ESLint Worker Controller
 * Manages communication with the ESLint worker thread
 */
export class ESLintWorkerController {
  private worker: Worker
  private terminated: boolean = false
  private alive: boolean = true
  private ready: boolean = false
  private readyPromise: Promise<void>
  private resolveReady!: () => void
  private messageHandlers: Map<string | number, (data: any) => void> = new Map()
  private messageCounter: number = 1

  /**
   * Create a new ESLint worker controller
   * @param options ESLint options
   */
  constructor(options: Partial<ESLintPluginOptions> = {}) {
    // Create ready promise
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve
    })

    // Merge default options with provided options
    const workerOptions = {
      ...defaultOptions,
      ...options,
    }

    console.log(workerOptions)

    // Create worker thread
    this.worker = new Worker(resolve(__dirname, 'index.mjs'), {
      workerData: { options: workerOptions },
      stdout: true,
      stderr: true,
    })
    this.worker.stdout?.on('data', (data) => {
      process.stdout.write(data)
    })

    this.worker.stderr?.on('data', (data) => {
      process.stderr.write(data)
    })

    // Set up message handling
    this.worker.on('message', this.handleWorkerMessage.bind(this))

    // Handle errors
    this.worker.on('error', (error) => {
      console.error('ESLint worker error:', error)
    })

    // Handle worker exit
    this.worker.on('exit', (code) => {
      if (!this.terminated) {
        if (code !== 0) {
          console.error(`ESLint worker stopped with exit code ${code}`)
        }
      }
      else {
        console.info('ESLint worker terminated gracefully')
      }
      this.alive = false
    })
  }

  /**
   * Handle messages from the worker thread
   * @param message Worker message
   */
  private handleWorkerMessage(message: WorkerMessage) {
    if (!message || typeof message !== 'object')
      return

    switch (message.type) {
      case 'ready':
        this.ready = true
        this.resolveReady()
        break

      case 'result':
        if (message.id && this.messageHandlers.has(message.id)) {
          const handler = this.messageHandlers.get(message.id)
          if (handler) {
            handler(message.data)
            this.messageHandlers.delete(message.id)
          }
        }
        break

      case 'error':
        const errorMessage = typeof message.error === 'string'
          ? message.error
          : message.error?.message || 'Unknown error'

        if (message.id && this.messageHandlers.has(message.id)) {
          const handler = this.messageHandlers.get(message.id)
          if (handler) {
            handler({ error: errorMessage })
            this.messageHandlers.delete(message.id)
          }
        }
        else {
          console.error('ESLint worker error:', errorMessage)
        }
        break
    }
  }

  /**
   * Check if the worker is ready
   */
  async ensureReady(): Promise<void> {
    if (!this.alive) {
      throw new Error('ESLint worker instance is not available.')
    }
    if (!this.ready) {
      await this.readyPromise
    }
  }

  /**
   * Lint files using the worker
   * @param files Files to lint
   * @param options Optional ESLint options override
   * @returns Lint results
   */
  async lintFiles(files: string | string[], options?: Partial<ESLintPluginOptions>): Promise<any> {
    await this.ensureReady()

    const messageId = this.messageCounter++

    return new Promise((resolve) => {
      this.messageHandlers.set(messageId, resolve)

      this.worker.postMessage({
        type: 'lint',
        id: messageId,
        files,
        options,
      })
    })
  }

  async lintText(text: string, filePath: string, options?: Partial<ESLintPluginOptions>): Promise<any> {
    await this.ensureReady()

    const messageId = this.messageCounter++

    return new Promise((resolve) => {
      this.messageHandlers.set(messageId, resolve)

      this.worker.postMessage({
        type: 'lint',
        id: messageId,
        filePath,
        text,
        options,
      })
    })
  }

  /**
   * Terminate the worker thread
   */
  async terminate(): Promise<void> {
    this.terminated = true
    await this.worker.terminate()
  }
}

/**
 * Create a new ESLint worker controller
 * @param options ESLint options
 * @returns ESLint worker controller
 */
export function createESLintWorker(options?: Partial<ESLintPluginOptions>): ESLintWorkerController {
  return new ESLintWorkerController(options)
}
