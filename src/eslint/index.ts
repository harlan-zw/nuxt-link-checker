import { markdownProcessor } from './processor'
import validRoute from './rules/valid-route'
import validSitemapLink from './rules/valid-sitemap-link'

const plugin = {
  meta: {
    name: 'nuxt-link-checker',
    version: '1.0.0',
  },
  rules: {
    'valid-route': validRoute,
    'valid-sitemap-link': validSitemapLink,
  },
  processors: {
    markdown: markdownProcessor,
  },
}

export default plugin
