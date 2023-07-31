import { fixSlashes } from 'site-config-stack'
import { parseURL } from 'ufo'
import { defineRule } from './util'

export default function RuleTrailingSlash() {
  return defineRule({
    test({ report, link, siteConfig }) {
      if (!link.startsWith('/') && !link.startsWith(siteConfig.url!))
        return // ignore external links

      const $url = parseURL(link)
      if ($url.pathname === '/')
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
