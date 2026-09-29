import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { $fetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crawlFetch } from '../../src/runtime/shared/crawl'
import { inspect } from '../../src/runtime/shared/inspect'
import RuleNoErrorResponse from '../../src/runtime/shared/inspections/no-error-response'

// the server answers by path, so each case asks for the failure it needs
const server = createServer((req, res) => {
  if (req.url === '/ok') {
    res.writeHead(200).end()
  }
  else if (req.url === '/server-error') {
    res.writeHead(500).end()
  }
  else if (req.url === '/gone') {
    res.writeHead(410).end()
  }
  else if (req.url === '/no-head') {
    res.writeHead(req.method === 'HEAD' ? 405 : 200).end()
  }
  else {
    res.writeHead(404).end()
  }
})

let baseURL = ''
let refusedURL = ''

beforeAll(async () => {
  globalThis.$fetch = $fetch as any
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  // bind and release a port, so nothing listens on it
  const closed = createServer()
  await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', resolve))
  refusedURL = `http://127.0.0.1:${(closed.address() as AddressInfo).port}`
  await new Promise<void>(resolve => closed.close(() => resolve()))
})

afterAll(() => {
  server.close()
})

describe('crawlFetch', () => {
  it('returns 200 for a reachable link', async () => {
    const res = await crawlFetch('/ok', { baseURL })
    expect(res.status).toBe(200)
  })

  it('returns 404 for a missing link', async () => {
    const res = await crawlFetch('/missing', { baseURL })
    expect(res.status).toBe(404)
  })

  it('returns the real status for other HTTP errors', async () => {
    expect((await crawlFetch('/server-error', { baseURL })).status).toBe(500)
    expect((await crawlFetch('/gone', { baseURL })).status).toBe(410)
  })

  it('falls back to GET when the server rejects HEAD', async () => {
    const res = await crawlFetch('/no-head', { baseURL })
    expect(res.status).toBe(200)
  })

  it('reports a network failure as unreachable, not as 404', async () => {
    const res = await crawlFetch('/ok', { baseURL: refusedURL })
    expect(res.status).toBe(0)
    expect(res.statusText).toContain('ECONNREFUSED')
  })
})

describe('crawlFetch on a port fetch refuses to use', () => {
  it('names the cause', async () => {
    // port 9 is on the fetch spec's blocked port list, so undici fails before connecting
    const res = await crawlFetch('/ok', { baseURL: 'http://127.0.0.1:9' })
    expect(res).toMatchObject({ status: 0, statusText: 'bad port' })
  })
})

describe('no-error-response on a network failure', () => {
  it('reports an error that names the failure', async () => {
    const response = await crawlFetch('/ok', { baseURL: refusedURL })
    const result = inspect({ link: '/ok', response }, [RuleNoErrorResponse()])
    expect(result.error).toHaveLength(1)
    expect(result.error![0]!.message).toBe(`Could not reach the link (${response.statusText}).`)
  })
})
