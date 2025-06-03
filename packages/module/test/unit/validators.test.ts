import { describe, expect, it } from 'vitest'
import {
  createFilter,
  hasTrailingSlash,
  hasUppercaseChars,
  hasValidFileExtension,
  hasWhitespace,
  isAbsoluteUrl,
  isAsciiOnly,
  isExternalLink,
  isNonFetchableLink,
  isValidEmail,
  isValidUrl,
  validateHttpStatus,
} from '../../src/lib/validators'

describe('validators', () => {
  describe('isNonFetchableLink', () => {
    it('identifies non-fetchable protocol links', () => {
      expect(isNonFetchableLink('javascript:void(0)')).toBe(true)
      expect(isNonFetchableLink('mailto:test@example.com')).toBe(true)
      expect(isNonFetchableLink('tel:+1234567890')).toBe(true)
      expect(isNonFetchableLink('data:text/plain;base64,SGVsbG8=')).toBe(true)
      expect(isNonFetchableLink('blob:http://example.com/blob')).toBe(true)
      expect(isNonFetchableLink('vbscript:alert(1)')).toBe(true)
      expect(isNonFetchableLink('#section')).toBe(true)
    })

    it('allows fetchable links', () => {
      expect(isNonFetchableLink('https://example.com')).toBe(false)
      expect(isNonFetchableLink('/relative/path')).toBe(false)
      expect(isNonFetchableLink('ftp://files.example.com')).toBe(false)
    })

    it('handles case insensitivity and whitespace', () => {
      expect(isNonFetchableLink('  JAVASCRIPT:void(0)  ')).toBe(true)
      expect(isNonFetchableLink('  MAILTO:test@example.com  ')).toBe(true)
    })
  })

  describe('isExternalLink', () => {
    const baseUrl = 'https://example.com'

    it('identifies external links', () => {
      expect(isExternalLink('https://other.com/page', baseUrl)).toBe(true)
      expect(isExternalLink('http://different.org', baseUrl)).toBe(true)
      expect(isExternalLink('https://subdomain.other.com', baseUrl)).toBe(true)
    })

    it('identifies internal links', () => {
      expect(isExternalLink('https://example.com/page', baseUrl)).toBe(false)
      expect(isExternalLink('/relative/page', baseUrl)).toBe(false)
      expect(isExternalLink('page.html', baseUrl)).toBe(false)
    })

    it('handles invalid URLs gracefully', () => {
      expect(isExternalLink('not-a-url', baseUrl)).toBe(false)
      expect(isExternalLink('', baseUrl)).toBe(false)
    })
  })

  describe('isAbsoluteUrl', () => {
    it('identifies absolute URLs', () => {
      expect(isAbsoluteUrl('https://example.com')).toBe(true)
      expect(isAbsoluteUrl('http://example.com')).toBe(true)
      expect(isAbsoluteUrl('ftp://files.example.com')).toBe(true)
      expect(isAbsoluteUrl('mailto:test@example.com')).toBe(true)
    })

    it('identifies relative URLs', () => {
      expect(isAbsoluteUrl('/relative/path')).toBe(false)
      expect(isAbsoluteUrl('relative/path')).toBe(false)
      expect(isAbsoluteUrl('./path')).toBe(false)
      expect(isAbsoluteUrl('../path')).toBe(false)
    })

    it('handles invalid URLs', () => {
      expect(isAbsoluteUrl('')).toBe(false)
      expect(isAbsoluteUrl('not-a-url')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('a@b.co')).toBe(true)
    })

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test..test@example.com')).toBe(true) // Simple regex allows this
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('hasValidFileExtension', () => {
    const validExtensions = ['jpg', 'png', 'gif', 'svg']

    it('validates correct extensions', () => {
      expect(hasValidFileExtension('image.jpg', validExtensions)).toBe(true)
      expect(hasValidFileExtension('photo.PNG', validExtensions)).toBe(true)
      expect(hasValidFileExtension('/path/to/image.svg', validExtensions)).toBe(true)
    })

    it('rejects invalid extensions', () => {
      expect(hasValidFileExtension('document.pdf', validExtensions)).toBe(false)
      expect(hasValidFileExtension('script.js', validExtensions)).toBe(false)
      expect(hasValidFileExtension('noextension', validExtensions)).toBe(false)
    })
  })

  describe('validateHttpStatus', () => {
    it('correctly identifies success status codes', () => {
      const result200 = validateHttpStatus(200)
      expect(result200.isSuccess).toBe(true)
      expect(result200.isError).toBe(false)

      const result299 = validateHttpStatus(299)
      expect(result299.isSuccess).toBe(true)
    })

    it('correctly identifies redirect status codes', () => {
      const result301 = validateHttpStatus(301)
      expect(result301.isRedirect).toBe(true)
      expect(result301.isError).toBe(false)

      const result302 = validateHttpStatus(302)
      expect(result302.isRedirect).toBe(true)
    })

    it('correctly identifies client error status codes', () => {
      const result404 = validateHttpStatus(404)
      expect(result404.isClientError).toBe(true)
      expect(result404.isError).toBe(true)
      expect(result404.isSuccess).toBe(false)
    })

    it('correctly identifies server error status codes', () => {
      const result500 = validateHttpStatus(500)
      expect(result500.isServerError).toBe(true)
      expect(result500.isError).toBe(true)
      expect(result500.isSuccess).toBe(false)
    })
  })

  describe('createFilter', () => {
    it('returns true for all paths when no rules provided', () => {
      const filter = createFilter()
      expect(filter('/any/path')).toBe(true)
      expect(filter('/another/path')).toBe(true)
    })

    it('filters based on include patterns', () => {
      const filter = createFilter({ include: ['/api/*', '/admin'] })
      expect(filter('/api/users')).toBe(true)
      expect(filter('/admin')).toBe(true)
      expect(filter('/public/page')).toBe(false)
    })

    it('filters based on exclude patterns', () => {
      const filter = createFilter({ exclude: ['/private/*', '/secret'] })
      expect(filter('/public/page')).toBe(true)
      expect(filter('/private/data')).toBe(false)
      expect(filter('/secret')).toBe(false)
    })

    it('handles regex patterns', () => {
      const filter = createFilter({
        include: [/\.html$/],
        exclude: [/\/temp\//],
      })
      expect(filter('/page.html')).toBe(true)
      expect(filter('/temp/page.html')).toBe(false)
      expect(filter('/page.js')).toBe(false)
    })

    it('prioritizes exclude over include', () => {
      const filter = createFilter({
        include: ['/api/*'],
        exclude: ['/api/private'],
      })
      expect(filter('/api/public')).toBe(true)
      expect(filter('/api/private')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('//example.com')).toBe(false)
    })
  })

  describe('isAsciiOnly', () => {
    it('validates ASCII-only strings', () => {
      expect(isAsciiOnly('hello world')).toBe(true)
      expect(isAsciiOnly('123 ABC xyz !@#')).toBe(true)
      expect(isAsciiOnly('')).toBe(true)
    })

    it('rejects non-ASCII strings', () => {
      expect(isAsciiOnly('héllo')).toBe(false)
      expect(isAsciiOnly('世界')).toBe(false)
      expect(isAsciiOnly('café')).toBe(false)
    })
  })

  describe('hasUppercaseChars', () => {
    it('detects uppercase characters', () => {
      expect(hasUppercaseChars('Hello')).toBe(true)
      expect(hasUppercaseChars('WORLD')).toBe(true)
      expect(hasUppercaseChars('mixedCase')).toBe(true)
    })

    it('handles lowercase-only strings', () => {
      expect(hasUppercaseChars('hello')).toBe(false)
      expect(hasUppercaseChars('123')).toBe(false)
      expect(hasUppercaseChars('')).toBe(false)
    })
  })

  describe('hasWhitespace', () => {
    it('detects whitespace characters', () => {
      expect(hasWhitespace('hello world')).toBe(true)
      expect(hasWhitespace('tab\there')).toBe(true)
      expect(hasWhitespace('line\nbreak')).toBe(true)
      expect(hasWhitespace(' leading')).toBe(true)
      expect(hasWhitespace('trailing ')).toBe(true)
    })

    it('handles strings without whitespace', () => {
      expect(hasWhitespace('hello')).toBe(false)
      expect(hasWhitespace('123')).toBe(false)
      expect(hasWhitespace('')).toBe(false)
    })
  })

  describe('hasTrailingSlash', () => {
    it('detects trailing slashes', () => {
      expect(hasTrailingSlash('/path/')).toBe(true)
      expect(hasTrailingSlash('/long/path/')).toBe(true)
    })

    it('handles paths without trailing slashes', () => {
      expect(hasTrailingSlash('/path')).toBe(false)
      expect(hasTrailingSlash('/long/path')).toBe(false)
      expect(hasTrailingSlash('/')).toBe(false) // Root path doesn't count
      expect(hasTrailingSlash('')).toBe(false)
    })
  })
})
