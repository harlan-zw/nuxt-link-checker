import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const serverRoutes = [
  'debug.ts',
  'inspect.ts',
  'links.ts',
]

describe('server runtime imports', () => {
  it.each(serverRoutes)('uses the Nitro compatibility alias in %s', (route) => {
    const source = readFileSync(new URL(`../../src/runtime/server/routes/__link-checker__/${route}`, import.meta.url), 'utf8')

    expect(source).not.toMatch(/import \{[^}]*useRuntimeConfig[^}]*\} from '#imports'/)
    expect(source).toMatch(/import \{[^}]*useRuntimeConfig[^}]*\} from '#nuxtseo\/nitro'/)
  })
})
