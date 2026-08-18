export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return `${str.substring(0, maxLength - 3)}...`
}

/**
 * Run `cb` over every input, with at most `concurrency` callbacks in flight.
 *
 * Errors from a callback are logged and do not stop the remaining work.
 */
export async function runParallel<T>(
  inputs: Iterable<T>,
  cb: (input: T, index: number) => unknown | Promise<unknown>,
  opts: { concurrency: number },
): Promise<void> {
  const queue = [...inputs]
  if (!queue.length) {
    return
  }
  const workerCount = Math.min(Math.max(opts.concurrency, 1), queue.length)
  let cursor = 0
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < queue.length) {
      const index = cursor++
      try {
        await cb(queue[index]!, index)
      }
      catch (error) {
        console.error(error)
      }
    }
  }))
}
