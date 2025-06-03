import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBatcher,
  runParallel,
  throttle,
} from '../../src/lib/concurrency'

describe('concurrency', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('runParallel', () => {
    it('processes all inputs with specified concurrency', async () => {
      const inputs = new Set([1, 2, 3, 4, 5])
      const results: number[] = []
      const processingTimes: number[] = []

      const cb = vi.fn(async (input: number) => {
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 100))
        processingTimes.push(Date.now() - start)
        results.push(input)
      })

      const promise = runParallel(inputs, cb, { concurrency: 2 })

      // Advance timers to complete all tasks
      await vi.advanceTimersByTimeAsync(300)
      await promise

      expect(cb).toHaveBeenCalledTimes(5)
      expect(results).toHaveLength(5)
      expect(new Set(results)).toEqual(new Set([1, 2, 3, 4, 5]))
    })

    it('respects concurrency limits', async () => {
      const inputs = new Set([1, 2, 3, 4])
      let currentlyRunning = 0
      let maxConcurrent = 0

      const cb = vi.fn(async (input: number) => {
        currentlyRunning++
        maxConcurrent = Math.max(maxConcurrent, currentlyRunning)
        await new Promise(resolve => setTimeout(resolve, 100))
        currentlyRunning--
      })

      const promise = runParallel(inputs, cb, { concurrency: 2 })

      await vi.advanceTimersByTimeAsync(250)
      await promise

      expect(maxConcurrent).toBe(2)
    })

    it('adds intervals between task starts when specified', async () => {
      const inputs = new Set([1, 2])
      const executionOrder: number[] = []

      const cb = vi.fn(async (input: number) => {
        executionOrder.push(input)
      })

      const promise = runParallel(inputs, cb, { concurrency: 2, interval: 100 })

      await vi.advanceTimersByTimeAsync(200)
      await promise

      expect(cb).toHaveBeenCalledTimes(2)
      expect(executionOrder).toHaveLength(2)
      // With interval specified, the function should be called with proper timing
      expect(cb).toHaveBeenCalledWith(1)
      expect(cb).toHaveBeenCalledWith(2)
    })

    it('handles errors without stopping other tasks', async () => {
      const inputs = new Set([1, 2, 3, 4])
      const results: number[] = []
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const cb = vi.fn(async (input: number) => {
        if (input === 2) {
          throw new Error('Test error')
        }
        await new Promise(resolve => setTimeout(resolve, 50))
        results.push(input)
      })

      const promise = runParallel(inputs, cb, { concurrency: 2 })

      await vi.advanceTimersByTimeAsync(150)
      await promise

      expect(cb).toHaveBeenCalledTimes(4)
      expect(results).toEqual([1, 3, 4])
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('does not modify the original input set', async () => {
      const inputs = new Set([1, 2, 3])
      const originalSize = inputs.size

      const cb = vi.fn(async (input: number) => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      const promise = runParallel(inputs, cb, { concurrency: 2 })

      await vi.advanceTimersByTimeAsync(50)
      await promise

      expect(inputs.size).toBe(originalSize)
      expect(inputs.has(1)).toBe(true)
      expect(inputs.has(2)).toBe(true)
      expect(inputs.has(3)).toBe(true)
    })

    it('handles empty input set', async () => {
      const inputs = new Set<number>()
      const cb = vi.fn()

      await runParallel(inputs, cb, { concurrency: 2 })

      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('throttle', () => {
    it('limits execution rate to specified interval', async () => {
      const fn = vi.fn(() => 'result')
      const throttledFn = throttle(fn, 100)

      // First call should execute immediately
      const promise1 = throttledFn()
      await promise1
      expect(fn).toHaveBeenCalledTimes(1)

      // Second call should wait 100ms from first execution
      const promise2 = throttledFn()
      await vi.advanceTimersByTimeAsync(100)
      await promise2
      expect(fn).toHaveBeenCalledTimes(2)

      // Third call should wait another 100ms from second execution
      const promise3 = throttledFn()
      await vi.advanceTimersByTimeAsync(100)
      await promise3
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('preserves function arguments and return value', async () => {
      const fn = vi.fn((a: number, b: string) => `${a}-${b}`)
      const throttledFn = throttle(fn, 50)

      const result = await throttledFn(42, 'test')

      expect(fn).toHaveBeenCalledWith(42, 'test')
      expect(result).toBe('42-test')
    })

    it('allows immediate execution if enough time has passed', async () => {
      const fn = vi.fn(() => 'result')
      const throttledFn = throttle(fn, 100)

      await throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)

      // Advance time beyond the interval
      await vi.advanceTimersByTimeAsync(150)

      await throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('createBatcher', () => {
    it('processes items in batches of specified size', async () => {
      const processor = vi.fn(async (batch: number[]) =>
        batch.map(n => n * 2),
      )
      const batcher = createBatcher(processor, 3, 1000)

      const promise1 = batcher.add(1)
      const promise2 = batcher.add(2)
      const promise3 = batcher.add(3)

      // Should process immediately when batch size is reached
      await vi.advanceTimersByTimeAsync(0)

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith([1, 2, 3])
      expect([result1, result2, result3]).toEqual([2, 4, 6])

      batcher.destroy()
    })

    it('flushes partial batches after timeout', async () => {
      const processor = vi.fn(async (batch: number[]) =>
        batch.map(n => n * 2),
      )
      const batcher = createBatcher(processor, 5, 500)

      const promise1 = batcher.add(1)
      const promise2 = batcher.add(2)

      // Should not process immediately (batch not full)
      await vi.advanceTimersByTimeAsync(0)
      expect(processor).not.toHaveBeenCalled()

      // Should process after flush interval
      await vi.advanceTimersByTimeAsync(500)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith([1, 2])
      expect([result1, result2]).toEqual([2, 4])

      batcher.destroy()
    })

    it('handles multiple batches correctly', async () => {
      const processor = vi.fn(async (batch: number[]) =>
        batch.map(n => n * 2),
      )
      const batcher = createBatcher(processor, 2, 1000)

      // First batch
      const promise1 = batcher.add(1)
      const promise2 = batcher.add(2)

      await vi.advanceTimersByTimeAsync(0)

      // Second batch
      const promise3 = batcher.add(3)
      const promise4 = batcher.add(4)

      await vi.advanceTimersByTimeAsync(0)

      const results = await Promise.all([promise1, promise2, promise3, promise4])

      expect(processor).toHaveBeenCalledTimes(2)
      expect(processor).toHaveBeenNthCalledWith(1, [1, 2])
      expect(processor).toHaveBeenNthCalledWith(2, [3, 4])
      expect(results).toEqual([2, 4, 6, 8])

      batcher.destroy()
    })

    it('handles processor errors correctly', async () => {
      const processor = vi.fn(async () => {
        throw new Error('Processing failed')
      })
      const batcher = createBatcher(processor, 2, 1000)

      // Add items and immediately handle the promises to avoid unhandled rejections
      const promise1 = batcher.add(1).catch(err => ({ error: err.message }))
      const promise2 = batcher.add(2).catch(err => ({ error: err.message }))

      await vi.advanceTimersByTimeAsync(0)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toEqual({ error: 'Processing failed' })
      expect(result2).toEqual({ error: 'Processing failed' })
      expect(processor).toHaveBeenCalledWith([1, 2])

      batcher.destroy()
    })

    it('can be manually flushed', async () => {
      const processor = vi.fn(async (batch: number[]) =>
        batch.map(n => n * 2),
      )
      const batcher = createBatcher(processor, 5, 1000)

      const promise1 = batcher.add(1)
      const promise2 = batcher.add(2)

      // Manual flush
      await batcher.flush()

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(processor).toHaveBeenCalledWith([1, 2])
      expect([result1, result2]).toEqual([2, 4])

      batcher.destroy()
    })

    it('rejects pending items when destroyed', async () => {
      const processor = vi.fn()
      const batcher = createBatcher(processor, 5, 1000)

      const promise1 = batcher.add(1)
      const promise2 = batcher.add(2)

      batcher.destroy()

      await expect(promise1).rejects.toThrow('Batcher destroyed')
      await expect(promise2).rejects.toThrow('Batcher destroyed')
    })
  })
})
