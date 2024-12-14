import { fixSlashes } from 'nuxt-site-config/urls'
import { parseURL } from 'ufo'
import { defineRule } from './util'

export default function RuleTrailingSlash() {
  return defineRule({
    id: 'trailing-slash',
    test({ report, link, siteConfig }) {
      const $url = parseURL(link)

      // Ignore fragment-only links
      if($url.pathname.startsWith('#') {
        return
      }
      
      // its a file when the last segment has a dot in it
      const isFile = $url.pathname.split('/').pop()!.includes('.')
      if ($url.pathname === '/' || isFile)
        return

      const fix = fixSlashes(siteConfig.trailingSlash, link)

      if (!$url.pathname.endsWith('/') && siteConfig.trailingSlash) {
        report({
          name: 'trailing-slash',
          scope: 'warning',
          message: 'Should have a trailing slash.',
          tip: 'Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.',
          fix,
          fixDescription: 'Add trailing slash.',
        })
      }
      else if ($url.pathname.endsWith('/') && !siteConfig.trailingSlash) {
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
