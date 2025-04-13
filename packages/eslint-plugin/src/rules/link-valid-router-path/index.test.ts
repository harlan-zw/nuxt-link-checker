import htmlParser from '@html-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import * as vueParser from 'vue-eslint-parser'
import rule from './index'

// Configure RuleTester with flat config style
const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

const htmlRuleTester = new RuleTester({
  languageOptions: {
    parser: htmlParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

// Mock route data
const validRoutes = [
  { path: '/home', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/products', name: 'products' },
  { path: '/products/1', name: 'product-1' },
  { path: '/contact', name: 'contact' },
]

// Create a serializable mock matcher class instead of a function
class MockRouteMatcher {
  private validRoutes = validRoutes.map(route => route.path)

  getRoutes() {
    return validRoutes.map(route => ({
      record: { path: route.path, name: route.name },
    }))
  }

  resolve({ path }: { path: string }) {
    const matched = this.validRoutes.includes(path)
      ? [{ path }]
      : []

    return {
      matched,
      path,
      meta: {},
      params: {},
      name: undefined,
    }
  }
}

// Mock Fuse search class
class MockFuseSearch {
  search(query: string) {
    // Simulate close matches
    if (query === '/hom') {
      return [{ item: { path: '/home', name: 'home' } }]
    }
    if (query === '/abot') {
      return [{ item: { path: '/about', name: 'about' } }]
    }
    // No matches
    return []
  }
}

// Create instances of the mocks
const mockMatcher = new MockRouteMatcher()
const mockSearch = new MockFuseSearch()

describe('link-valid-router-path', () => {
  it('vue validates successfully', () => {
    ruleTester.run('link-valid-router-path', rule, {
      valid: [
        // Using shared state matcher
        {
          code: '<template><NuxtLink to="/home">Home</NuxtLink></template>',
          options: [{ matcherKey: 'testRouteMatcher' }],
          settings: { routeMatcher: mockMatcher },
        },

        // Valid NuxtLink with to prop matching a route
        {
          code: '<template><NuxtLink to="/products/1">Product</NuxtLink></template>',
          settings: { routeMatcher: mockMatcher },
        },

        // Valid RouterLink with to prop matching a route
        {
          code: '<template><RouterLink to="/about">About</RouterLink></template>',
          settings: { routeMatcher: mockMatcher },
        },

        // Valid <a> tag with href matching a route
        {
          code: '<template><a href="/contact">Contact Us</a></template>',
          settings: { routeMatcher: mockMatcher },
        },

        // External links, anchors, and special links should be ignored
        {
          code: '<template><a href="https://example.com">External Link</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a href="#section">Anchor Link</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a href="mailto:info@example.com">Email us</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a href="tel:+1234567890">Call us</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a href="/">Root path</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a href="">Empty path</a></template>',
          settings: { routeMatcher: mockMatcher },
        },

        // Dynamic bindings should be ignored
        {
          code: '<template><NuxtLink :to="dynamicPath">Dynamic Link</NuxtLink></template>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<template><a :href="dynamicPath">Dynamic Link</a></template>',
          settings: { routeMatcher: mockMatcher },
        },
      ],
      invalid: [
        // Using shared state matcher
        {
          code: '<template><NuxtLink to="/nonexistent">Invalid Path</NuxtLink></template>',
          settings: { routeMatcher: mockMatcher },
          errors: [{ message: 'Invalid router path: \'/nonexistent\' does not match any registered route' }],
        },

        // Invalid RouterLink with to prop not matching any route
        {
          code: '<template><RouterLink to="/missing-page">Invalid Path</RouterLink></template>',
          settings: { routeMatcher: mockMatcher },
          errors: [{ message: 'Invalid router path: \'/missing-page\' does not match any registered route' }],
        },

        // Invalid <a> tag with href not matching any route
        {
          code: '<template><a href="/not-found">Invalid Path</a></template>',
          settings: { routeMatcher: mockMatcher },
          errors: [{ message: 'Invalid router path: \'/not-found\' does not match any registered route' }],
        },

        // Test suggestion functionality with Fuse.js
        {
          code: '<template><NuxtLink to="/hom">Home</NuxtLink></template>',
          settings: { routeMatcher: mockMatcher, pageSearch: mockSearch },
          errors: [{
            message: 'Invalid router path: \'/hom\' does not match any registered route',
            suggestions: [
              {
                desc: 'Change to \'/home\'',
                output: '<template><NuxtLink to="/home">Home</NuxtLink></template>',
              },
            ],
          }],
        },

        // Another test with suggestions
        {
          code: '<template><a href="/abot">About</a></template>',
          settings: { routeMatcher: mockMatcher, pageSearch: mockSearch },
          errors: [{
            message: 'Invalid router path: \'/abot\' does not match any registered route',
            suggestions: [
              {
                desc: 'Change to \'/about\'',
                output: '<template><a href="/about">About</a></template>',
              },
            ],
          }],
        },
      ],
    })
  })

  it('html validates successfully', () => {
    htmlRuleTester.run('link-valid-router-path', rule, {
      valid: [
        // Valid <a> tag with href matching a route
        {
          code: '<a href="/contact">Contact Us</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="/home">Home</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="/about">About</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="/products/1">Product</a>',
          settings: { routeMatcher: mockMatcher },
        },

        // External links, anchors, and special links should be ignored
        {
          code: '<a href="https://example.com">External Link</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="#section">Anchor Link</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="mailto:info@example.com">Email us</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="tel:+1234567890">Call us</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="/">Root path</a>',
          settings: { routeMatcher: mockMatcher },
        },
        {
          code: '<a href="">Empty path</a>',
          settings: { routeMatcher: mockMatcher },
        },
      ],
      invalid: [
        // Invalid <a> tag with href not matching any route
        {
          code: '<a href="/not-found">Invalid Path</a>',
          settings: { routeMatcher: mockMatcher },
          errors: [{ message: 'Invalid router path: \'/not-found\' does not match any registered route' }],
        },
        {
          code: '<a href="/missing-page">Invalid Path</a>',
          settings: { routeMatcher: mockMatcher },
          errors: [{ message: 'Invalid router path: \'/missing-page\' does not match any registered route' }],
        },

        // Test suggestion functionality with Fuse.js
        {
          code: '<a href="/abot">About</a>',
          settings: { routeMatcher: mockMatcher, pageSearch: mockSearch },
          errors: [{
            message: 'Invalid router path: \'/abot\' does not match any registered route',
            suggestions: [
              {
                desc: 'Change to \'/about\'',
                output: '<a href="/about">About</a>',
              },
            ],
          }],
        },
        {
          code: '<a href="/hom">Home</a>',
          settings: { routeMatcher: mockMatcher, pageSearch: mockSearch },
          errors: [{
            message: 'Invalid router path: \'/hom\' does not match any registered route',
            suggestions: [
              {
                desc: 'Change to \'/home\'',
                output: '<a href="/home">Home</a>',
              },
            ],
          }],
        },
      ],
    })
  })
})
