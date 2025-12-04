import { describe, expect, it } from 'vitest'
import { createFilter } from '../../src/runtime/shared/sharedUtils'

describe('excludeLinks', () => {
  it('should exclude links starting with /_', () => {
    const filter = createFilter({
      exclude: [/^\/_.*$/],
    })

    expect(filter('/_nuxt/entry.js')).toBe(false)
    expect(filter('/_data/api.json')).toBe(false)
    expect(filter('/_test')).toBe(false)
    expect(filter('/_')).toBe(false)
  })

  it('should not exclude links not starting with /_', () => {
    const filter = createFilter({
      exclude: [/^\/_.*$/],
    })

    expect(filter('/home')).toBe(true)
    expect(filter('/about')).toBe(true)
    expect(filter('/api/users')).toBe(true)
    expect(filter('/test/_nested')).toBe(true)
  })

  it('should handle wildcards', () => {
    const filter = createFilter({
      exclude: ['/admin/**'],
    })

    expect(filter('/admin')).toBe(false)
    expect(filter('/admin/users')).toBe(false)
    expect(filter('/admin/users/123')).toBe(false)
    expect(filter('/home')).toBe(true)
  })

  it('should handle exact matches', () => {
    const filter = createFilter({
      exclude: ['/ignored'],
    })

    expect(filter('/ignored')).toBe(false)
    expect(filter('/ignored/nested')).toBe(true)
    expect(filter('/not-ignored')).toBe(true)
  })

  it('should handle multiple exclude patterns', () => {
    const filter = createFilter({
      exclude: [
        /^\/_.*$/,
        '/admin/**',
        '/api/*',
      ],
    })

    expect(filter('/_nuxt/entry.js')).toBe(false)
    expect(filter('/admin/dashboard')).toBe(false)
    expect(filter('/api/users')).toBe(false)
    expect(filter('/api/users/123')).toBe(true)
    expect(filter('/home')).toBe(true)
  })

  it('should handle external URLs with regex', () => {
    const filter = createFilter({
      exclude: [/^https:\/\/example\.com/],
    })

    expect(filter('https://example.com')).toBe(false)
    expect(filter('https://example.com/path')).toBe(false)
    expect(filter('https://other.com')).toBe(true)
  })
})
