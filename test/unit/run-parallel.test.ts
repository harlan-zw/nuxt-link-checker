import { describe, expect, it } from 'vitest'
import { runParallel } from '../../src/build/util'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('runParallel', () => {
  it('runs up to `concurrency` callbacks at once', async () => {
    const inputs = Array.from({ length: 20 }, (_, i) => ({ i }))
    let inFlight = 0
    let maxInFlight = 0

    await runParallel(inputs, async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await Promise.resolve()
      inFlight--
    }, { concurrency: 5 })

    expect(maxInFlight).toBe(5)
  })

  it('does not wait for a slow input before starting the next one', async () => {
    const slow = deferred()
    const seen: number[] = []

    const run = runParallel([0, 1, 2], async (input) => {
      seen.push(input)
      if (input === 0) {
        await slow.promise
      }
    }, { concurrency: 3 })

    await Promise.resolve()
    expect(seen).toEqual([0, 1, 2])
    slow.resolve()
    await run
  })

  it('visits every input once, including falsy ones, with its index', async () => {
    const inputs = ['', 0, false, null, undefined, 'a']
    const seen: [unknown, number][] = []

    await runParallel(inputs, (input, index) => {
      seen.push([input, index])
    }, { concurrency: 2 })

    expect(seen.sort((a, b) => a[1] - b[1])).toEqual([
      ['', 0],
      [0, 1],
      [false, 2],
      [null, 3],
      [undefined, 4],
      ['a', 5],
    ])
  })

  it('keeps going when a callback throws', async () => {
    const done: number[] = []

    await runParallel([1, 2, 3], async (input) => {
      if (input === 2) {
        throw new Error('boom')
      }
      done.push(input)
    }, { concurrency: 1 })

    expect(done).toEqual([1, 3])
  })
})
