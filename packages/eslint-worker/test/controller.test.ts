import { Worker } from 'node:worker_threads'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createESLintWorker } from '../dist/controller.mjs'

// Mock Worker
vi.mock('node:worker_threads', () => {
  const EventEmitter = require('node:events')

  return {
    Worker: vi.fn().mockImplementation(() => {
      const worker = new EventEmitter()
      worker.terminate = vi.fn().mockResolvedValue(undefined)
      worker.postMessage = vi.fn()
      return worker
    }),
    isMainThread: true,
    parentPort: null,
    workerData: {},
  }
})

describe('eSLintWorkerController', () => {
  let controller: ESLintWorkerController
  let workerInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    controller = createESLintWorker()
    workerInstance = (Worker as unknown as jest.Mock).mock.results[0].value
  })

  afterEach(async () => {
    await controller.terminate()
  })

  it('should create a worker with the correct options', () => {
    expect(Worker).toHaveBeenCalled()
    expect(workerInstance).toBeDefined()
  })

  it('should emit ready when worker signals ready', async () => {
    const readyPromise = controller.ensureReady()

    // Simulate worker sending ready message
    workerInstance.emit('message', { type: 'ready' })

    await expect(readyPromise).resolves.toBeUndefined()
  })

  it('should send lint request to worker', async () => {
    // Mark controller as ready
    workerInstance.emit('message', { type: 'ready' })

    // Call lintFiles
    const lintPromise = controller.lintFiles('/path/to/file.js')

    // Verify postMessage was called with correct arguments
    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      type: 'lint',
      id: 0,
      files: '/path/to/file.js',
    })

    // Simulate response from worker
    const mockResults = { formattedText: 'ESLint results' }
    workerInstance.emit('message', {
      type: 'result',
      id: 0,
      data: mockResults,
    })

    // Check result
    await expect(lintPromise).resolves.toEqual(mockResults)
  })

  it('should handle array of files', async () => {
    // Mark controller as ready
    workerInstance.emit('message', { type: 'ready' })

    // Call lintFiles with array
    controller.lintFiles(['/path/to/file1.js', '/path/to/file2.js'])

    // Verify worker received array of files
    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      type: 'lint',
      id: 0,
      files: ['/path/to/file1.js', '/path/to/file2.js'],
    })
  })

  it('should handle errors from worker', async () => {
    // Mark controller as ready
    workerInstance.emit('message', { type: 'ready' })

    // Call lintFiles
    const lintPromise = controller.lintFiles('/path/to/file.js')

    // Simulate error response
    workerInstance.emit('message', {
      type: 'error',
      id: 0,
      error: 'ESLint error message',
    })

    // Check that error is returned
    await expect(lintPromise).resolves.toEqual({ error: 'ESLint error message' })
  })

  it('should terminate worker', async () => {
    await controller.terminate()
    expect(workerInstance.terminate).toHaveBeenCalled()
  })

  it('should handle multiple concurrent lint requests', async () => {
    // Mark controller as ready
    workerInstance.emit('message', { type: 'ready' })

    // Call lintFiles multiple times
    const promise1 = controller.lintFiles('/path/to/file1.js')
    const promise2 = controller.lintFiles('/path/to/file2.js')

    // Verify correct messages sent to worker
    expect(workerInstance.postMessage).toHaveBeenCalledTimes(2)
    expect(workerInstance.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'lint',
      id: 0,
      files: '/path/to/file1.js',
    })
    expect(workerInstance.postMessage).toHaveBeenNthCalledWith(2, {
      type: 'lint',
      id: 1,
      files: '/path/to/file2.js',
    })

    // Simulate responses
    workerInstance.emit('message', {
      type: 'result',
      id: 0,
      data: { result: 'file1 results' },
    })
    workerInstance.emit('message', {
      type: 'result',
      id: 1,
      data: { result: 'file2 results' },
    })

    // Check results
    await expect(promise1).resolves.toEqual({ result: 'file1 results' })
    await expect(promise2).resolves.toEqual({ result: 'file2 results' })
  })

  it('should pass custom options to worker', () => {
    const customOptions = {
      fix: true,
      cache: false,
      formatter: 'json',
    }

    // Create controller with custom options
    new ESLintWorkerController(customOptions)

    // Get the most recent Worker constructor call
    const workerCall = (Worker as unknown as jest.Mock).mock.calls.at(-1)

    // Verify options were passed to worker
    expect(workerCall[1].workerData.options).toMatchObject(customOptions)
  })
})
