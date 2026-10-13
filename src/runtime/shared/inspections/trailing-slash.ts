import type { Rule } from '../../types'
import { fixSlashes, isPathFile } from 'nuxt-site-config/urls'
import { parseURL } from 'ufo'
import { defineRule } from './util'

export default function RuleTrailingSlash(): Rule {
  return defineRule({
    id: 'trailing-slash',
    test({ report, link, siteConfig, isPublicDirectoryIndex }) {
      const $url = parseURL(link)

      // Ignore fragment-only links
      if ($url.pathname === '' && $url.hash) {
        return
      }

      if ($url.pathname === '/' || isPathFile($url.pathname))
        return

      // a directory index loads its relative assets against the trailing slash, so it keeps one whatever the site config says
      const trailingSlash = isPublicDirectoryIndex?.($url.pathname) || siteConfig.trailingSlash
      const fix = fixSlashes(trailingSlash, link)

      if (!$url.pathname.endsWith('/') && trailingSlash) {
        report({
          name: 'trailing-slash',
          scope: 'warning',
          message: 'Should have a trailing slash.',
          tip: 'Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.',
          fix,
          fixDescription: 'Add trailing slash.',
        })
      }
      else if ($url.pathname.endsWith('/') && !trailingSlash) {
        report({
          name: 'trailing-slash',
          scope: 'warning',
          message: 'Should not have a trailing slash.',
          tip: 'Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.',
          fix,
          fixDescription: 'Removing trailing slash.',
        })
      }
    },
  })
}
