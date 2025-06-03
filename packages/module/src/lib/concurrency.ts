export interface ParallelExecutionOptions {
  concurrency: number
  interval?: number
}

/**
 * Executes a callback function for a set of inputs with controlled concurrency
 * and optional intervals between task starts.
 *
 * @param inputs - Set of inputs to process
 * @param cb - Callback function to execute for each input
 * @param opts - Options for concurrency control and intervals
 */
export async function runParallel<T>(
  inputs: Set<T>,
  cb: (input: T) => unknown | Promise<unknown>,
  opts: ParallelExecutionOptions,
): Promise<void> {
  const tasks = new Set<Promise<unknown>>()
  const inputsCopy = new Set(inputs) // Create a copy to avoid modifying the original

  function queueNext(): undefined | Promise<unknown> {
    const input = inputsCopy.values().next().value
    if (!input) {
      return
    }

    inputsCopy.delete(input)
    const task = (
      opts.interval
        ? new Promise(resolve => setTimeout(resolve, opts.interval))
        : Promise.resolve()
    )
      .then(() => cb(input))
      .catch((error) => {
        console.error(error)
      })

    tasks.add(task)
    return task.then(() => {
      tasks.delete(task)
      if (inputsCopy.size > 0) {
        return refillQueue()
      }
    })
  }

  function refillQueue(): Promise<unknown> {
    const workers = Math.min(opts.concurrency - tasks.size, inputsCopy.size)
    return Promise.all(Array.from({ length: workers }, () => queueNext()))
  }

  await refillQueue()
}

/**
 * Creates a simple throttling mechanism that limits the rate of execution
 *
 * @param fn - Function to throttle
 * @param interval - Minimum interval between executions in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastExecution = 0

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecution

    if (timeSinceLastExecution < interval) {
      await new Promise(resolve => setTimeout(resolve, interval - timeSinceLastExecution))
    }

    lastExecution = Date.now()
    return fn(...args)
  }
}

/**
 * Creates a batching mechanism that collects items and processes them in batches
 *
 * @param processor - Function to process a batch of items
 * @param batchSize - Maximum number of items per batch
 * @param flushInterval - Maximum time to wait before processing a partial batch (in ms)
 */
export function createBatcher<T, R>(
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number,
  flushInterval: number = 1000,
): {
    add: (item: T) => Promise<R>
    flush: () => Promise<void>
    destroy: () => void
  } {
  let batch: Array<{ item: T, resolve: (result: R) => void, reject: (error: Error) => void }> = []
  let flushTimer: NodeJS.Timeout | null = null

  const flush = async (): Promise<void> => {
    if (batch.length === 0)
      return

    const currentBatch = batch
    batch = []

    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }

    try {
      const results = await processor(currentBatch.map(b => b.item))
      currentBatch.forEach((b, index) => {
        b.resolve(results[index])
      })
    }
    catch (error) {
      currentBatch.forEach((b) => {
        b.reject(error instanceof Error ? error : new Error(String(error)))
      })
    }
  }

  const scheduleFlush = (): void => {
    if (flushTimer)
      return

    flushTimer = setTimeout(() => {
      flush()
    }, flushInterval)
  }

  const add = (item: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      batch.push({ item, resolve, reject })

      if (batch.length >= batchSize) {
        flush()
      }
      else {
        scheduleFlush()
      }
    })
  }

  const destroy = (): void => {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    // Reject any pending items
    batch.forEach((b) => {
      b.reject(new Error('Batcher destroyed'))
    })
    batch = []
  }

  return { add, flush, destroy }
}
