import { createRouter, toRouteMatcher } from 'radix3'

/**
 * Checks if a link is non-fetchable (e.g., javascript:, mailto:, etc.)
 *
 * @param link - The link to check
 * @returns True if the link is non-fetchable
 */
export function isNonFetchableLink(link: string): boolean {
  const trimmedLink = link.trim().toLowerCase()
  return trimmedLink.startsWith('javascript:')
    || trimmedLink.startsWith('blob:')
    || trimmedLink.startsWith('data:')
    || trimmedLink.startsWith('mailto:')
    || trimmedLink.startsWith('tel:')
    || trimmedLink.startsWith('vbscript:')
    || trimmedLink.startsWith('#')
}

/**
 * Checks if a URL is an external link (different domain)
 *
 * @param url - The URL to check
 * @param baseUrl - The base URL to compare against
 * @returns True if the URL is external
 */
export function isExternalLink(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url, baseUrl)
    const baseUrlObj = new URL(baseUrl)
    return urlObj.origin !== baseUrlObj.origin
  }
  catch {
    return false
  }
}

/**
 * Checks if a URL is absolute (has protocol and host)
 *
 * @param url - The URL to check
 * @returns True if the URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * Validates an email address using a simple regex
 *
 * @param email - The email to validate
 * @returns True if the email appears valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Checks if a URL path has a valid file extension
 *
 * @param path - The path to check
 * @param validExtensions - Array of valid extensions (without dots)
 * @returns True if the path has a valid extension
 */
export function hasValidFileExtension(path: string, validExtensions: string[]): boolean {
  const extension = path.split('.').pop()?.toLowerCase()
  return extension ? validExtensions.includes(extension) : false
}

/**
 * Validates HTTP status code ranges
 *
 * @param statusCode - The HTTP status code
 * @returns Object with boolean flags for different status types
 */
export function validateHttpStatus(statusCode: number): {
  isSuccess: boolean
  isRedirect: boolean
  isClientError: boolean
  isServerError: boolean
  isError: boolean
} {
  return {
    isSuccess: statusCode >= 200 && statusCode < 300,
    isRedirect: statusCode >= 300 && statusCode < 400,
    isClientError: statusCode >= 400 && statusCode < 500,
    isServerError: statusCode >= 500 && statusCode < 600,
    isError: statusCode >= 400,
  }
}

/**
 * Options for creating a path filter function
 */
export interface CreateFilterOptions {
  include?: (string | RegExp)[]
  exclude?: (string | RegExp)[]
}

/**
 * Creates a filter function based on include/exclude patterns
 *
 * @param options - Filter options with include/exclude patterns
 * @returns Filter function that returns true if path should be included
 */
export function createFilter(options: CreateFilterOptions = {}): (path: string) => boolean {
  const include = options.include || []
  const exclude = options.exclude || []

  if (include.length === 0 && exclude.length === 0) {
    return () => true
  }

  return function (path: string): boolean {
    for (const v of [{ rules: exclude, result: false }, { rules: include, result: true }]) {
      const regexRules = v.rules.filter(r => r instanceof RegExp) as RegExp[]
      if (regexRules.some(r => r.test(path))) {
        return v.result
      }

      const stringRules = v.rules.filter(r => typeof r === 'string') as string[]
      if (stringRules.length > 0) {
        const routes: Record<string, boolean> = {}
        for (const r of stringRules) {
          // Quick scan of literal string matches
          if (r === path) {
            return v.result
          }

          // Need to flip the array data for radix3 format, true value is arbitrary
          routes[r] = true
        }
        const routeRulesMatcher = toRouteMatcher(createRouter({ routes, ...options }))
        if (routeRulesMatcher.matchAll(path).length > 0) {
          return Boolean(v.result)
        }
      }
    }
    return include.length === 0
  }
}

/**
 * Validates a URL string format
 *
 * @param url - The URL string to validate
 * @returns True if the URL format is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * Checks if a string contains only ASCII characters
 *
 * @param str - The string to check
 * @returns True if string contains only ASCII characters
 */
export function isAsciiOnly(str: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str)
}

/**
 * Checks if a string contains uppercase characters
 *
 * @param str - The string to check
 * @returns True if string contains uppercase characters
 */
export function hasUppercaseChars(str: string): boolean {
  return /[A-Z]/.test(str)
}

/**
 * Checks if a string contains whitespace characters
 *
 * @param str - The string to check
 * @returns True if string contains whitespace
 */
export function hasWhitespace(str: string): boolean {
  return /\s/.test(str)
}

/**
 * Checks if a URL path has trailing slash
 *
 * @param path - The URL path to check
 * @returns True if path has trailing slash
 */
export function hasTrailingSlash(path: string): boolean {
  return path.endsWith('/') && path.length > 1
}
